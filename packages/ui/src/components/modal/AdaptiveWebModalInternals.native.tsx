/**
 * Platform-split native stub for the AdaptiveWebModal cluster's web-only support machinery.
 * The real implementation lives in `AdaptiveWebModalInternals.web.tsx` and is only imported
 * from `.web` legs (always via the explicit `.web` specifier), so nothing should ever resolve
 * this file at runtime (native modals are gorhom-based) — every entry point throws to make an accidental off-web import loud.
 */
import type { CSSProperties } from 'react'
import { PlatformSplitStubError } from 'utilities/src/errors'

export type OutsideInteractionEvent = CustomEvent<{ originalEvent: PointerEvent | FocusEvent }>

export const VISUALLY_HIDDEN_STYLE: CSSProperties = {}

export const FIXED_FULL_SCREEN = { position: 'fixed' } as const

export const MODAL_STYLESHEET = { id: '', css: '' } as const

export function getOutsideEventTarget(_event: OutsideInteractionEvent): Node | null {
  throw new PlatformSplitStubError('getOutsideEventTarget')
}

export function useChromeNodeRef(): [React.MutableRefObject<HTMLElement | null>, (node: unknown) => void] {
  throw new PlatformSplitStubError('useChromeNodeRef')
}

export function useRestoreFocusOnClose(): {
  onOpenAutoFocus: (event: Event) => void
  onCloseAutoFocus: (event: Event) => void
} {
  throw new PlatformSplitStubError('useRestoreFocusOnClose')
}

export function getPercentSnapHeight(_snapPoints?: Array<string | number>): string | undefined {
  throw new PlatformSplitStubError('getPercentSnapHeight')
}

export interface SheetHeightStyles {
  height?: string | number
  maxHeight?: string | number
}

export function getSheetHeightStyles(_options: {
  snapPointsMode: string
  snapPoints?: Array<string | number>
  isWebApp: boolean
  interfaceNavHeight: number
  mdMaxHeight?: string | number
}): SheetHeightStyles {
  throw new PlatformSplitStubError('getSheetHeightStyles')
}

export function stripConsumerHeightForFit<T extends { height?: unknown; $md?: object }>(
  _rest: T,
  _snapPointsMode: string,
): T {
  throw new PlatformSplitStubError('stripConsumerHeightForFit')
}

export function useSheetEscapeToClose(_options: { isOpen: boolean; onClose?: () => void }): void {
  throw new PlatformSplitStubError('useSheetEscapeToClose')
}

export function useSheetFitHeightFreeze(_options: {
  isOpen: boolean
  enabled: boolean
  frame: HTMLDivElement | null
  isWebApp: boolean
  interfaceNavHeight: number
}): void {
  throw new PlatformSplitStubError('useSheetFitHeightFreeze')
}

export function useSheetDrag(_options: { isOpen: boolean; onClose?: () => void; frame: HTMLDivElement | null }): void {
  throw new PlatformSplitStubError('useSheetDrag')
}
