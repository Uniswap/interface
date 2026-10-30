import { Flex, FlexProps, Text, TouchableArea, useIsDarkMode } from '@universe/mycelium'
import { BaseSyntheticEvent, useCallback } from 'react'
import { MenuContentItem } from 'wallet/src/components/menu/types'

type MenuContentProps = {
  onClose?: () => void
  items: MenuContentItem[]
}

export function MenuContent({ items, onClose, ...rest }: MenuContentProps & FlexProps): JSX.Element {
  const isDarkMode = useIsDarkMode()

  const handleOnPress = useCallback(
    (e: BaseSyntheticEvent, onPress: (e: BaseSyntheticEvent) => void): void => {
      onPress(e)
      onClose?.()
    },
    [onClose],
  )

  return (
    <Flex
      backgroundColor={isDarkMode ? '$surface2' : '$surface1'}
      borderRadius="$rounded16"
      gap="$spacing4"
      p="$spacing8"
      {...rest}
    >
      {items.map(
        (
          {
            label,
            onPress,
            Icon,
            textProps,
            iconProps,
            iconPlacement = 'right',
            iconTextGap = '$spacing16',
            destructive,
            ...touchableProps
          },
          index,
        ) => (
          <TouchableArea
            key={index}
            hoverable
            borderRadius="$rounded12"
            disabledStyle={{ opacity: 0.6, cursor: 'default' }}
            onPress={(e) => handleOnPress(e, onPress)}
            {...touchableProps}
          >
            <Flex key={index} centered row gap={iconTextGap} justifyContent="space-between" p="$spacing8">
              {iconPlacement === 'left' && Icon && (
                <Icon color={destructive ? '$statusCritical' : '$neutral2'} size="$icon.20" {...iconProps} />
              )}
              <Text variant="body2" {...(destructive ? { color: '$statusCritical' } : {})} {...textProps}>
                {label}
              </Text>
              {iconPlacement === 'right' && Icon && (
                <Icon color={destructive ? '$statusCritical' : '$neutral2'} size="$icon.20" {...iconProps} />
              )}
            </Flex>
          </TouchableArea>
        ),
      )}
    </Flex>
  )
}
