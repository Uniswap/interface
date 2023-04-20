import Column from 'components/Column'
import Row from 'components/Row'
import { useState } from 'react'
import styled from 'styled-components/macro'
import { ThemedText } from 'theme'

import { containerStyles } from './shared'

const TabbedContentContainer = styled(Column)<{ noContentPadding?: boolean }>`
  width: 100%;
  align-self: flex-start;
  padding: ${({ noContentPadding }) => (noContentPadding ? `16px 0px` : `16px 20px`)};

  ${containerStyles}
`

const TabsRow = styled(Row)<{ selfPadding?: boolean }>`
  padding: ${({ selfPadding }) => selfPadding && `0px 20px`};
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
  noContentPadding?: boolean
}

export const TabbedComponent = ({ tabs, defaultTab, noContentPadding = false }: TabbedComponentProps) => {
  const [activeTab, setActiveTab] = useState(defaultTab.key)
  const activeContent = tabs.find((tab) => tab.key === activeTab)?.content
  return (
    <TabbedContentContainer noContentPadding={noContentPadding}>
      <TabsRow selfPadding={noContentPadding}>
        {tabs.map((tab) => (
          <Tab isActive={activeTab === tab.key} onClick={() => setActiveTab(tab.key)} key={tab.key}>
            {tab.title}
          </Tab>
        ))}
      </TabsRow>
      {activeContent}
    </TabbedContentContainer>
  )
}
