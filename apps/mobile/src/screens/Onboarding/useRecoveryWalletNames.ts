import { useUnitagByAddress } from 'uniswap/src/features/unitags/hooks'
import { useENSName } from 'wallet/src/features/ens/api'

export function useRecoveryWalletNames(addresses: string[]): {
  ensNames: string[]
  unitags: string[]
} {
  // Need to fetch ENS names and unitags for each deriviation index
  const ensNames = Array(10)
  const unitags = Array(10)

  ensNames[0] = useENSName(addresses[0]).data
  ensNames[1] = useENSName(addresses[1]).data
  ensNames[2] = useENSName(addresses[2]).data
  ensNames[3] = useENSName(addresses[3]).data
  ensNames[4] = useENSName(addresses[4]).data
  ensNames[5] = useENSName(addresses[5]).data
  ensNames[6] = useENSName(addresses[6]).data
  ensNames[7] = useENSName(addresses[7]).data
  ensNames[8] = useENSName(addresses[8]).data
  ensNames[9] = useENSName(addresses[9]).data

  unitags[0] = useUnitagByAddress(addresses[0]).unitag?.username
  unitags[1] = useUnitagByAddress(addresses[1]).unitag?.username
  unitags[2] = useUnitagByAddress(addresses[2]).unitag?.username
  unitags[3] = useUnitagByAddress(addresses[3]).unitag?.username
  unitags[4] = useUnitagByAddress(addresses[4]).unitag?.username
  unitags[5] = useUnitagByAddress(addresses[5]).unitag?.username
  unitags[6] = useUnitagByAddress(addresses[6]).unitag?.username
  unitags[7] = useUnitagByAddress(addresses[7]).unitag?.username
  unitags[8] = useUnitagByAddress(addresses[8]).unitag?.username
  unitags[9] = useUnitagByAddress(addresses[9]).unitag?.username

  return { ensNames, unitags }
}
