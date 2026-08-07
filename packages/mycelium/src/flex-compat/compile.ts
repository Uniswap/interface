/**
 * The Flex binding of the shared compat compiler: composes the Flex frame
 * defaults and the Flex per-style-object compiler through the generic pool
 * orchestration in `../compat/compose`. The parity suite in
 * `packages/tailwind/src/parity` proves the output equivalent to Tamagui's.
 */
import { composeCompatClassName } from '../compat/compose'
import { BASE_CLASSES, flexStyleClasses } from './flex-style-classes'
import type { FlexCompatProps, FlexCompatStyleProps } from './props'

export type { FlexCompatProps, FlexCompatStyleProps } from './props'

/**
 * Compile the full Flex prop contract to a Tailwind className. Throws on
 * tokens with no `@universe/tailwind` counterpart instead of guessing.
 */
export function flexCompatClassName(props: FlexCompatProps): string {
  return composeCompatClassName<FlexCompatStyleProps>({
    props,
    baseClasses: BASE_CLASSES,
    styleClasses: flexStyleClasses,
  })
}
