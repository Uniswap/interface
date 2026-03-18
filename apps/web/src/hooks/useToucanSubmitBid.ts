import { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import useSelectChain from '~/hooks/useSelectChain'
import { submitToucanBidSaga } from '~/state/sagas/toucan/submitBidSaga'
import { SubmitToucanBidParams } from '~/state/sagas/toucan/types'

export function useToucanSubmitBid() {
  const dispatch = useDispatch()
  const selectChain = useSelectChain()

  return useCallback(
    (params: Omit<SubmitToucanBidParams, 'selectChain'>) => {
      const wrappedSelectChain = async (targetChainId: number) => {
        return selectChain(targetChainId)
      }

      dispatch(
        submitToucanBidSaga.actions.trigger({
          ...params,
          selectChain: wrappedSelectChain,
        }),
      )
    },
    [dispatch, selectChain],
  )
}
