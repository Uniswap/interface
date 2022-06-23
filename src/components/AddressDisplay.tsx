import React from 'react'
import { useTranslation } from 'react-i18next'
import { useAppTheme } from 'src/app/hooks'
import CopyIcon from 'src/assets/icons/copy-sheets.svg'
import { Identicon } from 'src/components/accounts/Identicon'
import { IdenticonWithNotificationBadge } from 'src/components/accounts/IdenticonWithNotificationBadge'
import { Button } from 'src/components/buttons/Button'
import { Box, Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { ElementName } from 'src/features/telemetry/constants'
import { useDisplayName } from 'src/features/wallet/hooks'
import { Theme } from 'src/styles/theme'
import { shortenAddress } from 'src/utils/addresses'
import { setClipboard } from 'src/utils/clipboard'
import { opacify } from 'src/utils/colors'

type AddressDisplayProps = {
  address: string
  showAddressAsSubtitle?: boolean
  size?: number
  variant?: keyof Theme['textVariants']
  captionVariant?: keyof Theme['textVariants']
  captionColor?: keyof Theme['colors']
  verticalGap?: keyof Theme['spacing']
  showNotificationBadge?: boolean
  direction?: 'row' | 'column'
  showCopy?: boolean
  showViewOnly?: boolean
}

/** Helper component to display identicon and formatted address */
export function AddressDisplay({
  address,
  size = 24,
  variant = 'body1',
  captionVariant = 'caption',
  captionColor = 'textSecondary',
  verticalGap = 'xxs',
  showAddressAsSubtitle,
  showNotificationBadge,
  direction = 'row',
  showCopy = false,
  showViewOnly,
}: AddressDisplayProps) {
  const { t } = useTranslation()
  const theme = useAppTheme()
  const displayName = useDisplayName(address)
  const nameTypeIsAddress = displayName?.type === 'address'

  const onPressCopyAddress = () => {
    if (!address) return
    setClipboard(address)
  }

  const showCaption = showAddressAsSubtitle && !nameTypeIsAddress

  // Extract sizes so copy icon can match font variants
  const mainSize = theme.textVariants[variant].fontSize
  const captionSize = theme.textVariants[captionVariant].fontSize

  return (
    <Flex alignItems="center" flexDirection={direction} gap="sm">
      {showNotificationBadge ? (
        <IdenticonWithNotificationBadge address={address} size={size} />
      ) : (
        <Identicon address={address} size={size} />
      )}
      <Flex alignItems={direction === 'column' ? 'center' : 'flex-start'} gap={verticalGap}>
        <Flex centered row gap="sm">
          <Text
            color="textPrimary"
            testID={`address-display/name/${displayName?.name}`}
            variant={variant}>
            {displayName?.name}
          </Text>
          {showCopy && !showCaption && (
            <Button name={ElementName.Copy} onPress={onPressCopyAddress}>
              <CopyIcon color={theme.colors.textPrimary} height={mainSize} width={mainSize} />
            </Button>
          )}
          {showViewOnly && (
            <Box
              borderRadius="md"
              px="xs"
              py="xxs"
              style={{ backgroundColor: opacify(8, theme.colors.textSecondary) }}>
              <Text color="textPrimary" variant="caption">
                {t('View only')}
              </Text>
            </Box>
          )}
        </Flex>
        {showCaption && (
          <Flex centered row gap="sm">
            <Text color={captionColor} variant={captionVariant}>
              {shortenAddress(address)}
            </Text>
            {showCopy && (
              <Button name={ElementName.Copy} onPress={onPressCopyAddress}>
                <CopyIcon
                  color={theme.colors[captionColor]}
                  height={captionSize}
                  width={captionSize}
                />
              </Button>
            )}
          </Flex>
        )}
      </Flex>
    </Flex>
  )
}
