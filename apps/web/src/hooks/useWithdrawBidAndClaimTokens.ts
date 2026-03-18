import { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import useSelectChain from '~/hooks/useSelectChain'
import { WithdrawBidAndClaimTokensToucanBidParams } from '~/state/sagas/toucan/types'
import { withdrawBidAndClaimTokensToucanBidSaga } from '~/state/sagas/toucan/withdrawBidAndClaimTokensSaga'

export function useWithdrawBidAndClaimTokens() {
  const dispatch = useDispatch()
  const selectChain = useSelectChain()

  return useCallback(
    (params: Omit<WithdrawBidAndClaimTokensToucanBidParams, 'selectChain'>) => {
      const wrappedSelectChain = async (targetChainId: number) => {
        return selectChain(targetChainId)
      }

      dispatch(
        withdrawBidAndClaimTokensToucanBidSaga.actions.trigger({
          ...params,
          selectChain: wrappedSelectChain,
        }),
      )
    },
    [dispatch, selectChain],
  )
}
