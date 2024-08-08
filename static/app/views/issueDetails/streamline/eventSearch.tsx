import {useCallback, useMemo} from 'react';
import orderBy from 'lodash/orderBy';

import {useFetchIssueTags} from 'sentry/actionCreators/group';
import {fetchTagValues} from 'sentry/actionCreators/tags';
import {
  SearchQueryBuilder,
  type SearchQueryBuilderProps,
} from 'sentry/components/searchQueryBuilder';
import type {FilterKeySection} from 'sentry/components/searchQueryBuilder/types';
import {parseQueryBuilderValue} from 'sentry/components/searchQueryBuilder/utils';
import {Token} from 'sentry/components/searchSyntax/parser';
import {t} from 'sentry/locale';
import type {Group, Tag, TagCollection} from 'sentry/types/group';
import {
  FieldKind,
  getFieldDefinition,
  ISSUE_EVENT_PROPERTY_FIELDS,
} from 'sentry/utils/fields';
import useApi from 'sentry/utils/useApi';
import {useLocation} from 'sentry/utils/useLocation';
import useOrganization from 'sentry/utils/useOrganization';
import {Dataset} from 'sentry/views/alerts/rules/metric/types';
import {ALL_EVENTS_EXCLUDED_TAGS} from 'sentry/views/issueDetails/groupEvents';
import {mergeAndSortTagValues} from 'sentry/views/issueDetails/utils';
import {makeGetIssueTagValues} from 'sentry/views/issueList/utils/getIssueTagValues';

interface EventSearchProps {
  environments: string[];
  group: Group;
  handleSearch: (value: string) => void;
  query: string;
  className?: string;
  queryBuilderProps?: Partial<SearchQueryBuilderProps>;
}

export function useEventQuery({organization, group, environments}): string {
  const location = useLocation();
  const {data = []} = useFetchIssueTags({
    orgSlug: organization.slug,
    groupId: group.id,
    environment: environments,
  });

  const filterKeys = useEventSearchFilterKeys(data);
  const {query: locationQuery} = location.query;
  let eventQuery = '';

  if (Array.isArray(locationQuery)) {
    eventQuery = locationQuery.join(' ');
  } else if (typeof locationQuery === 'string') {
    eventQuery = locationQuery;
  }

  const parsedQuery =
    parseQueryBuilderValue(eventQuery, getFieldDefinition, {
      filterKeys,
    }) ?? [];
  const validQuery = parsedQuery.filter(token => {
    if (token.type === Token.FREE_TEXT) {
      return false;
    }
    if (token.type === Token.FILTER && !filterKeys.hasOwnProperty(token.key.text)) {
      return false;
    }
    return true;
  });

  console.log({validQuery});

  return eventQuery;
}

function useEventSearchFilterKeys(data) {
  const filterKeys = useMemo<TagCollection>(() => {
    const tags = [
      ...data.map(tag => ({...tag, kind: FieldKind.TAG})),
      ...ISSUE_EVENT_PROPERTY_FIELDS.map(tag => ({
        key: tag,
        name: tag,
        kind: FieldKind.EVENT_FIELD,
      })),
    ].filter(tag => !ALL_EVENTS_EXCLUDED_TAGS.includes(tag.key));

    return tags.reduce<TagCollection>((acc, tag) => {
      acc[tag.key] = tag;
      return acc;
    }, {});
  }, [data]);
  return filterKeys;
}

function getFilterKeySections(tags: TagCollection): FilterKeySection[] {
  const allTags: Tag[] = Object.values(tags).filter(
    tag => !ALL_EVENTS_EXCLUDED_TAGS.includes(tag.key)
  );
  const eventFields = orderBy(
    allTags.filter(tag => tag.kind === FieldKind.EVENT_FIELD),
    ['key']
  ).map(tag => tag.key);
  const eventTags = orderBy(
    allTags.filter(tag => tag.kind === FieldKind.TAG),
    ['totalValues', 'key'],
    ['desc', 'asc']
  ).map(tag => tag.key);

  return [
    {
      value: FieldKind.EVENT_FIELD,
      label: t('Event Filters'),
      children: eventFields,
    },
    {
      value: FieldKind.TAG,
      label: t('Event Tags'),
      children: eventTags,
    },
  ];
}

export function EventSearch({
  className,
  query,
  group,
  environments,
  handleSearch,
  queryBuilderProps = {},
}: EventSearchProps) {
  const api = useApi();
  const organization = useOrganization();

  const {data = []} = useFetchIssueTags({
    orgSlug: organization.slug,
    groupId: group.id,
    environment: environments,
  });

  const filterKeys = useEventSearchFilterKeys(data);

  const tagValueLoader = useCallback(
    async (key: string, search: string) => {
      const orgSlug = organization.slug;
      const projectIds = [group.project.id];

      const [eventsDatasetValues, issuePlatformDatasetValues] = await Promise.all([
        fetchTagValues({
          api,
          orgSlug,
          tagKey: key,
          search,
          projectIds,
          dataset: Dataset.ERRORS,
        }),
        fetchTagValues({
          api,
          orgSlug,
          tagKey: key,
          search,
          projectIds,
          dataset: Dataset.ISSUE_PLATFORM,
        }),
      ]);

      return mergeAndSortTagValues(eventsDatasetValues, issuePlatformDatasetValues);
    },
    [api, group.project.id, organization.slug]
  );

  const getTagValues = useMemo(
    () => makeGetIssueTagValues(tagValueLoader),
    [tagValueLoader]
  );

  const filterKeySections = useMemo(() => getFilterKeySections(filterKeys), [filterKeys]);

  return (
    <SearchQueryBuilder
      initialQuery={query}
      onSearch={handleSearch}
      filterKeys={filterKeys}
      filterKeySections={filterKeySections}
      getTagValues={getTagValues}
      placeholder={t('Search events...')}
      searchSource="issue_events_tab"
      className={className}
      {...queryBuilderProps}
    />
  );
}
