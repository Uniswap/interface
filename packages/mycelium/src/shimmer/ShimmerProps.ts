import type { ReactNode } from 'react'

/**
 * Shared prop surface for the cross-platform `Shimmer` primitive. Replaces the
 * legacy `ui/src/loading` `Shine`/`Skeleton` usage contract: wrap loading
 * placeholder content and a glare sweeps across it until `disabled`.
 */
export interface ShimmerProps {
  /**
   * The placeholder content the shimmer sweeps over. Rendered even while
   * `disabled` so children keep their React identity across enable/disable
   * toggles (remounting would reset in-flight child animations).
   */
  children: ReactNode
  /**
   * Pauses the effect while keeping children mounted. Mirrors the legacy
   * `Shine`/`Skeleton` `disabled` prop.
   */
  disabled?: boolean
  /**
   * Seconds per full sweep. Defaults match the legacy `Shine` per-platform
   * timing: 1s on web, 2s on native.
   */
  shimmerDurationSeconds?: number
  /**
   * Web only: CSS `animation-delay` for the sweep (e.g. `'0.2s'`), so sibling
   * shimmers can be staggered. Ignored on native.
   */
  animationDelay?: string
  /**
   * Extra classes merged onto the wrapper (layout, sizing — e.g. `w-full`
   * where a legacy call site passed `width="100%"`). Applied on web via
   * `cn()`; on native the wrapper is a React Native `View`, where uniwind
   * resolves the same token classes.
   */
  className?: string
  /**
   * Forwarded to `data-testid` on web / `testID` on native (INFRA-3822):
   * legacy `Shine` callers pass a `containerProps`/`skeletonProps` bag onto
   * the wrapper that can carry a `testID`, and dropping it silently broke
   * `Table/Cell.test.tsx`'s element lookup after conversion.
   */
  testID?: string
  /**
   * A narrow slice of the legacy Tamagui Stack layout surface real call
   * sites pass straight onto `Shine` (INFRA-3822) — not the full
   * `FlexCompatStyleProps` surface, just the values already CSS property
   * names on both platforms, so they merge directly into the wrapper's style
   * with no class compiler involved.
   */
  flexDirection?: 'row' | 'column'
  // RN's DimensionValue contract, the common subset both platforms render correctly:
  // an exact number, a percentage string, or 'auto' — not an arbitrary CSS length string.
  width?: number | `${number}%` | 'auto'
  height?: number | `${number}%` | 'auto'
  justifyContent?: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly'
  alignItems?: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline'
}
