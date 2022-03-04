import { css } from 'lib/theme'

export const loadingCss = css`
  filter: grayscale(1);
  opacity: 0.4;
`

// need to use isLoading as `loading` is a reserved prop
export const loadingTransitionCss = css<{ isLoading: boolean }>`
  ${({ isLoading }) => isLoading && loadingCss};
  transition: opacity 0.2s ease-in-out;
`
