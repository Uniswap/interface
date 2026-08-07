/**
 * Native leg lands with the native parity harness (INFRA-2353) — the
 * reference is a reanimated worklet, so equivalence is only provable there;
 * until then the compat must fail loudly rather than return unverified values.
 */
import { PlatformSplitStubError } from '@universe/environment'
export function opacify(_opacity: number, _color: string): string {
  throw new PlatformSplitStubError('opacify (theme-hooks compat): native leg is blocked on INFRA-2353')
}

export const opacifyRaw = opacify
