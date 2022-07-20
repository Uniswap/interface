import { WARNING_TO_ATTRIBUTES, WarningTypes } from 'constants/tokenWarnings'
import styled from 'styled-components/macro'
import { Color } from 'theme/styled'

const LabelWrapper = styled.div`
  font-size: 14px;
  display: flex;
  justify-content: flex-end;
`

const Label = styled.div<{ color: Color }>`
  align-items: center;
  background-color: ${({ color }) => color + '1F'};
  border-radius: 8px;
  color: ${({ color }) => color};
  display: inline-flex;
  padding: 3px 4px;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
`

export default function TokenWarningLabel({ warningType }: { warningType: WarningTypes }) {
  const { text, icon, color } = WARNING_TO_ATTRIBUTES[warningType]
  return (
    <LabelWrapper>
      <Label color={color}>
        {text}
        {icon}
      </Label>
    </LabelWrapper>
  )
}
