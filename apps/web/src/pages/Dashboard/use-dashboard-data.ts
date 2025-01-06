import { useQuery } from '@tanstack/react-query'

export interface DashboardData {
  ubePrice: number
  ubeMarketCap: number
  UbeFdv: number
  totalTvl: number
  volume24h: number
  totalVolume: number
  uniqueWallets: number
  topGainers: {
    tokenAddress: string
    price: number
    change24h: number
  }[]
  topEarnPools: (
    | {
        type: 'stake'
        contractAddress: string
        stakingToken: string
        apr: number
        url: string
      }
    | {
        type: 'farm'
        contractAddress: string
        apr: number
        url: string
        protocolVersion: number
        token0: string
        token1: string
        poolAddress: string
      }
  )[]
}

async function loadDashboardData(): Promise<DashboardData | undefined> {
  try {
    const res = await fetch('https://interface-gateway.ubeswap.org/v1/graphql', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        operationName: 'DashboardData',
        variables: {},
        query: '',
      }),
    })
    const data = await res.json()
    return data
  } catch (e) {
    console.log(e)
  }
  return
}

export function useDashboardData() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: () => loadDashboardData(),
    staleTime: 100_000,
  })
}
