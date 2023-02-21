import { default as React, PropsWithChildren, useMemo } from 'react'
import { FlexAlignType } from 'react-native'
import { useAppDispatch, useAppTheme } from 'src/app/hooks'
import CopyIcon from 'src/assets/icons/copy-sheets.svg'
import { AccountIcon } from 'src/components/AccountIcon'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { Box, Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { useENSAvatar } from 'src/features/ens/api'
import { pushNotification } from 'src/features/notifications/notificationSlice'
import { AppNotificationType } from 'src/features/notifications/types'
import { ElementName } from 'src/features/telemetry/constants'
import { useDisplayName } from 'src/features/wallet/hooks'
import { Theme } from 'src/styles/theme'
import { sanitizeAddressText, shortenAddress } from 'src/utils/addresses'
import { setClipboard } from 'src/utils/clipboard'

type AddressDisplayProps = {
  address: string
  hideAddressInSubtitle?: boolean
  size?: number
  variant?: keyof Theme['textVariants']
  captionVariant?: keyof Theme['textVariants']
  direction?: 'row' | 'column'
  showCopy?: boolean
  showCopyWrapperButton?: boolean
  showAccountIcon?: boolean
  contentAlign?: FlexAlignType
  showIconBackground?: boolean
  textAlign?: FlexAlignType
  horizontalGap?: keyof Theme['spacing']
}

type CopyButtonWrapperProps = {
  onPress?: () => void
  backgroundColor?: string
}

function CopyButtonWrapper({
  children,
  onPress,
}: PropsWithChildren<CopyButtonWrapperProps>): JSX.Element {
  if (onPress)
    return (
      <TouchableArea
        hapticFeedback
        name={ElementName.Copy}
        testID={ElementName.Copy}
        onPress={onPress}>
        {children}
      </TouchableArea>
    )

  return <>{children}</>
}

/** Helper component to display identicon and formatted address */
export function AddressDisplay({
  address,
  size = 24,
  variant = 'bodyLarge',
  captionVariant = 'subheadSmall',
  hideAddressInSubtitle,
  direction = 'row',
  showCopy = false,
  showCopyWrapperButton = false,
  showAccountIcon = true,
  textAlign,
  contentAlign = 'center', // vertical aligment of all items
  showIconBackground,
  horizontalGap = 'spacing12',
}: AddressDisplayProps): JSX.Element {
  const dispatch = useAppDispatch()
  const theme = useAppTheme()
  const displayName = useDisplayName(address)
  const { data: avatar } = useENSAvatar(address)

  const showAddressAsSubtitle = !hideAddressInSubtitle && displayName?.type !== 'address'

  const onPressCopyAddress = (): void => {
    if (!address) return
    dispatch(pushNotification({ type: AppNotificationType.Copied }))
    setClipboard(address)
  }

  // Extract sizes so copy icon can match font variants
  const mainSize = theme.textVariants[variant].fontSize
  const captionSize = theme.textVariants[captionVariant].fontSize
  const itemAlignment =
    textAlign || (!showAccountIcon || direction === 'column' ? 'center' : 'flex-start')

  const icon = useMemo(() => {
    return (
      <AccountIcon
        address={address}
        avatarUri={avatar}
        showBackground={showIconBackground}
        size={size}
      />
    )
  }, [address, avatar, showIconBackground, size])

  return (
    <Flex alignItems={contentAlign} flexDirection={direction} gap={horizontalGap}>
      {showAccountIcon && icon}
      <Box alignItems={itemAlignment} flexShrink={1}>
        <CopyButtonWrapper
          onPress={showCopy && !showAddressAsSubtitle ? onPressCopyAddress : undefined}>
          <Flex centered row gap="spacing12">
            <Text
              color="textPrimary"
              ellipsizeMode="tail"
              numberOfLines={1}
              testID={`address-display/name/${displayName?.name}`}
              variant={variant}>
              {displayName?.name}
            </Text>
            {showCopy && !showAddressAsSubtitle && (
              <CopyIcon color={theme.colors.textPrimary} height={mainSize} width={mainSize} />
            )}
          </Flex>
        </CopyButtonWrapper>
        {showAddressAsSubtitle && (
          <CopyButtonWrapper onPress={showCopy ? onPressCopyAddress : undefined}>
            <Flex
              centered
              row
              backgroundColor={showCopyWrapperButton ? 'backgroundOverlay' : 'none'}
              borderRadius="roundedFull"
              gap="spacing4"
              marginTop={showCopyWrapperButton ? 'spacing8' : 'none'}
              px={showCopyWrapperButton ? 'spacing8' : 'none'}
              py={showCopyWrapperButton ? 'spacing4' : 'none'}>
              <Text color="textSecondary" variant={captionVariant}>
                {sanitizeAddressText(shortenAddress(address))}
              </Text>
              {showCopy && (
                <CopyIcon
                  color={theme.colors.textSecondary}
                  height={captionSize}
                  width={captionSize}
                />
              )}
            </Flex>
          </CopyButtonWrapper>
        )}
      </Box>
    </Flex>
  )
}
