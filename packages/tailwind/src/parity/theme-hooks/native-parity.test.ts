/**
 * Theme-hooks compat parity, native legs — written but skipped: blocked on the
 * native parity harness (INFRA-2353, uniwind/Metro resolved-style equivalence
 * gates). The native legs of the compat hooks are throwing stubs until that
 * harness lands; un-skip this suite (and give each case a real body against
 * the harness) when INFRA-2353 lands.
 */
import { describe, it } from 'vitest'

const BLOCKED = 'Blocked on INFRA-2353: rendering both hook versions natively requires the uniwind/Metro parity harness'

describe.each(['light', 'dark'] as const)('theme-hooks compat native parity (INFRA-2353) — %s', () => {
  // oxlint-disable-next-line jest/no-disabled-tests -- blocked on INFRA-2353 (native parity harness)
  it.skip('useSporeColors native leg returns the identical token → color map as ui/src', () => {
    throw new Error(BLOCKED)
  })

  // oxlint-disable-next-line jest/no-disabled-tests -- blocked on INFRA-2353 (native parity harness)
  it.skip('useIsDarkMode native leg returns the same boolean as ui/src', () => {
    throw new Error(BLOCKED)
  })

  // oxlint-disable-next-line jest/no-disabled-tests -- blocked on INFRA-2353 (native parity harness)
  it.skip('useMedia native leg reports identical breakpoint booleans as ui/src', () => {
    throw new Error(BLOCKED)
  })

  // oxlint-disable-next-line jest/no-disabled-tests -- blocked on INFRA-2353 (native parity harness)
  it.skip('useDeviceDimensions native leg reports the same window metrics as ui/src', () => {
    throw new Error(BLOCKED)
  })

  // oxlint-disable-next-line jest/no-disabled-tests -- blocked on INFRA-2353 (native parity harness)
  it.skip('opacify native leg produces identical output strings as ui/src (worklet semantics)', () => {
    throw new Error(BLOCKED)
  })
})
