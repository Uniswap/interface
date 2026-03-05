import { SharedEventName } from '@uniswap/analytics-events'
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { useAppDispatch } from 'state/hooks'
import { Flex, IconButton, Image, styled, Text, TouchableArea } from 'ui/src'
import { BRIDGED_ASSETS_V2_WEB_BANNER } from 'ui/src/assets'
import { X } from 'ui/src/components/icons/X'
import { useUniswapContext } from 'uniswap/src/contexts/UniswapContext'
import { setHasDismissedBridgedAssetsBannerV2 } from 'uniswap/src/features/behaviorHistory/slice'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { Trace } from 'uniswap/src/features/telemetry/Trace'

const BRIDGING_POPULAR_TOKENS_BANNER_HEIGHT = 152
const GRADIENT_BACKGROUND_HEIGHT = 64
const BANNER_PADDING = 16

const BannerContainer = styled(TouchableArea, {
  borderRadius: '$rounded16',
  width: 260,
  height: BRIDGING_POPULAR_TOKENS_BANNER_HEIGHT,
  shadowColor: '$shadowColor',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.4,
  shadowRadius: 10,
  overflow: 'hidden',
  padding: BANNER_PADDING,
  backgroundColor: '$surface1',
  borderWidth: 1,
  borderColor: '$surface3',
  gap: '$spacing16',

  '$platform-web': {
    position: 'fixed',
    bottom: 29,
    left: 40,
  },
})

export function BridgingPopularTokensBanner() {
  const dispatch = useAppDispatch()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { setIsSwapTokenSelectorOpen, setSwapOutputChainId } = useUniswapContext()

  const handleBannerClose = useCallback(() => {
    dispatch(setHasDismissedBridgedAssetsBannerV2(true))
    sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, {
      element: ElementName.CloseButton,
      modal: ElementName.BridgedAssetsBannerV2,
    })
  }, [dispatch])

  const handleBannerClick = useCallback(() => {
    navigate('/swap?outputChain=unichain')
    setSwapOutputChainId(UniverseChainId.Unichain)
    setIsSwapTokenSelectorOpen(true)
    dispatch(setHasDismissedBridgedAssetsBannerV2(true))
  }, [dispatch, navigate, setIsSwapTokenSelectorOpen, setSwapOutputChainId])

  return (
    <Trace element={ElementName.BridgedAssetsBannerV2} logImpression logPress>
      <BannerContainer onPress={handleBannerClick} zIndex="$sticky" hoverStyle={{ opacity: 0.8 }}>
        <BannerXButton handleClose={handleBannerClose} />

        <Image
          height={GRADIENT_BACKGROUND_HEIGHT}
          width={`calc(100% + ${BANNER_PADDING * 2}px)`}
          marginLeft={-BANNER_PADDING}
          marginTop={-BANNER_PADDING}
          source={BRIDGED_ASSETS_V2_WEB_BANNER}
          alt="Bridging Popular Tokens Banner"
        />

        <Flex gap="$spacing4">
          <Text variant="body3" color="$neutral1">
            {t('onboarding.home.intro.bridgedAssets.title')}
          </Text>
          <Text variant="body4" color="$neutral2">
            {t('bridgingPopularTokens.banner.description')}
          </Text>
        </Flex>
      </BannerContainer>
    </Trace>
  )
}

function BannerXButton({ handleClose }: { handleClose: () => void }) {
  return (
    <Flex row centered position="absolute" right={10} top={10} zIndex="$mask">
      <IconButton
        size="xxsmall"
        emphasis="secondary"
        backgroundColor="$surface3"
        borderRadius="$roundedFull"
        onPress={(e) => {
          e.stopPropagation()
          handleClose()
        }}
        hoverStyle={{ opacity: 0.8 }}
        icon={<X size="$icon.12" color="$surface1" />}
        p={2}
      />
    </Flex>
  )
}
