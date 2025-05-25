import { InterfaceElementName } from '@uniswap/analytics-events'
import { MobileAppLogo } from 'components/Icons/MobileAppLogo'
import { useIsMobileDrawer } from 'components/NavBar/ScreenSizes'
import { useAccount } from 'hooks/useAccount'
import { useModalState } from 'hooks/useModalState'
import { useTranslation } from 'react-i18next'
import { Text } from 'rebass'
import { Anchor, Flex, TextProps, styled, useIsTouchDevice } from 'ui/src'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { isWebAndroid, isWebIOS } from 'utilities/src/platform'
import { openDownloadApp } from 'utils/openDownloadApp'

const DOWNLOAD_PADDING_X = 8

const PinkFilled: TextProps = {
  backgroundColor: '$accent2',
  color: '$accent1',
}

const DownloadCTA = styled(Anchor, {
  display: 'flex',
  flexDirection: 'row',
  cursor: 'pointer',
  py: '$padding12',
  px: DOWNLOAD_PADDING_X,
  borderRadius: '$rounded16',
  animation: '200ms',
  '$platform-web': { boxSizing: 'content-box' },
  transform: `translateX(-${DOWNLOAD_PADDING_X}px)`,
  gap: '$spacing12',
  textDecorationLine: 'none',
  fontWeight: '$book',
  hoverStyle: PinkFilled,
  variants: {
    isMobile: {
      true: PinkFilled,
    },
  },
  $sm: {
    transform: 'none',
    '$platform-web': { boxSizing: 'border-box' },
  },
})

export function DownloadApp({ onClick }: { onClick?: () => void }) {
  const { t } = useTranslation()
  const { openModal: openGetTheAppModal } = useModalState(ModalName.GetTheApp)
  const isTouchDevice = useIsTouchDevice()
  const isMobileDrawer = useIsMobileDrawer()
  const account = useAccount()

  return (
    <Trace
      logPress
      element={InterfaceElementName.UNISWAP_WALLET_NAVBAR_MENU_DOWNLOAD_BUTTON}
      properties={{ connector_id: account?.connector?.id }}
    >
      <DownloadCTA
        isMobile={isTouchDevice || isMobileDrawer}
        onPress={() => {
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
          <Text variant="body4" fontSize={12} lineHeight="18px" color="theme.accent1">
            {t('common.availableOnIOSAndroid')}
          </Text>
        </Flex>
      </DownloadCTA>
    </Trace>
  )
}
