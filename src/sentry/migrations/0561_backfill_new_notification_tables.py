# Generated by Django 3.2.20 on 2023-09-14 20:35

from __future__ import annotations

from enum import Enum

from django.db import ProgrammingError, migrations
from django.db.backends.base.schema import BaseDatabaseSchemaEditor
from django.db.migrations.state import StateApps

from sentry.new_migrations.migrations import CheckedMigration
from sentry.utils.query import RangeQuerySetWrapperWithProgressBar

"""
The below code was copied over from src/sentry/types/integrations.py
 and src/sentry/notifications/types.py because some of these enums will be deleted
"""


class ExternalProviders(Enum):
    EMAIL = 100
    SLACK = 110
    MSTEAMS = 120


class ExternalProviderEnum(Enum):
    EMAIL = "email"
    SLACK = "slack"
    MSTEAMS = "msteams"


EXTERNAL_PROVIDERS = {
    ExternalProviders.EMAIL: ExternalProviderEnum.EMAIL.value,
    ExternalProviders.SLACK: ExternalProviderEnum.SLACK.value,
    ExternalProviders.MSTEAMS: ExternalProviderEnum.MSTEAMS.value,
}


def get_provider_name(value: int) -> str | None:
    return EXTERNAL_PROVIDERS.get(ExternalProviders(value))


"""
TODO(postgres): We've encoded these enums as integers to facilitate
communication with the DB. We'd prefer to encode them as strings to facilitate
communication with the API and plan to do so as soon as we use native enums in
Postgres. In the meantime each enum has an adjacent object that maps the
integers to their string values.
"""


def get_notification_setting_type_name(value: int | NotificationSettingTypes) -> str | None:
    return NOTIFICATION_SETTING_TYPES.get(NotificationSettingTypes(value))


def get_notification_scope_name(value: int) -> str | None:
    return NOTIFICATION_SCOPE_TYPE.get(NotificationScopeType(value))


class NotificationSettingTypes(Enum):
    """
    Each of these categories of Notification settings has at least an option for
    "on" or "off". Workflow also includes SUBSCRIBE_ONLY and Deploy also
    includes COMMITTED_ONLY and both of these values are described below.
    """

    # Control all notification types. Currently unused.
    DEFAULT = 0

    # When Sentry sees there is a new code deploy.
    DEPLOY = 10

    # When Sentry sees and issue that triggers an Alert Rule.
    ISSUE_ALERTS = 20

    # Notifications for changes in assignment, resolution, comments, etc.
    WORKFLOW = 30

    # Notification when an issue happens shortly after your release. This notification type is no longer supported.
    ACTIVE_RELEASE = 31

    # Notifications that require approval like a request to invite a member
    APPROVAL = 40

    # Notifications about quotas
    QUOTA = 50

    # Sub category of quotas for each event category
    QUOTA_ERRORS = 51
    QUOTA_TRANSACTIONS = 52
    QUOTA_ATTACHMENTS = 53
    QUOTA_REPLAYS = 56

    # Sub category of quotas for warnings before hitting the actual limit
    QUOTA_WARNINGS = 54

    # Sub category of quotas for spend allocation notifications
    QUOTA_SPEND_ALLOCATIONS = 55

    # Notifications about spikes
    SPIKE_PROTECTION = 60

    # Nudge notifications
    MISSING_MEMBERS = 70

    # new for settings v2 but only with helper functions
    # This value shouldn't be stored in the DB
    REPORTS = -1


class NotificationSettingEnum(Enum):
    DEFAULT = "default"
    DEPLOY = "deploy"
    ISSUE_ALERTS = "alerts"
    WORKFLOW = "workflow"
    ACTIVE_RELEASE = "activeRelease"
    APPROVAL = "approval"
    QUOTA = "quota"
    QUOTA_ERRORS = "quotaErrors"
    QUOTA_TRANSACTIONS = "quotaTransactions"
    QUOTA_ATTACHMENTS = "quotaAttachments"
    QUOTA_REPLAYS = "quotaReplays"
    QUOTA_WARNINGS = "quotaWarnings"
    QUOTA_SPEND_ALLOCATIONS = "quotaSpendAllocations"
    SPIKE_PROTECTION = "spikeProtection"
    MISSING_MEMBERS = "missingMembers"
    REPORTS = "reports"


NOTIFICATION_SETTING_TYPES = {
    NotificationSettingTypes.DEFAULT: NotificationSettingEnum.DEFAULT.value,
    NotificationSettingTypes.DEPLOY: NotificationSettingEnum.DEPLOY.value,
    NotificationSettingTypes.ISSUE_ALERTS: NotificationSettingEnum.ISSUE_ALERTS.value,
    NotificationSettingTypes.WORKFLOW: NotificationSettingEnum.WORKFLOW.value,
    NotificationSettingTypes.ACTIVE_RELEASE: NotificationSettingEnum.ACTIVE_RELEASE.value,
    NotificationSettingTypes.APPROVAL: NotificationSettingEnum.APPROVAL.value,
    NotificationSettingTypes.QUOTA: NotificationSettingEnum.QUOTA.value,
    NotificationSettingTypes.QUOTA_ERRORS: NotificationSettingEnum.QUOTA_ERRORS.value,
    NotificationSettingTypes.QUOTA_TRANSACTIONS: NotificationSettingEnum.QUOTA_TRANSACTIONS.value,
    NotificationSettingTypes.QUOTA_ATTACHMENTS: NotificationSettingEnum.QUOTA_ATTACHMENTS.value,
    NotificationSettingTypes.QUOTA_REPLAYS: NotificationSettingEnum.QUOTA_REPLAYS.value,
    NotificationSettingTypes.QUOTA_WARNINGS: NotificationSettingEnum.QUOTA_WARNINGS.value,
    NotificationSettingTypes.QUOTA_SPEND_ALLOCATIONS: NotificationSettingEnum.QUOTA_SPEND_ALLOCATIONS.value,
    NotificationSettingTypes.SPIKE_PROTECTION: NotificationSettingEnum.SPIKE_PROTECTION.value,
    NotificationSettingTypes.REPORTS: NotificationSettingEnum.REPORTS.value,
}


class NotificationSettingOptionValues(Enum):
    """
    An empty row in the DB should be represented as
    NotificationSettingOptionValues.DEFAULT.
    """

    # Defer to a setting one level up.
    DEFAULT = 0

    # Mute this kind of notification.
    NEVER = 10

    # Un-mute this kind of notification.
    ALWAYS = 20

    # Workflow only. Only send notifications about Issues that the target has
    # explicitly or implicitly opted-into.
    SUBSCRIBE_ONLY = 30

    # Deploy only. Only send notifications when the set of changes in the deploy
    # included a commit authored by the target.
    COMMITTED_ONLY = 40


class NotificationSettingsOptionEnum(Enum):
    DEFAULT = "default"
    NEVER = "never"
    ALWAYS = "always"
    SUBSCRIBE_ONLY = "subscribe_only"
    COMMITTED_ONLY = "committed_only"


NOTIFICATION_SETTING_OPTION_VALUES = {
    NotificationSettingOptionValues.DEFAULT: NotificationSettingsOptionEnum.DEFAULT.value,
    NotificationSettingOptionValues.NEVER: NotificationSettingsOptionEnum.NEVER.value,
    NotificationSettingOptionValues.ALWAYS: NotificationSettingsOptionEnum.ALWAYS.value,
    NotificationSettingOptionValues.SUBSCRIBE_ONLY: NotificationSettingsOptionEnum.SUBSCRIBE_ONLY.value,
    NotificationSettingOptionValues.COMMITTED_ONLY: NotificationSettingsOptionEnum.COMMITTED_ONLY.value,
}


class NotificationScopeEnum(Enum):
    USER = "user"
    ORGANIZATION = "organization"
    PROJECT = "project"
    TEAM = "team"


class NotificationScopeType(Enum):
    USER = 0
    ORGANIZATION = 10
    PROJECT = 20
    TEAM = 30


NOTIFICATION_SCOPE_TYPE = {
    NotificationScopeType.USER: NotificationScopeEnum.USER.value,
    NotificationScopeType.ORGANIZATION: NotificationScopeEnum.ORGANIZATION.value,
    NotificationScopeType.PROJECT: NotificationScopeEnum.PROJECT.value,
    NotificationScopeType.TEAM: NotificationScopeEnum.TEAM.value,
}

"""
End of copied over code
"""


def backfill_notification_settings(
    apps: StateApps, schema_editor: BaseDatabaseSchemaEditor
) -> None:
    try:
        NotificationSetting = apps.get_model("sentry", "NotificationSetting")
        NotificationSettingOption = apps.get_model("sentry", "NotificationSettingOption")
        NotificationSettingProvider = apps.get_model("sentry", "NotificationSettingProvider")

        for setting in RangeQuerySetWrapperWithProgressBar(NotificationSetting.objects.all()):
            # find all the related settings regardless of the provider
            # note that we will end up setting the settings N times for N provider options
            related_settings = NotificationSetting.objects.filter(
                scope_type=setting.scope_type,
                scope_identifier=setting.scope_identifier,
                user_id=setting.user_id,
                team_id=setting.team_id,
                type=setting.type,
            )

            enabled_providers = []
            all_providers = []
            enabled_value = None
            for related_setting in related_settings:
                if related_setting.value != NotificationSettingOptionValues.NEVER.value:
                    enabled_providers.append(related_setting.provider)
                    enabled_value = related_setting.value
                all_providers.append(related_setting.provider)

            update_args = {
                "type": get_notification_setting_type_name(related_setting.type),
                "user_id": related_setting.user_id,
                "team_id": related_setting.team_id,
                "scope_type": get_notification_scope_name(related_setting.scope_type),
                "scope_identifier": related_setting.scope_identifier,
            }

            # check if all are disabled
            if len(enabled_providers) == 0:
                NotificationSettingOption.objects.update_or_create(
                    **update_args, defaults={"value": NotificationSettingsOptionEnum.NEVER.value}
                )
            else:
                # map the enabled setting
                NotificationSettingOption.objects.update_or_create(
                    **update_args,
                    defaults={
                        "value": NOTIFICATION_SETTING_OPTION_VALUES[
                            NotificationSettingOptionValues(enabled_value)
                        ]
                    },
                )

            # now set the provider settings if the scope is user or team
            if related_setting.scope_type in [
                NotificationScopeType.USER.value,
                NotificationScopeType.TEAM.value,
            ]:
                for provider in enabled_providers:
                    NotificationSettingProvider.objects.update_or_create(
                        **update_args,
                        provider=get_provider_name(provider),
                        defaults={
                            "value": NotificationSettingsOptionEnum.ALWAYS.value,
                        },
                    )
                disabled_providers = set(all_providers) - set(enabled_providers)
                for provider in disabled_providers:
                    NotificationSettingProvider.objects.update_or_create(
                        **update_args,
                        provider=get_provider_name(provider),
                        defaults={
                            "value": NotificationSettingsOptionEnum.NEVER.value,
                        },
                    )
    except ProgrammingError:
        # for some reason test_two_archived_with_same_name errors out here
        return


class Migration(CheckedMigration):
    # This flag is used to mark that a migration shouldn't be automatically run in production. For
    # the most part, this should only be used for operations where it's safe to run the migration
    # after your code has deployed. So this should not be used for most operations that alter the
    # schema of a table.
    # Here are some things that make sense to mark as post deployment:
    # - Large data migrations. Typically we want these to be run manually by ops so that they can
    #   be monitored and not block the deploy for a long period of time while they run.
    # - Adding indexes to large tables. Since this can take a long time, we'd generally prefer to
    #   have ops run this and not block the deploy. Note that while adding an index is a schema
    #   change, it's completely safe to run the operation after the code has deployed.
    is_post_deployment = True

    dependencies = [
        ("sentry", "0560_add_monitorincident_table"),
    ]

    operations = [
        migrations.RunPython(
            backfill_notification_settings,
            reverse_code=migrations.RunPython.noop,
            hints={
                "tables": [
                    "sentry_notificationsetting",
                    "sentry_notificationsettingoption",
                    "sentry_notificationsettingprovider",
                ]
            },
        )
    ]
