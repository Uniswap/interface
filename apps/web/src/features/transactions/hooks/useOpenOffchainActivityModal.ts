import { useUpdateAtom } from 'jotai/utils'
import { useCallback } from 'react'
import { InterfaceEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { UniswapXOrderDetails } from 'uniswap/src/features/transactions/types/transactionDetails'
import { selectedOrderAtom } from '~/features/transactions/hooks/selectedOrderAtom'

export function useOpenOffchainActivityModal() {
  const setSelectedOrder = useUpdateAtom(selectedOrderAtom)

  return useCallback(
    (order: UniswapXOrderDetails) => {
      sendAnalyticsEvent(InterfaceEventName.UniswapXOrderDetailsSheetOpened, {
        order: order.orderHash ?? order.id,
      })
      setSelectedOrder({ order, modalOpen: true })
    },
    [setSelectedOrder],
  )
}
