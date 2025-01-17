import { useQuery } from '@tanstack/react-query'
import { LaunchpadOptions, LaunchpadParamsStruct } from 'pages/LaunchpadCreate/launchpad-state'

export type LaunchpadStatus = 'Pending' | 'Active' | 'Succeeded' | 'Done' | 'Failed' | 'Canceled'
export interface LaunchpadListItem {
  launchpadAddress: string
  tokenAddress: string
  tokenName: string
  tokenSymbol: string
  tokenDecimals: number
  logoUrl: string
  quoteToken: string
  quoteTokenSymbol: string
  startDate: string
  endDate: string
  hardCapAsQuote: number
  softCapAsQuote: number
  status: LaunchpadStatus
  totalRaised: number
  participants: number
}

async function fetchLaunchpads(listType: 'active' | 'completed'): Promise<LaunchpadListItem[]> {
  try {
    const response = await fetch('https://interface-gateway.ubeswap.org/v1/ubestarter/list/' + listType)
    if (!response.ok) {
      throw new Error('Network response was not ok')
    }
    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error fetching launchpads:', error)
    return []
  }
}

export function useLaunchpads(listType: 'active' | 'completed') {
  const { data: launchpadsApi, isLoading } = useQuery({
    queryKey: ['launchpads', listType],
    queryFn: () => fetchLaunchpads(listType),
    staleTime: 30_000,
  })
  return {
    launchpads: launchpadsApi || [],
    loading: isLoading,
  }
}

interface BackendToken {
  address: string
  name: string
  symbol: string
  decimals: number
}
export interface LaunchpadDetails {
  options: LaunchpadOptions
  params: LaunchpadParamsStruct
  token: BackendToken
  quoteToken: BackendToken
  stats: {
    status: LaunchpadStatus
    totalRaised: number
    participants: number
  }
}

async function fetchLaunchpadDetails(launchpadAddress: string): Promise<LaunchpadDetails | null> {
  try {
    const response = await fetch('https://interface-gateway.ubeswap.org/v1/ubestarter/details/' + launchpadAddress)
    if (!response.ok) {
      throw new Error('Network response was not ok')
    }
    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error fetching launchpads:', error)
    return null
  }
}

export function useLaunchpad(launchpadAddress?: string) {
  const { data, isLoading } = useQuery({
    queryKey: ['launchpad', launchpadAddress],
    queryFn: () => fetchLaunchpadDetails(launchpadAddress || ''),
    staleTime: 10_000,
    enabled: !!launchpadAddress,
  })
  if (data) {
    //data.stats.status = 'Active'
  }
  return {
    launchpad: data,
    loading: isLoading,
  }
}
