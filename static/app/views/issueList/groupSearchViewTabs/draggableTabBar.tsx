import 'intersection-observer'; // polyfill

import {useEffect, useState} from 'react';
import styled from '@emotion/styled';
import type {Node} from '@react-types/shared';
import type {LocationDescriptor} from 'history';

import Badge from 'sentry/components/badge/badge';
import {DraggableTabList} from 'sentry/components/draggableTabs/draggableTabList';
import type {DraggableTabListItemProps} from 'sentry/components/draggableTabs/item';
import type {MenuItemProps} from 'sentry/components/dropdownMenu';
import QueryCount from 'sentry/components/queryCount';
import {Tabs} from 'sentry/components/tabs';
import {t} from 'sentry/locale';
import {defined} from 'sentry/utils';
import {DraggableTabMenuButton} from 'sentry/views/issueList/groupSearchViewTabs/draggableTabMenuButton';
import EditableTabTitle from 'sentry/views/issueList/groupSearchViewTabs/editableTabTitle';
import type {IssueSortOptions} from 'sentry/views/issueList/utils';

// TODO(michaelsun): Move params that aren't necessary to draggableTabBar to parent
export interface Tab {
  key: string;
  label: string;
  query: string;
  querySort: IssueSortOptions;
  content?: React.ReactNode;
  id?: string;
  queryCount?: number;
  to?: LocationDescriptor;
  unsavedChanges?: [string, IssueSortOptions];
}

export interface DraggableTabBarProps {
  /**
   * Callback function to be called when the user reorders the tabs. Returns the
   * new order of the tabs along with their props.
   */
  onReorder: (newTabs: Tab[]) => void;
  selectedTabKey: string;
  setSelectedTabKey: (key: string) => void;
  setTabs: (tabs: Tab[]) => void;
  showTempTab: boolean;
  tabs: Tab[];
  /**
   * Callback function to be called when user clicks the `Add View` button.
   */
  onAddView?: () => void;
  /**
   * Callback function to be called when user clicks the `Delete` button.
   * Note: The `Delete` button only appears for persistent views
   */
  onDelete?: (newTabs: Tab[]) => void;
  /**
   * Callback function to be called when user clicks on the `Discard Changes` button.
   * Note: The `Discard Changes` button only appears for persistent views when `isChanged=true`
   */
  onDiscard?: () => void;
  /**
   * Callback function to be called when user clicks on the `Discard` button for temporary views.
   * Note: The `Discard` button only appears for temporary views
   */
  onDiscardTempView?: () => void;
  /**
   * Callback function to be called when user clicks the 'Duplicate' button.
   * Note: The `Duplicate` button only appears for persistent views
   */
  onDuplicate?: (newTabs: Tab[]) => void;
  /**
   * Callback function to be called when user clicks the 'Save' button.
   * Note: The `Save` button only appears for persistent views when `isChanged=true`
   */
  onSave?: () => void;
  /**
   * Callback function to be called when user clicks the 'Save View' button for temporary views.
   */
  onSaveTempView?: () => void;
  /**
   * Callback function to be called when user renames a tab.
   * Note: The `Rename` button only appears for persistent views
   */
  onTabRenamed?: (newTabs: Tab[], newLabel: string) => void;
  tempTab?: Tab;
  tempTabContent?: React.ReactNode;
  tempTabLabel?: string;
}

export function DraggableTabBar({
  selectedTabKey,
  setSelectedTabKey,
  tabs,
  setTabs,
  tempTab,
  showTempTab,
  onReorder,
  onAddView,
  onDelete,
  onDiscard,
  onDuplicate,
  onTabRenamed,
  onSave,
  onDiscardTempView,
  onSaveTempView,
}: DraggableTabBarProps) {
  // TODO: Extract this to a separate component encompassing Tab.Item in the future
  const [editingTabKey, setEditingTabKey] = useState<string | null>(null);

  useEffect(() => {
    if (!showTempTab && selectedTabKey === 'temporary-tab') {
      setSelectedTabKey(tabs[0].key);
    }
  }, [showTempTab, selectedTabKey, setSelectedTabKey, tabs]);

  const handleOnReorder: (
    newOrder: Node<DraggableTabListItemProps>[]
  ) => void = newOrder => {
    const newTabs = newOrder
      .map(node => {
        const foundTab = tabs.find(tab => tab.key === node.key);
        return foundTab?.key === node.key ? foundTab : null;
      })
      .filter(defined);
    setTabs(newTabs);
    onReorder?.(newTabs);
  };

  const handleOnDelete = () => {
    if (tabs.length > 1) {
      const newTabs = tabs.filter(tb => tb.key !== selectedTabKey);
      setTabs(newTabs);
      setSelectedTabKey(newTabs[0].key);
      onDelete?.(newTabs);
    }
  };

  const handleOnDuplicate = () => {
    const idx = tabs.findIndex(tb => tb.key === selectedTabKey);
    if (idx !== -1) {
      const duplicatedTab = tabs[idx];
      const newTabs = [
        ...tabs.slice(0, idx + 1),
        {
          ...duplicatedTab,
          key: `view-${idx + 1}`,
          label: `${duplicatedTab.label} (Copy)`,
          id: undefined,
        },
        ...tabs.slice(idx + 1).map((tab, i) => ({...tab, key: `view-${idx + 2 + i}`})),
      ];
      setTabs(newTabs);
      setSelectedTabKey(duplicatedTab.key);
      onDuplicate?.(newTabs);
    }
  };

  const handleOnTabRenamed = (newLabel: string, tabKey: string) => {
    const renamedTab = tabs.find(tb => tb.key === tabKey);
    if (renamedTab && newLabel !== renamedTab.label) {
      const newTabs = tabs.map(tab =>
        tab.key === renamedTab.key ? {...tab, label: newLabel} : tab
      );
      setTabs(newTabs);
      onTabRenamed?.(newTabs, newLabel);
    }
  };

  const makeMenuOptions = (tab: Tab): MenuItemProps[] => {
    if (tab.key === 'temporary-tab') {
      return makeTempViewMenuOptions({
        onSaveTempView: () => onSaveTempView?.(),
        onDiscardTempView: () => onDiscardTempView?.(),
      });
    }
    if (tab.unsavedChanges) {
      return makeUnsavedChangesMenuOptions({
        onRename: () => setEditingTabKey(tab.key),
        onDuplicate: () => handleOnDuplicate(),
        onDelete: tabs.length > 1 ? () => handleOnDelete() : undefined,
        onSave: () => onSave?.(),
        onDiscard: () => onDiscard?.(),
      });
    }
    return makeDefaultMenuOptions({
      onRename: () => setEditingTabKey(tab.key),
      onDuplicate: () => handleOnDuplicate(),
      onDelete: tabs.length > 1 ? () => handleOnDelete() : undefined,
    });
  };

  const allTabs = tempTab ? [...tabs, tempTab] : tabs;

  return (
    <Tabs value={selectedTabKey} onChange={setSelectedTabKey}>
      <DraggableTabList
        onReorder={handleOnReorder}
        selectedKey={selectedTabKey}
        showTempTab={showTempTab}
        onAddView={onAddView}
        orientation="horizontal"
        hideBorder
      >
        {allTabs.map(tab => (
          <DraggableTabList.Item
            textValue={`${tab.label} tab`}
            key={tab.key}
            hidden={tab.key === 'temporary-tab' && !showTempTab}
            to={tab.to}
          >
            <TabContentWrap selected={selectedTabKey === tab.key}>
              <EditableTabTitle
                label={tab.label}
                isEditing={editingTabKey === tab.key}
                setIsEditing={isEditing => setEditingTabKey(isEditing ? tab.key : null)}
                onChange={newLabel => handleOnTabRenamed(newLabel.trim(), tab.key)}
              />
              {tab.key !== 'temporary-tab' && tab.queryCount !== undefined && (
                <StyledBadge>
                  <QueryCount
                    hideParens
                    hideIfEmpty={false}
                    count={tab.queryCount}
                    max={1000}
                  />
                </StyledBadge>
              )}
              {selectedTabKey === tab.key && (
                <DraggableTabMenuButton
                  hasUnsavedChanges={!!tab.unsavedChanges}
                  menuOptions={makeMenuOptions(tab)}
                  aria-label={`${tab.label} Tab Options`}
                />
              )}
            </TabContentWrap>
          </DraggableTabList.Item>
        ))}
      </DraggableTabList>
    </Tabs>
  );
}

const makeDefaultMenuOptions = ({
  onRename,
  onDuplicate,
  onDelete,
}: {
  onDelete?: (key: string) => void;
  onDuplicate?: (key: string) => void;
  onRename?: (key: string) => void;
}): MenuItemProps[] => {
  const menuOptions: MenuItemProps[] = [
    {
      key: 'rename-tab',
      label: t('Rename'),
      onAction: onRename,
    },
    {
      key: 'duplicate-tab',
      label: t('Duplicate'),
      onAction: onDuplicate,
    },
  ];
  if (onDelete) {
    menuOptions.push({
      key: 'delete-tab',
      label: t('Delete'),
      priority: 'danger',
      onAction: onDelete,
    });
  }
  return menuOptions;
};

const makeUnsavedChangesMenuOptions = ({
  onRename,
  onDuplicate,
  onDelete,
  onSave,
  onDiscard,
}: {
  onDelete?: (key: string) => void;
  onDiscard?: (key: string) => void;
  onDuplicate?: (key: string) => void;
  onRename?: (key: string) => void;
  onSave?: (key: string) => void;
}): MenuItemProps[] => {
  return [
    {
      key: 'changed',
      children: [
        {
          key: 'save-changes',
          label: t('Save Changes'),
          priority: 'primary',
          onAction: onSave,
        },
        {
          key: 'discard-changes',
          label: t('Discard Changes'),
          onAction: onDiscard,
        },
      ],
    },
    {
      key: 'default',
      children: makeDefaultMenuOptions({onRename, onDuplicate, onDelete}),
    },
  ];
};

const makeTempViewMenuOptions = ({
  onSaveTempView,
  onDiscardTempView,
}: {
  onDiscardTempView: () => void;
  onSaveTempView: () => void;
}): MenuItemProps[] => {
  return [
    {
      key: 'save-changes',
      label: t('Save View'),
      priority: 'primary',
      onAction: onSaveTempView,
    },
    {
      key: 'discard-changes',
      label: t('Discard'),
      onAction: onDiscardTempView,
    },
  ];
};

const TabContentWrap = styled('span')<{selected: boolean}>`
  white-space: nowrap;
  display: flex;
  align-items: center;
  flex-direction: row;
  padding: 0;
  gap: 6px;
  ${p => (p.selected ? 'z-index: 1;' : 'z-index: 0;')}
`;

const StyledBadge = styled(Badge)`
  display: flex;
  height: 16px;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: transparent;
  border: 1px solid ${p => p.theme.gray200};
  color: ${p => p.theme.gray300};
  margin-left: 0;
`;
