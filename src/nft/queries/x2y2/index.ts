import { OrderPayload } from '../../utils/x2y2'

export const X2Y2_TRANSFER_CONTRACT = '0xf849de01b080adc3a814fabe1e2087475cf2e354'

export const newX2Y2Order = async (payload: OrderPayload): Promise<boolean> => {
  const body = JSON.stringify(payload)
  const url = `${process.env.REACT_APP_TEMP_API_URL}/nft/postX2Y2SellOrderWithApiKey`
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
  const url = `${process.env.REACT_APP_TEMP_API_URL}/nft/getX2Y2OrderId?collectionAddress=${collectionAddress}&tokenId=${tokenId}`
  const r = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
  })
  const data = await r.json()
  return data?.data?.data?.[0]?.id
}
