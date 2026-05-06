import { Code, ConnectError } from '@connectrpc/connect'
import { useLoginWithEmail, useLoginWithOAuth, usePrivy } from '@privy-io/react-auth'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex } from 'ui/src'
import { Modal } from 'uniswap/src/components/modals/Modal'
import {
  authorizeAndCompleteRecovery,
  type EncryptedRecoveryState,
  encryptAndStoreRecovery,
  type RecoveryAuthMethodType,
} from 'uniswap/src/features/passkey/embeddedWallet'
import { validatePin } from 'uniswap/src/features/passkey/pinValidation'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { logger } from 'utilities/src/logger/logger'
import { useEvent } from 'utilities/src/react/hooks'
import { LIST_AUTHENTICATORS_QUERY_KEY } from '~/components/AccountDrawer/PasskeyMenu/PasskeyMenu'
import { ConfirmPasscodeExtra, SuccessStep } from '~/components/Passkey/AddBackupLoginFinalSteps'
import {
  EmailCodeStep,
  EmailEntryStep,
  MethodSelectStep,
  PasscodeIntroStep,
  PasscodeStep,
} from '~/components/Passkey/AddBackupLoginSteps'
import { useDigitInput } from '~/components/Passkey/BackupLoginComponents'
import { OAUTH_PENDING_KEY } from '~/components/Passkey/useOAuthRedirectRouter'
import { useOAuthResult } from '~/components/Passkey/useOAuthResult'
import { getConfig } from '~/config'
import { useModalState } from '~/hooks/useModalState'
import { useEmbeddedWalletState } from '~/state/embeddedWallet/store'

enum Step {
  METHOD_SELECT = 0,
  EMAIL_ENTRY = 1,
  EMAIL_CODE = 2,
  PASSCODE_INTRO = 3,
  SET_PASSCODE = 4,
  CONFIRM_PASSCODE = 5,
  SUCCESS = 6,
}

function isPrivyInvalidCredentials(error: unknown): boolean {
  return error instanceof Error && (error as { privyErrorCode?: string }).privyErrorCode === 'invalid_credentials'
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const OTP_LENGTH = 6
const PASSCODE_LENGTH = 4

export function AddBackupLoginModal() {
  const { t } = useTranslation()
  const { isOpen, onClose } = useModalState(ModalName.AddBackupLogin)
  const queryClient = useQueryClient()
  const { walletId } = useEmbeddedWalletState()
  const [step, setStep] = useState<Step>(Step.METHOD_SELECT)
  const [email, setEmail] = useState('')
  const firstPinRef = useRef('')
  const encryptionIdRef = useRef(0)
  const [showPasscode, setShowPasscode] = useState(false)
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [isEncrypting, setIsEncrypting] = useState(false)
  const [passcodeError, setPasscodeError] = useState<string | undefined>()
  const [cryptoResult, setCryptoResult] = useState<EncryptedRecoveryState | null>(null)
  const [oauthProvider, setOauthProvider] = useState<'google' | 'apple' | null>(null)
  const [oauthEmail, setOauthEmail] = useState<string | undefined>()

  const { ready: privyReady, getAccessToken, user } = usePrivy()

  const oauthReturn = useOAuthResult(OAUTH_PENDING_KEY)

  // When OAuth return is detected, advance to PASSCODE_INTRO
  useEffect(() => {
    if (oauthReturn.provider && !oauthReturn.pending) {
      setOauthProvider(oauthReturn.provider)
      setOauthEmail(oauthReturn.providerEmail)
      setStep(Step.PASSCODE_INTRO)
    }
  }, [oauthReturn.provider, oauthReturn.pending, oauthReturn.providerEmail])

  const { sendCode, loginWithCode } = useLoginWithEmail()

  const handleSendCodeError = (e: Error, fn: string) =>
    logger.error(e, { tags: { file: 'AddBackupLoginModal', function: fn } })

  const { initOAuth, loading: oauthLoading } = useLoginWithOAuth({
    onError: (oauthError) => {
      logger.error(oauthError, { tags: { file: 'AddBackupLoginModal', function: 'handleOAuthLogin' } })
      sessionStorage.removeItem(OAUTH_PENDING_KEY)
      setOauthProvider(null)
    },
  })

  const sendCodeMutation = useMutation({
    mutationFn: () => {
      if (!privyReady) {
        throw new Error('Privy is not ready')
      }
      return sendCode({ email })
    },
    onSuccess: () => setStep(Step.EMAIL_CODE),
    onError: (e) => handleSendCodeError(e, 'handleSendCode'),
  })

  const resendCodeMutation = useMutation({
    mutationFn: () => {
      if (!privyReady) {
        throw new Error('Privy is not ready')
      }
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
    onSuccess: () => setStep(Step.PASSCODE_INTRO),
    onError: (e) => {
      logger.error(e, { tags: { file: 'AddBackupLoginModal', function: 'handleSubmitCode' } })
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

  const handleInitOAuth = useEvent((provider: 'google' | 'apple') => {
    if (!privyReady) {
      return
    }
    setOauthProvider(provider)
    sessionStorage.setItem(OAUTH_PENDING_KEY, provider)
    initOAuth({ provider })
  })

  const handleSubmitCode = useEvent((code: string) => {
    submitCodeMutation.mutate(code)
  })

  const handleSubmitPasscode = useEvent((code: string) => {
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
        privyAppId: getConfig().privyAppId ?? '',
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
      logger.error(encryptError, { tags: { file: 'AddBackupLoginModal', function: 'handleConfirmPasscode' } })
      setPasscodeError(t('common.card.error.description'))
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
        tags: { file: 'AddBackupLoginModal', function: 'handleSignInWithPasskey' },
      })
      return
    }

    setIsSigningIn(true)
    try {
      const authMethodType: RecoveryAuthMethodType =
        oauthProvider === 'google' ? 'GOOGLE' : oauthProvider === 'apple' ? 'APPLE' : 'EMAIL'
      await authorizeAndCompleteRecovery({
        encrypted: cryptoResult,
        email: effectiveEmail,
        walletId,
        privyUserId: user.id,
        authMethodType,
      })
      setStep(Step.SUCCESS)
    } catch (signInError) {
      logger.error(signInError, { tags: { file: 'AddBackupLoginModal', function: 'handleSignInWithPasskey' } })
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
    setStep(Step.METHOD_SELECT)
    setEmail('')
    encryptionIdRef.current++
    firstPinRef.current = ''
    setCryptoResult(null)
    setIsSigningIn(false)
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
    sessionStorage.removeItem(OAUTH_PENDING_KEY)
    onClose()
  })

  const handleDone = useEvent(async () => {
    await queryClient.invalidateQueries({ queryKey: [LIST_AUTHENTICATORS_QUERY_KEY] })
    handleClose()
  })

  const handleBack = useEvent(() => {
    sendCodeMutation.reset()
    resendCodeMutation.reset()
    submitCodeMutation.reset()
    if (step === Step.EMAIL_ENTRY) {
      setStep(Step.METHOD_SELECT)
    } else if (step === Step.EMAIL_CODE) {
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

  const isValidEmail = EMAIL_REGEX.test(email)

  return (
    <Modal
      name={ModalName.AddBackupLogin}
      isModalOpen={isOpen}
      onClose={handleClose}
      isDismissible={false}
      maxWidth={420}
    >
      <Flex gap="$gap24" alignItems="center" width="100%">
        {step === Step.METHOD_SELECT && (
          <MethodSelectStep
            handleClose={handleClose}
            handleInitOAuth={handleInitOAuth}
            oauthLoading={oauthLoading}
            oauthProvider={oauthProvider}
            onSelectEmail={() => setStep(Step.EMAIL_ENTRY)}
            t={t}
          />
        )}

        {step === Step.EMAIL_ENTRY && (
          <EmailEntryStep
            email={email}
            errorMessage={errorMessage}
            handleBack={handleBack}
            handleClose={handleClose}
            handleSendCode={handleSendCode}
            isLoading={isLoading}
            isValidEmail={isValidEmail}
            setEmail={setEmail}
            t={t}
          />
        )}

        {step === Step.EMAIL_CODE && (
          <EmailCodeStep
            email={email}
            errorMessage={errorMessage}
            handleBack={handleBack}
            handleClose={handleClose}
            handleResendCode={handleResendCode}
            otpInput={otpInput}
            submitCodeMutation={submitCodeMutation}
            t={t}
          />
        )}

        {step === Step.PASSCODE_INTRO && (
          <PasscodeIntroStep
            email={email}
            handleClose={handleClose}
            oauthEmail={oauthEmail}
            oauthProvider={oauthProvider}
            onSetPasscode={() => setStep(Step.SET_PASSCODE)}
            t={t}
          />
        )}

        {step === Step.SET_PASSCODE && (
          <PasscodeStep
            description={t('account.passkey.backupLogin.setPasscode.description')}
            digitInput={passcodeInput}
            handleBack={handleBack}
            handleClose={handleClose}
            isEncrypting={isEncrypting}
            passcodeError={passcodeError}
            setShowPasscode={setShowPasscode}
            showPasscode={showPasscode}
            t={t}
            title={t('account.passkey.backupLogin.setPasscode.title')}
          />
        )}

        {step === Step.CONFIRM_PASSCODE && (
          <PasscodeStep
            description={t('account.passkey.backupLogin.confirmPasscode.description')}
            digitInput={confirmPasscodeInput}
            handleBack={handleBack}
            handleClose={handleClose}
            isEncrypting={isEncrypting}
            passcodeError={passcodeError}
            setShowPasscode={setShowPasscode}
            showPasscode={showPasscode}
            t={t}
            title={t('account.passkey.backupLogin.confirmPasscode.title')}
          >
            <ConfirmPasscodeExtra
              cryptoResult={cryptoResult}
              handleSignInWithPasskey={handleSignInWithPasskey}
              isSigningIn={isSigningIn}
              t={t}
            />
          </PasscodeStep>
        )}

        {step === Step.SUCCESS && (
          <SuccessStep
            email={email}
            handleClose={handleClose}
            handleDone={handleDone}
            oauthEmail={oauthEmail}
            oauthProvider={oauthProvider}
            t={t}
          />
        )}
      </Flex>
    </Modal>
  )
}
