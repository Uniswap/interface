import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import {
  makeSelectAddressNotifications,
  makeSelectHasNotifications,
} from 'nexttrade/src/features/notifications/selectors'
import { AppNotification } from 'nexttrade/src/features/notifications/types'
import { NextTradeState } from 'nexttrade/src/state/uniswapReducer'

export function useSelectAddressHasNotifications(address: Address | null): boolean | undefined {
  const selectHasNotifications = useMemo(makeSelectHasNotifications, [])
  return useSelector((state: NextTradeState) => selectHasNotifications(state, address))
}

export function useSelectAddressNotifications(address: Address | null): AppNotification[] | undefined {
  const selectAddressNotifications = useMemo(makeSelectAddressNotifications, [])
  return useSelector((state: NextTradeState) => selectAddressNotifications(state, address))
}
