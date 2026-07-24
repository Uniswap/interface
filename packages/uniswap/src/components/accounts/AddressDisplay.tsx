import { useMemo } from 'react'
import type { FlexAlignType } from 'react-native'
import { ColorTokens, Flex, SpaceTokens, Text } from 'ui/src'
import { fonts } from 'ui/src/theme'
import { DisplayNameText } from 'uniswap/src/components/accounts/DisplayNameText'
import { CopyHelper } from 'uniswap/src/components/CopyHelper/CopyHelper'
import { useUniswapContext } from 'uniswap/src/contexts/UniswapContext'
import { AccountIcon } from 'uniswap/src/features/accounts/AccountIcon'
import { DisplayNameType } from 'uniswap/src/features/accounts/types'
import { CopyNotificationType } from 'uniswap/src/features/notifications/slice/types'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { sanitizeAddressText } from 'uniswap/src/utils/addresses'
import { shortenAddress } from 'utilities/src/addresses'

type AddressDisplayProps = {
  address: string
  overrideDisplayName?: string
  allowFontScaling?: boolean
  // Opt out of adjustsFontSizeToFit auto-shrink; use where the name is a fixed-width address, not an ENS/unitag
  disableAutoFontSizing?: boolean
  lineHeight?: number
  hideAddressInSubtitle?: boolean
  size?: number
  variant?: keyof typeof fonts
  textColor?: ColorTokens
  textHoverColor?: ColorTokens
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
  addressNumVisibleCharacters?: 4 | 6 | 8
  grow?: boolean
}

/** Helper component to display AccountIcon and formatted address */

// oxlint-disable-next-line complexity
export function AddressDisplay({
  allowFontScaling = true,
  disableAutoFontSizing = false,
  overrideDisplayName,
  lineHeight,
  address,
  size = 24,
  variant = 'body1',
  textColor = '$neutral1',
  textHoverColor,
  captionTextColor = '$neutral2',
  captionVariant = 'subheading2',
  centered,
  hideAddressInSubtitle = false,
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
  addressNumVisibleCharacters = 6,
  alignItems = 'center',
  grow,
}: AddressDisplayProps): JSX.Element {
  const { useWalletDisplayName } = useUniswapContext()
  const displayName = useWalletDisplayName(address, { includeUnitagSuffix, overrideDisplayName })

  const showAddressAsSubtitle = !hideAddressInSubtitle && displayName?.type !== DisplayNameType.Address

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
      />
    )
  }, [address, showIconBackground, showIconBorder, showViewOnlyBadge, size])

  return (
    <Flex shrink grow={grow} flexDirection={direction} gap={horizontalGap} alignItems={alignItems}>
      {showAccountIcon && (
        <Flex centered={centered}>
          {notificationsBadgeContainer ? notificationsBadgeContainer({ children: icon, address }) : icon}
        </Flex>
      )}
      <Flex shrink gap={gapBetweenLines}>
        <Flex row gap="$spacing12">
          {showCopy && !showAddressAsSubtitle ? (
            <CopyHelper
              toCopy={address}
              iconSize={mainSize}
              iconColor="$neutral1"
              testID={TestID.Copy}
              copyNotificationType={CopyNotificationType.Address}
              analyticsElement={ElementName.CopyAddress}
            >
              <DisplayNameText
                displayName={displayName}
                gap="$spacing4"
                includeUnitagSuffix={includeUnitagSuffix}
                textProps={{
                  adjustsFontSizeToFit: !disableAutoFontSizing,
                  allowFontScaling,
                  color: textColor,
                  hoverStyle: textHoverColor ? { color: textHoverColor } : undefined,
                  ellipsizeMode: 'tail',
                  fontFamily: '$heading',
                  fontSize: mainSize,
                  lineHeight: lineHeight ?? fonts[variant].lineHeight,
                  numberOfLines: 1,
                  testID: `address-display/name/${displayName?.name}`,
                  textAlign: centered ? 'center' : undefined,
                }}
                unitagIconSize={mainSize}
                flexShrink={1}
                centered={centered}
              />
            </CopyHelper>
          ) : (
            <DisplayNameText
              displayName={displayName}
              gap="$spacing4"
              includeUnitagSuffix={includeUnitagSuffix}
              textProps={{
                adjustsFontSizeToFit: !disableAutoFontSizing,
                allowFontScaling,
                color: textColor,
                hoverStyle: textHoverColor ? { color: textHoverColor } : undefined,
                ellipsizeMode: 'tail',
                fontFamily: '$heading',
                fontSize: mainSize,
                lineHeight: lineHeight ?? fonts[variant].lineHeight,
                numberOfLines: 1,
                testID: `address-display/name/${displayName?.name}`,
                textAlign: centered ? 'center' : undefined,
              }}
              unitagIconSize={mainSize}
              flexShrink={1}
              centered={centered}
            />
          )}
        </Flex>

        <Flex centered={centered}>
          {showAddressAsSubtitle && (
            <AddressSubtitle
              address={address}
              captionSize={captionSize}
              captionTextColor={captionTextColor}
              captionVariant={captionVariant}
              centered={centered}
              showCopy={showCopy}
              showCopyWrapperButton={showCopyWrapperButton}
              addressNumVisibleCharacters={addressNumVisibleCharacters}
            />
          )}
        </Flex>
      </Flex>
    </Flex>
  )
}

type AddressSubtitleProps = {
  captionSize: number
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
  addressNumVisibleCharacters = 6,
}: AddressSubtitleProps): JSX.Element => (
  <Flex
    row
    centered={centered}
    alignItems="center"
    backgroundColor={showCopyWrapperButton ? '$surface2' : '$transparent'}
    borderRadius="$roundedFull"
    mt={showCopyWrapperButton ? '$spacing8' : '$none'}
    px={showCopyWrapperButton ? '$spacing8' : '$none'}
    py={showCopyWrapperButton ? '$spacing4' : '$none'}
  >
    {showCopy ? (
      <CopyHelper
        toCopy={address}
        iconSize={captionSize}
        iconPosition="right"
        iconColor={captionTextColor}
        testID={TestID.Copy}
        copyNotificationType={CopyNotificationType.Address}
        analyticsElement={ElementName.CopyAddress}
      >
        <Text color={captionTextColor} variant={captionVariant}>
          {sanitizeAddressText(shortenAddress({ address, chars: addressNumVisibleCharacters }))}
        </Text>
      </CopyHelper>
    ) : (
      <Text color={captionTextColor} variant={captionVariant}>
        {sanitizeAddressText(shortenAddress({ address, chars: addressNumVisibleCharacters }))}
      </Text>
    )}
  </Flex>
)
