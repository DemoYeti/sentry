from .base import (
    FeatureHandlerStrategy,
    OrganizationFeature,
    ProjectFeature,
    ProjectPluginFeature,
    SystemFeature,
)
from .manager import FeatureManager

# XXX: See `features/__init__.py` for documentation on how to use feature flags


def register_temporary_features(manager: FeatureManager):
    """
    These flags are temporary. These flags exist as a way for us to gate newly
    developed features.

    [!!] THESE FLAGS ARE INTENDED TO BE REMOVED!

    [!!] Leaving around feature flags in the codebase introduces complexity
         that will constantly need to be understood! Complexity leads to longer
         times developing features, higher chance of introducing bugs, and
         overall less happiness working in sentry.

         CLEAN UP YOUR FEATURE FLAGS!
    """
    # No formatting so that we can keep them as single lines
    # fmt: off

    # NOTE: Please maintain alphabetical order when adding new feature flags

    # Features that don't use resource scoping
    manager.add("auth:enterprise-superuser-read-write", SystemFeature, FeatureHandlerStrategy.INTERNAL)
    manager.add("auth:register", SystemFeature, FeatureHandlerStrategy.INTERNAL)
    manager.add("organizations:create", SystemFeature, FeatureHandlerStrategy.INTERNAL)
    manager.add("organizations:multi-region-selector", SystemFeature, FeatureHandlerStrategy.INTERNAL)
    manager.add("relocation:enabled", SystemFeature, FeatureHandlerStrategy.INTERNAL)

    # Organization scoped features that are in development or in customer trials.
    manager.add("organizations:activated-alert-rules", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:ai-analytics", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:alert-allow-indexed", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:alert-crash-free-metrics", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:alert-filters", OrganizationFeature, FeatureHandlerStrategy.INTERNAL)
    manager.add("organizations:alerts-migration-enabled", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:anr-analyze-frames", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:anr-improvements", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:api-auth-provider", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:api-keys", OrganizationFeature, FeatureHandlerStrategy.INTERNAL)
    manager.add("organizations:api-organization_events-rate-limit-reduced-rollout", OrganizationFeature, FeatureHandlerStrategy.INTERNAL)
    manager.add("organizations:auto-enable-codecov", OrganizationFeature, FeatureHandlerStrategy.INTERNAL)
    manager.add("organizations:codecov-commit-sha-from-git-blame", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:crons-broken-monitor-detection", OrganizationFeature, FeatureHandlerStrategy.INTERNAL)
    manager.add("organizations:crons-disable-ingest-endpoints", OrganizationFeature, FeatureHandlerStrategy.INTERNAL)
    manager.add("organizations:daily-summary", OrganizationFeature, FeatureHandlerStrategy.INTERNAL)
    manager.add("organizations:dashboard-widget-indicators", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:dashboards-import", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:dashboards-mep", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:dashboards-rh-widget", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:ddm-dashboard-import", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:ddm-experimental", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:ddm-metrics-api-unit-normalization", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:ddm-sidebar-item-hidden", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:metrics-stats", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:ddm-ui", OrganizationFeature, FeatureHandlerStrategy.INTERNAL)
    manager.add("organizations:default-high-priority-alerts", OrganizationFeature, FeatureHandlerStrategy.INTERNAL)
    manager.add("organizations:derive-code-mappings", OrganizationFeature, FeatureHandlerStrategy.INTERNAL)
    manager.add("organizations:derive-code-mappings-go", OrganizationFeature, FeatureHandlerStrategy.INTERNAL)
    manager.add("organizations:device-class-synthesis", OrganizationFeature, FeatureHandlerStrategy.INTERNAL)
    manager.add("organizations:device-classification", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:discover", OrganizationFeature, FeatureHandlerStrategy.INTERNAL)
    manager.add("organizations:ds-org-recalibration", OrganizationFeature, FeatureHandlerStrategy.INTERNAL)
    manager.add("organizations:enterprise-data-secrecy", OrganizationFeature, FeatureHandlerStrategy.INTERNAL)
    manager.add("organizations:escalating-issues-msteams", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:escalating-issues-v2", OrganizationFeature, FeatureHandlerStrategy.INTERNAL)
    manager.add("organizations:escalating-metrics-backend", OrganizationFeature, FeatureHandlerStrategy.INTERNAL)
    manager.add("organizations:event-tags-tree-ui", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:gitlab-disable-on-broken", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:grouping-stacktrace-ui", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:grouping-suppress-unnecessary-secondary-hash", OrganizationFeature, FeatureHandlerStrategy.INTERNAL)
    manager.add("organizations:grouping-title-ui", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:grouping-tree-ui", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:higher-ownership-limit", OrganizationFeature, FeatureHandlerStrategy.INTERNAL)
    manager.add("organizations:increased-issue-owners-rate-limit", OrganizationFeature, FeatureHandlerStrategy.INTERNAL)
    manager.add("organizations:integrations-custom-alert-priorities", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:integrations-deployment", OrganizationFeature, FeatureHandlerStrategy.INTERNAL)
    manager.add("organizations:integrations-feature-flag-integration", OrganizationFeature, FeatureHandlerStrategy.INTERNAL)
    manager.add("organizations:integrations-msteams-tenant", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:investigation-bias", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:invite-members", OrganizationFeature, FeatureHandlerStrategy.INTERNAL)
    manager.add("organizations:invite-members-rate-limits", OrganizationFeature, FeatureHandlerStrategy.INTERNAL)
    manager.add("organizations:issue-details-autofix-ui", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:issue-details-inline-replay-viewer", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:issue-details-new-experience-toggle", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:issue-details-tag-improvements", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:issue-platform", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:issue-priority-ui", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:issue-search-allow-postgres-only-search", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:issue-search-group-attributes-side-query", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:issue-stream-empty-state", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:issue-stream-performance", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:large-debug-files", OrganizationFeature, FeatureHandlerStrategy.INTERNAL)
    manager.add("organizations:latest-adopted-release-filter", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:mep-rollout-flag", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:mep-use-default-tags", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:metric-alert-chartcuterie", OrganizationFeature, FeatureHandlerStrategy.INTERNAL)
    manager.add("organizations:metric-alert-ignore-archived", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:metric-alert-load-shedding", OrganizationFeature, FeatureHandlerStrategy.OPTIONS)
    manager.add("organizations:metric-alert-threshold-period", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:metric-meta", OrganizationFeature, FeatureHandlerStrategy.INTERNAL)
    manager.add("organizations:metrics-api-new-metrics-layer", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:metrics-blocking", OrganizationFeature, FeatureHandlerStrategy.INTERNAL)
    manager.add("organizations:metrics-extraction", OrganizationFeature, FeatureHandlerStrategy.INTERNAL)
    manager.add("organizations:metrics-samples-list", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:metrics-samples-list-search", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:minute-resolution-sessions", OrganizationFeature, FeatureHandlerStrategy.INTERNAL)
    manager.add("organizations:mobile-cpu-memory-in-transactions", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:mobile-ttid-ttfd-contribution", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:mobile-vitals", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:more-slow-alerts", OrganizationFeature, FeatureHandlerStrategy.INTERNAL)
    manager.add("organizations:new-page-filter", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:new-weekly-report", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:noisy-alert-warning", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:notification-all-recipients", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:old-user-feedback", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:on-demand-metrics-extraction", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:on-demand-metrics-extraction-experimental", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:on-demand-metrics-extraction-widgets", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:on-demand-metrics-query-spec-version-two", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:on-demand-metrics-ui", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:on-demand-metrics-ui-widgets", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:onboarding", OrganizationFeature, FeatureHandlerStrategy.INTERNAL)  # Only enabled in sentry.io to enable onboarding flows.
    manager.add("organizations:onboarding-sdk-selection", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:org-subdomains", OrganizationFeature, FeatureHandlerStrategy.INTERNAL)
    manager.add("organizations:performance-anomaly-detection-ui", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:performance-calculate-mobile-perf-score-relay", OrganizationFeature, FeatureHandlerStrategy.INTERNAL)
    manager.add("organizations:performance-change-explorer", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:performance-chart-interpolation", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:performance-consecutive-http-detector", OrganizationFeature, FeatureHandlerStrategy.INTERNAL)
    manager.add("organizations:performance-database-view", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:performance-database-view-percentiles", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:performance-db-main-thread-detector", OrganizationFeature)
    manager.add("organizations:performance-discover-widget-split-override-save", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:performance-discover-widget-split-ui", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:performance-file-io-main-thread-detector", OrganizationFeature, FeatureHandlerStrategy.INTERNAL)
    manager.add("organizations:performance-http-view", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:performance-issues-all-events-tab", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:performance-issues-dev", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:performance-issues-search", OrganizationFeature, FeatureHandlerStrategy.INTERNAL)
    manager.add("organizations:performance-landing-page-stats-period", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:performance-large-http-payload-detector", OrganizationFeature, FeatureHandlerStrategy.INTERNAL)
    manager.add("organizations:performance-mep-bannerless-ui", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:performance-mep-reintroduce-histograms", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:performance-metrics-backed-transaction-summary", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:performance-mobile-perf-score-ui", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:performance-new-trends", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:performance-new-widget-designs", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:performance-onboarding-checklist", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:performance-remove-metrics-compatibility-fallback", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:performance-screens-platform-selector", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:performance-screens-view", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:performance-span-histogram-view", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:performance-trace-details", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:performance-trace-explorer", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:performance-tracing-without-performance", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:performance-transaction-name-only-search", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:performance-transaction-name-only-search-indexed", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:performance-transaction-summary-cleanup", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:performance-spans-new-ui", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:performance-streamed-spans-exp-ingest", OrganizationFeature, FeatureHandlerStrategy.INTERNAL)
    manager.add("organizations:performance-streamed-spans-exp-visible", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:process-slow-alerts", OrganizationFeature, FeatureHandlerStrategy.INTERNAL)
    manager.add("organizations:performance-trends-issues", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:performance-trends-new-data-date-range-default", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:performance-use-metrics", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:performance-vitals-inp", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:profiling", OrganizationFeature, FeatureHandlerStrategy.INTERNAL)
    manager.add("organizations:profiling-beta", OrganizationFeature, FeatureHandlerStrategy.INTERNAL)
    manager.add("organizations:profiling-browser", OrganizationFeature, FeatureHandlerStrategy.INTERNAL)
    manager.add("organizations:profiling-differential-flamegraph-page", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:profiling-global-suspect-functions", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:profiling-summary-redesign", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:profiling-using-transactions", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:continuous-profiling", OrganizationFeature, FeatureHandlerStrategy.INTERNAL)
    manager.add("organizations:project-create-replay-feedback", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:project-event-date-limit", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:project-stats", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:related-events", OrganizationFeature, FeatureHandlerStrategy.INTERNAL)
    manager.add("organizations:related-issues", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:relay-cardinality-limiter", OrganizationFeature, FeatureHandlerStrategy.INTERNAL)
    manager.add("organizations:release-comparison-performance", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:release-health-drop-sessions", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:releases-v2", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:releases-v2-banner", OrganizationFeature, FeatureHandlerStrategy.INTERNAL)
    manager.add("organizations:releases-v2-internal", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:releases-v2-st", OrganizationFeature, FeatureHandlerStrategy.INTERNAL)
    manager.add("organizations:replay-play-from-replay-tab", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:session-replay-video", OrganizationFeature, FeatureHandlerStrategy.INTERNAL)
    manager.add("organizations:reprocessing-v2", OrganizationFeature, FeatureHandlerStrategy.INTERNAL)
    manager.add("organizations:required-email-verification", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:rule-create-edit-confirm-notification", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:sandbox-kill-switch", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:scim-team-roles", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:sdk-crash-detection", OrganizationFeature, FeatureHandlerStrategy.INTERNAL)
    manager.add("organizations:sentry-functions", OrganizationFeature, FeatureHandlerStrategy.INTERNAL)
    manager.add("organizations:sentry-pride-logo-footer", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:session-replay-a11y-tab", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:session-replay-accessibility-issues", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:session-replay-combined-envelope-items", OrganizationFeature, FeatureHandlerStrategy.INTERNAL)
    manager.add("organizations:session-replay-enable-canvas", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:session-replay-enable-canvas-replayer", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:session-replay-issue-emails", OrganizationFeature, FeatureHandlerStrategy.INTERNAL)
    manager.add("organizations:session-replay-mobile-player", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:session-replay-mobile-network-tab", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:session-replay-new-event-counts", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:session-replay-rage-click-issue-creation", OrganizationFeature, FeatureHandlerStrategy.INTERNAL)
    manager.add("organizations:session-replay-recording-scrubbing", OrganizationFeature, FeatureHandlerStrategy.INTERNAL)
    manager.add("organizations:session-replay-sdk", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:session-replay-sdk-errors-only", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:session-replay-slack-new-issue", OrganizationFeature, FeatureHandlerStrategy.INTERNAL)
    manager.add("organizations:session-replay-ui", OrganizationFeature, FeatureHandlerStrategy.INTERNAL)
    manager.add("organizations:set-grouping-config", OrganizationFeature, FeatureHandlerStrategy.INTERNAL)
    manager.add("organizations:settings-legal-tos-ui", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:slack-block-kit", OrganizationFeature, FeatureHandlerStrategy.INTERNAL)
    manager.add("organizations:slack-overage-notifications", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:slack-thread-issue-alert", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:sourcemaps-bundle-flat-file-indexing", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:sourcemaps-upload-release-as-artifact-bundle", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:stacktrace-processing-caching", OrganizationFeature, FeatureHandlerStrategy.INTERNAL)
    manager.add("organizations:spans-first-ui", OrganizationFeature, FeatureHandlerStrategy.INTERNAL)
    manager.add("organizations:standalone-span-ingestion", OrganizationFeature, FeatureHandlerStrategy.INTERNAL)
    manager.add("organizations:starfish-aggregate-span-waterfall", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:starfish-browser-resource-module-bundle-analysis", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:starfish-browser-resource-module-image-view", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:starfish-browser-resource-module-ui", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:starfish-browser-webvitals", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:starfish-browser-webvitals-pageoverview-v2", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:starfish-browser-webvitals-replace-fid-with-inp", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:starfish-browser-webvitals-score-computed-total", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:performance-queues-view", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:performance-cache-view", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:starfish-browser-webvitals-use-backend-scores", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:starfish-mobile-appstart", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:starfish-mobile-ui-module", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:starfish-test-endpoint", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:starfish-view", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:statistical-detectors-rca-spans-only", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:starfish-wsv-chart-dropdown", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:symbol-sources", OrganizationFeature, FeatureHandlerStrategy.INTERNAL)
    manager.add("organizations:team-workflow-notifications", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:trace-view-load-more", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:trace-view-v1", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:transaction-metrics-extraction", OrganizationFeature, FeatureHandlerStrategy.INTERNAL)
    manager.add("organizations:transaction-name-mark-scrubbed-as-sanitized", OrganizationFeature, FeatureHandlerStrategy.INTERNAL)
    manager.add("organizations:transaction-name-normalize", OrganizationFeature, FeatureHandlerStrategy.INTERNAL)
    manager.add("organizations:transaction-name-sanitization", OrganizationFeature, FeatureHandlerStrategy.INTERNAL)
    manager.add("organizations:use-metrics-layer", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:use-metrics-layer-in-alerts", OrganizationFeature, FeatureHandlerStrategy.INTERNAL)
    manager.add("organizations:user-feedback-ingest", OrganizationFeature, FeatureHandlerStrategy.INTERNAL)
    manager.add("organizations:user-feedback-replay-clip", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:user-feedback-spam-filter-ingest", OrganizationFeature, FeatureHandlerStrategy.INTERNAL)
    manager.add("organizations:user-feedback-spam-filter-ui", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:user-feedback-ui", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:view-hierarchies-options-dev", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    manager.add("organizations:widget-viewer-modal-minimap", OrganizationFeature, FeatureHandlerStrategy.REMOTE)
    # NOTE: Don't add features down here! Add them to their specific group and sort
    #       them alphabetically! The order features are registered is not important.

    # Project scoped features
    manager.add("projects:ai-autofix", ProjectFeature, FeatureHandlerStrategy.INTERNAL)
    manager.add("projects:alert-filters", ProjectFeature, FeatureHandlerStrategy.INTERNAL)
    manager.add("projects:discard-transaction", ProjectFeature, FeatureHandlerStrategy.INTERNAL)
    manager.add("projects:first-event-severity-alerting", ProjectFeature, FeatureHandlerStrategy.INTERNAL)
    manager.add("projects:first-event-severity-calculation", ProjectFeature, FeatureHandlerStrategy.INTERNAL)
    manager.add("projects:first-event-severity-new-escalation", ProjectFeature, FeatureHandlerStrategy.INTERNAL)
    manager.add("projects:high-priority-alerts", ProjectFeature, FeatureHandlerStrategy.INTERNAL)
    manager.add("projects:issue-priority", ProjectFeature, FeatureHandlerStrategy.INTERNAL)
    manager.add("projects:minidump", ProjectFeature, FeatureHandlerStrategy.INTERNAL)
    manager.add("projects:race-free-group-creation", ProjectFeature, FeatureHandlerStrategy.INTERNAL)
    manager.add("projects:similarity-embeddings", ProjectFeature, FeatureHandlerStrategy.INTERNAL)
    manager.add("projects:similarity-embeddings-grouping", ProjectFeature, FeatureHandlerStrategy.INTERNAL)
    manager.add("projects:similarity-indexing", ProjectFeature, FeatureHandlerStrategy.INTERNAL)
    manager.add("projects:similarity-view", ProjectFeature, FeatureHandlerStrategy.INTERNAL)
    manager.add("projects:span-metrics-extraction", ProjectFeature, FeatureHandlerStrategy.INTERNAL)
    manager.add("projects:span-metrics-extraction-all-modules", ProjectFeature, FeatureHandlerStrategy.INTERNAL)
    manager.add("projects:span-metrics-extraction-ga-modules", ProjectFeature, FeatureHandlerStrategy.INTERNAL)
    manager.add("projects:span-metrics-extraction-resource", ProjectFeature, FeatureHandlerStrategy.INTERNAL)
    manager.add("projects:extract-transaction-from-segment-span", ProjectFeature, FeatureHandlerStrategy.INTERNAL)
    manager.add("projects:span-metrics-double-write-distributions-as-gauges", ProjectFeature, FeatureHandlerStrategy.INTERNAL)

    # Project plugin features
    manager.add("projects:plugins", ProjectPluginFeature, FeatureHandlerStrategy.INTERNAL)

    manager.add("projects:profiling-ingest-unsampled-profiles", ProjectFeature, FeatureHandlerStrategy.REMOTE)
    # fmt: on
