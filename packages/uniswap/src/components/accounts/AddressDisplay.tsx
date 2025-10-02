import { SharedEventName } from '@uniswap/analytics-events'
import { PropsWithChildren, useMemo, useState } from 'react'
import type { FlexAlignType, LayoutChangeEvent } from 'react-native'
import { useDispatch } from 'react-redux'
import {
  AnimatableCopyIcon,
  ColorTokens,
  Flex,
  HeightAnimator,
  SpaceTokens,
  Text,
  TextProps,
  TouchableArea,
} from 'ui/src'
import { fonts } from 'ui/src/theme'
import { DisplayNameText } from 'uniswap/src/components/accounts/DisplayNameText'
import { useUniswapContext } from 'uniswap/src/contexts/UniswapContext'
import { AccountIcon } from 'uniswap/src/features/accounts/AccountIcon'
import { DisplayNameType } from 'uniswap/src/features/accounts/types'
import { pushNotification } from 'uniswap/src/features/notifications/slice/slice'
import { AppNotificationType, CopyNotificationType } from 'uniswap/src/features/notifications/slice/types'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { sanitizeAddressText } from 'uniswap/src/utils/addresses'
import { setClipboard } from 'uniswap/src/utils/clipboard'
import { shortenAddress } from 'utilities/src/addresses'
import { isWebApp, isWebPlatform } from 'utilities/src/platform'
import { useBooleanState } from 'utilities/src/react/useBooleanState'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import { useTimeout } from 'utilities/src/time/timing'

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
  flexGrow?: boolean
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
  addressNumVisibleCharacters?: 4 | 6
  accountIconTransition?: string

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

/** Helper component to display AccountIcon and formatted address */

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
  flexGrow = true,
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
  addressNumVisibleCharacters = 6,
  accountIconTransition,
}: AddressDisplayProps): JSX.Element {
  const dispatch = useDispatch()
  const { useWalletDisplayName } = useUniswapContext()
  const displayName = useWalletDisplayName(address, { includeUnitagSuffix, overrideDisplayName })
  const [wrapperWidth, setWrapperWidth] = useState<number | undefined>()
  // TODO (PORT-431): Make a general/shared CopyHelper component
  const { value: isCopied, setTrue: setIsCopied, setFalse: setIsNotCopied } = useBooleanState(false)

  const showAddressAsSubtitle = !hideAddressInSubtitle && displayName?.type !== DisplayNameType.Address

  const onPressCopyAddress = async (): Promise<void> => {
    if (!address) {
      return
    }

    await setClipboard(address)
    setIsCopied()
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

  // Auto-reset copied state after 1 second
  useTimeout(setIsNotCopied, isCopied ? ONE_SECOND_MS : -1)

  // Extract sizes so copy icon can match font variants
  const mainSize = fonts[variant].fontSize
  const captionSize = fonts[captionVariant].fontSize

  const icon = useMemo(() => {
    return (
      <AccountIcon
        address={address}
        showBackground={showIconBackground}
        showBorder={showIconBorder}
        showViewOnlyBadge={showViewOnlyBadge}
        size={size}
        transition={accountIconTransition}
      />
    )
  }, [address, showIconBackground, showIconBorder, showViewOnlyBadge, size, accountIconTransition])

  return (
    <Flex
      shrink
      flexDirection={direction}
      alignItems={alignItems}
      gap={horizontalGap}
      onLayout={(e: LayoutChangeEvent) => {
        isWebPlatform && setWrapperWidth(e.nativeEvent.layout.width)
      }}
    >
      {showAccountIcon &&
        (notificationsBadgeContainer ? notificationsBadgeContainer({ children: icon, address }) : icon)}
      <Flex flexGrow={flexGrow ? 1 : undefined} gap={gapBetweenLines}>
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
            {showCopy && !showAddressAsSubtitle && (
              <AnimatableCopyIcon isAnimated={isWebApp} isCopied={isCopied} size={mainSize} textColor="$neutral1" />
            )}
          </Flex>
        </CopyButtonWrapper>
        <HeightAnimator useInitialHeight open={showAddressAsSubtitle}>
          <AddressSubtitle
            address={address}
            captionSize={captionSize}
            captionTextColor={captionTextColor}
            captionVariant={captionVariant}
            centered={centered}
            showCopy={showCopy}
            showCopyWrapperButton={showCopyWrapperButton}
            addressNumVisibleCharacters={addressNumVisibleCharacters}
            isCopied={isCopied}
            onPressCopyAddress={onPressCopyAddress}
          />
        </HeightAnimator>
      </Flex>
    </Flex>
  )
}

type AddressSubtitleProps = {
  captionSize: number
  isCopied: boolean
  onPressCopyAddress: () => Promise<void>
} & Pick<
  AddressDisplayProps,
  | 'address'
  | 'captionTextColor'
  | 'captionVariant'
  | 'centered'
  | 'showCopy'
  | 'showCopyWrapperButton'
  | 'addressNumVisibleCharacters'
>

const AddressSubtitle = ({
  address,
  captionTextColor,
  captionVariant,
  captionSize,
  centered,
  showCopy,
  showCopyWrapperButton,
  onPressCopyAddress,
  addressNumVisibleCharacters = 6,
  isCopied,
}: AddressSubtitleProps): JSX.Element => (
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
        {sanitizeAddressText(shortenAddress({ address, chars: addressNumVisibleCharacters }))}
      </Text>
      {showCopy && (
        <AnimatableCopyIcon isAnimated={isWebApp} isCopied={isCopied} size={captionSize} textColor={captionTextColor} />
      )}
    </Flex>
  </CopyButtonWrapper>
)
