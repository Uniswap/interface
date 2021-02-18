import { useWeb3React } from '@web3-react/core'
import { Pair, TokenAmount } from 'dxswap-sdk'
import { DateTime } from 'luxon'
import React, { ReactNode, useCallback, useState } from 'react'
import { Box, Flex, Text } from 'rebass'
import styled from 'styled-components'
import { useLiquidityMiningActionCallbacks } from '../../../../hooks/useLiquidityMiningActionCallbacks'
import { useLiquidityMiningDistributionStakedBalance } from '../../../../hooks/useLiquidityMiningDistributionStakedBalance'
import { useTransactionAdder } from '../../../../state/transactions/hooks'
import { useTokenBalance } from '../../../../state/wallet/hooks'
import { ButtonSecondary } from '../../../Button'
import { DarkCard } from '../../../Card'
import ConfirmStakingModal from '../ConfirmStakingModal'
import ConfirmWithdrawalModal from '../ConfirmWithdrawalModal'

const Divider = styled.div`
  height: 100%;
  width: 1px;
  background: ${props => props.theme.bg5};
`
const TitleText = styled.span`
  font-size: 11px;
  font-weight: 600;
  line-height: 13px;
  letter-spacing: 0em;
  color: ${props => props.theme.text4};
  text-transform: uppercase;
`

interface DataRowProps {
  title: string
  value: ReactNode
}

function DataRow({ title, value }: DataRowProps) {
  return (
    <Flex width="100%" justifyContent="space-between">
      <Box>
        <TitleText>{title}</TitleText>
      </Box>
      <Box>
        <Text fontSize="12px" fontWeight="600" lineHeight="13px" color="text4">
          {value}
        </Text>
      </Box>
    </Flex>
  )
}

interface LiquidityMiningCampaignProps {
  contractAddress: string
  stakablePair?: Pair | null
  startsAt: string
  endsAt: string
  timelock: boolean
}

export function LiquidityMiningCampaign({
  contractAddress,
  stakablePair,
  startsAt,
  endsAt,
  timelock
}: LiquidityMiningCampaignProps) {
  const { account } = useWeb3React()
  const callbacks = useLiquidityMiningActionCallbacks(contractAddress)
  const stakableTokenBalance = useTokenBalance(account ?? undefined, stakablePair?.liquidityToken)
  const withdrawableTokenBalance = useLiquidityMiningDistributionStakedBalance(
    account ?? undefined,
    stakablePair?.liquidityToken,
    contractAddress
  )
  const addTransaction = useTransactionAdder()

  const [attemptingTransaction, setAttemptingTransaction] = useState(false)
  const [transactionHash, setTransactionHash] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [showStakingConfirmationModal, setShowStakingConfirmationModal] = useState(false)
  const [showWithdrawalConfirmationModal, setShowWithdrawalConfirmationModal] = useState(false)

  const handleDismiss = useCallback(() => {
    setShowStakingConfirmationModal(false)
    setShowWithdrawalConfirmationModal(false)
    setErrorMessage('')
    setTransactionHash('')
  }, [])

  const handleStakingRequest = useCallback(() => {
    setShowStakingConfirmationModal(true)
    setShowWithdrawalConfirmationModal(false)
  }, [])

  const handleWithdrawalRequest = useCallback(() => {
    setShowStakingConfirmationModal(false)
    setShowWithdrawalConfirmationModal(true)
  }, [])

  const handleStakeConfirmation = useCallback(
    (amount: TokenAmount) => {
      if (!callbacks) return
      setAttemptingTransaction(true)
      callbacks
        .stake(amount)
        .then(transaction => {
          setErrorMessage('')
          setTransactionHash(transaction.hash || '')
          addTransaction(transaction, {
            summary: `Stake ${amount.toSignificant(4)} ${stakablePair?.token0.symbol}/${
              stakablePair?.token1.symbol
            } LP tokens`
          })
        })
        .catch(error => {
          console.error(error)
          setErrorMessage('Error broadcasting transaction')
        })
        .finally(() => {
          setAttemptingTransaction(false)
        })
    },
    [addTransaction, callbacks, stakablePair]
  )

  const handleWithdrawalConfirmation = useCallback(
    (amount: TokenAmount) => {
      if (!callbacks) return
      setAttemptingTransaction(true)
      callbacks
        .withdraw(amount)
        .then(transaction => {
          setErrorMessage('')
          setTransactionHash(transaction.hash || '')
          addTransaction(transaction, {
            summary: `Withdraw ${amount.toSignificant(4)} ${stakablePair?.token0.symbol}/${
              stakablePair?.token1.symbol
            } LP tokens`
          })
        })
        .catch(error => {
          console.error(error)
          setErrorMessage('Error broadcasting transaction')
        })
        .finally(() => {
          setAttemptingTransaction(false)
        })
    },
    [addTransaction, callbacks, stakablePair]
  )

  return (
    <>
      <DarkCard>
        <Flex justifyContent="stretch" width="100%" mb="24px">
          <Flex flexDirection="column" flex="1">
            <DataRow title="APY" value="TODO" />
            <DataRow title="Time left" value="TODO" />
          </Flex>
          <Box mx="18px">
            <Divider />
          </Box>
          <Flex flexDirection="column" flex="1">
            <DataRow title="Starts at" value={DateTime.fromSeconds(parseInt(startsAt)).toFormat('dd-MM-yyyy hh:mm')} />
            <DataRow title="Ends at" value={DateTime.fromSeconds(parseInt(endsAt)).toFormat('dd-MM-yyyy hh:mm')} />
            <DataRow title="Timelock" value={timelock ? 'ON' : 'OFF'} />
          </Flex>
        </Flex>
        <Flex width="100%">
          <Box>
            <ButtonSecondary
              disabled={!callbacks || !stakableTokenBalance || stakableTokenBalance.equalTo('0')}
              onClick={handleStakingRequest}
            >
              Stake
            </ButtonSecondary>
          </Box>
          <Box>
            <ButtonSecondary
              disabled={!callbacks || !withdrawableTokenBalance || withdrawableTokenBalance.equalTo('0')}
              onClick={handleWithdrawalRequest}
            >
              Withdraw
            </ButtonSecondary>
          </Box>
        </Flex>
      </DarkCard>
      <ConfirmStakingModal
        isOpen={showStakingConfirmationModal}
        stakableTokenBalance={stakableTokenBalance}
        onDismiss={handleDismiss}
        stakablePair={stakablePair}
        distributionContractAddress={contractAddress}
        attemptingTxn={attemptingTransaction}
        errorMessage={errorMessage}
        onConfirm={handleStakeConfirmation}
        txHash={transactionHash}
      />
      <ConfirmWithdrawalModal
        isOpen={showWithdrawalConfirmationModal}
        withdrawablTokenBalance={withdrawableTokenBalance || undefined}
        onDismiss={handleDismiss}
        stakablePair={stakablePair}
        attemptingTxn={attemptingTransaction}
        errorMessage={errorMessage}
        onConfirm={handleWithdrawalConfirmation}
        txHash={transactionHash}
      />
    </>
  )
}
