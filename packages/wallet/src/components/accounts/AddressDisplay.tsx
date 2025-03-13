import { SharedEventName } from '@uniswap/analytics-events'
import { PropsWithChildren, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FlexAlignType, LayoutChangeEvent, Platform } from 'react-native'
import { useDispatch } from 'react-redux'
import { ColorTokens, Flex, SpaceTokens, Text, TextProps, TouchableArea } from 'ui/src'
import { CopySheets } from 'ui/src/components/icons'
import { fonts } from 'ui/src/theme'
import { useAvatar } from 'uniswap/src/features/address/avatar'
import { pushNotification } from 'uniswap/src/features/notifications/slice'
import { AppNotificationType, CopyNotificationType } from 'uniswap/src/features/notifications/types'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { sanitizeAddressText } from 'uniswap/src/utils/addresses'
import { setClipboard } from 'uniswap/src/utils/clipboard'
import { shortenAddress } from 'utilities/src/addresses'
import { AccountIcon } from 'wallet/src/components/accounts/AccountIcon'
import { DisplayNameText } from 'wallet/src/components/accounts/DisplayNameText'
import { useDisplayName } from 'wallet/src/features/wallet/hooks'
import { DisplayNameType } from 'wallet/src/features/wallet/types'

type AddressDisplayProps = {
  address: string
  overrideDisplayName?: string
  allowFontScaling?: boolean
  lineHeight?: number
  hideAddressInSubtitle?: boolean
  size?: number
  variant?: keyof typeof fonts
  textColor?: ColorTokens
  captionTextColor?: ColorTokens
  captionVariant?: keyof typeof fonts
  direction?: 'row' | 'column'
  showCopy?: boolean
  showCopyWrapperButton?: boolean
  showAccountIcon?: boolean
  contentAlign?: FlexAlignType
  showIconBackground?: boolean
  showIconBorder?: boolean
  includeUnitagSuffix?: boolean
  textAlign?: FlexAlignType
  horizontalGap?: SpaceTokens
  notificationsBadgeContainer?: ({ children, address }: { children: JSX.Element; address: string }) => JSX.Element
  gapBetweenLines?: SpaceTokens
  showViewOnlyLabel?: boolean
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
  captionTextColor = '$neutral2',
  captionVariant = 'subheading2',
  hideAddressInSubtitle,
  direction = 'row',
  showCopy = false,
  showCopyWrapperButton = false,
  showAccountIcon = true,
  textAlign,
  contentAlign = 'center', // vertical alignment of all items
  showIconBackground,
  showIconBorder,
  horizontalGap = '$spacing12',
  showViewOnlyBadge = false,
  showViewOnlyLabel = false,
  notificationsBadgeContainer,
  includeUnitagSuffix = false,
  gapBetweenLines = '$none',
  disableForcedWidth = false,
  displayNameTextAlign,
}: AddressDisplayProps): JSX.Element {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const displayName = useDisplayName(address, { includeUnitagSuffix, overrideDisplayName })
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
  const itemAlignment = textAlign || (!showAccountIcon || direction === 'column' ? 'center' : 'flex-start')

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
      alignItems={contentAlign}
      flexDirection={direction}
      gap={horizontalGap}
      onLayout={(e: LayoutChangeEvent) => {
        Platform.OS === 'web' && setWrapperWidth(e.nativeEvent.layout.width)
      }}
    >
      {showAccountIcon &&
        (notificationsBadgeContainer ? notificationsBadgeContainer({ children: icon, address }) : icon)}
      <Flex shrink alignItems={itemAlignment} gap={gapBetweenLines}>
        <CopyButtonWrapper onPress={showCopy && !showAddressAsSubtitle ? onPressCopyAddress : undefined}>
          <Flex centered row gap="$spacing12">
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
            showCopy={showCopy}
            showCopyWrapperButton={showCopyWrapperButton}
            onPressCopyAddress={onPressCopyAddress}
          />
        )}
      </Flex>

      {showViewOnlyLabel && (
        <Flex grow alignItems="flex-end" flexBasis="30%" mr="$spacing8">
          <Flex backgroundColor="$surface2" borderRadius="$rounded12" px="$spacing8" py="$spacing4">
            <Text color="$neutral2" variant="body4">
              {t('settings.section.wallet.label.viewOnly')}
            </Text>
          </Flex>
        </Flex>
      )}
    </Flex>
  )
}

const AddressSubtitle = ({
  address,
  captionTextColor,
  captionVariant,
  captionSize,
  showCopy,
  showCopyWrapperButton,
  onPressCopyAddress,
}: { captionSize: number; onPressCopyAddress: () => Promise<void> } & Pick<
  AddressDisplayProps,
  'address' | 'captionTextColor' | 'captionVariant' | 'showCopy' | 'showCopyWrapperButton'
>): JSX.Element => (
  <CopyButtonWrapper onPress={showCopy ? onPressCopyAddress : undefined}>
    <Flex
      centered
      row
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
