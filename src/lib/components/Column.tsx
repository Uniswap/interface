import styled from 'lib/theme'

const Column = styled.div<{
  align?: string
  justify?: string
  gap?: string
}>`
  align-items: ${({ align }) => align ?? 'center'};
  display: grid;
  gap: ${({ gap }) => gap && gap};
  grid-auto-flow: row;
  grid-template-columns: 1fr;
  justify-content: ${({ justify }) => justify ?? 'space-between'};
`

export default Column
