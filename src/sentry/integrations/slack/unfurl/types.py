from __future__ import annotations

import enum
from collections.abc import Callable, Mapping
from re import Pattern
from typing import Any, NamedTuple, Optional, Protocol, cast

from django.http.request import HttpRequest

from sentry.integrations.models.integration import Integration
from sentry.models.user import User

UnfurledUrl = Mapping[Any, Any]
ArgsMapper = Callable[[str, Mapping[str, Optional[str]]], Mapping[str, Any]]


class LinkType(enum.Enum):
    ISSUES = "issues"
    METRIC_ALERT = "metric_alert"
    DISCOVER = "discover"


class UnfurlableUrl(NamedTuple):
    url: str
    args: Mapping[str, Any]


class HandlerCallable(Protocol):
    def __call__(
        self,
        request: HttpRequest,
        integration: Integration,
        links: list[UnfurlableUrl],
        user: User | None = None,
    ) -> UnfurledUrl:
        ...


class Handler(NamedTuple):
    matcher: list[Pattern[Any]]
    arg_mapper: ArgsMapper
    fn: HandlerCallable


def make_type_coercer(type_map: Mapping[str, type]) -> ArgsMapper:
    """
    Given a mapping of argument names to types, construct a function that will
    coerce given arguments into those types.
    """

    def type_coercer(url: str, args: Mapping[str, str | None]) -> Mapping[str, Any]:
        return {k: type_map[k](v) if v is not None else None for k, v in args.items()}

    return type_coercer


from sentry.integrations.slack.unfurl.discover import discover_handler
from sentry.integrations.slack.unfurl.issues import issues_handler
from sentry.integrations.slack.unfurl.metric_alerts import metric_alert_handler

link_handlers: dict[LinkType, Handler] = {
    LinkType.DISCOVER: cast(Handler, discover_handler),
    LinkType.METRIC_ALERT: cast(Handler, metric_alert_handler),
    LinkType.ISSUES: cast(Handler, issues_handler),
}


def match_link(link: str) -> tuple[LinkType | None, Mapping[str, Any] | None]:
    for link_type, handler in link_handlers.items():
        match = next(filter(bool, map(lambda matcher: matcher.match(link), handler.matcher)), None)

        if not match:
            continue

        args = handler.arg_mapper(link, match.groupdict())
        return link_type, args
    return None, None
