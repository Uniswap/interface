import { t, Trans } from '@lingui/macro'
import { InterfaceElementName } from '@uniswap/analytics-events'
import { useScreenSize } from 'hooks/useScreenSize'
import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { useHideAppPromoBanner } from 'state/user/hooks'
import { ThemedText } from 'theme/components'
import { useIsDarkMode } from 'theme/components/ThemeToggle'
import { openDownloadApp } from 'utils/openDownloadApp'
import { isAndroid, isIOS, isMobileSafari } from 'wallet/src/utils/platform'

import darkAndroidThumbnail from '../../../assets/images/app-promo-banner/AndroidWallet-Thumbnail-Dark.png'
import lightAndroidThumbnail from '../../../assets/images/app-promo-banner/AndroidWallet-Thumbnail-Light.png'
import darkDesktopThumbnail from '../../../assets/images/app-promo-banner/DesktopWallet-Thumbnail-Dark.png'
import lightDesktopThumbnail from '../../../assets/images/app-promo-banner/DesktopWallet-Thumbnail-Light.png'
import darkIOSThumbnail from '../../../assets/images/app-promo-banner/iOSWallet-Thumbnail-Dark.png'
import lightIOSThumbnail from '../../../assets/images/app-promo-banner/iOSWallet-Thumbnail-Light.png'
import walletAppPromoBannerQR from '../../../assets/images/app-promo-banner/walletAnnouncementBannerQR.png'
import {
  Container,
  DownloadButton,
  PopupContainer,
  StyledQrCode,
  StyledXButton,
  TextContainer,
  Thumbnail,
} from './styled'

export default function WalletAppPromoBanner() {
  const [hideAppPromoBanner, toggleHideAppPromoBanner] = useHideAppPromoBanner()
  const location = useLocation()
  const isLandingScreen = location.search === '?intro=true' || location.pathname === '/'
  const screenSize = useScreenSize()

  const shouldDisplay = Boolean(!hideAppPromoBanner && !isLandingScreen && !isMobileSafari)

  const isDarkMode = useIsDarkMode()
  const thumbnailSrc = useMemo(() => {
    if (isAndroid) {
      return isDarkMode ? darkAndroidThumbnail : lightAndroidThumbnail
    } else if (isIOS) {
      return isDarkMode ? darkIOSThumbnail : lightIOSThumbnail
    } else {
      return isDarkMode ? darkDesktopThumbnail : lightDesktopThumbnail
    }
  }, [isDarkMode])

  const onClick = () =>
    openDownloadApp({
      element: InterfaceElementName.UNISWAP_WALLET_BANNER_DOWNLOAD_BUTTON,
    })

  return (
    <PopupContainer show={shouldDisplay}>
      <Container>
        <Thumbnail src={thumbnailSrc} alt={t`Wallet app promo banner thumbnail`} />
        <TextContainer onClick={!screenSize['xs'] ? onClick : undefined}>
          <ThemedText.BodySmall lineHeight="20px">
            <Trans>Get the app</Trans>
          </ThemedText.BodySmall>
          <ThemedText.LabelMicro>
            {isAndroid ? (
              <Trans>Download the Uniswap mobile app from the Play Store</Trans>
            ) : isIOS ? (
              <Trans>Download the Uniswap mobile app from the App Store</Trans>
            ) : (
              <Trans>Download the Uniswap mobile app for iOS and Android</Trans>
            )}
          </ThemedText.LabelMicro>
          <DownloadButton
            onClick={(e) => {
              e.stopPropagation()
              onClick()
            }}
          >
            {isAndroid || isIOS ? <Trans>Download now</Trans> : <Trans>Learn more</Trans>}
          </DownloadButton>
        </TextContainer>
        <StyledQrCode src={walletAppPromoBannerQR} alt="App OneLink QR code" />
        <StyledXButton data-testid="uniswap-wallet-banner" size={24} onClick={toggleHideAppPromoBanner} />
      </Container>
    </PopupContainer>
  )
}
