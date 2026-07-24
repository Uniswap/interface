import { isMobileWeb } from '@universe/environment'
import { useTranslation } from 'react-i18next'
import { Flex } from 'ui/src'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { ConfirmPasscodeExtra, SuccessStep } from '~/components/Passkey/AddBackupLoginFinalSteps'
import {
  AlreadyInUseStep,
  EmailCodeStep,
  EmailEntryStep,
  MethodSelectStep,
  PasscodeIntroStep,
  PasscodeStep,
} from '~/components/Passkey/AddBackupLoginSteps'
import { Step, useBackupLoginFlow } from '~/components/Passkey/useBackupLoginFlow'

export function AddBackupLoginModal() {
  const { t } = useTranslation()
  const flow = useBackupLoginFlow()

  return (
    <Modal
      name={ModalName.AddBackupLogin}
      isModalOpen={flow.isOpen}
      onClose={flow.handleClose}
      isDismissible={isMobileWeb}
      maxWidth={420}
    >
      <Flex gap="$gap24" alignItems="center" width="100%">
        {flow.step === Step.METHOD_SELECT && (
          <MethodSelectStep
            handleClose={flow.handleClose}
            handleInitOAuth={flow.handleInitOAuth}
            oauthLoading={flow.oauthLoading}
            oauthProvider={flow.oauthProvider}
            onSelectEmail={flow.goToEmailEntry}
            t={t}
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

        {flow.step === Step.ALREADY_IN_USE && (
          <AlreadyInUseStep
            handleClose={flow.handleClose}
            handleSignOut={flow.handleAlreadyInUseSignOut}
            handleTryAgain={flow.handleAlreadyInUseTryAgain}
            oauthProvider={flow.oauthProvider}
            t={t}
          />
        )}

        {flow.step === Step.PASSCODE_INTRO && (
          <PasscodeIntroStep
            email={flow.email}
            handleClose={flow.handleClose}
            oauthEmail={flow.oauthEmail}
            oauthProvider={flow.oauthProvider}
            onSetPasscode={flow.goToSetPasscode}
            t={t}
          />
        )}

        {flow.step === Step.SET_PASSCODE && (
          <PasscodeStep
            description={t('account.passkey.backupLogin.setPasscode.description')}
            digitInput={flow.passcodeInput}
            handleBack={flow.handleBack}
            handleClose={flow.handleClose}
            isEncrypting={flow.isEncrypting}
            passcodeError={flow.passcodeError}
            setShowPasscode={flow.setShowPasscode}
            showPasscode={flow.showPasscode}
            t={t}
            title={t('account.passkey.backupLogin.setPasscode.title')}
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
            title={t('account.passkey.backupLogin.confirmPasscode.title')}
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
            email={flow.email}
            handleClose={flow.handleClose}
            handleDone={flow.handleDone}
            oauthEmail={flow.oauthEmail}
            oauthProvider={flow.oauthProvider}
            t={t}
          />
        )}
      </Flex>
    </Modal>
  )
}

export default AddBackupLoginModal
