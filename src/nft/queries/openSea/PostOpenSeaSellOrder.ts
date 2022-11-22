import ms from 'ms.macro'

import { getNftUrl } from '../url'

export async function PostOpenSeaSellOrder(payload?: Record<string, unknown>): Promise<boolean> {
  const body = payload ? JSON.stringify(payload) : undefined
  const url = `${getNftUrl()}/postOpenSeaSellOrderWithApiKey`
  const ac = new AbortController()
  const req = new Request(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
    body,
    signal: ac.signal,
  })
  const timeout = setTimeout(() => ac.abort(), ms`60s`)
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
