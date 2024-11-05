import { getChainUI } from 'components/Logo/ChainLogo'
import { getChain, useIsSupportedChainId } from 'constants/chains'
import { useIsSendPage } from 'hooks/useIsSendPage'
import { useIsSwapPage } from 'hooks/useIsSwapPage'
import { useCallback } from 'react'
import { ArrowUpRight } from 'react-feather'
import { useSelector } from 'react-redux'
import { useAppDispatch } from 'state/hooks'
import { useSwapAndLimitContext } from 'state/swap/useSwapContext'
import { ClickableTamaguiStyle, ExternalLink, HideSmall } from 'theme/components'
import { useIsDarkMode } from 'theme/components/ThemeToggle'
import { ElementAfterText, Flex, Text, TouchableArea, TouchableAreaEvent, useSporeColors } from 'ui/src'
import { BRIDGING_BANNER } from 'ui/src/assets'
import { X } from 'ui/src/components/icons/X'
import { opacify } from 'ui/src/theme'
import { CardImage } from 'uniswap/src/components/cards/image'
import { NewTag } from 'uniswap/src/components/pill/NewTag'
import { useUniswapContext } from 'uniswap/src/contexts/UniswapContext'
import { selectHasViewedBridgingBanner } from 'uniswap/src/features/behaviorHistory/selectors'
import { setHasViewedBridgingBanner } from 'uniswap/src/features/behaviorHistory/slice'
import { useIsBridgingChain, useNumBridgingChains } from 'uniswap/src/features/bridging/hooks/chains'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { useTranslation } from 'uniswap/src/i18n'
import { UniverseChainId } from 'uniswap/src/types/chains'
import { ONE_SECOND_MS } from 'utilities/src/time/time'

export function SwapBottomCard() {
  const dispatch = useAppDispatch()
  const { t } = useTranslation()

  const { chainId: oldFlowChainId } = useSwapAndLimitContext()
  const { swapInputChainId: newFlowChainId, setIsSwapTokenSelectorOpen } = useUniswapContext()
  const chainId = newFlowChainId ?? oldFlowChainId

  const isSupportedChain = useIsSupportedChainId(chainId)

  const hasViewedBridgingBanner = useSelector(selectHasViewedBridgingBanner)
  const bridgingEnabled = useFeatureFlag(FeatureFlags.Bridging)
  const isBridgingSupported = useIsBridgingChain(chainId ?? UniverseChainId.Mainnet)
  const numBridgingChains = useNumBridgingChains()
  const handleBridgingDismiss = useCallback(
    (shouldNavigate: boolean) => {
      if (shouldNavigate) {
        // Web specific override to open token selector
        setIsSwapTokenSelectorOpen(true)
        // delay this redux change to avoid any visible UI jank when clicking in
        setTimeout((): void => {
          dispatch(setHasViewedBridgingBanner(true))
        }, ONE_SECOND_MS / 2)
      } else {
        dispatch(setHasViewedBridgingBanner(true))
      }
    },
    [dispatch, setIsSwapTokenSelectorOpen],
  )

  const isSwapPage = useIsSwapPage()
  const isSendPage = useIsSendPage()
  if (!isSupportedChain || !(isSwapPage || isSendPage)) {
    return null
  }

  const shouldShowBridgingBanner = bridgingEnabled && !hasViewedBridgingBanner && isBridgingSupported

  const shouldShowLegacyTreatment = !bridgingEnabled

  if (shouldShowBridgingBanner) {
    return (
      <TouchableArea {...ClickableTamaguiStyle} onPress={() => handleBridgingDismiss(true)}>
        <CardInner
          isAbsoluteImage
          image={
            <Flex height="100%">
              <CardImage uri={BRIDGING_BANNER} />
            </Flex>
          }
          title={t('swap.bridging.title')}
          onDismiss={() => {
            handleBridgingDismiss(false)
          }}
          subtitle={t('onboarding.home.intro.bridging.description', { count: numBridgingChains })}
          isNew
        />
      </TouchableArea>
    )
  } else if (shouldShowLegacyTreatment || !isBridgingSupported) {
    return <NetworkAlert chainId={chainId} />
  } else {
    return null
  }
}

function NetworkAlert({ chainId }: { chainId: UniverseChainId }) {
  const darkMode = useIsDarkMode()
  const { t } = useTranslation()

  const { symbol, bgColor, textColor } = getChainUI(chainId, darkMode)
  const chainInfo = getChain({ chainId })

  return chainInfo.bridge ? (
    <ExternalLink href={chainInfo.bridge}>
      <CardInner
        image={symbol !== '' ? <img width="40px" height="40px" style={{ borderRadius: '12px' }} src={symbol} /> : null}
        title={t('token.bridge', { label: chainInfo.label })}
        subtitle={t('common.deposit.toNetwork', { label: chainInfo.label })}
        textColor={textColor}
        backgroundColor={bgColor}
      />
    </ExternalLink>
  ) : null
}

const ICON_SIZE = 24
const ICON_SIZE_PX = `${ICON_SIZE}px`

function CardInner({
  image,
  isAbsoluteImage = false,
  backgroundColor,
  textColor,
  title,
  subtitle,
  onDismiss,
  isNew = false,
}: {
  title: string
  subtitle: string
  image: JSX.Element | null
  isAbsoluteImage?: boolean
  backgroundColor?: string
  textColor?: string
  isNew?: boolean
  onDismiss?: () => void
}) {
  const colors = useSporeColors()

  return (
    <Flex
      row
      grow
      overflow="hidden"
      borderWidth="$spacing1"
      borderColor={backgroundColor ?? opacify(0.05, colors.surface3.val)}
      backgroundColor={backgroundColor ?? '$surface1'}
      alignItems="center"
      pl={isAbsoluteImage ? '$none' : '$spacing12'}
      borderRadius="$rounded20"
      justifyContent="space-between"
      width="100%"
    >
      {image}
      <Flex row fill alignItems="center" p="$spacing12" pl={isAbsoluteImage ? '$spacing48' : '$spacing12'}>
        <Flex fill alignContent="center">
          <ElementAfterText
            text={title}
            textProps={{ color: textColor ?? '$neutral1', variant: 'subheading2' }}
            element={isNew ? <NewTag /> : undefined}
          />
          <HideSmall>
            <Text variant="body4" color={textColor ?? '$neutral2'}>
              {subtitle}
            </Text>
          </HideSmall>
        </Flex>
        {onDismiss ? (
          <TouchableArea
            hitSlop={ICON_SIZE}
            onPress={(e: TouchableAreaEvent) => {
              e.stopPropagation()
              onDismiss()
            }}
          >
            <X color="$neutral3" size={ICON_SIZE} />
          </TouchableArea>
        ) : (
          <ArrowUpRight width={ICON_SIZE_PX} height={ICON_SIZE_PX} color={textColor} />
        )}
      </Flex>
    </Flex>
  )
}
