import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, AppState } from '../index'
import { updateClaimWhitelist, WhitelistItem } from './actions'

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
