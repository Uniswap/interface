import { css, deprecatedStyled, keyframes } from 'lib/styled-components'

const loadingAnimation = keyframes`
  0% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
`

const shimmerMixin = css`
  animation: ${loadingAnimation} 1.5s infinite;
  animation-fill-mode: both;
  background: linear-gradient(
    to left,
    ${({ theme }) => theme.surface1} 25%,
    ${({ theme }) => theme.surface3} 50%,
    ${({ theme }) => theme.surface1} 75%
  );
  background-size: 400%;
  will-change: background-position;
`

export const LoadingRows = deprecatedStyled.div`
  display: grid;

  & > div {
    ${shimmerMixin}
    border-radius: 12px;
    height: 2.4em;
  }
`

export const LoadingRow = deprecatedStyled.div<{ height: number; width: number }>`
  ${shimmerMixin}
  border-radius: 12px;
  height: ${({ height }) => height}px;
  width: ${({ width }) => width}px;
`

export const loadingOpacityMixin = css<{ $loading: boolean }>`
  filter: ${({ $loading }) => ($loading ? 'grayscale(1)' : 'none')};
  opacity: ${({ $loading }) => ($loading ? '0.6' : '1')};
  transition: ${({ $loading, theme }) =>
    $loading ? 'none' : `opacity ${theme.transition.duration.medium} ${theme.transition.timing.inOut}`};
`

export const LoadingOpacityContainer = deprecatedStyled.div<{ $loading: boolean }>`
  ${loadingOpacityMixin}
`

export const LoadingFullscreen = deprecatedStyled.div`
  ${shimmerMixin}
  inset: 0;
  position: absolute;
`
