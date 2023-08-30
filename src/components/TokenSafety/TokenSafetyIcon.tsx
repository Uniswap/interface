import { Warning, WARNING_LEVEL } from 'constants/tokenSafety'
import { AlertTriangle, Slash } from 'react-feather'
import styled, { css } from 'styled-components'

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
  color: ${({ theme }) => theme.neutral3};
`

export const BlockedIcon = styled(Slash)`
  ${WarningIconStyle}
  color: ${({ theme }) => theme.neutral2};
`

export default function TokenSafetyIcon({ warning }: { warning: Warning | null }) {
  switch (warning?.level) {
    case WARNING_LEVEL.BLOCKED:
      return (
        <WarningContainer>
          <BlockedIcon data-cy="blocked-icon" strokeWidth={2.5} />
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
