from abc import ABC
from collections.abc import Mapping
from typing import Any

from django.urls import reverse

from sentry.integrations.messaging import LinkIdentityView, LinkingView, MessagingIntegrationSpec
from sentry.models.integrations import Integration
from sentry.models.organization import Organization
from sentry.utils.http import absolute_uri
from sentry.utils.signing import sign

from ..types import ExternalProviders
from .card_builder.identity import build_linked_card
from .client import MsTeamsClient


def build_linking_url(
    integration: Integration,
    organization: Organization,
    teams_user_id: str,
    team_id: str,
    tenant_id: str,
) -> str:
    from sentry.integrations.msteams.constants import SALT

    signed_params = sign(
        salt=SALT,
        integration_id=integration.id,
        organization_id=organization.id,
        teams_user_id=teams_user_id,
        team_id=team_id,
        tenant_id=tenant_id,
    )

    return absolute_uri(
        reverse("sentry-integration-msteams-link-identity", kwargs={"signed_params": signed_params})
    )


class MsTeamsLinkingView(LinkingView, ABC):
    @property
    def parent_messaging_spec(self) -> MessagingIntegrationSpec:
        from sentry.integrations.msteams.spec import MsTeamsMessagingSpec

        return MsTeamsMessagingSpec()

    @property
    def provider(self) -> ExternalProviders:
        return ExternalProviders.MSTEAMS

    @property
    def salt(self) -> str:
        from .constants import SALT

        return SALT

    @property
    def user_parameter(self) -> str:
        return "teams_user_id"

    @property
    def expired_link_template(self) -> str:
        return "sentry/integrations/msteams/expired-link.html"


class MsTeamsLinkIdentityView(MsTeamsLinkingView, LinkIdentityView):
    @property
    def success_template(self) -> str:
        return "sentry/integrations/msteams/linked.html"

    def notify_on_success(self, integration: Integration | None, params: Mapping[str, Any]) -> None:
        if integration is None:
            raise ValueError(
                'Integration is required for linking (params must include "integration_id")'
            )
        card = build_linked_card()
        client = MsTeamsClient(integration)
        user_conversation_id = client.get_user_conversation_id(
            params["teams_user_id"], params["tenant_id"]
        )
        client.send_card(user_conversation_id, card)
