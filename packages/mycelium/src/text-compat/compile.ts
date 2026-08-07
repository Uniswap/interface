/**
 * The Text binding of the shared compat compiler: computes the element's
 * global font context, then composes the Text per-style-object compiler
 * (`style-classes.ts`) through the generic pool orchestration in
 * `../compat/compose`. The workbench harness
 * (`labs/workbench/scripts/verify-text-parity.mts`) proves the output
 * equivalent to what Tamagui emits for the same props.
 */
import { composeCompatClassName } from '../compat/compose'
import { MEDIA_VARIANT } from '../compat/media'
import type { MediaPropKey } from '../compat/props'
import type { TextCompatProps, TextCompatStyleProps } from './props'
import { BASE_CLASSES, effectiveFontToken, styleClasses } from './style-classes'

export type { TextCompatProps, TextCompatStyleProps } from './props'

/**
 * The one font context every `$`-relative fontSize/lineHeight token on the
 * element resolves against, replicating Tamagui's web behavior (verified by
 * the parity harness): the LAST fontFamily-setting pool wins — base first,
 * then $platform-web, then the media pools in declaration order — regardless
 * of whether its media query is active. A `$md={{ variant: 'body3' }}` on a
 * heading therefore re-keys even the base variant's tokens to the body font,
 * exactly like the legacy Text renders it.
 */
function globalFontToken(props: TextCompatProps): string {
  let font = effectiveFontToken(props)
  const platformWeb = props['$platform-web']
  if (platformWeb !== undefined) {
    font = effectiveFontToken(platformWeb, font)
  }
  for (const mediaKey of Object.keys(MEDIA_VARIANT) as MediaPropKey[]) {
    const mediaStyle = props[mediaKey]
    if (mediaStyle !== undefined) {
      font = effectiveFontToken(mediaStyle, font)
    }
  }
  return font
}

/**
 * Compile the full Text prop contract to a Tailwind className. Throws on
 * tokens with no pinned spore counterpart instead of guessing.
 */
export function textCompatClassName(props: TextCompatProps): string {
  const font = globalFontToken(props)
  return composeCompatClassName<TextCompatStyleProps>({
    props,
    baseClasses: BASE_CLASSES,
    styleClasses: (style) => styleClasses(style, font),
  })
}
