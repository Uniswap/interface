import { clickableStyle, Flex, Text, Separator } from '@universe/mycelium'
import { ChevronsIn } from '@universe/mycelium/icons/ChevronsIn'
import { ChevronsOut } from '@universe/mycelium/icons/ChevronsOut'
import { useReducer } from 'react'
import { useTranslation } from 'react-i18next'
import { UniswapWalletOptions } from '~/features/wallet/components/WalletModal/UniswapWalletOptions'
import { WalletModalLayout } from '~/features/wallet/components/WalletModal/WalletModalLayout'
import { WalletOptionsGrid } from '~/features/wallet/components/WalletModal/WalletOptionsGrid'

export function StandardWalletModal(): JSX.Element {
  const { t } = useTranslation()
  const [expandMoreWallets, toggleExpandMoreWallets] = useReducer((s) => !s, true)

  const header = (
    <Flex row justifyContent="space-between" width="100%">
      <Text variant="subheading2">{t('common.connectAWallet.button')}</Text>
    </Flex>
  )

  const uniswapOptions = <UniswapWalletOptions />

  const expandToggle = (
    <Flex row alignItems="center" py={8} userSelect="none" {...clickableStyle} onPress={toggleExpandMoreWallets}>
      <Separator />
      <Flex row alignItems="center" mx={18}>
        <Text variant="body3" color="$neutral2" whiteSpace="nowrap">
          {t('wallet.other')}
        </Text>
        {expandMoreWallets ? <ChevronsIn size={20} color="$neutral3" /> : <ChevronsOut size={20} color="$neutral3" />}
      </Flex>
      <Separator />
    </Flex>
  )

  const walletOptions = (
    <WalletOptionsGrid
      showMobileConnector={false}
      showOtherWallets={false}
      maxHeight={expandMoreWallets ? '100vh' : '0'}
      opacity={expandMoreWallets ? 1 : 0}
    />
  )

  return (
    <WalletModalLayout
      header={
        <Flex gap="$gap16">
          {header}
          {uniswapOptions}
          {expandToggle}
        </Flex>
      }
    >
      {walletOptions}
    </WalletModalLayout>
  )
}
