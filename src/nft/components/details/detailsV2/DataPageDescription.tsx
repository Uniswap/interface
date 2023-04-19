import Row from 'components/Row'
import { useState } from 'react'
import styled from 'styled-components/macro'
import { ThemedText } from 'theme'

import { containerStyles } from './shared'

const DescriptionContainer = styled.div`
  height: 288px;
  padding: 16px 20px 20px;

  ${containerStyles}
`

const TabsRow = styled(Row)`
  gap: 24px;
  margin-bottom: 24px;
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

enum ContainerTabs {
  Description,
  Details,
}

export const DataPageDescription = () => {
  const [activeTab, setActiveTab] = useState(ContainerTabs.Description)
  return (
    <DescriptionContainer>
      <TabsRow>
        <Tab isActive={activeTab === ContainerTabs.Description} onClick={() => setActiveTab(ContainerTabs.Description)}>
          Description
        </Tab>
        <Tab isActive={activeTab === ContainerTabs.Details} onClick={() => setActiveTab(ContainerTabs.Details)}>
          Details
        </Tab>
      </TabsRow>
      {activeTab === ContainerTabs.Description ? <DescriptionContent /> : <DetailsContent />}
    </DescriptionContainer>
  )
}

const DescriptionContent = () => {
  return <div>Description Content</div>
}

const DetailsContent = () => {
  return <div>Details Content</div>
}
