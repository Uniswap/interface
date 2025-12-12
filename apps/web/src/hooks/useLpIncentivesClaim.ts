import useSelectChain from 'hooks/useSelectChain'
import { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { lpIncentivesClaimSaga } from 'state/sagas/lp_incentives/lpIncentivesSaga'
import { LpIncentivesClaimParams } from 'state/sagas/lp_incentives/types'

export function useLpIncentivesClaim() {
  const dispatch = useDispatch()
  const selectChain = useSelectChain()

  return useCallback(
    (params: Omit<LpIncentivesClaimParams, 'selectChain'>) => {
      // Create a new callback that will use the latest chainId state
      const wrappedSelectChain = async (chainId: number) => {
        return selectChain(chainId)
      }
      dispatch(
        lpIncentivesClaimSaga.actions.trigger({
          ...params,
          selectChain: wrappedSelectChain,
        }),
      )
    },
    [dispatch, selectChain],
  )
}
