import styled, { Color, css, Theme } from 'lib/theme'

const Column = styled.div<{
  align?: string
  color?: Color
  justify?: string
  gap?: number
  padded?: true
  flex?: true
  grow?: true
  theme: Theme
  css?: ReturnType<typeof css>
}>`
  align-items: ${({ align }) => align ?? 'center'};
  background-color: inherit;
  color: ${({ color, theme }) => color && theme[color]};
  display: ${({ flex }) => (flex ? 'flex' : 'grid')};
  flex-direction: column;
  flex-grow: ${({ grow }) => grow && 1};
  gap: ${({ gap }) => gap && `${gap}em`};
  grid-auto-flow: row;
  grid-template-columns: 1fr;
  justify-content: ${({ justify }) => justify ?? 'space-between'};
  padding: ${({ padded }) => padded && '0.75em'};

  ${({ css }) => css}
`

export default Column
