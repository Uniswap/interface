import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { WalletModalLayout } from '~/components/WalletModal/WalletModalLayout'
import { WalletOptionsGrid } from '~/components/WalletModal/WalletOptionsGrid'

// HookSwap: removed the Uniswap-branded wallet section (<UniswapWalletOptions/>) and the
// collapsible "Other wallets" toggle that separated it from the standard connectors.
// HookSwap ships no wallet, so the modal now shows only the standard third-party connector
// list (injected/MetaMask, WalletConnect, Coinbase, and other detected browser wallets).
export function StandardWalletModal(): JSX.Element {
  const { t } = useTranslation()

  const header = (
    <Flex row justifyContent="space-between" width="100%">
      <Text variant="subheading2">{t('common.connectAWallet.button')}</Text>
    </Flex>
  )

  const walletOptions = <WalletOptionsGrid showMobileConnector={false} showOtherWallets={false} />

  return <WalletModalLayout header={header}>{walletOptions}</WalletModalLayout>
}
