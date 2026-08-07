/**
 * Web-only Select all / Clear CTA row for multi-select dropdowns (INFRA-3021
 * dropdown set), per the sandbox network-selector spec: accent Select all
 * (dimmed + disabled once everything is selected), neutral Clear (hidden
 * until something is filtered). Labels are host-injected i18n with English
 * defaults (ledgered).
 */
// oxlint-disable react/forbid-elements -- the compat components ARE the raw DOM boundary (no Tamagui Flex here)
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
    <div data-slot="select-all-clear-header" className={SELECT_ALL_CLEAR_HEADER_CLASS_NAMES.frame}>
      <button
        type="button"
        disabled={selectAllDisabled === true}
        className={SELECT_ALL_CLEAR_HEADER_CLASS_NAMES.selectAll}
        onClick={onSelectAll}
      >
        {selectAllLabel}
      </button>
      {showClear && (
        <button type="button" className={SELECT_ALL_CLEAR_HEADER_CLASS_NAMES.clear} onClick={onClear}>
          {clearLabel}
        </button>
      )}
    </div>
  )
}
