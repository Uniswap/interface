import type { CSSProperties } from 'react'
import type { SporeComponentVariant } from 'ui/src/components/types'

/**
 * Local replacement for the Tamagui `SwitchProps` this component used to extend.
 * Kept to the prop surface consumers actually use so nothing Tamagui-shaped
 * leaks through the public API.
 */
export type SwitchProps = {
  checked?: boolean
  defaultChecked?: boolean
  onCheckedChange?: (checked: boolean) => void
  disabled?: boolean
  variant: SporeComponentVariant
  testID?: string
  /** Forwarded to the underlying element (web renders a `button[role=switch]`). */
  id?: string
  pointerEvents?: 'auto' | 'none' | 'box-none' | 'box-only'
  /** Web only: overrides the resolved track color. Accepts a Spore color token (e.g. `$surface3`) or a raw color. */
  backgroundColor?: string
  /** Web only: extra inline styles merged in while disabled (legacy Tamagui `disabledStyle`). */
  disabledStyle?: CSSProperties
  /** Web only: accessible name, for when the visible label beside the switch is shortened. */
  'aria-label'?: string
}
