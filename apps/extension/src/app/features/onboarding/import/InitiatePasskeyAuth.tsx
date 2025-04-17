import { Action, AuthenticationTypes } from '@uniswap/client-embeddedwallet/dist/uniswap/embeddedwallet/v1/service_pb'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useOnboardingSteps } from 'src/app/features/onboarding/OnboardingStepsContext'
import { OnboardingRoutes, TopLevelRoutes } from 'src/app/navigation/constants'
import { Flex, SpinningLoader, Text } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { fetchExportSeedPhraseRequest } from 'uniswap/src/data/rest/embeddedWallet/requests'
import { parseMessage } from 'uniswap/src/extension/messagePassing/platform'
import {
  ExtensionToInterfaceRequestType,
  PasskeyCredentialRetrievedSchema,
  PasskeyRequest,
  PasskeySignInFlowOpenedSchema,
} from 'uniswap/src/extension/messagePassing/types/requests'
import { EXTENSION_PASSKEY_AUTH_PATH } from 'uniswap/src/features/passkey/constants'
import { getSecuredChallengeOptions } from 'uniswap/src/features/passkey/embeddedWallet'
import { useEmbeddedWalletBaseUrl } from 'uniswap/src/features/passkey/hooks/useEmbeddedWalletBaseUrl'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { ExtensionOnboardingFlow, ExtensionOnboardingScreens } from 'uniswap/src/types/screens/extension'
import { logger } from 'utilities/src/logger/logger'
import { v4 as uuid } from 'uuid'
import { useOnboardingContext } from 'wallet/src/features/onboarding/OnboardingContext'
import { Keyring } from 'wallet/src/features/wallet/Keyring/Keyring'

/**************************************************************************************************************
 *
 *                                     PASSKEY AUTH FLOW: EXTENSION <> WEB APP
 *
 * +-------------+                                +---------------+                              +------------+
 * |  Extension  |                                |    Web App    |                              |    User    |
 * +-------------+                                +---------------+                              +------------+
 *  |                                                     |                                                  |
 *  |-- Opens popup via chrome.windows.create ----------->|                                                  |
 *  |   /auth/passkey/extension?request_id=XXX         |                                                  |
 *  |                                                     |                                                  |
 *  |<-- "Did the extension actually open this window?" --|                                                  |
 *  |    chrome.runtime.sendMessage(EXTENSION_ID,         |                                                  |
 *  |    { type: 'PasskeySignInFlowOpened', requestId })  |                                                  |
 *  |                                                     |                                                  |
 *  |-- Ignores or responds with ------------------------>|                                                  |
 *  |   sendResponse({ type: 'PasskeyRequest',            |                                                  |
 *  |                  requestId, challengeJson })        |                                                  |
 *  |                                                     |                                                  |
 *  |                                                     |-- Receives `PasskeyRequest` message ------------>|
 *  |                                                     |   and enables "Sign In" button                   |
 *  |                                                     |                                                  |
 *  |                                                     |<-- Clicks "Sign In" -----------------------------|
 *  |                                                     |    and authenticates with their passkey          |
 *  |                                                     |                                                  |
 *  |<----------------- Sends passkey credentials --------|                                                  |
 *  |   chrome.runtime.sendMessage(EXTENSION_ID,          |                                                  |
 *  |   { type: 'PasskeyCredentialRetrieved',             |                                                  |
 *  |     requestId, credential })                        |                                                  |
 *  |                                                     |                                                  |
 *
 *  NOTES:
 *
 *  For the Web App code, check `apps/web/src/pages/ExtensionPasskeyAuth/index.tsx`.
 *
 *  We're not reusing all of the message passing utils that we use to communicate between the different
 *  parts of the Extension (Sidebar, Background, etc.) because there are some additional constraints around
 *  how a web app can communicate with an Extension.
 *
 *  In order to test this flow, the web app URL must be declared in the `externally_connectable` attribute
 *  of the Extension's `manifest.json`.
 *
 **************************************************************************************************************/

export const IMPORT_PASSKEY_STATE_KEY = 'importPasskey'

export function InitiatePasskeyAuth(): JSX.Element {
  const { state } = useLocation()

  if (!state || !state[IMPORT_PASSKEY_STATE_KEY]) {
    // This prevents someone else linking directly to this page from a 3rd party website.
    return <Navigate to={`/${TopLevelRoutes.Onboarding}`} replace />
  }

  return <InitiatePasskeyAuthContent />
}

function InitiatePasskeyAuthContent(): JSX.Element {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const webAppBaseUrl = useEmbeddedWalletBaseUrl()

  const { goToNextStep } = useOnboardingSteps()
  const { addOnboardingAccountMnemonic } = useOnboardingContext()

  const initiated = useRef(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let popupWindow: chrome.windows.Window | undefined
    let handleMessagePasskeySignInFlowOpened: Parameters<typeof chrome.runtime.onMessageExternal.addListener>[0]
    let handleMessagePasskeyCredentialRetrieved: Parameters<typeof chrome.runtime.onMessageExternal.addListener>[0]

    const initiatePasskeyAuth = async (): Promise<void> => {
      if (initiated.current) {
        return
      }

      initiated.current = true

      try {
        const requestId = uuid()
        const publicKeyBase64 = await Keyring.generateKeyPairForPasskeyWallet()

        const securedChallengeOptions = await getSecuredChallengeOptions({
          type: AuthenticationTypes.PASSKEY_AUTHENTICATION,
          action: Action.EXPORT_SEED_PHRASE,
          b64EncryptionPublicKey: publicKeyBase64,
        })

        handleMessagePasskeyCredentialRetrieved = async (message: unknown) => {
          const parsedMessage = parseMessage(message, PasskeyCredentialRetrievedSchema)

          if (!parsedMessage) {
            return
          }

          if (parsedMessage.requestId !== requestId) {
            logger.debug(
              'InitiatePasskeyAuth.tsx',
              'handleMessagePasskeyCredentialRetrieved',
              'Mismatched request ID',
              {
                requestId,
                message,
              },
            )
            return
          }

          closePopupWindow(popupWindow)
          setLoading(true)

          try {
            const seedPhraseResp = await fetchExportSeedPhraseRequest({
              encryptionKey: publicKeyBase64,
              credential: parsedMessage.credential,
            })

            const seedPhrase = await Keyring.decryptMnemonicForPasskey(
              seedPhraseResp.encryptedSeedPhrase,
              publicKeyBase64,
            )

            addOnboardingAccountMnemonic(seedPhrase.split(' '))
            goToNextStep()
          } catch (e) {
            logger.error(e, {
              tags: {
                file: 'InitiatePasskeyAuth.tsx',
                function: 'handleMessagePasskeyCredentialRetrieved',
              },
            })

            // TODO(WALL-6378): discuss how to better handle this error instead of simply redirecting back. Should we show the help modal?
            navigate(`/${TopLevelRoutes.Onboarding}/${OnboardingRoutes.SelectImportMethod}`, { replace: true })
          }
        }

        chrome.runtime.onMessageExternal.addListener(handleMessagePasskeyCredentialRetrieved)

        handleMessagePasskeySignInFlowOpened = async (
          message: unknown,
          _sender: unknown,
          sendResponse: (response: unknown) => void,
        ) => {
          logger.debug('InitiatePasskeyAuth.tsx', 'handleMessagePasskeySignInFlowOpened', 'Message received', {
            message,
          })

          const parsedMessage = parseMessage(message, PasskeySignInFlowOpenedSchema)

          if (!parsedMessage) {
            return
          }

          if (parsedMessage.requestId !== requestId) {
            logger.debug('InitiatePasskeyAuth.tsx', 'handleMessagePasskeySignInFlowOpened', 'Mismatched request ID', {
              requestId,
              message,
            })
            return
          }

          logger.debug(
            'InitiatePasskeyAuth.tsx',
            'handleMessagePasskeySignInFlowOpened',
            `Sending message: ${ExtensionToInterfaceRequestType.PasskeyRequest}`,
          )

          sendResponse({
            type: ExtensionToInterfaceRequestType.PasskeyRequest,
            requestId,
            challengeJson: securedChallengeOptions,
          } satisfies PasskeyRequest)
        }

        chrome.runtime.onMessageExternal.addListener(handleMessagePasskeySignInFlowOpened)

        // TODO(WALL-6374): center the popup window on the screen
        popupWindow = await chrome.windows.create({
          url: `${webAppBaseUrl}${EXTENSION_PASSKEY_AUTH_PATH}?request_id=${requestId}`,
          type: 'popup',
          width: 420,
          height: 335,
        })
      } catch (e) {
        logger.error(e, {
          tags: {
            file: 'InitiatePasskeyAuth.tsx',
            function: 'initiatePasskeyAuth',
          },
        })
      }
    }

    initiatePasskeyAuth()

    return () => {
      closePopupWindow(popupWindow)
      chrome.runtime.onMessageExternal.removeListener(handleMessagePasskeySignInFlowOpened)
      chrome.runtime.onMessageExternal.removeListener(handleMessagePasskeyCredentialRetrieved)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Trace
      logImpression
      properties={{ flow: ExtensionOnboardingFlow.Import }}
      screen={ExtensionOnboardingScreens.SelectImportMethod}
    >
      <Flex gap="$spacing16">
        {loading ? (
          <SpinningLoader size={iconSizes.icon48} />
        ) : (
          <Text>{t('onboarding.importPasskey.continueInSecureWindow')}</Text>
        )}
      </Flex>
    </Trace>
  )
}

function closePopupWindow(popupWindow: chrome.windows.Window | undefined): void {
  if (!popupWindow?.id) {
    return
  }

  chrome.windows.remove(popupWindow.id).catch((error) => {
    logger.error(error, {
      tags: {
        file: 'InitiatePasskeyAuth.tsx',
        function: 'closePopupWindow',
      },
    })
  })
}
