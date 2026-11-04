import { capitalize } from 'tsafe/capitalize'
import i18n from 'uniswap/src/i18n'
import { logger } from 'utilities/src/logger/logger'
import { ExploreTab } from '~/types/explore'
import { isChainUrlParam } from '~/utils/params/chainParams'

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

function getCategorySlugFromPath(path?: string): string | undefined {
  const slug = path
    ?.split('/')
    .filter((part) => part !== '')
    .at(-1)
  return !slug || slug.startsWith(':') ? undefined : capitalize(slug.replace(/-/g, ' '))
}

export const getCategoryDetailsTitle = (path?: string) => {
  const category = getCategorySlugFromPath(path)
  return category ? i18n.t('categoryDetails.pageTitle.withCategory', { category }) : i18n.t('categoryDetails.pageTitle')
}

export const getPoolCategoryDetailsTitle = (path?: string) => {
  // Most pool category ids end in "-pools" (stable-pools); the title already says pools.
  const category = getCategorySlugFromPath(path)?.replace(/ pools$/i, '')
  return category
    ? i18n.t('categoryDetails.pools.pageTitle.withCategory', { category })
    : i18n.t('categoryDetails.pools.pageTitle')
}

export const getExploreDescription = (path?: string) => {
  const parts = path?.split('/').filter((part) => part !== '')
  const network: string = parts?.find(isChainUrlParam) ?? 'ethereum'

  return i18n.t(`web.explore.description`, {
    network: capitalize(network),
  })
}
