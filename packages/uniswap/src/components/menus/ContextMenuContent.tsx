import { Fragment } from 'react'
import { DropdownMenuSheetItem, DropdownMenuSheetItemProps, Flex, getMenuItemColor, Separator } from 'ui/src'
import { MenuOptionItem } from 'uniswap/src/components/menus/ContextMenuV2'
import { isWebPlatform } from 'utilities/src/platform'

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
      {/* biome-ignore  lint/correctness/noRestrictedElements: needed here */}
      <div
        // Prevent any right-click from bubbling up or showing default context menu
        onContextMenu={(e) => {
          e.preventDefault()
          e.stopPropagation()
        }}
      >
        {items.map(({ Icon, iconColor, destructive, disabled, showDivider, ...otherProps }, index) => (
          <Fragment key={index}>
            {showDivider && <Separator my="$spacing6" />}
            <DropdownMenuSheetItem
              role="none"
              variant={isWebPlatform ? 'small' : 'medium'}
              icon={
                Icon && (
                  <Icon size="$icon.16" color={getMenuItemColor({ overrideColor: iconColor, destructive, disabled })} />
                )
              }
              destructive={destructive}
              disabled={disabled}
              {...otherProps}
              handleCloseMenu={handleCloseMenu}
            />
          </Fragment>
        ))}
      </div>
    </Flex>
  )
}
