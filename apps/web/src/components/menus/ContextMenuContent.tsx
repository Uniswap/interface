import { MenuOptionItem } from 'components/menus/ContextMenuV2'
import { Fragment } from 'react'
import { Flex, FlexProps, Separator, Text, TouchableArea } from 'ui/src'

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
      <div
        // Prevent any right-click from bubbling up or showing default context menu
        onContextMenu={(e) => {
          e.preventDefault()
          e.stopPropagation()
        }}
      >
        {items.map(({ label, onPress, Icon, showDivider, ...touchableProps }, index) => (
          <Fragment key={index}>
            {showDivider && <Separator my="$spacing6" />}
            <TouchableArea
              hoverable
              borderRadius="$rounded8"
              width="100%"
              onPress={(e) => {
                e.stopPropagation()
                e.preventDefault()
                onPress(e)
                onItemClick?.()
              }}
              {...touchableProps}
            >
              <Flex row alignItems="center" p="$padding8" gap="$gap8" alignContent="center">
                {Icon && <Icon size="$icon.16" color="$neutral2" />}
                <Text variant="buttonLabel3" color="$neutral1">
                  {label}
                </Text>
              </Flex>
            </TouchableArea>
          </Fragment>
        ))}
      </div>
    </Flex>
  )
}
