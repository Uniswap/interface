import { ChainSlug, isChainUrlParam } from 'constants/chains'
import { ExploreTab } from 'pages/Explore'
import { capitalize } from 'tsafe/capitalize'
import { t } from 'uniswap/src/i18n'
import { logger } from 'utilities/src/logger/logger'

export const getExploreTitle = (path?: string) => {
  const parts = path?.split('/').filter((part) => part !== '')
  const tabsToFind: string[] = [ExploreTab.Pools, ExploreTab.Tokens, ExploreTab.Transactions]
  const tab = parts?.find((part) => tabsToFind.includes(part)) ?? ExploreTab.Tokens

  const networkPart: ChainSlug = parts?.find(isChainUrlParam) ?? 'ethereum'
  const network = capitalize(networkPart)

  switch (tab) {
    case ExploreTab.Pools:
      return t(`web.explore.title.pools`, {
        network,
      })
    case ExploreTab.Tokens:
      return t(`web.explore.title.tokens`, {
        network,
      })
    case ExploreTab.Transactions:
      return t(`web.explore.title.transactions`, {
        network,
      })
    default:
      logger.error(`Unavailable explore title for tab ${tab}`, {
        tags: {
          file: 'getExploreTitle',
          function: 'getExploreTitle',
        },
      })
      return ''
  }
}

export const getExploreDescription = (path?: string) => {
  const parts = path?.split('/').filter((part) => part !== '')
  const network: ChainSlug = parts?.find(isChainUrlParam) ?? 'ethereum'

  return t(`web.explore.description`, {
    network: capitalize(network),
  })
}
