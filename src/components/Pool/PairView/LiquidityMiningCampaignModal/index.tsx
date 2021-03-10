import BigNumber from 'bignumber.js'
import { Pair, TokenAmount } from 'dxswap-sdk'
import { transparentize } from 'polished'
import React, { useCallback, useEffect, useState } from 'react'
import styled from 'styled-components'
import { useActiveWeb3React } from '../../../../hooks'
import { useLiquidityMiningActionCallbacks } from '../../../../hooks/useLiquidityMiningActionCallbacks'
import { useLiquidityMiningDistributionStakedBalance } from '../../../../hooks/useLiquidityMiningDistributionStakedBalance'
import { useTransactionAdder } from '../../../../state/transactions/hooks'
import { useTokenBalance } from '../../../../state/wallet/hooks'
import { TYPE } from '../../../../theme'
import { ButtonDark } from '../../../Button'
import { AutoColumn } from '../../../Column'
import Modal from '../../../Modal'
import { RowBetween } from '../../../Row'
import ConfirmStakingModal from '../ConfirmStakingModal'
import ConfirmWithdrawalModal from '../ConfirmWithdrawalModal'
import LiquidityMiningInformation from './Information'
import LiquidityMiningYourStake from './YourStake'

const Wrapper = styled.div`
  width: 100%;
  padding: 28px 42px;
  background: ${({ theme }) => transparentize(0.45, theme.bg2)};
`

interface LiquidityMiningCampaignProps {
  show: boolean
  onDismiss: () => void
  contractAddress?: string
  stakablePair?: Pair | null
  startsAt?: string
  endsAt?: string
  timelock?: boolean
  apy?: BigNumber
}

export function LiquidityMiningCampaignModal({
  show,
  onDismiss,
  contractAddress,
  stakablePair,
  startsAt,
  endsAt,
  timelock,
  apy
}: LiquidityMiningCampaignProps) {
  const { account } = useActiveWeb3React()
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
  const [disabledStaking, setDisabledStaking] = useState(false)
  const [disabledWithdrawing, setDisabledWithdrawing] = useState(false)
  const [active, setActive] = useState(false)

  useEffect(() => {
    setActive(!!startsAt && parseInt(startsAt) < Math.floor(Date.now() / 1000))
  }, [callbacks, stakableTokenBalance, startsAt])

  useEffect(() => {
    setDisabledStaking(!active || !callbacks || !stakableTokenBalance || stakableTokenBalance.equalTo('0'))
  }, [active, callbacks, stakableTokenBalance])

  useEffect(() => {
    setDisabledWithdrawing(!active || !callbacks || !withdrawableTokenBalance || withdrawableTokenBalance.equalTo('0'))
  }, [active, callbacks, stakableTokenBalance, withdrawableTokenBalance])

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
  const handleClaimConfirmation = useCallback(() => {
    if (!callbacks || !account) return
    setAttemptingTransaction(true)
    callbacks
      .claimAll(account)
      .then(transaction => {
        setErrorMessage('')
        setTransactionHash(transaction.hash || '')
        addTransaction(transaction, { summary: `Claim outstanding rewards` })
      })
      .catch(error => {
        console.error(error)
        setErrorMessage('Error broadcasting transaction')
      })
      .finally(() => {
        setAttemptingTransaction(false)
      })
  }, [account, addTransaction, callbacks])

  return (
    <Modal maxWidth={670} isOpen={show} onDismiss={onDismiss}>
      <Wrapper>
        <AutoColumn gap="24px">
          <TYPE.mediumHeader color="text4" lineHeight="24px" letterSpacing="-0.01em">
            Rewards program
          </TYPE.mediumHeader>
          <div>
            <LiquidityMiningInformation
              startsAt={startsAt}
              endsAt={endsAt}
              timelock={!!timelock}
              apy={apy || new BigNumber(0)}
            />
            <RowBetween marginTop="24px">
              <ButtonDark
                padding="8px"
                style={{ fontSize: '12px', fontWeight: 'bold', lineHeight: '15px' }}
                width="100%"
                marginRight="4px"
                disabled={disabledStaking}
                onClick={handleStakingRequest}
              >
                Deposit {stakablePair?.liquidityToken.symbol}
              </ButtonDark>
              <ButtonDark
                padding="8px"
                style={{ fontSize: '12px', fontWeight: 'bold', lineHeight: '15px' }}
                width="100%"
                marginLeft="4px"
                disabled={disabledWithdrawing}
                onClick={handleWithdrawalRequest}
              >
                Withdraw {stakablePair?.liquidityToken.symbol}
              </ButtonDark>
            </RowBetween>
          </div>
          <div>
            <LiquidityMiningYourStake stake={withdrawableTokenBalance || undefined} />
            <RowBetween marginTop="24px">
              {/* TODO: handle disabled state */}
              <ButtonDark
                padding="8px"
                style={{ fontSize: '12px', fontWeight: 'bold', lineHeight: '15px' }}
                width="100%"
                marginRight="4px"
                onClick={handleClaimConfirmation}
                disabled={!callbacks || !active}
              >
                Claim rewards
              </ButtonDark>
            </RowBetween>
          </div>
        </AutoColumn>
      </Wrapper>
      {contractAddress && (
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
      )}
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
    </Modal>
  )
}
