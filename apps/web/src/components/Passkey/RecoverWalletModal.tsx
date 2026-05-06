import { useAuthorizationSignature, useLoginWithEmail, usePrivy } from '@privy-io/react-auth'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { base64urlToBase64 } from '@universe/encoding'
import { connect } from '@wagmi/core'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { Flex } from 'ui/src'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { CONNECTION_PROVIDER_IDS } from 'uniswap/src/constants/web3'
import { unitagsApiClient } from 'uniswap/src/data/apiClients/unitagsApi/UnitagsApiClient'
import { EmbeddedWalletApiClient } from 'uniswap/src/data/rest/embeddedWallet/requests'
import { registerNewPasskey } from 'uniswap/src/features/passkey/embeddedWallet'
import { hashAuthMethodId } from 'uniswap/src/features/passkey/pinCrypto'
import { attemptPinDecryption, executeRecovery } from 'uniswap/src/features/passkey/recoveryExecute'
import { InterfaceEventName, ModalName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { WalletConnectionResult } from 'uniswap/src/features/telemetry/types'
import { shortenAddress } from 'utilities/src/addresses'
import { logger } from 'utilities/src/logger/logger'
import { useEvent } from 'utilities/src/react/hooks'
import { LIST_AUTHENTICATORS_QUERY_KEY } from '~/components/AccountDrawer/PasskeyMenu/PasskeyMenu'
import { useDigitInput } from '~/components/Passkey/BackupLoginComponents'
import {
  AddPasskeyStep,
  EmailCodeStep,
  EmailEntryStep,
  EnterPinStep,
  OAuthLoadingStep,
  RecoveringStep,
} from '~/components/Passkey/RecoverWalletSteps'
import { RECOVER_OAUTH_PENDING_KEY } from '~/components/Passkey/useOAuthRedirectRouter'
import { useOAuthResult } from '~/components/Passkey/useOAuthResult'
import { useWagmiConnectorWithId } from '~/components/WalletModal/useWagmiConnectorWithId'
import { wagmiConfig } from '~/components/Web3Provider/wagmiConfig'
import { walletTypeToAmplitudeWalletType } from '~/components/Web3Provider/walletConnect'
import { getConfig } from '~/config'
import { useCooldownTimer } from '~/hooks/useCooldownTimer'
import { useModalState } from '~/hooks/useModalState'
import { useEmbeddedWalletState } from '~/state/embeddedWallet/store'
import { updateIsEmbeddedWalletBackedUp } from '~/state/user/reducer'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const OTP_LENGTH = 6
const PASSCODE_LENGTH = 4

enum RecoverStep {
  OAUTH_LOADING = 0,
  EMAIL_ENTRY = 1,
  EMAIL_CODE = 2,
  ENTER_PIN = 3,
  ADD_PASSKEY = 4,
  RECOVERING = 5,
}

export function RecoverWalletModal() {
  const { t } = useTranslation()
  const { isOpen, onClose } = useModalState(ModalName.RecoverWallet)
  const queryClient = useQueryClient()
  const dispatch = useDispatch()
  const { ready: privyReady, getAccessToken } = usePrivy()
  const { generateAuthorizationSignature } = useAuthorizationSignature()
  const { sendCode, loginWithCode } = useLoginWithEmail()
  const { setIsConnected, setWalletAddress, setWalletId } = useEmbeddedWalletState()
  const connector = useWagmiConnectorWithId(CONNECTION_PROVIDER_IDS.EMBEDDED_WALLET_CONNECTOR_ID, {
    shouldThrow: true,
  })
  const [step, setStep] = useState<RecoverStep>(() =>
    sessionStorage.getItem(RECOVER_OAUTH_PENDING_KEY) ? RecoverStep.OAUTH_LOADING : RecoverStep.EMAIL_ENTRY,
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
  const [oauthProvider, setOauthProvider] = useState<'google' | 'apple' | null>(null)
  const [oauthEmail, setOauthEmail] = useState<string | undefined>()
  const [oauthError, setOauthError] = useState<string | undefined>()
  const [addPasskeyError, setAddPasskeyError] = useState<string | undefined>()

  const oauthReturn = useOAuthResult(RECOVER_OAUTH_PENDING_KEY)

  const fetchRecoveryAndAdvance = useEvent(async (providerEmail: string, isActive?: () => boolean) => {
    try {
      const token = await getAccessToken()
      if (!token) {
        throw new Error('No access token available after OAuth')
      }
      if (isActive && !isActive()) {
        return
      }
      setAccessToken(token)

      const authMethodId = hashAuthMethodId(providerEmail)
      const recoveryConfig = await EmbeddedWalletApiClient.fetchGetRecoveryConfig({
        authMethodId,
      })
      if (!recoveryConfig.encryptedKeyId) {
        throw new Error('No recovery data found for this account')
      }
      if (isActive && !isActive()) {
        return
      }
      setEncryptedKeyId(recoveryConfig.encryptedKeyId)
      if (recoveryConfig.walletAddress) {
        setRecoveryWalletAddress(recoveryConfig.walletAddress)
      }

      setStep(RecoverStep.ENTER_PIN)
    } catch (e) {
      if (isActive && !isActive()) {
        return
      }
      logger.error(e, { tags: { file: 'RecoverWalletModal', function: 'oauthRecoveryConfig' } })
      setOauthError(e instanceof Error ? e.message : t('common.card.error.description'))
    }
  })

  // When OAuth return is detected, fetch recovery config and advance to ENTER_PIN
  useEffect(() => {
    if (!oauthReturn.provider) {
      // Only reset to EMAIL_ENTRY when OAuth was attempted (OAUTH_LOADING) but abandoned.
      // Without this guard, every re-render during the normal email flow would reset the step.
      if (!oauthReturn.pending && step === RecoverStep.OAUTH_LOADING) {
        setStep(RecoverStep.EMAIL_ENTRY)
      }
      return undefined
    }

    // Guard: only run this effect once — when transitioning from OAUTH_LOADING
    if (step !== RecoverStep.OAUTH_LOADING) {
      return undefined
    }

    const providerEmail = oauthReturn.providerEmail
    // Synchronous — safe to set before the async call. The `active` guard below
    // only protects state setters that fire after an await in fetchRecoveryAndAdvance.
    setOauthProvider(oauthReturn.provider)
    setOauthEmail(providerEmail)

    if (!providerEmail) {
      logger.error(new Error('OAuth provider email is missing'), {
        tags: { file: 'RecoverWalletModal', function: 'oauthRecoveryConfig' },
      })
      setOauthError(t('common.card.error.description'))
      return undefined
    }

    let active = true
    fetchRecoveryAndAdvance(providerEmail, () => active)
    return () => {
      active = false
    }
  }, [oauthReturn.provider, oauthReturn.pending, oauthReturn.providerEmail, fetchRecoveryAndAdvance, step, t])

  const effectiveEmail = oauthEmail ?? email

  const cooldown = useCooldownTimer(cooldownExpiresAt)

  const sendCodeMutation = useMutation({
    mutationFn: () => {
      if (!privyReady) {
        throw new Error('Privy is not ready')
      }
      return sendCode({ email })
    },
    onSuccess: () => setStep(RecoverStep.EMAIL_CODE),
    onError: (e) => logger.error(e, { tags: { file: 'RecoverWalletModal', function: 'sendCode' } }),
  })

  const resendCodeMutation = useMutation({
    mutationFn: () => {
      if (!privyReady) {
        throw new Error('Privy is not ready')
      }
      return sendCode({ email })
    },
    onError: (e) => logger.error(e, { tags: { file: 'RecoverWalletModal', function: 'resendCode' } }),
  })

  const submitCodeMutation = useMutation({
    mutationFn: async (code: string) => {
      if (!privyReady) {
        throw new Error('Privy is not ready')
      }
      await loginWithCode({ code })
      const token = await getAccessToken()
      if (!token) {
        throw new Error('Failed to get access token after email verification')
      }
      setAccessToken(token)

      // Fetch recovery config for encryptedKeyId and wallet address
      const recoveryConfig = await EmbeddedWalletApiClient.fetchGetRecoveryConfig({
        authMethodId: hashAuthMethodId(effectiveEmail),
      })
      if (!recoveryConfig.encryptedKeyId) {
        throw new Error('No recovery data found for this account')
      }
      setEncryptedKeyId(recoveryConfig.encryptedKeyId)
      if (recoveryConfig.walletAddress) {
        setRecoveryWalletAddress(recoveryConfig.walletAddress)
      }

      setStep(RecoverStep.ENTER_PIN)
    },
    onError: (e) => {
      logger.error(e, { tags: { file: 'RecoverWalletModal', function: 'submitCode' } })
      if (e instanceof Error && (e as { privyErrorCode?: string }).privyErrorCode === 'invalid_credentials') {
        otpInput.reset()
      }
    },
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

  const otpInput = useDigitInput({
    length: OTP_LENGTH,
    onComplete: useEvent((code: string) => submitCodeMutation.mutate(code)),
  })

  const handlePinComplete = useEvent(async (code: string) => {
    if (!accessToken || !encryptedKeyId || isDecrypting || cooldown.isActive) {
      return
    }

    const privyAppId = getConfig().privyAppId
    if (!privyAppId) {
      throw new Error('PRIVY_APP_ID environment variable is not configured')
    }

    setPinError(undefined)
    setIsDecrypting(true)

    try {
      const result = await attemptPinDecryption({
        pin: code,
        email: effectiveEmail,
        accessToken,
        encryptedKeyId,
        privyAppId,
      })

      if (result.success) {
        setAuthPrivateKey(result.authPrivateKey)
        setStep(RecoverStep.ADD_PASSKEY)
      } else if (result.error === 'wrong_pin') {
        if (result.cooldownSeconds && result.cooldownSeconds > 0) {
          setCooldownExpiresAt(Date.now() + result.cooldownSeconds * 1000)
          setPinError(undefined)
        } else {
          setPinError(result.errorMessage ?? t('account.passkey.recovery.wrongPin'))
        }
        passcodeInput.reset()
      } else if (result.error === 'rate_limited') {
        if (result.cooldownSeconds && result.cooldownSeconds > 0) {
          setCooldownExpiresAt(Date.now() + result.cooldownSeconds * 1000)
          setPinError(undefined)
        } else {
          setPinError(result.errorMessage)
        }
        passcodeInput.reset()
      } else {
        setPinError(result.errorMessage)
        passcodeInput.reset()
      }
    } catch {
      // Error already logged by attemptPinDecryption
      setPinError(t('common.card.error.description'))
      passcodeInput.reset()
    } finally {
      setIsDecrypting(false)
    }
  })

  const passcodeInput = useDigitInput({ length: PASSCODE_LENGTH, onComplete: handlePinComplete })

  const handleAddPasskey = useEvent(async () => {
    if (!authPrivateKey) {
      return
    }
    setAddPasskeyError(undefined)

    setStep(RecoverStep.RECOVERING)

    try {
      // Resolve passkey username: prefer unitag, fall back to truncated address
      let passkeyUsername: string | undefined
      if (recoveryWalletAddress) {
        try {
          const unitagResponse = await unitagsApiClient.fetchAddress({ address: recoveryWalletAddress })
          passkeyUsername = unitagResponse.username ?? shortenAddress({ address: recoveryWalletAddress })
        } catch {
          passkeyUsername = shortenAddress({ address: recoveryWalletAddress })
        }
      }

      const { credential } = await registerNewPasskey({ username: passkeyUsername })
      const authMethodId = hashAuthMethodId(effectiveEmail)

      // Extract public key from credential response (base64url → standard base64)
      const credentialJson = JSON.parse(credential)
      if (!credentialJson?.response?.publicKey) {
        throw new Error('Credential response missing publicKey')
      }
      const newPasskeyPublicKey = base64urlToBase64(credentialJson.response.publicKey)

      const recoveryResult = await executeRecovery({
        authPrivateKey,
        authMethodId,
        newPasskeyCredential: credential,
        newPasskeyPublicKey,
        generateAuthorizationSignature: generateAuthorizationSignature as (
          payload: object,
        ) => Promise<{ signature: string }>,
      })

      setAuthPrivateKey(null)

      // Sign the user in with the recovered wallet (mirrors useSignInWithPasskey onSuccess)
      dispatch(updateIsEmbeddedWalletBackedUp({ isEmbeddedWalletBackedUp: false }))
      setWalletAddress(recoveryResult.walletAddress)
      setWalletId(recoveryResult.walletId)
      setIsConnected(true)
      // Fire-and-forget — mirrors useSignInWithPasskey; wagmi connector handles errors internally
      connect(wagmiConfig, { connector })
      sendAnalyticsEvent(InterfaceEventName.WalletConnected, {
        result: WalletConnectionResult.Succeeded,
        wallet_name: connector.name,
        wallet_type: walletTypeToAmplitudeWalletType(connector.type),
        wallet_address: recoveryResult.walletAddress,
      })

      queryClient.invalidateQueries({ queryKey: [LIST_AUTHENTICATORS_QUERY_KEY] })
      handleClose()
    } catch (e) {
      logger.error(e, { tags: { file: 'RecoverWalletModal', function: 'handleAddPasskey' } })
      setAuthPrivateKey(null)
      setAddPasskeyError(t('common.card.error.description'))
      // authPrivateKey is zeroed by executeRecovery's finally block, so retrying from
      // ADD_PASSKEY would silently no-op. Route back to EMAIL_ENTRY so the user can restart.
      setStep(RecoverStep.EMAIL_ENTRY)
    }
  })

  const handleClose = useEvent(() => {
    setStep(RecoverStep.EMAIL_ENTRY)
    setEmail('')
    setAccessToken(null)
    setAuthPrivateKey(null)
    setShowPasscode(false)
    setPinError(undefined)
    setCooldownExpiresAt(null)
    setIsDecrypting(false)
    setRecoveryWalletAddress(undefined)
    setEncryptedKeyId(undefined)
    setOauthProvider(null)
    setOauthEmail(undefined)
    setOauthError(undefined)
    setAddPasskeyError(undefined)
    sessionStorage.removeItem(RECOVER_OAUTH_PENDING_KEY)
    otpInput.reset()
    passcodeInput.reset()
    sendCodeMutation.reset()
    resendCodeMutation.reset()
    submitCodeMutation.reset()
    onClose()
  })

  const handleBack = useEvent(() => {
    sendCodeMutation.reset()
    resendCodeMutation.reset()
    submitCodeMutation.reset()
    setPinError(undefined)
    if (step === RecoverStep.EMAIL_ENTRY) {
      handleClose()
    } else if (step === RecoverStep.EMAIL_CODE) {
      otpInput.reset()
      setStep(RecoverStep.EMAIL_ENTRY)
    } else if (step === RecoverStep.ENTER_PIN) {
      passcodeInput.reset()
      if (oauthProvider) {
        handleClose()
      } else {
        setStep(RecoverStep.EMAIL_CODE)
      }
    }
  })

  const isValidEmail = EMAIL_REGEX.test(email)

  return (
    <Modal
      name={ModalName.RecoverWallet}
      isModalOpen={isOpen}
      onClose={handleClose}
      isDismissible={false}
      maxWidth={420}
    >
      <Flex gap="$gap24" alignItems="center" width="100%">
        {step === RecoverStep.OAUTH_LOADING && <OAuthLoadingStep oauthError={oauthError} handleClose={handleClose} />}
        {step === RecoverStep.EMAIL_ENTRY && (
          <EmailEntryStep
            email={email}
            setEmail={setEmail}
            isValidEmail={isValidEmail}
            isLoading={isLoading}
            errorMessage={errorMessage}
            sendCodeMutation={sendCodeMutation}
            handleBack={handleBack}
            handleClose={handleClose}
            t={t}
          />
        )}
        {step === RecoverStep.EMAIL_CODE && (
          <EmailCodeStep
            email={email}
            otpInput={otpInput}
            submitCodeMutation={submitCodeMutation}
            resendCodeMutation={resendCodeMutation}
            errorMessage={errorMessage}
            handleBack={handleBack}
            handleClose={handleClose}
            t={t}
          />
        )}
        {step === RecoverStep.ENTER_PIN && (
          <EnterPinStep
            recoveryWalletAddress={recoveryWalletAddress}
            passcodeInput={passcodeInput}
            showPasscode={showPasscode}
            setShowPasscode={setShowPasscode}
            pinError={pinError}
            cooldown={cooldown}
            isDecrypting={isDecrypting}
            handleBack={handleBack}
            handleClose={handleClose}
            t={t}
          />
        )}
        {step === RecoverStep.ADD_PASSKEY && (
          <AddPasskeyStep
            addPasskeyError={addPasskeyError}
            handleAddPasskey={handleAddPasskey}
            handleClose={handleClose}
            t={t}
          />
        )}
        {step === RecoverStep.RECOVERING && <RecoveringStep t={t} />}
      </Flex>
    </Modal>
  )
}
