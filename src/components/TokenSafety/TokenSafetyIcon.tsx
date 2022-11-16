import { Warning, WARNING_LEVEL } from 'constants/tokenSafety'
import { AlertOctagon, AlertTriangle } from 'react-feather'
import styled, { css } from 'styled-components/macro'

const WarningContainer = styled.div`
  margin-left: 4px;
  display: flex;
  justify-content: center;
`

const WarningIconStyle = css<{ size?: string }>`
  width: ${({ size }) => size ?? '1em'};
  height: ${({ size }) => size ?? '1em'};
  color: ${({ theme }) => theme.textTertiary};
`

const WarningIcon = styled(AlertTriangle)`
  ${WarningIconStyle};
`

const BlockedIcon = styled(AlertOctagon)`
  ${WarningIconStyle}
`

export default function TokenSafetyIcon({ warning }: { warning: Warning | null }) {
  //if (warning?.level !== WARNING_LEVEL.UNKNOWN) return null
  switch (warning?.level) {
    case WARNING_LEVEL.BLOCKED:
      return (
        <WarningContainer>
          <BlockedIcon />
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
