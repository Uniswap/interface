import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { makeSelectHasNotifications } from 'wallet/src/features/notifications/selectors'
import { RootState } from 'wallet/src/state'

export function useSelectAddressHasNotifications(address: Address | null): boolean | undefined {
  const selectHasNotifications = useMemo(makeSelectHasNotifications, [])
  return useSelector((state: RootState) => selectHasNotifications(state, address))
}
