import styled, { css } from 'lib/theme'

export const loadingOpacityMixin = css<{ $loading: boolean }>`
  filter: ${({ $loading }) => ($loading ? 'grayscale(1)' : 'none')};
  opacity: ${({ $loading }) => ($loading ? '0.4' : '1')};
  transition: opacity 0.2s ease-in-out;
`

export const LoadingOpacityContainer = styled.div<{ $loading: boolean }>`
  ${loadingOpacityMixin}
`
