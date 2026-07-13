import { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { useSelectChain } from '~/hooks/useSelectChain'
import { submitAuctionLaunchSaga } from '~/state/sagas/createAuction/submitAuctionLaunchSaga'
import type { SubmitAuctionLaunchParams } from '~/state/sagas/createAuction/types'

export function useAuctionLaunch() {
  const dispatch = useDispatch()
  const selectChain = useSelectChain()

  return useCallback(
    (params: Omit<SubmitAuctionLaunchParams, 'selectChain'>) => {
      // Bridges the saga's `number` chainId param to useSelectChain's `UniverseChainId`
      // signature, satisfying SubmitAuctionLaunchParams without an unsafe function cast.
      const wrappedSelectChain = async (targetChainId: number) => selectChain(targetChainId)

      dispatch(
        submitAuctionLaunchSaga.actions.trigger({
          ...params,
          selectChain: wrappedSelectChain,
        }),
      )
    },
    [dispatch, selectChain],
  )
}
