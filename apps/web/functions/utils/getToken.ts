import { UniverseChainId } from '@universe/chains'
import { META_TAG_FETCH_TIMEOUT_MS } from 'functions/constants'
import { Data } from 'functions/utils/cache'
import { dataApiServicePost } from 'functions/utils/dataApiService'
import { URL_PARAM_TO_CHAIN_ID } from 'uniswap/src/features/chains/chainUrlParam'
import { withTimeout } from 'uniswap/src/utils/polling'
import { NATIVE_CHAIN_ID } from '~/constants/tokens'
import { formatTokenMetatagTitleName } from '~/shared-cloud/metatags'

// Mirrors nativeAddressForRest (uniswap/src/features/dataApi/utils/currencyIdToContractInput): the
// address the data-api indexes each chain's native token under. Not imported because its chain-info
// dependency requires PNG logos the worker and its node test runtime can't load.
const NATIVE_REST_ADDRESS_BY_CHAIN: Partial<Record<UniverseChainId, string>> = {
  [UniverseChainId.Celo]: '0x471EcE3750Da237f93B8E339c536989b8978a438',
  [UniverseChainId.Polygon]: '0x0000000000000000000000000000000000001010',
  [UniverseChainId.Arc]: '0x3600000000000000000000000000000000000000',
  [UniverseChainId.Solana]: 'So11111111111111111111111111111111111111112',
}
const DEFAULT_NATIVE_REST_ADDRESS = '0x0000000000000000000000000000000000000000'

function nativeAddressForRest(chainId: UniverseChainId): string {
  return NATIVE_REST_ADDRESS_BY_CHAIN[chainId] ?? DEFAULT_NATIVE_REST_ADDRESS
}

// Only the GetToken fields the meta tags consume.
interface DataApiTokenSummary {
  symbol?: string
  name?: string
  project?: {
    logoUrl?: string
  }
}

export default async function getToken({
  networkName,
  tokenAddress,
  url,
}: {
  networkName: string
  tokenAddress: string
  url: string
}): Promise<Data | undefined> {
  const chainId = URL_PARAM_TO_CHAIN_ID[networkName.toLowerCase()]
  if (!chainId) {
    return undefined
  }

  const origin = new URL(url).origin
  const image = origin + '/api/image/tokens/' + networkName + '/' + tokenAddress
  const address = tokenAddress === NATIVE_CHAIN_ID ? nativeAddressForRest(chainId) : tokenAddress

  // Bound the fetch so a stalled upstream fails closed instead of hanging SSR (see constants.ts).
  const result = await withTimeout(
    dataApiServicePost<{ token?: DataApiTokenSummary }>('GetToken', { chainId, address }),
    { timeoutMs: META_TAG_FETCH_TIMEOUT_MS, errorMsg: 'getToken GetToken timeout' },
  ).catch(() => null)

  const asset = result?.token
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
