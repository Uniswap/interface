export enum TimePeriod {
  OneDay = 'ONE_DAY',
  SevenDays = 'SEVEN_DAYS',
  ThirtyDays = 'THIRTY_DAYS',
  AllTime = 'ALL_TIME',
}

export type VolumeType = 'nft' | 'eth'
export interface TransactionsResponse {
  __v: number
  _id: string
  bannerImage: string
  blockNumber: string
  blockTimestamp: string
  collections: [string]
  createdAt: string
  ethValue: number
  from_address: string
  gas: string
  gasPrice: string
  hash: string
  isVerified: boolean
  nftCount: number
  profileImage: string
  receiptContractAddress: string | null
  receiptCumulatioveGasUsed: string
  receiptGasUsed: string
  receiptStatus: string
  sweep: boolean
  timestamp: string
  to_address: string
  updatedAt: string
  usdValue: number
  title: string
}

export interface TrendingCollection {
  name: string
  address: string
  imageUrl: string
  bannerImageUrl: string
  isVerified: boolean
  volume: number
  volumeChange: number
  floor: number
  floorChange: number
  marketCap: number
  percentListed: number
  owners: number
  ownersChange: number
  totalSupply: number
  sales: number
}

export enum Denomination {
  ETH = 'ETH',
  USD = 'USD',
}

export interface CollectionTableColumn {
  collection: {
    name: string
    address: string
    logo: string
    isVerified: boolean
  }
  volume: {
    value: number
    change: number
    type: VolumeType
  }
  floor: {
    value: number
    change: number
  }
  owners: {
    value: number
    change: number
  }
  sales: number
  totalSupply: number
  denomination: Denomination
  usdPrice?: number
}
