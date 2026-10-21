/**
 * Web-only, drop-in stand-in for the legacy web `DropdownSelector`
 * (`apps/web/src/components/Dropdowns/DropdownSelector.tsx`), INFRA-3021
 * dropdown set — Base UI Menu underneath, the legacy contract on top:
 *
 * - fully controlled `isOpen`/`toggleOpen`; every Base UI open/close request
 *   (trigger press, outside press, Escape) maps onto `toggleOpen`, exactly
 *   the transitions the legacy AdaptiveDropdown produced;
 * - options map → menu items with the selected check; testID conventions
 *   (`dataTestId`, `dropdownTestId`, `optionTestIdPrefix`) preserved;
 * - the `dropdownStyle`/`buttonStyle` FlexProps leaks compile over the
 *   verbatim legacy defaults; `matchTriggerWidth` uses the positioner's
 *   --anchor-width; `forceFlipUp`/`alignRight` become side/align preferences
 *   refined by collision avoidance (NO breakpoint or hand-rolled clamp
 *   logic — see the exclusions ledger);
 * - free upgrades: arrow-key navigation + typeahead + menuitem roles from
 *   Base UI Menu (the legacy items have none);
 * - `adaptToSheet` accepted but GATED on the Sheet/Dialog track;
 *   `positionFixed`/`ignoredNodes`/`ignoreDialogClicks`/`transition` are
 *   accepted-inert (ledgered).
 */
import * as React from 'react'
import { cn } from '../cn'
import { mergeCompatStyle } from '../compat/compose'
import { resolveMenuColor } from '../menu-compat/compile'
import type { MenuCompatIconComponent } from '../menu-compat/types'
import { CheckmarkCircleGlyph } from '../option-list-compat/icons'
import { EffectiveOverlayZIndexContext, OVERLAY_Z_INDEXES, useStackingLayerAbove } from '../popover-compat/z-index'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../shadcn/dropdown-menu'
import { SINGLE_LINE_ELLIPSIS } from '../text-compat/typography-classes'
import { TriggerButtonCompat } from '../trigger-button-compat/TriggerButtonCompat'
import {
  FILTER_SELECT_CHECK_CLASS_NAME,
  FILTER_SELECT_ITEM_FRAME_CLASS_NAME,
  FILTER_SELECT_MATCH_TRIGGER_WIDTH_CLASS_NAME,
  filterSelectButtonStyleEmission,
  filterSelectCardEmission,
  filterSelectItemLabelClassName,
} from './compile'
import type { FilterSelectCompatProps } from './types'

/** The legacy AdaptiveDropdown trigger/content gap. */
const DROPDOWN_OFFSET = 10

const ICON_SIZE = 20
const OPTION_ICON_SIZE = 16

function renderIcon(Icon: MenuCompatIconComponent | null | undefined, size: number): React.ReactNode {
  if (Icon === undefined || Icon === null) {
    return undefined
  }
  const IconComponent = Icon as React.ComponentType<{ size?: number; color?: string }>
  return <IconComponent size={size} color={resolveMenuColor('$neutral1')} />
}

export function FilterSelectCompat({
  options,
  selectedValue,
  onSelect,
  ButtonIcon,
  dataTestId,
  optionTestIdPrefix,
  isOpen,
  toggleOpen,
  dropdownTestId,
  adaptToSheet: _adaptToSheet, // GATED sheet leg — menu renders regardless (ledger)
  tooltipText,
  dropdownStyle,
  containerStyle,
  alignRight = false,
  allowFlip,
  positionFixed: _positionFixed, // accepted-inert: compat popups always portal (ledger)
  matchTriggerWidth,
  forceFlipUp,
  ignoredNodes: _ignoredNodes, // accepted-inert: dismissal owned by Base UI Menu (ledger)
  ignoreDialogClicks: _ignoreDialogClicks, // accepted-inert (ledger)
  hideChevron,
  chevronSize,
  isTriggerStyled = true,
  buttonStyle,
  transition: _transition, // accepted-inert: compat transitions live in CSS (ledger)
  telemetryAdapter,
}: FilterSelectCompatProps): React.JSX.Element {
  const stackingLayerNumber = useStackingLayerAbove(OVERLAY_Z_INDEXES.popover)
  const selectedOption = options[selectedValue]

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

  // Strict emission path (INFRA-3217): caller style leaks outside the closed
  // set (e.g. `maxHeight: 320`, `width: 280`) ride the inline-value lane.
  const cardEmission = filterSelectCardEmission(dropdownStyle)
  const buttonEmission = buttonStyle === undefined ? undefined : filterSelectButtonStyleEmission(buttonStyle)

  return (
    <DropdownMenu open={isOpen} onOpenChange={handleOpenChange} modal={false}>
      <DropdownMenuTrigger
        nativeButton={false}
        render={
          <TriggerButtonCompat
            isExpanded={isOpen}
            outlined={isTriggerStyled}
            active={isOpen && isTriggerStyled}
            hideChevron={hideChevron}
            chevronSize={chevronSize === '$icon.16' ? 16 : 20}
            tooltipLabel={tooltipText}
            testID={dataTestId}
            // The legacy DropdownSelector buttonStyle defaults; the FlexProps
            // leak is honored through the card compiler's token mapping —
            // out-of-set values ride the inline-value lane (INFRA-3217).
            className={cn('h-[40px] min-w-[140px] rounded-[12px] border border-surface3', buttonEmission?.className)}
            style={mergeCompatStyle(buttonEmission?.style, containerStyle)}
          />
        }
      >
        <span className="flex min-w-0 shrink flex-row items-center gap-[8px]">
          {ButtonIcon !== undefined && <span className="flex shrink-0">{renderIcon(ButtonIcon, ICON_SIZE)}</span>}
          {selectedOption !== undefined && (
            <span className={cn(filterSelectItemLabelClassName(), SINGLE_LINE_ELLIPSIS)}>{selectedOption.label}</span>
          )}
        </span>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        data-slot="filter-select-popup"
        data-testid={dropdownTestId}
        side={forceFlipUp === true ? 'top' : 'bottom'}
        align={alignRight ? 'end' : 'start'}
        sideOffset={DROPDOWN_OFFSET}
        collisionAvoidance={allowFlip === false ? { side: 'none', align: 'none' } : undefined}
        positionerProps={{ 'data-slot': 'filter-select-positioner', style: { zIndex: stackingLayerNumber } }}
        // Legacy AdaptiveDropdown never moves focus on close; ledgered with the a11y upgrade.
        finalFocus={false}
        className={cn(
          cardEmission.className,
          matchTriggerWidth === true && FILTER_SELECT_MATCH_TRIGGER_WIDTH_CLASS_NAME,
        )}
        style={cardEmission.style}
      >
        <EffectiveOverlayZIndexContext.Provider value={stackingLayerNumber}>
          {Object.entries(options).map(([value, option], index) => (
            <DropdownMenuItem
              key={value}
              data-testid={optionTestIdPrefix === undefined ? undefined : `${optionTestIdPrefix}${value}`}
              className={FILTER_SELECT_ITEM_FRAME_CLASS_NAME}
              onClick={() => {
                telemetryAdapter?.onMenuItemClicked?.({ label: option.label, index })
                onSelect(value)
                toggleOpen(false)
              }}
            >
              <span className="flex flex-row items-center gap-[8px]">
                {renderIcon(option.icon, OPTION_ICON_SIZE)}
                <span className={filterSelectItemLabelClassName()}>{option.label}</span>
              </span>
              {selectedValue === value && (
                // Design review (2026-07): the network selector's filled
                // CheckmarkCircle marker — one checkmark grammar across
                // single-select, multi-select, and the network selector.
                <span data-slot="filter-select-check" className={FILTER_SELECT_CHECK_CLASS_NAME}>
                  <CheckmarkCircleGlyph size={20} />
                </span>
              )}
            </DropdownMenuItem>
          ))}
        </EffectiveOverlayZIndexContext.Provider>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
