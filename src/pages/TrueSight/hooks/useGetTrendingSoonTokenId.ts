import { Token } from '@kyberswap/ks-sdk-core'
import useSWR from 'swr'

import { TRUESIGHT_API } from 'constants/env'
import { TRENDING_SOON_MAX_ITEMS } from 'constants/index'
import { TrueSightTokenResponse } from 'pages/TrueSight/hooks/useGetTrendingSoonData'

export default function useGetTrendingSoonTokenId(token?: Token): number | undefined {
  const { data: tokenId } = useSWR(
    token &&
      `${TRUESIGHT_API}/api/v1/trending-soon?timeframe=24h&page_number=0&page_size=${TRENDING_SOON_MAX_ITEMS}&search_token_address=${token.address}`,
    async (url: string) => {
      try {
        const responses = await Promise.all([fetch(url)])
        for (let i = 0; i < responses.length; i++) {
          const response = responses[i]
          if (response.ok) {
            const { data }: { data: TrueSightTokenResponse } = await response.json()
            if (data.tokens.length) {
              return data.tokens[0].token_id
            }
          }
        }
      } catch (error) {
        throw error
      }
      return undefined
    },
  )

  return tokenId
}
