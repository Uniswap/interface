import { useLoginWithOAuth, usePrivy } from '@privy-io/react-auth'
import { atom, useAtom } from 'jotai'
import { useAtomValue } from 'jotai/utils'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Flex, Separator, SpinningLoader, Text, TouchableArea } from 'ui/src'
import { BackArrow } from 'ui/src/components/icons/BackArrow'
import { Envelope } from 'ui/src/components/icons/Envelope'
import { EnvelopeHeart } from 'ui/src/components/icons/EnvelopeHeart'
import { GoogleLogoGradient } from 'ui/src/components/icons/GoogleLogoGradient'
import { Passkey } from 'ui/src/components/icons/Passkey'
import { Person } from 'ui/src/components/icons/Person'
import { useSporeColors } from 'ui/src/hooks/useSporeColors'
import { iconSizes } from 'ui/src/theme'
import { ElementName, ModalName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { logger } from 'utilities/src/logger/logger'
import { useEvent } from 'utilities/src/react/hooks'
import { useAccountDrawer } from '~/components/AccountDrawer/MiniPortfolio/hooks'
import { AppleLogo } from '~/components/Icons/AppleLogo'
import { OptionRow } from '~/components/Passkey/BackupLoginComponents'
import { RECOVER_OAUTH_PENDING_KEY } from '~/components/Passkey/useOAuthRedirectRouter'
import { WalletModalLayout } from '~/components/WalletModal/WalletModalLayout'
import { WalletOptionsGrid } from '~/components/WalletModal/WalletOptionsGrid'
import { useModalState } from '~/hooks/useModalState'
import { useSignInWithPasskey } from '~/hooks/useSignInWithPasskey'

// TODO: [INFRA-1559] Replace Jotai atoms with Zustand store
/** Shared atom so RecentlyConnectedModal can trigger the login view in the account drawer */
export const showEmbeddedLoginViewAtom = atom(false)
/** Shared atom so the login view shows a loading state when passkey sign-in is triggered externally */
export const passkeySignInPendingAtom = atom(false)

export function EmbeddedWalletConnectionsModal(): JSX.Element {
  const { t } = useTranslation()
  const colors = useSporeColors()
  const accountDrawer = useAccountDrawer()
  const { openModal: openGetTheApp } = useModalState(ModalName.GetTheApp)
  const { openModal: openRecoverWallet } = useModalState(ModalName.RecoverWallet)
  const [showLoginView, setShowLoginView] = useAtom(showEmbeddedLoginViewAtom)

  const handleCreateAccount = useEvent(() => {
    accountDrawer.close()
    openGetTheApp()
  })

  const { signInWithPasskeyAsync, isPending: isPasskeyPending } = useSignInWithPasskey()
  const isExternalPasskeyPending = useAtomValue(passkeySignInPendingAtom)
  const isPasskeyLoading = isPasskeyPending || isExternalPasskeyPending

  const handlePasskeyLogin = useEvent(() => signInWithPasskeyAsync())

  const handleLogIn = useEvent(() => {
    setShowLoginView(true)
    signInWithPasskeyAsync()
  })

  const handleBackToConnect = useEvent(() => setShowLoginView(false))

  const { ready: privyReady, user, logout } = usePrivy()
  const [oauthProvider, setOauthProvider] = useState<'google' | 'apple' | null>(null)

  const { initOAuth, loading: oauthLoading } = useLoginWithOAuth({
    onError: (oauthError) => {
      logger.error(oauthError, { tags: { file: 'EmbeddedWalletModal', function: 'handleInitOAuth' } })
      sessionStorage.removeItem(RECOVER_OAUTH_PENDING_KEY)
      setOauthProvider(null)
    },
  })

  const handleInitOAuth = useEvent(async (provider: 'google' | 'apple'): Promise<void> => {
    if (!privyReady) {
      return
    }
    // Privy's `initOAuth` throws "Already logged in" if an authenticated session
    // exists. Drop the existing session so this sign-in starts from a clean state.
    if (user) {
      await logout()
    }
    setOauthProvider(provider)
    sessionStorage.setItem(RECOVER_OAUTH_PENDING_KEY, provider)
    // Note: initOAuth triggers a full page redirect. There is no onSuccess callback.
    // Cleanup of RECOVER_OAUTH_PENDING_KEY happens post-redirect in useOAuthRedirectRouter
    // and useOAuthResult once the linked account is detected.
    await initOAuth({ provider })
  })

  const handleEmailRecovery = useEvent(() => {
    openRecoverWallet()
  })

  if (showLoginView) {
    return (
      <Trace logImpression modal={ModalName.SignIn}>
        <Flex backgroundColor="$surface1" p="$padding16" flex={1} gap="$gap16">
          {/* Nav: back arrow + Help */}
          <Flex row justifyContent="space-between" alignItems="center" width="100%">
            <TouchableArea variant="unstyled" onPress={handleBackToConnect}>
              <BackArrow size="$icon.20" color="$neutral1" />
            </TouchableArea>
            <TouchableArea variant="unstyled" onPress={() => window.open('https://support.uniswap.org', '_blank')}>
              <Flex
                row
                gap="$gap4"
                alignItems="center"
                borderWidth={1}
                borderColor="$surface3"
                borderRadius="$rounded12"
                px="$spacing8"
                py="$spacing6"
              >
                <EnvelopeHeart size="$icon.16" color="$neutral2" />
                <Text variant="buttonLabel4" color="$neutral2">
                  {t('common.help')}
                </Text>
              </Flex>
            </TouchableArea>
          </Flex>

          {/* Header: icon + title */}
          <Flex gap="$gap16" alignItems="center" py="$padding16">
            <Flex
              p="$spacing12"
              backgroundColor="$accent2"
              borderRadius="$rounded16"
              width={48}
              height={48}
              alignItems="center"
              justifyContent="center"
            >
              <Person size="$icon.24" color="$accent1" />
            </Flex>
            <Text variant="subheading1">{t('nav.logIn.button')}</Text>
          </Flex>

          {/* Methods */}
          <Flex gap="$gap12">
            {/* Continue with passkey */}
            <Trace logPress element={ElementName.LoginWithPasskey}>
              <Flex row alignSelf="stretch">
                <Button variant="branded" size="medium" onPress={handlePasskeyLogin} isDisabled={isPasskeyLoading}>
                  {isPasskeyLoading ? (
                    <SpinningLoader size={20} color="$neutral2" />
                  ) : (
                    t('account.passkey.login.continueWithPasskey')
                  )}
                </Button>
              </Flex>
            </Trace>

            {/* "or" divider */}
            <Flex row alignItems="center" justifyContent="center" width="100%" gap="$gap16" px="$spacing12">
              <Separator />
              <Text variant="body4" color="$neutral3">
                {t('common.or')}
              </Text>
              <Separator />
            </Flex>

            {/* Recovery options */}
            <Flex borderRadius="$rounded16" overflow="hidden" gap="$spacing2">
              <OptionRow
                icon={<AppleLogo height={20} width={20} fill={colors.neutral1.val} />}
                label={t('account.passkey.backupLogin.add.apple')}
                onPress={() => handleInitOAuth('apple')}
                element={ElementName.LoginWithApple}
                loading={oauthLoading && oauthProvider === 'apple'}
                disabled={oauthLoading && oauthProvider !== 'apple'}
              />
              <OptionRow
                icon={<GoogleLogoGradient size={iconSizes.icon20} />}
                label={t('account.passkey.backupLogin.add.google')}
                onPress={() => handleInitOAuth('google')}
                element={ElementName.LoginWithGoogle}
                loading={oauthLoading && oauthProvider === 'google'}
                disabled={oauthLoading && oauthProvider !== 'google'}
              />
              <OptionRow
                icon={<Envelope size="$icon.20" color="$blueBase" />}
                label={t('account.passkey.backupLogin.add.email')}
                onPress={handleEmailRecovery}
                element={ElementName.LoginWithEmail}
                disabled={oauthLoading && oauthProvider !== null}
              />
            </Flex>
          </Flex>
        </Flex>
      </Trace>
    )
  }

  return (
    <Trace logImpression modal={ModalName.SignUp}>
      <WalletModalLayout
        header={
          <Flex gap="$gap16">
            <Flex row justifyContent="center" width="100%">
              <Text variant="subheading2">{t('common.connectAWallet.button')}</Text>
            </Flex>
          </Flex>
        }
      >
        <WalletOptionsGrid showMobileConnector={true} showOtherWallets={true} />
        <Flex row alignItems="center" justifyContent="center" width="100%" gap="$gap16" py="$spacing4" px="$spacing12">
          <Separator />
          <Text variant="body4" color="$neutral3">
            {t('common.or')}
          </Text>
          <Separator />
        </Flex>
        <Flex gap="$gap12">
          <Trace logPress element={ElementName.CreateAccount}>
            <Flex row alignSelf="stretch">
              <Button variant="branded" size="medium" testID={TestID.CreateAccount} onPress={handleCreateAccount}>
                {t('nav.createAccount.button')}
              </Button>
            </Flex>
          </Trace>
          <Trace logPress element={ElementName.SignIn}>
            <TouchableArea
              group
              animation={null}
              alignSelf="center"
              variant="unstyled"
              hoverable={false}
              testID={TestID.LogIn}
              onPress={handleLogIn}
            >
              <Flex row gap="$gap4" alignItems="center">
                <Passkey size="$icon.20" color="$accent1" $group-hover={{ color: '$accent1Hovered' }} />
                <Text variant="buttonLabel2" color="$accent1" $group-hover={{ color: '$accent1Hovered' }}>
                  {t('nav.logIn.button')}
                </Text>
              </Flex>
            </TouchableArea>
          </Trace>
        </Flex>
      </WalletModalLayout>
    </Trace>
  )
}
