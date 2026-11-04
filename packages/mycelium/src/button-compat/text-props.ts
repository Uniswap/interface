/**
 * The styled `Button.Text` contract (INFRA-3550), shared by the three
 * ButtonCompat legs. Deliberately NOT the full compat Text surface: the scope
 * is exactly the legacy `Button.Text` style props the blocked Toucan call
 * sites use (KycActionButton's hover-reveal, ToucanActionButton's label
 * color) — one prop family per PR, like the dimension/gap/flex lanes. The
 * full rebuilt CustomButtonText surface is the styled-factory lane's
 * `../button-frame-compat/ButtonTextCompat`, not this.
 */
import { getMaybeHexOrRgbColor, type HexOrRgbColor } from '../button-frame-compat/custom-color'
import { droppedPropNames } from '../compat/native-diagnostics'
import type { CompatAnimationProps } from '../compat/props'
import type { TextCompatStyleProps } from '../text-compat/props'
import { styleClasses as textStyleClasses } from '../text-compat/style-classes'
import type { ButtonContentClassProps, ButtonVariant } from './compile'

/**
 * The scoped style pool — also the shape of the `$group-hover` pool. Each
 * prop runs through the shared Text style compiler, so tokens and values
 * behave exactly like TextCompat's. `transition` is here because it is the
 * compat expression of the legacy `animation` timing this surface accepts
 * (scoped to non-color properties, per the CLAUDE.md transition rule).
 */
export type ButtonTextStyleProps = Pick<
  TextCompatStyleProps,
  'color' | 'fontSize' | 'opacity' | 'position' | 'top' | 'whiteSpace' | 'transition'
>

/** The caller-visible legacy style surface of `Button.Text`. */
export interface ButtonTextStyleSurface extends ButtonTextStyleProps {
  /**
   * BUTTON variant override, defaulting to the parent Button's — legacy
   * CustomButtonText's `variant` IS the button variant (styled-context
   * override), not text-compat's typography variant.
   */
  variant?: ButtonVariant
  /**
   * Accepted for compatibility, like the shared compat surface: the Spore
   * curve names are driver timings Tamagui resolved at runtime. Timing rides
   * an explicit `transition` instead — `SPORE_ANIMATION_CURVE_CSS` in
   * `@universe/tailwind/animations` carries the number-exact ported curves.
   */
  animation?: CompatAnimationProps<never>['animation']
  /**
   * Hover pool on the nearest `group` anchor — the parent ButtonCompat's
   * caller-visible `group` prop (never the internal `group/sbtn` pool).
   */
  '$group-hover'?: ButtonTextStyleProps
}

/**
 * The styled props actually SET that the NATIVE leg drops — its
 * `warnUnsupportedNativeProps` list. `variant`, `color` and `fontSize` are
 * excluded because the native leg wires them; `animation` because it is inert
 * on every leg, like the shared compat surface.
 */
export function buttonTextDroppedStyleNames(props: ButtonTextStyleSurface): string[] {
  const { variant: _variant, color: _color, fontSize: _fontSize, animation: _animation, ...dropped } = props
  return droppedPropNames(dropped)
}

/**
 * Both legs' caller `color`, split by precedence: a theme token always beats the cell (its class, to
 * resolve); a hex/rgb `pin` yields to the disabled palette and to a custom background's contrast class.
 */
export function buttonTextCallerColor(
  color: ButtonTextStyleProps['color'],
  ctx: Pick<ButtonContentClassProps, 'isDisabled' | 'customTextClass'>,
): { tokenClassName: string; pin: HexOrRgbColor | undefined } {
  const customColor = getMaybeHexOrRgbColor(color)
  if (customColor !== undefined) {
    const yields = ctx.isDisabled || ctx.customTextClass !== undefined
    return { tokenClassName: '', pin: yields ? undefined : customColor }
  }
  return { tokenClassName: color === undefined ? '' : textStyleClasses({ color }).join(' '), pin: undefined }
}
