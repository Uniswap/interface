import styled from 'lib/theme'

const Row = styled.div<{
  align?: string
  justify?: string
  gap?: string
}>`
  display: grid;
  grid-auto-flow: column;
  align-items: ${({ align }) => align ?? 'center'};
  justify-content: ${({ justify }) => justify ?? 'space-between'};
  gap: ${({ gap }) => gap && gap};
`

export default Row
