import { ExploreTab } from 'pages/Explore/constants'
import { capitalize } from 'tsafe/capitalize'
import i18n from 'uniswap/src/i18n'
import { logger } from 'utilities/src/logger/logger'
import { isChainUrlParam } from 'utils/chainParams'

export const getExploreTitle = (path?: string) => {
  const parts = path?.split('/').filter((part) => part !== '')
  const tabsToFind: string[] = [ExploreTab.Pools, ExploreTab.Tokens, ExploreTab.Transactions]
  const tab = parts?.find((part) => tabsToFind.includes(part)) ?? ExploreTab.Tokens

  const networkPart: string = parts?.find(isChainUrlParam) ?? 'ethereum'
  const network = capitalize(networkPart)

  switch (tab) {
    case ExploreTab.Pools:
      return i18n.t(`web.explore.title.pools`, {
        network,
      })
    case ExploreTab.Tokens:
      return i18n.t(`web.explore.title.tokens`, {
        network,
      })
    case ExploreTab.Transactions:
      return i18n.t(`web.explore.title.transactions`, {
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
  const network: string = parts?.find(isChainUrlParam) ?? 'ethereum'

  return i18n.t(`web.explore.description`, {
    network: capitalize(network),
  })
}
