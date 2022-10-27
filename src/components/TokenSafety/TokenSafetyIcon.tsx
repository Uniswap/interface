import { Warning, WARNING_LEVEL } from 'constants/tokenSafety'
import { AlertTriangle } from 'react-feather'
import styled from 'styled-components/macro'

const VerifiedContainer = styled.div`
  margin-left: 4px;
  display: flex;
  justify-content: center;
`

export const WarningIcon = styled(AlertTriangle)<{ size?: string }>`
  width: ${({ size }) => size ?? '1em'};
  height: ${({ size }) => size ?? '1em'};
  color: ${({ theme }) => theme.textTertiary};
`

export default function TokenSafetyIcon({ warning }: { warning: Warning | null }) {
  if (warning?.level !== WARNING_LEVEL.UNKNOWN) return null
  return (
    <VerifiedContainer>
      <WarningIcon />
    </VerifiedContainer>
  )
}
