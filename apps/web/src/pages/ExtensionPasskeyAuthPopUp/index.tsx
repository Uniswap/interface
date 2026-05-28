import { getChromeRuntime, getChromeRuntimeWithThrow } from '@universe/environment'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router'
import { Flex, SpinningLoader } from 'ui/src'
import { EmbeddedWalletApiClient } from 'uniswap/src/data/rest/embeddedWallet/requests'
import { parseMessage } from 'uniswap/src/extension/messagePassing/platform'
import {
  InterfaceToExtensionRequestType,
  PasskeyRequest,
  PasskeyRequestSchema,
  PasskeySignInFlowOpened,
  RecoveryExportResult,
} from 'uniswap/src/extension/messagePassing/types/requests'
import { Action, AuthenticationTypes } from 'uniswap/src/features/passkey/embeddedWallet'
import { authenticatePasskey } from 'uniswap/src/features/passkey/passkey'
import { RecoveryStep, useRecoveryFlow } from 'uniswap/src/features/passkey/useRecoveryFlow'
import { InterfacePageName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { logger } from 'utilities/src/logger/logger'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import { useTimeout } from 'utilities/src/time/timing'
import { OAuthRedirectProvider } from '~/components/Passkey/OAuthRedirectContext'
import { useRecoveryPrivyAuth } from '~/components/Passkey/useRecoveryPrivyAuth'
import { getPrivyConfig } from '~/config'
import { useExtensionRecoveryBridge } from '~/pages/ExtensionPasskeyAuthPopUp/useExtensionRecoveryBridge'
import { useExternallyConnectableExtensionId } from '~/pages/ExtensionPasskeyAuthPopUp/useExternallyConnectableExtensionId'
import { DeniedView, ExportStep, GetHelpButton, LoginView } from '~/pages/ExtensionPasskeyAuthPopUp/views'

// Passkey Auth Flow: Extension <> Web App
// For a detailed flow chart of how the Web App and the Extension exchange messages,
// check `apps/extension/src/app/features/onboarding/import/InitiatePasskeyAuth.tsx`.

// If we don't receive a response back from the extension in this time, we will show an error.
const EXTENSION_REFERRER_VERIFICATION_TIMEOUT = ONE_SECOND_MS * 3

enum Step {
  Verifying = 'Verifying',
  // Unified "choose how to log in" page. Passkey ceremony auto-starts on entry; the same
  // view also hosts email/OAuth tiles for users without a passkey (or after it fails).
  Login = 'Login',
  Export = 'Export',
  Denied = 'Denied',
}

// `@simplewebauthn/browser` surfaces user cancellation / no-credential as a DOMException —
// `NotAllowedError` covers both user dismissal and "no matching credential", `AbortError`
// fires when the ceremony is programmatically aborted. Both are non-fatal: the Login view
// should stay up so the user can retry or pick email/OAuth.
function isPasskeyCancellation(error: unknown): boolean {
  return error instanceof Error && (error.name === 'NotAllowedError' || error.name === 'AbortError')
}

export default function ExtensionPasskeyAuthPopUp(): JSX.Element {
  // Wrap with OAuthRedirectProvider so the recovery flow's `useOAuthResult` assertion
  // passes. Intentionally does NOT call `useOAuthRedirectRouter` — that hook dispatches
  // `setOpenModal` for the main-app SPA, which would wrongly render a RecoverWallet modal
  // on top of this popup's own flow.
  return (
    <OAuthRedirectProvider value={true}>
      <ExtensionPasskeyAuthPopUpContent />
    </OAuthRedirectProvider>
  )
}

function ExtensionPasskeyAuthPopUpContent(): JSX.Element {
  const { t } = useTranslation()
  const extensionId = useExternallyConnectableExtensionId()

  const [step, setStep] = useState<Step>(Step.Verifying)
  const [passkeyRequestData, setPasskeyRequestData] = useState<PasskeyRequest | null>(null)
  // After WalletSignIn resolves, we only carry the walletId/walletAddress forward. The
  // export challenge is deliberately deferred to the button press — fetching it up front
  // ties it to a challenge the user hasn't yet authorized, and the extra idle
  // round-trip means the challenge could drift near its TTL before the user clicks.
  const [exportRequestData, setExportRequestData] = useState<{
    walletId: string
    walletAddress: string
  } | null>(null)
  const [isAuthenticating, setIsAuthenticating] = useState(false)

  const [searchParams] = useSearchParams()
  const requestId = passkeyRequestData?.requestId ?? searchParams.get('request_id')
  const encryptionKey = passkeyRequestData?.encryptionKey ?? null

  const { appId: privyAppId } = getPrivyConfig(false)
  const [oauthError, setOauthError] = useState<string | undefined>()
  const handleOAuthError = useCallback((err: string) => setOauthError(err), [])
  const privy = useRecoveryPrivyAuth({ onOAuthError: handleOAuthError })

  // PasskeyRequest already delivers the HPKE public key, so the bridge hook's
  // dedicated `RecoveryFlowOpened` round-trip is redundant here. Standalone recovery
  // entry keeps using the handshake by omitting `preProvidedEncryptionKey`.
  const bridge = useExtensionRecoveryBridge({
    extensionId,
    requestId,
    enabled: step === Step.Login,
    generateAuthorizationSignature: privy.generateAuthorizationSignature,
    preProvidedEncryptionKey: encryptionKey ?? undefined,
  })
  // Destructure stable callbacks so the effect deps reference primitive identities
  // rather than the whole `bridge` object (which is a new reference each render).
  const { sendErrorToExtension, onPinDecryptSuccess: bridgeOnPinDecryptSuccess } = bridge

  const flow = useRecoveryFlow({
    privy,
    privyAppId,
    onPinDecryptSuccess: bridgeOnPinDecryptSuccess,
    setOauthError,
  })

  useEffect(() => {
    // Only notify the extension if the user closes while they're actually mid-recovery
    // (past the initial Login tile). Closing on Login just means they changed their mind
    // or the popup's own window-close watcher will navigate back.
    if (step !== Step.Login || flow.step === RecoveryStep.Login || flow.step === RecoveryStep.Recovering) {
      return undefined
    }
    const handleBeforeUnload = (): void => {
      sendErrorToExtension('User closed recovery window')
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [step, flow.step, sendErrorToExtension])

  useEffect(() => {
    const chromeRuntime = getChromeRuntime()

    if (!chromeRuntime?.sendMessage) {
      logger.debug('ExtensionPasskeyAuthPopUp/index.tsx', 'useEffect', 'No `chrome.runtime` found')
      setStep(Step.Denied)
      return
    }

    const initialRequestId = searchParams.get('request_id')
    if (!initialRequestId) {
      logger.debug('ExtensionPasskeyAuthPopUp/index.tsx', 'useEffect', 'No `request_id` found')
      setStep(Step.Denied)
      return
    }

    const handshake = async (): Promise<void> => {
      try {
        const response = await chromeRuntime.sendMessage(extensionId, {
          type: InterfaceToExtensionRequestType.PasskeySignInFlowOpened,
          requestId: initialRequestId,
        } satisfies PasskeySignInFlowOpened)
        const parsedMessage = parseMessage(response, PasskeyRequestSchema)
        if (!parsedMessage) {
          setStep(Step.Denied)
          return
        }
        setPasskeyRequestData(parsedMessage)
        setStep(Step.Login)
      } catch (e) {
        logger.error(e, { tags: { file: 'ExtensionPasskeyAuthPopUp/index.tsx', function: 'handshake' } })
        setStep(Step.Denied)
      }
    }
    handshake().catch(() => {})
    // Intentionally runs exactly once on mount: the searchParams / chromeRuntime values
    // are captured at the top of the effect and must not retrigger the handshake.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onPressSignIn = useCallback(async (): Promise<void> => {
    if (step !== Step.Login || !encryptionKey || isAuthenticating) {
      logger.debug('ExtensionPasskeyAuthPopUp/index.tsx', 'onPressSignIn', 'Invalid state', {
        step,
        hasEncryptionKey: Boolean(encryptionKey),
      })
      return
    }

    // Running the EW RPC calls from this popup (rather than the extension process) means
    // the HTTP `Origin` header and `clientDataJSON.origin` both reduce to the popup's own
    // origin, so the backend's default `expectedOrigin` check passes and the extension's
    // chrome-extension:// origin never appears in the pipeline.
    setIsAuthenticating(true)
    let currentStep = 'init'

    try {
      currentStep = 'challenge(WALLET_SIGNIN)'
      const signinChallenge = await EmbeddedWalletApiClient.fetchChallengeRequest({
        type: AuthenticationTypes.PASSKEY_AUTHENTICATION,
        action: Action.WALLET_SIGNIN,
      })
      if (!signinChallenge.challengeOptions) {
        sendErrorToExtension('No challenge options for WALLET_SIGNIN')
        return
      }

      currentStep = 'ceremony(WALLET_SIGNIN)'
      const signinCredential = await authenticatePasskey(signinChallenge.challengeOptions)
      if (!signinCredential) {
        // User cancelled or device has no passkey. Stay on Login so the email/OAuth tiles
        // remain the path forward — no need to bail out of the whole flow.
        return
      }

      currentStep = 'WalletSignIn'
      const signinResp = await EmbeddedWalletApiClient.fetchWalletSigninRequest({ credential: signinCredential })
      if (!signinResp.walletId || !signinResp.walletAddress) {
        sendErrorToExtension('WalletSignIn response missing walletId or walletAddress')
        return
      }

      // Export challenge is fetched on button press so the ceremony kicks off immediately
      // after — see onPressImport.
      setExportRequestData({
        walletId: signinResp.walletId,
        walletAddress: signinResp.walletAddress,
      })
      setStep(Step.Export)
    } catch (error) {
      if (isPasskeyCancellation(error)) {
        // Stay on Login. The email/OAuth tiles remain available; the user can press
        // Continue with Passkey again to retry the ceremony.
        logger.debug('ExtensionPasskeyAuthPopUp/index.tsx', 'onPressSignIn', 'Passkey ceremony cancelled', {
          step: currentStep,
        })
        return
      }
      logger.error(error, {
        tags: { file: 'ExtensionPasskeyAuthPopUp/index.tsx', function: 'onPressSignIn' },
        extra: { failedStep: currentStep },
      })
      const detail = error instanceof Error ? `${error.name}: ${error.message}` : String(error)
      sendErrorToExtension(`Sign-in failed at step "${currentStep}" — ${detail}`)
    } finally {
      setIsAuthenticating(false)
    }
  }, [step, encryptionKey, isAuthenticating, sendErrorToExtension])

  // Auto-start the sign-in ceremony once the handshake hands us a request. Keyed off
  // `passkeyRequestData` (set exactly once by the handshake, never reset) so this fires
  // on the null→set transition only — not when `isAuthenticating` flips back to false
  // after a user-dismissed prompt. Cleanup aborts the in-flight follow-up if the popup
  // unmounts mid-flow.
  useEffect(() => {
    if (!passkeyRequestData?.encryptionKey) {
      return undefined
    }
    const controller = new AbortController()
    ;(async () => {
      if (controller.signal.aborted) {
        return
      }
      await onPressSignIn()
    })().catch(() => {})
    return () => controller.abort()
    // onPressSignIn captures step/encryptionKey/isAuthenticating; at the moment
    // passkeyRequestData transitions to set, those values are correct for the trigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [passkeyRequestData])

  const onPressImport = async (): Promise<void> => {
    if (step !== Step.Export || !exportRequestData || !encryptionKey || !requestId || isAuthenticating) {
      return
    }

    const chromeRuntime = getChromeRuntimeWithThrow()
    setIsAuthenticating(true)
    let currentStep = 'init'

    try {
      currentStep = 'challenge(EXPORT_SEED_PHRASE)'
      const exportChallenge = await EmbeddedWalletApiClient.fetchChallengeRequest({
        type: AuthenticationTypes.PASSKEY_AUTHENTICATION,
        action: Action.EXPORT_SEED_PHRASE,
        walletId: exportRequestData.walletId,
        encryptionKey,
      })
      if (!exportChallenge.challengeOptions) {
        sendErrorToExtension('No challenge options for EXPORT_SEED_PHRASE')
        setIsAuthenticating(false)
        return
      }

      currentStep = 'ceremony(EXPORT_SEED_PHRASE)'
      const exportCredential = await authenticatePasskey(exportChallenge.challengeOptions)
      if (!exportCredential) {
        // User cancelled the export ceremony. Keep the button available for retry.
        setIsAuthenticating(false)
        return
      }

      currentStep = 'ExportSeedPhrase'
      const { ciphertext, encapsulatedKey } = await EmbeddedWalletApiClient.fetchExportSeedPhraseRequest({
        credential: exportCredential,
        encryptionKey,
      })

      // Explicitly surface an error if either field is empty. Forwarding empty strings
      // would look like a valid RecoveryExportResult to the extension; the HPKE decrypt
      // would then throw with a cryptic message and the user sees a generic failure.
      if (!ciphertext || !encapsulatedKey) {
        sendErrorToExtension(`ExportSeedPhrase response missing ${!ciphertext ? 'ciphertext' : 'encapsulatedKey'}`)
        setIsAuthenticating(false)
        return
      }

      await chromeRuntime.sendMessage(extensionId, {
        type: InterfaceToExtensionRequestType.RecoveryExportResult,
        requestId,
        ciphertext,
        encapsulatedKey,
      } satisfies RecoveryExportResult)

      // Extension decrypts with its HPKE private key, imports the mnemonic, and closes
      // the popup — close defensively in case the extension's closeWindow fires later.
      window.close()
    } catch (error) {
      if (isPasskeyCancellation(error)) {
        // User dismissed the export prompt. Keep them on the Export step so the Import
        // button is available for retry — no need to unwind the whole onboarding flow.
        logger.debug('ExtensionPasskeyAuthPopUp/index.tsx', 'onPressImport', 'Export ceremony cancelled', {
          step: currentStep,
        })
        setIsAuthenticating(false)
        return
      }
      logger.error(error, {
        tags: { file: 'ExtensionPasskeyAuthPopUp/index.tsx', function: 'onPressImport' },
        extra: { failedStep: currentStep },
      })
      const detail = error instanceof Error ? `${error.name}: ${error.message}` : String(error)
      sendErrorToExtension(`Export failed at step "${currentStep}" — ${detail}`)
      setIsAuthenticating(false)
    }
  }

  useTimeout(() => {
    setStep((current) => (current === Step.Verifying ? Step.Denied : current))
  }, EXTENSION_REFERRER_VERIFICATION_TIMEOUT)

  if (step === Step.Denied) {
    return <DeniedView t={t} />
  }

  if (step === Step.Login) {
    return (
      <LoginView
        handshakeStatus={bridge.status}
        flow={flow}
        oauthError={oauthError}
        isPasskeyLoading={isAuthenticating}
        onContinueWithPasskey={onPressSignIn}
        t={t}
      />
    )
  }

  return (
    <Trace logImpression page={InterfacePageName.ExtensionPasskeySignInPage}>
      <Flex flexDirection="column" alignItems="center" justifyContent="center" minHeight="100vh">
        <Flex width="400px" padding="$spacing16" flexDirection="column" gap="$spacing16">
          <GetHelpButton t={t} />
          {step === Step.Export && exportRequestData ? (
            <ExportStep
              walletAddress={exportRequestData.walletAddress}
              isAuthenticating={isAuthenticating}
              onPressImport={onPressImport}
            />
          ) : (
            <Flex alignItems="center" justifyContent="center" minHeight={200}>
              <SpinningLoader size={32} />
            </Flex>
          )}
        </Flex>
      </Flex>
    </Trace>
  )
}
