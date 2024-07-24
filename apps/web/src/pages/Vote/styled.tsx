import { Trans } from 'i18n'
import styled, { DefaultTheme } from 'lib/styled-components'
import { ProposalState } from 'state/governance/hooks'

const handleColorType = (status: ProposalState, theme: DefaultTheme) => {
  switch (status) {
    case ProposalState.PENDING:
    case ProposalState.ACTIVE:
      return theme.accent1
    case ProposalState.SUCCEEDED:
    case ProposalState.EXECUTED:
      return theme.success
    case ProposalState.DEFEATED:
      return theme.critical
    case ProposalState.QUEUED:
    case ProposalState.CANCELED:
    case ProposalState.EXPIRED:
    default:
      return theme.neutral3
  }
}

function StatusText({ status }: { status: ProposalState }) {
  switch (status) {
    case ProposalState.PENDING:
      return <Trans i18nKey="common.pending" />
    case ProposalState.ACTIVE:
      return <Trans i18nKey="vote.styled.active" />
    case ProposalState.SUCCEEDED:
      return <Trans i18nKey="vote.styled.succeeded" />
    case ProposalState.EXECUTED:
      return <Trans i18nKey="common.executed" />
    case ProposalState.DEFEATED:
      return <Trans i18nKey="vote.styled.defeated" />
    case ProposalState.QUEUED:
      return <Trans i18nKey="common.queued" />
    case ProposalState.CANCELED:
      return <Trans i18nKey="common.cancelled" />
    case ProposalState.EXPIRED:
      return <Trans i18nKey="common.expired" />
    default:
      return <Trans i18nKey="vote.styled.undetermined" />
  }
}

const StyledProposalContainer = styled.span<{ status: ProposalState }>`
  font-size: 0.825rem;
  font-weight: 535;
  padding: 0.5rem;
  border-radius: 8px;
  color: ${({ status, theme }) => handleColorType(status, theme)};
  border: 1px solid ${({ status, theme }) => handleColorType(status, theme)};
  width: fit-content;
  justify-self: flex-end;
  text-transform: uppercase;
  flex: 0 0 100px;
  text-align: center;
`

export function ProposalStatus({ status }: { status: ProposalState }) {
  return (
    <StyledProposalContainer status={status}>
      <StatusText status={status} />
    </StyledProposalContainer>
  )
}
