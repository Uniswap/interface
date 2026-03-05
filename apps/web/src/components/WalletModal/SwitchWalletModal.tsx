import { TFunction } from 'i18next'
import { useTranslation } from 'react-i18next'
import { Flex, Text, TouchableArea } from 'ui/src'
import { ArrowLeft } from 'ui/src/components/icons/ArrowLeft'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { UniswapWalletOptions } from '~/components/WalletModal/UniswapWalletOptions'
import { WalletModalLayout } from '~/components/WalletModal/WalletModalLayout'
import { WalletOptionsGrid } from '~/components/WalletModal/WalletOptionsGrid'

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
  const header = (
    <Flex row justifyContent="flex-start" alignItems="center" width="100%" gap="$gap8">
      <TouchableArea data-testid="wallet-back" onPress={onClose}>
        <ArrowLeft size="$icon.24" />
      </TouchableArea>
      <Text variant="subheading1">{getTitle(t, connectOnPlatform)}</Text>
    </Flex>
  )

  const uniswapOptions = <UniswapWalletOptions />

  const walletOptions = (
    <WalletOptionsGrid
      connectOnPlatform={connectOnPlatform}
      showMobileConnector={false}
      showOtherWallets={false}
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
    >
      {walletOptions}
    </WalletModalLayout>
  )
}
