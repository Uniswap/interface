import { Warning, WARNING_LEVEL } from 'constants/tokenSafety'
import { AlertTriangle, Slash } from 'react-feather'
import styled, { css } from 'styled-components/macro'
import { ThemedText } from 'theme'

const WarningContainer = styled.div`
  margin-left: 4px;
  display: flex;
  justify-content: center;
`

const WarningIconStyle = css<{ size?: string }>`
  width: ${({ size }) => size ?? '1em'};
  height: ${({ size }) => size ?? '1em'};
`

export const WarningIcon = styled(AlertTriangle)`
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

export function AllowanceWarning({currencySymbol}:{currencySymbol: string}) {
  return (
    <WarningContainer>
      <WarningIcon size="1.25em" />
      <ThemedText.DeprecatedError error={true}>
        Approve {currencySymbol}
      </ThemedText.DeprecatedError>
    </WarningContainer>
  )
}
