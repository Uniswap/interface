import PREVIEW_IMG_DARK from 'assets/images/portfolio-page-disconnected-preview/dark.svg'
import PREVIEW_IMG_LIGHT from 'assets/images/portfolio-page-disconnected-preview/light.svg'
import PREVIEW_IMG_MOBILE_DARK from 'assets/images/portfolio-page-disconnected-preview/mobile-dark.svg'
import PREVIEW_IMG_MOBILE_LIGHT from 'assets/images/portfolio-page-disconnected-preview/mobile-light.svg'
import { useAccountDrawer } from 'components/AccountDrawer/MiniPortfolio/hooks'
import { TOTAL_INTERFACE_NAV_HEIGHT } from 'pages/Portfolio/constants'
import { useTranslation } from 'react-i18next'
import { Button, Flex, styled, Text, useIsDarkMode, useMedia, useSporeColors } from 'ui/src'
import { opacify } from 'ui/src/theme'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { ElementName, InterfaceEventName, InterfacePageName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'

const PADDING_TOP = 60
const LEFT_CONTENT_MAX_WIDTH = 262

function useBackgroundGradient() {
  const colors = useSporeColors()
  const isDarkMode = useIsDarkMode()
  return `linear-gradient(to top, ${opacify(isDarkMode ? 70 : 100, colors.surface1.val)} 0%, ${opacify(0, colors.surface1.val)} 100%)`
}

const BottomFadeOverlay = styled(Flex, {
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  height: 100,
  width: 'calc(50vw + 25px)',
  pointerEvents: 'none',
  variants: {
    fullWidth: {
      true: { width: '100%' },
    },
  },
})

const ImageWrapper = styled(Flex, {
  position: 'absolute',
  top: 0,
  left: 0,
  // on large screens, the image should scale up and always overflow on the right hand side.
  minWidth: 'calc(50vw + 25px)',
  minHeight: '100%',
  borderRadius: '$rounded20',
  borderWidth: 1,
  borderColor: '$surface3',
  overflow: 'hidden',
  $xxxl: {
    width: '148%',
  },
  $xl: {
    width: 'auto',
    minWidth: 'auto',
    maxWidth: '200%',
  },
})

export default function PortfolioDisconnectedView() {
  const { t } = useTranslation()
  const enabledChains = useEnabledChains()
  const isDarkMode = useIsDarkMode()
  const accountDrawer = useAccountDrawer()
  const colors = useSporeColors()
  const media = useMedia()
  const backgroundGradient = useBackgroundGradient()

  return (
    <Trace logImpression page={InterfacePageName.PortfolioDisconnectedPage}>
      <Flex
        row
        maxWidth="$maxWidth1200"
        width="100%"
        height={`calc(100vh - ${TOTAL_INTERFACE_NAV_HEIGHT}px)`}
        $platform-web={{ overflowX: 'visible', overflowY: 'clip' }}
        pt={PADDING_TOP}
        $lg={{
          flexDirection: 'column',
          alignItems: 'center',
          pt: 0,
        }}
      >
        <Flex
          width="50%"
          height="100%"
          justifyContent="center"
          gap="$gap32"
          px="$spacing40"
          $lg={{ width: '100%', height: '50%', alignItems: 'center' }}
        >
          <Flex maxWidth={LEFT_CONTENT_MAX_WIDTH} gap="$gap16">
            <Text variant="heading3" $lg={{ textAlign: 'center' }}>
              {t('common.getStarted')}
            </Text>
            <Text variant="body1" color="$neutral2" $lg={{ textAlign: 'center' }}>
              {t('portfolio.disconnected.cta.description', { numNetworks: enabledChains.chains.length })}
            </Text>
          </Flex>
          <Trace
            logPress
            eventOnTrigger={InterfaceEventName.ConnectWalletButtonClicked}
            element={ElementName.ConnectWalletButton}
          >
            {/* Wrap in a flex with set height to avoid growing too tall in firefox */}
            <Flex height="54px">
              <Button
                variant="branded"
                emphasis="primary"
                size="large"
                alignSelf="flex-start"
                $lg={{ alignSelf: 'center' }}
                onPress={() => accountDrawer.open()}
              >
                <Text variant="buttonLabel1" color="$white">
                  {t('common.connectWallet.button')}
                </Text>
              </Button>
            </Flex>
          </Trace>
        </Flex>

        {media.lg ? (
          <Flex height="50%" width="100%" alignItems="center">
            <Flex
              width="100%"
              maxWidth={440}
              borderTopLeftRadius={39}
              borderTopRightRadius={39}
              borderWidth={1}
              borderColor="$surface3"
              boxShadow={`0 8px 34.09px -3.933px ${colors.shadowColor.val}, 0 1.626px 4.065px -1.626px ${colors.shadowColor.val}`}
              overflow="hidden"
            >
              <img
                src={isDarkMode ? PREVIEW_IMG_MOBILE_DARK : PREVIEW_IMG_MOBILE_LIGHT}
                alt="Portfolio overview mobile preview image"
                style={{ width: '100%', height: 'auto' }}
              />
            </Flex>
            <BottomFadeOverlay background={backgroundGradient} fullWidth />
          </Flex>
        ) : (
          <Flex width="50%" position="relative" overflow="visible" height="100%">
            <ImageWrapper
              $platform-web={{
                boxShadow: `0 14.293px 46.453px -5.36px ${colors.shadowColor.val}, 0 2.216px 5.539px -2.216px ${colors.shadowColor.val}`,
              }}
            >
              <img
                src={isDarkMode ? PREVIEW_IMG_DARK : PREVIEW_IMG_LIGHT}
                alt="Portfolio overview preview image"
                style={{ minWidth: '100%', minHeight: '100%' }}
              />
            </ImageWrapper>

            <BottomFadeOverlay background={backgroundGradient} />
          </Flex>
        )}
      </Flex>
    </Trace>
  )
}
