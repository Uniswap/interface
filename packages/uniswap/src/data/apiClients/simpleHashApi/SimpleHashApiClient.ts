import { config } from 'uniswap/src/config'
import { createApiClient } from 'uniswap/src/data/apiClients/createApiClient'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

export const SIMPLE_HASH_API_CACHE_KEY = 'SimpleHashApi'

const SimpleHashApiClient = createApiClient({
  baseUrl: `${config.simpleHashApiUrl}/api/v0`,
  includeBaseUniswapHeaders: false,
  additionalHeaders: {
    'x-api-key': config.simpleHashApiKey,
  },
})

export type SimpleHashResponse = {
  message: string
  success: boolean
}

export type ReportSpamRequest = {
  contractAddress?: string
  tokenId?: string
  chainId: UniverseChainId
}

const SIMPLE_HASH_CHAIN_IDS: Record<UniverseChainId, string> = {
  [UniverseChainId.Mainnet]: 'ethereum',
  [UniverseChainId.ArbitrumOne]: 'arbitrum',
  [UniverseChainId.Avalanche]: 'avalanche',
  [UniverseChainId.Base]: 'base',
  [UniverseChainId.Blast]: 'blast',
  [UniverseChainId.Bnb]: 'binance',
  [UniverseChainId.Celo]: 'celo',
  [UniverseChainId.MonadTestnet]: 'monad',
  [UniverseChainId.Optimism]: 'optimism',
  [UniverseChainId.Polygon]: 'matic',
  [UniverseChainId.Soneium]: 'soneium',
  [UniverseChainId.Unichain]: 'unichain',
  [UniverseChainId.WorldChain]: 'worldchain',
  [UniverseChainId.Zksync]: 'zksync',
  [UniverseChainId.Zora]: 'zora',
  [UniverseChainId.Sepolia]: 'sepolia',
  [UniverseChainId.UnichainSepolia]: 'unichain-sepolia',
}

function getSimpleHashChainId(chainId: UniverseChainId | undefined): string {
  if (!chainId || !(chainId in SIMPLE_HASH_CHAIN_IDS)) {
    throw new Error(`Chain ID '${chainId}' does not have a corresponding SimpleHash chain ID`)
  }
  return SIMPLE_HASH_CHAIN_IDS[chainId]
}

export async function reportNftSpamToSimpleHash(params: ReportSpamRequest): Promise<SimpleHashResponse> {
  const networkName = getSimpleHashChainId(params.chainId)

  return await SimpleHashApiClient.post<SimpleHashResponse>('/nfts/report/spam', {
    body: JSON.stringify({
      contract_address: params.contractAddress,
      token_id: params.tokenId,
      chain_id: networkName,
      event_type: 'label_spam',
    }),
  })
}
