/**
 * The WebBottomSheet compat prop contract (INFRA-3329): the legacy
 * `ui/src/components/modal/AdaptiveWebModalShared.ts` `ModalProps` surface —
 * the leaked Tamagui Flex style surface (covered by the Flex compat contract)
 * plus the explicit web-sheet knobs — reproduced without the Tamagui runtime,
 * so converting a consumer is an import-path swap. Kept assignable from
 * `webBottomSheetProps` call-site shapes (see popover-compat's
 * `WebBottomSheetCompatProps`), whose `snapPoints`/`snapPointsMode` are wider
 * than the legacy `ModalProps` types.
 */
import type * as React from 'react'
import type { FlexCompatProps } from '../flex-compat/props'

export type WebBottomSheetSnapPointsMode = 'fit' | 'percent' | 'constant' | 'mixed' | (string & {})

// TODO: move to the shared TestID enum once it's removed from the uniswap package
export const WEB_BOTTOM_SHEET_OVERLAY_TEST_ID = 'mycelium-web-bottom-sheet-overlay'

export type WebBottomSheetProps = Omit<FlexCompatProps, 'children'> &
  React.PropsWithChildren<{
    isOpen: boolean
    /** Names the sheet's dialog for assistive tech; visually hidden. A translated heading for what the sheet holds. */
    title: string
    onClose?: () => void
    /** Accepted for `ModalProps` drop-in compatibility; the standalone sheet is always a sheet. */
    adaptToSheet?: boolean
    /** Accepted for `ModalProps` drop-in compatibility; sheets ignore the dialog alignment. */
    alignment?: 'center' | 'top'
    hideHandlebar?: boolean
    snapPointsMode?: WebBottomSheetSnapPointsMode
    snapPoints?: ReadonlyArray<string | number> | null
    /** Accepted for `ModalProps` drop-in compatibility; the sheet scrim opacity is stylesheet-owned. */
    overlayOpacity?: number
    /** Skips the built-in scroll lock for self-locking callers. */
    disableRemoveScroll?: boolean
  }>
