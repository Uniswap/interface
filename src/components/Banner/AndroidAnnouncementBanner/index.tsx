import { Trans } from '@lingui/macro'
import { InterfaceElementName } from '@uniswap/analytics-events'
import { useAndroidGALaunchFlagEnabled } from 'featureFlags/flags/androidGALaunch'
import { useLocation } from 'react-router-dom'
import { useHideAndroidAnnouncementBanner } from 'state/user/hooks'
import { ThemedText } from 'theme/components'
import { useIsDarkMode } from 'theme/components/ThemeToggle'
import { openDownloadApp } from 'utils/openDownloadApp'
import { isAndroid, isIOS, isMobileSafari } from 'utils/userAgent'

import darkAndroidThumbnail from '../../../assets/images/AndroidWallet-Thumbnail-Dark.png'
import lightAndroidThumbnail from '../../../assets/images/AndroidWallet-Thumbnail-Light.png'
import { Container, DownloadButton, PopupContainer, StyledXButton, TextContainer, Thumbnail } from './styled'

export default function AndroidAnnouncementBanner() {
  const [hideAndroidAnnouncementBanner, toggleHideAndroidAnnouncementBanner] = useHideAndroidAnnouncementBanner()
  const location = useLocation()
  const isLandingScreen = location.search === '?intro=true' || location.pathname === '/'

  const shouldDisplay = Boolean(!hideAndroidAnnouncementBanner && !isLandingScreen)
  const isDarkMode = useIsDarkMode()

  const isAndroidGALaunched = useAndroidGALaunchFlagEnabled()
  const onLaunchedMobilePlatform = isIOS || (isAndroidGALaunched && isAndroid)

  if (!isAndroidGALaunched || isMobileSafari) return null

  return (
    <PopupContainer show={shouldDisplay}>
      <Container>
        <Thumbnail src={isDarkMode ? darkAndroidThumbnail : lightAndroidThumbnail} alt="Android app thumbnail" />
        <TextContainer>
          <ThemedText.BodySmall lineHeight="20px">
            <Trans>Uniswap on Android</Trans>
          </ThemedText.BodySmall>
          <ThemedText.LabelMicro>
            <Trans>Available now - download from the Google Play store today</Trans>
          </ThemedText.LabelMicro>
          <DownloadButton
            onClick={() =>
              openDownloadApp({
                element: InterfaceElementName.UNISWAP_WALLET_BANNER_DOWNLOAD_BUTTON,
                isAndroidGALaunched,
              })
            }
          >
            <Trans>Download now</Trans>
          </DownloadButton>
        </TextContainer>
        <StyledXButton
          data-testid="uniswap-wallet-banner"
          size={20}
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
