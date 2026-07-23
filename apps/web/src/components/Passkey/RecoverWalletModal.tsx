import { useQueryClient } from '@tanstack/react-query'
import { base64urlToBase64 } from '@universe/encoding'
import { isMobileWeb } from '@universe/environment'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { connect } from '@wagmi/core'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { Flex } from 'ui/src'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { EmailCodeStep } from 'uniswap/src/components/passkey/recovery/steps/EmailCodeStep'
import { EmailEntryStep } from 'uniswap/src/components/passkey/recovery/steps/EmailEntryStep'
import { EnterPinStep } from 'uniswap/src/components/passkey/recovery/steps/EnterPinStep'
import { NoWalletFoundStep } from 'uniswap/src/components/passkey/recovery/steps/NoWalletFoundStep'
import { OAuthLoadingStep } from 'uniswap/src/components/passkey/recovery/steps/OAuthLoadingStep'
import { RecoveringStep } from 'uniswap/src/components/passkey/recovery/steps/RecoveringStep'
import { RecoveryLoginStep } from 'uniswap/src/components/passkey/recovery/steps/RecoveryLoginStep'
import { CONNECTION_PROVIDER_IDS } from 'uniswap/src/constants/web3'
import { unitagsApiClient } from 'uniswap/src/data/apiClients/unitagsApi/UnitagsApiClient'
import { registerNewPasskey, toRecoveryAuthMethodType } from 'uniswap/src/features/passkey/embeddedWallet'
import { executeRecovery } from 'uniswap/src/features/passkey/recoveryExecute'
import { RecoveryStep, useRecoveryFlow } from 'uniswap/src/features/passkey/useRecoveryFlow'
import { InterfaceEventName, ModalName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { WalletConnectionResult } from 'uniswap/src/features/telemetry/types'
import { shortenAddress } from 'utilities/src/addresses'
import { logger } from 'utilities/src/logger/logger'
import { useEvent } from 'utilities/src/react/hooks'
import { resetListAuthenticators } from '~/components/AccountDrawer/PasskeyMenu/PasskeyMenu'
import { PasscodeStep } from '~/components/Passkey/AddBackupLoginSteps'
import { AddPasskeyStep, RotationExpiredStep, RotationIntroStep } from '~/components/Passkey/RecoverWalletSteps'
import { useRecoveryPrivyAuth } from '~/components/Passkey/useRecoveryPrivyAuth'
import { useWagmiConnectorWithId } from '~/components/WalletModal/useWagmiConnectorWithId'
import { getPrivyConfig } from '~/config'
import { wagmiConfig } from '~/connection/wagmiConfig'
import { walletTypeToAmplitudeWalletType } from '~/connection/walletConnect'
import { useAndroidKeyboardViewportFix } from '~/hooks/useAndroidKeyboardViewportFix'
import { useModalState } from '~/hooks/useModalState'
import { useSignInWithPasskey } from '~/hooks/useSignInWithPasskey'
import { setOpenModal } from '~/state/application/reducer'
import type { RecoverWalletModalParams } from '~/state/application/reducer'
import { useEmbeddedWalletState } from '~/state/embeddedWallet/store'
import { useAppSelector } from '~/state/hooks'
import { updateIsEmbeddedWalletBackedUp } from '~/state/user/reducer'

export function RecoverWalletModal(): JSX.Element {
  const { t } = useTranslation()
  const { isOpen, onClose } = useModalState(ModalName.RecoverWallet)
  // Android Chrome shoves this fixed bottom sheet above the viewport when the soft keyboard opens; keep
  // it on-screen while the modal is open. No-op on iOS/desktop. See hook for the full explanation.
  useAndroidKeyboardViewportFix(isOpen)
  const queryClient = useQueryClient()
  const dispatch = useDispatch()
  const { setIsConnected, setWalletAddress, setWalletId } = useEmbeddedWalletState()
  const connector = useWagmiConnectorWithId(CONNECTION_PROVIDER_IDS.EMBEDDED_WALLET_CONNECTOR_ID, {
    shouldThrow: true,
  })

  const [addPasskeyError, setAddPasskeyError] = useState<string | undefined>()
  const [oauthError, setOauthError] = useState<string | undefined>()
  const { openModal: openGetTheApp } = useModalState(ModalName.GetTheApp)

  const { appId: privyAppId } = getPrivyConfig(false)
  const handleOAuthError = useCallback((err: string) => setOauthError(err), [])
  const privy = useRecoveryPrivyAuth({ onOAuthError: handleOAuthError })
  const disableV1EwRotation = useFeatureFlag(FeatureFlags.DisableV1EwRotation)

  const onPinDecryptSuccess = useEvent(
    async ({
      authPrivateKey,
      authMethodId,
      accessToken,
    }: {
      authPrivateKey: Uint8Array
      authMethodId: string
      email: string
      accessToken: string
    }) => {
      let passkeyUsername: string | undefined
      if (flow.recoveryWalletAddress) {
        try {
          const unitagResponse = await unitagsApiClient.fetchAddress({ address: flow.recoveryWalletAddress })
          passkeyUsername = unitagResponse.username ?? shortenAddress({ address: flow.recoveryWalletAddress })
        } catch {
          passkeyUsername = shortenAddress({ address: flow.recoveryWalletAddress })
        }
      }

      const { credential } = await registerNewPasskey({ username: passkeyUsername })
      const credentialJson = JSON.parse(credential) as { response?: { publicKey?: string } }
      if (!credentialJson.response?.publicKey) {
        throw new Error('Credential response missing publicKey')
      }
      const newPasskeyPublicKey = base64urlToBase64(credentialJson.response.publicKey)

      const recoveryResult = await executeRecovery({
        authPrivateKey,
        authMethodId,
        accessToken,
        newPasskeyCredential: credential,
        newPasskeyPublicKey,
        generateAuthorizationSignature: privy.generateAuthorizationSignature,
      })

      dispatch(updateIsEmbeddedWalletBackedUp({ isEmbeddedWalletBackedUp: false }))
      setWalletAddress(recoveryResult.walletAddress)
      setWalletId(recoveryResult.walletId)
      setIsConnected(true)
      Promise.resolve(connect(wagmiConfig, { connector })).catch(() => {})
      sendAnalyticsEvent(InterfaceEventName.WalletConnected, {
        result: WalletConnectionResult.Succeeded,
        wallet_name: connector.name,
        wallet_type: walletTypeToAmplitudeWalletType(connector.type),
        wallet_address: recoveryResult.walletAddress,
      })

      void resetListAuthenticators(queryClient, recoveryResult.walletId)
      handleClose()
    },
  )

  const flow = useRecoveryFlow({
    privy,
    privyAppId,
    onPinDecryptSuccess,
    setOauthError,
    showAddPasskeyStep: true,
    // v1 backup logins rotate to v2 in place (no passkey) instead of the add-passkey recovery.
    enableRotation: true,
    // Kill switch: when on, v1 rotation is disabled and the user is routed to passkey sign-in.
    disableRotation: disableV1EwRotation,
  })

  // Safe against re-fire: EmailEntry hides its back arrow, so the user can't return to
  // Login mid-session.
  const initialMethod = useAppSelector(
    (state) => (state.application.openModal as Partial<RecoverWalletModalParams> | null)?.initialState?.initialMethod,
  )
  const { step: flowStep, selectEmailLogin: flowSelectEmailLogin } = flow
  useEffect(() => {
    if (isOpen && initialMethod === 'email' && flowStep === RecoveryStep.Login) {
      flowSelectEmailLogin()
    }
  }, [isOpen, initialMethod, flowStep, flowSelectEmailLogin])

  const handleClose = useEvent(() => {
    flow.reset()
    setAddPasskeyError(undefined)
    onClose()
  })

  const { signInWithPasskey } = useSignInWithPasskey({ onSuccess: onClose })

  // Rotation disabled: close the recovery modal and start passkey sign-in.
  const handleContinueWithPasskey = useEvent(() => {
    handleClose()
    signInWithPasskey()
  })

  // Overflow → delete the legacy v1 recovery method. RemoveBackupLoginModal does the
  // passkey-authorized delete; pass the walletId since there is no active session here.
  const handleRemoveRecoveryMethod = useEvent(() => {
    const walletId = flow.walletId
    handleClose()
    dispatch(
      setOpenModal({
        name: ModalName.RemoveBackupLogin,
        initialState: {
          recoveryMethodType: toRecoveryAuthMethodType(flow.oauthProvider),
          recoveryMethodIdentifier: flow.effectiveEmail || undefined,
          walletId,
        },
      }),
    )
  })

  const handleCreateAccount = useEvent(() => {
    handleClose()
    openGetTheApp()
  })

  const handleAddPasskey = useEvent(async () => {
    setAddPasskeyError(undefined)
    try {
      await flow.confirmAddPasskey()
    } catch (e) {
      logger.error(e, { tags: { file: 'RecoverWalletModal', function: 'handleAddPasskey' } })
      setAddPasskeyError(t('common.card.error.description'))
    }
  })

  return (
    <Modal
      name={ModalName.RecoverWallet}
      isModalOpen={isOpen}
      onClose={handleClose}
      isDismissible={isMobileWeb}
      maxWidth={420}
    >
      <Flex gap="$gap24" alignItems="center" width="100%">
        {flow.step === RecoveryStep.Login && (
          <RecoveryLoginStep
            t={t}
            handleClose={handleClose}
            onSelectEmail={flow.selectEmailLogin}
            onSelectApple={() => flow.initOAuth('apple')}
            onSelectGoogle={() => flow.initOAuth('google')}
            oauthLoadingProvider={flow.oauthProvider}
            isReady={flow.isReady}
          />
        )}
        {flow.step === RecoveryStep.OAuthLoading && (
          <OAuthLoadingStep oauthError={oauthError} handleClose={handleClose} />
        )}
        {flow.step === RecoveryStep.EmailEntry && (
          <EmailEntryStep
            email={flow.email}
            setEmail={flow.setEmail}
            isValidEmail={flow.isValidEmail}
            isLoading={flow.isLoading}
            isReady={flow.isReady}
            errorMessage={flow.errorMessage}
            sendCodeMutation={flow.sendCodeMutation}
            handleBack={handleClose}
            handleClose={handleClose}
            hideBack
            t={t}
          />
        )}
        {flow.step === RecoveryStep.EmailCode && (
          <EmailCodeStep
            email={flow.email}
            otpInput={flow.otpInput}
            submitCodeMutation={flow.submitCodeMutation}
            resendCodeMutation={flow.resendCodeMutation}
            errorMessage={flow.errorMessage}
            isReady={flow.isReady}
            handleBack={flow.handleBack}
            handleClose={handleClose}
            t={t}
          />
        )}
        {flow.step === RecoveryStep.EnterPin && (
          <EnterPinStep
            recoveryWalletAddress={flow.recoveryWalletAddress}
            passcodeInput={flow.passcodeInput}
            showPasscode={flow.showPasscode}
            setShowPasscode={flow.setShowPasscode}
            pinError={flow.pinError}
            cooldown={flow.cooldown}
            isDecrypting={flow.isDecrypting}
            handleBack={flow.handleBack}
            handleClose={handleClose}
            t={t}
          />
        )}
        {flow.step === RecoveryStep.AddPasskey && (
          <AddPasskeyStep
            addPasskeyError={addPasskeyError}
            handleAddPasskey={handleAddPasskey}
            handleClose={handleClose}
            isRotation={flow.didRotate}
            walletAddress={flow.recoveryWalletAddress}
            t={t}
          />
        )}
        {flow.step === RecoveryStep.NewPasscodeIntro && (
          <RotationIntroStep
            provider={flow.oauthProvider}
            email={flow.effectiveEmail}
            onContinue={flow.continueToSetNewPasscode}
            onRemove={handleRemoveRecoveryMethod}
            handleClose={handleClose}
            t={t}
          />
        )}
        {flow.step === RecoveryStep.RotationExpired && (
          <RotationExpiredStep onContinueWithPasskey={handleContinueWithPasskey} handleClose={handleClose} t={t} />
        )}
        {flow.step === RecoveryStep.SetNewPasscode && (
          <PasscodeStep
            modalName={ModalName.RecoverWallet}
            title={t('account.passkey.reconnect.setPasscode.title')}
            description={t('account.passkey.backupLogin.setPasscode.description')}
            digitInput={flow.newPasscodeInput}
            showPasscode={flow.showPasscode}
            setShowPasscode={flow.setShowPasscode}
            passcodeError={flow.newPasscodeError}
            isEncrypting={false}
            handleBack={flow.handleBack}
            handleClose={handleClose}
            t={t}
          />
        )}
        {flow.step === RecoveryStep.ConfirmNewPasscode && (
          <PasscodeStep
            modalName={ModalName.RecoverWallet}
            title={t('account.passkey.reconnect.confirmPasscode.title')}
            description={t('account.passkey.reconnect.confirmPasscode.description')}
            digitInput={flow.confirmNewPasscodeInput}
            showPasscode={flow.showPasscode}
            setShowPasscode={flow.setShowPasscode}
            passcodeError={flow.newPasscodeError}
            isEncrypting={false}
            handleBack={flow.handleBack}
            handleClose={handleClose}
            t={t}
          />
        )}
        {flow.step === RecoveryStep.Recovering && <RecoveringStep t={t} />}
        {flow.step === RecoveryStep.NoWalletFound && (
          <NoWalletFoundStep t={t} handleClose={handleClose} onCreateAccount={handleCreateAccount} />
        )}
      </Flex>
    </Modal>
  )
}

export default RecoverWalletModal
