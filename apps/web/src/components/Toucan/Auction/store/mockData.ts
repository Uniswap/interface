import { AuctionDetails, CheckpointData } from 'components/Toucan/Auction/store/types'

export const FAKE_AUCTION_DATA: AuctionDetails = {
  tokenSymbol: 'TOUCAN',
  tokenName: 'ToucanCoin',
  tokenAddress: '0x1234567890123456789012345678901234567890',
  logoUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT_jpV17fi4GSCP0jt7m4EtLAdgVprRj1s-Yg&s',
  creatorAddress: '0x1234567890123456789012345678901234567890',
  chainId: 1,
  auctionId: 'auction-123',
  startBlock: 20525886,
  endBlock: 23525886,
  totalSupply: '1000000000000000000000000000',
  graduationThreshold: 0.35,
  bidTokenAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
  tickSize: '500000', // $0.50 USDC
  // TODO | Toucan: remove once token details are fetched using address
  tokenDecimals: 18,
}

export const FAKE_CHECKPOINT_DATA: CheckpointData = {
  clearingPrice: '5000000', // $5 USDC
  cumulativeMps: 0.4,
}

export interface BidActivity {
  walletAddress: string
  bidVolume: string
  price: string
  timestamp: number // Unix timestamp in seconds
}

export const FAKE_BID_ACTIVITIES: BidActivity[] = [
  {
    walletAddress: '0x1234567890123456789012345678901234567890',
    bidVolume: '100',
    price: '2.5M',
    timestamp: 1761263507, // Example unix timestamp
  },
  {
    walletAddress: '0x2345678901234567890123456789012345678901',
    bidVolume: '250',
    price: '2.8M',
    timestamp: 1761263501,
  },
  {
    walletAddress: '0x3456789012345678901234567890123456789012',
    bidVolume: '500',
    price: '3.2M',
    timestamp: 1761263500,
  },
  {
    walletAddress: '0x4567890123456789012345678901234567890123',
    bidVolume: '100',
    price: '2.5M',
    timestamp: 1761263507,
  },
  {
    walletAddress: '0x5678901234567890123456789012345678901234',
    bidVolume: '750',
    price: '4.1M',
    timestamp: 1761263507,
  },
  {
    walletAddress: '0x6789012345678901234567890123456789012345',
    bidVolume: '100',
    price: '2.5M',
    timestamp: 1761263507,
  },
]

export interface AuctionStatsData {
  launchedBy: {
    name: string
    iconUrl?: string
  }
  launchedOn: string
  contractAddress: string
  description: string
  website?: string
  twitter?: string
  impliedTokenPriceMin: string
  impliedTokenPriceMax: string
  totalBids: number
  circulatingSupply: string
  totalSupply: string
}

export const FAKE_AUCTION_STATS: AuctionStatsData = {
  launchedBy: {
    name: 'FooCorp',
    iconUrl: undefined, // Using placeholder in component until actual data is available
  },
  launchedOn: '08/08/25',
  contractAddress: '0x1234567890123456789012345678901234567890',
  description:
    'FooCoin is an innovative token built on the Unichain blockchain, designed to empower users with unique features and functionalities. As a digital asset, it facilitates seamless transactions and interactions within the decentralized ecosystem, allowing holders to engage in various activities such as staking, trading, and participating in community governance. With its vibrant community and robust technology, FooCoin aims to enchant the crypto space and provide users with magical experiences.',
  website: 'https://foocorp.example.com',
  twitter: 'https://x.com/foocorp',
  impliedTokenPriceMin: '$1M',
  impliedTokenPriceMax: '$2.5M',
  totalBids: 10000,
  circulatingSupply: '1,000',
  totalSupply: 'xx,xxx',
}
