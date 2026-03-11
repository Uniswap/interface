import { useTranslation } from 'react-i18next'
import { Button, Flex, Separator, Text } from 'ui/src'
import { Passkey } from 'ui/src/components/icons/Passkey'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { useEvent } from 'utilities/src/react/hooks'
import { useAccountDrawer } from '~/components/AccountDrawer/MiniPortfolio/hooks'
import { WalletModalLayout } from '~/components/WalletModal/WalletModalLayout'
import { WalletOptionsGrid } from '~/components/WalletModal/WalletOptionsGrid'
import { useModalState } from '~/hooks/useModalState'
import { useSignInWithPasskey } from '~/hooks/useSignInWithPasskey'

export function EmbeddedWalletConnectionsModal(): JSX.Element {
  const { t } = useTranslation()
  const accountDrawer = useAccountDrawer()
  const { openModal: openGetTheApp } = useModalState(ModalName.GetTheApp)

  const handleCreateAccount = useEvent(() => {
    accountDrawer.close()
    openGetTheApp()
  })

  const { signInWithPasskeyAsync } = useSignInWithPasskey()
  const handleLogIn = useEvent(() => signInWithPasskeyAsync())

  return (
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
      <Flex row alignItems="center" justifyContent="center" width="100%" gap="$gap16" py="$spacing4">
        <Separator />
        <Text variant="body4" color="$neutral3">
          {t('common.or')}
        </Text>
        <Separator />
      </Flex>
      <Flex gap="$gap12">
        <Flex row alignSelf="stretch">
          <Button variant="branded" size="medium" testID={TestID.CreateAccount} onPress={handleCreateAccount}>
            {t('nav.createAccount.button')}
          </Button>
        </Flex>
        <Flex row alignSelf="stretch">
          <Button variant="branded" emphasis="secondary" size="medium" onPress={handleLogIn}>
            <Flex row gap="$gap4">
              <Passkey size="$icon.20" color="$accent1" />
              <Text variant="buttonLabel2" color="$accent1">
                {t('nav.logIn.button')}
              </Text>
            </Flex>
          </Button>
        </Flex>
      </Flex>
    </WalletModalLayout>
  )
}
