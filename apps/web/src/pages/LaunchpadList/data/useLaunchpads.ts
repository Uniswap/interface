import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'

// API'den gelen veri yapısı
export interface LaunchpadApiData {
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
  status: 'Pending' | 'Active' | 'Completed'
  totalRaised: number
  participants: number
}

// Tablo için kullanacağımız dönüştürülmüş veri yapısı
export interface TableLaunchpad {
  id: string
  tokenName: string
  tokenSymbol: string
  logoUrl: string
  quoteTokenSymbol: string
  startDate: Date
  endDate: Date
  hardCap: number
  softCap: number
  status: 'Pending' | 'Active' | 'Completed'
  totalRaised: number
  progress: number
  participants: number
}

// API'den veri çekme fonksiyonu
async function fetchLaunchpads(): Promise<LaunchpadApiData[]> {
  try {
    const response = await fetch('https://interface-gateway.ubeswap.org/v1/ubestarter/list/active')
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

// Fallback verileri - API çalışmadığında kullanılacak
const launchpadsFallback: LaunchpadApiData[] = [
  {
    tokenAddress: '0x000000000000000000000000000000000000dEaD',
    tokenName: 'Fallback Deneme',
    tokenSymbol: 'ACM',
    tokenDecimals: 18,
    logoUrl:
      'https://www.edigitalagency.com.au/wp-content/uploads/ChatGPT-logo-PNG-small-size-white-green-background.png',
    quoteToken: '0x71e26d0E519D14591b9dE9a0fE9513A398101490',
    quoteTokenSymbol: 'UBE',
    startDate: '2025-01-12T12:24:00.484Z',
    endDate: '2025-01-15T12:24:00.484Z',
    hardCapAsQuote: 1000099,
    softCapAsQuote: 500000,
    status: 'Completed',
    totalRaised: 0,
    participants: 0,
  },
]

// API verilerini tablo formatına dönüştürme
function transformApiDataToTableFormat(data: LaunchpadApiData): TableLaunchpad {
  const hardCap = data.hardCapAsQuote
  const totalRaised = data.totalRaised
  const progress = hardCap > 0 ? (totalRaised / hardCap) * 100 : 0

  return {
    id: data.tokenAddress,
    tokenName: data.tokenName,
    tokenSymbol: data.tokenSymbol,
    logoUrl: data.logoUrl,
    quoteTokenSymbol: data.quoteTokenSymbol,
    startDate: new Date(data.startDate),
    endDate: new Date(data.endDate),
    hardCap,
    softCap: data.softCapAsQuote,
    status: data.status,
    totalRaised,
    progress,
    participants: data.participants,
  }
}

// Ana hook fonksiyonu
export function useLaunchpads() {
  const { data: launchpadsApi, isLoading } = useQuery({
    queryKey: ['launchpads'],
    queryFn: fetchLaunchpads,
    staleTime: 30_000,
  })

  const launchpads = useMemo(() => {
    const apiData = launchpadsApi || launchpadsFallback
    const transformedData = apiData.map(transformApiDataToTableFormat)

    return {
      active: transformedData.filter((l) => l.status === 'Active'), // || l.status === 'Pending'
      completed: transformedData.filter((l) => l.status === 'Completed'),
    }
  }, [launchpadsApi])

  return {
    launchpads,
    loading: isLoading,
  }
}
