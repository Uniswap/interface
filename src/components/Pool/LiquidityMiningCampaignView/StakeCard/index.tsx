import { JSBI, LiquidityMiningCampaign, parseBigintIsh, TokenAmount } from 'dxswap-sdk'
import React, { useCallback, useEffect, useState } from 'react'
import Skeleton from 'react-loading-skeleton'
import { Box, Flex } from 'rebass'
import styled from 'styled-components'

import { useActiveWeb3React } from '../../../../hooks'
import { useLiquidityMiningActionCallbacks } from '../../../../hooks/useLiquidityMiningActionCallbacks'
import { useLiquidityMiningCampaignPosition } from '../../../../hooks/useLiquidityMiningCampaignPosition'
import { useLpTokensUnderlyingAssets } from '../../../../hooks/useLpTokensUnderlyingAssets'
import { useTransactionAdder } from '../../../../state/transactions/hooks'
import { useTokenBalance } from '../../../../state/wallet/hooks'
import { TYPE } from '../../../../theme'
import { ButtonDark } from '../../../Button'

import { GreyCard } from '../../../Card'
import { AutoColumn } from '../../../Column'
import CurrencyLogo from '../../../CurrencyLogo'
import Row, { RowBetween } from '../../../Row'
import DataDisplayer from '../DataDisplayer'
import TokenAmountDisplayer from '../TokenAmountDisplayer'
import ConfirmClaimModal from './ConfirmClaimModal'
import ConfirmExitModal from './ConfirmExitModal'
import ConfirmStakingModal from './ConfirmStakingModal'
import ConfirmWithdrawalModal from './ConfirmWithdrawalModal'

const StyledPositionCard = styled(GreyCard)`
  border: none;
  padding: 24px 28px;
  color: white;
  position: relative;
  overflow: hidden;
  background: radial-gradient(147.37% 164.97% at 50% 0%, rgba(255, 255, 255, 0.1) 0%, rgba(0, 0, 0, 0) 100%), #1f1d2c;
  background-blend-mode: overlay, normal;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    padding: 24px;
  `}
`

const DataRow = styled(Flex)`
  margin-bottom: 18px;
  justify-content: space-between;
  text-align: right;
  margin-bottom: 28px;

  & > *:first-child {
    flex-grow: 1;
  }

  ${({ theme }) => theme.mediaWidth.upToSmall`
    flex-wrap: wrap;

    && > * {
      width: 50%;
      margin: 0 0 28px;
      text-align: left;
    }
  `}
`;

const TokenAmountBlock = styled(TokenAmountDisplayer)`
  && {
    justify-content: flex-end;

    ${({ theme }) => theme.mediaWidth.upToSmall`
      justify-content: start;
    `}
  }
`;

const ButtonsRow = styled(RowBetween)`
  & > button + button {
    margin-left: 8px;
  }

  ${({ theme }) => theme.mediaWidth.upToSmall`
    flex-direction: column;

    & > button {
      color: #fff;
    }

    & > button + button {
      margin: 8px 0 0;
    }
  `}
`;

const StyledButtonDark = styled(ButtonDark)`
  width: 100%;
  padding: 9.5px;
  font-weight: 500;
  font-size: 12px;
  line-height: 15px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #C0BAF7;
  border: 1px solid #2A2F42;
  background: #191A24;
`;

interface FullPositionCardProps {
  campaign?: LiquidityMiningCampaign
  showUSDValue: boolean
}

export default function StakeCard({ campaign, showUSDValue }: FullPositionCardProps) {
  const { account } = useActiveWeb3React()
  const stakableTokenBalance = useTokenBalance(account || undefined, campaign?.targetedPair.liquidityToken)
  const callbacks = useLiquidityMiningActionCallbacks(campaign?.address)
  const {
    stakedTokenAmount,
    claimableRewardAmounts,
    claimedRewardAmounts,
    totalRewardedAmounts
  } = useLiquidityMiningCampaignPosition(campaign, account || undefined)
  const addTransaction = useTransactionAdder()
  const { loading: loadingLpTokensUnderlyingAssets, underlyingAssets } = useLpTokensUnderlyingAssets(
    campaign?.targetedPair,
    stakedTokenAmount || undefined
  )

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
  const [disabledExit, setDisabledExit] = useState(false)
  const [normalizedStakableTokenBalance, setNormalizedStakableTokenBalance] = useState<TokenAmount | null>(null)

  useEffect(() => {
    if (!campaign) {
      setNormalizedStakableTokenBalance(null)
      return
    }
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
      !campaign ||
        !campaign.currentlyActive ||
        !callbacks ||
        !normalizedStakableTokenBalance ||
        normalizedStakableTokenBalance.equalTo('0')
    )
  }, [callbacks, campaign, normalizedStakableTokenBalance])

  useEffect(() => {
    const now = JSBI.BigInt(Math.floor(Date.now() / 1000))
    setDisabledWithdrawing(
      !campaign ||
        !JSBI.greaterThanOrEqual(now, parseBigintIsh(campaign.startsAt)) ||
        !callbacks ||
        !stakedTokenAmount ||
        stakedTokenAmount.equalTo('0') ||
        (campaign.locked && !JSBI.greaterThanOrEqual(now, parseBigintIsh(campaign.endsAt)))
    )
  }, [callbacks, campaign, stakedTokenAmount])

  useEffect(() => {
    setDisabledClaim(
      !campaign ||
        !callbacks ||
        !JSBI.greaterThanOrEqual(JSBI.BigInt(Math.floor(Date.now() / 1000)), parseBigintIsh(campaign.startsAt)) ||
        !claimableRewardAmounts.find(amount => amount.greaterThan('0'))
    )
  }, [callbacks, campaign, claimableRewardAmounts])

  useEffect(() => {
    const now = JSBI.BigInt(Math.floor(Date.now() / 1000))
    setDisabledExit(
      disabledClaim ||
        !stakedTokenAmount ||
        stakedTokenAmount.equalTo('0') ||
        !!(campaign?.locked && !JSBI.greaterThanOrEqual(now, parseBigintIsh(campaign.endsAt)))
    )
  }, [campaign, disabledClaim, stakedTokenAmount])

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
      if (!callbacks || !campaign) return
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
      if (!callbacks || !campaign) return
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
    <>
      <StyledPositionCard>
        <AutoColumn gap="8px">
          <Flex flexDirection="column">
            <Box mb="20px">
              <TYPE.body color="white" fontWeight="500" lineHeight="19.5px">
                My stake
              </TYPE.body>
            </Box>
            <DataRow mb="18px" justifyContent="space-between">
              <Box mr="20px">
                <DataDisplayer
                  title={<Row>STAKED</Row>}
                  data={
                    <AutoColumn gap="4px">
                      {loadingLpTokensUnderlyingAssets || !underlyingAssets ? (
                        <>
                          <Row justifyContent="flex-end">
                            <Skeleton width="40px" height="14px" />
                            <CurrencyLogo marginLeft={4} loading size="14px" />
                          </Row>
                          <Row justifyContent="flex-end">
                            <Skeleton width="40px" height="14px" />
                            <CurrencyLogo marginLeft={4} loading size="14px" />
                          </Row>
                        </>
                      ) : (
                        <>
                          <TokenAmountDisplayer amount={underlyingAssets.token0} showUSDValue={showUSDValue} />
                          <TokenAmountDisplayer amount={underlyingAssets.token1} showUSDValue={showUSDValue} />
                        </>
                      )}
                    </AutoColumn>
                  }
                />
              </Box>
              <Box mr="20px">
                <DataDisplayer
                  title="REWARDED"
                  data={
                    totalRewardedAmounts.length === 0 ? (
                      <Row justifyContent="flex-end">
                        <Skeleton width="40px" height="14px" />
                        <CurrencyLogo loading marginLeft={4} size="14px" />
                      </Row>
                    ) : (
                      totalRewardedAmounts.map(totalRewardedAmount => {
                        return (
                          <TokenAmountBlock
                            key={totalRewardedAmount.token.address}
                            amount={totalRewardedAmount}
                            showUSDValue={showUSDValue}
                          />
                        )
                      })
                    )
                  }
                />
              </Box>
              <Box mr="20px">
                <DataDisplayer
                  title="CLAIMABLE"
                  data={
                    claimableRewardAmounts.length === 0 ? (
                      <Row justifyContent="flex-end">
                        <Skeleton width="40px" height="14px" />
                        <CurrencyLogo loading marginLeft={4} size="14px" />
                      </Row>
                    ) : (
                      claimableRewardAmounts.map(claimableRewardAmount => {
                        return (
                          <TokenAmountBlock
                            key={claimableRewardAmount.token.address}
                            amount={claimableRewardAmount}
                            showUSDValue={showUSDValue}
                          />
                        )
                      })
                    )
                  }
                />
              </Box>
              <Box>
                <DataDisplayer
                  title="CLAIMED"
                  data={
                    claimedRewardAmounts.length === 0 ? (
                      <Row justifyContent="flex-end">
                        <Skeleton width="40px" height="14px" />
                        <CurrencyLogo loading marginLeft={4} size="14px" />
                      </Row>
                    ) : (
                      claimedRewardAmounts.map(claimedRewardAmount => {
                        return (
                          <TokenAmountBlock
                            key={claimedRewardAmount.token.address}
                            amount={claimedRewardAmount}
                            showUSDValue={showUSDValue}
                          />
                        )
                      })
                    )
                  }
                />
              </Box>
            </DataRow>
          </Flex>
          <ButtonsRow>
            <StyledButtonDark
              disabled={disabledStaking}
              onClick={handleStakingRequest}
            >
              Deposit and stake
            </StyledButtonDark>
            <StyledButtonDark
              disabled={disabledClaim}
              onClick={handleClaimRequest}
            >
              Claim rewards
            </StyledButtonDark>
          </ButtonsRow>
          <ButtonsRow>
            <StyledButtonDark
              disabled={disabledWithdrawing}
              onClick={handleWithdrawalRequest}
            >
              Withdraw
            </StyledButtonDark>
            <StyledButtonDark
              disabled={disabledExit}
              onClick={handleExitRequest}
            >
              Claim and withdraw
            </StyledButtonDark>
          </ButtonsRow>
        </AutoColumn>
      </StyledPositionCard>
      {campaign && campaign.address && normalizedStakableTokenBalance && (
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
          timelocked={campaign.locked}
          endingTimestamp={Number(parseBigintIsh(campaign.endsAt).toString())}
        />
      )}
      <ConfirmWithdrawalModal
        isOpen={showWithdrawalConfirmationModal}
        withdrawablTokenBalance={stakedTokenAmount || undefined}
        onDismiss={handleDismiss}
        stakablePair={campaign?.targetedPair}
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
        stakablePair={campaign?.targetedPair}
        claimableRewards={claimableRewardAmounts}
        stakedTokenBalance={stakedTokenAmount || undefined}
        attemptingTxn={attemptingTransaction}
        errorMessage={errorMessage}
        onConfirm={handleExitConfirmation}
        txHash={transactionHash}
      />
    </>
  )
}
