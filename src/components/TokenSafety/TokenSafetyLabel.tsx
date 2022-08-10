import { WARNING_LEVEL } from 'constants/tokenSafety'
import { useTokenWarningColor } from 'hooks/useTokenWarningColor'
import { ReactNode } from 'react'
import { AlertOctagon, AlertTriangle } from 'react-feather'
import { Text } from 'rebass'
import styled from 'styled-components/macro'
import { Color } from 'theme/styled'

const Label = styled.div<{ color: Color }>`
  padding: 4px 4px;
  font-size: 12px;
  background-color: ${({ color }) => color + '1F'};
  border-radius: 8px;
  color: ${({ color }) => color};
  display: inline-flex;
  align-items: center;
`

const Title = styled(Text)`
  margin-right: 5px;
  font-weight: 700;
  font-size: 12px;
`

type TokenWarningLabelProps = {
  level: WARNING_LEVEL
  canProceed: boolean
  children: ReactNode
}
export default function TokenSafetyLabel({ level, canProceed, children }: TokenWarningLabelProps) {
  return (
    <Label color={useTokenWarningColor(level)}>
      <Title marginRight="5px">{children}</Title>
      {canProceed ? <AlertTriangle strokeWidth={2.5} size="14px" /> : <AlertOctagon strokeWidth={2.5} size="14px" />}
    </Label>
  )
}
