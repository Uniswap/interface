import themed from 'lib/themed'
import { themedIcon } from 'lib/themed/components'
import { CheckCircle } from 'react-feather'

export const Line = themed.div`
  align-items: center;
  display: flex;
  justify-content: space-between;
`

export const Row = themed(Line)`
  padding: 8px 0 16px 0;
`

export const Spacer = themed.span`
  min-width: 8px;
`

export const Bordered = themed.div`
  border: 1px solid ${({ theme }) => theme.icon};
  border-radius: 0.5em;
  display: flex;
  flex-basis: 100%;
  line-height: 18px;
  padding: 8px;
`

export const Option = themed(Bordered)`
  cursor: pointer;
  flex-direction: column;
  justify-content: flex-start;
`

export const Selected = themed(themedIcon(CheckCircle))`
  > * {
    stroke: ${({ theme }) => theme.selected};
  }
`
