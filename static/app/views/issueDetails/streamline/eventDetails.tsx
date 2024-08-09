import {createContext, useContext, useEffect, useRef, useState} from 'react';
import styled from '@emotion/styled';

import {DatePageFilter} from 'sentry/components/organizations/datePageFilter';
import {EnvironmentPageFilter} from 'sentry/components/organizations/environmentPageFilter';
import {space} from 'sentry/styles/space';
import useOrganization from 'sentry/utils/useOrganization';
import usePageFilters from 'sentry/utils/usePageFilters';
import {
  DefaultGroupEventDetailsContent,
  type GroupEventDetailsContentProps,
} from 'sentry/views/issueDetails/groupEventDetails/groupEventDetailsContent';
import {EventNavigation} from 'sentry/views/issueDetails/streamline/eventNavigation';
import {
  EventSearch,
  useEventQuery,
} from 'sentry/views/issueDetails/streamline/eventSearch';
import {Section} from 'sentry/views/issueDetails/streamline/foldSection';

export interface EventDetailsContextType {
  searchQuery: string;
}

const EventDetailsContext = createContext<EventDetailsContextType>({
  searchQuery: '',
});

export function useEventDetailsContext() {
  return useContext(EventDetailsContext);
}

export function EventDetails({
  group,
  event,
  project,
}: Required<GroupEventDetailsContentProps>) {
  const navRef = useRef<HTMLDivElement>(null);
  const organization = useOrganization();
  const {selection} = usePageFilters();
  const {environments} = selection;

  const searchQuery = useEventQuery({environments, organization, group});
  const [eventDetails, setEventDetails] = useState<EventDetailsContextType>({
    searchQuery,
  });

  // When the search query is finished parsing, set it immediately.
  useEffect(() => {
    setEventDetails(details => ({...details, searchQuery}));
  }, [searchQuery]);

  return (
    <EventDetailsContext.Provider value={eventDetails}>
      <FilterContainer>
        <EnvironmentPageFilter />
        <SearchFilter
          group={group}
          handleSearch={sq => {
            setEventDetails(details => ({...details, searchQuery: sq}));
          }}
          environments={environments}
          query={eventDetails.searchQuery}
          queryBuilderProps={{
            disallowFreeText: true,
          }}
        />
        <DatePageFilter />
      </FilterContainer>
      <GroupContent navHeight={navRef?.current?.offsetHeight}>
        <FloatingEventNavigation
          event={event}
          group={group}
          ref={navRef}
          appliedQuery={eventDetails.searchQuery}
        />
        <GroupContentPadding>
          <DefaultGroupEventDetailsContent
            group={group}
            event={event}
            project={project}
          />
        </GroupContentPadding>
      </GroupContent>
    </EventDetailsContext.Provider>
  );
}

const FloatingEventNavigation = styled(EventNavigation)`
  position: sticky;
  top: 0;
  background: ${p => p.theme.background};
  z-index: 100;
  border-radius: 6px 6px 0 0;
`;

const SearchFilter = styled(EventSearch)`
  border-radius: ${p => p.theme.borderRadius};
`;

const GroupContent = styled('div')<{navHeight?: number}>`
  border: 1px solid ${p => p.theme.border};
  background: ${p => p.theme.background};
  border-radius: ${p => p.theme.borderRadius};
  position: relative;
  & ${Section} {
    scroll-margin-top: ${p => p.navHeight ?? 0}px;
  }
`;

const GroupContentPadding = styled('div')`
  padding: ${space(1)} ${space(1.5)};
`;

const FilterContainer = styled('div')`
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: ${space(1)};
`;
