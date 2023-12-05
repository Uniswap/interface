import { Rewards } from 'nft/types/airdrop'

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
