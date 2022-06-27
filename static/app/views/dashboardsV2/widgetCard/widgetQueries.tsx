import {useContext} from 'react';
import omit from 'lodash/omit';

import {Client} from 'sentry/api';
import {isMultiSeriesStats} from 'sentry/components/charts/utils';
import {
  EventsStats,
  MultiSeriesEventsStats,
  Organization,
  PageFilters,
} from 'sentry/types';
import {Series} from 'sentry/types/echarts';
import {TableDataWithTitle} from 'sentry/utils/discover/discoverQuery';

import {ErrorsAndTransactionsConfig} from '../datasetConfig/errorsAndTransactions';
import {Widget} from '../types';

import {DashboardsMEPContext} from './dashboardsMEPContext';
import GenericWidgetQueries, {ChildrenProps} from './genericWidgetQueries';

type RawResult = EventsStats | MultiSeriesEventsStats;

type SeriesWithOrdering = [order: number, series: Series];

export function transformSeries(stats: EventsStats, seriesName: string): Series {
  return {
    seriesName,
    data:
      stats?.data?.map(([timestamp, counts]) => ({
        name: timestamp * 1000,
        value: counts.reduce((acc, {count}) => acc + count, 0),
      })) ?? [],
  };
}

/**
 * Multiseries data with a grouping needs to be "flattened" because the aggregate data
 * are stored under the group names. These names need to be combined with the aggregate
 * names to show a series.
 *
 * e.g. count() and count_unique() grouped by environment
 * {
 *    "local": {
 *      "count()": {...},
 *      "count_unique()": {...}
 *    },
 *    "prod": {
 *      "count()": {...},
 *      "count_unique()": {...}
 *    }
 * }
 */
export function flattenMultiSeriesDataWithGrouping(
  result: RawResult,
  queryAlias: string
): SeriesWithOrdering[] {
  const seriesWithOrdering: SeriesWithOrdering[] = [];
  const groupNames = Object.keys(result);

  groupNames.forEach(groupName => {
    // Each group contains an order key which we should ignore
    const aggregateNames = Object.keys(omit(result[groupName], 'order'));

    aggregateNames.forEach(aggregate => {
      const seriesName = `${groupName} : ${aggregate}`;
      const prefixedName = queryAlias ? `${queryAlias} > ${seriesName}` : seriesName;
      const seriesData: EventsStats = result[groupName][aggregate];

      seriesWithOrdering.push([
        result[groupName].order || 0,
        transformSeries(seriesData, prefixedName),
      ]);
    });
  });

  return seriesWithOrdering;
}

export function getIsMetricsDataFromSeriesResponse(
  result: RawResult
): boolean | undefined {
  const multiIsMetricsData = Object.values(result)
    .map(({isMetricsData}) => isMetricsData)
    // One non-metrics series will cause all of them to be marked as such
    .reduce((acc, value) => (acc === false ? false : value), undefined);

  return isMultiSeriesStats(result) ? multiIsMetricsData : result.isMetricsData;
}

type Props = {
  api: Client;
  children: (props: ChildrenProps) => JSX.Element;
  organization: Organization;
  selection: PageFilters;
  widget: Widget;
  cursor?: string;
  limit?: number;
  onDataFetched?: (results: {
    pageLinks?: string;
    tableResults?: TableDataWithTitle[];
    timeseriesResults?: Series[];
  }) => void;
};

function WidgetQueries({
  api,
  children,
  organization,
  selection,
  widget,
  cursor,
  limit,
  onDataFetched,
}: Props) {
  const config = ErrorsAndTransactionsConfig;
  const context = useContext(DashboardsMEPContext);

  let isMetricsData;
  let setIsMetricsData;

  if (context) {
    isMetricsData = context.isMetricsData;
    setIsMetricsData = context.setIsMetricsData;
  }

  const processRawResult = rawResults => {
    // If one of the queries is sampled, then mark the whole thing as sampled
    const isMetricsDataOfCurrResult =
      isMetricsData === false ? false : getIsMetricsDataFromSeriesResponse(rawResults);
    setIsMetricsData?.(isMetricsDataOfCurrResult);
  };

  const processRawTableResult = rawResults => {
    // If one of the queries is sampled, then mark the whole thing as sampled
    isMetricsData = isMetricsData === false ? false : rawResults.meta?.isMetricsData;
    setIsMetricsData?.(isMetricsData);
  };

  return (
    <GenericWidgetQueries
      config={config}
      api={api}
      organization={organization}
      selection={selection}
      widget={widget}
      cursor={cursor}
      limit={limit}
      onDataFetched={onDataFetched}
      processRawResult={processRawResult}
      processRawTableResult={processRawTableResult}
    >
      {children}
    </GenericWidgetQueries>
  );
}

export default WidgetQueries;
