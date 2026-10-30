/**
 * The menu-family class compilers (INFRA-3021): pure prop → Tailwind class
 * functions for the visual vocabulary — the MenuContent container card, the
 * DropdownMenuSheetItemCompat frame, and the item label. Values match
 * uniswap's `ContextMenuContent.tsx` and the native leg's style props
 * (`DropdownMenuSheetItemCompat.native.tsx`); keep them in sync.
 */
import { cn } from '../cn'
import { type CompatEmission, composeCompatEmission } from '../compat/compose'
import { flexCompatClassName } from '../flex-compat/compile'
import { BASE_CLASSES, flexStyleClasses } from '../flex-compat/flex-style-classes'
import type { FlexCompatProps, FlexCompatStyleProps } from '../flex-compat/props'
import { textCompatClassName, textCompatEmissionWithFixed, textFixedCompatClasses } from '../text-compat/compile'
import type { TextCompatProps } from '../text-compat/props'
import { colorCssExpression } from '../text-compat/tokens'
import type { MenuCompatColorValue } from './types'

/**
 * The legacy `containerStyles: FlexProps` leak. `borderWidth` takes the
 * `$space` tokens the real call sites pass (`'$none'` in the sheet styles,
 * `'$spacing1'` in the defaults) straight from the base compat contract,
 * resolved by the emitter (INFRA-3232).
 */
export type MenuContentContainerStyles = Omit<FlexCompatProps, 'children'>

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

/** Compile the MenuContent card className: legacy defaults + containerStyles overrides (spread semantics). */
export function menuContentContainerClassName(containerStyles?: MenuContentContainerStyles): string {
  return flexCompatClassName({
    ...MENU_CONTENT_CONTAINER_DEFAULTS_COMPAT,
    ...containerStyles,
  })
}

function menuFlexEmission(props: FlexCompatProps): CompatEmission {
  return composeCompatEmission<FlexCompatStyleProps>({
    props,
    baseClasses: BASE_CLASSES,
    styleClasses: flexStyleClasses,
    fixedClasses: menuFixedCompatClasses,
  })
}

/**
 * The MenuContent card for rendering (INFRA-3217): every returned class is
 * guaranteed present in the emitted stylesheet; caller `containerStyles`
 * values outside the closed set (e.g. `maxHeight: 400`) ride the
 * inline-value lane instead of shipping a dead class.
 */
export function menuContentContainerEmission(containerStyles?: MenuContentContainerStyles): CompatEmission {
  return menuFlexEmission({
    ...MENU_CONTENT_CONTAINER_DEFAULTS_COMPAT,
    ...containerStyles,
  })
}

export interface DropdownMenuSheetItemFrameStyleInputs {
  variant: 'small' | 'medium'
  disabled?: boolean
  height?: number
}

/**
 * The DropdownMenuSheetItemCompat frame, matching the native leg's TouchableArea props:
 * group marker, row layout, 8px vertical / 12|8px horizontal padding, 12px
 * radius, no text selection, pointer cursor unless disabled, theme background
 * with the hovered-surface hover state.
 */
function dropdownMenuSheetItemFrameProps({
  variant,
  disabled,
  height,
}: DropdownMenuSheetItemFrameStyleInputs): FlexCompatProps {
  return {
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
  }
}

export function dropdownMenuSheetItemFrameClassName(inputs: DropdownMenuSheetItemFrameStyleInputs): string {
  return flexCompatClassName(dropdownMenuSheetItemFrameProps(inputs))
}

/**
 * The DropdownMenuSheetItem frame for rendering (INFRA-3217): a caller
 * `height` outside the closed set (e.g. `height={44}`) rides the
 * inline-value lane instead of shipping a dead class.
 */
export function dropdownMenuSheetItemFrameEmission(inputs: DropdownMenuSheetItemFrameStyleInputs): CompatEmission {
  return menuFlexEmission(dropdownMenuSheetItemFrameProps(inputs))
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
  // Same order as getMenuItemColorCompat: override > destructive > disabled > neutral1.
  const resolved = textColor || (destructive ? '$statusCritical' : disabled ? '$neutral2' : '$neutral1')
  if (typeof resolved !== 'string') {
    // The legacy type admits Tamagui Variable objects; no call site passes
    // them. Fail fast instead of guessing (compat token policy).
    throw new Error('menu-compat: non-string color values are not supported without the Tamagui runtime')
  }
  return resolved
}

function dropdownMenuSheetItemLabelProps(inputs: DropdownMenuSheetItemLabelStyleInputs): TextCompatProps {
  const { variant, destructive, disabled, textColor, allowMultiline = false } = inputs
  return {
    flexShrink: 1,
    ...(allowMultiline ? {} : { numberOfLines: 1 }),
    variant: variant === 'small' ? 'buttonLabel3' : 'buttonLabel2',
    color: resolveLabelColor(inputs),
    '$group-hover': destructive || textColor ? undefined : { color: disabled ? '$neutral2' : '$neutral1Hovered' },
  }
}

/** Compile the item label className: the Text props the native leg renders. */
export function dropdownMenuSheetItemLabelClassName(inputs: DropdownMenuSheetItemLabelStyleInputs): string {
  return textCompatClassName(dropdownMenuSheetItemLabelProps(inputs))
}

/** The label's fixed chrome: the Text frame plus every enumerable label input combination. */
function dropdownMenuSheetItemLabelFixedClasses(): string[] {
  const classNames = [...textFixedCompatClasses()]
  for (const variant of ['small', 'medium'] as const) {
    for (const disabled of [false, true]) {
      for (const destructive of [false, true]) {
        classNames.push(dropdownMenuSheetItemLabelClassName({ variant, disabled, destructive }))
      }
    }
  }
  return classNames
}

/**
 * The item label for rendering (INFRA-3217): a caller `textColor` outside the
 * pinned theme palette (e.g. `'#ABCDEF'`) rides the inline-value lane instead
 * of shipping a dead raw class — the last surviving raw path from the round-2
 * review.
 */
export function dropdownMenuSheetItemLabelEmission(inputs: DropdownMenuSheetItemLabelStyleInputs): CompatEmission {
  return textCompatEmissionWithFixed(dropdownMenuSheetItemLabelProps(inputs), dropdownMenuSheetItemLabelFixedClasses)
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

/**
 * Every class the menu chrome compiles to across its input space (variant ×
 * disabled × destructive) — the menu's contribution to the generated
 * compat-class safelist.
 */
export function menuFixedCompatClasses(): string[] {
  const classNames: string[] = [
    menuContentContainerClassName(),
    dropdownMenuSheetItemSubheaderClassName(),
    menuSeparatorClassName(),
  ]
  for (const variant of ['small', 'medium'] as const) {
    for (const disabled of [false, true]) {
      classNames.push(dropdownMenuSheetItemFrameClassName({ variant, disabled }))
      for (const destructive of [false, true]) {
        classNames.push(dropdownMenuSheetItemLabelClassName({ variant, disabled, destructive }))
      }
    }
  }
  return classNames
}
