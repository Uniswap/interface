import Column from 'components/Column'
import Row from 'components/Row'
import { useState } from 'react'
import styled from 'styled-components/macro'
import { ThemedText } from 'theme'

import { ActivityTableContent } from './ActivityTableContent'
import { ListingsTableContent } from './ListingsTableContent'
import { OffersTableContent } from './OffersTableContent'
import { containerStyles } from './shared'

const TableContainer = styled(Column)`
  width: 100%;
  height: 604px;
  align-self: flex-start;
  padding: 20px 0px 16px;

  ${containerStyles}
`

const TabsRow = styled(Row)`
  gap: 32px;
  margin-bottom: 24px;
  width: 100;
  padding: 0px 20px;
`

const Tab = styled(ThemedText.SubHeader)<{ isActive: boolean }>`
  color: ${({ theme, isActive }) => (isActive ? theme.textPrimary : theme.textTertiary)};
  line-height: 24px;
  cursor: pointer;

  &:hover {
    opacity: ${({ theme }) => theme.opacity.hover};
  }
`

enum TableTabs {
  Activity,
  Offers,
  Listings,
}

export const DataPageTable = () => {
  const [activeTab, setActiveTab] = useState(TableTabs.Activity)

  let activeTabContent
  switch (activeTab) {
    case TableTabs.Activity:
      activeTabContent = <ActivityTableContent />
      break
    case TableTabs.Offers:
      activeTabContent = <OffersTableContent />
      break
    case TableTabs.Listings:
      activeTabContent = <ListingsTableContent />
      break
  }

  return (
    <TableContainer>
      <TabsRow>
        <Tab isActive={activeTab === TableTabs.Activity} onClick={() => setActiveTab(TableTabs.Activity)}>
          Activity
        </Tab>
        <Tab isActive={activeTab === TableTabs.Offers} onClick={() => setActiveTab(TableTabs.Offers)}>
          Offers
        </Tab>
        <Tab isActive={activeTab === TableTabs.Listings} onClick={() => setActiveTab(TableTabs.Listings)}>
          Listings
        </Tab>
      </TabsRow>
      {activeTabContent}
    </TableContainer>
  )
}
