import styled from 'lib/styled'
import { styledIcon } from 'lib/styled/components'
import { CheckCircle } from 'react-feather'

export const Line = styled.div`
  align-items: center;
  display: flex;
  justify-content: space-between;
`

export const Row = styled(Line)`
  padding: 8px 0 16px 0;
`

export const Spacer = styled.span`
  min-width: 8px;
`

export const Bordered = styled.div`
  border: 1px solid ${({ theme }) => theme.icon};
  border-radius: 0.5em;
  display: flex;
  flex-basis: 100%;
  line-height: 18px;
  padding: 8px;
`

export const Option = styled(Bordered)`
  cursor: pointer;
  flex-direction: column;
  justify-content: flex-start;
`

export const Selected = styled(styledIcon(CheckCircle))`
  > * {
    stroke: ${({ theme }) => theme.selected};
  }
`
