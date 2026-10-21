import { useState } from 'react'
import { useEvent } from 'utilities/src/react/hooks'
import type { MarginMarket } from '~/constants/margin'
import { marginLeverageCaps } from '~/pages/Swap/Margin/hooks/useMarginAdjustController'
import { clampManageLeverage } from '~/pages/Swap/Margin/marginAdjustPositionModalHelpers'

/**
 * The leverage a manage sheet's slider is holding, plus the in-flight text draft behind its numeric
 * field.
 *
 * One home for the clamp rule. The Adjust-position and Change-leverage sheets ran near-identical copies
 * of this block, and the copies drifted: only one of them re-clamped a dragged target when a markets
 * poll lowered the venue ceiling, so the other kept quoting a leverage the venue no longer offered and
 * the backend refused it. A rule that must hold on both sheets should not be written on both sheets.
 */
export function useDraggedLeverage({
  market,
  onExplicitChange,
}: {
  // The ceiling is derived HERE, from the market, rather than taken from the controller: the
  // controller's mode is computed from this hook's value, so a sheet cannot ask it first.
  market: MarginMarket
  // Ran whenever an explicit target is set — the Adjust sheet clears its "hold leverage" toggle here.
  onExplicitChange?: () => void
}): {
  draggedLeverage: number | undefined
  leverageDraft: string | undefined
  setLeverageDraft: (draft: string | undefined) => void
  setExplicitLeverage: (next: number) => void
  onSliderChange: (next: number) => void
  commitLeverageDraft: () => void
  clearDraggedLeverage: () => void
} {
  const { venueCap } = marginLeverageCaps({ market })
  const [rawLeverage, setRawLeverage] = useState<number | undefined>(undefined)
  const [leverageDraft, setLeverageDraft] = useState<string | undefined>(undefined)

  // Clamped on READ, not stored-then-corrected. A markets poll can lower the venue ceiling under an open
  // sheet, and a state-syncing effect lands a render late: on the render where the ceiling drops, the
  // readout would clamp while the quote request still wired the stored value — reopening the very
  // readout/wire gap this clamp exists to close. Deriving it gives one clamp site and no window.
  const draggedLeverage =
    rawLeverage === undefined ? undefined : clampManageLeverage({ leverage: rawLeverage, venueCap })

  const setExplicitLeverage = useEvent((next: number) => {
    setRawLeverage(next)
    onExplicitChange?.()
  })

  const onSliderChange = useEvent((next: number) => {
    setLeverageDraft(undefined)
    setExplicitLeverage(next)
  })

  // A blank or unparseable draft is a no-op, not a reset to zero: the field is committed on blur, and
  // an abandoned edit must leave the slider where the user last put it.
  const commitLeverageDraft = useEvent(() => {
    if (leverageDraft !== undefined) {
      const parsed = Number(leverageDraft)
      if (Number.isFinite(parsed) && parsed > 0) {
        setExplicitLeverage(parsed)
      }
    }
    setLeverageDraft(undefined)
  })

  const clearDraggedLeverage = useEvent(() => {
    setRawLeverage(undefined)
    setLeverageDraft(undefined)
  })

  return {
    draggedLeverage,
    leverageDraft,
    setLeverageDraft,
    setExplicitLeverage,
    onSliderChange,
    commitLeverageDraft,
    clearDraggedLeverage,
  }
}
