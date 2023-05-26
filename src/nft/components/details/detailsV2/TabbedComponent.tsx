import Row from 'components/Row'
import { useState } from 'react'
import styled from 'styled-components/macro'
import { ThemedText } from 'theme'

import { containerStyles } from './shared'

const TabbedComponentContainer = styled.div`
  ${containerStyles}
`

const TabsRow = styled(Row)`
  gap: 32px;
  width: 100;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid ${({ theme }) => theme.backgroundOutline};
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
}

interface TabbedComponentProps {
  tabs: Map<string, Tab>
  defaultTabKey?: string
}

export const TabbedComponent = ({ tabs, defaultTabKey }: TabbedComponentProps) => {
  const firstKey = tabs.keys().next().value
  const [activeKey, setActiveKey] = useState(defaultTabKey ?? firstKey)
  const activeContent = tabs.get(activeKey)?.content
  const tabArray = Array.from(tabs.values())
  return (
    <TabbedComponentContainer>
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
      {activeContent}
    </TabbedComponentContainer>
  )
}
