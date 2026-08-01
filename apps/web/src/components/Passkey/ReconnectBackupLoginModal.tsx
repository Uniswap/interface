import { isMobileWeb } from '@universe/environment'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { Anchor, Button, Flex, ModalCloseIcon, Text } from 'ui/src'
import { AlertTriangleFilled } from 'ui/src/components/icons/AlertTriangleFilled'
import { Shield } from 'ui/src/components/icons/Shield'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { BackupMethodSummary } from 'uniswap/src/components/passkey/recovery/BackupMethodSummary'
import { IconBox } from 'uniswap/src/components/passkey/recovery/IconBox'
import { UniswapHelpUrls } from 'uniswap/src/constants/urls'
import type { RecoveryMethod } from 'uniswap/src/features/passkey/embeddedWallet'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { useEvent } from 'utilities/src/react/hooks'
import { useListAuthenticatorsQuery } from '~/components/AccountDrawer/PasskeyMenu/hooks/useListAuthenticatorsQuery'
import { ConfirmPasscodeExtra, SuccessStep } from '~/components/Passkey/AddBackupLoginFinalSteps'
import {
  EmailCodeStep,
  EmailEntryStep,
  PasscodeIntroStep,
  PasscodeStep,
} from '~/components/Passkey/AddBackupLoginSteps'
import { OverflowMenu } from '~/components/Passkey/OverflowMenu'
import { Step, useBackupLoginFlow } from '~/components/Passkey/useBackupLoginFlow'
import { RECONNECT_OAUTH_PENDING_KEY } from '~/components/Passkey/useOAuthRedirectRouter'
import { setOpenModal } from '~/state/application/reducer'

type Provider = 'google' | 'apple' | null

function toProvider(type: string): Provider {
  if (type === 'GOOGLE') {
    return 'google'
  }
  if (type === 'APPLE') {
    return 'apple'
  }
  return null
}

export function ReconnectBackupLoginModal() {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { data } = useListAuthenticatorsQuery()

  const method: RecoveryMethod | undefined = useMemo(() => {
    const methods = data?.recoveryMethods ?? []
    return methods.find((m) => m.shouldRotate) ?? methods.at(0)
  }, [data?.recoveryMethods])

  const provider = toProvider(method?.type ?? '')
  const identifier = method?.identifier ?? ''
  const providerLabel =
    provider === 'google' ? 'Google' : provider === 'apple' ? 'Apple' : t('account.passkey.backupLogin.add.email')

  const flow = useBackupLoginFlow({
    modalName: ModalName.ReconnectBackupLogin,
    oauthPendingKey: RECONNECT_OAUTH_PENDING_KEY,
    skipAvailabilityCheck: true,
    // Reject reusing the last passcode (own v1 eval on the set step; the v2 blob-build can't tell).
    enablePinReuseCheck: true,
    // v1→v2 rotation: the new-blob eval must run under v2 (fresh nonce), not the v1 recovery branch.
    isRotation: true,
  })

  const handleReconnect = useEvent(() => {
    if (provider) {
      void flow.handleInitOAuth(provider)
    } else {
      flow.setEmail(identifier)
      flow.goToEmailEntry()
    }
  })

  const handleRemove = useEvent(() => {
    if (!method) {
      return
    }
    flow.handleClose()
    dispatch(
      setOpenModal({
        name: ModalName.RemoveBackupLogin,
        initialState: {
          recoveryMethodType: method.type,
          recoveryMethodIdentifier: method.identifier || undefined,
        },
      }),
    )
  })

  return (
    <Modal
      name={ModalName.ReconnectBackupLogin}
      isModalOpen={flow.isOpen}
      onClose={flow.handleClose}
      isDismissible={isMobileWeb}
      maxWidth={420}
    >
      <Flex gap="$gap24" alignItems="center" width="100%">
        {flow.step === Step.METHOD_SELECT && (
          <ReconnectAlertStep
            email={identifier}
            onClose={flow.handleClose}
            onReconnect={handleReconnect}
            onRemove={handleRemove}
            provider={provider}
          />
        )}

        {flow.step === Step.EMAIL_ENTRY && (
          <EmailEntryStep
            email={flow.email}
            errorMessage={flow.errorMessage}
            handleBack={flow.handleBack}
            handleClose={flow.handleClose}
            handleSendCode={flow.handleSendCode}
            isLoading={flow.isLoading}
            isValidEmail={flow.isValidEmail}
            setEmail={flow.setEmail}
            t={t}
          />
        )}

        {flow.step === Step.EMAIL_CODE && (
          <EmailCodeStep
            email={flow.email}
            errorMessage={flow.errorMessage}
            handleBack={flow.handleBack}
            handleClose={flow.handleClose}
            handleResendCode={flow.handleResendCode}
            otpInput={flow.otpInput}
            submitCodeMutation={flow.submitCodeMutation}
            t={t}
          />
        )}

        {flow.step === Step.PASSCODE_INTRO && (
          <PasscodeIntroStep
            description={t('account.passkey.reconnect.passcodeIntro.description')}
            email={flow.email}
            handleClose={flow.handleClose}
            oauthEmail={flow.oauthEmail}
            oauthProvider={flow.oauthProvider}
            onSetPasscode={flow.goToSetPasscode}
            t={t}
            title={t('account.passkey.reconnect.passcodeIntro.title')}
          />
        )}

        {flow.step === Step.SET_PASSCODE && (
          <PasscodeStep
            description={t('account.passkey.backupLogin.setPasscode.description')}
            digitInput={flow.passcodeInput}
            handleBack={flow.handleBack}
            handleClose={flow.handleClose}
            isEncrypting={flow.isEncrypting || flow.isCheckingReuse}
            passcodeError={flow.passcodeError}
            setShowPasscode={flow.setShowPasscode}
            showPasscode={flow.showPasscode}
            t={t}
            title={t('account.passkey.reconnect.setPasscode.title')}
          />
        )}

        {flow.step === Step.CONFIRM_PASSCODE && (
          <PasscodeStep
            description={t('account.passkey.backupLogin.confirmPasscode.description')}
            digitInput={flow.confirmPasscodeInput}
            handleBack={flow.handleBack}
            handleClose={flow.handleClose}
            inputsLocked={flow.cryptoResult !== null}
            isEncrypting={flow.isEncrypting}
            passcodeError={flow.passcodeError}
            setShowPasscode={flow.setShowPasscode}
            showPasscode={flow.showPasscode}
            t={t}
            title={t('account.passkey.reconnect.confirmPasscode.title')}
          >
            <ConfirmPasscodeExtra
              cryptoResult={flow.cryptoResult}
              handleSignInWithPasskey={flow.handleSignInWithPasskey}
              isEncrypting={flow.isEncrypting}
              isSigningIn={flow.isSigningIn}
              t={t}
            />
          </PasscodeStep>
        )}

        {flow.step === Step.SUCCESS && (
          <SuccessStep
            description={t('account.passkey.reconnect.success.description', { method: providerLabel })}
            email={flow.email}
            handleClose={flow.handleClose}
            handleDone={flow.handleDone}
            oauthEmail={flow.oauthEmail}
            oauthProvider={flow.oauthProvider}
            t={t}
            title={t('account.passkey.reconnect.success.title')}
          />
        )}
      </Flex>
    </Modal>
  )
}

function ReconnectAlertStep({
  email,
  onClose,
  onReconnect,
  onRemove,
  provider,
}: {
  email: string
  onClose: () => void
  onReconnect: () => void
  onRemove: () => void
  provider: Provider
}) {
  const { t } = useTranslation()

  return (
    <Trace logImpression modal={ModalName.ReconnectBackupLogin}>
      <Flex width="100%" alignItems="flex-end">
        <ModalCloseIcon size="$icon.20" onClose={onClose} />
      </Flex>
      <Flex gap="$gap16" alignItems="center" width="100%" px="$padding4">
        <IconBox>
          <Shield size="$icon.24" color="$neutral1" />
        </IconBox>
        <Flex gap="$gap8" alignItems="center" maxWidth={360}>
          <Text variant="subheading1" textAlign="center">
            {t('account.passkey.reconnect.title')}
          </Text>
          <Text variant="body2" textAlign="center" color="$neutral2">
            {t('account.passkey.reconnect.description')}
          </Text>
          <Anchor href={UniswapHelpUrls.articles.backupLoginReconnect} target="_blank" textDecorationLine="none">
            <Text variant="buttonLabel3" color="$neutral1">
              {t('account.passkey.reconnect.learnMore')}
            </Text>
          </Anchor>
        </Flex>
      </Flex>

      <Flex
        width="100%"
        gap="$gap12"
        borderWidth={1}
        borderColor="$surface3"
        borderRadius="$rounded20"
        backgroundColor="$surface2"
        p="$padding16"
      >
        <Flex row alignItems="center" width="100%">
          <BackupMethodSummary provider={provider} email={email} size="lg" iconOpacity={0.5} />
          <OverflowMenu onRemove={onRemove} testID={TestID.RemoveBackupLoginOverflow} />
        </Flex>

        <Flex row gap="$gap8" alignItems="center" p="$padding12" backgroundColor="$surface3" borderRadius="$rounded12">
          <AlertTriangleFilled size="$icon.16" color="$neutral1" />
          <Text variant="body3" color="$neutral1" flex={1}>
            {t('account.passkey.reconnect.newPasscodeRequired')}
          </Text>
        </Flex>
      </Flex>

      <Flex row alignSelf="stretch">
        <Button variant="default" size="medium" onPress={onReconnect}>
          {t('account.passkey.reconnect.cta')}
        </Button>
      </Flex>
    </Trace>
  )
}

export default ReconnectBackupLoginModal
