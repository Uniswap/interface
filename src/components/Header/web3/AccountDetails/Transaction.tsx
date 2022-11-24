import { Trans } from '@lingui/macro'
import { CheckCircle, Triangle } from 'react-feather'
import styled from 'styled-components'

import Loader from 'components/Loader'
import { SUMMARY } from 'components/Popups/TransactionPopup'
import { RowFixed } from 'components/Row'
import { useActiveWeb3React } from 'hooks'
import { TRANSACTION_TYPE, TransactionDetails } from 'state/transactions/type'
import { ExternalLink } from 'theme'
import { getEtherscanLink } from 'utils'

const TransactionWrapper = styled.div``

const TransactionStatusText = styled.div`
  margin-right: 0.5rem;
  display: flex;
  align-items: center;
  :hover {
    text-decoration: underline;
  }
`

export const TransactionState = styled(ExternalLink)<{ success?: boolean; isInGroup?: boolean }>`
  ${({ isInGroup }) => (isInGroup ? 'margin-left: 1rem;' : '')}
  display: flex;
  justify-content: space-between;
  align-items: center;
  text-decoration: none !important;
  border-radius: 0.5rem;
  padding: 0.25rem 0rem;
  font-weight: 500;
  font-size: 0.825rem;
  color: ${({ theme }) => theme.primary};
`

const IconWrapper = styled.div<{ pending: boolean; success?: boolean }>`
  color: ${({ pending, success, theme }) => (pending ? theme.primary : success ? theme.green1 : theme.red1)};
`

export default function Transaction({ transaction, step }: { transaction: TransactionDetails; step?: number }) {
  const { chainId } = useActiveWeb3React()

  const pending = !transaction?.receipt
  const success =
    !pending && transaction && (transaction.receipt?.status === 1 || typeof transaction.receipt?.status === 'undefined')
  const type = transaction?.type
  const summary = transaction?.summary
  const parsedSummary = type
    ? SUMMARY[type]?.[pending ? 'pending' : success ? 'success' : 'failure'](
        summary,
        !!(step && type === TRANSACTION_TYPE.SETUP),
      )
    : summary ?? 'Hash: ' + transaction.hash.slice(0, 8) + '...' + transaction.hash.slice(58, 65)

  return (
    <TransactionWrapper>
      <TransactionState
        href={getEtherscanLink(chainId, transaction.hash, 'transaction')}
        success={success}
        isInGroup={!!step}
      >
        <RowFixed>
          <TransactionStatusText>
            {step ? <Trans>Step {step}: </Trans> : ''} {parsedSummary} ↗
          </TransactionStatusText>
        </RowFixed>
        <IconWrapper pending={pending} success={success}>
          {pending ? <Loader /> : success ? <CheckCircle size="16" /> : <Triangle size="16" />}
        </IconWrapper>
      </TransactionState>
    </TransactionWrapper>
  )
}
