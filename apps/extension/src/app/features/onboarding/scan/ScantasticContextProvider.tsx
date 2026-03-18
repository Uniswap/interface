import {
  createContext,
  Dispatch,
  PropsWithChildren,
  SetStateAction,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'
import { useOnboardingSteps } from 'src/app/features/onboarding/OnboardingSteps'
import { cryptoKeyToJWK, KEY_PARAMS } from 'src/app/features/onboarding/scan/utils'
import { OnboardingRoutes, TopLevelRoutes } from 'src/app/navigation/constants'
import { navigate } from 'src/app/navigation/state'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { logger } from 'utilities/src/logger/logger'
import { ONE_DAY_MS, ONE_MINUTE_MS, ONE_SECOND_MS } from 'utilities/src/time/time'
import { ScantasticParamsSchema } from 'wallet/src/features/scantastic/types'

type ScantasticContextState = {
  isLoadingUUID: boolean
  privateKey: CryptoKey | null
  publicKey: JsonWebKey | null
  sessionUUID: string | null
  resetScantastic: () => void
  expirationTimestamp: number
  setExpirationTimestamp: Dispatch<SetStateAction<number>>
}

const uuidSchema = ScantasticParamsSchema.shape.uuid

const ScantasticContext = createContext<ScantasticContextState | undefined>(undefined)

export function ScantasticContextProvider({ children }: PropsWithChildren): JSX.Element {
  const { isResetting } = useOnboardingSteps()

  const [isLoadingUUID, setIsLoadingUUID] = useState(true)
  const [publicKey, setPublicKey] = useState<null | JsonWebKey>(null)
  const [privateKey, setPrivateKey] = useState<null | CryptoKey>(null)
  const [sessionUUID, setSessionUUID] = useState<null | string>(null)
  // Users have 20 minutes to scan the QR code. This is reduced to 6 minutes for OTP input once the scan is completed.
  const [expirationTimestamp, setExpirationTimestamp] = useState<number>(Date.now() + 20 * ONE_MINUTE_MS)

  const reset = useCallback(() => {
    setPublicKey(null)
    setPrivateKey(null)
    setSessionUUID(null)
    setExpirationTimestamp(Date.now() + ONE_DAY_MS)
    navigate(`/${TopLevelRoutes.Onboarding}/${isResetting ? OnboardingRoutes.ResetScan : OnboardingRoutes.Scan}`, {
      replace: true,
    })
  }, [isResetting])

  useEffect(() => {
    async function getSessionUUID(): Promise<void> {
      if (sessionUUID) {
        return
      }

      try {
        const { publicKey: pub, privateKey: priv } = await window.crypto.subtle.generateKey(KEY_PARAMS, true, [
          'encrypt',
          'decrypt',
        ])
        const jwk = await cryptoKeyToJWK(pub)
        setPublicKey(jwk)
        setPrivateKey(priv)
      } catch (e) {
        logger.error(e, {
          tags: {
            file: 'OnboardingContextProvider.tsx',
            function: 'getSessionUUID->generateKeyPair',
          },
        })
      }

      // Initiate scantastic onboarding session
      const response = await fetch(`${uniswapUrls.scantasticApiUrl}/uuid`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch uuid for mobile->ext onboarding: ${await response.text()}`)
      }

      const data = await response.json()

      if (!data.uuid) {
        throw new Error('Missing uuid from onboarding session initiation request.')
      }

      try {
        const uuid = uuidSchema.parse(data.uuid)
        setSessionUUID(uuid)
      } catch {
        throw new Error('Invalid uuid from onboarding session initiation request.')
      }

      if (data.expiresAtInSeconds) {
        setExpirationTimestamp(data.expiresAtInSeconds * ONE_SECOND_MS)
      }
    }

    setIsLoadingUUID(true)
    getSessionUUID()
      .catch((e) => {
        logger.error(e, {
          tags: { file: 'OnboardingContextProvider.tsx', function: 'getSessionUUID' },
        })
      })
      .finally(() => {
        setIsLoadingUUID(false)
      })
  }, [sessionUUID])

  return (
    <ScantasticContext.Provider
      value={{
        isLoadingUUID,
        privateKey,
        publicKey,
        sessionUUID,
        resetScantastic: reset,
        expirationTimestamp,
        setExpirationTimestamp,
      }}
    >
      {children}
    </ScantasticContext.Provider>
  )
}

export const useScantasticContext = (): ScantasticContextState => {
  const scantasticContext = useContext(ScantasticContext)
  if (scantasticContext === undefined) {
    throw new Error('useScantasticContext must be inside a ScantasticContextProvider')
  }
  return scantasticContext
}
