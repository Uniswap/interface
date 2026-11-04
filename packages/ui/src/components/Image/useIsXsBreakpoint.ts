import { isWebPlatform } from '@universe/environment'
import { BREAKPOINT_PX } from '@universe/mycelium/theme-hooks-compat'
import { useSyncExternalStore } from 'react'
import { Dimensions } from 'react-native'

// TODO(INFRA-3318): replace the matchMedia observer with a CSS-based media query once the
// 5 packages/wallet `$xs` call sites migrate off the prop or `ui` gains a scanned stylesheet
// to hold the rule (inline styles cannot express @media).
const XS_QUERY = `(max-width: ${BREAKPOINT_PX.xs}px)`

function subscribeToXsQuery(onChange: () => void): () => void {
  const query = window.matchMedia(XS_QUERY)
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}

function getXsQueryMatches(): boolean {
  return window.matchMedia(XS_QUERY).matches
}

function subscribeNoop(): () => void {
  return () => {}
}

function getFalse(): boolean {
  return false
}

/**
 * Web: the exact media query Tamagui compiled `$xs` to, so the breakpoint boundary is
 * identical. Only 5 call sites (packages/wallet landing elements) pass `$xs` — every other
 * Image skips the matchMedia subscription entirely (no-op store) instead of paying a media
 * listener per instance. `getFalse` doubles as the server snapshot.
 */
function useIsXsBreakpointWeb(enabled: boolean): boolean {
  return useSyncExternalStore(
    enabled ? subscribeToXsQuery : subscribeNoop,
    enabled ? getXsQueryMatches : getFalse,
    getFalse,
  )
}

function subscribeToDimensions(onChange: () => void): () => void {
  const subscription = Dimensions.addEventListener('change', onChange)
  return () => subscription.remove()
}

function getWindowIsXs(): boolean {
  return Dimensions.get('window').width <= BREAKPOINT_PX.xs
}

/**
 * Native: dimension-driven, mirroring @tamagui/react-native-media-driver's maxWidth
 * evaluation — and gated like the web leg, so an Image without `$xs` never subscribes to
 * dimension changes (no re-render per rotation/resize).
 */
function useIsXsBreakpointNative(enabled: boolean): boolean {
  return useSyncExternalStore(
    enabled ? subscribeToDimensions : subscribeNoop,
    enabled ? getWindowIsXs : getFalse,
    getFalse,
  )
}

/**
 * Whether the viewport is at or below the `$xs` breakpoint (max-width 380px), subscribing
 * only when `enabled`. Hook choice stays on the app-level platform flag (not the renderer):
 * native app test envs render through react-native-web but may lack window.matchMedia,
 * while the Dimensions store works under both renderers.
 */
export const useIsXsBreakpoint = isWebPlatform ? useIsXsBreakpointWeb : useIsXsBreakpointNative
