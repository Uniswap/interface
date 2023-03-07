export enum Airdrop {
  LOOKS_RARE_NFT_COMMERCE_REWARDS = 'LOOKS_RARE_NFT_COMMERCE_REWARDS',
  GENIE_UNISWAP_USDC_AIRDROP = 'GENIE_UNISWAP_USDC_AIRDROP',
}

export interface Rewards {
  amount: string
  walletAddress: string
  tokenAddress: string
  merkleProof: Array<string>
  rewardType: Airdrop
  chainId: number
  index: number
}
