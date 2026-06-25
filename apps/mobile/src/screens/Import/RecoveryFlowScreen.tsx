import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import { OnboardingScreen } from 'src/features/onboarding/OnboardingScreen'
import { getPrivyConfig } from 'src/features/passkey/PrivyProviderWrapper'
import { useRecoveryPrivyAuth } from 'src/features/passkey/useRecoveryPrivyAuth'
import { Flex, Text, TouchableArea } from 'ui/src'
import { EmailCodeStep } from 'uniswap/src/components/passkey/recovery/steps/EmailCodeStep'
import { EmailEntryStep } from 'uniswap/src/components/passkey/recovery/steps/EmailEntryStep'
import { EnterPinStep } from 'uniswap/src/components/passkey/recovery/steps/EnterPinStep'
import { NoWalletFoundStep } from 'uniswap/src/components/passkey/recovery/steps/NoWalletFoundStep'
import { OAuthLoadingStep } from 'uniswap/src/components/passkey/recovery/steps/OAuthLoadingStep'
import { RecoveringStep } from 'uniswap/src/components/passkey/recovery/steps/RecoveringStep'
import { RecoveryLoginStep } from 'uniswap/src/components/passkey/recovery/steps/RecoveryLoginStep'
import { UniswapHelpUrls } from 'uniswap/src/constants/urls'
import { authenticateWithPasskeyForWalletSignin } from 'uniswap/src/features/passkey/embeddedWallet'
import { exportSeedPhraseWithRecovery } from 'uniswap/src/features/passkey/hpkeExport'
import { RecoveryStep, useRecoveryFlow } from 'uniswap/src/features/passkey/useRecoveryFlow'
import { ImportType } from 'uniswap/src/types/onboarding'
import { OnboardingScreens } from 'uniswap/src/types/screens/mobile'
import { openUri } from 'uniswap/src/utils/linking'
import { logger } from 'utilities/src/logger/logger'
import { useEvent } from 'utilities/src/react/hooks'
import { useOnboardingContext } from 'wallet/src/features/onboarding/OnboardingContext'
import { BackupType } from 'wallet/src/features/wallet/accounts/types'
import { Keyring } from 'wallet/src/features/wallet/Keyring/Keyring'

type Props = NativeStackScreenProps<OnboardingStackParamList, OnboardingScreens.RecoveryFlow>

/**
 * Hosts the shared recovery state machine. On PIN decrypt success, decrypts the HPKE
 * seed phrase export locally, imports it into the native keyring, and forwards to the
 * standard post-import stack (SelectWallet → Notifications → Security).
 */
export function RecoveryFlowScreen({ navigation, route: { params } }: Props): JSX.Element {
  const { t } = useTranslation()
  const privy = useRecoveryPrivyAuth()
  const { generateImportedAccounts } = useOnboardingContext()
  const [isPasskeyLoading, setIsPasskeyLoading] = useState(false)
  const [oauthError, setOauthError] = useState<string | undefined>()

  const privyAppId = getPrivyConfig().appId

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
      try {
        const mnemonic = await exportSeedPhraseWithRecovery({
          authPrivateKey,
          authMethodId,
          accessToken,
          generateAuthorizationSignature: privy.generateAuthorizationSignature,
        })
        const importedAddress = await Keyring.importMnemonic(mnemonic)
        await generateImportedAccounts({ mnemonicId: importedAddress, backupType: BackupType.Passkey })
        navigation.navigate({
          name: OnboardingScreens.SelectWallet,
          params: { importType: ImportType.Passkey, entryPoint: params.entryPoint },
          merge: true,
        })
      } catch (e) {
        logger.error(e, { tags: { file: 'RecoveryFlowScreen.tsx', function: 'onPinDecryptSuccess' } })
        throw e
      }
    },
  )

  const flow = useRecoveryFlow({
    privy,
    privyAppId,
    onPinDecryptSuccess,
    setOauthError,
  })

  const handleContinueWithPasskey = useEvent(async () => {
    if (isPasskeyLoading) {
      return
    }
    setIsPasskeyLoading(true)
    try {
      const credential = await authenticateWithPasskeyForWalletSignin()
      if (!credential) {
        // No passkey on this device (or user cancelled). Stay on the Login view so the
        // user can pick Apple/Google/Email instead.
        return
      }
      navigation.navigate({
        name: OnboardingScreens.PasskeyImport,
        params: { importType: ImportType.Passkey, entryPoint: params.entryPoint, passkeyCredential: credential },
        merge: true,
      })
    } catch (e) {
      logger.warn('RecoveryFlowScreen.tsx', 'handleContinueWithPasskey', 'Error authenticating with passkey', {
        error: e,
      })
    } finally {
      setIsPasskeyLoading(false)
    }
  })

  // Auto-trigger the passkey ceremony when the user arrived here by tapping "Log in with
  // Passkey" on ImportMethodScreen. `params.initialMethod` is set once at navigation time
  // and `handleContinueWithPasskey` is stable via `useEvent`, so this fires exactly once
  // on mount when the entry condition is met. After cancel, the user retries via the
  // Continue button.
  useEffect(() => {
    if (params.initialMethod !== 'passkey') {
      return
    }
    void handleContinueWithPasskey()
  }, [params.initialMethod, handleContinueWithPasskey])

  return (
    <OnboardingScreen renderHeaderRight={() => <HelpLink t={t} />}>
      <Flex gap="$gap24" alignItems="center" width="100%">
        {flow.step === RecoveryStep.Login && (
          <RecoveryLoginStep
            headerActions={null}
            isPasskeyLoading={isPasskeyLoading}
            isReady={flow.isReady}
            oauthLoadingProvider={flow.oauthProvider}
            t={t}
            handleClose={() => navigation.goBack()}
            onContinueWithPasskey={handleContinueWithPasskey}
            onSelectApple={() => flow.initOAuth('apple')}
            onSelectEmail={flow.selectEmailLogin}
            onSelectGoogle={() => flow.initOAuth('google')}
          />
        )}
        {flow.step === RecoveryStep.OAuthLoading && (
          <OAuthLoadingStep oauthError={oauthError} headerActions={null} handleClose={() => navigation.goBack()} />
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
            headerActions={null}
            handleBack={() => navigation.goBack()}
            handleClose={() => navigation.goBack()}
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
            headerActions={null}
            handleBack={flow.handleBack}
            handleClose={() => navigation.goBack()}
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
            headerActions={null}
            handleBack={flow.handleBack}
            handleClose={() => navigation.goBack()}
            t={t}
          />
        )}
        {flow.step === RecoveryStep.Recovering && <RecoveringStep t={t} />}
        {flow.step === RecoveryStep.NoWalletFound && (
          <NoWalletFoundStep t={t} handleClose={() => navigation.goBack()} />
        )}
      </Flex>
    </OnboardingScreen>
  )
}

function HelpLink({ t }: { t: ReturnType<typeof useTranslation>['t'] }): JSX.Element {
  return (
    <TouchableArea
      hitSlop={16}
      onPress={() => {
        void openUri({ uri: UniswapHelpUrls.articles.passkeysInfo })
      }}
    >
      <Text color="$neutral2" variant="buttonLabel2">
        {t('common.help')}
      </Text>
    </TouchableArea>
  )
}
