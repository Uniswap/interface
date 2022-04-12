import { css } from 'lib/theme'

export const loadingOpacity = 0.6

export const loadingCss = css`
  filter: grayscale(1);
  opacity: ${loadingOpacity};
`

// need to use isLoading as `loading` is a reserved prop
export const loadingTransitionCss = css<{ isLoading: boolean }>`
  opacity: ${({ isLoading }) => isLoading && loadingOpacity};
  transition: color 0.125s linear, opacity ${({ isLoading }) => (isLoading ? 0 : 0.25)}s ease-in-out;
`
