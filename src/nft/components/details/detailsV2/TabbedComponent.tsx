import Row from 'components/Row'
import { useState } from 'react'
import styled from 'styled-components/macro'
import { ThemedText } from 'theme'

const TabsRow = styled(Row)`
  gap: 32px;
  margin-bottom: 12px;
  width: 100;
`

const Tab = styled(ThemedText.SubHeader)<{ isActive: boolean }>`
  color: ${({ theme, isActive }) => (isActive ? theme.textPrimary : theme.textTertiary)};
  line-height: 24px;
  cursor: pointer;

  &:hover {
    opacity: ${({ theme }) => theme.opacity.hover};
  }
`

export interface Tab {
  title: React.ReactNode
  key: string
  content: JSX.Element
}

interface TabbedComponentProps {
  tabs: Tab[]
  defaultTab: Tab
}

export const TabbedComponent = ({ tabs, defaultTab }: TabbedComponentProps) => {
  const [activeTab, setActiveTab] = useState(defaultTab.key)
  const activeContent = tabs.find((tab) => tab.key === activeTab)?.content
  return (
    <>
      <TabsRow>
        {tabs.map((tab) => (
          <Tab isActive={activeTab === tab.key} onClick={() => setActiveTab(tab.key)} key={tab.key}>
            {tab.title}
          </Tab>
        ))}
      </TabsRow>
      {activeContent}
    </>
  )
}
