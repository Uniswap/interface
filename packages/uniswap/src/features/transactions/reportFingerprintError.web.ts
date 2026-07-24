import { datadogRum } from '@datadog/browser-rum'

/** Reports a problem determining an error fingerprint to RUM. Platform-split so the browser RUM SDK stays out of the native bundle. */
export function reportFingerprintError({ stepType, error }: { stepType: string; error: unknown }): void {
  datadogRum.addAction('Transaction Action', {
    message: `problem determining fingerprint for ${stepType}`,
    level: 'info',
    step: stepType,
    data: {
      errorMessage: error instanceof Error ? error.message : undefined,
    },
  })
}
