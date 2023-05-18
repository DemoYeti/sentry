import time
from enum import Enum
from typing import Optional, Sequence, Tuple
from unittest.mock import patch

import pytest

from sentry.ratelimits.cardinality import (
    CardinalityLimiter,
    GrantedQuota,
    Quota,
    RequestedQuota,
    Timestamp,
)
from sentry.sentry_metrics.configuration import UseCaseKey
from sentry.sentry_metrics.consumers.indexer.batch import PartitionIdxOffset
from sentry.sentry_metrics.indexer.limiters.cardinality import TimeseriesCardinalityLimiter
from sentry.sentry_metrics.use_case_id_registry import UseCaseID
from sentry.testutils.helpers.options import override_options


class MockUseCaseID(Enum):
    SESSIONS = "sessions"
    TRANSACTIONS = "transactions"
    USE_CASE_1 = "uc_1"
    USE_CASE_2 = "uc_2"


MOCK_METRIC_PATH_MAPPING = {
    MockUseCaseID.TRANSACTIONS: UseCaseKey.PERFORMANCE,
    MockUseCaseID.USE_CASE_1: UseCaseKey.PERFORMANCE,
    MockUseCaseID.USE_CASE_2: UseCaseKey.PERFORMANCE,
}

MOCK_USE_CASE_ID_CARDINALITY_LIMIT_QUOTA_OPTIONS = {
    MockUseCaseID.TRANSACTIONS: "sentry-metrics.cardinality-limiter.limits.transactions.per-org",
    MockUseCaseID.USE_CASE_1: "sentry-metrics.cardinality-limiter.limits.uc_1.per-org",
    MockUseCaseID.USE_CASE_2: "sentry-metrics.cardinality-limiter.limits.uc_2.per-org",
}


@pytest.fixture(autouse=True)
def rollout_all_orgs_generic_metrics(set_sentry_option):
    with set_sentry_option("sentry-metrics.cardinality-limiter.orgs-rollout-rate", 1.0):
        yield


class MockCardinalityLimiter(CardinalityLimiter):
    def __init__(self):
        self.grant_hashes = 10
        self.assert_quota: Optional[Quota] = None
        self.assert_requests: Optional[Sequence[RequestedQuota]] = None

    def check_within_quotas(
        self, requests: Sequence[RequestedQuota], timestamp: Optional[Timestamp] = None
    ) -> Tuple[Timestamp, Sequence[GrantedQuota]]:
        if timestamp is None:
            timestamp = int(time.time())
        else:
            timestamp = int(timestamp)

        if self.assert_requests is not None:
            assert requests == self.assert_requests

        grants = []
        granted = 0
        for request in requests:
            assert request.quota == self.assert_quota
            granted_hashes = set()
            for hash in request.unit_hashes:
                if granted < self.grant_hashes:
                    granted += 1
                    granted_hashes.add(hash)

            # reached_quotas is incorrect, but we don't necessarily need it for testing
            grants.append(
                GrantedQuota(
                    request=request, granted_unit_hashes=granted_hashes, reached_quota=None
                )
            )

        return timestamp, grants

    def use_quotas(
        self,
        grants: Sequence[GrantedQuota],
        timestamp: Timestamp,
    ) -> None:
        pass


@patch("sentry.sentry_metrics.indexer.limiters.cardinality.UseCaseID", MockUseCaseID)
@patch(
    "sentry.sentry_metrics.indexer.limiters.cardinality.USE_CASE_ID_CARDINALITY_LIMIT_QUOTA_OPTIONS",
    MOCK_USE_CASE_ID_CARDINALITY_LIMIT_QUOTA_OPTIONS,
)
def test_reject_all():
    with override_options(
        {
            "sentry-metrics.cardinality-limiter.limits.transactions.per-org": [
                {"window_seconds": 3600, "granularity_seconds": 60, "limit": 0}
            ],
            "sentry-metrics.cardinality-limiter.limits.uc_1.per-org": [
                {"window_seconds": 3600, "granularity_seconds": 60, "limit": 0}
            ],
            "sentry-metrics.cardinality-limiter.limits.uc_2.per-org": [
                {"window_seconds": 3600, "granularity_seconds": 60, "limit": 0}
            ],
            "sentry-metrics.cardinality-limiter.limits.generic-metrics.per-org": [
                {"window_seconds": 3600, "granularity_seconds": 60, "limit": 0}
            ],
        },
    ):
        backend = MockCardinalityLimiter()
        backend.assert_quota = Quota(window_seconds=3600, granularity_seconds=60, limit=0)
        backend.grant_hashes = 0
        limiter = TimeseriesCardinalityLimiter("", backend)

        result = limiter.check_cardinality_limits(
            UseCaseKey.PERFORMANCE,
            {
                PartitionIdxOffset(0, 0): {
                    "org_id": 1,
                    "name": "foo",
                    "tags": {},
                    "use_case_id": MockUseCaseID.TRANSACTIONS,
                },
                PartitionIdxOffset(0, 1): {
                    "org_id": 1,
                    "name": "bar",
                    "tags": {},
                    "use_case_id": MockUseCaseID.USE_CASE_1,
                },
            },
        )

        assert result.keys_to_remove == [PartitionIdxOffset(0, 0), PartitionIdxOffset(0, 1)]


def test_reject_partial(set_sentry_option):
    with set_sentry_option(
        "sentry-metrics.cardinality-limiter.limits.releasehealth.per-org",
        [{"window_seconds": 3600, "granularity_seconds": 60, "limit": 1}],
    ):
        backend = MockCardinalityLimiter()
        backend.assert_quota = Quota(window_seconds=3600, granularity_seconds=60, limit=1)
        backend.grant_hashes = 1
        limiter = TimeseriesCardinalityLimiter("", backend)

        result = limiter.check_cardinality_limits(
            UseCaseKey.RELEASE_HEALTH,
            {
                PartitionIdxOffset(0, 0): {
                    "org_id": 1,
                    "name": "foo",
                    "tags": {},
                    "use_case_id": UseCaseID.SESSIONS,
                },
                PartitionIdxOffset(0, 1): {
                    "org_id": 1,
                    "name": "bar",
                    "tags": {},
                    "use_case_id": UseCaseID.SESSIONS,
                },
                PartitionIdxOffset(0, 2): {
                    "org_id": 1,
                    "name": "baz",
                    "tags": {},
                    "use_case_id": UseCaseID.SESSIONS,
                },
            },
        )

        assert result.keys_to_remove == [PartitionIdxOffset(0, 1), PartitionIdxOffset(0, 2)]


def test_accept_all(set_sentry_option):
    with set_sentry_option("sentry-metrics.cardinality-limiter.limits.releasehealth.per-org", []):
        backend = MockCardinalityLimiter()
        backend.grant_hashes = 1000
        limiter = TimeseriesCardinalityLimiter("", backend)

        result = limiter.check_cardinality_limits(
            UseCaseKey.RELEASE_HEALTH,
            {
                PartitionIdxOffset(0, 0): {
                    "org_id": 1,
                    "name": "foo",
                    "tags": {},
                    "use_case_id": UseCaseID.SESSIONS,
                },
                PartitionIdxOffset(0, 1): {
                    "org_id": 1,
                    "name": "bar",
                    "tags": {},
                    "use_case_id": UseCaseID.SESSIONS,
                },
                PartitionIdxOffset(0, 2): {
                    "org_id": 1,
                    "name": "baz",
                    "tags": {},
                    "use_case_id": UseCaseID.SESSIONS,
                },
            },
        )

        assert not result.keys_to_remove


def test_sample_rate_zero(set_sentry_option):
    """
    Assert that with a rollout rate of zero, no quotas are applied.
    """

    with set_sentry_option(
        "sentry-metrics.cardinality-limiter.limits.releasehealth.per-org",
        [{"window_seconds": 3600, "granularity_seconds": 60, "limit": 0}],
    ), set_sentry_option("sentry-metrics.cardinality-limiter-rh.orgs-rollout-rate", 0.0):
        backend = MockCardinalityLimiter()
        backend.grant_hashes = 0
        backend.assert_requests = []
        limiter = TimeseriesCardinalityLimiter("", backend)

        result = limiter.check_cardinality_limits(
            UseCaseKey.RELEASE_HEALTH,
            {
                PartitionIdxOffset(0, 0): {
                    "org_id": 1,
                    "name": "foo",
                    "tags": {},
                    "use_case_id": UseCaseID.SESSIONS,
                },
                PartitionIdxOffset(0, 1): {
                    "org_id": 1,
                    "name": "bar",
                    "tags": {},
                    "use_case_id": UseCaseID.SESSIONS,
                },
                PartitionIdxOffset(0, 2): {
                    "org_id": 1,
                    "name": "baz",
                    "tags": {},
                    "use_case_id": UseCaseID.SESSIONS,
                },
            },
        )

        assert not result.keys_to_remove
        # Assert that we are not just passing the rate limiter, but also do not
        # check any quotas. If there are no quotas, there are no requests, and
        # therefore no grants.
        #
        # Right now we do call the limiter with an empty list of requests. If
        # we didn't, `_grants` would be `None` instead of `[]`. Either behavior
        # would be fine, in neither case we are hitting redis.
        assert result._grants is None


def test_sample_rate_half(set_sentry_option):
    with set_sentry_option(
        "sentry-metrics.cardinality-limiter.limits.releasehealth.per-org",
        [{"window_seconds": 3600, "granularity_seconds": 60, "limit": 0}],
    ), set_sentry_option("sentry-metrics.cardinality-limiter-rh.orgs-rollout-rate", 0.5):

        backend = MockCardinalityLimiter()
        backend.grant_hashes = 0
        backend.assert_quota = Quota(window_seconds=3600, granularity_seconds=60, limit=0)
        limiter = TimeseriesCardinalityLimiter("", backend)

        result = limiter.check_cardinality_limits(
            UseCaseKey.RELEASE_HEALTH,
            {
                PartitionIdxOffset(0, 0): {
                    "org_id": 1,
                    "name": "foo",
                    "tags": {},
                    "use_case_id": UseCaseID.SESSIONS,
                },
                PartitionIdxOffset(0, 1): {
                    "org_id": 99,
                    "name": "bar",
                    "tags": {},
                    "use_case_id": UseCaseID.SESSIONS,
                },
            },
        )

        # We are sampling org_id=1 into cardinality limiting. Because our quota is
        # zero, only that org's metrics are dropped.
        assert result.keys_to_remove == [PartitionIdxOffset(0, 0)]
