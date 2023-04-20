import { css } from 'styled-components/macro'

export const containerStyles = css`
  background: ${({ theme }) => theme.backgroundSurface};
  border-radius: 16px;
  padding: 16px 0px;
`

export const containerXPadding = css`
  padding-left: 20px;
  padding-right: 20px;
`
