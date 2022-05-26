import { useMemo } from 'react'
import { useAppSelector } from 'src/app/hooks'
import { makeSelectAddressNotificationCount } from 'src/features/notifications/selectors'

export function useSelectAddressNotificationCount(address: Address | null) {
  return useAppSelector(useMemo(() => makeSelectAddressNotificationCount(address), [address]))
}
