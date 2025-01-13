import { useQuery } from '@tanstack/react-query'

export type LaunchpadSatus = 'Pending' | 'Active' | 'Succeeded' | 'Done' | 'Failed' | 'Canceled'
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
  status: LaunchpadSatus
  totalRaised: number
  participants: number
}

// API'den veri çekme fonksiyonu
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

// Ana hook fonksiyonu
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
