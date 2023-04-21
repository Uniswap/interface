import Row from 'components/Row'
import { ChevronUpIcon } from 'nft/components/icons'
import { useReducer, useState } from 'react'
import styled from 'styled-components/macro'
import { ThemedText } from 'theme'

import { containerStyles } from './shared'

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

const Chevron = styled(ChevronUpIcon)<{ isOpen: boolean }>`
  height: 24px;
  width: 24px;
  fill: ${({ theme }) => theme.textSecondary};
  transition: ${({
    theme: {
      transition: { duration },
    },
  }) => `${duration.fast} transform`};
  transform: ${({ isOpen }) => `rotate(${isOpen ? 0 : 180}deg)`};
  cursor: pointer;
  margin-left: auto;
  margin-right: 0;
`

export interface Tab {
  title: React.ReactNode
  key: string
  content: JSX.Element
}

interface TabbedComponentProps {
  tabs: Tab[]
  defaultTabIndex?: number
  style?: React.CSSProperties
}

export const TabbedComponent = ({ tabs, defaultTabIndex = 0, style }: TabbedComponentProps) => {
  const [activeTab, setActiveTab] = useState(tabs[defaultTabIndex].key)
  const [isOpen, toggleIsOpen] = useReducer((s) => !s, true)
  const activeContent = tabs.find((tab) => tab.key === activeTab)?.content
  return (
    <TabbedComponentContainer style={style}>
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
        <Chevron isOpen={isOpen} onClick={toggleIsOpen} />
      </TabsRow>
      {isOpen && activeContent}
    </TabbedComponentContainer>
  )
}
