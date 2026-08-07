/**
 * The TouchableArea binding of the shared compat compiler: resolves the
 * wrapper + frame semantics (`./resolve`), then composes the per-style-object
 * compiler through the generic pool orchestration in `../compat/compose`.
 * The parity suite in `packages/tailwind/src/parity/touchable-area` proves
 * the output equivalent to what the real `ui/src` TouchableArea renders.
 */
import { composeCompatClassName } from '../compat/compose'
import type { ColorValue } from '../compat/props'
import { arbitrary, RESET_CLASSES } from '../compat/style-classes'
import { COLOR_TOKEN_CLASS, lookupToken, THEMED_COLOR_TOKEN_CLASSES } from '../compat/tokens'
import { flexStyleClasses } from '../flex-compat/flex-style-classes'
import type { TouchableAreaCompatProps, TouchableAreaCompatStyleProps } from './props'
import { resolveTouchableAreaCompatProps, SURFACE5_HOVERED } from './resolve'

export type { TouchableAreaCompatProps, TouchableAreaCompatStyleProps } from './props'

/**
 * TouchableArea frame defaults reproducing what the legacy styled frame
 * contributes on web (verified against its injected atomic CSS by the parity
 * suite): the shared view reset + column layout, the always-on group
 * container declarations (`container-type: normal` — the frame's
 * `$platform-web` override, layout-inert, unlike Flex's pinned inline-size),
 * the 12px radius, transparent background, and pointer cursor. Cursor is an
 * arbitrary property so later `[cursor:*]` styles merge over it.
 */
const FRAME_CLASSES = `flex flex-col items-stretch basis-auto ${RESET_CLASSES} shrink-0 [container-type:normal] rounded-[12px] [cursor:pointer]`

/** The `<a>`-mode base additions (the legacy modifier-press wiring). */
const ANCHOR_CLASSES = '[text-decoration-line:none] [text-decoration:none] [color:inherit]'

function baseClasses(props: TouchableAreaCompatProps): string {
  const group = props.group ?? true
  const containerName = group === true ? 'true' : String(group)
  const cls = [`[container-name:${arbitrary(containerName)}]`, FRAME_CLASSES]
  // The raised variant drops the frame's transparent background (its own
  // backgroundColor is required by the legacy contract).
  if (props.variant !== 'raised') {
    cls.push('bg-transparent')
  }
  if (props.modifierPressHref !== undefined) {
    cls.push(ANCHOR_CLASSES)
  }
  return cls.join(' ')
}

/** Outline-color counterpart of the shared semantic color model. */
function outlineColorClasses(value: ColorValue): string[] {
  const semantic = lookupToken(COLOR_TOKEN_CLASS, value)
  if (semantic === 'white' || semantic === 'black' || semantic === 'transparent') {
    return [`[outline-color:var(--color-${semantic})]`]
  }
  if (semantic !== undefined) {
    return [`[outline-color:var(--${semantic})]`]
  }
  const themed = lookupToken(THEMED_COLOR_TOKEN_CLASSES, value)
  if (themed !== undefined) {
    return [`[outline-color:var(--color-${themed.light})]`, `dark:[outline-color:var(--color-${themed.dark})]`]
  }
  if (value.startsWith('$')) {
    throw new Error(`compat: outline color token "${value}" has no @universe/tailwind counterpart`)
  }
  return [`[outline-color:${arbitrary(value)}]`]
}

/**
 * `$surface5Hovered` has no `@universe/tailwind` counterpart; both spore
 * themes pin it to the same value (see `./resolve`), so it compiles to the
 * raw color instead of failing fast like other unmapped tokens.
 */
function withSurface5Hovered(style: TouchableAreaCompatStyleProps): TouchableAreaCompatStyleProps {
  if (style.backgroundColor !== '$surface5Hovered' && style.borderColor !== '$surface5Hovered') {
    return style
  }
  const out = { ...style }
  if (out.backgroundColor === '$surface5Hovered') {
    out.backgroundColor = SURFACE5_HOVERED
  }
  if (out.borderColor === '$surface5Hovered') {
    out.borderColor = SURFACE5_HOVERED
  }
  return out
}

/**
 * The frame's focus-visible scale ring compiles as `scaleX() scaleY()` in that
 * order (the legacy styled-options static output), unlike the generic
 * descending-name transform composition — special-cased for the bare
 * scaleX+scaleY pair so the emitted declaration is byte-identical.
 */
function scaleRingTransform(style: TouchableAreaCompatStyleProps): TouchableAreaCompatStyleProps {
  const { scaleX, scaleY } = style
  if (scaleX === undefined || scaleY === undefined || style.scale !== undefined || style.transform !== undefined) {
    return style
  }
  const { scaleX: _scaleX, scaleY: _scaleY, ...rest } = style
  return { ...rest, transform: `scaleX(${scaleX}) scaleY(${scaleY})` }
}

/** Compile one TouchableArea style object (no frame classes) — the recursive unit. */
export function touchableAreaStyleClasses(style: TouchableAreaCompatStyleProps): string[] {
  const { outlineColor, WebkitBackdropFilter, ...rest } = scaleRingTransform(withSurface5Hovered(style))
  const cls = flexStyleClasses(rest as TouchableAreaCompatStyleProps)
  if (outlineColor !== undefined) {
    cls.push(...outlineColorClasses(String(outlineColor)))
  }
  if (WebkitBackdropFilter !== undefined) {
    // Alongside backdropFilter for Safari ≤17; the parity normalizer folds the
    // duplicate prefixed twin on both sides, so this is proven by emission
    // (compile tests + manifest), not by a scope diff.
    cls.push(`[-webkit-backdrop-filter:${arbitrary(WebkitBackdropFilter)}]`)
  }
  return cls
}

/**
 * Compile the full TouchableArea prop contract to a Tailwind className. Throws
 * on tokens with no `@universe/tailwind` counterpart instead of guessing.
 */
export function touchableAreaCompatClassName(props: TouchableAreaCompatProps): string {
  return composeCompatClassName<TouchableAreaCompatStyleProps>({
    props: resolveTouchableAreaCompatProps(props),
    baseClasses: baseClasses(props),
    styleClasses: touchableAreaStyleClasses,
  })
}
