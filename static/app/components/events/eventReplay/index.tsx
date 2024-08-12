import {lazy, useEffect} from 'react';

import ErrorBoundary from 'sentry/components/errorBoundary';
import {ReplayClipSection} from 'sentry/components/events/eventReplay/replayClipSection';
import LazyLoad from 'sentry/components/lazyLoad';
import type {Event} from 'sentry/types/event';
import type {Group} from 'sentry/types/group';
import useEventCanShowReplayUpsell from 'sentry/utils/event/useEventCanShowReplayUpsell';
import {getConfigForIssueType} from 'sentry/utils/issueTypeConfig';
import {getReplayIdFromEvent} from 'sentry/utils/replays/getReplayIdFromEvent';
import {useHaveSelectedProjectsSentAnyReplayEvents} from 'sentry/utils/replays/hooks/useReplayOnboarding';
import useUrlParams from 'sentry/utils/useUrlParams';

interface Props {
  event: Event;
  projectSlug: string;
  group?: Group;
}

const ReplayOnboardingPanel = lazy(() => import('./replayInlineOnboardingPanel'));

export default function EventReplay({event, group, projectSlug}: Props) {
  const replayId = getReplayIdFromEvent(event);
  const {hasSentOneReplay} = useHaveSelectedProjectsSentAnyReplayEvents();
  const {canShowUpsell, upsellPlatform, upsellProjectId} = useEventCanShowReplayUpsell({
    event,
    group,
    projectSlug,
  });

  const {setParamValue: setProjectId} = useUrlParams('project');

  useEffect(() => {
    if (canShowUpsell) {
      setProjectId(upsellProjectId);
    }
  }, [upsellProjectId, setProjectId, canShowUpsell]);

  if (group) {
    const issueTypeConfig = getConfigForIssueType(group, group?.project);
    if (!issueTypeConfig.replays.enabled) {
      return null;
    }
  }

  if (replayId) {
    return <ReplayClipSection event={event} replayId={replayId} group={group} />;
  }

  if (canShowUpsell && !hasSentOneReplay) {
    return (
      <ErrorBoundary mini>
        <LazyLoad
          LazyComponent={ReplayOnboardingPanel}
          platform={upsellPlatform}
          projectId={upsellProjectId}
        />
      </ErrorBoundary>
    );
  }

  return null;
}
