import Row from 'components/Row'
import { useState } from 'react'
import styled from 'styled-components/macro'
import { ThemedText } from 'theme'

import { containerStyles, getBubbleText } from './shared'

const TabbedComponentContainer = styled.div`
  ${containerStyles}
`

const TabsRow = styled(Row)`
  gap: 32px;
  margin-bottom: 12px;
  width: 100;
`

const Tab = styled(ThemedText.SubHeader)<{ isActive: boolean; numTabs: number }>`
  color: ${({ theme, isActive }) => (isActive ? theme.textPrimary : theme.textTertiary)};
  line-height: 24px;
  cursor: ${({ numTabs }) => (numTabs > 1 ? 'pointer' : 'default')};

  &:hover {
    opacity: ${({ numTabs, theme }) => numTabs > 1 && theme.opacity.hover}};
  }
`

const TabNumBubble = styled(ThemedText.UtilityBadge)`
  background: ${({ theme }) => theme.backgroundOutline};
  border-radius: 4px;
  padding: 2px 4px;
  color: ${({ theme }) => theme.textSecondary};
  line-height: 12px;
`

export const TabTitleWithBubble = ({ title, bubbleNumber }: { title: React.ReactNode; bubbleNumber?: number }) => {
  return (
    <Row gap="8px">
      {title}
      {bubbleNumber && <TabNumBubble>{getBubbleText(bubbleNumber)}</TabNumBubble>}
    </Row>
  )
}

export interface Tab {
  title: React.ReactNode
  key: string
  content: JSX.Element
}

interface TabbedComponentProps {
  tabs: Tab[]
  defaultTabIndex?: number
}

export const TabbedComponent = ({ tabs, defaultTabIndex = 0 }: TabbedComponentProps) => {
  const [activeTab, setActiveTab] = useState(tabs[defaultTabIndex].key)
  const activeContent = tabs.find((tab) => tab.key === activeTab)?.content
  return (
    <TabbedComponentContainer>
      <TabsRow>
        {tabs.map((tab) => (
          <Tab
            isActive={activeTab === tab.key}
            numTabs={tabs.length}
            onClick={() => setActiveTab(tab.key)}
            key={tab.key}
          >
            {tab.title}
          </Tab>
        ))}
      </TabsRow>
      {activeContent}
    </TabbedComponentContainer>
  )
}
