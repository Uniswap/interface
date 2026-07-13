import { useCallback, useState } from 'react'

type MultichainAddressViewState = 'main' | 'addresses'
type MultichainAddressAnimationType = 'forward' | 'backward'

export interface UseMultichainAddressViewStateResult {
  animationType: MultichainAddressAnimationType
  /** 0 when showing the main content, 1 when showing the per-chain address list — feeds `AnimateTransition`. */
  viewIndex: number
  goToAddresses: () => void
  goBack: () => void
  resetView: () => void
}

/**
 * Shared view-transition state for panels that swap between a main view and a per-chain
 * address list (multichain context menus, TokenHoverCard). Callers own the actual
 * copy/clipboard/analytics logic — this hook only tracks which panel is showing.
 */
export function useMultichainAddressViewState(): UseMultichainAddressViewStateResult {
  const [viewState, setViewState] = useState<MultichainAddressViewState>('main')
  const [animationType, setAnimationType] = useState<MultichainAddressAnimationType>('forward')

  const goToAddresses = useCallback(() => {
    setAnimationType('forward')
    setViewState('addresses')
  }, [])

  const goBack = useCallback(() => {
    setAnimationType('backward')
    setViewState('main')
  }, [])

  const resetView = useCallback(() => {
    setViewState('main')
  }, [])

  return {
    animationType,
    viewIndex: viewState === 'main' ? 0 : 1,
    goToAddresses,
    goBack,
    resetView,
  }
}
