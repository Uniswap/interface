/* oxlint-disable max-lines */
import { Code, ConnectError } from '@connectrpc/connect'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { EmbeddedWalletApiClient } from 'uniswap/src/data/rest/embeddedWallet/requests'
import { checkPinReuse } from 'uniswap/src/features/passkey/checkPinReuse'
import { checkRecoveryAvailability } from 'uniswap/src/features/passkey/checkRecoveryAvailability'
import {
  authorizeAndCompleteRecovery,
  type EncryptedRecoveryState,
  encryptAndStoreRecovery,
  RecoveryMethod,
  RecoveryOprfError,
  toRecoveryAuthMethodType,
} from 'uniswap/src/features/passkey/embeddedWallet'
import { hashAuthMethodId } from 'uniswap/src/features/passkey/pinCrypto'
import { validatePin } from 'uniswap/src/features/passkey/pinValidation'
import { fetchEncryptedBlob } from 'uniswap/src/features/passkey/privyBlobStore'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { logger } from 'utilities/src/logger/logger'
import { useEvent } from 'utilities/src/react/hooks'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { type AuthenticatorDisplay } from '~/components/AccountDrawer/PasskeyMenu/hooks/useListAuthenticatorsQuery'
import { useDigitInput } from '~/components/Passkey/BackupLoginComponents'
import { OAUTH_PENDING_KEY } from '~/components/Passkey/useOAuthRedirectRouter'
import { useOAuthResult } from '~/components/Passkey/useOAuthResult'
import { POPUP_MEDIUM_DISMISS_MS } from '~/components/Popups/constants'
import { getPrivyConfig } from '~/config'
import { useAndroidKeyboardViewportFix } from '~/hooks/useAndroidKeyboardViewportFix'
import { useMaybeLoginWithEmail, useMaybeLoginWithOAuth, useMaybePrivy } from '~/hooks/useMaybePrivy'
import { useModalState } from '~/hooks/useModalState'
import { useEmbeddedWalletState } from '~/state/embeddedWallet/store'
import { popupRegistry } from '~/state/popups/registry'
import { PopupType } from '~/state/popups/types'

export enum Step {
  METHOD_SELECT = 0,
  EMAIL_ENTRY = 1,
  EMAIL_CODE = 2,
  ALREADY_IN_USE = 3,
  PASSCODE_INTRO = 4,
  SET_PASSCODE = 5,
  CONFIRM_PASSCODE = 6,
  SUCCESS = 7,
}

function isPrivyInvalidCredentials(error: unknown): boolean {
  return error instanceof Error && (error as { privyErrorCode?: string }).privyErrorCode === 'invalid_credentials'
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const OTP_LENGTH = 6
const PASSCODE_LENGTH = 4

interface UseBackupLoginFlowOptions {
  modalName?: (typeof ModalName)[keyof typeof ModalName]
  oauthPendingKey?: string
  initialStep?: Step
  // Reconnect: the method already belongs to this wallet, so skip the "already in use" probe.
  skipAvailabilityCheck?: boolean
  // Reconnect: reject a new PIN that still decrypts the old (v1) blob ("cannot reuse last passcode").
  // Requires its own v1 OprfEvaluate — the rotation blob-build eval (v2) can't detect reuse.
  enablePinReuseCheck?: boolean
  // Reconnect (v1→v2 rotation): force the new-blob OprfEvaluate under v2 with a fresh nonce. Without
  // it, an existing v1 config routes the eval to the recovery branch — encrypting the new blob under
  // v1 (a broken "v2" config) and burning a recovery rate-limiter attempt.
  isRotation?: boolean
}

/**
 * Orchestrates the shared "backup login" setup flow (OAuth/email re-auth → passcode → confirm →
 * passkey → success). Owns all state, mutations, and the OAuth-return handling; consumers render
 * step UI from the returned surface. Reused by the add-backup-login and reconnect (rotation) modals.
 */
export function useBackupLoginFlow({
  modalName = ModalName.AddBackupLogin,
  oauthPendingKey = OAUTH_PENDING_KEY,
  initialStep = Step.METHOD_SELECT,
  skipAvailabilityCheck = false,
  enablePinReuseCheck = false,
  isRotation = false,
}: UseBackupLoginFlowOptions = {}) {
  const { t } = useTranslation()
  const { isOpen, onClose } = useModalState(modalName)
  // Keep this fixed bottom sheet on-screen when the Android soft keyboard opens (email/OTP/passcode
  // steps). No-op on iOS/desktop. See hook for the full explanation.
  useAndroidKeyboardViewportFix(isOpen)
  const queryClient = useQueryClient()
  const { walletId } = useEmbeddedWalletState()
  const [step, setStep] = useState<Step>(initialStep)
  const [isCheckingReuse, setIsCheckingReuse] = useState(false)
  const [email, setEmail] = useState('')
  const firstPinRef = useRef('')
  const encryptionIdRef = useRef(0)
  const verificationIdRef = useRef(0)
  const reuseBlobRef = useRef<string | null>(null)
  const [showPasscode, setShowPasscode] = useState(false)
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [isEncrypting, setIsEncrypting] = useState(false)
  const [passcodeError, setPasscodeError] = useState<string | undefined>()
  const [cryptoResult, setCryptoResult] = useState<EncryptedRecoveryState | null>(null)
  const [oauthProvider, setOauthProvider] = useState<'google' | 'apple' | null>(null)
  const [oauthEmail, setOauthEmail] = useState<string | undefined>()

  const { ready: privyReady, getAccessToken, user, logout } = useMaybePrivy()

  const oauthReturn = useOAuthResult(oauthPendingKey)

  // Probes the server before advancing to the passcode setup step. If the picked
  // factor is already linked to another wallet, surfaces ALREADY_IN_USE so the
  // user doesn't burn a passkey ceremony on a known-bad path. The generation
  // guard prevents a late resolve from clobbering state if the user closed or
  // navigated away during the ~200-500ms wait.
  const advanceAfterVerification = useEvent(async (identifier: string): Promise<void> => {
    const thisId = ++verificationIdRef.current
    try {
      const accessToken = await getAccessToken()
      if (verificationIdRef.current !== thisId) {
        return
      }
      if (!accessToken || skipAvailabilityCheck) {
        setStep(Step.PASSCODE_INTRO)
        return
      }
      const { available } = await checkRecoveryAvailability({ identifier, accessToken })
      if (verificationIdRef.current !== thisId) {
        return
      }
      setStep(available ? Step.PASSCODE_INTRO : Step.ALREADY_IN_USE)
    } catch (error) {
      if (verificationIdRef.current !== thisId) {
        return
      }
      logger.error(error, { tags: { file: 'useBackupLoginFlow', function: 'advanceAfterVerification' } })
      setStep(Step.PASSCODE_INTRO)
    }
  })

  // When OAuth return is detected, check availability then advance.
  useEffect(() => {
    if (oauthReturn.provider && !oauthReturn.pending && oauthReturn.providerEmail) {
      setOauthProvider(oauthReturn.provider)
      setOauthEmail(oauthReturn.providerEmail)
      void advanceAfterVerification(oauthReturn.providerEmail)
    }
  }, [oauthReturn.provider, oauthReturn.pending, oauthReturn.providerEmail, advanceAfterVerification])

  const { sendCode, loginWithCode } = useMaybeLoginWithEmail()

  const handleSendCodeError = (e: Error, fn: string) =>
    logger.error(e, { tags: { file: 'useBackupLoginFlow', function: fn } })

  const { initOAuth, loading: oauthLoading } = useMaybeLoginWithOAuth({
    onError: (oauthError) => {
      logger.error(oauthError, { tags: { file: 'useBackupLoginFlow', function: 'handleOAuthLogin' } })
      sessionStorage.removeItem(oauthPendingKey)
      setOauthProvider(null)
    },
  })

  // Privy's `sendCode` / `initOAuth` throw "Already logged in" if an authenticated
  // session exists. Drop the existing session before starting a backup-login flow.
  const ensureLoggedOut = useEvent(async (): Promise<void> => {
    if (user) {
      await logout()
    }
  })

  const sendCodeMutation = useMutation({
    mutationFn: async () => {
      if (!privyReady) {
        throw new Error('Privy is not ready')
      }
      await ensureLoggedOut()
      return sendCode({ email })
    },
    onSuccess: () => setStep(Step.EMAIL_CODE),
    onError: (e) => handleSendCodeError(e, 'handleSendCode'),
  })

  const resendCodeMutation = useMutation({
    mutationFn: async () => {
      if (!privyReady) {
        throw new Error('Privy is not ready')
      }
      await ensureLoggedOut()
      return sendCode({ email })
    },
    onError: (e) => handleSendCodeError(e, 'handleResendCode'),
  })

  const submitCodeMutation = useMutation({
    mutationFn: (code: string) => {
      if (!privyReady) {
        throw new Error('Privy is not ready')
      }
      return loginWithCode({ code })
    },
    onSuccess: () => {
      void advanceAfterVerification(email)
    },
    onError: (e) => {
      logger.error(e, { tags: { file: 'useBackupLoginFlow', function: 'handleSubmitCode' } })
      if (isPrivyInvalidCredentials(e)) {
        otpInput.reset()
      }
    },
  })

  const isInvalidOtpError = isPrivyInvalidCredentials(submitCodeMutation.error)
  const error = sendCodeMutation.error || (!isInvalidOtpError && submitCodeMutation.error) || resendCodeMutation.error
  const isLoading = sendCodeMutation.isPending || submitCodeMutation.isPending || resendCodeMutation.isPending
  const errorMessage = isInvalidOtpError
    ? t('account.passkey.backupLogin.code.error.invalid')
    : error
      ? t('common.card.error.description')
      : undefined

  const handleInitOAuth = useEvent(async (provider: 'google' | 'apple'): Promise<void> => {
    if (!privyReady) {
      return
    }
    await ensureLoggedOut()
    setOauthProvider(provider)
    sessionStorage.setItem(oauthPendingKey, provider)
    await initOAuth({ provider })
  })

  const handleSubmitCode = useEvent((code: string) => {
    submitCodeMutation.mutate(code)
  })

  // Fetches (and caches) the old v1 blob for the reuse check, using the re-authed token.
  const ensureReuseBlob = useEvent(async (accessToken: string, identifier: string): Promise<string | null> => {
    if (reuseBlobRef.current) {
      return reuseBlobRef.current
    }
    const { encryptedKeyId } = await EmbeddedWalletApiClient.fetchGetRecoveryConfig(
      { authMethodId: hashAuthMethodId(identifier) },
      accessToken,
    )
    if (!encryptedKeyId) {
      return null
    }
    reuseBlobRef.current = await fetchEncryptedBlob({
      accessToken,
      keyId: encryptedKeyId,
      privyAppId: getPrivyConfig().appId,
    })
    return reuseBlobRef.current
  })

  const handleSubmitPasscode = useEvent(async (code: string) => {
    setPasscodeError(undefined)
    const validation = validatePin(code)
    if (!validation.valid) {
      setPasscodeError(
        validation.reason === 'banned'
          ? t('account.passkey.backupLogin.passcode.error.banned')
          : t('account.passkey.backupLogin.passcode.error.invalid'),
      )
      passcodeInput.reset()
      return
    }
    // Rotation only: reject a new PIN that still decrypts the old (v1) blob. The v2 blob-build eval
    // can't detect reuse, so this runs its own v1 OprfEvaluate. Fails open so a check error never
    // blocks the rotation.
    if (enablePinReuseCheck) {
      setIsCheckingReuse(true)
      try {
        const accessToken = await getAccessToken()
        const identifier = oauthEmail ?? email
        const blob = accessToken ? await ensureReuseBlob(accessToken, identifier) : null
        if (
          accessToken &&
          blob &&
          (await checkPinReuse({ pin: code, email: identifier, accessToken, encryptedBlob: blob }))
        ) {
          setPasscodeError(t('account.passkey.backupLogin.passcode.error.reused'))
          passcodeInput.reset()
          return
        }
      } catch (reuseError) {
        logger.error(reuseError, { tags: { file: 'useBackupLoginFlow', function: 'handleSubmitPasscode' } })
      } finally {
        setIsCheckingReuse(false)
      }
    }
    firstPinRef.current = code
    setStep(Step.CONFIRM_PASSCODE)
  })

  const effectiveEmail = oauthEmail ?? email

  // Phase 1: validate PIN match, run crypto (Argon2id, OPRF, encrypt, store blob)
  const handleConfirmPasscode = useEvent(async (code: string) => {
    if (code !== firstPinRef.current) {
      setPasscodeError(t('account.passkey.backupLogin.confirmPasscode.error.mismatch'))
      confirmPasscodeInput.reset()
      return
    }
    setPasscodeError(undefined)
    setIsEncrypting(true)
    const thisId = ++encryptionIdRef.current
    try {
      const accessToken = await getAccessToken()
      if (!accessToken) {
        throw new Error('No access token available')
      }
      const encrypted = await encryptAndStoreRecovery({
        pin: firstPinRef.current,
        email: effectiveEmail,
        accessToken,
        privyAppId: getPrivyConfig().appId,
        rotate: isRotation,
      })
      // Guard against stale result if user navigated away during async work
      if (encryptionIdRef.current !== thisId) {
        return
      }
      firstPinRef.current = ''
      setCryptoResult(encrypted)
    } catch (encryptError) {
      if (encryptionIdRef.current !== thisId) {
        return
      }
      logger.error(encryptError, { tags: { file: 'useBackupLoginFlow', function: 'handleConfirmPasscode' } })
      // OprfEvaluate rate-limit / banned-PIN messages are user-facing; show them verbatim.
      setPasscodeError(
        encryptError instanceof RecoveryOprfError ? encryptError.message : t('common.card.error.description'),
      )
    } finally {
      if (encryptionIdRef.current === thisId) {
        setIsEncrypting(false)
      }
    }
  })

  // Phase 2: Challenge + authenticatePasskey + SetupRecovery.
  // Must fire from a fresh click so WebAuthn's transient activation is valid.
  const handleSignInWithPasskey = useEvent(async () => {
    if (!walletId || !user?.id || !cryptoResult) {
      logger.error(new Error('Missing preconditions for passkey sign-in'), {
        tags: { file: 'useBackupLoginFlow', function: 'handleSignInWithPasskey' },
      })
      return
    }

    setIsSigningIn(true)
    try {
      const authMethodType = toRecoveryAuthMethodType(oauthProvider)
      await authorizeAndCompleteRecovery({
        encrypted: cryptoResult,
        email: effectiveEmail,
        walletId,
        privyUserId: user.id,
        authMethodType,
      })

      // Update the cache in place rather than invalidate: a refetch after an OAuth redirect would
      // re-prompt for the passkey to derive a fresh NECK. Synthesize the RecoveryMethod locally
      // since SetupRecoveryResponse omits it; the next refetch overwrites this.
      const newRecoveryMethod = new RecoveryMethod({
        type: authMethodType,
        identifier: effectiveEmail,
        createdAt: BigInt(Date.now()),
        status: 'ACTIVE',
      })
      queryClient.setQueryData<{
        authenticators: AuthenticatorDisplay[]
        recoveryMethods: RecoveryMethod[]
      }>([ReactQueryCacheKey.ListAuthenticators, walletId], (old) => {
        if (!old) {
          return old
        }
        // Rotation replaces the same auth method in place — drop the stale (v1, needs-rotation)
        // entry so it isn't shown alongside the rotated one. Match on identifier or the rotation
        // flag so it's removed even if the re-authed email casing differs. For a fresh add there's
        // no matching entry, so this is a plain append.
        const withoutStale = old.recoveryMethods.filter(
          (m) => !(m.type === authMethodType && (m.identifier === effectiveEmail || m.shouldRotate)),
        )
        return { ...old, recoveryMethods: [...withoutStale, newRecoveryMethod] }
      })

      popupRegistry.addPopup(
        { type: PopupType.Success, message: t('notification.backupLogin.added') },
        'backup-login-added-success',
        POPUP_MEDIUM_DISMISS_MS,
      )
      setStep(Step.SUCCESS)
    } catch (signInError) {
      logger.error(signInError, { tags: { file: 'useBackupLoginFlow', function: 'handleSignInWithPasskey' } })
      setCryptoResult(null)
      const isAlreadyInUse =
        signInError instanceof ConnectError &&
        signInError.code === Code.InvalidArgument &&
        signInError.message.includes('already in use')
      setPasscodeError(
        isAlreadyInUse ? t('account.passkey.backupLogin.add.alreadyInUse') : t('common.card.error.description'),
      )
    } finally {
      setIsSigningIn(false)
    }
  })

  const otpInput = useDigitInput({ length: OTP_LENGTH, onComplete: handleSubmitCode })
  const passcodeInput = useDigitInput({ length: PASSCODE_LENGTH, onComplete: handleSubmitPasscode })
  const confirmPasscodeInput = useDigitInput({ length: PASSCODE_LENGTH, onComplete: handleConfirmPasscode })

  const handleClose = useEvent(() => {
    setStep(initialStep)
    setEmail('')
    encryptionIdRef.current++
    verificationIdRef.current++
    firstPinRef.current = ''
    reuseBlobRef.current = null
    setCryptoResult(null)
    setIsSigningIn(false)
    setIsCheckingReuse(false)
    otpInput.reset()
    passcodeInput.reset()
    confirmPasscodeInput.reset()
    setShowPasscode(false)
    setIsEncrypting(false)
    setPasscodeError(undefined)
    sendCodeMutation.reset()
    resendCodeMutation.reset()
    submitCodeMutation.reset()
    setOauthProvider(null)
    setOauthEmail(undefined)
    sessionStorage.removeItem(oauthPendingKey)
    onClose()
  })

  const handleDone = useEvent(() => {
    handleClose()
  })

  const handleBack = useEvent(() => {
    sendCodeMutation.reset()
    resendCodeMutation.reset()
    submitCodeMutation.reset()
    if (step === Step.EMAIL_ENTRY) {
      setStep(Step.METHOD_SELECT)
    } else if (step === Step.EMAIL_CODE) {
      verificationIdRef.current++
      otpInput.reset()
      setStep(Step.EMAIL_ENTRY)
    } else if (step === Step.SET_PASSCODE) {
      passcodeInput.reset()
      setStep(Step.PASSCODE_INTRO)
    } else if (step === Step.CONFIRM_PASSCODE) {
      encryptionIdRef.current++
      confirmPasscodeInput.reset()
      passcodeInput.reset()
      firstPinRef.current = ''
      setCryptoResult(null)
      setIsSigningIn(false)
      setPasscodeError(undefined)
      setIsEncrypting(false)
      setStep(Step.SET_PASSCODE)
    }
  })

  const handleSendCode = useEvent(() => {
    if (!EMAIL_REGEX.test(email)) {
      return
    }
    sendCodeMutation.mutate()
  })

  const handleResendCode = useEvent(() => {
    otpInput.reset()
    resendCodeMutation.mutate()
  })

  const handleAlreadyInUseSignOut = useEvent(async () => {
    try {
      await logout()
    } catch (e) {
      logger.error(e, { tags: { file: 'useBackupLoginFlow', function: 'handleAlreadyInUseSignOut' } })
    } finally {
      handleClose()
    }
  })

  const handleAlreadyInUseTryAgain = useEvent(() => {
    verificationIdRef.current++
    setOauthProvider(null)
    setOauthEmail(undefined)
    setEmail('')
    sessionStorage.removeItem(oauthPendingKey)
    sendCodeMutation.reset()
    resendCodeMutation.reset()
    submitCodeMutation.reset()
    otpInput.reset()
    setStep(initialStep)
  })

  const goToEmailEntry = useEvent(() => setStep(Step.EMAIL_ENTRY))
  const goToSetPasscode = useEvent(() => setStep(Step.SET_PASSCODE))

  const isValidEmail = EMAIL_REGEX.test(email)

  return {
    isOpen,
    step,
    email,
    setEmail,
    isValidEmail,
    isLoading,
    errorMessage,
    showPasscode,
    setShowPasscode,
    isEncrypting,
    isCheckingReuse,
    isSigningIn,
    passcodeError,
    cryptoResult,
    oauthProvider,
    oauthEmail,
    oauthLoading,
    otpInput,
    passcodeInput,
    confirmPasscodeInput,
    submitCodeMutation,
    handleInitOAuth,
    handleSendCode,
    handleResendCode,
    handleClose,
    handleDone,
    handleBack,
    handleSignInWithPasskey,
    handleAlreadyInUseSignOut,
    handleAlreadyInUseTryAgain,
    goToEmailEntry,
    goToSetPasscode,
  }
}
