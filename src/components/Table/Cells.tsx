import styled from 'styled-components'

export const Cell = styled.div<{ justifyContent?: string }>`
  justify-content: ${({ justifyContent }) => justifyContent ?? 'right'};
  padding: 14px 6px 14px 6px;
  display: flex;
  flex-direction: row;
  align-items: center;
  height: 64px;
`
