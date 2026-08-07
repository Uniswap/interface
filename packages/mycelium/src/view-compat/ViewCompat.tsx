import { createCompatComponent } from '../compat/dom'
import { viewCompatClassName } from './compile'
import type { ViewCompatProps } from './props'

/**
 * Web-only, drop-in replacement for the `ui/src` Tamagui `View`, rendering
 * the same CSS via Tailwind classes (see `./compile`) through the shared
 * compat DOM wrapper (`../compat/dom`). The parity block in
 * `packages/tailwind/src/parity/view` pins the layout-prop families; the
 * shared pools are proven by the Flex binding of the same suite.
 *
 * Exported from the package barrel as `View` (INFRA-2950). View is demoted
 * from the migration critical path — deliberately do not grow it.
 */
export const ViewCompat = createCompatComponent<ViewCompatProps>(viewCompatClassName, 'ViewCompat')
