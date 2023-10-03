import styled from 'styled-components'

export const Cell = styled.div<{ justifyContent?: string }>`
  width: 100%;
  display: flex;
  justify-content: ${({ justifyContent }) => justifyContent ?? 'flex-end'};
  align-items: center;
  position: relative;
`
