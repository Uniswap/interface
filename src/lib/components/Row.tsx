import styled from 'lib/theme'
import { Children, ReactNode } from 'react'

const Row = styled.div<{
  align?: string
  justify?: string
  gap?: string
  grow?: boolean
  children?: ReactNode
}>`
  align-items: ${({ align }) => align ?? 'center'};
  display: grid;
  gap: ${({ gap }) => gap && gap};
  grid-auto-flow: column;
  grid-template-columns: ${({ grow, children }) => (grow ? `repeat(${Children.count(children)}, 1fr)` : '')};
  justify-content: ${({ justify }) => justify ?? 'space-between'};
`

export default Row
