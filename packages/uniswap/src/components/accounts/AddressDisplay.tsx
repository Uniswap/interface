import { SharedEventName } from '@uniswap/analytics-events'
import { PropsWithChildren, useMemo, useState } from 'react'
import type { FlexAlignType, LayoutChangeEvent } from 'react-native'
import { useDispatch } from 'react-redux'
import { ColorTokens, Flex, SpaceTokens, Text, TextProps, TouchableArea } from 'ui/src'
import { CopySheets } from 'ui/src/components/icons/CopySheets'
import { fonts } from 'ui/src/theme'
import { DisplayNameText } from 'uniswap/src/components/accounts/DisplayNameText'
import { useUniswapContext } from 'uniswap/src/contexts/UniswapContext'
import { AccountIcon } from 'uniswap/src/features/accounts/AccountIcon'
import { DisplayNameType } from 'uniswap/src/features/accounts/types'
import { useAvatar } from 'uniswap/src/features/address/avatar'
import { pushNotification } from 'uniswap/src/features/notifications/slice'
import { AppNotificationType, CopyNotificationType } from 'uniswap/src/features/notifications/types'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { sanitizeAddressText } from 'uniswap/src/utils/addresses'
import { setClipboard } from 'uniswap/src/utils/clipboard'
import { shortenAddress } from 'utilities/src/addresses'
import { isWeb } from 'utilities/src/platform'

type AddressDisplayProps = {
  address: string
  overrideDisplayName?: string
  allowFontScaling?: boolean
  lineHeight?: number
  hideAddressInSubtitle?: boolean
  size?: number
  variant?: keyof typeof fonts
  textColor?: ColorTokens
  alignItems?: 'flex-start' | 'center'
  captionTextColor?: ColorTokens
  captionVariant?: keyof typeof fonts
  centered?: boolean
  direction?: 'row' | 'column'
  showCopy?: boolean
  showCopyWrapperButton?: boolean
  showAccountIcon?: boolean
  contentAlign?: FlexAlignType
  showIconBackground?: boolean
  showIconBorder?: boolean
  includeUnitagSuffix?: boolean
  horizontalGap?: SpaceTokens
  notificationsBadgeContainer?: ({ children, address }: { children: JSX.Element; address: string }) => JSX.Element
  gapBetweenLines?: SpaceTokens
  showViewOnlyBadge?: boolean

  // TODO WALL-4545 Added flag to disable forced width causing trouble in other screens
  disableForcedWidth?: boolean
  // TODO WALL-4545 Consider if this is still needed after removing forced width implementation
  displayNameTextAlign?: TextProps['textAlign']
}

type CopyButtonWrapperProps = {
  onPress?: () => void
  backgroundColor?: string
}

function CopyButtonWrapper({ children, onPress }: PropsWithChildren<CopyButtonWrapperProps>): JSX.Element {
  if (onPress) {
    return (
      <TouchableArea hitSlop={16} testID={TestID.Copy} onPress={onPress}>
        {children}
      </TouchableArea>
    )
  }

  return <>{children}</>
}

/** Helper component to display identicon and formatted address */

export function AddressDisplay({
  allowFontScaling = true,
  overrideDisplayName,
  lineHeight,
  address,
  size = 24,
  variant = 'body1',
  textColor = '$neutral1',
  alignItems = 'center',
  captionTextColor = '$neutral2',
  captionVariant = 'subheading2',
  centered,
  hideAddressInSubtitle,
  direction = 'row',
  showCopy = false,
  showCopyWrapperButton = false,
  showAccountIcon = true,
  showIconBackground,
  showIconBorder,
  horizontalGap = '$spacing12',
  showViewOnlyBadge = false,
  notificationsBadgeContainer,
  includeUnitagSuffix = false,
  gapBetweenLines = '$none',
  disableForcedWidth = false,
  displayNameTextAlign,
}: AddressDisplayProps): JSX.Element {
  const dispatch = useDispatch()
  const { useWalletDisplayName } = useUniswapContext()
  const displayName = useWalletDisplayName(address, { includeUnitagSuffix, overrideDisplayName })
  const { avatar } = useAvatar(address)
  const [wrapperWidth, setWrapperWidth] = useState<number | undefined>()

  const showAddressAsSubtitle = !hideAddressInSubtitle && displayName?.type !== DisplayNameType.Address

  const onPressCopyAddress = async (): Promise<void> => {
    if (!address) {
      return
    }

    await setClipboard(address)
    dispatch(
      pushNotification({
        type: AppNotificationType.Copied,
        copyType: CopyNotificationType.Address,
      }),
    )
    sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, {
      element: ElementName.CopyAddress,
    })
  }

  // Extract sizes so copy icon can match font variants
  const mainSize = fonts[variant].fontSize
  const captionSize = fonts[captionVariant].fontSize

  const icon = useMemo(() => {
    return (
      <AccountIcon
        address={address}
        avatarUri={avatar}
        showBackground={showIconBackground}
        showBorder={showIconBorder}
        showViewOnlyBadge={showViewOnlyBadge}
        size={size}
      />
    )
  }, [address, avatar, showIconBackground, showIconBorder, showViewOnlyBadge, size])

  return (
    <Flex
      shrink
      flexDirection={direction}
      alignItems={alignItems}
      gap={horizontalGap}
      onLayout={(e: LayoutChangeEvent) => {
        isWeb && setWrapperWidth(e.nativeEvent.layout.width)
      }}
    >
      {showAccountIcon &&
        (notificationsBadgeContainer ? notificationsBadgeContainer({ children: icon, address }) : icon)}
      <Flex flexShrink={1} gap={gapBetweenLines}>
        <CopyButtonWrapper onPress={showCopy && !showAddressAsSubtitle ? onPressCopyAddress : undefined}>
          <Flex row centered={centered} gap="$spacing12">
            <DisplayNameText
              disableForcedWidth={disableForcedWidth}
              displayName={displayName}
              forcedWidth={wrapperWidth}
              gap="$spacing4"
              includeUnitagSuffix={includeUnitagSuffix}
              textProps={{
                adjustsFontSizeToFit: true,
                allowFontScaling,
                color: textColor,
                ellipsizeMode: 'tail',
                fontFamily: '$heading',
                fontSize: mainSize,
                lineHeight: lineHeight ?? fonts[variant].lineHeight,
                numberOfLines: 1,
                testID: `address-display/name/${displayName?.name}`,
                textAlign: displayNameTextAlign,
              }}
              unitagIconSize={mainSize}
              flexShrink={1}
              centered={centered}
            />
            {showCopy && !showAddressAsSubtitle && <CopySheets color="$neutral1" size={mainSize} />}
          </Flex>
        </CopyButtonWrapper>
        {showAddressAsSubtitle && (
          <AddressSubtitle
            address={address}
            captionSize={captionSize}
            captionTextColor={captionTextColor}
            captionVariant={captionVariant}
            centered={centered}
            showCopy={showCopy}
            showCopyWrapperButton={showCopyWrapperButton}
            onPressCopyAddress={onPressCopyAddress}
          />
        )}
      </Flex>
    </Flex>
  )
}

const AddressSubtitle = ({
  address,
  captionTextColor,
  captionVariant,
  captionSize,
  centered,
  showCopy,
  showCopyWrapperButton,
  onPressCopyAddress,
}: { captionSize: number; onPressCopyAddress: () => Promise<void> } & Pick<
  AddressDisplayProps,
  'address' | 'captionTextColor' | 'captionVariant' | 'centered' | 'showCopy' | 'showCopyWrapperButton'
>): JSX.Element => (
  <CopyButtonWrapper onPress={showCopy ? onPressCopyAddress : undefined}>
    <Flex
      row
      centered={centered}
      alignItems="center"
      backgroundColor={showCopyWrapperButton ? '$surface2' : '$transparent'}
      borderRadius="$roundedFull"
      gap="$spacing4"
      mt={showCopyWrapperButton ? '$spacing8' : '$none'}
      px={showCopyWrapperButton ? '$spacing8' : '$none'}
      py={showCopyWrapperButton ? '$spacing4' : '$none'}
    >
      <Text color={captionTextColor} variant={captionVariant}>
        {sanitizeAddressText(shortenAddress(address, 6))}
      </Text>
      {showCopy && <CopySheets color={captionTextColor} size={captionSize} />}
    </Flex>
  </CopyButtonWrapper>
)
