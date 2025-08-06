import { Fragment } from 'react'
import { DropdownMenuSheetItem, DropdownMenuSheetItemProps, Flex, Separator } from 'ui/src'
import { MenuOptionItem } from 'uniswap/src/components/menus/ContextMenuV2'
import { isWeb } from 'utilities/src/platform'

type MenuContentProps = {
  items: MenuOptionItem[]
  handleCloseMenu?: DropdownMenuSheetItemProps['handleCloseMenu']
}

export function MenuContent({ items, handleCloseMenu }: MenuContentProps): JSX.Element {
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
      minWidth={200}
      maxWidth={250}
    >
      {/* eslint-disable-next-line react/forbid-elements */}
      <div
        // Prevent any right-click from bubbling up or showing default context menu
        onContextMenu={(e) => {
          e.preventDefault()
          e.stopPropagation()
        }}
      >
        {items.map(({ label, onPress, Icon, showDivider, disabled, iconColor, closeDelay }, index) => (
          <Fragment key={index}>
            {showDivider && <Separator my="$spacing6" />}
            <DropdownMenuSheetItem
              variant={isWeb ? 'small' : 'medium'}
              label={label}
              icon={Icon && <Icon size="$icon.16" color={iconColor ?? '$neutral2'} />}
              disabled={disabled}
              closeDelay={closeDelay}
              handleCloseMenu={handleCloseMenu}
              onPress={onPress}
            />
          </Fragment>
        ))}
      </div>
    </Flex>
  )
}
