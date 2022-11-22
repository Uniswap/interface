import { FungibleToken } from '../../types'

const TOKEN_API_URL = process.env.REACT_APP_TEMP_API_URL
export const fetchSearchTokens = async (tokenQuery: string): Promise<FungibleToken[]> => {
  if (!TOKEN_API_URL) return Promise.resolve([])
  const url = `${TOKEN_API_URL}/tokens/search?tokenQuery=${tokenQuery}`

  const r = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  const data = await r.json()

  // TODO Undo favoritism
  return data.data
    ? data.data.sort((a: FungibleToken, b: FungibleToken) => (b.name === 'Uniswap' ? 1 : b.volume24h - a.volume24h))
    : []
}
