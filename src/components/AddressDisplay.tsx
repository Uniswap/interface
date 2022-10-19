import { LayoutProps } from '@shopify/restyle'
import { default as React, PropsWithChildren, useMemo } from 'react'
import { FlexAlignType } from 'react-native'
import { useAppDispatch, useAppTheme } from 'src/app/hooks'
import CopyIcon from 'src/assets/icons/copy-sheets.svg'
import { Button } from 'src/components/buttons/Button'
import { Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { AvatarWithVisibilityBadge } from 'src/components/unicons/AvatarWithVisibilityBadge'
import { UniconWithVisibilityBadge } from 'src/components/unicons/UniconWithVisibilityBadge'
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
  showAddressAsSubtitle?: boolean
  size?: number
  variant?: keyof Theme['textVariants']
  color?: keyof Theme['colors']
  captionVariant?: keyof Theme['textVariants']
  captionColor?: keyof Theme['colors']
  verticalGap?: keyof Theme['spacing']
  horizontalGap?: keyof Theme['spacing']
  direction?: 'row' | 'column'
  showCopy?: boolean
  showUnicon?: boolean
  showViewOnly?: boolean
  showShortenedEns?: boolean
  textAlign?: FlexAlignType
} & LayoutProps<Theme>

type CopyButtonWrapperProps = {
  onPress?: () => void
}

function CopyButtonWrapper({ children, onPress }: PropsWithChildren<CopyButtonWrapperProps>) {
  if (onPress)
    return (
      <Button name={ElementName.Copy} testID={ElementName.Copy} onPress={onPress}>
        {children}
      </Button>
    )

  return <>{children}</>
}

/** Helper component to display identicon and formatted address */
export function AddressDisplay({
  address,
  size = 24,
  variant = 'bodyLarge',
  color = 'textPrimary',
  captionVariant = 'subheadSmall',
  captionColor = 'textSecondary',
  verticalGap = 'xxs',
  horizontalGap = 'sm',
  showAddressAsSubtitle,
  direction = 'row',
  showCopy = false,
  showUnicon = true,
  showViewOnly = false,
  showShortenedEns = false,
  textAlign,
  ...rest
}: AddressDisplayProps) {
  const dispatch = useAppDispatch()
  const theme = useAppTheme()
  const displayName = useDisplayName(address, showShortenedEns)
  const { data: avatar } = useENSAvatar(address)

  const onPressCopyAddress = () => {
    if (!address) return
    dispatch(pushNotification({ type: AppNotificationType.Copied }))
    setClipboard(address)
  }

  // Extract sizes so copy icon can match font variants
  const mainSize = theme.textVariants[variant].fontSize
  const captionSize = theme.textVariants[captionVariant].fontSize

  // Use ENS avatar if found, if not revert to Unicon
  const icon = useMemo(() => {
    if (avatar) {
      return (
        <AvatarWithVisibilityBadge
          avatarUri={avatar}
          showViewOnlyBadge={showViewOnly}
          size={size}
        />
      )
    } else {
      return (
        <UniconWithVisibilityBadge address={address} showViewOnlyBadge={showViewOnly} size={size} />
      )
    }
  }, [address, avatar, showViewOnly, size])

  return (
    <Flex alignItems="center" flexDirection={direction} gap={horizontalGap} {...rest}>
      {showUnicon && icon}
      <Flex
        alignItems={textAlign || (!showUnicon || direction === 'column' ? 'center' : 'flex-start')}
        flexShrink={1}
        gap={verticalGap}>
        <CopyButtonWrapper
          onPress={showCopy && !showAddressAsSubtitle ? onPressCopyAddress : undefined}>
          <Flex centered row gap="sm">
            <Text
              color={color}
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
            <Flex centered row gap="sm">
              <Text color={captionColor} variant={captionVariant}>
                {sanitizeAddressText(shortenAddress(address))}
              </Text>
              {showCopy && (
                <CopyIcon
                  color={theme.colors[captionColor]}
                  height={captionSize}
                  width={captionSize}
                />
              )}
            </Flex>
          </CopyButtonWrapper>
        )}
      </Flex>
    </Flex>
  )
}
