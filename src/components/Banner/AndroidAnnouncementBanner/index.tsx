import { Trans } from '@lingui/macro'
import { InterfaceElementName } from '@uniswap/analytics-events'
import { useScreenSize } from 'hooks/useScreenSize'
import { useLocation } from 'react-router-dom'
import { useHideAndroidAnnouncementBanner } from 'state/user/hooks'
import { ThemedText } from 'theme/components'
import { useIsDarkMode } from 'theme/components/ThemeToggle'
import { openDownloadApp } from 'utils/openDownloadApp'
import { isMobileSafari } from 'utils/userAgent'

import androidAnnouncementBannerQR from '../../../assets/images/androidAnnouncementBannerQR.png'
import darkAndroidThumbnail from '../../../assets/images/AndroidWallet-Thumbnail-Dark.png'
import lightAndroidThumbnail from '../../../assets/images/AndroidWallet-Thumbnail-Light.png'
import {
  Container,
  DownloadButton,
  PopupContainer,
  StyledQrCode,
  StyledXButton,
  TextContainer,
  Thumbnail,
} from './styled'

export default function AndroidAnnouncementBanner() {
  const [hideAndroidAnnouncementBanner, toggleHideAndroidAnnouncementBanner] = useHideAndroidAnnouncementBanner()
  const location = useLocation()
  const isLandingScreen = location.search === '?intro=true' || location.pathname === '/'
  const screenSize = useScreenSize()

  const shouldDisplay = Boolean(!hideAndroidAnnouncementBanner && !isLandingScreen)
  const isDarkMode = useIsDarkMode()

  const onClick = () =>
    openDownloadApp({
      element: InterfaceElementName.UNISWAP_WALLET_BANNER_DOWNLOAD_BUTTON,
    })

  if (isMobileSafari) return null

  return (
    <PopupContainer show={shouldDisplay}>
      <Container>
        <Thumbnail src={isDarkMode ? darkAndroidThumbnail : lightAndroidThumbnail} alt="Android app thumbnail" />
        <TextContainer onClick={!screenSize['xs'] ? onClick : undefined}>
          <ThemedText.BodySmall lineHeight="20px">
            <Trans>Uniswap on Android</Trans>
          </ThemedText.BodySmall>
          <ThemedText.LabelMicro>
            <Trans>Available now - download from the Google Play Store today</Trans>
          </ThemedText.LabelMicro>
          <DownloadButton
            onClick={(e) => {
              e.stopPropagation()
              onClick()
            }}
          >
            <Trans>Download now</Trans>
          </DownloadButton>
        </TextContainer>
        <StyledQrCode src={androidAnnouncementBannerQR} alt="App OneLink QR code" />
        <StyledXButton
          data-testid="uniswap-wallet-banner"
          size={24}
          onClick={(e) => {
            // prevent click from bubbling to UI on the page underneath, i.e. clicking a token row
            e.preventDefault()
            e.stopPropagation()
            toggleHideAndroidAnnouncementBanner()
          }}
        />
      </Container>
    </PopupContainer>
  )
}
