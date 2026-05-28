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
import { parseMessage } from 'uniswap/src/extension/messagePassing/platform'
import {
  ExtensionToInterfaceRequestType,
  type PasskeyRequest,
  PasskeySignInFlowOpenedSchema,
  RecoveryExportErrorSchema,
  RecoveryExportResultSchema,
} from 'uniswap/src/extension/messagePassing/types/requests'
import { EXTENSION_PASSKEY_AUTH_PATH } from 'uniswap/src/features/passkey/constants'
import { useEmbeddedWalletBaseUrl } from 'uniswap/src/features/passkey/hooks/useEmbeddedWalletBaseUrl'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { ExtensionOnboardingFlow, ExtensionOnboardingScreens } from 'uniswap/src/types/screens/extension'
import { logger } from 'utilities/src/logger/logger'
import { uuid } from 'utilities/src/primitives/uuid'
import { useEvent } from 'utilities/src/react/hooks'
import { useInterval } from 'utilities/src/time/timing'

/**************************************************************************************************************
 *
 *                                     PASSKEY AUTH FLOW: EXTENSION <> WEB APP
 *
 * The popup owns both WebAuthn ceremonies AND every EmbeddedWallet RPC call so the HTTP
 * `Origin` header and `clientDataJSON.origin` always match the popup's own origin — no
 * server-side rpId override is needed, and the extension's chrome-extension:// origin
 * never appears in the signing pipeline. The extension only provisions the HPKE keypair
 * (so the plaintext mnemonic never transits the message channel) and decrypts the
 * ciphertext the popup posts back.
 *
 * +-------------+                                +---------------+                              +------------+
 * |  Extension  |                                |    Web App    |                              |    User    |
 * +-------------+                                +---------------+                              +------------+
 *  |                                                     |                                                  |
 *  |-- Provision HPKE keypair (SPKI pub key) ----------->|                                                  |
 *  |-- Open popup via chrome.windows.create ------------>|                                                  |
 *  |   /auth/passkey/extension?request_id=XXX            |                                                  |
 *  |                                                     |                                                  |
 *  |<-- "PasskeySignInFlowOpened" handshake -------------|                                                  |
 *  |-- Respond: "PasskeyRequest { encryptionKey }" ----->|                                                  |
 *  |                                                     |                                                  |
 *  |                                                     |-- Challenge(WALLET_SIGNIN) + ceremony 1 -------->|
 *  |                                                     |-- WalletSignIn RPC (popup origin)               |
 *  |                                                     |-- Challenge(EXPORT_SEED_PHRASE,encryptionKey)   |
 *  |                                                     |-- ceremony 2 + ExportSeedPhrase RPC ------------>|
 *  |                                                     |                                                  |
 *  |<-- "RecoveryExportResult { ciphertext, enc }" ------|                                                  |
 *  |-- Decrypt w/ HPKE priv key + import to keyring ---                                                    |
 *  |-- Close popup, advance onboarding -----                                                                |
 *
 *  Recovery fallback (no passkey on this device): the popup falls through to email/OAuth
 *  tiles on the same view and ends with the same `RecoveryExportResult` message, so both
 *  authentication paths converge on the extension's single decrypt-and-import step.
 *
 *  Web app code lives in `apps/web/src/pages/ExtensionPasskeyAuthPopUp/index.tsx`. The web
 *  app URL must be declared in `externally_connectable` so chrome.runtime.sendMessage works.
 *
 **************************************************************************************************************/

const POPUP_WIDTH = 420
// Height fits the unified Login view (passkey button + "or" separator + email/Apple/Google
// tiles). The legacy "Log In" landing was 335; recovery steps (Email, PIN) fit too.
const POPUP_HEIGHT = 560

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
  const { provisionRecoveryHpkeKey, importRecoveryEncryptedSeedPhrase } = usePasskeyImportContext()

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

  useEffect(() => {
    // In MV3, onMessageExternal only fires in the background service worker.
    // The background relays external messages via chrome.runtime.sendMessage (internal),
    // so we listen on onMessage instead of onMessageExternal.
    //
    // The handshake (`PasskeySignInFlowOpened` → `PasskeyRequest`) needs sync `sendResponse`
    // to fulfill the popup's awaited `chrome.runtime.sendMessage(...)` promise; the
    // codebase's TypedRuntimeMessageChannel pattern is fire-and-forget only and can't carry
    // that response. The two pure listeners (`RecoveryExportResult` / `RecoveryExportError`)
    // share the same listener registry as the handshake by design, so we register them
    // through `chrome.runtime.onMessage` here too rather than mixing patterns.
    let handleMessagePasskeySignInFlowOpened: Parameters<typeof chrome.runtime.onMessage.addListener>[0]
    let handleRecoveryExportResult: Parameters<typeof chrome.runtime.onMessage.addListener>[0]
    let handleRecoveryExportError: Parameters<typeof chrome.runtime.onMessage.addListener>[0]

    const initiatePasskeyAuth = async (): Promise<void> => {
      if (initiated.current) {
        return
      }

      initiated.current = true

      try {
        const requestId = uuid()

        // Extension owns the HPKE keypair. Only the SPKI public bytes leave this process;
        // the popup runs the EW RPC calls itself and posts ciphertext back via
        // RecoveryExportResult for decrypt-in-place below.
        const { encryptionKey, keypair, suite } = await provisionRecoveryHpkeKey()

        handleRecoveryExportResult = (message: unknown): void => {
          const parsed = parseMessage(message, RecoveryExportResultSchema)
          if (!parsed || parsed.requestId !== requestId) {
            return
          }
          // Self-remove as soon as the expected message arrives so a duplicate relay
          // doesn't re-trigger the import path.
          // oxlint-disable-next-line eslint-js/no-restricted-syntax -- See useEffect comment above
          chrome.runtime.onMessage.removeListener(handleRecoveryExportResult)
          void (async () => {
            try {
              await importRecoveryEncryptedSeedPhrase({
                keypair,
                suite,
                ciphertext: parsed.ciphertext,
                encapsulatedKey: parsed.encapsulatedKey,
              })
              goToNextStep()
            } catch (e) {
              // Scrub before logging: errors from HPKE decrypt / keyring import can surface
              // raw key bytes or partial mnemonic data in their stacks. Only emit a string.
              const detail = e instanceof Error ? `${e.name}: ${e.message}` : 'unknown error'
              logger.error(new Error(`recovery export import failed: ${detail}`), {
                tags: { file: 'InitiatePasskeyAuth.tsx', function: 'handleRecoveryExportResult' },
              })
              navigate(`/${TopLevelRoutes.Onboarding}/${OnboardingRoutes.SelectImportMethod}`, {
                replace: true,
                state: { showErrorMessage: true } satisfies SelectImportMethodLocationState,
              })
            } finally {
              closeWindow(popupWindow.current)
            }
          })()
        }
        // oxlint-disable-next-line eslint-js/no-restricted-syntax -- See useEffect comment above
        chrome.runtime.onMessage.addListener(handleRecoveryExportResult)

        handleRecoveryExportError = (message: unknown): void => {
          const parsed = parseMessage(message, RecoveryExportErrorSchema)
          if (!parsed || parsed.requestId !== requestId) {
            return
          }
          // Self-remove after matching; a retry will re-register via a fresh mount.
          // oxlint-disable-next-line eslint-js/no-restricted-syntax -- See useEffect comment above
          chrome.runtime.onMessage.removeListener(handleRecoveryExportError)
          logger.error(new Error(parsed.error), {
            tags: { file: 'InitiatePasskeyAuth.tsx', function: 'handleRecoveryExportError' },
          })
          closeWindow(popupWindow.current)
          navigate(`/${TopLevelRoutes.Onboarding}/${OnboardingRoutes.SelectImportMethod}`, {
            replace: true,
            state: { showErrorMessage: true } satisfies SelectImportMethodLocationState,
          })
        }
        // oxlint-disable-next-line eslint-js/no-restricted-syntax -- See useEffect comment above
        chrome.runtime.onMessage.addListener(handleRecoveryExportError)

        // oxlint-disable-next-line max-params
        handleMessagePasskeySignInFlowOpened = (
          message: unknown,
          _sender: unknown,
          sendResponse: (response: unknown) => void,
        ): boolean | undefined => {
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

          sendResponse({
            type: ExtensionToInterfaceRequestType.PasskeyRequest,
            requestId,
            encryptionKey,
          } satisfies PasskeyRequest)
        }

        // oxlint-disable-next-line eslint-js/no-restricted-syntax -- See useEffect comment above
        chrome.runtime.onMessage.addListener(handleMessagePasskeySignInFlowOpened)

        const popupUrl = `${webAppBaseUrl}${EXTENSION_PASSKEY_AUTH_PATH}?request_id=${requestId}`
        popupWindow.current = await openPopupWindow({
          url: popupUrl,
          width: POPUP_WIDTH,
          height: POPUP_HEIGHT,
        })
      } catch (e) {
        handleError(e, 'initiatePasskeyAuth')
      }
    }

    // oxlint-disable-next-line typescript/no-floating-promises -- biome-parity: oxlint is stricter here
    initiatePasskeyAuth()

    return () => {
      closeWindow(popupWindow.current)
      // oxlint-disable-next-line eslint-js/no-restricted-syntax -- See useEffect comment above
      chrome.runtime.onMessage.removeListener(handleMessagePasskeySignInFlowOpened)
      // oxlint-disable-next-line eslint-js/no-restricted-syntax -- See useEffect comment above
      chrome.runtime.onMessage.removeListener(handleRecoveryExportResult)
      // oxlint-disable-next-line eslint-js/no-restricted-syntax -- See useEffect comment above
      chrome.runtime.onMessage.removeListener(handleRecoveryExportError)
    }
    // oxlint-disable-next-line react/exhaustive-deps -- biome-parity: oxlint is stricter here
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
    } catch {
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
