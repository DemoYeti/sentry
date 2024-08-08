import {useCallback, useMemo, useRef} from 'react';
import {css} from '@emotion/react';
import styled from '@emotion/styled';

import {openModal} from 'sentry/actionCreators/modal';
import {hasEveryAccess} from 'sentry/components/acl/access';
import {Button} from 'sentry/components/button';
import ButtonBar from 'sentry/components/buttonBar';
import ErrorBoundary from 'sentry/components/errorBoundary';
import {ContextCardContent} from 'sentry/components/events/contexts/contextCard';
import {getContextMeta} from 'sentry/components/events/contexts/utils';
import {
  TreeColumn,
  TreeContainer,
} from 'sentry/components/events/eventTags/eventTagsTree';
import EventTagsTreeRow from 'sentry/components/events/eventTags/eventTagsTreeRow';
import {useIssueDetailsColumnCount} from 'sentry/components/events/eventTags/util';
import EditHighlightsModal from 'sentry/components/events/highlights/editHighlightsModal';
import {
  EMPTY_HIGHLIGHT_DEFAULT,
  getHighlightContextData,
  getHighlightTagData,
  HIGHLIGHT_DOCS_LINK,
} from 'sentry/components/events/highlights/util';
import ExternalLink from 'sentry/components/links/externalLink';
import LoadingIndicator from 'sentry/components/loadingIndicator';
import {IconEdit, IconMegaphone} from 'sentry/icons';
import {t, tct} from 'sentry/locale';
import type {Event} from 'sentry/types/event';
import type {Project} from 'sentry/types/project';
import {trackAnalytics} from 'sentry/utils/analytics';
import theme from 'sentry/utils/theme';
import {useDetailedProject} from 'sentry/utils/useDetailedProject';
import {useFeedbackForm} from 'sentry/utils/useFeedbackForm';
import {useLocation} from 'sentry/utils/useLocation';
import useOrganization from 'sentry/utils/useOrganization';
import {FoldSectionKey} from 'sentry/views/issueDetails/streamline/foldSection';
import {InterimSection} from 'sentry/views/issueDetails/streamline/interimSection';

interface HighlightsDataSectionProps {
  event: Event;
  project: Project;
  viewAllRef?: React.RefObject<HTMLElement>;
}

function useOpenEditHighlightsModal({
  detailedProject,
  event,
}: {
  event: Event;
  detailedProject?: Project;
}) {
  const organization = useOrganization();
  const isProjectAdmin = hasEveryAccess(['project:admin'], {
    organization: organization,
    project: detailedProject,
  });

  const editProps = useMemo(
    () => ({
      disabled: !isProjectAdmin,
      title: !isProjectAdmin ? t('Only Project Admins can edit highlights.') : undefined,
    }),
    [isProjectAdmin]
  );

  const openEditHighlightsModal = useCallback(() => {
    trackAnalytics('highlights.issue_details.edit_clicked', {organization});
    openModal(
      deps => (
        <EditHighlightsModal
          event={event}
          highlightContext={detailedProject?.highlightContext ?? {}}
          highlightTags={detailedProject?.highlightTags ?? []}
          highlightPreset={detailedProject?.highlightPreset}
          project={detailedProject!}
          {...deps}
        />
      ),
      {modalCss: highlightModalCss}
    );
  }, [organization, detailedProject, event]);

  return {openEditHighlightsModal, editProps};
}

function EditHighlightsButton({project, event}: {event: Event; project: Project}) {
  const organization = useOrganization();
  const {isLoading, data: detailedProject} = useDetailedProject({
    orgSlug: organization.slug,
    projectSlug: project.slug,
  });
  const {openEditHighlightsModal, editProps} = useOpenEditHighlightsModal({
    detailedProject,
    event,
  });
  return (
    <Button
      size="xs"
      icon={<IconEdit />}
      onClick={openEditHighlightsModal}
      title={editProps.title}
      disabled={isLoading || editProps.disabled}
    >
      {t('Edit')}
    </Button>
  );
}

function HighlightsData({
  event,
  project,
}: Pick<HighlightsDataSectionProps, 'event' | 'project'>) {
  const organization = useOrganization();
  const location = useLocation();
  const containerRef = useRef<HTMLDivElement>(null);
  const columnCount = useIssueDetailsColumnCount(containerRef);
  const {isLoading, data: detailedProject} = useDetailedProject({
    orgSlug: organization.slug,
    projectSlug: project.slug,
  });
  const {openEditHighlightsModal, editProps} = useOpenEditHighlightsModal({
    detailedProject,
    event,
  });

  const highlightContext = useMemo(
    () => detailedProject?.highlightContext ?? project?.highlightContext ?? {},
    [detailedProject, project]
  );
  const highlightTags = useMemo(
    () => detailedProject?.highlightTags ?? project?.highlightTags ?? [],
    [detailedProject, project]
  );

  // The API will return default values for tags/context. The only way to have none is to set it to
  // empty yourself, meaning the user has disabled highlights
  const hasDisabledHighlights =
    Object.values(highlightContext).flat().length === 0 && highlightTags.length === 0;

  const highlightContextDataItems = getHighlightContextData({
    event,
    project,
    organization,
    highlightContext,
    location,
  });
  const highlightContextRows = highlightContextDataItems.reduce<React.ReactNode[]>(
    (rowList, {alias, data}, i) => {
      const meta = getContextMeta(event, alias);
      const newRows = data.map((item, j) => (
        <HighlightContextContent
          key={`highlight-ctx-${i}-${j}`}
          meta={meta}
          item={item}
          alias={alias}
          config={{includeAliasInSubject: true}}
          data-test-id="highlight-context-row"
        />
      ));
      return [...rowList, ...newRows];
    },
    []
  );

  const highlightTagItems = getHighlightTagData({event, highlightTags});
  const highlightTagRows = highlightTagItems.map((content, i) => (
    <EventTagsTreeRow
      key={`highlight-tag-${i}`}
      content={content}
      event={event}
      tagKey={content.originalTag.key}
      project={detailedProject ?? project}
      config={{
        disableActions: content.value === EMPTY_HIGHLIGHT_DEFAULT,
        disableRichValue: content.value === EMPTY_HIGHLIGHT_DEFAULT,
      }}
      data-test-id="highlight-tag-row"
    />
  ));

  const rows = [...highlightTagRows, ...highlightContextRows];
  const columns: React.ReactNode[] = [];
  const columnSize = Math.ceil(rows.length / columnCount);
  for (let i = 0; i < rows.length; i += columnSize) {
    columns.push(
      <HighlightColumn key={`highlight-column-${i}`}>
        {rows.slice(i, i + columnSize)}
      </HighlightColumn>
    );
  }

  return (
    <HighlightContainer columnCount={columnCount} ref={containerRef}>
      {isLoading ? (
        <EmptyHighlights>
          <HighlightsLoadingIndicator hideMessage size={50} />
        </EmptyHighlights>
      ) : hasDisabledHighlights ? (
        <EmptyHighlights>
          <EmptyHighlightsContent>
            {t("There's nothing here...")}
            <AddHighlightsButton
              size="xs"
              onClick={openEditHighlightsModal}
              {...editProps}
            >
              {t('Add Highlights')}
            </AddHighlightsButton>
          </EmptyHighlightsContent>
        </EmptyHighlights>
      ) : (
        columns
      )}
    </HighlightContainer>
  );
}

export default function HighlightsDataSection({
  viewAllRef,
  event,
  project,
}: HighlightsDataSectionProps) {
  const organization = useOrganization();
  const openForm = useFeedbackForm();

  const viewAllButton = viewAllRef ? (
    <Button
      onClick={() => {
        trackAnalytics('highlights.issue_details.view_all_clicked', {organization});
        viewAllRef?.current?.scrollIntoView({behavior: 'smooth'});
      }}
      size="xs"
    >
      {t('View All')}
    </Button>
  ) : null;

  return (
    <InterimSection
      key="event-highlights"
      type={FoldSectionKey.HIGHLIGHTS}
      title={t('Event Highlights')}
      help={tct(
        'Promoted tags and context items saved for this project. [link:Learn more]',
        {
          link: <ExternalLink openInNewTab href={HIGHLIGHT_DOCS_LINK} />,
        }
      )}
      isHelpHoverable
      data-test-id="event-highlights"
      actions={
        <ErrorBoundary mini>
          <ButtonBar gap={1}>
            {openForm && (
              <Button
                aria-label={t('Give Feedback')}
                icon={<IconMegaphone />}
                size={'xs'}
                onClick={() =>
                  openForm({
                    messagePlaceholder: t(
                      'How can we make tags, context or highlights more useful to you?'
                    ),
                    tags: {
                      ['feedback.source']: 'issue_details_highlights',
                      ['feedback.owner']: 'issues',
                    },
                  })
                }
              >
                {t('Feedback')}
              </Button>
            )}
            {viewAllButton}
            <EditHighlightsButton project={project} event={event} />
          </ButtonBar>
        </ErrorBoundary>
      }
    >
      <ErrorBoundary mini message={t('There was an error loading event highlights')}>
        <HighlightsData event={event} project={project} />
      </ErrorBoundary>
    </InterimSection>
  );
}

const HighlightContainer = styled(TreeContainer)<{columnCount: number}>`
  margin-top: 0;
  margin-bottom: ${p => p.theme.space(2)};
`;

const EmptyHighlights = styled('div')`
  padding: ${p => p.theme.space(2)} ${p => p.theme.space(1)};
  border-radius: ${p => p.theme.borderRadius};
  border: 1px dashed ${p => p.theme.translucentBorder};
  background: ${p => p.theme.bodyBackground};
  grid-column: 1 / -1;
  display: flex;
  text-align: center;
  justify-content: center;
  align-items: center;
  color: ${p => p.theme.subText};
`;

const EmptyHighlightsContent = styled('div')`
  text-align: center;
`;

const HighlightsLoadingIndicator = styled(LoadingIndicator)`
  margin: 0 auto;
`;

const AddHighlightsButton = styled(Button)`
  display: block;
  margin: ${p => p.theme.space(1)} auto 0;
`;

const HighlightColumn = styled(TreeColumn)`
  grid-column: span 1;
`;

const HighlightContextContent = styled(ContextCardContent)`
  font-size: ${p => p.theme.fontSizeSmall};
`;

export const highlightModalCss = css`
  width: 850px;
  padding: 0 ${p => p.theme.space(2)};
  margin: ${p => p.theme.space(2)} 0;
  /* Disable overriding margins with breakpoint on default modal */
  @media (min-width: ${theme.breakpoints.medium}) {
    margin: ${p => p.theme.space(2)} 0;
    padding: 0 ${p => p.theme.space(2)};
  }
`;
