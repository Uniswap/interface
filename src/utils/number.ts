import { fromWei } from 'web3-utils'

export const humanFriendlyWei = (wei: string) => {
  return Number(fromWei(wei)).toLocaleString()
}
