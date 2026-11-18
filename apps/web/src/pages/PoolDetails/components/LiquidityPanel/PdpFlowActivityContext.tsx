import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  DEFAULT_DEPOSIT_STATE,
  useCreateLiquidityContext,
} from '~/features/Liquidity/Create/CreateLiquidityContextProvider'
import { useDefaultPriceRange } from '~/pages/PoolDetails/components/LiquidityPanel/useDefaultPriceRange'

export type PdpFlowActivity = {
  /**
   * Whether a deposit is under way: an amount was typed or the range editor opened. It holds while an amount
   * is retyped or the editor is closed; only `exit` ends it. Until then the page draws no range.
   */
  isActive: boolean
  isRangeExpanded: boolean
  setRangeExpanded: (expanded: boolean) => void
  /** Leaves the flow: no amounts, the pool's default range, the editor closed. */
  exit: () => void
}

const PdpFlowActivityContext = createContext<PdpFlowActivity | undefined>(undefined)

/**
 * The deposit panel's flow state, shared with the page's chart, which only draws the range while it's active. Also
 * seeds the pool's default range as soon as it can be computed: on the add routes the range chart writes it when it
 * mounts, but the panel shows a range before any chart does.
 */
export function PdpFlowActivityProvider({ children }: { children: ReactNode }): JSX.Element {
  const { depositState, setDepositState, priceRangeState, setPriceRangeState } = useCreateLiquidityContext()
  const defaultRange = useDefaultPriceRange()
  const needsSeed =
    !priceRangeState.fullRange && priceRangeState.minTick === undefined && priceRangeState.maxTick === undefined
  useEffect(() => {
    if (!needsSeed || !defaultRange) {
      return
    }
    setPriceRangeState((prev) =>
      prev.minTick === undefined && prev.maxTick === undefined && !prev.fullRange ? { ...prev, ...defaultRange } : prev,
    )
  }, [needsSeed, defaultRange, setPriceRangeState])
  const [isRangeExpanded, setRangeExpanded] = useState(false)
  const [isActive, setIsActive] = useState(false)
  const { TOKEN0: amount0, TOKEN1: amount1 } = depositState.exactAmounts
  // Set during render so the chart's band lands in the same commit as the amount or the editor.
  if (!isActive && (amount0 || amount1 || isRangeExpanded)) {
    setIsActive(true)
  }

  const exit = useCallback(() => {
    setDepositState(DEFAULT_DEPOSIT_STATE)
    if (defaultRange) {
      setPriceRangeState((prev) => ({ ...prev, fullRange: false, ...defaultRange, followedPreset: undefined }))
    }
    setRangeExpanded(false)
    setIsActive(false)
  }, [defaultRange, setDepositState, setPriceRangeState])

  const value = useMemo(
    () => ({ isActive, isRangeExpanded, setRangeExpanded, exit }),
    [isActive, isRangeExpanded, exit],
  )
  return <PdpFlowActivityContext.Provider value={value}>{children}</PdpFlowActivityContext.Provider>
}

/** The pool details deposit flow's state; undefined outside one (before the pool loads, or off the PDP). */
export function usePdpFlowActivity(): PdpFlowActivity | undefined {
  return useContext(PdpFlowActivityContext)
}
