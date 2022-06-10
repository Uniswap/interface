import { useMemo } from 'react'
import { useAppSelector } from 'src/app/hooks'
import { ChainId } from 'src/constants/chains'
import { useENS } from 'src/features/ens/useENS'
import { Account } from 'src/features/wallet/accounts/types'
import {
  makeSelectLocalPfp,
  selectActiveAccount,
  selectActiveAccountAddress,
  selectNonPendingAccounts,
  selectPendingAccounts,
  selectSignerAccounts,
} from 'src/features/wallet/selectors'
import { shortenAddress } from 'src/utils/addresses'

export function useAccounts() {
  return useAppSelector(selectNonPendingAccounts)
}

export function usePendingAccounts(): AddressTo<Account> {
  return useAppSelector(selectPendingAccounts)
}

export function useSignerAccounts() {
  return useAppSelector(selectSignerAccounts)
}

export function useActiveAccount(): Account | null {
  return useAppSelector(selectActiveAccount)
}

export function useActiveAccountAddress(): Address | null {
  return useAppSelector(selectActiveAccountAddress)
}

export function useActiveAccountAddressWithThrow(): Address {
  const activeAccountAddress = useAppSelector(selectActiveAccountAddress)
  if (!activeAccountAddress) throw new Error('No active account address')
  return activeAccountAddress
}

export function useActiveAccountWithThrow(): Account {
  const activeAccount = useAppSelector(selectActiveAccount)
  if (!activeAccount) throw new Error('No active account')
  return activeAccount
}

export function useSelectLocalPfp(address: Address) {
  return useAppSelector(useMemo(() => makeSelectLocalPfp(address), [address]))
}

export function useDisplayName(address: Nullable<string>):
  | {
      name: string
      type: 'local' | 'ens' | 'address'
    }
  | undefined {
  const maybeLocalName = useAccounts()[address ?? '']?.name // if address is a local account with a name
  const ens = useENS(ChainId.Mainnet, address)

  if (!address) return

  if (maybeLocalName) return { name: maybeLocalName, type: 'local' }
  if (ens.name) return { name: ens.name, type: 'ens' }
  return { name: shortenAddress(address), type: 'address' }
}
