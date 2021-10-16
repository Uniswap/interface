import styled from 'lib/theme'

const Column = styled.div<{
  align?: string
  justify?: string
  gap?: string
}>`
  display: grid;
  grid-auto-flow: row;
  grid-template-columns: 1fr;
  align-items: ${({ align }) => align ?? 'center'};
  justify-content: ${({ justify }) => justify ?? 'space-between'};
  gap: ${({ gap }) => gap && gap};
`

export default Column
