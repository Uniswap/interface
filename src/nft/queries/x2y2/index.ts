import { OrderPayload } from '../../utils/x2y2'

export const X2Y2_TRANSFER_CONTRACT = '0xf849de01b080adc3a814fabe1e2087475cf2e354'

export const newX2Y2Order = async (payload: OrderPayload): Promise<boolean> => {
  const body = JSON.stringify(payload)
  const url = `${process.env.REACT_APP_GENIE_V3_API_URL}/postX2Y2SellOrderWithApiKey`
  const ac = new AbortController()
  const req = new Request(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
    body,
    signal: ac.signal,
  })
  const timeout = setTimeout(() => ac.abort(), 60 * 1000)
  try {
    const res = await fetch(req)
    const data = await res.json()
    return data.code === 200
  } catch (e) {
    return false
  } finally {
    clearTimeout(timeout)
  }
}

export const getOrderId = async (collectionAddress: string, tokenId: string): Promise<number | undefined> => {
  const url = `https://try.readme.io/https://api.x2y2.org/v1/orders?contract=${collectionAddress}&token_id=${tokenId}`
  const r = await fetch(url, {
    method: 'GET',
    headers: {
      'X-API-Key': 'ed9122b9-f76b-4e54-9d9e-bdb195e2fea6',
      accept: 'application/json',
    },
  })
  const data = await r.json()
  return data?.data?.[0]?.id
}
