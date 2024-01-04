import {IncidentStats as IncidentStatsType} from 'sentry/views/alerts/types';

export function IncidentStatsFixture(
  params: Partial<IncidentStatsType> = {}
): IncidentStatsType {
  return {
    totalEvents: 100,
    uniqueUsers: 20,
    eventStats: {
      data: [],
    },
    ...params,
  };
}
