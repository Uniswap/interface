export enum TimePeriod {
  OneDay = 'ONE_DAY',
  SevenDays = 'SEVEN_DAYS',
  ThirtyDays = 'THIRTY_DAYS',
  AllTime = 'ALL_TIME',
}

export type VolumeType = 'nft' | 'eth'

export interface TrendingCollection {
  name?: string
  address?: string
  imageUrl?: string
  bannerImageUrl?: string
  isVerified?: boolean
  volume?: number
  volumeChange?: number
  floor?: number
  floorChange?: number
  marketCap?: number
  percentListed?: number
  owners?: number
  totalSupply?: number
  sales?: number
}

export enum Denomination {
  ETH = 'ETH',
  USD = 'USD',
}

export interface CollectionTableColumn {
  collection: {
    name?: string
    address?: string
    logo?: string
    isVerified?: boolean
  }
  volume: {
    value?: number
    change?: number
    type?: VolumeType
  }
  floor: {
    value?: number
    change?: number
  }
  owners: {
    value?: number
  }
  sales?: number
  totalSupply?: number
  denomination: Denomination
  usdPrice?: number
}
