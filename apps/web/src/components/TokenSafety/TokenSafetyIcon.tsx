import { Warning } from 'constants/tokenSafety'
import { AlertTriangle, Slash } from 'react-feather'
import styled, { css } from 'styled-components'
import { SafetyLevel } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'

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

export default function TokenSafetyIcon({ warning }: { warning?: Warning }) {
  switch (warning?.level) {
    case SafetyLevel.Blocked:
      return (
        <WarningContainer>
          <BlockedIcon data-cy="blocked-icon" strokeWidth={2.5} />
        </WarningContainer>
      )
    case SafetyLevel.StrongWarning:
      return (
        <WarningContainer>
          <WarningIcon />
        </WarningContainer>
      )
    default:
      return null
  }
}
