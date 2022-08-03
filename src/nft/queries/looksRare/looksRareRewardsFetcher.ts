import { LooksRareRewardsData } from '../../types'

const looksRareApiAddress = 'https://api.looksrare.org/api/v1'

export const looksRareRewardsFetcher = async (address: any): Promise<LooksRareRewardsData | string> => {
  const res = await fetch(`${looksRareApiAddress}/rewards?address=${address}`)

  if (res.status !== 200) throw new Error(`LooksRare rewards API errored with status ${res.statusText}`)

  const json = await res.json()

  return json.data
}
