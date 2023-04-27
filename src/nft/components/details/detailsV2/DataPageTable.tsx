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
      count: 11, // TODO Replace Placeholder with real data
    },
  ],
  [
    TableTabsKeys.Listings,
    {
      title: <Trans>Listings</Trans>,
      key: TableTabsKeys.Listings,
      content: <ListingsTableContent />,
      count: 11, // TODO Replace Placeholder with real data
    },
  ],
])

export const DataPageTable = () => {
  return <TabbedComponent tabs={TableTabs} />
}
