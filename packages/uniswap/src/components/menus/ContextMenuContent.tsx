import { isWebPlatform } from '@universe/environment'
import { Fragment, useCallback } from 'react'
import { DropdownMenuSheetItem, DropdownMenuSheetItemProps, Flex, FlexProps, getMenuItemColor, Separator } from 'ui/src'
import { MenuOptionItem } from 'uniswap/src/components/menus/ContextMenu'
import { ElementName, SectionName, UniswapEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'

const MENU_MIN_WIDTH = 200
const MENU_MAX_WIDTH = 250

/**
 * `containerStyles` to apply to {@link MenuContent} when the surrounding `ContextMenu`
 * adapts to a `WebBottomSheet` on mWeb. Neutralises the default popover frame so the
 * sheet is the only visual card.
 */
export const MENU_CONTENT_SHEET_CONTAINER_STYLES: FlexProps = {
  p: '$none',
  pb: '$spacing16',
  backgroundColor: 'transparent',
  borderWidth: '$none',
  gap: '$spacing8',
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
  minWidth: undefined,
  maxWidth: undefined,
}

type MenuContentProps = {
  items: MenuOptionItem[]
  handleCloseMenu?: DropdownMenuSheetItemProps['handleCloseMenu']
  elementName?: ElementName
  sectionName?: SectionName
  trackItemClicks?: boolean
  containerStyles?: FlexProps
}

export function MenuContent({
  items,
  handleCloseMenu,
  elementName,
  sectionName,
  trackItemClicks = false,
  containerStyles,
}: MenuContentProps): JSX.Element {
  const trace = useTrace()

  const createMenuItemHandler = useCallback(
    ({ originalOnPress, label, index }: { originalOnPress: () => void; label: string; index: number }) => {
      return () => {
        if (trackItemClicks && elementName && sectionName) {
          sendAnalyticsEvent(UniswapEventName.ContextMenuItemClicked, {
            element: elementName,
            section: sectionName,
            menu_item: label,
            menu_item_index: index,
            ...trace,
          })
        }
        originalOnPress()
      }
    },
    [elementName, sectionName, trace, trackItemClicks],
  )

  return (
    // oxlint-disable-next-line react/forbid-elements -- needed here
    <div
      // Prevent any right-click from bubbling up or showing default context menu
      onContextMenu={(e) => {
        e.preventDefault()
        e.stopPropagation()
      }}
      onClick={(e) => {
        e.stopPropagation()
      }}
      onMouseDown={(e) => {
        e.stopPropagation()
      }}
    >
      <Flex
        gap="$spacing4"
        p="$spacing8"
        backgroundColor="$surface1"
        borderRadius="$rounded20"
        borderWidth="$spacing1"
        borderColor="$surface3"
        minWidth={MENU_MIN_WIDTH}
        maxWidth={MENU_MAX_WIDTH}
        {...containerStyles}
      >
        {items.map(
          (
            { Icon, iconColor, destructive, disabled, showDivider, onPress, label, trailingIcon, ...otherProps },
            index,
          ) => {
            const wrappedOnPress = trackItemClicks
              ? createMenuItemHandler({ originalOnPress: onPress, label, index })
              : onPress

            return (
              <Fragment key={index}>
                {showDivider && <Separator my="$spacing6" />}
                <DropdownMenuSheetItem
                  role="none"
                  variant={isWebPlatform ? 'small' : 'medium'}
                  icon={
                    Icon && (
                      <Icon
                        size="$icon.16"
                        color={getMenuItemColor({ overrideColor: iconColor, destructive, disabled })}
                      />
                    )
                  }
                  destructive={destructive}
                  disabled={disabled}
                  label={label}
                  rightElement={trailingIcon}
                  {...otherProps}
                  handleCloseMenu={handleCloseMenu}
                  onPress={wrappedOnPress}
                />
              </Fragment>
            )
          },
        )}
      </Flex>
    </div>
  )
}
