import { SharedEventName } from '@uniswap/analytics-events'
import { BaseSyntheticEvent, memo, useCallback, useMemo, useState } from 'react'
import { LayoutChangeEvent } from 'react-native'
import { useDispatch } from 'react-redux'
import { AnimatePresence, Flex, getTokenValue, Text, TouchableArea, useIsDarkMode } from 'ui/src'
import { CopyAlt, Unitag } from 'ui/src/components/icons'
import { DisplayNameType } from 'uniswap/src/features/accounts/types'
import { pushNotification } from 'uniswap/src/features/notifications/slice/slice'
import { AppNotificationType, CopyNotificationType } from 'uniswap/src/features/notifications/slice/types'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { UNITAG_SUFFIX } from 'uniswap/src/features/unitags/constants'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { ExtensionScreens } from 'uniswap/src/types/screens/extension'
import { MobileScreens } from 'uniswap/src/types/screens/mobile'
import { sanitizeAddressText } from 'uniswap/src/utils/addresses'
import { setClipboard } from 'uniswap/src/utils/clipboard'
import { shortenAddress } from 'utilities/src/addresses'
import { isExtensionApp, isMobileApp } from 'utilities/src/platform'
import { AnimatedUnitagDisplayNameProps } from 'wallet/src/components/accounts/AnimatedUnitagDisplayName'

/**
 * Used in the account header that displays the user's unitag and name if available and
 * address. The unitag is animated which shows the unitag suffix.
 */
function _AnimatedUnitagDisplayName({
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
  const slideConfig = useMemo(() => {
    return shouldAnimateSlide
      ? {
          paddingRight: 0,
          widthAdjust: 0,
          unitagOffset: -unitagSuffixTextWidth,
          unitagSlideX: showUnitagSuffix ? unitagSuffixTextWidth : 0,
        }
      : {
          paddingRight: 0,
          widthAdjust: showUnitagSuffix ? unitagSuffixTextWidth : 0,
          unitagOffset: showUnitagSuffix ? 0 : -unitagSuffixTextWidth,
          unitagSlideX: 0,
        }
  }, [shouldAnimateSlide, unitagSuffixTextWidth, showUnitagSuffix])

  return (
    <Flex flexGrow={1} cursor="pointer" onPress={isUnitag ? onPressUnitag : undefined} onLayout={onViewWidthLayout}>
      <Flex
        row
        width={viewWidth}
        opacity={isLayoutReady ? 1 : 0}
        enterStyle={{ opacity: 0 }}
        exitStyle={{ opacity: 0 }}
      >
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
          <AnimatePresence>
            <Flex row zIndex={1} animation="semiBouncy" ml={slideConfig.unitagOffset} x={slideConfig.unitagSlideX}>
              {/*
              We need to calculate this width in order to animate the suffix in and out,
              but we don't want the initial render to show the suffix nor use the space and push other elements to the right.
              So we set it to `position: absolute` on first render and then switch it to `relative` once we have the width.
              */}
              <Flex position={isLayoutReady ? 'relative' : 'absolute'} onLayout={onUnitagSuffixTextLayout}>
                <Text animation="semiBouncy" color="$neutral3" opacity={showUnitagSuffix ? 1 : 0} variant="subheading1">
                  {UNITAG_SUFFIX}
                </Text>
              </Flex>
              <Flex zIndex={2} alignSelf="center" backgroundColor="$background" animation="semiBouncy" pl="$spacing4">
                <Unitag size={unitagIconSize} />
              </Flex>
            </Flex>
          </AnimatePresence>
        )}
      </Flex>

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

export const AnimatedUnitagDisplayName = memo(_AnimatedUnitagDisplayName)
