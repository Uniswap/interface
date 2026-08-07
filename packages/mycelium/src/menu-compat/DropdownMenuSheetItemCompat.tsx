/**
 * Web-only, drop-in replacement for the legacy `DropdownMenuSheetItem`
 * (`ui/src/components/dropdownMenuSheet/DropdownMenuSheetItem.tsx`),
 * INFRA-3021. The frame/label/subheader classes are compiled by
 * `./compile` and byte-diffed against the real component by the parity
 * matrices; the press contract (stopPropagation + preventDefault, optional
 * delayed close, disabled detaching the interaction surface) mirrors the
 * legacy handler exactly.
 *
 * Forwards unknown props/ref to the root element so Base UI `Menu.Item`
 * can compose it via its `render` prop inside `ContextMenuCompat`.
 */
// oxlint-disable react/forbid-elements -- the compat components ARE the raw DOM boundary (no Tamagui Flex here)
import * as React from 'react'
import { cn } from '../cn'
import {
  dropdownMenuSheetItemFrameClassName,
  dropdownMenuSheetItemLabelClassName,
  dropdownMenuSheetItemSubheaderClassName,
  resolveMenuColor,
} from './compile'
import { CheckCircleFilledGlyph, ExternalLinkGlyph } from './icons'
import type { DropdownMenuSheetItemCompatProps } from './types'

type RootDivProps = Omit<React.HTMLAttributes<HTMLDivElement>, keyof DropdownMenuSheetItemCompatProps>

export const DropdownMenuSheetItemCompat = React.forwardRef<
  HTMLDivElement,
  DropdownMenuSheetItemCompatProps & RootDivProps
>(function DropdownMenuSheetItemCompat(props, ref) {
  const {
    label,
    icon,
    actionType = 'default',
    isSelected,
    disabled,
    destructive,
    closeDelay,
    textColor,
    variant,
    height,
    role = 'button',
    subheader,
    rightElement,
    allowMultiline = false,
    onPress,
    handleCloseMenu,
    className,
    onClick,
    onPointerDown,
    onPointerUp,
    ...rest
  } = props

  const handlePress = (event: React.MouseEvent<HTMLDivElement>): void => {
    event.stopPropagation()
    event.preventDefault()

    onPress()

    if (handleCloseMenu) {
      if (typeof closeDelay === 'number') {
        setTimeout(handleCloseMenu, closeDelay)
      } else {
        handleCloseMenu()
      }
    }
    // Composed handler injected by Base UI Menu.Item (highlight bookkeeping).
    onClick?.(event)
  }

  // Legacy onPressIn/Out stop propagation to parent touchables.
  const stopPointerPropagation = (event: React.PointerEvent<HTMLDivElement>): void => {
    event.stopPropagation()
  }

  // Web sizes only (the isMobileApp branch is the deferred native leg).
  const externalLinkSize = subheader !== undefined ? 16 : 12

  return (
    // oxlint-disable-next-line react/forbid-elements -- the compat item IS the raw DOM boundary (no Tamagui TouchableArea here)
    <div
      ref={ref}
      {...rest}
      data-slot="dropdown-menu-sheet-item-compat"
      role={role}
      aria-disabled={disabled === true ? true : undefined}
      className={cn(dropdownMenuSheetItemFrameClassName({ variant, disabled, height }), className)}
      // `disabled` detaches the composed interaction surface, like TouchableArea.
      onClick={disabled === true ? undefined : handlePress}
      onPointerDown={disabled === true ? undefined : (onPointerDown ?? stopPointerPropagation)}
      onPointerUp={disabled === true ? undefined : (onPointerUp ?? stopPointerPropagation)}
    >
      <div className="flex min-w-0 flex-shrink flex-grow flex-row items-center">
        {icon !== undefined && icon !== null && <div className="flex flex-shrink-0">{icon}</div>}
        {icon !== undefined && icon !== null && <div className="w-[8px] flex-shrink-0" />}
        {/* max-width keeps long labels ellipsizing inside the padded frame (legacy web branch). */}
        <div className="flex max-w-[calc(100%-12px)] flex-col">
          <span
            data-slot="menu-item-label"
            className={dropdownMenuSheetItemLabelClassName({
              variant,
              destructive,
              disabled,
              textColor,
              allowMultiline,
            })}
          >
            {label}
          </span>
          {subheader !== undefined && <span className={dropdownMenuSheetItemSubheaderClassName()}>{subheader}</span>}
        </div>
      </div>
      <div className="flex flex-shrink-0 flex-col items-end">
        {actionType === 'external-link' && (
          <ExternalLinkGlyph
            data-slot="menu-item-external-link"
            size={externalLinkSize}
            color={resolveMenuColor('$neutral2')}
          />
        )}
        {rightElement}
      </div>
      {isSelected !== undefined && (
        <div className="flex flex-shrink-0">
          {isSelected ? (
            <CheckCircleFilledGlyph data-slot="menu-item-check" size={20} />
          ) : (
            <div data-slot="menu-item-check-spacer" className="h-[20px] w-[20px] flex-shrink-0" />
          )}
        </div>
      )}
    </div>
  )
})
