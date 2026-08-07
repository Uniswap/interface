/**
 * Web-only multi-select checkbox row (INFRA-3021 dropdown set) on Base UI
 * `Menu.CheckboxItem`: real menuitemcheckbox semantics + keyboard toggling
 * for free. Menu hosts only — the row must render inside a Base UI Menu root
 * (e.g. FilterSelectMultiCompat). `closeOnClick` is off: multi-select menus
 * stay open while toggling.
 *
 * Design review (2026-07): the checked marker is the filled CheckmarkCircle
 * glyph the network selector rows use (one checkmark grammar across single-
 * and multi-select), replacing the earlier sandbox-spec checkbox square; the
 * label uses normal weight (body3) — medium weight stays reserved for the
 * Select all / Clear header.
 */
import { Menu as MenuPrimitive } from '@base-ui/react/menu'
import * as React from 'react'
import { textCompatClassName } from '../text-compat/compile'
import { OPTION_CHECKED_MARKER_CLASS_NAME } from './compile'
import { CheckmarkCircleGlyph } from './icons'
import type { CheckboxOptionItemCompatProps } from './types'

const LABEL_CLASS_NAME = textCompatClassName({ variant: 'body3', color: '$neutral1' })

export function CheckboxOptionItemCompat({
  label,
  checked,
  onCheckedChange,
  icon,
  disabled,
  testID,
}: CheckboxOptionItemCompatProps): React.JSX.Element {
  return (
    <MenuPrimitive.CheckboxItem
      data-slot="checkbox-option-item-compat"
      data-testid={testID}
      checked={checked}
      closeOnClick={false}
      disabled={disabled}
      onCheckedChange={onCheckedChange}
      className="flex cursor-pointer flex-row items-center justify-between gap-[12px] rounded-[8px] px-[8px] py-[10px] select-none data-highlighted:bg-surface2 hover:bg-surface2 aria-disabled:cursor-default aria-disabled:opacity-60"
    >
      <span className="flex min-w-0 flex-row items-center gap-[12px]">
        {icon !== undefined && icon !== null && <span className="flex flex-shrink-0">{icon}</span>}
        <span className={LABEL_CLASS_NAME}>{label}</span>
      </span>
      <span className={OPTION_CHECKED_MARKER_CLASS_NAME} data-checked={checked ? '' : undefined} aria-hidden="true">
        {checked && <CheckmarkCircleGlyph data-slot="checkbox-option-check" size={20} className="text-neutral1" />}
      </span>
    </MenuPrimitive.CheckboxItem>
  )
}
