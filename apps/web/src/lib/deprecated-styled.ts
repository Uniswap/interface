/**
 * Note: we're deprecating styled-components in favor of Tamagui, which you
 * should import from `ui/src`. It should cover most of what styled-components
 * handles.
 *
 * If not, you can bail to using either $platform-web style prop or inline style
 * tag, or we can add on any one-off CSS by either inlining a style tag in the
 * component itself, or importing it via CSS modules.
 */
import styledFn, {
  createGlobalStyle as createGlobalStyleSC,
  css as cssSC,
  type DefaultTheme as DefaultThemeSC,
  keyframes as keyframesFnSC,
  ThemeProvider as ThemeProviderSC,
  // biome-ignore lint/style/noRestrictedImports: This is a legacy compatibility file that re-exports styled-components for migration purposes
} from 'styled-components'

/** @deprecated use `styled` from `ui/src` instead */
export const deprecatedStyled = styledFn

/** @deprecated use alternatives from `ui/src` instead */
export const css = cssSC

/** @deprecated use alternatives from `ui/src` instead */
export const keyframes = keyframesFnSC

/** @deprecated use alternatives from `ui/src` instead */
export const createGlobalStyle = createGlobalStyleSC

/** @deprecated use alternatives from `ui/src` instead */
export const ThemeProvider = ThemeProviderSC

/** @deprecated use alternatives from `ui/src` instead */
export type DefaultTheme = DefaultThemeSC
