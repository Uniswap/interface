import { Trans } from '@lingui/macro'
import styled from 'styled-components/macro'

import { ActivityTableContent } from './ActivityTableContent'
import { ListingsTableContent } from './ListingsTableContent'
import { OffersTableContent } from './OffersTableContent'
import { Tab, TabbedComponent, TabTitleWithBubble } from './TabbedComponent'

export const TableContentContainer = styled.div`
  height: 568px;
`

enum TableTabsKeys {
  Activity = 'activity',
  Offers = 'offers',
  Listings = 'listings',
}

const TableTabs: Map<string, Tab> = new Map([
  [
    TableTabsKeys.Activity,
    {
      title: <Trans>Activity</Trans>,
      key: TableTabsKeys.Activity,
      content: <ActivityTableContent />,
    },
  ],
  [
    TableTabsKeys.Offers,
    {
      title: <TabTitleWithBubble title={<Trans>Offers</Trans>} bubbleNumber={/* placeholder */ 11} />,
      key: TableTabsKeys.Offers,
      content: <OffersTableContent />,
    },
  ],
  [
    TableTabsKeys.Listings,
    {
      title: <TabTitleWithBubble title={<Trans>Listings</Trans>} bubbleNumber={/* placeholder */ 11} />,
      key: TableTabsKeys.Listings,
      content: <ListingsTableContent />,
    },
  ],
])

export const DataPageTable = () => {
  return <TabbedComponent tabs={TableTabs} />
}
