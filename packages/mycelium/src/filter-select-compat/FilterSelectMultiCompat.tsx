/**
 * Web-only multi-select checkbox dropdown (INFRA-3021 dropdown set): the D′
 * archetype (the legacy `ProtocolFilterDropdown` LabeledCheckbox-in-Dropdown
 * shape and the sandbox multiSelect network mode) on Base UI Menu —
 * menuitemcheckbox semantics, toggling never closes the menu, optional
 * Select all / Clear header per the sandbox spec. Shares the trigger and
 * card chrome with FilterSelectCompat.
 */
import * as React from 'react'
import { cn } from '../cn'
import { CheckboxOptionItemCompat } from '../option-list-compat/CheckboxOptionItem'
import { SelectAllClearHeaderCompat } from '../option-list-compat/SelectAllClearHeader'
import { EffectiveOverlayZIndexContext, OVERLAY_Z_INDEXES, useStackingLayerAbove } from '../popover-compat/z-index'
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '../shadcn/dropdown-menu'
import { TriggerButtonCompat } from '../trigger-button-compat/TriggerButtonCompat'
import {
  FILTER_SELECT_MATCH_TRIGGER_WIDTH_CLASS_NAME,
  filterSelectCardClassName,
  filterSelectItemLabelClassName,
} from './compile'
import type { FilterSelectMultiCompatProps } from './types'

/** The legacy AdaptiveDropdown trigger/content gap. */
const DROPDOWN_OFFSET = 10

export function FilterSelectMultiCompat({
  label,
  items,
  onToggle,
  onSelectAll,
  onClear,
  selectAllLabel,
  clearLabel,
  selectAllDisabled,
  showClear,
  isOpen,
  toggleOpen,
  dataTestId,
  dropdownTestId,
  dropdownStyle,
  alignRight = false,
  forceFlipUp,
  matchTriggerWidth,
  hideChevron,
  telemetryAdapter,
}: FilterSelectMultiCompatProps): React.JSX.Element {
  const stackingLayerNumber = useStackingLayerAbove(OVERLAY_Z_INDEXES.popover)

  const handleOpenChange = (nextOpen: boolean): void => {
    if (nextOpen !== isOpen) {
      toggleOpen(nextOpen)
      if (nextOpen) {
        telemetryAdapter?.onMenuOpened?.({})
      } else {
        telemetryAdapter?.onMenuClosed?.({})
      }
    }
  }

  const showHeader = onSelectAll !== undefined && onClear !== undefined

  return (
    <DropdownMenu open={isOpen} onOpenChange={handleOpenChange} modal={false}>
      <DropdownMenuTrigger
        nativeButton={false}
        render={<TriggerButtonCompat isExpanded={isOpen} hideChevron={hideChevron} testID={dataTestId} />}
      >
        <span className="flex w-max flex-row items-center gap-[8px]">
          {typeof label === 'string' ? <span className={filterSelectItemLabelClassName()}>{label}</span> : label}
        </span>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        data-slot="filter-select-popup"
        data-testid={dropdownTestId}
        side={forceFlipUp === true ? 'top' : 'bottom'}
        align={alignRight ? 'end' : 'start'}
        sideOffset={DROPDOWN_OFFSET}
        positionerProps={{ 'data-slot': 'filter-select-positioner', style: { zIndex: stackingLayerNumber } }}
        // Legacy AdaptiveDropdown never moves focus on close; ledgered with the a11y upgrade.
        finalFocus={false}
        className={cn(
          filterSelectCardClassName(dropdownStyle),
          matchTriggerWidth === true && FILTER_SELECT_MATCH_TRIGGER_WIDTH_CLASS_NAME,
        )}
      >
        <EffectiveOverlayZIndexContext.Provider value={stackingLayerNumber}>
          {showHeader && (
            <SelectAllClearHeaderCompat
              selectAllLabel={selectAllLabel}
              clearLabel={clearLabel}
              selectAllDisabled={selectAllDisabled}
              showClear={showClear}
              onSelectAll={onSelectAll}
              onClear={onClear}
            />
          )}
          {items.map((item) => (
            <CheckboxOptionItemCompat
              key={item.value}
              label={item.label}
              checked={item.checked}
              disabled={item.disabled}
              icon={item.icon}
              testID={item.testID}
              onCheckedChange={(checked) => onToggle(item.value, checked)}
            />
          ))}
        </EffectiveOverlayZIndexContext.Provider>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
