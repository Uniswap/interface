import { OrderPayload } from '../../utils/x2y2'

export const newX2Y2Order = async (payload: OrderPayload): Promise<boolean> => {
  const body = JSON.stringify(payload)
  const url = `${process.env.REACT_APP_GENIE_API_URL}/postX2Y2SellOrderWithApiKey`
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
