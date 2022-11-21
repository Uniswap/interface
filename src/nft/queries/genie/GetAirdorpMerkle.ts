export enum RewardType {
  LOOKS_RARE_NFT_COMMERCE_REWARDS = 'LOOKS_RARE_NFT_COMMERCE_REWARDS',
}

export interface Rewards {
  walletAddress: string
  tokenAddress: string
  merkleProof: Array<string>
  rewardType: RewardType
  chainId: number
  index: number
}

interface CollectionrRewardsResponse {
  data: Array<Rewards>
}

export const CollectionRewardsFetcher = async (address: string): Promise<CollectionrRewardsResponse> => {
  const url = `${process.env.REACT_APP_TEMP_API_URL}/nft/rewards/${address}?category=GENIE_UNISWAP_USDC_AIRDROP`

  const controller = new AbortController()

  const timeoutId = setTimeout(() => controller.abort(), 3000)

  const r = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })
  clearInterval(timeoutId)
  const data = await r.json()

  return data
}
