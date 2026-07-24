import { toScreenInput, useIsBlockedAddress } from '@universe/compliance'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { useActiveAccount } from 'wallet/src/features/wallet/hooks'

/** Returns compliance screening status for the active account. */
export function useIsBlockedActiveAddress(): { isBlocked: boolean; isBlockedLoading: boolean } {
  const account = useActiveAccount()
  return useIsBlockedAddress(
    toScreenInput(account && account.type !== AccountType.Readonly ? account.address : undefined),
  )
}
