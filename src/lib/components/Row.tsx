import styled, { Color, Theme } from 'lib/theme'
import { Children, ReactNode } from 'react'

const Row = styled.div<{
  color?: Color
  align?: string
  justify?: string
  pad?: number
  gap?: number
  flex?: true
  grow?: true
  children?: ReactNode
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
  padding: ${({ pad }) => pad && `0 ${pad}em`};
`

export default Row
