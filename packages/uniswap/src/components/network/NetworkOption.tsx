import { ReactNode, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { AnimateInOrder, ElementAfterGradientText, Flex, Text, isWeb, useSporeColors } from 'ui/src'
import { CheckmarkCircle } from 'ui/src/components/icons/CheckmarkCircle'
import { iconSizes } from 'ui/src/theme'
import { NetworkLogo } from 'uniswap/src/components/CurrencyLogo/NetworkLogo'
import { NewTag } from 'uniswap/src/components/pill/NewTag'
import { selectHasSeenUnichainPromotionNetworkSelectorAnimation } from 'uniswap/src/features/behaviorHistory/selectors'
import { setHasSeenNetworkSelectorAnimation } from 'uniswap/src/features/behaviorHistory/slice'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { isInterface } from 'utilities/src/platform'
import { ONE_SECOND_MS } from 'utilities/src/time/time'

const NETWORK_OPTION_ICON_SIZE = iconSizes.icon24
const OPTION_GAP = isWeb ? '$spacing8' : '$spacing6'

export function NetworkOption({
  chainId,
  currentlySelected,
  isNew,
}: {
  chainId: UniverseChainId | null
  currentlySelected?: boolean
  isNew: boolean
}): JSX.Element {
  const { t } = useTranslation()
  const colors = useSporeColors()
  const dispatch = useDispatch()
  const info = chainId && getChainInfo(chainId)
  const isUnichainPromoEnabled = useFeatureFlag(FeatureFlags.UnichainPromo)
  const hasSeenUnichainAnimation = useSelector(selectHasSeenUnichainPromotionNetworkSelectorAnimation)
  const showUnichainAnimation =
    isUnichainPromoEnabled && !hasSeenUnichainAnimation && chainId === UniverseChainId.Unichain

  let content: ReactNode = null

  useEffect(() => {
    if (showUnichainAnimation) {
      // delay to prevent ux jank
      const delay = setTimeout(
        () => {
          dispatch(setHasSeenNetworkSelectorAnimation(true))
        },
        isInterface ? ONE_SECOND_MS : ONE_SECOND_MS * 3,
      )
      return () => clearTimeout(delay)
    }
    return undefined
  }, [showUnichainAnimation, dispatch])

  const wrappedNewTag = useMemo(
    () =>
      hasSeenUnichainAnimation ? (
        <NewTag ml={OPTION_GAP} />
      ) : (
        <AnimateInOrder
          shrink
          index={1}
          delayMs={500}
          animation="125ms"
          enterStyle={{ opacity: 0 }}
          display="inline-flex"
        >
          <NewTag ml={OPTION_GAP} />
        </AnimateInOrder>
      ),
    [hasSeenUnichainAnimation],
  )

  if (!info?.label) {
    content = (
      <Flex row gap="$spacing12">
        <NetworkLogo chainId={null} size={NETWORK_OPTION_ICON_SIZE} />
        <Text color="$neutral1" variant="body2">
          {t('transaction.network.all')}
        </Text>
      </Flex>
    )
  } else {
    content = (
      <Flex row gap="$spacing12">
        <Flex animation="125msDelayed" enterStyle={showUnichainAnimation ? { rotate: '-90deg' } : null}>
          {(chainId && <NetworkLogo chainId={chainId} size={NETWORK_OPTION_ICON_SIZE} />) || (
            <Flex width={NETWORK_OPTION_ICON_SIZE} />
          )}
        </Flex>
        <ElementAfterGradientText
          element={isNew || showUnichainAnimation ? wrappedNewTag : undefined}
          text={info.label}
          gradientTextColor={colors.neutral1?.val}
          enabled={showUnichainAnimation}
          textProps={{ variant: 'body2' }}
          gradientEndingXPlacement={-250}
        />
      </Flex>
    )
  }

  return (
    <AnimateInOrder
      index={showUnichainAnimation ? 1 : 0}
      delayMs={showUnichainAnimation ? (isInterface ? 250 : 750) : 0}
      animation={showUnichainAnimation ? '125ms' : null}
      enterStyle={showUnichainAnimation ? { height: 0, width: 200 } : null}
      // defined height & width are necessary to allow for smooth animation
      height={44}
      width="auto"
    >
      <Flex
        row
        animation="125msDelayed"
        enterStyle={showUnichainAnimation ? { opacity: 0 } : null}
        alignItems="center"
        justifyContent="space-between"
        px="$spacing8"
        py={10}
      >
        {content}
        <Flex centered height={NETWORK_OPTION_ICON_SIZE} width={NETWORK_OPTION_ICON_SIZE}>
          {currentlySelected && <CheckmarkCircle color={colors.neutral1?.get()} ml={OPTION_GAP} size="$icon.20" />}
        </Flex>
      </Flex>
    </AnimateInOrder>
  )
}
