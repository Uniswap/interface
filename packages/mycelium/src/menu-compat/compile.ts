/**
 * The menu-family class compilers (INFRA-3021): pure prop → Tailwind class
 * functions for the visual vocabulary — the MenuContent container card, the
 * DropdownMenuSheetItem frame, and the item label. Values are copied verbatim
 * from the legacy sources (`ContextMenuContent.tsx`,
 * `DropdownMenuSheetItem.tsx`); the parity matrices in
 * `packages/tailwind/src/parity/menu` diff the output against the real
 * Tamagui CSSOM per prop, state, and theme.
 */
import { cn } from '../cn'
import type { SporeSpaceToken } from '../compat/tokens'
import { lookupToken, SPACE_TOKEN_PX } from '../compat/tokens'
import { flexCompatClassName } from '../flex-compat/compile'
import type { FlexCompatProps } from '../flex-compat/props'
import { textCompatClassName } from '../text-compat/compile'
import { colorCssExpression } from '../text-compat/tokens'
import type { MenuCompatColorValue } from './types'

/**
 * The legacy `containerStyles: FlexProps` leak, with `borderWidth` widened to
 * the space tokens the real call sites pass (`'$none'` in the sheet styles,
 * `'$spacing1'` in the defaults) — normalized to pixels at compile time.
 */
export type MenuContentContainerStyles = Omit<FlexCompatProps, 'borderWidth' | 'children'> & {
  borderWidth?: number | SporeSpaceToken
}

/** Legacy MenuContent constants (ContextMenuContent.tsx). */
export const MENU_MIN_WIDTH = 200
export const MENU_MAX_WIDTH = 250

/**
 * The legacy container defaults, verbatim from ContextMenuContent.tsx
 * (`borderWidth: '$spacing1'` = 1px). Single source of truth shared by the
 * compat compiler, the parity test's legacy twin, and the workbench board's
 * legacy card — so the copies can never drift.
 */
export const MENU_CONTENT_CONTAINER_DEFAULTS_COMPAT = {
  gap: '$spacing4',
  p: '$spacing8',
  backgroundColor: '$surface1',
  borderRadius: '$rounded20',
  borderWidth: '$spacing1',
  borderColor: '$surface3',
  minWidth: MENU_MIN_WIDTH,
  maxWidth: MENU_MAX_WIDTH,
} as const satisfies MenuContentContainerStyles

/**
 * `MENU_CONTENT_SHEET_CONTAINER_STYLES`, verbatim — kept exported so the
 * gated sheet leg reuses the identical payload when it lands.
 */
export const MENU_CONTENT_SHEET_CONTAINER_STYLES_COMPAT: MenuContentContainerStyles = {
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

function normalizeContainerStyles(styles: MenuContentContainerStyles): FlexCompatProps {
  const { borderWidth, ...rest } = styles
  if (typeof borderWidth !== 'string') {
    return borderWidth === undefined && !Object.hasOwn(styles, 'borderWidth')
      ? (rest as FlexCompatProps)
      : ({ ...rest, borderWidth } as FlexCompatProps)
  }
  const px = lookupToken(SPACE_TOKEN_PX, borderWidth)
  if (px === undefined) {
    throw new Error(`menu-compat: unknown space token for borderWidth "${borderWidth}"`)
  }
  return { ...rest, borderWidth: px } as FlexCompatProps
}

/** Compile the MenuContent card className: legacy defaults + containerStyles overrides (spread semantics). */
export function menuContentContainerClassName(containerStyles?: MenuContentContainerStyles): string {
  return flexCompatClassName({
    ...normalizeContainerStyles(MENU_CONTENT_CONTAINER_DEFAULTS_COMPAT),
    ...normalizeContainerStyles(containerStyles ?? {}),
  })
}

export interface DropdownMenuSheetItemFrameStyleInputs {
  variant: 'small' | 'medium'
  disabled?: boolean
  height?: number
}

/**
 * The DropdownMenuSheetItem frame, verbatim from its TouchableArea props:
 * group marker, row layout, 8px vertical / 12|8px horizontal padding, 12px
 * radius, no text selection, pointer cursor unless disabled, theme background
 * with the hovered-surface hover state.
 */
export function dropdownMenuSheetItemFrameClassName({
  variant,
  disabled,
  height,
}: DropdownMenuSheetItemFrameStyleInputs): string {
  return flexCompatClassName({
    group: true,
    flexGrow: 1,
    py: '$spacing8',
    px: variant === 'small' ? '$spacing12' : '$spacing8',
    gap: '$spacing8',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: '$rounded12',
    userSelect: 'none',
    cursor: disabled ? 'default' : 'pointer',
    // Tamagui `$background` resolves to surface1 in both spore themes.
    backgroundColor: '$surface1',
    height,
    hoverStyle: disabled ? undefined : { backgroundColor: '$surface1Hovered' },
    // TouchableArea's disabled styling (dim + inert), mirrored verbatim.
    ...(disabled === true ? { opacity: 0.6, pointerEvents: 'none' } : {}),
  })
}

export interface DropdownMenuSheetItemLabelStyleInputs {
  variant: 'small' | 'medium'
  destructive?: boolean
  disabled?: boolean
  textColor?: MenuCompatColorValue
  allowMultiline?: boolean
}

function resolveLabelColor({
  textColor,
  destructive,
  disabled,
}: Pick<DropdownMenuSheetItemLabelStyleInputs, 'textColor' | 'destructive' | 'disabled'>): string {
  // Mirror of getMenuItemColor: override > destructive > disabled > neutral1.
  const resolved = textColor || (destructive ? '$statusCritical' : disabled ? '$neutral2' : '$neutral1')
  if (typeof resolved !== 'string') {
    // The legacy type admits Tamagui Variable objects; no call site passes
    // them. Fail fast instead of guessing (compat token policy).
    throw new Error('menu-compat: non-string color values are not supported without the Tamagui runtime')
  }
  return resolved
}

/** Compile the item label className: the exact Text props DropdownMenuSheetItem renders. */
export function dropdownMenuSheetItemLabelClassName(inputs: DropdownMenuSheetItemLabelStyleInputs): string {
  const { variant, destructive, disabled, allowMultiline = false } = inputs
  return textCompatClassName({
    flexShrink: 1,
    ...(allowMultiline ? {} : { numberOfLines: 1 }),
    variant: variant === 'small' ? 'buttonLabel3' : 'buttonLabel2',
    color: resolveLabelColor(inputs),
    '$group-hover': destructive ? undefined : { color: disabled ? '$neutral2' : '$neutral1Hovered' },
  })
}

/** Compile the subheader className (`body4`, `$neutral2`, single-line). */
export function dropdownMenuSheetItemSubheaderClassName(): string {
  return textCompatClassName({ numberOfLines: 1, variant: 'body4', color: '$neutral2' })
}

/** Resolve a menu color token / raw color to a CSS expression for icon rendering. */
export function resolveMenuColor(value: MenuCompatColorValue): string {
  if (typeof value !== 'string') {
    throw new Error('menu-compat: non-string color values are not supported without the Tamagui runtime')
  }
  return colorCssExpression(value)
}

/** The separator the legacy MenuContent renders before flagged items (`<Separator my="$spacing6" />`). */
export function menuSeparatorClassName(): string {
  return cn('my-[6px] w-full border-b border-surface3')
}
