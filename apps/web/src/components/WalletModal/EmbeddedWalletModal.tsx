import { DownloadHeader } from 'components/WalletModal/DownloadHeader'
import { WalletModalLayout } from 'components/WalletModal/WalletModalLayout'
import { WalletOptionsGrid } from 'components/WalletModal/WalletOptionsGrid'
import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { UniswapLogo } from 'ui/src/components/icons/UniswapLogo'

export function EmbeddedWalletModal(): JSX.Element {
  const { t } = useTranslation()

  const header = (
    <Flex row justifyContent="center" width="100%">
      <Text variant="subheading2">{t('nav.logInOrConnect.title')}</Text>
    </Flex>
  )

  const logo = (
    <Flex justifyContent="center" alignItems="center" py={8}>
      <UniswapLogo size={48} color="$accent1" />
    </Flex>
  )

  const walletOptions = <WalletOptionsGrid showMobileConnector={true} showOtherWallets={true} />

  return (
    <WalletModalLayout
      header={
        <Flex gap="$gap16">
          {header}
          {logo}
        </Flex>
      }
      downloadHeader={<DownloadHeader />}
    >
      {walletOptions}
    </WalletModalLayout>
  )
}
