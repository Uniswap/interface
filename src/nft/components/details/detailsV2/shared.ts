import styled, { css } from 'styled-components/macro'

export const containerStyles = css`
  background: ${({ theme }) => theme.backgroundSurface};
  border-radius: 16px;
  padding: 16px 20px;
  width: 100%;
  align-self: flex-start;
`

export const TableContentContainer = styled.div`
  height: 568px;
`
