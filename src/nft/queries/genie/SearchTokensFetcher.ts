import { FungibleToken } from '../../types'

export const fetchSearchTokens = async (tokenQuery: string): Promise<FungibleToken[]> => {
  const url = `${process.env.REACT_APP_GENIE_V3_API_URL}/searchTokens?tokenQuery=${tokenQuery}`

  const r = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  const data = await r.json()

  // TODO Undo favoritism
  return (
    data.data &&
    data.data.sort((a: FungibleToken, b: FungibleToken) => (b.name === 'Uniswap' ? 1 : b.volume24h - a.volume24h))
  )
}
