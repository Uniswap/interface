import { GraphQLApi } from '@universe/api'
import client from 'functions/client'
import { META_TAG_FETCH_TIMEOUT_MS } from 'functions/constants'
import { Data } from 'functions/utils/cache'
import { withTimeout } from 'uniswap/src/utils/polling'
import { NATIVE_CHAIN_ID } from '~/constants/tokens'
import { formatTokenMetatagTitleName } from '~/shared-cloud/metatags'

const convertTokenAddress = (networkName: string, tokenAddress: string) => {
  if (tokenAddress === NATIVE_CHAIN_ID) {
    switch (networkName) {
      case GraphQLApi.Chain.Celo:
        return '0x471EcE3750Da237f93B8E339c536989b8978a438'
      case GraphQLApi.Chain.Polygon:
        return '0x0000000000000000000000000000000000001010'
      default:
        return undefined
    }
  }
  return tokenAddress
}

export default async function getToken({
  networkName,
  tokenAddress,
  url,
}: {
  networkName: string
  tokenAddress: string
  url: string
}) {
  const origin = new URL(url).origin
  const image = origin + '/api/image/tokens/' + networkName + '/' + tokenAddress
  const uppercaseNetworkName = networkName.toUpperCase()
  const convertedTokenAddress = convertTokenAddress(uppercaseNetworkName, tokenAddress)
  // Mirror the positions-page worker hardening: the worker already has a URL-level
  // cache via getRequest(), so relying on Apollo's module-scoped cache here only
  // adds risk on stateless edge isolates. Bound the query time and bypass the
  // shared Apollo cache so token meta fetches fail closed instead of hanging SSR.
  // This keeps the token-detail worker path aligned with the CF timeout guardrails.
  const result = await withTimeout(
    client.query<GraphQLApi.TokenWebQuery>({
      query: GraphQLApi.TokenWebDocument,
      variables: {
        chain: uppercaseNetworkName,
        address: convertedTokenAddress,
      },
      errorPolicy: 'all',
      fetchPolicy: 'no-cache',
    }),
    { timeoutMs: META_TAG_FETCH_TIMEOUT_MS, errorMsg: 'getToken TokenWebDocument timeout' },
  ).catch(() => null)

  const asset = result?.data.token
  if (!asset) {
    return undefined
  }

  const title = formatTokenMetatagTitleName(asset.symbol, asset.name)

  const formattedAsset: Data = {
    title,
    image,
    url,
    tokenData: {
      symbol: asset.symbol ?? 'UNK',
    },
    ogImage: asset.project?.logoUrl,
    name: asset.name ?? 'Token',
  }
  return formattedAsset
}
