/**
 * Pure compilers for the FRAME-TIER legacy button surface (INFRA-3315).
 *
 * `ButtonCompat` (../button-compat) is the parity-proven twin of the whole
 * legacy `Button` — closed variant surface, its own content management. The
 * legacy `ui/src` internals being rebuilt here expose one tier lower:
 * `CustomButtonFrame` / `CustomButtonText` / `ThemedIcon` /
 * `ThemedSpinningLoader` are separately exported building blocks whose
 * consumers pass the FULL Tamagui style-prop surface (`GetProps<typeof
 * CustomButtonFrame>`): `width`, `mt`, `$md`, `hoverStyle`, `tag`/`href`, ….
 *
 * This module adds exactly that open lane and nothing else:
 *
 *  - the CLOSED variant surface renders through `../button-compat/compile`'s
 *    class tables verbatim, so the 2,912-cell workbench parity proof (and the
 *    byte-frozen `web-class-pin` surface) carries over unchanged;
 *  - the OPEN prop surface compiles through the shared deterministic-emission
 *    engine (`../compat/compose` with the Flex style compiler), the same
 *    lane `FlexCompat` renders through — in-set classes verbatim, out-of-set
 *    values on safelisted var-indirection twins, so emission is sound from
 *    any call site;
 *  - the `IconButtonFrame` / `DropdownButtonFrame` / `DropdownButtonText`
 *    styled()-extension deltas become literal class tables here (this file is
 *    under the `@source`-scanned `packages/mycelium/src` root — the classes
 *    must NOT live in `packages/ui`, which no app scans).
 *
 * Everything here is pure and platform-neutral; the platform legs live in
 * `./ButtonFrameCompat.{web,native}.tsx`.
 */
import type { ButtonEmphasis, ButtonSize, ButtonVariant } from '../button-compat/compile'
import { composeCompatClassName, composeCompatEmission, type CompatEmission } from '../compat/compose'
import type { ColorValue, CompatProps } from '../compat/props'
import { flexStyleClasses } from '../flex-compat/flex-style-classes'
import type { FlexCompatStyleProps } from '../flex-compat/props'
import type { TextCompatStyleProps } from '../text-compat/props'
import { styleClasses as textStyleClasses } from '../text-compat/style-classes'

export type {
  ButtonEmphasis,
  ButtonFocusScaling,
  ButtonIconPosition,
  ButtonSize,
  ButtonVariant,
} from '../button-compat/compile'

/**
 * The open style-object surface a legacy button frame accepts: the Flex
 * surface plus inheritable `color` (legacy `styled(XStack)` accepts it; 26
 * consumer call sites pass it — the value cascades into label/icon
 * `currentColor` on web).
 */
export type ButtonFrameStyleProps = FlexCompatStyleProps & {
  color?: ColorValue
}

/** The full open prop contract (style surface × pseudo/media/theme/group/event pools). */
export type ButtonFrameOpenProps = CompatProps<ButtonFrameStyleProps>

function buttonFrameStyleClasses(style: ButtonFrameStyleProps): string[] {
  const { color, ...flexStyle } = style
  const classes = flexStyleClasses(flexStyle)
  if (color !== undefined) {
    classes.push(...textStyleClasses({ color } as TextCompatStyleProps))
  }
  return classes
}

/**
 * Compile the OPEN prop surface through the deterministic-emission engine.
 * No frame defaults ride along (`baseClasses: ''`): the closed variant
 * surface is compiled separately by `../button-compat/compile` so it stays
 * byte-identical to the parity-proven twin; callers `cn()` this AFTER the
 * variant classes so a consumer prop wins the merge, exactly as a Tamagui
 * prop beats a variant style.
 */
const EMPTY_FIXED_CLASSES = (): string[] => []

export function buttonFrameOpenEmission(props: ButtonFrameOpenProps): CompatEmission {
  return composeCompatEmission<ButtonFrameStyleProps>({
    props,
    baseClasses: '',
    styleClasses: buttonFrameStyleClasses,
    fixedClasses: EMPTY_FIXED_CLASSES,
  })
}

/**
 * Raw class composition of the open surface for the NATIVE leg (the
 * `flexCompatClassName` doctrine): uniwind resolves the semantic/enum
 * utilities on Metro; runtime-interpolated families additionally ride the RN
 * style object built by `compat/native-style` (see the native leg).
 */
export function buttonFrameOpenClassName(props: ButtonFrameOpenProps): string {
  return composeCompatClassName<ButtonFrameStyleProps>({
    props,
    baseClasses: '',
    styleClasses: buttonFrameStyleClasses,
  })
}

/* ----------------------------- IconButtonFrame ----------------------------- */

/**
 * The `styled(CustomButtonFrame, …)` size delta from
 * `ui/src/components/buttons/IconButton/IconButton.tsx`: an icon button is
 * square, so each size collapses the frame's directional padding to one
 * uniform value ($spacing6/8/8/12/16) while keeping the size's radius.
 * Compiled AFTER the frame classes so the padding override wins the merge —
 * the same precedence Tamagui gives an extending styled() config.
 */
export const ICON_BUTTON_SIZE_CLASSES: Record<ButtonSize, string> = {
  xxsmall: 'p-1.5 rounded-12',
  xsmall: 'p-2 rounded-12',
  small: 'p-2 rounded-12',
  medium: 'p-3 rounded-16',
  large: 'p-4 rounded-20',
}

/**
 * Legacy `useIconSizes` for `typeOfButton: 'icon'`: `$icon.16/16/20/24/24`,
 * where the button-type sizes use the label line-height instead
 * (`../button-compat/compile`'s ICON/NATIVE_ICON tables).
 */
export const ICON_BUTTON_ICON_SIZE_PX: Record<ButtonSize, number> = {
  xxsmall: 16,
  xsmall: 16,
  small: 20,
  medium: 24,
  large: 24,
}

/** The web icon box for icon buttons, sizing the glyph via CSS like `../button-compat`'s ICON_SIZE. */
export const ICON_BUTTON_ICON_SIZE_CLASSES: Record<ButtonSize, string> = {
  xxsmall: '[&_svg]:size-[16px]',
  xsmall: '[&_svg]:size-[16px]',
  small: '[&_svg]:size-[20px]',
  medium: '[&_svg]:size-[24px]',
  large: '[&_svg]:size-[24px]',
}

/* ---------------------------- DropdownButtonFrame --------------------------- */

/**
 * `DropdownButtonFrame` (`styled(CustomButtonFrame, …)`) deltas: the frame
 * pins `justifyContent: 'space-between'`, and while `isExpanded` the
 * secondary/tertiary/text-only emphases repaint to a transparent background
 * (secondary keeps a `$surface3` border with a `$surface3Hovered` hover).
 * Variant is pinned to `default` by the legacy config, so only emphasis keys.
 */
export const DROPDOWN_FRAME_BASE_CLASSES = 'justify-between'

export const DROPDOWN_FRAME_EXPANDED_CLASSES: Record<ButtonEmphasis, string> = {
  primary: '',
  secondary: 'bg-transparent border-surface3 hover:border-surface3-hovered hover:bg-transparent',
  tertiary: 'bg-transparent',
  'text-only': 'bg-transparent',
}

/**
 * `DropdownButtonText` (`styled(CustomButtonText, …)`) delta: while
 * `isExpanded`, the label paints `$neutral2` with a `$neutral2Hovered` hover —
 * both on its own hover and on the frame group's hover (the legacy
 * `$group-item-hover`; the frame carries the `group/sbtn` marker).
 */
export const DROPDOWN_TEXT_EXPANDED_CLASSES =
  'text-neutral2 hover:text-neutral2-hovered group-hover/sbtn:text-neutral2-hovered'

/**
 * Concrete expanded chevron/icon color classes for `DropdownButton`'s
 * cloneElement lane (legacy `EXPANDED_COLOR` / `EXPANDED_HOVER_COLOR`).
 */
export const DROPDOWN_EXPANDED_ICON_CLASSES = 'text-neutral2 group-hover/sbtn:text-neutral2-hovered'

/* --------------------------------- context --------------------------------- */

/** Shared context payload (what legacy `buttonStyledContext` broadcast). */
export interface ButtonFrameContextValue {
  size: ButtonSize
  variant: ButtonVariant
  emphasis: ButtonEmphasis
  isDisabled: boolean
  /** Legacy `custom-background-color`: the frame's custom bg, for label/icon contrast. */
  customBackgroundColor?: string
  /** Contrast-passing text class derived from `customBackgroundColor`. */
  customTextClass?: string
  /** Live interaction state — native only (web scopes states in CSS). */
  hovered?: boolean
  pressed?: boolean
}
