import { Warning, WARNING_LEVEL } from 'constants/tokenWarnings'
import { useTokenWarningColor } from 'hooks/useTokenWarningColor'
import { AlertOctagon, AlertTriangle } from 'react-feather'
import styled from 'styled-components/macro'
import { Color } from 'theme/styled'

import { ReactComponent as Verified } from './verified.svg'

const Container = styled.div<{ color: Color }>`
  width: 0.9rem;
  height: 0.9rem;
  margin-left: 4px;
  /* font-size: 12px;
  background-color: ${({ color }) => color + '1F'};
  border-radius: 8px; */
  color: ${({ color }) => color};
  display: inline-flex;
  align-items: center;
`

const VerifiedContainer = styled.div`
  margin-left: 4px;
  display: flex;
  justify-content: center;
`

export const VerifiedIcon = styled(Verified)<{ size?: string }>`
  width: ${({ size }) => size ?? '1em'};
  height: ${({ size }) => size ?? '1em'};
`

export default function TokenSafetyIcon({ warning }: { warning: Warning | null }) {
  const color = useTokenWarningColor(warning ? warning.level : WARNING_LEVEL.UNKNOWN)
  if (!warning) {
    return (
      <VerifiedContainer>
        <VerifiedIcon />
      </VerifiedContainer>
    )
  }
  return <Container color={color}>{warning.canProceed ? <AlertTriangle /> : <AlertOctagon />}</Container>
}
