/**
 * Component-agnostic pool orchestration for the Tamagui→Tailwind compilers:
 * composes a component's per-style-object compiler across the base pool,
 * pseudo-state pools (`hover:`, `active:`, …), responsive media pools
 * (`media-sm:`, …), platform/theme overrides, group-state pools
 * (`group-hover/item:`, …), and the animation presets. Each component supplies
 * its own `styleClasses` (which classes one style object yields) and its frame
 * `baseClasses`; everything else is shared. The parity suite in
 * `packages/tailwind/src/parity` proves the output equivalent to Tamagui's.
 */
import { cn } from '../cn'
import { ENTER_EXIT_PRESET_CLASSES, ENTER_PRESET_CLASSES, EXIT_PRESET_CLASSES } from './animations'
import { groupStateVariant, parseGroupStateProp } from './group'
import { MEDIA_VARIANT } from './media'
import type { CompatAnimationProps, CompatBehavioralProps, CompatProps, CompatPseudoProps, MediaPropKey } from './props'

function withVariant(variant: string, classes: string[]): string[] {
  return classes.map((cls) => `${variant}:${cls}`)
}

const PSEUDO_VARIANTS = [
  ['hoverStyle', 'hover'],
  ['pressStyle', 'active'],
  ['focusStyle', 'focus'],
  ['focusVisibleStyle', 'focus-visible'],
  ['focusWithinStyle', 'focus-within'],
  // Tamagui web gates disabledStyle behind an `[aria-disabled]` attribute
  // selector (the `disabled` prop sets the attribute); the `aria-disabled:`
  // variant is the same mechanism.
  ['disabledStyle', 'aria-disabled'],
] as const

type PseudoStyleKey = (typeof PSEUDO_VARIANTS)[number][0]

const FORCE_STYLE_KEY: Record<NonNullable<CompatBehavioralProps['forceStyle']>, PseudoStyleKey> = {
  hover: 'hoverStyle',
  press: 'pressStyle',
  focus: 'focusStyle',
  focusVisible: 'focusVisibleStyle',
  focusWithin: 'focusWithinStyle',
}

function animationClasses(props: CompatAnimationProps): string[] {
  const cls: string[] = []
  if (props.animateEnter !== undefined) {
    cls.push(ENTER_PRESET_CLASSES[props.animateEnter])
  }
  if (props.animateExit !== undefined) {
    cls.push(EXIT_PRESET_CLASSES[props.animateExit])
  }
  if (props.animateEnterExit !== undefined) {
    cls.push(ENTER_EXIT_PRESET_CLASSES[props.animateEnterExit])
  }
  return cls
}

function groupMarkerClasses(group: CompatBehavioralProps['group']): string[] {
  if (group === undefined || group === false) {
    return []
  }
  return [group === true ? 'group' : `group/${group}`]
}

export interface ComposeCompatOptions<S> {
  props: CompatProps<S>
  /** The component's frame defaults (e.g. Flex's `flex flex-col …`). */
  baseClasses: string
  /** The component's per-style-object compiler. */
  styleClasses: (style: S) => string[]
}

/**
 * Compile a component's full prop contract to a Tailwind className. Throws on
 * tokens with no `@universe/tailwind` counterpart instead of guessing.
 */
export function composeCompatClassName<S>({ props, baseClasses, styleClasses }: ComposeCompatOptions<S>): string {
  // Compile a style object plus its nested pseudo pools, applying `prefix`
  // variants outermost. Closes over `styleClasses` (the component's compiler).
  const styleAndPseudoClasses = (style: S & CompatPseudoProps<S>, prefix?: string): string[] => {
    const cls = styleClasses(style)
    for (const [pseudoKey, variant] of PSEUDO_VARIANTS) {
      const pseudoStyle = style[pseudoKey]
      if (pseudoStyle !== undefined) {
        cls.push(...withVariant(variant, styleClasses(pseudoStyle)))
      }
    }
    return prefix === undefined ? cls : withVariant(prefix, cls)
  }

  const forced = props.forceStyle !== undefined ? props[FORCE_STYLE_KEY[props.forceStyle]] : undefined
  const platformWeb = props['$platform-web']
  const cls: string[] = [
    baseClasses,
    // Base pool, then $platform-web overrides (web builds always apply them),
    // then the state-forced merge — later classes win via tailwind-merge.
    ...styleAndPseudoClasses(props),
    ...(platformWeb !== undefined ? styleAndPseudoClasses(platformWeb) : []),
    ...(forced !== undefined ? styleClasses(forced) : []),
  ]
  for (const [mediaKey, variant] of Object.entries(MEDIA_VARIANT) as [MediaPropKey, string][]) {
    const mediaStyle = props[mediaKey]
    if (mediaStyle !== undefined) {
      cls.push(...styleAndPseudoClasses(mediaStyle, variant))
    }
  }
  const themeDark = props['$theme-dark']
  if (themeDark !== undefined) {
    cls.push(...withVariant('dark', styleClasses(themeDark)))
  }
  const themeLight = props['$theme-light']
  if (themeLight !== undefined) {
    cls.push(...withVariant('not-dark', styleClasses(themeLight)))
  }
  for (const key of Object.keys(props)) {
    if (!key.startsWith('$group-')) {
      continue
    }
    const parts = parseGroupStateProp(key)
    if (parts === undefined) {
      throw new Error(`compat: unsupported group prop "${key}" (container-size group queries have no CSS mapping)`)
    }
    const groupStyle = (props as Record<string, unknown>)[key] as S | undefined
    if (groupStyle !== undefined) {
      cls.push(...withVariant(groupStateVariant(parts), styleClasses(groupStyle)))
    }
  }
  cls.push(...groupMarkerClasses(props.group), ...animationClasses(props))
  return cn(cls, props.className)
}
