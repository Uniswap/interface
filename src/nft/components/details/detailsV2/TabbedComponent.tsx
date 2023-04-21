import Row from 'components/Row'
import { useState } from 'react'
import styled from 'styled-components/macro'
import { ThemedText } from 'theme'

import { containerStyles } from './shared'

const TabbedComponentContainer = styled.div`
  height: 288px;

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

export interface Tab {
  title: React.ReactNode
  key: string
  content: JSX.Element
}

interface TabbedComponentProps {
  tabs: Map<string, Tab>
  defaultTabKey?: string
  style?: React.CSSProperties
}

export const TabbedComponent = ({ tabs, defaultTabKey, style }: TabbedComponentProps) => {
  const firstKey = tabs.keys().next().value
  const [activeKey, setActiveKey] = useState(defaultTabKey ?? firstKey)
  const activeContent = tabs.get(activeKey)?.content
  const tabArray = Array.from(tabs.values())
  return (
    <TabbedComponentContainer style={style}>
      <TabsRow>
        {tabArray.map((tab) => (
          <Tab
            isActive={activeKey === tab.key}
            numTabs={tabArray.length}
            onClick={() => setActiveKey(tab.key)}
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
