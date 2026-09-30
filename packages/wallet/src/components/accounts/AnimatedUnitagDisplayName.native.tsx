import { SharedEventName } from '@uniswap/analytics-events'
import { sanitizeAddressText } from '@universe/chains'
import { isExtensionApp, isMobileApp } from '@universe/environment'
import { AnimatedFlex, Flex, getTokenValue, Text, TouchableArea, useIsDarkMode } from '@universe/mycelium'
import { withSporeCurve } from '@universe/tailwind/animations/reanimated'
import { TestID } from '@universe/test'
import { BaseSyntheticEvent, memo, useCallback, useEffect, useState } from 'react'
import { LayoutChangeEvent } from 'react-native'
import { useAnimatedStyle, useSharedValue } from 'react-native-reanimated'
import { useDispatch } from 'react-redux'
import { CopyAlt, Unitag } from 'ui/src/components/icons'
import { DisplayNameType } from 'uniswap/src/features/accounts/types'
import { pushNotification } from 'uniswap/src/features/notifications/slice/slice'
import { AppNotificationType, CopyNotificationType } from 'uniswap/src/features/notifications/slice/types'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { UNITAG_SUFFIX } from 'uniswap/src/features/unitags/constants'
import { ExtensionScreens } from 'uniswap/src/types/screens/extension'
import { MobileScreens } from 'uniswap/src/types/screens/mobile'
import { shortenAddress } from 'utilities/src/addresses'
import { setClipboard } from 'utilities/src/clipboard/clipboard'
import { AnimatedUnitagDisplayNameProps } from 'wallet/src/components/accounts/AnimatedUnitagDisplayName'

/**
 * Used in the account header that displays the user's unitag and name if available and
 * address. The unitag is animated which shows the unitag suffix.
 */
function AnimatedUnitagDisplayNameInner({
  displayName,
  unitagIconSize = '$icon.24',
  address,
}: AnimatedUnitagDisplayNameProps): JSX.Element {
  const dispatch = useDispatch()
  const [showUnitagSuffix, setShowUnitagSuffix] = useState(false)
  const isUnitag = displayName.type === DisplayNameType.Unitag

  const { width: nameTextWidth, onLayout: onNameTextLayout } = useLayoutWidth(showUnitagSuffix)
  const { width: unitagSuffixTextWidth, onLayout: onUnitagSuffixTextLayout } = useLayoutWidth()
  const { width: viewWidth, onLayout: onViewWidthLayout } = useLayoutWidth()

  const onPressUnitag = (): void => setShowUnitagSuffix(!showUnitagSuffix)

  // Ensure component changes over on theme switch
  useIsDarkMode()

  const onPressCopyAddress = useCallback(
    async (e: BaseSyntheticEvent): Promise<void> => {
      if (!address) {
        return
      }

      e.stopPropagation()
      await setClipboard(address)
      dispatch(
        pushNotification({
          type: AppNotificationType.Copied,
          copyType: CopyNotificationType.Address,
        }),
      )
      sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, {
        element: ElementName.CopyAddress,
        screen: isExtensionApp ? ExtensionScreens.Home : isMobileApp ? MobileScreens.Home : undefined,
      })
    },
    [address, dispatch],
  )

  const isLayoutReady = viewWidth > 0 && nameTextWidth > 0

  /**
   * We have two animation modes. If the name is too long the animation replaces the
   * tail of the name with the unitag suffix. Otherwise it slides extends the unitag suffix.
   **/
  const shouldAnimateSlide = nameTextWidth + unitagSuffixTextWidth + getTokenValue(unitagIconSize) < viewWidth

  // Reanimated legs of the legacy 'semiBouncy' suffix slide and fade.
  const { unitagOffset, unitagSlideX } = getUnitagSlideConfig({
    shouldAnimateSlide,
    unitagSuffixTextWidth,
    showUnitagSuffix,
  })
  const slideStyle = useAnimatedStyle(
    () => ({
      marginLeft: withSporeCurve('semiBouncy', unitagOffset),
      transform: [{ translateX: withSporeCurve('semiBouncy', unitagSlideX) }],
    }),
    [unitagOffset, unitagSlideX],
  )
  // Seeded so mount does not animate.
  const suffixOpacity = useSharedValue(showUnitagSuffix ? 1 : 0)
  useEffect(() => {
    suffixOpacity.value = withSporeCurve('semiBouncy', showUnitagSuffix ? 1 : 0)
  }, [showUnitagSuffix, suffixOpacity])
  const suffixOpacityStyle = useAnimatedStyle(() => ({ opacity: suffixOpacity.value }))

  const nameRow = (
    <Flex row width={viewWidth} opacity={isLayoutReady ? 1 : 0}>
      <Text
        zIndex={2}
        flexShrink={1}
        backgroundColor="$background"
        color="$neutral1"
        numberOfLines={1}
        variant="subheading1"
        onLayout={onNameTextLayout}
      >
        {displayName.name}
      </Text>

      {isUnitag && (
        <AnimatedFlex row zIndex={1} style={slideStyle}>
          {/*
            We need to calculate this width in order to animate the suffix in and out,
            but we don't want the initial render to show the suffix nor use the space and push other elements to the right.
            So we set it to `position: absolute` on first render and then switch it to `relative` once we have the width.
            */}
          <Flex position={isLayoutReady ? 'relative' : 'absolute'} onLayout={onUnitagSuffixTextLayout}>
            <AnimatedFlex style={suffixOpacityStyle}>
              <Text color="$neutral3" variant="subheading1">
                {UNITAG_SUFFIX}
              </Text>
            </AnimatedFlex>
          </Flex>
          <Flex zIndex={2} alignSelf="center" backgroundColor="$background" pl="$spacing4" pt="$spacing1">
            <Unitag size={unitagIconSize} />
          </Flex>
        </AnimatedFlex>
      )}
    </Flex>
  )

  return (
    <Flex flexGrow={1} onLayout={onViewWidthLayout}>
      {isUnitag ? (
        // Needs a gesture-handler host of its own, or the press is lost to the header's outer gesture.
        <TouchableArea testID={TestID.AccountHeaderUnitagDisplayName} onPress={onPressUnitag}>
          {nameRow}
        </TouchableArea>
      ) : (
        nameRow
      )}

      {address && (
        <TouchableArea testID={TestID.AccountHeaderCopyAddress} onPress={onPressCopyAddress}>
          <Flex row alignItems="center" gap="$spacing4">
            <Text color="$neutral2" numberOfLines={1} variant="body2">
              {sanitizeAddressText(shortenAddress({ address }))}
            </Text>
            <CopyAlt color="$neutral3" size="$icon.16" />
          </Flex>
        </TouchableArea>
      )}
    </Flex>
  )
}

/**
 * Geometry of the two reveal modes: a short name slides the suffix out (`unitagSlideX`); a long one
 * pins `unitagSlideX` at 0 and moves `unitagOffset` (a margin) instead.
 */
export function getUnitagSlideConfig({
  shouldAnimateSlide,
  unitagSuffixTextWidth,
  showUnitagSuffix,
}: {
  shouldAnimateSlide: boolean
  unitagSuffixTextWidth: number
  showUnitagSuffix: boolean
}): { unitagOffset: number; unitagSlideX: number } {
  return shouldAnimateSlide
    ? {
        unitagOffset: -unitagSuffixTextWidth,
        unitagSlideX: showUnitagSuffix ? unitagSuffixTextWidth : 0,
      }
    : {
        unitagOffset: showUnitagSuffix ? 0 : -unitagSuffixTextWidth,
        unitagSlideX: 0,
      }
}

/**
 * Returns a width and a callback to be used in a `onLayout` handler.
 */
export function useLayoutWidth(pause = false): {
  width: number
  onLayout: (event: LayoutChangeEvent) => void
} {
  const [width, setWidth] = useState(0)

  const onLayout = (event: LayoutChangeEvent): void => {
    if (pause) {
      return
    }
    setWidth(event.nativeEvent.layout.width)
  }

  return { width, onLayout }
}

export const AnimatedUnitagDisplayName = memo(AnimatedUnitagDisplayNameInner)
