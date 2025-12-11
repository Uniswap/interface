import { deprecatedStyled } from 'lib/styled-components'
import { Gap } from 'theme'

/** @deprecated Please use `Flex` from `ui/src` going forward */
const Column = deprecatedStyled.div<{
  gap?: Gap | string
  flex?: string
}>`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  gap: ${({ gap, theme }) => (gap && theme.grids[gap as Gap]) || gap};
  ${({ flex }) => flex && `flex: ${flex};`}
`

/** @deprecated Please use `Flex` from `ui/src` going forward */
export const ColumnCenter = deprecatedStyled(Column)`
  width: 100%;
  align-items: center;
`

export const AutoColumn = deprecatedStyled.div<{
  gap?: Gap | string
  justify?: 'stretch' | 'center' | 'start' | 'end' | 'flex-start' | 'flex-end' | 'space-between'
  grow?: true
}>`
  display: grid;
  grid-auto-rows: auto;
  grid-row-gap: ${({ gap, theme }) => (gap && theme.grids[gap as Gap]) || gap};
  justify-items: ${({ justify }) => justify && justify};
  flex-grow: ${({ grow }) => grow && 1};
`

export default Column
