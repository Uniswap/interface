/* oxlint-disable max-lines */
import { useMutation } from '@tanstack/react-query'
import type { TFunction } from 'i18next'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDigitInput } from 'uniswap/src/components/passkey/recovery/useDigitInput'
import { EmbeddedWalletApiClient } from 'uniswap/src/data/rest/embeddedWallet/requests'
import { toRecoveryAuthMethodType } from 'uniswap/src/features/passkey/embeddedWallet'
import { hashAuthMethodId } from 'uniswap/src/features/passkey/pinCrypto'
import { validatePin } from 'uniswap/src/features/passkey/pinValidation'
import { attemptPinDecryption } from 'uniswap/src/features/passkey/recoveryExecute'
import type { RecoveryPrivyAuth } from 'uniswap/src/features/passkey/recoveryPrivyAuth'
import { rotateRecoveryWithRecoveryAuth } from 'uniswap/src/features/passkey/recoveryRotate'
import { RecoveryOprfError } from 'uniswap/src/features/passkey/recoverySetup'
import { logger } from 'utilities/src/logger/logger'
import { useEvent } from 'utilities/src/react/hooks'
import { useInterval } from 'utilities/src/time/timing'
import { z } from 'zod'

export enum RecoveryStep {
  Login = 'LOGIN',
  OAuthLoading = 'OAUTH_LOADING',
  EmailEntry = 'EMAIL_ENTRY',
  EmailCode = 'EMAIL_CODE',
  EnterPin = 'ENTER_PIN',
  AddPasskey = 'ADD_PASSKEY',
  // Passkey-less rotation (recover-with-email on a v1 method): primer → set + confirm a new
  // passcode → rotate to v2 → hand off to AddPasskey to register a device passkey.
  NewPasscodeIntro = 'NEW_PASSCODE_INTRO',
  SetNewPasscode = 'SET_NEW_PASSCODE',
  ConfirmNewPasscode = 'CONFIRM_NEW_PASSCODE',
  // v1 recovery rotation disabled (the `disable_v1_ew_rotation` flag): rotation is no longer
  // offered; the user is pointed at passkey/recovery-phrase sign-in instead.
  RotationExpired = 'ROTATION_EXPIRED',
  Recovering = 'RECOVERING',
  NoWalletFound = 'NO_WALLET_FOUND',
}

// OprfEvaluate rate-limit / banned-PIN messages are user-facing; the "not enabled" flag-off error
// is remapped to the expired/use-a-passkey copy. Everything else is a generic failure.
function mapRotationError(e: unknown, t: TFunction): string {
  if (e instanceof RecoveryOprfError) {
    return e.message
  }
  if (e instanceof Error && e.message.includes('Passkey-less recovery rotation is not enabled')) {
    return t('account.passkey.recovery.rotationNotEnabled')
  }
  return t('common.card.error.description')
}

const emailSchema = z.email()
const OTP_LENGTH = 6
const PASSCODE_LENGTH = 4

interface PostPinArgs {
  authPrivateKey: Uint8Array
  authMethodId: string
  email: string
  // Forwarded to the recovery RPCs, which now require a Bearer token.
  accessToken: string
}

interface UseRecoveryFlowOptions {
  privy: RecoveryPrivyAuth
  privyAppId: string
  /**
   * Fired once the user has successfully decrypted their auth key. Implementations do the
   * platform-specific post-auth work (export seed phrase, register a new passkey, etc.)
   * and resolve when done. Throwing routes the flow back to `EMAIL_ENTRY`.
   */
  onPinDecryptSuccess: (args: PostPinArgs) => Promise<void>
  /**
   * Setter for OAuth error state, lifted to the caller so the same setter can also be
   * passed to `useRecoveryPrivyAuth({ onOAuthError })` — that's how Privy's `onError`
   * (denied consent, closed popup) reaches the flow's `OAuthLoadingStep`.
   */
  setOauthError: (err: string | undefined) => void
  /**
   * If true, after PIN decryption the flow transitions to `ADD_PASSKEY` and waits for
   * the caller to invoke `confirmAddPasskey()`. Otherwise it transitions directly to
   * `RECOVERING` and fires `onPinDecryptSuccess`. Used by the web add-passkey flow, where
   * the user confirms the WebAuthn registration with an explicit button press.
   */
  showAddPasskeyStep?: boolean
  /**
   * If true, when the recovered config `shouldRotate` (v1), the flow routes to the
   * passkey-less rotation sub-flow (set + confirm a new passcode → rotate to v2) instead of
   * `ADD_PASSKEY`/`onPinDecryptSuccess`. Requires the server flag `ALLOW_V1_RECOVERY_AUTH_ROTATION`.
   */
  enableRotation?: boolean
  /**
   * When true, v1 recovery rotation is disabled (the `disable_v1_ew_rotation` kill switch): a
   * `shouldRotate` config short-circuits to `ROTATION_EXPIRED` (sign in with a passkey) instead of
   * offering the rotation sub-flow. Ignored unless `enableRotation` is also set.
   */
  disableRotation?: boolean
}

/**
 * Shared email-or-OAuth → OTP → PIN state machine. Consumers render step UI based on
 * `step` and call the returned handlers. Platform-specific Privy integration is injected
 * via the `privy` object; the post-PIN action (export seed, register passkey, etc.) is
 * injected via `onPinDecryptSuccess`.
 */
// oxlint-disable-next-line typescript/explicit-function-return-type -- complex inferred shape, consumers rely on inference
export function useRecoveryFlow({
  privy,
  privyAppId,
  onPinDecryptSuccess,
  setOauthError,
  showAddPasskeyStep = false,
  enableRotation = false,
  disableRotation = false,
}: UseRecoveryFlowOptions) {
  const { t } = useTranslation()

  const [step, setStep] = useState<RecoveryStep>(() =>
    privy.oauthReturn.pending ? RecoveryStep.OAuthLoading : RecoveryStep.Login,
  )
  const [email, setEmail] = useState('')
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [authPrivateKey, setAuthPrivateKey] = useState<Uint8Array | null>(null)
  const [showPasscode, setShowPasscode] = useState(false)
  const [pinError, setPinError] = useState<string | undefined>()
  const [cooldownExpiresAt, setCooldownExpiresAt] = useState<number | null>(null)
  const [isDecrypting, setIsDecrypting] = useState(false)
  const [recoveryWalletAddress, setRecoveryWalletAddress] = useState<string | undefined>()
  const [encryptedKeyId, setEncryptedKeyId] = useState<string | undefined>()
  const [encryptedBlob, setEncryptedBlob] = useState<string | undefined>()
  // v1 (legacy) config that must be rotated before it can recover/export. Hosts branch on this.
  const [shouldRotate, setShouldRotate] = useState(false)
  // True once a v1→v2 rotation has completed. Drives the post-rotation add-passkey styling; kept
  // separate from `shouldRotate` (which flips back to false when the rotation succeeds).
  const [didRotate, setDidRotate] = useState(false)
  // Privy wallet id from GetRecoveryConfig — needed by the rotation Challenge(SETUP_RECOVERY).
  const [walletId, setWalletId] = useState<string | undefined>()
  const [oauthProvider, setOauthProvider] = useState<'google' | 'apple' | null>(null)
  const [oauthEmail, setOauthEmail] = useState<string | undefined>()
  const [finalStepError, setFinalStepError] = useState<string | undefined>()
  // Passkey-less rotation state.
  const firstNewPinRef = useRef('')
  // The verified old passcode (from EnterPin), kept so the new passcode can be rejected if it
  // matches — without a second v1 OprfEvaluate that would burn a recovery rate-limiter attempt.
  const oldPinRef = useRef('')
  const [newPasscodeError, setNewPasscodeError] = useState<string | undefined>()

  const effectiveEmail = oauthEmail ?? email
  const isValidEmail = emailSchema.safeParse(email).success

  // Applies a GetRecoveryConfig result to flow state. Returns true when rotation is disabled for a
  // v1 config and the flow was short-circuited to the expired screen (the caller should stop).
  const applyRecoveryConfig = useEvent(
    (config: Awaited<ReturnType<typeof EmbeddedWalletApiClient.fetchGetRecoveryConfig>>): boolean => {
      setEncryptedKeyId(config.encryptedKeyId)
      setShouldRotate(config.shouldRotate)
      setWalletId(config.walletId)
      if (config.walletAddress) {
        setRecoveryWalletAddress(config.walletAddress)
      }
      if (enableRotation && config.shouldRotate && disableRotation) {
        setStep(RecoveryStep.RotationExpired)
        return true
      }
      return false
    },
  )

  const resetRotationPasscodeState = useEvent(() => {
    firstNewPinRef.current = ''
    newPasscodeInput.reset()
    confirmNewPasscodeInput.reset()
    setNewPasscodeError(undefined)
  })

  const fetchRecoveryAndAdvance = useEvent(async (providerEmail: string, isActive?: () => boolean) => {
    try {
      const token = await privy.getAccessToken()
      if (!token) {
        throw new Error('No access token available after OAuth')
      }
      if (isActive && !isActive()) {
        return
      }
      setAccessToken(token)

      const authMethodId = hashAuthMethodId(providerEmail)
      const recoveryConfig = await EmbeddedWalletApiClient.fetchGetRecoveryConfig({ authMethodId }, token)
      if (!recoveryConfig.encryptedKeyId) {
        setStep(RecoveryStep.NoWalletFound)
        return
      }
      if (isActive && !isActive()) {
        return
      }
      if (applyRecoveryConfig(recoveryConfig)) {
        return
      }

      const blob = await privy.fetchEncryptedBlob({
        accessToken: token,
        keyId: recoveryConfig.encryptedKeyId,
        privyAppId,
      })
      if (isActive && !isActive()) {
        return
      }
      setEncryptedBlob(blob)

      setStep(RecoveryStep.EnterPin)
    } catch (e) {
      if (isActive && !isActive()) {
        return
      }
      logger.error(e, { tags: { file: 'useRecoveryFlow', function: 'fetchRecoveryAndAdvance' } })
      setOauthError(e instanceof Error ? e.message : t('common.card.error.description'))
    }
  })

  // OAuth return: once Privy is ready + user is linked, pull recovery config and advance.
  useEffect(() => {
    const { pending, provider, providerEmail } = privy.oauthReturn
    if (!provider) {
      // If OAuth was attempted but abandoned, drop back to the Login step once pending clears.
      if (!pending && step === RecoveryStep.OAuthLoading) {
        setStep(RecoveryStep.Login)
      }
      return undefined
    }

    // Mobile keeps the JS context alive (no full-page reload), so `pending` stays false
    // and step never starts at OAuthLoading. Local `oauthProvider` is set synchronously in
    // `initOAuth` before any await, so it's a reliable "this user just initiated OAuth"
    // signal that distinguishes a fresh tap from a stale Privy session.
    const userExplicitlyInitiatedThisOAuth = oauthProvider !== null && oauthProvider === provider
    const isLoginAdvance = step === RecoveryStep.Login && userExplicitlyInitiatedThisOAuth
    if (step !== RecoveryStep.OAuthLoading && !isLoginAdvance) {
      return undefined
    }

    setOauthProvider(provider)
    setOauthEmail(providerEmail)

    if (!providerEmail) {
      logger.error(new Error('OAuth provider email is missing'), {
        tags: { file: 'useRecoveryFlow', function: 'oauthReturnEffect' },
      })
      setOauthError(t('common.card.error.description'))
      return undefined
    }

    let active = true
    void fetchRecoveryAndAdvance(providerEmail, () => active)
    return () => {
      active = false
    }
  }, [privy.oauthReturn, fetchRecoveryAndAdvance, setOauthError, step, oauthProvider, t])

  const sendCodeMutation = useMutation({
    mutationFn: () => {
      if (!privy.ready) {
        throw new Error('Privy is not ready')
      }
      return privy.sendEmailCode(email)
    },
    onSuccess: () => setStep(RecoveryStep.EmailCode),
    onError: (e) => logger.error(e, { tags: { file: 'useRecoveryFlow', function: 'sendCode' } }),
  })

  const resendCodeMutation = useMutation({
    mutationFn: () => {
      if (!privy.ready) {
        throw new Error('Privy is not ready')
      }
      return privy.sendEmailCode(email)
    },
    onError: (e) => logger.error(e, { tags: { file: 'useRecoveryFlow', function: 'resendCode' } }),
  })

  const submitCodeMutation = useMutation({
    mutationFn: async (code: string) => {
      if (!privy.ready) {
        throw new Error('Privy is not ready')
      }
      await privy.loginWithEmailCode(code)
      const token = await privy.getAccessToken()
      if (!token) {
        throw new Error('Failed to get access token after email verification')
      }
      setAccessToken(token)

      const recoveryConfig = await EmbeddedWalletApiClient.fetchGetRecoveryConfig(
        { authMethodId: hashAuthMethodId(effectiveEmail) },
        token,
      )
      if (!recoveryConfig.encryptedKeyId) {
        setStep(RecoveryStep.NoWalletFound)
        return
      }
      if (applyRecoveryConfig(recoveryConfig)) {
        return
      }

      const blob = await privy.fetchEncryptedBlob({
        accessToken: token,
        keyId: recoveryConfig.encryptedKeyId,
        privyAppId,
      })
      setEncryptedBlob(blob)

      setStep(RecoveryStep.EnterPin)
    },
    onError: (e) => {
      // Wrong OTP is expected user error, not a system error: reset and skip logging.
      if (e instanceof Error && (e as { privyErrorCode?: string }).privyErrorCode === 'invalid_credentials') {
        otpInput.reset()
        return
      }
      logger.error(e, { tags: { file: 'useRecoveryFlow', function: 'submitCode' } })
    },
  })

  const otpInput = useDigitInput({
    length: OTP_LENGTH,
    onComplete: useEvent((code: string) => submitCodeMutation.mutate(code)),
  })

  const runPostPinAction = useEvent(async (key: Uint8Array) => {
    if (!accessToken) {
      // Unreachable in practice (a successful decrypt implies a token); guards the
      // type since the post-PIN RPCs now require it.
      logger.error(new Error('Missing access token for post-PIN action'), {
        tags: { file: 'useRecoveryFlow', function: 'runPostPinAction' },
      })
      setAuthPrivateKey(null)
      setStep(RecoveryStep.Login)
      return
    }
    setStep(RecoveryStep.Recovering)
    setFinalStepError(undefined)
    try {
      await onPinDecryptSuccess({
        authPrivateKey: key,
        authMethodId: hashAuthMethodId(effectiveEmail),
        email: effectiveEmail,
        accessToken,
      })
      setAuthPrivateKey(null)
    } catch (e) {
      logger.error(e, { tags: { file: 'useRecoveryFlow', function: 'runPostPinAction' } })
      setAuthPrivateKey(null)
      setFinalStepError(e instanceof Error ? e.message : t('common.card.error.description'))
      // onPinDecryptSuccess is expected to zero the key; fall back to the Login step
      // since the key is gone and retrying would no-op.
      setStep(RecoveryStep.Login)
    }
  })

  const handlePinComplete = useEvent(async (code: string) => {
    if (!accessToken || !encryptedKeyId || !encryptedBlob || isDecrypting) {
      return
    }
    if (cooldownExpiresAt && Date.now() < cooldownExpiresAt) {
      return
    }

    setPinError(undefined)
    setIsDecrypting(true)

    try {
      const result = await attemptPinDecryption({
        pin: code,
        email: effectiveEmail,
        accessToken,
        encryptedBlob,
      })

      if (result.success) {
        setAuthPrivateKey(result.authPrivateKey)
        if (enableRotation && shouldRotate) {
          // v1 method: rotate to v2 with the recovered auth key instead of recovering on-device.
          // Stash the just-verified old passcode for the client-side "cannot reuse" check.
          oldPinRef.current = code
          resetRotationPasscodeState()
          setStep(RecoveryStep.NewPasscodeIntro)
        } else if (showAddPasskeyStep) {
          setStep(RecoveryStep.AddPasskey)
        } else {
          await runPostPinAction(result.authPrivateKey)
        }
      } else if (result.error === 'wrong_pin') {
        if (result.cooldownSeconds && result.cooldownSeconds > 0) {
          setCooldownExpiresAt(Date.now() + result.cooldownSeconds * 1000)
          setPinError(undefined)
        } else {
          // Always show the consistent i18n string for a wrong PIN; the server's
          // errorMessage is generic SDK copy that doesn't match product UX.
          setPinError(t('account.passkey.recovery.wrongPin'))
        }
        passcodeInput.reset()
      } else {
        if (result.cooldownSeconds && result.cooldownSeconds > 0) {
          setCooldownExpiresAt(Date.now() + result.cooldownSeconds * 1000)
          setPinError(undefined)
        } else {
          setPinError(result.errorMessage ?? t('common.card.error.description'))
        }
        passcodeInput.reset()
      }
    } catch {
      setPinError(t('common.card.error.description'))
      passcodeInput.reset()
    } finally {
      setIsDecrypting(false)
    }
  })

  const passcodeInput = useDigitInput({ length: PASSCODE_LENGTH, onComplete: handlePinComplete })

  const confirmAddPasskey = useEvent(async () => {
    if (!authPrivateKey) {
      return
    }
    await runPostPinAction(authPrivateKey)
  })

  // --- Passkey-less rotation (recover-with-email on a v1 method) ---

  const runRotation = useEvent(async (newPin: string) => {
    const recoveredKey = authPrivateKey
    const privyUserId = privy.privyUserId
    if (!recoveredKey || !accessToken || !walletId || !privyUserId) {
      logger.error(new Error('Missing preconditions for recovery rotation'), {
        tags: { file: 'useRecoveryFlow', function: 'runRotation' },
        extra: {
          hasRecoveredKey: !!recoveredKey,
          hasAccessToken: !!accessToken,
          // walletId comes from GetRecoveryConfig; privyUserId from the Privy session.
          hasWalletId: !!walletId,
          hasPrivyUserId: !!privyUserId,
        },
      })
      setNewPasscodeError(t('common.card.error.description'))
      return
    }
    setStep(RecoveryStep.Recovering)
    setNewPasscodeError(undefined)
    try {
      const rotation = await rotateRecoveryWithRecoveryAuth({
        recoveredAuthPrivateKey: recoveredKey,
        newPin,
        email: effectiveEmail,
        accessToken,
        privyAppId,
        walletId,
        privyUserId,
        authMethodType: toRecoveryAuthMethodType(oauthProvider),
        generateAuthorizationSignature: privy.generateAuthorizationSignature,
      })
      // The v1 key is spent; hand the new v2 recovery key to the add-passkey step, which registers
      // a device passkey via executeRecovery (now unblocked because the method is v2).
      setShouldRotate(false)
      setDidRotate(true)
      setAuthPrivateKey(rotation.newAuthPrivateKey)
      setStep(RecoveryStep.AddPasskey)
    } catch (e) {
      logger.error(e, { tags: { file: 'useRecoveryFlow', function: 'runRotation' } })
      // The recovered key is spent (zeroed), so a retry must re-derive it: send the user back to
      // re-enter their old passcode.
      setAuthPrivateKey(null)
      resetRotationPasscodeState()
      passcodeInput.reset()
      setPinError(mapRotationError(e, t))
      setStep(RecoveryStep.EnterPin)
    }
  })

  const handleNewPasscodeComplete = useEvent((code: string) => {
    setNewPasscodeError(undefined)
    const validation = validatePin(code)
    if (!validation.valid) {
      setNewPasscodeError(
        validation.reason === 'banned'
          ? t('account.passkey.backupLogin.passcode.error.banned')
          : t('account.passkey.backupLogin.passcode.error.invalid'),
      )
      newPasscodeInput.reset()
      return
    }
    // New passcode must differ from the old one. Compare against the already-verified old passcode
    // directly — a v1 OprfEvaluate here would count as another recovery attempt against the limiter.
    if (oldPinRef.current && code === oldPinRef.current) {
      setNewPasscodeError(t('account.passkey.backupLogin.passcode.error.reused'))
      newPasscodeInput.reset()
      return
    }
    firstNewPinRef.current = code
    setStep(RecoveryStep.ConfirmNewPasscode)
  })

  const newPasscodeInput = useDigitInput({ length: PASSCODE_LENGTH, onComplete: handleNewPasscodeComplete })

  const handleConfirmNewPasscodeComplete = useEvent(async (code: string) => {
    if (code !== firstNewPinRef.current) {
      setNewPasscodeError(t('account.passkey.backupLogin.confirmPasscode.error.mismatch'))
      confirmNewPasscodeInput.reset()
      return
    }
    await runRotation(code)
  })

  const confirmNewPasscodeInput = useDigitInput({
    length: PASSCODE_LENGTH,
    onComplete: handleConfirmNewPasscodeComplete,
  })

  const continueToSetNewPasscode = useEvent(() => {
    setNewPasscodeError(undefined)
    setStep(RecoveryStep.SetNewPasscode)
  })

  const reset = useEvent(() => {
    // Default back to Login, not EmailEntry — otherwise `handleBack` from EnterPin (via
    // OAuth) lands the user on the email form with no way back to the method-selection
    // screen since `oauthProvider` is already cleared.
    setStep(privy.oauthReturn.pending ? RecoveryStep.OAuthLoading : RecoveryStep.Login)
    setEmail('')
    setAccessToken(null)
    setAuthPrivateKey(null)
    setShowPasscode(false)
    setPinError(undefined)
    setCooldownExpiresAt(null)
    setIsDecrypting(false)
    setRecoveryWalletAddress(undefined)
    setEncryptedKeyId(undefined)
    setEncryptedBlob(undefined)
    setShouldRotate(false)
    setDidRotate(false)
    setWalletId(undefined)
    setOauthProvider(null)
    setOauthEmail(undefined)
    setOauthError(undefined)
    setFinalStepError(undefined)
    oldPinRef.current = ''
    resetRotationPasscodeState()
    privy.clearOAuthReturn()
    otpInput.reset()
    passcodeInput.reset()
    sendCodeMutation.reset()
    resendCodeMutation.reset()
    submitCodeMutation.reset()
  })

  const handleBack = useEvent(() => {
    sendCodeMutation.reset()
    resendCodeMutation.reset()
    submitCodeMutation.reset()
    setPinError(undefined)
    if (step === RecoveryStep.EmailEntry) {
      setStep(RecoveryStep.Login)
    } else if (step === RecoveryStep.EmailCode) {
      otpInput.reset()
      setStep(RecoveryStep.EmailEntry)
    } else if (step === RecoveryStep.EnterPin) {
      passcodeInput.reset()
      if (oauthProvider) {
        reset()
      } else {
        setStep(RecoveryStep.EmailCode)
      }
    } else if (step === RecoveryStep.NewPasscodeIntro) {
      passcodeInput.reset()
      setStep(RecoveryStep.EnterPin)
    } else if (step === RecoveryStep.SetNewPasscode) {
      resetRotationPasscodeState()
      setStep(RecoveryStep.NewPasscodeIntro)
    } else if (step === RecoveryStep.ConfirmNewPasscode) {
      resetRotationPasscodeState()
      setStep(RecoveryStep.SetNewPasscode)
    } else {
      reset()
    }
  })

  const selectEmailLogin = useEvent(() => {
    setOauthError(undefined)
    setStep(RecoveryStep.EmailEntry)
  })

  const initOAuth = useEvent(async (provider: 'google' | 'apple') => {
    if (!privy.ready) {
      return
    }
    setOauthError(undefined)
    setOauthProvider(provider)
    try {
      await privy.initOAuth(provider)
    } catch (e) {
      logger.error(e, { tags: { file: 'useRecoveryFlow', function: 'initOAuth' } })
      setOauthProvider(null)
      setOauthError(e instanceof Error ? e.message : t('common.card.error.description'))
    }
  })

  const isInvalidOtpError =
    submitCodeMutation.error instanceof Error &&
    (submitCodeMutation.error as { privyErrorCode?: string }).privyErrorCode === 'invalid_credentials'
  const error = sendCodeMutation.error || (!isInvalidOtpError && submitCodeMutation.error) || resendCodeMutation.error
  const isLoading = sendCodeMutation.isPending || submitCodeMutation.isPending || resendCodeMutation.isPending
  const errorMessage = isInvalidOtpError
    ? t('account.passkey.backupLogin.code.error.invalid')
    : error
      ? t('common.card.error.description')
      : undefined

  const cooldown = useCooldownTimer(cooldownExpiresAt)

  return {
    step,
    email,
    setEmail,
    isValidEmail,
    isLoading,
    isReady: privy.ready,
    errorMessage,
    sendCodeMutation,
    resendCodeMutation,
    submitCodeMutation,
    otpInput,
    passcodeInput,
    pinError,
    cooldown,
    isDecrypting,
    showPasscode,
    setShowPasscode,
    recoveryWalletAddress,
    shouldRotate,
    didRotate,
    walletId,
    oauthProvider,
    oauthEmail,
    effectiveEmail,
    finalStepError,
    // Passkey-less rotation surface (populated only when `enableRotation`).
    newPasscodeInput,
    confirmNewPasscodeInput,
    newPasscodeError,
    continueToSetNewPasscode,
    handleBack,
    confirmAddPasskey,
    reset,
    selectEmailLogin,
    initOAuth,
  }
}

function useCooldownTimer(cooldownExpiresAt: number | null): { isActive: boolean; formattedTime: string } {
  const [now, setNow] = useState(() => Date.now())

  const isRunning = cooldownExpiresAt !== null && now < cooldownExpiresAt
  useInterval(() => setNow(Date.now()), isRunning ? 1000 : null)

  if (!cooldownExpiresAt) {
    return { isActive: false, formattedTime: '' }
  }

  const remaining = Math.max(0, cooldownExpiresAt - now)
  if (remaining === 0) {
    return { isActive: false, formattedTime: '' }
  }

  const totalSeconds = Math.ceil(remaining / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  const formattedTime = minutes > 0 ? `${minutes}:${seconds.toString().padStart(2, '0')}` : `${seconds}s`
  return { isActive: true, formattedTime }
}

export type UseRecoveryFlowResult = ReturnType<typeof useRecoveryFlow>
