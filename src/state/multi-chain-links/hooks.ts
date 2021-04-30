import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, AppState } from '../index'
import { updateSwitchingToCorrectChain } from './actions'

/**
 * Returns true if a user, after landing on Swapr following a multichain link,
 * is currently not on the right network and switching to it.
 */
export function useIsSwitchingToCorrectChain() {
  return useSelector<AppState, boolean>(state => state.multiChainLinks.switchingToCorrectChain)
}

/**
 * Returns a function that can update the state.
 */
export function useIsSwitchingToCorrectChainUpdater(): (newValue: boolean) => void {
  const dispatch = useDispatch<AppDispatch>()

  return useCallback((newValue: boolean) => dispatch(updateSwitchingToCorrectChain(newValue)), [dispatch])
}
