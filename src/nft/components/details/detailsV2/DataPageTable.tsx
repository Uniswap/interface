import { Trans } from '@lingui/macro'

import { ActivityTableContent } from './ActivityTableContent'
import { ListingsTableContent } from './ListingsTableContent'
import { OffersTableContent } from './OffersTableContent'
import { Tab, TabbedComponent, TabTitleWithBubble } from './TabbedComponent'

export const TableContentHeight = 568

const TableTabs: Array<Tab> = [
  {
    title: <Trans>Activity</Trans>,
    key: 'activity',
    content: <ActivityTableContent />,
  },
  {
    title: <TabTitleWithBubble title={<Trans>Offers</Trans>} bubbleNumber={/* placeholder */ 11} />,
    key: 'offers',
    content: <OffersTableContent />,
  },
  {
    title: <TabTitleWithBubble title={<Trans>Listings</Trans>} bubbleNumber={/* placeholder */ 11} />,
    key: 'listings',
    content: <ListingsTableContent />,
  },
]

export const DataPageTable = () => {
  return <TabbedComponent tabs={TableTabs} />
}
