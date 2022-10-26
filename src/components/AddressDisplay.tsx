import { LayoutProps } from '@shopify/restyle'
import { default as React, PropsWithChildren, useMemo } from 'react'
import { FlexAlignType } from 'react-native'
import { useAppDispatch, useAppTheme } from 'src/app/hooks'
import CopyIcon from 'src/assets/icons/copy-sheets.svg'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { Box, Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { AvatarWithVisibilityBadge } from 'src/components/unicons/AvatarWithVisibilityBadge'
import { UniconWithVisibilityBadge } from 'src/components/unicons/UniconWithVisibilityBadge'
import { useENSAvatar } from 'src/features/ens/api'
import { pushNotification } from 'src/features/notifications/notificationSlice'
import { AppNotificationType } from 'src/features/notifications/types'
import { ElementName } from 'src/features/telemetry/constants'
import { Account, AccountType } from 'src/features/wallet/accounts/types'
import { useAccounts, useDisplayName } from 'src/features/wallet/hooks'
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
  subtitleOverrideText?: string
  showCopy?: boolean
  showUnicon?: boolean
  textAlign?: FlexAlignType
} & LayoutProps<Theme>

type CopyButtonWrapperProps = {
  onPress?: () => void
}

function CopyButtonWrapper({ children, onPress }: PropsWithChildren<CopyButtonWrapperProps>) {
  if (onPress)
    return (
      <TouchableArea name={ElementName.Copy} testID={ElementName.Copy} onPress={onPress}>
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
  subtitleOverrideText,
  direction = 'row',
  showCopy = false,
  showUnicon = true,
  textAlign,
  ...rest
}: AddressDisplayProps) {
  const dispatch = useAppDispatch()
  const theme = useAppTheme()
  const displayName = useDisplayName(address)
  const { data: avatar } = useENSAvatar(address)
  const accounts = useAccounts()

  const showAddressAsSubtitle = !hideAddressInSubtitle && displayName?.type !== 'address'
  const account: Account | undefined = accounts[address]
  const isViewOnly = account?.type === AccountType.Readonly

  const onPressCopyAddress = () => {
    if (!address) return
    dispatch(pushNotification({ type: AppNotificationType.Copied }))
    setClipboard(address)
  }

  // Extract sizes so copy icon can match font variants
  const mainSize = theme.textVariants[variant].fontSize
  const captionSize = theme.textVariants[captionVariant].fontSize
  const itemAlignment =
    textAlign || (!showUnicon || direction === 'column' ? 'center' : 'flex-start')

  // Use ENS avatar if found, if not revert to Unicon
  const icon = useMemo(() => {
    if (avatar) {
      return (
        <AvatarWithVisibilityBadge avatarUri={avatar} showViewOnlyBadge={isViewOnly} size={size} />
      )
    } else {
      return (
        <UniconWithVisibilityBadge address={address} showViewOnlyBadge={isViewOnly} size={size} />
      )
    }
  }, [address, avatar, isViewOnly, size])

  return (
    <Flex alignItems="center" flexDirection={direction} gap="sm" {...rest}>
      {showUnicon && icon}
      <Box alignItems={itemAlignment} flexShrink={1}>
        <CopyButtonWrapper
          onPress={showCopy && !showAddressAsSubtitle ? onPressCopyAddress : undefined}>
          <Flex centered row gap="sm">
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
        {/* If subtitle is defined show it, otherwise revert to address logic */}
        {subtitleOverrideText ? (
          <Text color="textTertiary" variant={captionVariant}>
            {subtitleOverrideText}
          </Text>
        ) : (
          showAddressAsSubtitle && (
            <CopyButtonWrapper onPress={showCopy ? onPressCopyAddress : undefined}>
              <Flex centered row gap="sm">
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
          )
        )}
      </Box>
    </Flex>
  )
}
