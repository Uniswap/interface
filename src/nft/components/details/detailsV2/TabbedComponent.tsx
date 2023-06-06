import Row from 'components/Row'
import { useState } from 'react'
import styled from 'styled-components/macro'
import { ThemedText } from 'theme'

import { containerHorizontalPadding, containerStyles } from './shared'

const TabbedComponentContainer = styled.div<{ disableHorizontalPaddingForContent?: boolean }>`
  ${containerStyles}

  ${({ disableHorizontalPaddingForContent }) =>
    disableHorizontalPaddingForContent && 'padding-left: 0px; padding-right: 0px;'}
`

const TabsRow = styled(Row)<{ horizontalPaddingDisabled?: boolean }>`
  gap: 32px;
  width: 100;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid ${({ theme }) => theme.backgroundOutline};
`

const TabRowPadding = styled.div<{ horizontalPaddingDisabled?: boolean }>`
  ${({ horizontalPaddingDisabled }) => horizontalPaddingDisabled && containerHorizontalPadding}
`

const Tab = styled(ThemedText.SubHeader)<{ isActive: boolean; numTabs: number }>`
  color: ${({ theme, isActive }) => (isActive ? theme.textPrimary : theme.textTertiary)};
  line-height: 24px;
  cursor: ${({ numTabs }) => (numTabs > 1 ? 'pointer' : 'default')};

  &:hover {
    opacity: ${({ numTabs, theme }) => numTabs > 1 && theme.opacity.hover};
  }
`

const TabNumBubble = styled(ThemedText.UtilityBadge)`
  background: ${({ theme }) => theme.backgroundOutline};
  border-radius: 4px;
  padding: 2px 4px;
  color: ${({ theme }) => theme.textSecondary};
  line-height: 12px;
`

export interface Tab {
  title: React.ReactNode
  key: string
  content: JSX.Element
  count?: number
  disableHorizontalPaddingForContent?: boolean
}

interface TabbedComponentProps {
  tabs: Map<string, Tab>
  defaultTabKey?: string
}

export const TabbedComponent = ({ tabs, defaultTabKey }: TabbedComponentProps) => {
  const firstKey = tabs.keys().next().value
  const [activeKey, setActiveKey] = useState(defaultTabKey ?? firstKey)
  const activeTab = tabs.get(activeKey)
  const activeContent = activeTab?.content
  const tabArray = Array.from(tabs.values())
  const disableHorizontalPaddingForContent = activeTab?.disableHorizontalPaddingForContent

  return (
    <TabbedComponentContainer disableHorizontalPaddingForContent={disableHorizontalPaddingForContent}>
      <TabRowPadding horizontalPaddingDisabled={disableHorizontalPaddingForContent}>
        <TabsRow>
          {tabArray.map((tab) => (
            <Tab
              isActive={activeKey === tab.key}
              numTabs={tabArray.length}
              onClick={() => setActiveKey(tab.key)}
              key={tab.key}
            >
              <Row gap="8px">
                {tab.title}
                {!!tab.count && <TabNumBubble>{tab.count > 10 ? '10+' : tab.count}</TabNumBubble>}
              </Row>
            </Tab>
          ))}
        </TabsRow>
      </TabRowPadding>
      {activeContent}
    </TabbedComponentContainer>
  )
}
