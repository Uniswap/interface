import { Platform } from '@universe/chains'
import { isMobileWeb } from '@universe/environment'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { Flex, Text, TouchableArea } from '@universe/mycelium'
import { ArrowLeft } from '@universe/mycelium/icons/ArrowLeft'
import { TFunction } from 'i18next'
import { useTranslation } from 'react-i18next'
import { useEvent } from 'utilities/src/react/hooks'
import { useOrderedWallets } from '~/connection/hooks/useOrderedWalletConnectors'
import { UniswapWalletOptions } from '~/features/wallet/components/WalletModal/UniswapWalletOptions'
import { WalletModalLayout } from '~/features/wallet/components/WalletModal/WalletModalLayout'
import { WalletOptionsGrid } from '~/features/wallet/components/WalletModal/WalletOptionsGrid'
import { MenuStateVariant, useSetMenu } from '~/state/accountDrawer/menuState'

function getTitle(t: TFunction, connectOnPlatform: Platform | 'any'): string {
  if (connectOnPlatform === Platform.EVM) {
    return t('common.connectAWallet.button.evm')
  }

  if (connectOnPlatform === Platform.SVM) {
    return t('common.connectAWallet.button.svm')
  }

  return t('common.connectAWallet.button.switch')
}

export function SwitchWalletModal({
  connectOnPlatform,
  onClose,
}: {
  connectOnPlatform: Platform | 'any'
  onClose: () => void
}): JSX.Element {
  const { t } = useTranslation()
  const wallets = useOrderedWallets({ showSecondaryConnectors: isMobileWeb, platformFilter: connectOnPlatform })
  const isEmbeddedWalletEnabled = useFeatureFlag(FeatureFlags.EmbeddedWallet)
  const setMenu = useSetMenu()
  const openOtherWallets = useEvent(() =>
    setMenu({ variant: MenuStateVariant.OTHER_WALLETS, returnTo: MenuStateVariant.SWITCH }),
  )

  const header = (
    <Flex row justifyContent="flex-start" alignItems="center" width="100%" gap="$gap8">
      <TouchableArea testID="wallet-back" onPress={onClose}>
        <ArrowLeft size="$icon.24" color="$neutral1" />
      </TouchableArea>
      <Text variant="subheading1">{getTitle(t, connectOnPlatform)}</Text>
    </Flex>
  )

  const uniswapOptions = <UniswapWalletOptions />

  const walletOptions = (
    <WalletOptionsGrid
      connectOnPlatform={connectOnPlatform}
      showMobileConnector={false}
      showOtherWallets={isEmbeddedWalletEnabled && connectOnPlatform === 'any'}
      onShowOtherWallets={openOtherWallets}
      maxHeight="100vh"
      opacity={1}
    />
  )

  return (
    <WalletModalLayout
      header={
        <Flex gap="$gap16">
          {header}
          {connectOnPlatform !== Platform.SVM ? uniswapOptions : null}
        </Flex>
      }
      hidePolicyNotice={connectOnPlatform === Platform.SVM && wallets.length === 0}
    >
      {walletOptions}
    </WalletModalLayout>
  )
}
