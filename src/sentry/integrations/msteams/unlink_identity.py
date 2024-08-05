from collections.abc import Mapping
from typing import Any

from django.urls import reverse

from sentry.integrations.messaging import UnlinkIdentityView
from sentry.integrations.msteams import MsTeamsLinkingView
from sentry.models.integrations import Integration
from sentry.utils.http import absolute_uri
from sentry.utils.signing import sign

from .card_builder.identity import build_unlinked_card
from .utils import get_preinstall_client


def build_unlinking_url(conversation_id, service_url, teams_user_id):
    signed_params = sign(
        conversation_id=conversation_id,
        service_url=service_url,
        teams_user_id=teams_user_id,
    )

    return absolute_uri(
        reverse(
            "sentry-integration-msteams-unlink-identity", kwargs={"signed_params": signed_params}
        )
    )


class MsTeamsUnlinkIdentityView(MsTeamsLinkingView, UnlinkIdentityView):
    @property
    def confirmation_template(self) -> str:
        return "sentry/integrations/msteams/unlink-identity.html"

    @property
    def success_template(self) -> str:
        return "sentry/integrations/msteams/unlinked.html"

    @property
    def no_identity_template(self) -> str | None:
        return "sentry/integrations/msteams/no-identity.html"

    @property
    def filter_by_user_id(self) -> bool:
        return True

    def notify_on_success(self, integration: Integration | None, params: Mapping[str, Any]) -> None:
        client = get_preinstall_client(params["service_url"])
        card = build_unlinked_card()
        client.send_card(params["conversation_id"], card)
