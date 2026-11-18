/**
 * Web leg of the menu item (native: `DropdownMenuSheetItemCompat.native.tsx`),
 * INFRA-3021. The frame/label/subheader classes come from `./compile`; the
 * press contract (stopPropagation + preventDefault, optional delayed close,
 * disabled detaching the interaction surface) matches the native leg.
 *
 * Forwards unknown props/ref to the root element so Base UI `Menu.Item`
 * can compose it via its `render` prop inside `ContextMenuCompat`.
 */
// oxlint-disable react/forbid-elements -- the compat components ARE the raw DOM boundary (no Tamagui Flex here)
import { useButton } from '@base-ui/react/internals/use-button'
import * as React from 'react'
import { useComposedRefs } from 'utilities/src/react/composeRefs'
import { cn } from '../cn'
import { mergeCompatStyle } from '../compat/compose'
import { isCompositeItemRole } from '../compat/composite-role'
import { CheckCircleFilled } from '../components/icons/CheckCircleFilled'
import { ExternalLink } from '../components/icons/ExternalLink'
import {
  dropdownMenuSheetItemFrameEmission,
  dropdownMenuSheetItemLabelEmission,
  dropdownMenuSheetItemSubheaderClassName,
  resolveMenuColor,
} from './compile'
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

  const interactionProps: React.HTMLAttributes<HTMLDivElement> = {
    role,
    // `disabled` detaches the composed interaction surface, like TouchableArea.
    onClick: disabled === true ? undefined : handlePress,
    onPointerDown: disabled === true ? undefined : (onPointerDown ?? stopPointerPropagation),
    onPointerUp: disabled === true ? undefined : (onPointerUp ?? stopPointerPropagation),
  }
  // Base UI's button hook gives an interactive item its tab stop and Enter/Space activation, and yields to
  // a Base UI Menu.Item that renders this element once it has handled the key. A presentational row (the
  // standalone MenuContentCompat shape) keeps the legacy markup: no tab stop, no key handling.
  const interactive = role !== 'none' && role !== 'presentation'
  const { getButtonProps, buttonRef } = useButton({
    disabled: disabled === true,
    native: false,
    composite: isCompositeItemRole(role) || undefined,
  })
  // Base UI types its ref for any HTMLElement; a callback accepting that also accepts the div.
  const composedRef = useComposedRefs<HTMLDivElement>(ref, buttonRef as React.Ref<HTMLDivElement>)
  const rootProps: React.HTMLAttributes<HTMLDivElement> = interactive
    ? getButtonProps({ ...rest, ...interactionProps })
    : { ...rest, ...interactionProps }

  // Web sizes; the native leg sizes the icon from the `$icon` tokens instead.
  const externalLinkSize = subheader !== undefined ? 16 : 12

  // Strict emission path (INFRA-3217): a caller `height` outside the closed
  // set — and a caller `textColor` outside the pinned theme palette — ride
  // the inline-value lane. The caller's own `style` merges on top.
  const frameEmission = dropdownMenuSheetItemFrameEmission({ variant, disabled, height })
  const labelEmission = dropdownMenuSheetItemLabelEmission({
    variant,
    destructive,
    disabled,
    textColor,
    allowMultiline,
  })

  return (
    // oxlint-disable-next-line react/forbid-elements -- the compat item IS the raw DOM boundary (no Tamagui TouchableArea here)
    <div
      ref={composedRef}
      {...rootProps}
      data-slot="dropdown-menu-sheet-item-compat"
      aria-disabled={disabled === true ? true : undefined}
      className={cn(frameEmission.className, className)}
      style={mergeCompatStyle(frameEmission.style, rest.style)}
    >
      <div className="flex min-w-0 flex-shrink flex-grow flex-row items-center">
        {icon !== undefined && icon !== null && <div className="flex flex-shrink-0">{icon}</div>}
        {icon !== undefined && icon !== null && <div className="w-[8px] flex-shrink-0" />}
        {/* max-width keeps long labels ellipsizing inside the padded frame (legacy web branch). */}
        <div className="flex max-w-[calc(100%-12px)] flex-col">
          <span data-slot="menu-item-label" className={labelEmission.className} style={labelEmission.style}>
            {label}
          </span>
          {subheader !== undefined && <span className={dropdownMenuSheetItemSubheaderClassName()}>{subheader}</span>}
        </div>
      </div>
      <div className="flex flex-shrink-0 flex-col items-end">
        {actionType === 'external-link' && (
          <ExternalLink
            aria-hidden
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
            <CheckCircleFilled aria-hidden data-slot="menu-item-check" size={20} />
          ) : (
            <div data-slot="menu-item-check-spacer" className="h-[20px] w-[20px] flex-shrink-0" />
          )}
        </div>
      )}
    </div>
  )
})
