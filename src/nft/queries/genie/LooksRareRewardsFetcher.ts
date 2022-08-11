import { LooksRareRewardsData } from '../../types'

const looksRareApiAddress = 'https://api.looksrare.org/api/v1'

export const fetchLooksRareRewards = async (address: string): Promise<LooksRareRewardsData> => {
  const res = await fetch(`${looksRareApiAddress}/rewards?address=${address}`)

  if (res.status !== 200) throw new Error(`LooksRare rewards API errored with status ${res.statusText}`)

  const json = await res.json()

  return json.data
}
