import { Fragment } from 'react'
import { Flex, FlexProps, Separator, Text, TouchableArea } from 'ui/src'
import { MenuOptionItem } from 'uniswap/src/components/menus/ContextMenuV2'

type MenuContentProps = {
  items: MenuOptionItem[]
  onItemClick?: () => void
} & FlexProps

export function MenuContent({ items, onItemClick, ...rest }: MenuContentProps): JSX.Element {
  return (
    <Flex
      asChild
      flexDirection="column"
      gap="$spacing4"
      p="$spacing8"
      backgroundColor="$surface1"
      borderRadius="$rounded20"
      borderWidth="$spacing1"
      borderColor="$surface3"
      {...rest}
    >
      {/* eslint-disable-next-line react/forbid-elements */}
      <div
        // Prevent any right-click from bubbling up or showing default context menu
        onContextMenu={(e) => {
          e.preventDefault()
          e.stopPropagation()
        }}
      >
        {items.map(
          ({ label, onPress, Icon, showDivider, disabled, iconProps, closeDelay, ...touchableProps }, index) => (
            <Fragment key={index}>
              {showDivider && <Separator my="$spacing6" />}
              <TouchableArea
                hoverable
                disabled={disabled}
                borderRadius="$rounded12"
                width="100%"
                userSelect="none"
                cursor={disabled ? 'default' : 'pointer'}
                onPress={(e) => {
                  e.stopPropagation()
                  e.preventDefault()
                  onPress(e)

                  if (closeDelay) {
                    setTimeout(() => onItemClick?.(), closeDelay)
                  } else {
                    onItemClick?.()
                  }
                }}
                {...touchableProps}
              >
                <Flex row alignItems="center" p="$padding8" gap="$gap8" alignContent="center">
                  {Icon && <Icon size="$icon.16" color="$neutral2" {...iconProps} />}
                  <Text
                    variant="buttonLabel3"
                    color={disabled ? '$neutral2' : '$neutral1'}
                    hoverStyle={{ opacity: disabled ? 1 : 0.8 }}
                  >
                    {label}
                  </Text>
                </Flex>
              </TouchableArea>
            </Fragment>
          ),
        )}
      </div>
    </Flex>
  )
}
