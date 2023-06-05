import { Trans } from '@lingui/macro'
import { GenieAsset } from 'nft/types'
import { useMemo } from 'react'

import { ActivityTableContent } from './ActivityTableContent'
import { ListingsTableContent } from './ListingsTableContent'
import { OffersTableContent } from './OffersTableContent'
import { Tab, TabbedComponent } from './TabbedComponent'

export enum TableTabsKeys {
  Activity = 'activity',
  Offers = 'offers',
  Listings = 'listings',
}

export const DataPageTable = ({ asset }: { asset: GenieAsset }) => {
  const TableTabs: Map<string, Tab> = useMemo(
    () =>
      new Map([
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
            content: <OffersTableContent asset={asset} />,
            count: 11, // TODO Replace Placeholder with real data
          },
        ],
        [
          TableTabsKeys.Listings,
          {
            title: <Trans>Listings</Trans>,
            key: TableTabsKeys.Listings,
            content: <ListingsTableContent asset={asset} />,
            count: asset.sellorders?.length,
          },
        ],
      ]),
    [asset]
  )
  return <TabbedComponent tabs={TableTabs} />
}
