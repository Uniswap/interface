import styled from 'styled-components/macro'

type Gap = 'sm' | 'md' | 'lg' | 'xl' | string

const getGapValue = (gap: Gap) =>
  (gap === 'sm' && '8px') || (gap === 'md' && '12px') || (gap === 'lg' && '24px') || (gap === 'xl' && '32px') || gap

export const Column = styled.div<{
  gap?: Gap
}>`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  gap: ${({ gap }) => gap && getGapValue(gap)};
`
export const ColumnCenter = styled(Column)`
  width: 100%;
  align-items: center;
`

export const AutoColumn = styled.div<{
  gap?: Gap
  justify?: 'stretch' | 'center' | 'start' | 'end' | 'flex-start' | 'flex-end' | 'space-between'
}>`
  display: grid;
  grid-auto-rows: auto;
  grid-row-gap: ${({ gap }) => gap && getGapValue(gap)};
  justify-items: ${({ justify }) => justify && justify};
`

export default Column
