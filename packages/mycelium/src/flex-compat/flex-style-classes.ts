/**
 * The Flex-specific half of the FlexCompat compiler: the variant shorthands
 * (row/centered/fill/…), the display map, and the Flex frame defaults. The
 * universal style translation (margin/padding, sizing, visuals, positioning,
 * transforms, shadows, long tail) and the flexbox surface are the shared
 * `commonStyleClasses`/`flexboxStyleClasses` core.
 */
import {
  type ClassList,
  commonStyleClasses,
  enumClass,
  flexboxStyleClasses,
  insetClasses,
  RESET_CLASSES,
} from '../compat/style-classes'
import type { FlexCompatStyleProps } from './props'

const DISPLAY_CLASS: Record<string, string> = {
  flex: 'flex',
  none: 'hidden',
  block: 'block',
  inline: 'inline',
  'inline-flex': 'inline-flex',
  contents: 'contents',
  inherit: '[display:inherit]',
}

/**
 * Flex frame defaults reproducing what Tamagui's `View` contributes on web
 * (verified against its injected atomic CSS by the parity suite): the shared
 * compat reset plus Flex's own column layout box.
 */
export const BASE_CLASSES = `flex flex-col items-stretch basis-auto ${RESET_CLASSES} shrink-0`

/**
 * Variants first — explicit props later override them via tailwind-merge,
 * mirroring Tamagui's styled() precedence (props beat variants).
 */
function variantClasses({ row, shrink, grow, fill, centered, maxContent, inset }: FlexCompatStyleProps): ClassList {
  const cls: ClassList = []
  if (row !== undefined) {
    cls.push(row ? 'flex-row' : 'flex-col')
  }
  if (shrink) {
    cls.push('shrink')
  }
  if (grow) {
    cls.push('grow')
  }
  if (fill) {
    // Tamagui's web output for `flex: 1` is flex-grow:1 + flex-shrink:1 with the
    // base flex-basis:auto untouched (NOT the CSS `flex: 1` shorthand, whose
    // basis is 0%). Emit the same longhands.
    cls.push('grow', 'shrink')
  }
  if (centered) {
    cls.push('items-center', 'justify-center')
  }
  if (maxContent) {
    cls.push('w-max')
  }
  cls.push(...insetClasses(inset))
  return cls
}

/** Shared with view-compat: the plain View maps display values identically. */
export const flexDisplayClass = (value: string): string => enumClass({ map: DISPLAY_CLASS, value, cssProp: 'display' })

/** Compile one Flex style object (no BASE_CLASSES) — the recursive unit. */
export function flexStyleClasses(props: FlexCompatStyleProps): string[] {
  const cls: ClassList = [
    ...variantClasses(props),
    ...flexboxStyleClasses(props, flexDisplayClass),
    ...commonStyleClasses(props),
  ]
  return cls.filter((entry): entry is string => typeof entry === 'string' && entry !== '')
}
