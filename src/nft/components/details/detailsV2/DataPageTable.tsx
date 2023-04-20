import { Trans } from '@lingui/macro'
import Column from 'components/Column'
import styled from 'styled-components/macro'

import { ActivityTableContent } from './ActivityTableContent'
import { ListingsTableContent } from './ListingsTableContent'
import { OffersTableContent } from './OffersTableContent'
import { containerStyles } from './shared'
import { Tab, TabbedComponent } from './TabbedComponent'

const TableContainer = styled(Column)`
  width: 100%;
  height: 604px;
  align-self: flex-start;
  padding: 20px 0px 16px;

  ${containerStyles}
`

const TableTabs: Array<Tab> = [
  {
    title: <Trans>Activity</Trans>,
    key: 'activity',
    content: <ActivityTableContent />,
  },
  {
    title: <Trans>Offers</Trans>,
    key: 'offers',
    content: <OffersTableContent />,
  },
  {
    title: <Trans>Listings</Trans>,
    key: 'listings',
    content: <ListingsTableContent />,
  },
]

export const DataPageTable = () => {
  return (
    <TableContainer>
      <TabbedComponent tabs={TableTabs} defaultTab={TableTabs[0]} />
    </TableContainer>
  )
}
