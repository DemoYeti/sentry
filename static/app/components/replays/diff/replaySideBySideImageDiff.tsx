import styled from '@emotion/styled';

import {Flex} from 'sentry/components/container/flex';
import {StaticReplayPreferences} from 'sentry/components/replays/preferences/replayPreferences';
import {Provider as ReplayContextProvider} from 'sentry/components/replays/replayContext';
import ReplayPlayer from 'sentry/components/replays/replayPlayer';
import {t} from 'sentry/locale';
import {space} from 'sentry/styles/space';
import type ReplayReader from 'sentry/utils/replays/replayReader';

interface Props {
  leftOffsetMs: number;
  replay: null | ReplayReader;
  rightOffsetMs: number;
}

export function ReplaySideBySideImageDiff({leftOffsetMs, replay, rightOffsetMs}: Props) {
  const fetching = false;

  return (
    <Flex gap={space(2)} column>
      <DiffHeader>
        <Flex flex="1" align="center">
          {t('Before Hydration')}
        </Flex>
        <Flex flex="1" align="center">
          {t('After Hydration')}
        </Flex>
      </DiffHeader>
      <ReplayGrid>
        <ReplayContextProvider
          analyticsContext="replay_comparison_modal_left"
          initialTimeOffsetMs={{offsetMs: leftOffsetMs}}
          isFetching={fetching}
          prefsStrategy={StaticReplayPreferences}
          replay={replay}
        >
          <ReplayPlayer isPreview />
        </ReplayContextProvider>
        <ReplayContextProvider
          analyticsContext="replay_comparison_modal_right"
          initialTimeOffsetMs={{offsetMs: rightOffsetMs}}
          isFetching={fetching}
          prefsStrategy={StaticReplayPreferences}
          replay={replay}
        >
          {rightOffsetMs > 0 ? <ReplayPlayer isPreview /> : <div />}
        </ReplayContextProvider>
      </ReplayGrid>
    </Flex>
  );
}

const DiffHeader = styled('div')`
  display: flex;
  flex-direction: row;
  align-items: center;
  flex: 1;
  font-weight: ${p => p.theme.fontWeightBold};
  line-height: 1.2;

  div {
    height: 28px; /* div with and without buttons inside are the same height */
  }

  div:last-child {
    padding-left: ${space(2)};
  }
`;

const ReplayGrid = styled('div')`
  display: grid;
  grid-template-columns: 1fr 1fr;
`;
