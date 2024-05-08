import { useMemo } from 'react'
import { makeSelectHasNotifications } from 'wallet/src/features/notifications/selectors'
import { useAppSelector } from 'wallet/src/state'

export function useSelectAddressHasNotifications(address: Address | null): boolean | undefined {
  const selectHasNotifications = useMemo(makeSelectHasNotifications, [])
  return useAppSelector((state) => selectHasNotifications(state, address))
}
