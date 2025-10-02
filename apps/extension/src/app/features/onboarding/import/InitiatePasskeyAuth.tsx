import { Action, AuthenticationTypes } from '@uniswap/client-embeddedwallet/dist/uniswap/embeddedwallet/v1/service_pb'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate, useLocation } from 'react-router'
import { usePasskeyImportContext } from 'src/app/features/onboarding/import/PasskeyImportContextProvider'
import {
  InitiatePasskeyAuthLocationState,
  SelectImportMethodLocationState,
} from 'src/app/features/onboarding/import/types'
import { useOnboardingSteps } from 'src/app/features/onboarding/OnboardingStepsContext'
import { OnboardingRoutes, TopLevelRoutes } from 'src/app/navigation/constants'
import { navigate } from 'src/app/navigation/state'
import { bringWindowToFront, closeWindow, openPopupWindow } from 'src/app/navigation/utils'
import { Button, Flex, IconButton, SpinningLoader, Text } from 'ui/src'
import { X } from 'ui/src/components/icons'
import { UniswapLogo } from 'ui/src/components/icons/UniswapLogo'
import { fetchChallengeRequest } from 'uniswap/src/data/rest/embeddedWallet/requests'
import { parseMessage } from 'uniswap/src/extension/messagePassing/platform'
import {
  ExtensionToInterfaceRequestType,
  PasskeyCredentialRetrievedSchema,
  PasskeyRequest,
  PasskeySignInFlowOpenedSchema,
} from 'uniswap/src/extension/messagePassing/types/requests'
import { EXTENSION_PASSKEY_AUTH_PATH } from 'uniswap/src/features/passkey/constants'
import { useEmbeddedWalletBaseUrl } from 'uniswap/src/features/passkey/hooks/useEmbeddedWalletBaseUrl'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { ExtensionOnboardingFlow, ExtensionOnboardingScreens } from 'uniswap/src/types/screens/extension'
import { logger } from 'utilities/src/logger/logger'
import { useEvent } from 'utilities/src/react/hooks'
import { useInterval } from 'utilities/src/time/timing'
import { v4 as uuid } from 'uuid'

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

const POPUP_WIDTH = 420
const POPUP_HEIGHT = 335

export function InitiatePasskeyAuth(): JSX.Element {
  const locationState = useLocation().state as InitiatePasskeyAuthLocationState | undefined

  if (!locationState?.importPasskey) {
    // This prevents someone else linking directly to this page from a 3rd party website.
    return <Navigate to={`/${TopLevelRoutes.Onboarding}`} replace />
  }

  return <InitiatePasskeyAuthContent />
}

function InitiatePasskeyAuthContent(): JSX.Element {
  const { t } = useTranslation()

  const webAppBaseUrl = useEmbeddedWalletBaseUrl()

  const { goToNextStep } = useOnboardingSteps()
  const { importWithCredential } = usePasskeyImportContext()

  const initiated = useRef(false)

  const handleError = (error: unknown, sourceFunction: string): void => {
    logger.error(error, {
      tags: {
        file: 'InitiatePasskeyAuth.tsx',
        function: sourceFunction,
      },
    })
    navigate(`/${TopLevelRoutes.Onboarding}/${OnboardingRoutes.SelectImportMethod}`, {
      replace: true,
      state: { showErrorMessage: true } satisfies SelectImportMethodLocationState,
    })
  }

  const popupWindow = useRef<chrome.windows.Window | undefined>(undefined)

  // biome-ignore lint/correctness/useExhaustiveDependencies: Only run once on mount to initiate auth flow, all handlers are created fresh each render
  useEffect(() => {
    let handleMessagePasskeySignInFlowOpened: Parameters<typeof chrome.runtime.onMessageExternal.addListener>[0]
    let handleMessagePasskeyCredentialRetrieved: Parameters<typeof chrome.runtime.onMessageExternal.addListener>[0]

    const initiatePasskeyAuth = async (): Promise<void> => {
      if (initiated.current) {
        return
      }

      initiated.current = true

      try {
        const requestId = uuid()

        const challengeResponse = await fetchChallengeRequest({
          type: AuthenticationTypes.PASSKEY_AUTHENTICATION,
          action: Action.EXPORT_SEED_PHRASE,
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
              { requestId, message },
            )
            return
          }

          closeWindow(popupWindow.current)
          importWithCredential(parsedMessage.credential)
          goToNextStep()
        }

        chrome.runtime.onMessageExternal.addListener(handleMessagePasskeyCredentialRetrieved)

        handleMessagePasskeySignInFlowOpened = async (
          message: unknown,
          _sender: unknown,
          sendResponse: (response: unknown) => void,
          // eslint-disable-next-line max-params
        ) => {
          try {
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
              challengeJson: challengeResponse.challengeOptions,
            } satisfies PasskeyRequest)
          } catch (e) {
            handleError(e, 'handleMessagePasskeySignInFlowOpened')
          }
        }

        chrome.runtime.onMessageExternal.addListener(handleMessagePasskeySignInFlowOpened)

        popupWindow.current = await openPopupWindow({
          url: `${webAppBaseUrl}${EXTENSION_PASSKEY_AUTH_PATH}?request_id=${requestId}`,
          width: POPUP_WIDTH,
          height: POPUP_HEIGHT,
        })
      } catch (e) {
        handleError(e, 'initiatePasskeyAuth')
      }
    }

    initiatePasskeyAuth()

    return () => {
      closeWindow(popupWindow.current)
      chrome.runtime.onMessageExternal.removeListener(handleMessagePasskeySignInFlowOpened)
      chrome.runtime.onMessageExternal.removeListener(handleMessagePasskeyCredentialRetrieved)
    }
  }, [])

  const [showBringWindowToFrontButton, setShowBringWindowToFrontButton] = useState(false)

  // Checks if the popup window is still open.
  // If it is not, then the user has closed the window and we simply navigate back to the select import method screen.
  useInterval(async () => {
    const windowId = popupWindow.current?.id ?? null

    if (windowId === null) {
      return
    }

    try {
      // Will throw if window does not exist anymore.
      await chrome.windows.get(windowId)
      setShowBringWindowToFrontButton(true)
    } catch (_e) {
      // Window does not exist anymore.
      navigate(`/${TopLevelRoutes.Onboarding}/${OnboardingRoutes.SelectImportMethod}`, {
        replace: true,
      })
    }
  }, 1000)

  const onBringWindowToFront = useEvent(async () => {
    const windowId = popupWindow.current?.id ?? null

    if (windowId === null) {
      return
    }

    try {
      await bringWindowToFront(windowId, { centered: true })
    } catch (e) {
      logger.error(e, {
        tags: {
          file: 'InitiatePasskeyAuth.tsx',
          function: 'onBringWindowToFront',
        },
      })
    }
  })

  return (
    <Trace
      logImpression
      properties={{ flow: ExtensionOnboardingFlow.Passkey }}
      screen={ExtensionOnboardingScreens.InitiatePasskeyAuth}
    >
      <Flex row position="absolute" top="$spacing24" right="$spacing24">
        <IconButton
          size="small"
          emphasis="secondary"
          icon={<X />}
          onPress={() => navigate(`/${TopLevelRoutes.Onboarding}/${OnboardingRoutes.SelectImportMethod}`)}
        />
      </Flex>

      <Flex gap="$spacing32" centered>
        <UniswapLogo size={80} />

        <Text>{t('onboarding.importPasskey.continueInSecureWindow')}</Text>

        <Flex row height={35} centered>
          {showBringWindowToFrontButton ? (
            <Button emphasis="secondary" size="small" onPress={onBringWindowToFront}>
              {t('onboarding.importPasskey.bringWindowToFront')}
            </Button>
          ) : (
            <SpinningLoader />
          )}
        </Flex>
      </Flex>
    </Trace>
  )
}
