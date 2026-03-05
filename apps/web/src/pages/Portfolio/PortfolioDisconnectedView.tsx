import DISCONNECTED_B_DARK from 'assets/images/portfolio-page-promo/dark.svg'
import DISCONNECTED_B_LIGHT from 'assets/images/portfolio-page-promo/light.svg'
import { useAccountDrawer } from 'components/AccountDrawer/MiniPortfolio/hooks'
import { useTranslation } from 'react-i18next'
import { Button, Flex, Image, Text, useIsDarkMode, useSporeColors } from 'ui/src'
import { INTERFACE_NAV_HEIGHT } from 'ui/src/theme'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'

const PADDING_TOP = 60
const NAV_BORDER_WIDTH = 1
const OFFSET_TOP = INTERFACE_NAV_HEIGHT + NAV_BORDER_WIDTH
const LEFT_CONTENT_MAX_WIDTH = 262

export default function PortfolioDisconnectedView() {
  const { t } = useTranslation()
  const enabledChains = useEnabledChains()
  const isDarkMode = useIsDarkMode()
  const accountDrawer = useAccountDrawer()
  const colors = useSporeColors()

  return (
    <Flex
      row
      maxWidth="$maxWidth1200"
      width="100%"
      height={`calc(100vh - ${OFFSET_TOP}px)`}
      $platform-web={{ overflowX: 'visible', overflowY: 'clip' }}
      pt={PADDING_TOP}
      $md={{
        flexDirection: 'column',
        alignItems: 'center',
        overflow: 'visible',
        height: 'auto',
      }}
    >
      <Flex
        width="50%"
        height="100%"
        justifyContent="center"
        gap="$gap32"
        px="$spacing40"
        $md={{ width: '100%', height: 400, alignItems: 'center' }}
      >
        <Flex maxWidth={LEFT_CONTENT_MAX_WIDTH} gap="$gap16">
          <Text variant="heading3" $md={{ textAlign: 'center' }}>
            {t('common.getStarted')}
          </Text>
          <Text variant="body1" color="$neutral2" $md={{ textAlign: 'center' }}>
            {t('portfolio.disconnected.cta.description', { numNetworks: enabledChains.chains.length })}
          </Text>
        </Flex>
        <Button
          variant="branded"
          emphasis="primary"
          size="large"
          maxHeight="fit-content"
          alignSelf="flex-start"
          $md={{ alignSelf: 'center' }}
          onPress={() => accountDrawer.open()}
        >
          {t('common.connectWallet.button')}
        </Button>
      </Flex>
      <Flex
        width="50%"
        $md={{ width: '100%', height: 'auto' }}
        position="relative"
        overflow="visible"
        height={`calc(100vh - ${INTERFACE_NAV_HEIGHT + 1}px)`}
      >
        <Flex
          position="absolute"
          right="-48%"
          top={0}
          left={0}
          width="148%"
          borderRadius="$rounded20"
          $platform-web={{
            boxShadow: `0 14.293px 46.453px -5.36px ${colors.shadowColor.val}, 0 2.216px 5.539px -2.216px ${colors.shadowColor.val}`,
          }}
          borderWidth={1}
          borderColor="$surface3"
          overflow="hidden"
          $md={{
            width: 'calc(100% - 2px)',
            position: 'relative',
            right: 'auto',
            top: 'auto',
            left: 'auto',
            borderBottomLeftRadius: '$none',
            borderBottomRightRadius: '$none',
          }}
        >
          <Image
            source={{ uri: isDarkMode ? DISCONNECTED_B_DARK : DISCONNECTED_B_LIGHT }}
            alt="Portfolio overview example image"
            width="100%"
            height="auto"
            aspectRatio={1072 / 1458}
          />
        </Flex>
      </Flex>
    </Flex>
  )
}
