import { WARNING_LEVEL } from 'constants/tokenSafety'
import { useTokenWarningColor, useTokenWarningTextColor } from 'hooks/useTokenWarningColor'
import { ReactNode } from 'react'
import { AlertTriangle, Slash } from 'react-feather'
import { Text } from 'rebass'
import styled from 'styled-components'

const Label = styled.div<{ color: string; backgroundColor: string }>`
  padding: 4px 4px;
  font-size: 12px;
  background-color: ${({ backgroundColor }) => backgroundColor};
  border-radius: 8px;
  color: ${({ color }) => color};
  display: inline-flex;
  align-items: center;
`

const Title = styled(Text)`
  margin-right: 5px;
  font-weight: 535;
  font-size: 12px;
`

type TokenWarningLabelProps = {
  level: WARNING_LEVEL
  canProceed: boolean
  children: ReactNode
}
export default function TokenSafetyLabel({ level, canProceed, children }: TokenWarningLabelProps) {
  return (
    <Label color={useTokenWarningTextColor(level)} backgroundColor={useTokenWarningColor(level)}>
      <Title marginRight="5px">{children}</Title>
      {canProceed ? <AlertTriangle strokeWidth={2.5} size="14px" /> : <Slash strokeWidth={2.5} size="14px" />}
    </Label>
  )
}
