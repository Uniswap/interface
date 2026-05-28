import { useTranslation } from 'react-i18next'
import { navigate } from 'src/app/navigation/rootNavigation'
import { useReactNavigationModal } from 'src/components/modals/useReactNavigationModal'
import { Button, Flex, Text, useIsDarkMode } from 'ui/src'
import ViewOnlyWalletDark from 'ui/src/assets/graphics/view-only-wallet-dark.svg'
import ViewOnlyWalletLight from 'ui/src/assets/graphics/view-only-wallet-light.svg'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { ImportType, OnboardingEntryPoint } from 'uniswap/src/types/onboarding'
import { MobileScreens, OnboardingScreens } from 'uniswap/src/types/screens/mobile'
import { useActiveAccountAddress, useNativeAccountExists } from 'wallet/src/features/wallet/hooks'

const WALLET_IMAGE_ASPECT_RATIO = 327 / 215

export function ViewOnlyExplainerModal(): JSX.Element {
  const { t } = useTranslation()
  const activeAccountAddress = useActiveAccountAddress()
  const hasImportedSeedPhrase = useNativeAccountExists()
  const isDarkMode = useIsDarkMode()

  const { onClose } = useReactNavigationModal()

  const onPressImportWallet = (): void => {
    onClose()
    if (hasImportedSeedPhrase && activeAccountAddress) {
      navigate(ModalName.RemoveWallet, {
        replaceMnemonic: true,
      })
    } else {
      navigate(MobileScreens.OnboardingStack, {
        screen: OnboardingScreens.SeedPhraseInput,
        params: { importType: ImportType.SeedPhrase, entryPoint: OnboardingEntryPoint.Sidebar },
      })
    }
  }

  const WalletImage = isDarkMode ? ViewOnlyWalletDark : ViewOnlyWalletLight

  return (
    <Modal name={ModalName.ViewOnlyExplainer} onClose={onClose}>
      <Flex gap="$spacing12" pb="$spacing24" pt="$spacing12" px="$spacing24">
        <Flex gap="$spacing16" pb="$spacing16">
          <Flex style={{ aspectRatio: WALLET_IMAGE_ASPECT_RATIO }}>
            <WalletImage height="100%" preserveAspectRatio="xMidYMid slice" width="100%" />
          </Flex>
          <Flex alignItems="center" gap="$spacing4">
            <Text variant="subheading1">{t('account.wallet.viewOnly.title')}</Text>
            <Text color="$neutral2" textAlign="center" variant="body2">
              {t('account.wallet.viewOnly.description')}
            </Text>
          </Flex>
        </Flex>
        <Flex gap="$spacing8">
          <Flex row>
            <Button size="large" variant="branded" emphasis="primary" alignSelf="center" onPress={onPressImportWallet}>
              {t('account.wallet.viewOnly.button')}
            </Button>
          </Flex>
          <Flex row>
            <Button size="large" emphasis="secondary" alignSelf="center" onPress={onClose}>
              {t('common.button.later')}
            </Button>
          </Flex>
        </Flex>
      </Flex>
    </Modal>
  )
}
