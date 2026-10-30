/**
 * The `AnimatableCopyIcon` compat prop contract: the legacy ui surface
 * (`CopyIconProps`) carried name-for-name, so
 * `<AnimatableCopyIcon isCopied={copied} size={16} textColor="$neutral2" />`
 * call sites convert as a mechanical barrel swap.
 */
import type { SporeColorToken } from '../compat/tokens'

/**
 * Legacy types `textColor` as `ColorTokens`; the compat keeps the `$`-token
 * half in autocomplete and lets raw CSS colors and `var()` expressions
 * through (the modal-close-icon widening).
 */
export type AnimatableCopyIconColor = SporeColorToken | (string & {})

export interface CopyIconProps {
  /** Whether to crossfade to the checkmark. Defaults platform-side: `isWebApp` on web (mobile/extension show a "copied" popup instead), `false` on native. */
  isAnimated?: boolean
  isCopied: boolean
  size: number
  // hideIcon technically only applies to the CopySheets icon, because we should allow the CheckmarkCircle icon to animate out on its own
  hideIcon?: boolean
  textColor?: AnimatableCopyIconColor
  dataTestId?: string
}

/** Legacy ui defaults. */
export const DEFAULT_COPY_ICON_COLOR: SporeColorToken = '$neutral2'
export const COPY_ICON_CHECKMARK_COLOR: SporeColorToken = '$statusSuccess'
