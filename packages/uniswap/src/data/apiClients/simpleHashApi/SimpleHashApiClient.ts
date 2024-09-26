import { config } from 'uniswap/src/config'
import { createApiClient } from 'uniswap/src/data/apiClients/createApiClient'

export const SIMPLE_HASH_API_CACHE_KEY = 'SimpleHashApi'

const SimpleHashApiClient = createApiClient({
  baseUrl: `${config.simpleHashApiUrl}/api/v0`,
  includeBaseUniswapHeaders: false,
  additionalHeaders: {
    'x-api-key': config.simpleHashApiKey,
  },
})

export type SimpleHashNftsRequest = {
  contractAddress: string
  tokenId: string
}

export type SimpleHashNftsResponse = {
  previews: {
    image_small_url: string | null
    image_medium_url: string | null
    image_large_url: string | null
    image_opengraph_url: string | null
    blurhash: string | null
    predominant_color: string | null
  } | null
}

export async function fetchNft({ contractAddress, tokenId }: SimpleHashNftsRequest): Promise<SimpleHashNftsResponse> {
  return await SimpleHashApiClient.get<SimpleHashNftsResponse>(`/nfts/ethereum/${contractAddress}/${tokenId}`)
}

export type SimpleHashResponse = {
  message: string
  success: boolean
}

export type ReportSpamRequest = {
  contractAddress?: string
  tokenId?: string
  networkName?: string
}

export async function reportNftSpamToSimpleHash(params: ReportSpamRequest): Promise<SimpleHashResponse> {
  return await SimpleHashApiClient.post<SimpleHashResponse>('/nfts/report/spam', {
    body: JSON.stringify({
      contract_address: params.contractAddress,
      token_id: params.tokenId,
      chain_id: params.networkName,
      event_type: 'label_spam',
    }),
  })
}
