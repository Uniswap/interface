import { ChainSlug, isChainUrlParam } from 'constants/chains'
import { t } from 'i18n'
import { capitalize } from 'tsafe/capitalize'

import { ExploreTab } from './Explore'

export const getExploreTitle = (path?: string) => {
  const parts = path?.split('/').filter((part) => part !== '')
  const tabsToFind: string[] = [ExploreTab.Pools, ExploreTab.Tokens, ExploreTab.Transactions]
  const tab = parts?.find((part) => tabsToFind.includes(part)) ?? ExploreTab.Tokens

  const network: ChainSlug = parts?.find(isChainUrlParam) ?? 'ethereum'

  return t(`Explore top {{tab}} on {{network}} on Uniswap`, {
    tab,
    network: capitalize(network),
  })
}
