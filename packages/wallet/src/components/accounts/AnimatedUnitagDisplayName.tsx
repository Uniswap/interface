import { impactAsync } from 'expo-haptics'
import { useState } from 'react'
import { LayoutChangeEvent } from 'react-native'
import { AnimatePresence, Flex, Icons, Text, TouchableArea } from 'ui/src'
import { IconSizeTokens } from 'ui/src/theme'
import { pushNotification } from 'wallet/src/features/notifications/slice'
import { AppNotificationType, CopyNotificationType } from 'wallet/src/features/notifications/types'
import { UNITAG_SUFFIX } from 'wallet/src/features/unitags/constants'
import { DisplayName, DisplayNameType } from 'wallet/src/features/wallet/types'
import { useAppDispatch } from 'wallet/src/state'
import { sanitizeAddressText, shortenAddress } from 'wallet/src/utils/addresses'
import { setClipboard } from 'wallet/src/utils/clipboard'

type AnimatedUnitagDisplayNameProps = {
  displayName: DisplayName
  unitagIconSize?: IconSizeTokens | number
  address?: string
}

export function AnimatedUnitagDisplayName({
  displayName,
  unitagIconSize = '$icon.24',
  address,
}: AnimatedUnitagDisplayNameProps): JSX.Element {
  const dispatch = useAppDispatch()
  const [showUnitagSuffix, setShowUnitagSuffix] = useState(false)
  const [textWidth, setTextWidth] = useState(0)
  const isUnitag = displayName?.type === DisplayNameType.Unitag

  const onTextLayout = (event: LayoutChangeEvent): void => {
    setTextWidth(event.nativeEvent.layout.width)
  }

  const onPressUnitag = (): void => {
    setShowUnitagSuffix(!showUnitagSuffix)
  }

  const onPressCopyAddress = async (): Promise<void> => {
    if (!address) {
      return
    }

    await impactAsync()
    await setClipboard(address)
    dispatch(
      pushNotification({
        type: AppNotificationType.Copied,
        copyType: CopyNotificationType.Address,
      })
    )
  }

  return (
    <Flex onPress={isUnitag ? onPressUnitag : undefined}>
      <Flex row>
        <Text color="$neutral1" variant="subheading1">
          {displayName.name}
        </Text>
        <AnimatePresence>
          <Flex row animation="semiBouncy" ml={-textWidth} x={showUnitagSuffix ? textWidth : 0}>
            <Flex onLayout={onTextLayout}>
              <Text
                animation="semiBouncy"
                color="$neutral3"
                opacity={showUnitagSuffix ? 1 : 0}
                variant="subheading1">
                {UNITAG_SUFFIX}
              </Text>
            </Flex>
            {isUnitag ? (
              <Flex animation="semiBouncy" pl="$spacing4">
                <Icons.Unitag size={unitagIconSize} />
              </Flex>
            ) : null}
            {address && (
              <TouchableArea
                hapticFeedback
                hitSlop={20}
                pl="$spacing8"
                onPress={onPressCopyAddress}>
                <Flex row alignItems="center" gap="$spacing4">
                  <Text color="$neutral3" numberOfLines={1} variant="body2">
                    {sanitizeAddressText(shortenAddress(address))}
                  </Text>
                  <Icons.CopyAlt color="$neutral3" size="$icon.16" />
                </Flex>
              </TouchableArea>
            )}
          </Flex>
        </AnimatePresence>
      </Flex>
    </Flex>
  )
}
