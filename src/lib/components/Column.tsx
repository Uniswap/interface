import styled from 'lib/theme'

const Column = styled.div<{
  align?: string
  justify?: string
  gap?: number
  padded?: true
  scrollable?: true
  flex?: true
}>`
  align-items: ${({ align }) => align ?? 'center'};
  display: ${({ flex }) => (flex ? 'flex' : 'grid')};
  flex-direction: column;
  gap: ${({ gap }) => gap && `${gap}em`};
  grid-auto-flow: row;
  grid-template-columns: 1fr;
  justify-content: ${({ justify }) => justify ?? 'space-between'};
  overflow-y: ${({ scrollable }) => scrollable && 'scroll'};
  padding: ${({ padded }) => padded && '1em'};
`

export default Column
