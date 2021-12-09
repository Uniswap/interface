/* eslint-disable no-restricted-imports */
import styled, {
  css as styledCss,
  keyframes as styledKeyframes,
  ThemedBaseStyledInterface,
  ThemedCssFunction,
  ThemeProvider as StyledProvider,
  ThemeProviderComponent,
  useTheme as useStyled,
} from 'styled-components/macro'

import { ComputedTheme as Theme } from './theme'

export default styled as unknown as ThemedBaseStyledInterface<Theme>
export const css = styledCss as unknown as ThemedCssFunction<Theme>
export const keyframes = styledKeyframes
export const useTheme = useStyled as unknown as () => Theme
export const ThemedProvider = StyledProvider as unknown as ThemeProviderComponent<Theme>
