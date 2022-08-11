import { TransactionsResponse } from '../../types'

export const fetchTransactions = async (payload: { sweep?: boolean }): Promise<TransactionsResponse[]> => {
  const url = `${process.env.REACT_APP_GENIE_API_URL}/transactions`

  const r = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  const data = (await r.json()) as TransactionsResponse[]

  return data.filter(
    (x) => x.bannerImage && (payload.sweep ? x.nftCount >= 3 && Math.floor(x.ethValue / 10 ** 18) >= 1 : true)
  )
}
