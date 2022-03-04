/* eslint-disable no-restricted-imports */
import styledDefault, {
  css as styledCss,
  keyframes as styledKeyframes,
  ThemedBaseStyledInterface,
  ThemedCssFunction,
  ThemeProvider as StyledProvider,
  ThemeProviderComponent,
  useTheme as useStyled,
} from 'styled-components/macro'

import { ComputedTheme } from './theme'

export const css = styledCss as unknown as ThemedCssFunction<ComputedTheme>
export const keyframes = styledKeyframes
export const useTheme = useStyled as unknown as () => ComputedTheme
export const ThemedProvider = StyledProvider as unknown as ThemeProviderComponent<ComputedTheme>

// nextjs imports all of styled-components/macro instead of its default. Check for and resolve this at runtime.
const styled = (styledDefault instanceof Function
  ? styledDefault
  : (styledDefault as { default: typeof styledDefault }).default) as unknown as ThemedBaseStyledInterface<ComputedTheme>
export default styled
