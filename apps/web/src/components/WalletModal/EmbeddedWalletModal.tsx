import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { Button, Flex, Separator, SpinningLoader, Text, TouchableArea } from 'ui/src'
import { AppleLogo } from 'ui/src/components/icons/AppleLogo'
import { BackArrow } from 'ui/src/components/icons/BackArrow'
import { Envelope } from 'ui/src/components/icons/Envelope'
import { EnvelopeHeart } from 'ui/src/components/icons/EnvelopeHeart'
import { GoogleLogoGradient } from 'ui/src/components/icons/GoogleLogoGradient'
import { Passkey } from 'ui/src/components/icons/Passkey'
import { Person } from 'ui/src/components/icons/Person'
import { iconSizes } from 'ui/src/theme'
import { UniswapHelpUrls } from 'uniswap/src/constants/urls'
import { ElementName, ModalName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { logger } from 'utilities/src/logger/logger'
import { useEvent } from 'utilities/src/react/hooks'
import { useAccountDrawer } from '~/components/AccountDrawer/MiniPortfolio/hooks'
import { OptionRow } from '~/components/Passkey/BackupLoginComponents'
import { RECOVER_OAUTH_PENDING_KEY } from '~/components/Passkey/useOAuthRedirectRouter'
import { WalletModalLayout } from '~/components/WalletModal/WalletModalLayout'
import { WalletOptionsGrid } from '~/components/WalletModal/WalletOptionsGrid'
import { useMaybeLoginWithOAuth, useMaybePrivy } from '~/hooks/useMaybePrivy'
import { useModalState } from '~/hooks/useModalState'
import { useSignInWithPasskey } from '~/hooks/useSignInWithPasskey'
import { setOpenModal } from '~/state/application/reducer'
import { useEmbeddedWalletLoginViewStore } from '~/state/embeddedWallet/loginViewStore'

export function EmbeddedWalletConnectionsModal(): JSX.Element {
  const { t } = useTranslation()
  const accountDrawer = useAccountDrawer()
  const dispatch = useDispatch()
  const { openModal: openGetTheApp } = useModalState(ModalName.GetTheApp)
  const showLoginView = useEmbeddedWalletLoginViewStore((s) => s.showLoginView)
  const setShowLoginView = useEmbeddedWalletLoginViewStore((s) => s.setShowLoginView)

  const handleCreateAccount = useEvent(() => {
    accountDrawer.close()
    openGetTheApp()
  })

  const { signInWithPasskeyAsync, isPending: isPasskeyPending } = useSignInWithPasskey()
  const isExternalPasskeyPending = useEmbeddedWalletLoginViewStore((s) => s.passkeySignInPending)
  const isPasskeyLoading = isPasskeyPending || isExternalPasskeyPending

  const handlePasskeyLogin = useEvent(() => signInWithPasskeyAsync())

  const handleLogIn = useEvent(() => {
    setShowLoginView(true)
    signInWithPasskeyAsync()
  })

  const handleBackToConnect = useEvent(() => setShowLoginView(false))

  const { ready: privyReady, user, logout } = useMaybePrivy()
  const [oauthProvider, setOauthProvider] = useState<'google' | 'apple' | null>(null)

  const { initOAuth, loading: oauthLoading } = useMaybeLoginWithOAuth({
    onError: (oauthError) => {
      logger.error(oauthError, {
        tags: { file: 'EmbeddedWalletModal', function: 'handleInitOAuth' },
      })
      sessionStorage.removeItem(RECOVER_OAUTH_PENDING_KEY)
      setOauthProvider(null)
    },
  })

  const disableOauth = isPasskeyLoading || oauthLoading

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
    dispatch(
      setOpenModal({
        name: ModalName.RecoverWallet,
        initialState: { initialMethod: 'email' },
      }),
    )
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
            <TouchableArea
              variant="unstyled"
              onPress={() => window.open(UniswapHelpUrls.articles.passkeysInfo, '_blank')}
            >
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
                <Button variant="branded" size="medium" onPress={handlePasskeyLogin} disabled={isPasskeyLoading}>
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
                icon={<AppleLogo color="$neutral1" size="$icon.20" />}
                label={t('account.passkey.backupLogin.add.apple')}
                onPress={() => handleInitOAuth('apple')}
                element={ElementName.LoginWithApple}
                loading={oauthLoading && oauthProvider === 'apple'}
                disabled={disableOauth && oauthProvider !== 'apple'}
              />
              <OptionRow
                icon={<GoogleLogoGradient size={iconSizes.icon20} />}
                label={t('account.passkey.backupLogin.add.google')}
                onPress={() => handleInitOAuth('google')}
                element={ElementName.LoginWithGoogle}
                loading={oauthLoading && oauthProvider === 'google'}
                disabled={disableOauth && oauthProvider !== 'google'}
              />
              <OptionRow
                icon={<Envelope size="$icon.20" color="$blueBase" />}
                label={t('account.passkey.backupLogin.add.email')}
                onPress={handleEmailRecovery}
                element={ElementName.LoginWithEmail}
                disabled={disableOauth}
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
