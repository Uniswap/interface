import { ReactComponent as AppStoreBadge } from 'assets/svg/app-store-badge.svg'
import { ReactComponent as PlayStoreBadge } from 'assets/svg/play-store-badge.svg'
import { ModalContent } from 'components/NavBar/DownloadApp/Modal/Content'
import { WalletOneLinkQR } from 'components/WalletOneLinkQR'
import styled from 'lib/styled-components'
import { useTranslation } from 'react-i18next'
import { ExternalLink } from 'theme/components'
import { Flex } from 'ui/src'

const BadgeLink = styled(ExternalLink)`
  stroke: none;
  :hover {
    opacity: 1;
  }
`
export function GetTheApp() {
  const { t } = useTranslation()
  return (
    <ModalContent title={t('common.downloadUniswapApp')} subtext={t('common.scanQRDownload')}>
      <BadgeLink href="https://uniswapwallet.onelink.me/8q3y/m4i9qsez?af_qr=true">
        <WalletOneLinkQR width={200} height={200} />
      </BadgeLink>
      <Flex row justifyContent="center" gap="$spacing16">
        <BadgeLink href="https://apps.apple.com/us/app/uniswap-crypto-nft-wallet/id6443944476">
          <AppStoreBadge />
        </BadgeLink>
        <BadgeLink href="https://play.google.com/store/apps/details?id=com.uniswap.mobile&pcampaignid=web_share">
          <PlayStoreBadge />
        </BadgeLink>
      </Flex>
    </ModalContent>
  )
}
