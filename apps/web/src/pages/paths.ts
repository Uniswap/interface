// This is just an array of the app's defined paths that can be used in our Cloudflare Functions.
// Do not add any imports to this file.
// The array is kept up to date via the tests in src/pages/paths.test.ts

import { t } from '@lingui/macro'
import { getValidUrlChainName } from 'graphql/data/util'
import { capitalize } from 'tsafe/capitalize'

import { ExploreTab } from './Explore'

export const paths = [
  '/',
  '/explore',
  '/explore',
  '/explore/tokens/:chainName/:tokenAddress',
  '/tokens',
  '/tokens/:chainName',
  '/tokens/:chainName/:tokenAddress',
  '/explore/pools/:chainName/:poolAddress',
  '/vote/*',
  '/create-proposal',
  '/send',
  '/swap',
  '/pool/v2/find',
  '/pool/v2',
  '/pool',
  '/pool/:tokenId',
  '/pools/v2/find',
  '/pools/v2',
  '/pools',
  '/pools/:tokenId',
  '/add/v2',
  '/add',
  '/increase',
  '/remove/v2/:currencyIdA/:currencyIdB',
  '/remove/:tokenId',
  '/migrate/v2',
  '/migrate/v2/:address',
  '/nfts',
  '/nfts/asset/:contractAddress/:tokenId',
  '/nfts/profile',
  '/nfts/collection/:contractAddress',
  '/nfts/collection/:contractAddress/activity',
]

export const getExploreTitle = (path?: string) => {
  const parts = path?.split('/').filter((part) => part !== '')
  const tabsToFind: string[] = [ExploreTab.Pools, ExploreTab.Tokens, ExploreTab.Transactions]
  const tab = parts?.find((part) => tabsToFind.includes(part)) ?? ExploreTab.Tokens

  const network = parts?.find((part) => getValidUrlChainName(part)) ?? 'ethereum'

  return t`Explore Top ${capitalize(tab)} on ${capitalize(network)} on Uniswap`
}

export const getDefaultTokensTitle = (path?: string) => {
  const parts = path?.split('/').filter((part) => part !== '')
  const network = parts?.find((part) => getValidUrlChainName(part)) ?? 'ethereum'

  return t`Explore Top Tokens on ${capitalize(network)} on Uniswap`
}
