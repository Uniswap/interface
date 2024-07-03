import { PropsWithChildren, SyntheticEvent, useEffect, useRef, useState } from 'react'
import { Popover, PopperProps } from 'tamagui'
import { FlexProps } from 'ui/src/components/layout'
import { MenuContent } from 'ui/src/components/menu/MenuContent'
import { MenuContentItem } from 'ui/src/components/menu/types'
import { useSporeColors } from 'ui/src/hooks/useSporeColors'
import { useOnClickOutside, usePrevious } from 'utilities/src/react/hooks'

type ContextMenuProps = {
  menuOptions: MenuContentItem[]
  itemId: string
  menuStyleProps?: FlexProps
  onLeftClick?: boolean
  closeOnClick?: boolean
} & PopperProps

/**
 * Base component for a context menu shown on right click.
 * Expected use is to wrap a component that will trigger the context menu.
 */
export function ContextMenu({
  children,
  menuOptions,
  menuStyleProps,
  itemId,
  onLeftClick = false,
  closeOnClick = false,
  ...rest
}: PropsWithChildren<ContextMenuProps>): JSX.Element {
  const lastItemId = usePrevious(itemId)
  const colors = useSporeColors()
  const [showMenu, setShowMenu] = useState(false)

  // Close the menu if this component was recycled to show a different item
  useEffect(() => {
    if (lastItemId && itemId !== lastItemId) {
      setShowMenu(false)
    }
  }, [itemId, lastItemId])

  const onContextMenu = (e: SyntheticEvent<Element>): void => {
    e.preventDefault()
    e.stopPropagation()
    setShowMenu(true)
  }

  const menuContainerRef = useRef<HTMLDivElement>(null)
  // TODO(EXT-1324): prevent clicking through when clicking outside the menu. The menu should just close.
  useOnClickOutside(menuContainerRef, () => setShowMenu(false))

  // Offset the content by the height of the  trigger element, so its aligned to the top
  // Ignore if any values besides default are passed
  const triggerContainerRef = useRef<HTMLDivElement>(null)
  const { offset: customOffset, placement } = rest
  const offset =
    customOffset || (placement && placement !== 'bottom-end')
      ? customOffset
      : -(triggerContainerRef.current?.offsetHeight ?? 0)

  const contentShadowProps = {
    shadowColor: colors.shadowColor.val,
    shadowRadius: 12,
    shadowOpacity: 0.1,
  }

  return (
    <Popover offset={offset} open={showMenu} placement="bottom-end" {...rest}>
      <Popover.Trigger>
        <div
          ref={triggerContainerRef}
          onClick={onLeftClick ? onContextMenu : undefined}
          onContextMenu={onLeftClick ? undefined : onContextMenu}
        >
          {children}
        </div>
      </Popover.Trigger>
      <Popover.Content
        ref={menuContainerRef}
        animation={[
          'quick',
          {
            opacity: {
              overshootClamping: true,
            },
          },
        ]}
        borderColor="$surface3"
        borderRadius="$rounded16"
        borderWidth="$spacing1"
        disableRemoveScroll={false}
        enterStyle={{ y: -10, opacity: 0 }}
        exitStyle={{ y: -10, opacity: 0 }}
        p="$none"
        {...contentShadowProps}
      >
        <div ref={menuContainerRef}>
          <MenuContent
            items={menuOptions}
            onClose={closeOnClick ? (): void => setShowMenu(false) : undefined}
            {...menuStyleProps}
          />
        </div>
        <Popover.Arrow backgroundColor="transparent" />
      </Popover.Content>
    </Popover>
  )
}
