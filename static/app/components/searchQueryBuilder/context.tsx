import {createContext, type Dispatch, useContext} from 'react';

import type {QueryBuilderFocusState} from 'sentry/components/searchQueryBuilder/types';
import type {QueryBuilderActions} from 'sentry/components/searchQueryBuilder/useQueryBuilderState';
import type {ParseResult} from 'sentry/components/searchSyntax/parser';
import type {Tag, TagCollection} from 'sentry/types';

interface ContextData {
  dispatch: Dispatch<QueryBuilderActions>;
  focus: QueryBuilderFocusState | null;
  getTagValues: (tag: Tag, query: string) => Promise<string[]>;
  keys: TagCollection;
  parsedQuery: ParseResult | null;
  query: string;
}

export function useSearchQueryBuilder() {
  return useContext(SearchQueryBuilerContext);
}

export const SearchQueryBuilerContext = createContext<ContextData>({
  query: '',
  keys: {},
  getTagValues: () => Promise.resolve([]),
  dispatch: () => {},
  parsedQuery: null,
  focus: null,
});
