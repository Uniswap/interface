/**
 * Web-only Select all / Clear CTA row for multi-select dropdowns (INFRA-3021
 * dropdown set), per the sandbox network-selector spec: accent Select all
 * (dimmed + disabled once everything is selected), neutral Clear (hidden
 * until something is filtered). Labels are host-injected i18n with English
 * defaults (ledgered).
 *
 * Menu hosts only: a menu may hold only items, groups and separators, so the
 * row is a Base UI `Menu.Group` of two `Menu.Item`s. Both join the menu's
 * arrow-key order, ahead of the options, and keep it open when pressed.
 */
import { Menu as MenuPrimitive } from '@base-ui/react/menu'
import type * as React from 'react'
import { SELECT_ALL_CLEAR_HEADER_CLASS_NAMES } from './compile'
import type { SelectAllClearHeaderCompatProps } from './types'

export function SelectAllClearHeaderCompat({
  onSelectAll,
  onClear,
  selectAllLabel = 'Select all',
  clearLabel = 'Clear',
  selectAllDisabled,
  showClear = true,
}: SelectAllClearHeaderCompatProps): React.JSX.Element {
  return (
    <MenuPrimitive.Group data-slot="select-all-clear-header" className={SELECT_ALL_CLEAR_HEADER_CLASS_NAMES.frame}>
      <MenuPrimitive.Item
        closeOnClick={false}
        disabled={selectAllDisabled === true}
        className={SELECT_ALL_CLEAR_HEADER_CLASS_NAMES.selectAll}
        onClick={onSelectAll}
      >
        {selectAllLabel}
      </MenuPrimitive.Item>
      {showClear && (
        <MenuPrimitive.Item
          closeOnClick={false}
          className={SELECT_ALL_CLEAR_HEADER_CLASS_NAMES.clear}
          onClick={onClear}
        >
          {clearLabel}
        </MenuPrimitive.Item>
      )}
    </MenuPrimitive.Group>
  )
}
