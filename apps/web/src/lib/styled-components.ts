/**
 * Note: we're deprecating styled-components in favor of Tamagui, which you
 * should import from `ui/src`. It should cover most of what styled-components
 * handles.
 *
 * If not, you can bail to using either $platform-web style prop or inline style
 * tag, or we can add on any one-off CSS by either inlining a style tag in the
 * component itself, or importing it via CSS modules.
 */

// biome-ignore lint/style/noRestrictedImports: legacy styled-components needed for deprecation compatibility
import styledFn from 'styled-components'

/** @deprecated use `styled` from `ui/src` instead */
export default styledFn

// biome-ignore-start lint/style/noRestrictedImports: re-export needed for backward compatibility
// eslint-disable-next-line no-restricted-syntax
export * from 'styled-components'
// biome-ignore-end lint/style/noRestrictedImports: re-export needed for backward compatibility
