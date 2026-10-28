/**
 * Shared `useWindowDimensions` stand-in for every `react-native` test mock
 * (`compat/testing` and `floating-overlay/testing`, both wired via
 * `vi.mock('react-native', …)`). Default device: `fontScale: 1`, no Dynamic
 * Type scaling active (INFRA-3783's `allowFontScaling`
 * default-disable gates read this).
 */
export function useWindowDimensions(): { width: number; height: number; scale: number; fontScale: number } {
  return { width: 390, height: 844, scale: 2, fontScale: 1 }
}
