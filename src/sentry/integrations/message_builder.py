from __future__ import annotations

from collections.abc import Callable, Iterable, Mapping, Sequence
from typing import Any

from sentry import features
from sentry.eventstore.models import Event, GroupEvent
from sentry.integrations.slack.message_builder import LEVEL_TO_COLOR, SLACK_URL_FORMAT
from sentry.integrations.types import EXTERNAL_PROVIDERS, ExternalProviders
from sentry.issues.grouptype import GroupCategory
from sentry.models.environment import Environment
from sentry.models.group import Group
from sentry.models.project import Project
from sentry.models.rule import Rule
from sentry.models.team import Team
from sentry.notifications.notifications.base import BaseNotification
from sentry.notifications.notifications.rules import AlertRuleNotification
from sentry.users.services.user import RpcUser
from sentry.utils.http import absolute_uri


def format_actor_options(
    actors: Iterable[Team | RpcUser], is_slack: bool = False
) -> Sequence[Mapping[str, str]]:
    sort_func: Callable[[Mapping[str, str]], Any] = lambda actor: actor["text"]
    if is_slack:
        sort_func = lambda actor: actor["text"]["text"]
    return sorted((format_actor_option(actor, is_slack) for actor in actors), key=sort_func)


def format_actor_option(actor: Team | RpcUser, is_slack: bool = False) -> Mapping[str, str]:
    if isinstance(actor, RpcUser):
        if is_slack:
            return {
                "text": {
                    "type": "plain_text",
                    "text": actor.get_display_name(),
                },
                "value": f"user:{actor.id}",
            }

        return {"text": actor.get_display_name(), "value": f"user:{actor.id}"}
    elif isinstance(actor, Team):
        if is_slack:
            return {
                "text": {
                    "type": "plain_text",
                    "text": f"#{actor.slug}",
                },
                "value": f"team:{actor.id}",
            }
        return {"text": f"#{actor.slug}", "value": f"team:{actor.id}"}


def build_attachment_title(obj: Group | Event | GroupEvent) -> str:
    ev_metadata = obj.get_event_metadata()
    ev_type = obj.get_event_type()
    title = obj.title

    if ev_type == "error" and "type" in ev_metadata:
        title = ev_metadata["type"]

    elif ev_type == "csp":
        title = f'{ev_metadata["directive"]} - {ev_metadata["uri"]}'

    else:
        group = getattr(obj, "group", obj)
        if isinstance(obj, GroupEvent):
            if obj.occurrence is not None:
                title = obj.occurrence.issue_title
        else:
            event = group.get_latest_event()
            if event is not None and event.occurrence is not None:
                title = event.occurrence.issue_title

    return title


def get_title_link(
    group: Group,
    event: Event | GroupEvent | None,
    link_to_event: bool,
    issue_details: bool,
    notification: BaseNotification | None,
    provider: ExternalProviders = ExternalProviders.SLACK,
    rule_id: int | None = None,
    notification_uuid: str | None = None,
) -> str:
    other_params = {}
    # add in rule id if we have it
    if rule_id:
        try:
            rule = Rule.objects.get(id=rule_id)
        except Rule.DoesNotExist:
            rule_env = None
        else:
            rule_env = rule.environment_id
        try:
            env = Environment.objects.get(id=rule_env)
        except Environment.DoesNotExist:
            pass
        else:
            other_params["environment"] = env.name

        other_params["alert_rule_id"] = rule_id
        # hard code for issue alerts
        other_params["alert_type"] = "issue"

    if event and link_to_event:
        url = group.get_absolute_url(
            params={"referrer": EXTERNAL_PROVIDERS[provider], **other_params},
            event_id=event.event_id,
        )

    elif issue_details and notification:
        referrer = notification.get_referrer(provider)
        notification_uuid = notification.notification_uuid
        url = group.get_absolute_url(
            params={"referrer": referrer, "notification_uuid": notification_uuid, **other_params}
        )
    elif notification_uuid:
        url = group.get_absolute_url(
            params={
                "referrer": EXTERNAL_PROVIDERS[provider],
                "notification_uuid": notification_uuid,
                **other_params,
            }
        )
    else:
        url = group.get_absolute_url(
            params={"referrer": EXTERNAL_PROVIDERS[provider], **other_params}
        )

    return url


def build_attachment_text(group: Group, event: Event | GroupEvent | None = None) -> Any | None:
    # Group and Event both implement get_event_{type,metadata}
    obj = event if event is not None else group
    ev_metadata = obj.get_event_metadata()
    ev_type = obj.get_event_type()

    if not event:
        event = group.get_latest_event()

    if event and getattr(event, "occurrence", None) is not None:
        important = event.occurrence.important_evidence_display
        if important:
            return important.value
    elif ev_type == "error":
        return ev_metadata.get("value") or ev_metadata.get("function")

    return None


def build_attachment_replay_link(
    group: Group, event: Event | GroupEvent | None = None, url_format: str = SLACK_URL_FORMAT
) -> str | None:
    has_replay = features.has("organizations:session-replay", group.organization)
    has_slack_links = features.has(
        "organizations:session-replay-slack-new-issue", group.organization
    )
    if has_replay and has_slack_links and group.has_replays():
        referrer = EXTERNAL_PROVIDERS[ExternalProviders.SLACK]
        replay_url = f"{group.get_absolute_url()}replays/?referrer={referrer}"

        return f"{url_format.format(text='View Replays', url=absolute_uri(replay_url))}"

    return None


def build_rule_url(rule: Any, group: Group, project: Project) -> str:
    org_slug = group.organization.slug
    project_slug = project.slug
    rule_url = f"/organizations/{org_slug}/alerts/rules/{project_slug}/{rule.id}/details/"

    return absolute_uri(rule_url)


def build_footer(
    group: Group,
    project: Project,
    rules: Sequence[Rule] | None = None,
    url_format: str = SLACK_URL_FORMAT,
) -> str:
    footer = f"{group.qualified_short_id}"
    if rules:
        rule_url = build_rule_url(rules[0], group, project)
        # If this notification is triggered via the "Send Test Notification"
        # button then the label is not defined, but the url works.
        text = rules[0].label if rules[0].label else "Test Alert"
        footer += f" via {url_format.format(text=text, url=rule_url)}"

        if url_format == SLACK_URL_FORMAT:
            footer = url_format.format(text=text, url=rule_url)

        if len(rules) > 1:
            footer += f" (+{len(rules) - 1} other)"

    return footer


def get_timestamp(group: Group, event: GroupEvent | None) -> float:
    ts = group.last_seen
    return (max(ts, event.datetime) if event else ts).timestamp()


def get_color(
    event_for_tags: GroupEvent | None, notification: BaseNotification | None, group: Group
) -> str:
    if notification:
        if not isinstance(notification, AlertRuleNotification):
            return "info"
    if event_for_tags:
        color: str | None = event_for_tags.get_tag("level")
        if (
            hasattr(event_for_tags, "occurrence")
            and event_for_tags.occurrence is not None
            and event_for_tags.occurrence.level is not None
        ):
            color = event_for_tags.occurrence.level
        if color and color in LEVEL_TO_COLOR.keys():
            return color
    if group.issue_category == GroupCategory.PERFORMANCE:
        # XXX(CEO): this shouldn't be needed long term, but due to a race condition
        # the group's latest event is not found and we end up with no event_for_tags here for perf issues
        return "info"

    return "error"
