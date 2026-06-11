import { ReactNode, useMemo } from 'react'
import { Check } from 'ui/src/components/icons/Check'
import { ContextMenu, type MenuOptionItem } from 'uniswap/src/components/menus/ContextMenu'
import { ContextMenuTriggerMode } from 'uniswap/src/components/menus/types'
import { useBooleanState } from 'utilities/src/react/useBooleanState'

export type SingleSelectOption<T extends string | number> = {
  value: T
  label: string
}

type SingleSelectContextMenuProps<T extends string | number> = {
  options: SingleSelectOption<T>[]
  selectedValue: T
  onSelect: (value: T) => void
  /** The trigger element (e.g. a pill or chart label) that opens the menu. */
  children: ReactNode
  isPlacementAbove?: boolean
  isPlacementRight?: boolean
}

/**
 * Cross-platform single-select dropdown over the shared `ContextMenu`. The selected option shows in
 * `$accent1` with a checkmark; the trigger is supplied as `children` so callers control its appearance.
 */
export function SingleSelectContextMenu<T extends string | number>({
  options,
  selectedValue,
  onSelect,
  children,
  isPlacementAbove,
  isPlacementRight,
}: SingleSelectContextMenuProps<T>): JSX.Element {
  const { value: isOpen, setTrue: openMenu, setFalse: closeMenu } = useBooleanState(false)

  const menuItems = useMemo<MenuOptionItem[]>(
    () =>
      options.map((option) => {
        const isSelected = option.value === selectedValue
        return {
          label: option.label,
          textColor: isSelected ? '$accent1' : '$neutral1',
          trailingIcon: isSelected ? <Check color="$accent1" size="$icon.16" /> : undefined,
          onPress: () => {
            onSelect(option.value)
            closeMenu()
          },
        }
      }),
    [options, selectedValue, onSelect, closeMenu],
  )

  return (
    <ContextMenu
      menuItems={menuItems}
      triggerMode={ContextMenuTriggerMode.Primary}
      isOpen={isOpen}
      openMenu={openMenu}
      closeMenu={closeMenu}
      isPlacementAbove={isPlacementAbove}
      isPlacementRight={isPlacementRight}
    >
      {children}
    </ContextMenu>
  )
}
