import walletAppPromoBannerQR from 'assets/images/walletAnnouncementBannerQR.png'
import { ReactComponent as AppStoreBadge } from 'assets/svg/app-store-badge.svg'
import { ReactComponent as PlayStoreBadge } from 'assets/svg/play-store-badge.svg'
import { ModalContent } from 'components/NavBar/DownloadApp/Modal/Content'
import Row from 'components/Row'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'
import { ExternalLink } from 'theme/components'

const StyledQRCode = styled.img`
  width: 150px;
  height: 150px;
  border: 1px solid ${({ theme }) => theme.surface3};
  border-radius: 12px;
`
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
        <StyledQRCode src={walletAppPromoBannerQR} alt="App OneLink QR code" />
      </BadgeLink>
      <Row justify="center" gap="16px">
        <BadgeLink href="https://apps.apple.com/us/app/uniswap-crypto-nft-wallet/id6443944476">
          <AppStoreBadge />
        </BadgeLink>
        <BadgeLink href="https://play.google.com/store/apps/details?id=com.uniswap.mobile&pcampaignid=web_share">
          <PlayStoreBadge />
        </BadgeLink>
      </Row>
    </ModalContent>
  )
}
