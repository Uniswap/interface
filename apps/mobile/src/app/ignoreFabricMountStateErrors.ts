// Fabric compat for @shopify/react-native-performance@4.1.2: under the New
// Architecture the lib's mount tracking sees componentInstanceId 0 for every
// screen and throws several internal errors. The screens themselves still
// mount and render correctly — these are internal accounting noise. The
// error classes aren't exported from the public API, so we match by name.
// Suppress them, surface anything else.
const FABRIC_PROFILER_NOISE_ERRORS = new Set([
  'InvalidMountStateError',
  'ScreenProfilerNotStartedError',
  'ReuseSnapshotIDError',
  'ReuseComponentInstanceIDError',
  'MultipleFlowsError',
  'RenderTimeoutError',
])

export function ignoreFabricMountStateErrors(error: Error): void {
  if (FABRIC_PROFILER_NOISE_ERRORS.has(error.name)) {
    return
  }
  throw error
}
