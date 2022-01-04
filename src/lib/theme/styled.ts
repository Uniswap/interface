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

import { ComputedTheme } from './theme'

export default styled as unknown as ThemedBaseStyledInterface<ComputedTheme>
export const css = styledCss as unknown as ThemedCssFunction<ComputedTheme>
export const keyframes = styledKeyframes
export const useTheme = useStyled as unknown as () => ComputedTheme
export const ThemedProvider = StyledProvider as unknown as ThemeProviderComponent<ComputedTheme>
