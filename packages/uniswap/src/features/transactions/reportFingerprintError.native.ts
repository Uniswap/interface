/**
 * No-op on native: this RUM action is only reported for the web app (call site is guarded by `isWebApp`),
 * and the `@datadog/browser-rum` SDK must not be pulled into the native bundle.
 */
export function reportFingerprintError(_params: { stepType: string; error: unknown }): void {}
