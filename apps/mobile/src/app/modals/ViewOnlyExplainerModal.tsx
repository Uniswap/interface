import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { navigate } from 'src/app/navigation/rootNavigation'
import { closeModal, openModal } from 'src/features/modals/modalSlice'
import { Button, Flex, Text, useIsDarkMode } from 'ui/src'
import ViewOnlyWalletDark from 'ui/src/assets/graphics/view-only-wallet-dark.svg'
import ViewOnlyWalletLight from 'ui/src/assets/graphics/view-only-wallet-light.svg'
import { BottomSheetModal } from 'uniswap/src/components/modals/BottomSheetModal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { ImportType, OnboardingEntryPoint } from 'uniswap/src/types/onboarding'
import { MobileScreens, OnboardingScreens } from 'uniswap/src/types/screens/mobile'
import { useActiveAccountAddress, useNativeAccountExists } from 'wallet/src/features/wallet/hooks'

const WALLET_IMAGE_ASPECT_RATIO = 327 / 215

export function ViewOnlyExplainerModal(): JSX.Element {
  const { t } = useTranslation()
  const activeAccountAddress = useActiveAccountAddress()
  const dispatch = useDispatch()
  const hasImportedSeedPhrase = useNativeAccountExists()
  const isDarkMode = useIsDarkMode()

  const onClose = (): void => {
    dispatch(closeModal({ name: ModalName.ViewOnlyExplainer }))
  }

  const onPressImportWallet = (): void => {
    if (hasImportedSeedPhrase && activeAccountAddress) {
      dispatch(openModal({ name: ModalName.RemoveWallet }))
    } else {
      navigate(MobileScreens.OnboardingStack, {
        screen: OnboardingScreens.SeedPhraseInput,
        params: { importType: ImportType.SeedPhrase, entryPoint: OnboardingEntryPoint.Sidebar },
      })
    }
    onClose()
  }

  const WalletImage = isDarkMode ? ViewOnlyWalletDark : ViewOnlyWalletLight

  return (
    <BottomSheetModal name={ModalName.ViewOnlyExplainer} onClose={onClose}>
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
          <Button alignSelf="center" borderRadius="$rounded20" px={40} theme="primary" onPress={onPressImportWallet}>
            {t('account.wallet.viewOnly.button')}
          </Button>
          <Button
            alignSelf="center"
            backgroundColor={undefined}
            borderRadius="$rounded20"
            color="$neutral2"
            px={40}
            theme="secondary"
            onPress={onClose}
          >
            {t('common.button.later')}
          </Button>
        </Flex>
      </Flex>
    </BottomSheetModal>
  )
}
