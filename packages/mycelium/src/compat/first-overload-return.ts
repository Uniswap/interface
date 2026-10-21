/**
 * Positional first-overload return-type extraction, shared by the animated
 * compat wrappers (`animated-flex-compat`, `touchable-area`).
 *
 * Reanimated 4.5 flipped the ORDER of `createAnimatedComponent`'s two call
 * signatures (the deprecated FlatList overload was already generic
 * `<T = any>` in 4.4.x): 4.4.x declared FlatList first and the generic
 * component overload last, so `ReturnType<>` — which resolves the LAST
 * overload — named the component signature; 4.5.x declares the component
 * overload first and FlatList last, so `ReturnType<>` now names the FlatList
 * signature. Extracting the FIRST overload's return type positionally
 * targets the component overload under the 4.5.x ordering. This type assumes
 * exactly two call signatures. This is positional, NOT a guard: if reanimated ever
 * reorders the overloads, this resolves the then-first (FlatList) overload's
 * return type SILENTLY — the mismatch would surface as prop-type errors at
 * the annotated components' usage sites, not here. `never` arises only if
 * `T` stops matching two call signatures, so re-verify the overload order on
 * every reanimated bump that touches `createAnimatedComponent`.
 *
 * Internal only — deliberately not re-exported from the compat barrel or the
 * package public API.
 */
export type FirstOverloadReturn<T> = T extends {
  (...args: never[]): infer R
  (...args: never[]): unknown
}
  ? R
  : never
