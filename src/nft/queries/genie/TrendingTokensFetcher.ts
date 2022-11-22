import { unwrapToken } from 'graphql/data/util'

import { FungibleToken } from '../../types'

const TOKEN_API_URL = process.env.REACT_APP_TEMP_API_URL
export const fetchTrendingTokens = async (numTokens?: number): Promise<FungibleToken[]> => {
  if (!TOKEN_API_URL) return Promise.resolve([])
  const url = `${TOKEN_API_URL}/tokens/trending${numTokens ? `?numTokens=${numTokens}` : ''}`

  const r = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  const { data } = (await r.json()) as { data: FungibleToken[] }
  return data ? data.map((token) => unwrapToken(token.chainId, token)) : []
}
