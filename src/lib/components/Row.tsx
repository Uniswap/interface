import styled, { Color, Theme } from 'lib/theme'
import { Children, ReactNode } from 'react'

const Row = styled.div<{
  align?: string
  color?: Color
  justify?: string
  gap?: number
  grow?: true
  children?: ReactNode
  padded?: true
  flex?: true
  theme: Theme
}>`
  align-items: ${({ align }) => align ?? 'center'};
  color: ${({ color, theme }) => color && theme[color]};
  display: ${({ flex }) => (flex ? 'flex' : 'grid')};
  flex-flow: wrap;
  flex-grow: ${({ grow }) => grow && 1};
  gap: ${({ gap }) => gap && `${gap}em`};
  grid-auto-flow: column;
  grid-template-columns: ${({ grow, children }) => (grow ? `repeat(${Children.count(children)}, 1fr)` : '')};
  justify-content: ${({ justify }) => justify ?? 'space-between'};
  padding: ${({ padded }) => padded && '0 1em'};
`

export default Row
