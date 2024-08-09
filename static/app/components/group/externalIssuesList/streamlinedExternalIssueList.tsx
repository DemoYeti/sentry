import styled from '@emotion/styled';

import {Button, type ButtonProps, LinkButton} from 'sentry/components/button';
import {DropdownMenu} from 'sentry/components/dropdownMenu';
import ErrorBoundary from 'sentry/components/errorBoundary';
import useStreamLinedExternalIssueData from 'sentry/components/group/externalIssuesList/useStreamlinedExternalIssueData';
import Placeholder from 'sentry/components/placeholder';
import * as SidebarSection from 'sentry/components/sidebarSection';
import {Tooltip} from 'sentry/components/tooltip';
import {t} from 'sentry/locale';
import {space} from 'sentry/styles/space';
import type {Event} from 'sentry/types/event';
import type {Group} from 'sentry/types/group';
import type {Project} from 'sentry/types/project';

interface StreamlinedExternalIssueListProps {
  event: Event;
  group: Group;
  project: Project;
}

export function StreamlinedExternalIssueList({
  group,
  event,
  project,
}: StreamlinedExternalIssueListProps) {
  const {isLoading, integrations, linkedIssues} = useStreamLinedExternalIssueData({
    group,
    event,
    project,
  });

  if (isLoading) {
    return (
      <SidebarSection.Wrap data-test-id="linked-issues">
        <SidebarSection.Title>{t('Issue Tracking')}</SidebarSection.Title>
        <SidebarSection.Content>
          <Placeholder height="120px" />
        </SidebarSection.Content>
      </SidebarSection.Wrap>
    );
  }

  return (
    <SidebarSection.Wrap data-test-id="linked-issues">
      <SidebarSection.Title>{t('Issue Tracking')}</SidebarSection.Title>
      <SidebarSection.Content>
        <IssueActionWrapper>
          {linkedIssues.map(linkedIssue => (
            <ErrorBoundary key={linkedIssue.key} mini>
              <Tooltip
                overlayStyle={{maxWidth: '400px'}}
                position="bottom"
                title={
                  <LinkedIssueTooltipWrapper>
                    <LinkedIssueName>{linkedIssue.title}</LinkedIssueName>
                    <HorizontalSeparator />
                    <UnlinkButton
                      priority="link"
                      size="zero"
                      onClick={linkedIssue.onUnlink}
                    >
                      {t('Unlink issue')}
                    </UnlinkButton>
                  </LinkedIssueTooltipWrapper>
                }
                isHoverable
              >
                <LinkedIssue
                  href={linkedIssue.url}
                  external
                  size="zero"
                  icon={linkedIssue.displayIcon}
                >
                  <IssueActionName>{linkedIssue.displayName}</IssueActionName>
                </LinkedIssue>
              </Tooltip>
            </ErrorBoundary>
          ))}
          {integrations.length
            ? integrations.map(integration => {
                const sharedButtonProps: ButtonProps = {
                  size: 'zero',
                  icon: integration.displayIcon,
                  children: <IssueActionName>{integration.displayName}</IssueActionName>,
                };

                if (integration.actions.length === 1) {
                  return (
                    <ErrorBoundary key={integration.key} mini>
                      <IssueActionButton
                        {...sharedButtonProps}
                        onClick={integration.actions[0].onClick}
                      />
                    </ErrorBoundary>
                  );
                }

                return (
                  <ErrorBoundary key={integration.key} mini>
                    <DropdownMenu
                      trigger={triggerProps => (
                        <IssueActionButton {...sharedButtonProps} {...triggerProps} />
                      )}
                      items={integration.actions.map(action => ({
                        key: action.name,
                        label: action.name,
                        onAction: action.onClick,
                      }))}
                    />
                  </ErrorBoundary>
                );
              })
            : null}
        </IssueActionWrapper>
      </SidebarSection.Content>
    </SidebarSection.Wrap>
  );
}

const IssueActionWrapper = styled('div')`
  display: flex;
  flex-wrap: wrap;
  gap: ${space(1)};
`;

const LinkedIssue = styled(LinkButton)`
  display: flex;
  align-items: center;
  padding: ${space(0.5)} ${space(0.75)};
  line-height: 1.05;
  border: 1px dashed ${p => p.theme.border};
  border-radius: ${p => p.theme.borderRadius};
  font-weight: normal;
`;

const IssueActionButton = styled(Button)`
  display: flex;
  align-items: center;
  padding: ${space(0.5)} ${space(0.75)};
  line-height: 1.05;
  border: 1px dashed ${p => p.theme.border};
  border-radius: ${p => p.theme.borderRadius};
  font-weight: normal;
`;

const IssueActionName = styled('div')`
  ${p => p.theme.overflowEllipsis}
  max-width: 200px;
`;

const LinkedIssueTooltipWrapper = styled('div')`
  display: flex;
  align-items: center;
  gap: ${space(0.5)};
  white-space: nowrap;
`;

const LinkedIssueName = styled('div')`
  ${p => p.theme.overflowEllipsis}
  margin-right: ${space(0.25)};
`;

const HorizontalSeparator = styled('div')`
  width: 1px;
  height: 14px;
  background: ${p => p.theme.border};
`;

const UnlinkButton = styled(Button)`
  color: ${p => p.theme.subText};
`;
