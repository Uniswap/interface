import { PlatformSplitStubError } from 'utilities/src/errors'

/** Reports a problem determining an error fingerprint to RUM. Platform-split so the browser RUM SDK stays out of the native bundle. */
export function reportFingerprintError(_params: { stepType: string; error: unknown }): void {
  throw new PlatformSplitStubError('reportFingerprintError')
}
