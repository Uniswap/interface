import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import {
  makeSelectAddressNotifications,
  makeSelectHasNotifications,
} from 'uniswap/src/features/notifications/slice/selectors'
import { AppNotification } from 'uniswap/src/features/notifications/slice/types'
import { UniswapState } from 'uniswap/src/state/uniswapReducer'

export function useSelectAddressHasNotifications(address: Address | null): boolean | undefined {
  const selectHasNotifications = useMemo(makeSelectHasNotifications, [])
  return useSelector((state: UniswapState) => selectHasNotifications(state, address))
}

export function useSelectAddressNotifications(address: Address | null): AppNotification[] | undefined {
  const selectAddressNotifications = useMemo(makeSelectAddressNotifications, [])
  return useSelector((state: UniswapState) => selectAddressNotifications(state, address))
}
