import { queryOptions } from '@tanstack/react-query'
import { TFunction } from 'i18next'
import { GeneratedIcon } from 'ui/src'
import { Fingerprint } from 'ui/src/components/icons'
import { getChromeRuntimeWithThrow } from 'utilities/src/chrome/chrome'
import { logger } from 'utilities/src/logger/logger'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { QueryOptionsResult } from 'utilities/src/reactQuery/queryOptions'
import { MAX_REACT_QUERY_CACHE_TIME_MS, ONE_SECOND_MS } from 'utilities/src/time/time'

type BuiltInBiometricCapabilities = {
  name: string
  icon: GeneratedIcon
  hasBuiltInBiometricSensor: boolean
  os: chrome.runtime.PlatformOs
}

export function builtInBiometricCapabilitiesQuery({
  t,
}: {
  t: TFunction
}): QueryOptionsResult<
  BuiltInBiometricCapabilities,
  Error,
  BuiltInBiometricCapabilities,
  [ReactQueryCacheKey.ExtensionBuiltInBiometricCapabilities]
> {
  return queryOptions({
    queryKey: [ReactQueryCacheKey.ExtensionBuiltInBiometricCapabilities],
    queryFn: async () => await getBuiltInBiometricCapabilities({ t }),
    staleTime: 5 * ONE_SECOND_MS,
    gcTime: MAX_REACT_QUERY_CACHE_TIME_MS,
  })
}

async function getBuiltInBiometricCapabilities({ t }: { t: TFunction }): Promise<BuiltInBiometricCapabilities> {
  try {
    const { os } = await getChromeRuntimeWithThrow().getPlatformInfo()

    return {
      os,
      hasBuiltInBiometricSensor: await isUserVerifyingPlatformAuthenticatorAvailable(),
      ...getPlatformAuthenticatorNameAndIcon({ os, t }),
    }
  } catch (err) {
    // We want to log any error and then rethrow so that useQuery will return the proper error state.

    const error = new Error('Failed to get built-in biometric capabilities')
    error.cause = err

    logger.error(error, {
      tags: {
        file: 'useBuiltInBiometricCapabilitiesQuery.ts',
        function: 'getBuiltInBiometricCapabilities',
      },
    })

    throw error
  }
}

export async function isUserVerifyingPlatformAuthenticatorAvailable(): Promise<boolean> {
  // Check if WebAuthn is supported in this browser.
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (!navigator.credentials || !navigator.credentials.create || !window.PublicKeyCredential) {
    return false
  }

  // Check if the device has a built-in biometric sensor (for example, Touch ID or Windows Hello).
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
  } catch (err) {
    logger.error(err, {
      tags: {
        file: 'useBuiltInBiometricCapabilitiesQuery.ts',
        function: 'isUserVerifyingPlatformAuthenticatorAvailable',
      },
    })

    return false
  }
}

function getPlatformAuthenticatorNameAndIcon({ t, os }: { t: TFunction; os: chrome.runtime.PlatformOs }): {
  name: string
  icon: GeneratedIcon
} {
  switch (os) {
    case 'mac':
      return {
        name: t('common.biometrics.touchId'),
        icon: Fingerprint,
      }
    case 'win':
      return {
        name: t('common.biometrics.windowsHello'),
        // TODO(WALL-6938): add Windows Hello icon
        icon: Fingerprint,
      }
    default:
      return {
        name: t('common.biometrics.generic'),
        icon: Fingerprint,
      }
  }
}
