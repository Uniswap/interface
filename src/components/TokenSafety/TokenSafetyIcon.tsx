import { Warning, WARNING_LEVEL } from 'constants/tokenSafety'
import { AlertTriangle, Slash } from 'react-feather'
import styled, { css } from 'styled-components/macro'

const WarningContainer = styled.div`
  margin-left: 4px;
  display: flex;
  justify-content: center;
`

const WarningIconStyle = css<{ size?: string }>`
  width: ${({ size }) => size ?? '1em'};
  height: ${({ size }) => size ?? '1em'};
`

const WarningIcon = styled(AlertTriangle)`
  ${WarningIconStyle};
  color: ${({ theme }) => theme.textTertiary};
`

export const BlockedIcon = styled(Slash)`
  ${WarningIconStyle}
  color: ${({ theme }) => theme.textSecondary};
`

export default function TokenSafetyIcon({ warning }: { warning: Warning | null }) {
  switch (warning?.level) {
    case WARNING_LEVEL.BLOCKED:
      return (
        <WarningContainer>
          <BlockedIcon strokeWidth={2.5} />
        </WarningContainer>
      )
    case WARNING_LEVEL.UNKNOWN:
      return (
        <WarningContainer>
          <WarningIcon />
        </WarningContainer>
      )
    default:
      return null
  }
}
