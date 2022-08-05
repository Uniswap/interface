import { useEffect, useState } from 'react'
import { Token } from '@kyberswap/ks-sdk-core'

import { TRENDING_SOON_MAX_ITEMS } from 'constants/index'
import { TrueSightTokenResponse } from 'pages/TrueSight/hooks/useGetTrendingSoonData'

export default function useGetTrendingSoonTokenId(token?: Token): number | undefined {
  const [tokenId, setTokenId] = useState<number>()

  useEffect(() => {
    const asyncF = async () => {
      try {
        setTokenId(undefined)
        if (token) {
          const { address } = token
          const url24h = `${process.env.REACT_APP_TRUESIGHT_API}/api/v1/trending-soon?timeframe=24h&page_number=0&page_size=${TRENDING_SOON_MAX_ITEMS}&search_token_address=${address}`
          // const url7d = `${process.env.REACT_APP_TRUESIGHT_API}/api/v1/trending-soon?timeframe=7d&page_number=0&page_size=${TRENDING_SOON_MAX_ITEMS}&search_token_address=${address}`
          const responses = await Promise.all([fetch(url24h)])
          for (let i = 0; i < responses.length; i++) {
            const response = responses[i]
            if (response.ok) {
              const { data }: { data: TrueSightTokenResponse } = await response.json()
              if (data.tokens.length) {
                setTokenId(data.tokens[0].token_id)
                return
              }
            }
          }
        }
      } catch (error) {}
    }
    asyncF()
  }, [token])

  return tokenId
}
