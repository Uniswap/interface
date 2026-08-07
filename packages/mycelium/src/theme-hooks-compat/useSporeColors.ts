/**
 * Platform-split base stub — bundlers resolve `useSporeColors.web` /
 * `useSporeColors.native` (the `ui/src` convention). Shared types live here.
 */
import { PlatformSplitStubError } from '@universe/environment'
import type { CompatThemeName } from './theme-state'
import type { ThemeColorName } from './tokens'

export type DynamicColor = string

export interface SporeColor {
  val: string
  get: () => DynamicColor
  variable: string
}

export type SporeColorKey = ThemeColorName | `$${ThemeColorName}`

export type UseSporeColorsReturn = Readonly<Record<SporeColorKey, SporeColor>>

export const useSporeColors = (_name?: CompatThemeName | null): UseSporeColorsReturn => {
  throw new PlatformSplitStubError('useSporeColors')
}
