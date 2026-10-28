import { useContext, useMemo } from 'react'
import type { ReactNode } from 'react'
import { type CloseIconProps, CloseIconWithHover } from 'ui/src/components/icons/CloseIconWithHover'
import type { ModalProps } from 'ui/src/components/modal/AdaptiveWebModalShared'
import { EffectiveModalOrSheetZIndexContext, stackingLayerAbove } from 'ui/src/components/modal/AdaptiveWebModalShared'
import { zIndexes } from 'ui/src/theme'

/**
 * The non-web leg of the AdaptiveWebModal cluster. Native modals are gorhom-based via
 * `uniswap/src/components/modals/Modal.native.tsx` and never render the web branches, so the
 * components here are inert pass-throughs; `ModalCloseIcon` and the z-index hook are the only
 * living exports. The base `AdaptiveWebModal.tsx` re-exports this file, so
 * non-platform resolvers get the identical implementation without a hand-kept copy.
 */

export {
  ADAPTIVE_MODAL_ANIMATION_DURATION,
  DualZIndexProvider,
  EffectiveModalOrSheetZIndexContext,
  stackingLayerAbove,
  WEB_BOTTOM_SHEET_OVERLAY_TEST_ID,
} from 'ui/src/components/modal/AdaptiveWebModalShared'

/**
 * Z-index for {@link EffectiveModalOrSheetZIndexContext} in adaptive modals.
 *
 * Native never renders the web dialog/sheet branches (native modals are gorhom-based via
 * `uniswap/src/components/modals/Modal.native.tsx`), so the sheet-adapt branch collapses to the
 * React-context fallback here.
 */
export function useEffectiveModalOrSheetZIndex({
  zIndex,
}: {
  adaptToSheet: boolean
  isTopAligned: boolean
  zIndex?: number
}): number | undefined {
  const parentContextZ = useContext(EffectiveModalOrSheetZIndexContext)
  return useMemo(
    (): number | undefined => zIndex ?? stackingLayerAbove(parentContextZ, zIndexes.modal),
    [zIndex, parentContextZ],
  )
}

export function ModalCloseIcon(props: CloseIconProps): JSX.Element {
  // The small-viewport hide only applies on the web app (see the .web leg); native always renders.
  return <CloseIconWithHover {...props} />
}

/**
 * Web/extension-only bottom sheet. Native bottom sheets are gorhom-based
 * (`uniswap/src/components/modals/Modal.native.tsx`); nothing renders this on native.
 */
export function WebBottomSheet(_props: ModalProps): JSX.Element | null {
  return null
}

/**
 * Web/extension-only responsive modal. Native modals are gorhom-based
 * (`uniswap/src/components/modals/Modal.native.tsx`); nothing renders this on native.
 */
export function AdaptiveWebModal(_props: ModalProps): JSX.Element {
  return <></>
}

/**
 * Web/extension-only modal with a bottom attachment. Native modals are gorhom-based
 * (`uniswap/src/components/modals/Modal.native.tsx`); nothing renders this on native.
 */
export function WebModalWithBottomAttachment(_props: ModalProps & { bottomAttachment?: ReactNode }): JSX.Element {
  return <></>
}
