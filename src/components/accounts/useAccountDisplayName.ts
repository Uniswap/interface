import { ChainId } from 'src/constants/chains'
import { useENSName } from 'src/features/ens/useENSName'
import { Account } from 'src/features/wallet/accounts/types'
import { shortenAddress } from 'src/utils/addresses'

export function useAccountDisplayName(account: Account | null) {
  const accountENS = useENSName(ChainId.Mainnet, account?.address)
  if (!account) return undefined

  return account.name || accountENS.ENSName || shortenAddress(account.address)
}
