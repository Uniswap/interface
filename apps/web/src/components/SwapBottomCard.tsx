import { getChainUI } from 'components/Logo/ChainLogo'
import { PageType, useIsPage } from 'hooks/useIsPage'
import { useCallback } from 'react'
import { ArrowUpRight } from 'react-feather'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { useAppDispatch } from 'state/hooks'
import { useMultichainContext } from 'state/multichain/useMultichainContext'
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
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { useIsSupportedChainId } from 'uniswap/src/features/chains/hooks/useSupportedChainId'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { ONE_SECOND_MS } from 'utilities/src/time/time'

export function SwapBottomCard() {
  const dispatch = useAppDispatch()
  const { t } = useTranslation()

  const { chainId: oldFlowChainId } = useMultichainContext()
  const { swapInputChainId: newFlowChainId, setIsSwapTokenSelectorOpen } = useUniswapContext()
  const chainId = newFlowChainId ?? oldFlowChainId

  const isSupportedChain = useIsSupportedChainId(chainId)

  const hasViewedBridgingBanner = useSelector(selectHasViewedBridgingBanner)
  const isBridgingSupportedChain = useIsBridgingChain(chainId ?? UniverseChainId.Mainnet)
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

  const isSwapPage = useIsPage(PageType.SWAP)
  const isSendPage = useIsPage(PageType.SEND)
  if (!isSupportedChain || !(isSwapPage || isSendPage)) {
    return null
  }

  const isBridgingBannerChain = chainId === null || chainId === UniverseChainId.Mainnet || isBridgingSupportedChain
  const shouldShowBridgingBanner = !hasViewedBridgingBanner && isBridgingBannerChain

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
  } else if (!isBridgingSupportedChain) {
    return <NetworkAlert chainId={chainId} />
  } else {
    return null
  }
}

function NetworkAlert({ chainId }: { chainId: UniverseChainId }) {
  const darkMode = useIsDarkMode()
  const { t } = useTranslation()

  const { symbol, bgColor, textColor } = getChainUI(chainId, darkMode)
  const chainInfo = getChainInfo(chainId)

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
