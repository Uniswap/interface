import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { makeSelectHasNotifications } from 'wallet/src/features/notifications/selectors'
import { WalletState } from 'wallet/src/state/walletReducer'

export function useSelectAddressHasNotifications(address: Address | null): boolean | undefined {
  const selectHasNotifications = useMemo(makeSelectHasNotifications, [])
  return useSelector((state: WalletState) => selectHasNotifications(state, address))
}
