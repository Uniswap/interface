import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, AppState } from '../index'
import { updateClaimWhitelist, updateClaimTxConfirmed, WhitelistItem } from './actions'

/**
 * Returns the claim whitelist.
 */
export function useClaimWhitelist(): WhitelistItem[] {
  return useSelector<AppState, WhitelistItem[]>(state => state.claim.whitelist)
}

/**
 * Returns a function that can update the claim whitelist.
 */
export function useClaimWhitelistUpdater(): (whitelist: WhitelistItem[]) => void {
  const dispatch = useDispatch<AppDispatch>()

  return useCallback((whitelist: WhitelistItem[]) => dispatch(updateClaimWhitelist({ whitelist })), [dispatch])
}

/**
 * Returns whether a submitted claim tx was confirmed.
 */
export function useClaimTxConfirmed(): boolean {
  return useSelector<AppState, boolean>(state => state.claim.claimTxConfirmed)
}

/**
 * Returns a function that can update the claimed status.
 */
export function useClaimTxConfirmedUpdater(): (confirmed: boolean) => void {
  const dispatch = useDispatch<AppDispatch>()

  return useCallback((confirmed: boolean) => dispatch(updateClaimTxConfirmed(confirmed)), [dispatch])
}
