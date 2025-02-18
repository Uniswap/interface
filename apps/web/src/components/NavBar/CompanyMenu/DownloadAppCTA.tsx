import { InterfaceElementName } from '@uniswap/analytics-events'
import { MobileAppLogo } from 'components/Icons/MobileAppLogo'
import { useIsMobileDrawer } from 'components/NavBar/ScreenSizes'
import Row from 'components/deprecated/Row'
import styled, { css } from 'lib/styled-components'
import { useTranslation } from 'react-i18next'
import { Text } from 'rebass'
import { useOpenModal } from 'state/application/hooks'
import { ApplicationModal } from 'state/application/reducer'
import { ThemedText } from 'theme/components'
import { Flex, useIsTouchDevice } from 'ui/src'
import { breakpoints } from 'ui/src/theme'
import { isWebAndroid, isWebIOS } from 'utilities/src/platform'
import { APP_DOWNLOAD_LINKS, openDownloadApp } from 'utils/openDownloadApp'

const DOWNLOAD_PADDING_X = 8
const HoverStyles = css`
  background: ${({ theme }) => theme.accent2};
  color: ${({ theme }) => theme.accent1} !important;
`
const DownloadCTA = styled(Row)<{ isMobile: boolean }>`
  cursor: pointer;
  padding: 12px ${DOWNLOAD_PADDING_X}px;
  border-radius: 16px;
  transition: all 0.2s;
  box-sizing: content-box;
  transform: translateX(-${DOWNLOAD_PADDING_X}px);
  ${({ isMobile }) => isMobile && HoverStyles}
  &:hover {
    ${HoverStyles}
  }
  @media screen and (max-width: ${breakpoints.sm}px) {
    transform: none;
    box-sizing: border-box;
  }
`
export function DownloadApp({ onClick }: { onClick?: () => void }) {
  const { t } = useTranslation()
  const openGetTheAppModal = useOpenModal({ name: ApplicationModal.GET_THE_APP })
  const isTouchDevice = useIsTouchDevice()
  const isMobileDrawer = useIsMobileDrawer()

  return (
    <DownloadCTA
      href={APP_DOWNLOAD_LINKS[InterfaceElementName.UNISWAP_WALLET_NAVBAR_MENU_DOWNLOAD_BUTTON]}
      isMobile={isTouchDevice || isMobileDrawer}
      gap="md"
      onClick={() => {
        if (onClick) {
          onClick()
        }
        if (isWebIOS || isWebAndroid) {
          openDownloadApp({ element: InterfaceElementName.UNISWAP_WALLET_NAVBAR_MENU_DOWNLOAD_BUTTON })
        } else {
          openGetTheAppModal()
        }
      }}
      data-testid="nav-dropdown-download-app"
    >
      <MobileAppLogo width={41} height={41} />
      <Flex>
        <Text lineHeight="20px">{t('common.downloadUniswap')}</Text>
        <ThemedText.LabelMicro lineHeight="18px" color="theme.accent1">
          {t('common.availableOnIOSAndroid')}
        </ThemedText.LabelMicro>
      </Flex>
    </DownloadCTA>
  )
}
