// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { css } from 'styled-components'

export const breakpointPaddingsCss = css`
  @media screen and (min-width: ${({ theme }) => theme.breakpoint.md}px) {
    padding-left: 20px;
    padding-right: 20px;
  }

  @media screen and (min-width: ${({ theme }) => theme.breakpoint.lg}px) {
    padding-left: 26px;
    padding-right: 26px;
  }

  @media screen and (min-width: ${({ theme }) => theme.breakpoint.xxl}px) {
    padding-left: 48px;
    padding-right: 48px;
  }
`
