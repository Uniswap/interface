import Badge from 'components/Badge'
import styled from 'styled-components/macro'

const LabelWrapper = styled.div`
  font-size: 14px;
  display: flex;
  justify-content: flex-end;
`

export default function TokenWarningLabel() {
  return (
    <LabelWrapper>
      <Badge></Badge>
    </LabelWrapper>
  )
}
