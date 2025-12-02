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
  tickSize: '10',
  graduationThreshold: 0.35,
  bidTokenAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
}

export const FAKE_CHECKPOINT_DATA: CheckpointData = {
  clearingPrice: '5.00',
  cumulativeMps: 0.4,
}
