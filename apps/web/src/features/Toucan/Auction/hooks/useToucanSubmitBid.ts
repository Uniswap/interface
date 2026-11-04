import { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { useSelectChain } from '~/connection/hooks/useSelectChain'
import { useSetOverrideOneClickSwapFlag } from '~/state/oneClickSwap/hooks'
import { submitToucanBidSaga } from '~/state/sagas/toucan/submitBidSaga'
import { SubmitToucanBidParams } from '~/state/sagas/toucan/types'

export function useToucanSubmitBid() {
  const dispatch = useDispatch()
  const selectChain = useSelectChain()
  const disableOneClickSwap = useSetOverrideOneClickSwapFlag()

  return useCallback(
    (params: Omit<SubmitToucanBidParams, 'selectChain' | 'disableOneClickSwap'>) => {
      const wrappedSelectChain = async (targetChainId: number) => {
        return selectChain(targetChainId)
      }

      dispatch(
        submitToucanBidSaga.actions.trigger({
          ...params,
          selectChain: wrappedSelectChain,
          disableOneClickSwap,
        }),
      )
    },
    [dispatch, selectChain, disableOneClickSwap],
  )
}
