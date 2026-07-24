import { Trans, useTranslation } from 'react-i18next'
import { Anchor, Button, Flex, SpinningLoader, Text } from 'ui/src'
import { EnvelopeHeart } from 'ui/src/components/icons/EnvelopeHeart'
import { Passkey } from 'ui/src/components/icons/Passkey'
import { UniswapLogo } from 'ui/src/components/icons/UniswapLogo'
import { EmailCodeStep } from 'uniswap/src/components/passkey/recovery/steps/EmailCodeStep'
import { EmailEntryStep } from 'uniswap/src/components/passkey/recovery/steps/EmailEntryStep'
import { EnterPinStep } from 'uniswap/src/components/passkey/recovery/steps/EnterPinStep'
import { NoWalletFoundStep } from 'uniswap/src/components/passkey/recovery/steps/NoWalletFoundStep'
import { OAuthLoadingStep } from 'uniswap/src/components/passkey/recovery/steps/OAuthLoadingStep'
import { RecoveringStep } from 'uniswap/src/components/passkey/recovery/steps/RecoveringStep'
import { RecoveryLoginStep } from 'uniswap/src/components/passkey/recovery/steps/RecoveryLoginStep'
import { UniswapHelpUrls } from 'uniswap/src/constants/urls'
import { AccountIcon } from 'uniswap/src/features/accounts/AccountIcon'
import { useOnchainDisplayName } from 'uniswap/src/features/accounts/useOnchainDisplayName'
import { RecoveryStep, useRecoveryFlow } from 'uniswap/src/features/passkey/useRecoveryFlow'
import { InterfacePageName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { HpkeHandshakeStatus } from '~/pages/ExtensionPasskeyAuthPopUp/useExtensionRecoveryBridge'

export function GetHelpButton({ t }: { t: ReturnType<typeof useTranslation>['t'] }): JSX.Element {
  return (
    <Anchor target="_blank" rel="noreferrer" href={UniswapHelpUrls.articles.passkeysInfo} textDecorationLine="none">
      <Button icon={<EnvelopeHeart size="$icon.16" color="$neutral2" />} size="xxsmall" emphasis="secondary">
        {t('common.getHelp.button')}
      </Button>
    </Anchor>
  )
}

export function DeniedView({ t }: { t: ReturnType<typeof useTranslation>['t'] }): JSX.Element {
  return (
    <Trace logImpression page={InterfacePageName.ExtensionPasskeySignInPage}>
      <Flex flexDirection="column" alignItems="center" justifyContent="center" minHeight="100vh">
        <Flex width="400px" padding="$spacing16" flexDirection="column" gap="$spacing16">
          <Flex row justifyContent="flex-end">
            <GetHelpButton t={t} />
          </Flex>
          <Flex alignItems="center">
            <UniswapLogo size="$icon.40" color="$accent1" />
          </Flex>
          <Flex alignItems="center" px="$spacing60">
            <Text variant="body3" textAlign="center">
              {t('extensionPasskeyLogInPopUp.invalidReferrer')}
            </Text>
          </Flex>
        </Flex>
      </Flex>
    </Trace>
  )
}

export function LoginView({
  handshakeStatus,
  flow,
  oauthError,
  isPasskeyLoading,
  onContinueWithPasskey,
  t,
}: {
  handshakeStatus: HpkeHandshakeStatus
  flow: ReturnType<typeof useRecoveryFlow>
  oauthError: string | undefined
  isPasskeyLoading: boolean
  onContinueWithPasskey: () => void
  t: ReturnType<typeof useTranslation>['t']
}): JSX.Element {
  if (handshakeStatus === HpkeHandshakeStatus.Denied) {
    return <DeniedView t={t} />
  }

  // Render the login view immediately even while the HPKE handshake is in flight; the
  // passkey ceremony doesn't need the encryption key.
  // The Get-help button replaces each step's close X (Chrome's window chrome handles close).
  const helpAction = <GetHelpButton t={t} />
  return (
    <Trace logImpression page={InterfacePageName.ExtensionPasskeySignInPage}>
      <Flex flexDirection="column" alignItems="center" minHeight="100vh" width="100%">
        <Flex width={420} padding="$spacing16" gap="$spacing16">
          <Flex gap="$gap24" alignItems="center" width="100%">
            {flow.step === RecoveryStep.Login && (
              <RecoveryLoginStep
                t={t}
                headerActions={helpAction}
                isPasskeyLoading={isPasskeyLoading}
                oauthLoadingProvider={flow.oauthProvider}
                isReady={flow.isReady}
                handleClose={() => window.close()}
                onContinueWithPasskey={onContinueWithPasskey}
                onSelectEmail={flow.selectEmailLogin}
                onSelectApple={() => flow.initOAuth('apple')}
                onSelectGoogle={() => flow.initOAuth('google')}
              />
            )}
            {flow.step === RecoveryStep.OAuthLoading && (
              <OAuthLoadingStep oauthError={oauthError} headerActions={helpAction} handleClose={() => window.close()} />
            )}
            {flow.step === RecoveryStep.EmailEntry && (
              <EmailEntryStep
                t={t}
                email={flow.email}
                isValidEmail={flow.isValidEmail}
                isLoading={flow.isLoading}
                isReady={flow.isReady}
                errorMessage={flow.errorMessage}
                sendCodeMutation={flow.sendCodeMutation}
                headerActions={helpAction}
                setEmail={flow.setEmail}
                handleBack={() => window.close()}
                handleClose={() => window.close()}
              />
            )}
            {flow.step === RecoveryStep.EmailCode && (
              <EmailCodeStep
                t={t}
                email={flow.email}
                otpInput={flow.otpInput}
                submitCodeMutation={flow.submitCodeMutation}
                resendCodeMutation={flow.resendCodeMutation}
                errorMessage={flow.errorMessage}
                isReady={flow.isReady}
                headerActions={helpAction}
                handleBack={flow.handleBack}
                handleClose={() => window.close()}
              />
            )}
            {flow.step === RecoveryStep.EnterPin && (
              <EnterPinStep
                t={t}
                recoveryWalletAddress={flow.recoveryWalletAddress}
                passcodeInput={flow.passcodeInput}
                showPasscode={flow.showPasscode}
                pinError={flow.pinError}
                cooldown={flow.cooldown}
                isDecrypting={flow.isDecrypting}
                headerActions={helpAction}
                setShowPasscode={flow.setShowPasscode}
                handleBack={flow.handleBack}
                handleClose={() => window.close()}
              />
            )}
            {flow.step === RecoveryStep.Recovering && <RecoveringStep t={t} />}
            {flow.step === RecoveryStep.NoWalletFound && <NoWalletFoundStep t={t} handleClose={() => window.close()} />}
          </Flex>
        </Flex>
      </Flex>
    </Trace>
  )
}

export function ExportStep({
  walletAddress,
  isAuthenticating,
  onPressImport,
}: {
  walletAddress: string
  isAuthenticating: boolean
  onPressImport: () => void
}): JSX.Element {
  const { t } = useTranslation()
  const display = useOnchainDisplayName(walletAddress)
  const displayName = display?.name ?? walletAddress

  return (
    <>
      <Flex alignItems="center">
        <AccountIcon address={walletAddress} size={40} />
      </Flex>

      <Flex alignItems="center">
        <Text variant="subheading1">{t('extensionPasskeyLogInPopUp.importTitle')}</Text>
      </Flex>

      <Flex alignItems="center" px="$spacing40">
        <Text variant="body3" textAlign="center">
          <Trans
            i18nKey="extensionPasskeyLogInPopUp.importDescription"
            values={{ displayName }}
            components={{ accent: <Text variant="body3" color="$accent1" tag="span" /> }}
          />
        </Text>
      </Flex>

      <Flex row py="$spacing16">
        <Button
          icon={isAuthenticating ? <SpinningLoader /> : <Passkey color="$neutral1" />}
          size="large"
          variant="branded"
          onPress={onPressImport}
          disabled={isAuthenticating}
        >
          {isAuthenticating ? undefined : t('extensionPasskeyLogInPopUp.importButton')}
        </Button>
      </Flex>
    </>
  )
}
