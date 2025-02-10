import { Address } from 'viem'

export type StatsResponse = {
  followers_count: number
  following_count: number
}

export async function fetchEFPStats(nameOrAddress: string | Address) {
  const EFP_API_URL = 'https://api.ethfollow.xyz/api/v1'
  const url = `${EFP_API_URL}/users/${nameOrAddress}/stats?cache=fresh`

  try {
    const response = await fetch(url, {
      method: 'GET',
      cache: 'default',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    })
    const data = (await response.json()) as StatsResponse
    return data
  } catch (error) {
    return null
  }
}
