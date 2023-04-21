import { Trans } from '@lingui/macro'

import { ActivityTableContent } from './ActivityTableContent'
import { ListingsTableContent } from './ListingsTableContent'
import { OffersTableContent } from './OffersTableContent'
import { Tab, TabbedComponent } from './TabbedComponent'

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
      title: <Trans>Offers</Trans>,
      key: TableTabsKeys.Offers,
      content: <OffersTableContent />,
    },
  ],
  [
    TableTabsKeys.Listings,
    {
      title: <Trans>Listings</Trans>,
      key: TableTabsKeys.Listings,
      content: <ListingsTableContent />,
    },
  ],
])

export const DataPageTable = () => {
  return <TabbedComponent tabs={TableTabs} style={{ height: '604px' }} />
}
