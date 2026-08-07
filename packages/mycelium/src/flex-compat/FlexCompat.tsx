import { createCompatComponent } from '../compat/dom'
import { flexCompatClassName } from './compile'
import type { FlexCompatProps } from './props'

/**
 * Web-only, drop-in replacement for the `ui/src` Tamagui `Flex`, rendering the
 * same CSS via Tailwind classes (see `./compile`) through the shared compat
 * DOM wrapper (`../compat/dom`). The parity suite in
 * `packages/tailwind/src/parity` proves the equivalence per prop pool, value,
 * scope (pseudo/media/group), and theme.
 *
 * Not exported from the package barrel: it exists for the Tamagui → Tailwind
 * migration path; `components/flex.tsx` remains Mycelium's own Flex API.
 */
export const FlexCompat = createCompatComponent<FlexCompatProps>(flexCompatClassName, 'FlexCompat')
