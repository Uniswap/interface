import { css } from 'lib/theme'

// need to use $loading as `loading` is a reserved prop
export const loadingOpacityCss = css<{ $loading: boolean }>`
  filter: ${({ $loading }) => ($loading ? 'grayscale(1)' : 'none')};
  opacity: ${({ $loading }) => ($loading ? '0.4' : '1')};
  transition: opacity 0.2s ease-in-out;
`
