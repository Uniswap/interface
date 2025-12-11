import { type BaseSyntheticEvent, useMemo } from 'react'
import { I18nManager, type Role } from 'react-native'
import { Spacer, type YStackProps } from 'tamagui'
import { getMenuItemColor } from 'ui/src/components/dropdownMenuSheet/utils'
import { CheckCircleFilled, ExternalLink } from 'ui/src/components/icons'
import { Flex, type FlexProps } from 'ui/src/components/layout'
import { Text, type TextProps } from 'ui/src/components/text'
import { TouchableArea } from 'ui/src/components/touchable'
import { spacing } from 'ui/src/theme'
import { isMobileApp, isWebPlatform } from 'utilities/src/platform'
import { useEvent } from 'utilities/src/react/hooks'

export type DropdownMenuSheetItemProps = {
  label: string
  icon?: React.ReactNode
  actionType?: 'default' | 'external-link'
  isSelected?: boolean
  disabled?: boolean
  destructive?: boolean
  closeDelay?: number
  textColor?: TextProps['color']
  variant: 'small' | 'medium'
  height?: number
  role?: Role
  subheader?: string
  onPress: () => void
  handleCloseMenu?: () => void
}

export const DropdownMenuSheetItem = ({
  label,
  icon,
  actionType = 'default',
  isSelected,
  disabled,
  destructive,
  closeDelay,
  textColor,
  variant,
  height,
  role = 'button',
  subheader,
  onPress,
  handleCloseMenu,
}: DropdownMenuSheetItemProps): JSX.Element => {
  const handlePress = useEvent((e: BaseSyntheticEvent) => {
    e.stopPropagation()
    e.preventDefault()

    onPress()

    if (handleCloseMenu) {
      if (typeof closeDelay === 'number') {
        setTimeout(handleCloseMenu, closeDelay)
      } else {
        handleCloseMenu()
      }
    }
  })

  const flexDirection: FlexProps['flexDirection'] = I18nManager.isRTL ? 'row-reverse' : 'row'
  const touchableAreaHoverStyle: YStackProps['hoverStyle'] = useMemo(
    () => (disabled ? undefined : { backgroundColor: '$surface1Hovered' }),
    [disabled],
  )

  const textColorValue = useMemo(
    () => getMenuItemColor({ overrideColor: textColor, destructive, disabled }),
    [destructive, textColor, disabled],
  )

  return (
    <TouchableArea
      group
      hoverable
      flexGrow={1}
      py="$spacing8"
      px={variant === 'small' ? '$spacing12' : '$spacing8'}
      gap="$spacing8"
      flexDirection={flexDirection}
      justifyContent="space-between"
      alignItems="center"
      disabled={disabled}
      borderRadius="$rounded12"
      userSelect="none"
      role={role}
      cursor={disabled ? 'default' : 'pointer'}
      backgroundColor="$background"
      height={height}
      hoverStyle={touchableAreaHoverStyle}
      onPress={handlePress}
    >
      <Flex shrink flexDirection={flexDirection} alignItems="center">
        {icon && <Flex flexShrink={0}>{icon}</Flex>}
        {icon && <Spacer size="$spacing8" />}
        {/* Allow text to ellipsize and not overflow the container, because of the padding */}
        {/* on the parent container. */}
        <Flex maxWidth={isWebPlatform ? `calc(100% - ${spacing.spacing12}px)` : '90%'}>
          <Text
            flexShrink={1}
            numberOfLines={1}
            ellipsizeMode="tail"
            variant={variant === 'small' ? 'buttonLabel3' : 'buttonLabel2'}
            color={textColorValue}
            $group-hover={destructive ? undefined : { color: disabled ? '$neutral2' : '$neutral1Hovered' }}
          >
            {label}
          </Text>
          {subheader && (
            <Text numberOfLines={1} ellipsizeMode="tail" variant="body4" color="$neutral2">
              {subheader}
            </Text>
          )}
        </Flex>
      </Flex>
      <Flex grow flexShrink={0} alignItems="flex-end">
        {actionType === 'external-link' && (
          <ExternalLink
            size={isMobileApp ? (subheader ? '$icon.20' : '$icon.16') : subheader ? '$icon.16' : '$icon.12'}
            color="$neutral2"
          />
        )}
      </Flex>

      {isSelected !== undefined && (
        <Flex flexShrink={0}>{isSelected ? <CheckCircleFilled size="$icon.20" /> : <Spacer size="$spacing20" />}</Flex>
      )}
    </TouchableArea>
  )
}
