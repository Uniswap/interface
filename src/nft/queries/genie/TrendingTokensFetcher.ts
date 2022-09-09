import { FungibleToken } from '../../types'

export const fetchTrendingTokens = async (numTokens?: number): Promise<FungibleToken[]> => {
  const url = `${process.env.REACT_APP_TEMP_API_URL}/tokens/trending${numTokens ? `?numTokens=${numTokens}` : ''}`

  const r = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  const data = await r.json()

  return data.data
}
