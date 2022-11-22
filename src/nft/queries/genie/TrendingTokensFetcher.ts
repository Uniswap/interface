import { unwrapToken } from 'graphql/data/util'

import { FungibleToken } from '../../types'
import { getTokenUrl } from '../url'

export const fetchTrendingTokens = async (numTokens?: number): Promise<FungibleToken[]> => {
  // TODO
  const url = `${getTokenUrl()}/tokens/trending${numTokens ? `?numTokens=${numTokens}` : ''}`

  const r = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  const { data } = (await r.json()) as { data: FungibleToken[] }
  return data.map((token) => unwrapToken(token.chainId, token))
}
