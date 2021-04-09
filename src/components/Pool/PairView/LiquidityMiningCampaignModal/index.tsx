import { JSBI, LiquidityMiningCampaign, parseBigintIsh, TokenAmount } from 'dxswap-sdk'
import { Link } from 'react-router-dom'
import { transparentize } from 'polished'
import React, { useCallback, useEffect, useState } from 'react'
import styled from 'styled-components'
import { useActiveWeb3React } from '../../../../hooks'
import { useLiquidityMiningActionCallbacks } from '../../../../hooks/useLiquidityMiningActionCallbacks'
import { useLiquidityMiningCampaignPosition } from '../../../../hooks/useLiquidityMiningCampaignPosition'
import { useTransactionAdder } from '../../../../state/transactions/hooks'
import { TYPE } from '../../../../theme'
import { ButtonDark } from '../../../Button'
import { AutoColumn } from '../../../Column'
import Modal from '../../../Modal'
import { RowBetween } from '../../../Row'
import ConfirmStakingModal from '../ConfirmStakingModal'
import ConfirmWithdrawalModal from '../ConfirmWithdrawalModal'
import ConfirmClaimModal from '../ConfirmClaimModal'
import ConfirmExitModal from '../ConfirmExitModal'
import LiquidityMiningInformation from './Information'
import LiquidityMiningYourStake from './YourStake'

const Wrapper = styled.div`
  width: 100%;
  padding: 20px 32px;
  background: ${({ theme }) => transparentize(0.45, theme.bg2)};
`

interface LiquidityMiningCampaignProps {
  show: boolean
  onDismiss: () => void
  campaign: LiquidityMiningCampaign
  stakableTokenBalance?: TokenAmount
}

export function LiquidityMiningCampaignModal({
  show,
  onDismiss,
  campaign,
  stakableTokenBalance
}: LiquidityMiningCampaignProps) {
  const { account } = useActiveWeb3React()
  const callbacks = useLiquidityMiningActionCallbacks(campaign.address)
  const { stakedTokenAmount, claimableRewardAmounts } = useLiquidityMiningCampaignPosition(
    campaign,
    account ?? undefined
  )
  const addTransaction = useTransactionAdder()

  const [attemptingTransaction, setAttemptingTransaction] = useState(false)
  const [transactionHash, setTransactionHash] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [showStakingConfirmationModal, setShowStakingConfirmationModal] = useState(false)
  const [showWithdrawalConfirmationModal, setShowWithdrawalConfirmationModal] = useState(false)
  const [showClaimConfirmationModal, setShowClaimConfirmationModal] = useState(false)
  const [showExitConfirmationModal, setShowExitConfirmationModal] = useState(false)
  const [disabledStaking, setDisabledStaking] = useState(false)
  const [disabledWithdrawing, setDisabledWithdrawing] = useState(false)
  const [disabledClaim, setDisabledClaim] = useState(false)
  const [normalizedStakableTokenBalance, setNormalizedStakableTokenBalance] = useState<TokenAmount>(
    new TokenAmount(campaign.targetedPair.liquidityToken, '0')
  )

  useEffect(() => {
    if (!stakableTokenBalance) {
      setNormalizedStakableTokenBalance(new TokenAmount(campaign.targetedPair.liquidityToken, '0'))
    } else if (campaign.stakingCap.equalTo('0')) {
      setNormalizedStakableTokenBalance(stakableTokenBalance)
    } else if (campaign.stakingCap.subtract(campaign.staked).lessThan(stakableTokenBalance)) {
      setNormalizedStakableTokenBalance(campaign.stakingCap.subtract(campaign.staked))
    } else {
      setNormalizedStakableTokenBalance(stakableTokenBalance)
    }
  }, [campaign, stakableTokenBalance])

  useEffect(() => {
    setDisabledStaking(
      !campaign.currentlyActive || !callbacks || !stakableTokenBalance || stakableTokenBalance.equalTo('0')
    )
  }, [callbacks, campaign.currentlyActive, stakableTokenBalance])

  useEffect(() => {
    setDisabledWithdrawing(
      !JSBI.greaterThanOrEqual(parseBigintIsh(campaign.startsAt), JSBI.BigInt(Math.floor(Date.now() / 1000))) ||
        !callbacks ||
        !stakedTokenAmount ||
        stakedTokenAmount.equalTo('0')
    )
  }, [callbacks, campaign.currentlyActive, campaign.startsAt, stakableTokenBalance, stakedTokenAmount])

  useEffect(() => {
    setDisabledClaim(
      !callbacks || !campaign.currentlyActive || !claimableRewardAmounts.find(amount => amount.greaterThan('0'))
    )
  }, [callbacks, campaign.currentlyActive, claimableRewardAmounts, stakableTokenBalance, stakedTokenAmount])

  const handleDismiss = useCallback(() => {
    setShowStakingConfirmationModal(false)
    setShowWithdrawalConfirmationModal(false)
    setShowClaimConfirmationModal(false)
    setShowExitConfirmationModal(false)
    setErrorMessage('')
    setTransactionHash('')
  }, [])

  const handleStakingRequest = useCallback(() => {
    setShowStakingConfirmationModal(true)
    setShowWithdrawalConfirmationModal(false)
    setShowClaimConfirmationModal(false)
    setShowExitConfirmationModal(false)
  }, [])

  const handleWithdrawalRequest = useCallback(() => {
    setShowWithdrawalConfirmationModal(true)
    setShowClaimConfirmationModal(false)
    setShowStakingConfirmationModal(false)
    setShowExitConfirmationModal(false)
  }, [])

  const handleClaimRequest = useCallback(() => {
    setShowClaimConfirmationModal(true)
    setShowStakingConfirmationModal(false)
    setShowWithdrawalConfirmationModal(false)
    setShowExitConfirmationModal(false)
  }, [])

  const handleExitRequest = useCallback(() => {
    setShowExitConfirmationModal(true)
    setShowClaimConfirmationModal(false)
    setShowStakingConfirmationModal(false)
    setShowWithdrawalConfirmationModal(false)
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
            summary: `Stake ${amount.toSignificant(4)} ${campaign.staked.token.name}`
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
    [addTransaction, callbacks, campaign]
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
            summary: `Withdraw ${amount.toSignificant(4)} ${campaign.staked.token.name}`
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
    [addTransaction, callbacks, campaign]
  )
  const handleClaimConfirmation = useCallback(
    (amounts: TokenAmount[]) => {
      if (!callbacks || !account) return
      setAttemptingTransaction(true)
      callbacks
        .claim(amounts, account)
        .then(transaction => {
          setErrorMessage('')
          setTransactionHash(transaction.hash || '')
          addTransaction(transaction, {
            summary: `Claim ${amounts.map(amount => `${amount.toSignificant(4)} ${amount.token.symbol}`).join(', ')}`
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
    [account, addTransaction, callbacks]
  )

  const handleExitConfirmation = useCallback(() => {
    if (!callbacks || !account) return
    setAttemptingTransaction(true)
    callbacks
      .exit(account)
      .then(transaction => {
        setErrorMessage('')
        setTransactionHash(transaction.hash || '')
        addTransaction(transaction, {
          summary: 'Claim rewards and withdraw stake'
        })
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
          <LiquidityMiningInformation campaign={campaign} />
          {!!account && (
            <>
              <div>
                <RowBetween>
                  <ButtonDark
                    padding="8px"
                    style={{ fontSize: '12px', fontWeight: 'bold', lineHeight: '15px' }}
                    width="100%"
                    marginRight="4px"
                    disabled={disabledStaking}
                    onClick={handleStakingRequest}
                  >
                    Deposit {campaign.targetedPair.token0.symbol}/{campaign.targetedPair.token1.symbol} LP
                  </ButtonDark>
                  <ButtonDark
                    padding="8px"
                    style={{ fontSize: '12px', fontWeight: 'bold', lineHeight: '15px' }}
                    width="100%"
                    marginLeft="4px"
                    disabled={disabledWithdrawing}
                    onClick={handleWithdrawalRequest}
                  >
                    Withdraw {campaign.targetedPair.token0.symbol}/{campaign.targetedPair.token1.symbol} LP
                  </ButtonDark>
                </RowBetween>
                <RowBetween mt="8px">
                  <ButtonDark
                    as={Link}
                    padding="8px"
                    style={{ fontSize: '12px', fontWeight: 'bold', lineHeight: '15px' }}
                    width="100%"
                    to={`/add/${campaign.targetedPair.token0.address}/${campaign.targetedPair.token1.address}`}
                  >
                    Get {campaign.targetedPair.token0.symbol}/{campaign.targetedPair.token1.symbol} LP tokens
                  </ButtonDark>
                </RowBetween>
              </div>
              <div>
                <LiquidityMiningYourStake
                  stake={stakedTokenAmount || undefined}
                  claimables={claimableRewardAmounts}
                  targetedPair={campaign.targetedPair}
                />
                <RowBetween marginTop="16px">
                  <ButtonDark
                    padding="8px"
                    style={{ fontSize: '12px', fontWeight: 'bold', lineHeight: '15px' }}
                    width="100%"
                    marginRight="4px"
                    onClick={handleClaimRequest}
                    disabled={disabledClaim}
                  >
                    Claim rewards
                  </ButtonDark>
                  <ButtonDark
                    padding="8px"
                    style={{ fontSize: '12px', fontWeight: 'bold', lineHeight: '15px' }}
                    width="100%"
                    marginRight="4px"
                    onClick={handleExitRequest}
                    disabled={disabledClaim}
                  >
                    Claim & withdraw
                  </ButtonDark>
                </RowBetween>
              </div>
            </>
          )}
        </AutoColumn>
      </Wrapper>
      {campaign.address && (
        <ConfirmStakingModal
          isOpen={showStakingConfirmationModal}
          stakableTokenBalance={normalizedStakableTokenBalance}
          onDismiss={handleDismiss}
          stakablePair={campaign.targetedPair}
          distributionContractAddress={campaign.address}
          attemptingTxn={attemptingTransaction}
          errorMessage={errorMessage}
          onConfirm={handleStakeConfirmation}
          txHash={transactionHash}
        />
      )}
      <ConfirmWithdrawalModal
        isOpen={showWithdrawalConfirmationModal}
        withdrawablTokenBalance={stakedTokenAmount || undefined}
        onDismiss={handleDismiss}
        stakablePair={campaign.targetedPair}
        attemptingTxn={attemptingTransaction}
        errorMessage={errorMessage}
        onConfirm={handleWithdrawalConfirmation}
        txHash={transactionHash}
      />
      {claimableRewardAmounts && (
        <ConfirmClaimModal
          isOpen={showClaimConfirmationModal}
          claimableTokenAmounts={claimableRewardAmounts}
          onDismiss={handleDismiss}
          attemptingTxn={attemptingTransaction}
          errorMessage={errorMessage}
          onConfirm={handleClaimConfirmation}
          txHash={transactionHash}
        />
      )}
      <ConfirmExitModal
        isOpen={showExitConfirmationModal}
        onDismiss={handleDismiss}
        stakablePair={campaign.targetedPair}
        claimableRewards={claimableRewardAmounts}
        stakedTokenBalance={stakedTokenAmount || undefined}
        attemptingTxn={attemptingTransaction}
        errorMessage={errorMessage}
        onConfirm={handleExitConfirmation}
        txHash={transactionHash}
      />
    </Modal>
  )
}
