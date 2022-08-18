import { useMemo } from 'react'
import { useWeb3React } from '@web3-react/core'
import { getChainInfoOrDefault } from 'constants/chainInfo'
import { SupportedChainId } from 'constants/chains'
import { AlertTriangle, CheckCircle } from 'react-feather'
import styled from 'styled-components/macro'
import { colors } from 'theme/colors'

import { TransactionDetails } from '../../state/transactions/types'
import Loader from '../Loader'
import { getLogoView } from './LogoView'
import { getTransactionBody } from './TransactionBody'

export enum TransactionState {
  Pending,
  Success,
  Failed,
}

const Grid = styled.a`
  cursor: pointer;
  display: grid;
  grid-template-columns: 44px auto 24px;
  width: 100%;
  text-decoration: none;
  border-bottom: ${({ theme }) => `1px solid ${theme.backgroundOutline}`};
  padding: 12px;
`

const TextContainer = styled.span`
  font-size: 14px;
  margin-top: auto;
  margin-bottom: auto;
  color: ${({ theme }) => theme.textTertiary};
`

const IconStyleWrap = styled.span`
  margin-top: auto;
  margin-bottom: auto;
  margin-left: auto;
  height: 16px;
`

const TransactionContainer = ({
  logoView,
  children,
  link,
  transactionState,
}: {
  logoView: React.ReactNode
  children: React.ReactNode
  link?: string
  transactionState: TransactionState
}) => {
  return (
    <Grid href={link} target="_blank">
      {logoView}
      <TextContainer as="span">{children}</TextContainer>
      {transactionState === TransactionState.Pending ? (
        <IconStyleWrap>
          <Loader />
        </IconStyleWrap>
      ) : transactionState === TransactionState.Success ? (
        <IconStyleWrap>
          <CheckCircle color={colors.green200} size="16px" />
        </IconStyleWrap>
      ) : (
        <IconStyleWrap>
          <AlertTriangle color={colors.gold200} size="16px" />
        </IconStyleWrap>
      )}
    </Grid>
  )
}

export const TransactionSummary = ({ transactionDetails }: { transactionDetails: TransactionDetails }) => {
  const { chainId = 1 } = useWeb3React()
  const tx = transactionDetails
  const { explorer } = getChainInfoOrDefault(chainId ? chainId : SupportedChainId.MAINNET)
  const { info, receipt, hash } = tx

  const transactionState = useMemo(() => {
    const pending = !receipt
    const success = !pending && tx && (receipt?.status === 1 || typeof receipt?.status === 'undefined')
    const transactionState = pending
      ? TransactionState.Pending
      : success
      ? TransactionState.Success
      : TransactionState.Failed

    return transactionState
  }, [receipt])

  const logoView = getLogoView({ info })
  const body = getTransactionBody({ info, transactionState })
  const link = `${explorer}tx/${hash}`

  return chainId ? (
    <TransactionContainer transactionState={transactionState} link={link} logoView={logoView}>
      {body}
    </TransactionContainer>
  ) : null
}
