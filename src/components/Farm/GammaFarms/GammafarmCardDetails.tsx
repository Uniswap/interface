import { TransactionResponse } from '@ethersproject/abstract-provider'
import { CurrencyAmount, Token } from '@pollum-io/sdk-core'
import { formatNumber } from '@uniswap/conedison/format'
import { useWeb3React } from '@web3-react/core'
import { ButtonPrimary } from 'components/Button'
import Divider from 'components/Divider/Divider'
import CurrencyLogo from 'components/Logo/CurrencyLogo'
import { Contract } from 'ethers/lib/ethers'
import { formatUnits, parseUnits } from 'ethers/lib/utils'
import { useToken } from 'hooks/Tokens'
import { ApprovalState } from 'hooks/useApproveCallback'
import { useSingleCallResult } from 'lib/hooks/multicall'
import { useIsMobile } from 'nft/hooks'
import React, { useState } from 'react'
import { Box } from 'rebass'
import { useTransactionAdder } from 'state/transactions/hooks'
import styled, { useTheme } from 'styled-components/macro'
import { calculateGasMargin } from 'utils/calculateGasMargin'
import { useTransactionFinalizer } from 'utils/farmUtils'

import { TransactionType } from '../../../state/transactions/types'
import { GridItemGammaCard } from './GridItemGammaCard'

// Estilo do Grid
const Grid = styled.div<{ isMobile: boolean; hasRewards: boolean }>`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-columns: ${(props) => (props.isMobile ? 'none' : 'repeat(3, 1fr)')};
  grid-template-rows: ${(props) =>
    props.isMobile ? (props.hasRewards ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)') : 'none'};
  gap: 16px;
`

// Estilo do Item do Grid
const GridItem = styled.div`
  padding: 20px;
  text-align: center;
  font-size: 18px;
`

const ClaimContainer = styled.div`
  height: 100%;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-direction: column;
`
const GammaFarmCardDetails: React.FC<{
  pairData: any
  rewardData: any
  dataDetails: {
    stakeAmount: string
    stakedAmount: string
    lpTokenBalance?: CurrencyAmount<Token>
    lpBalanceBN: any
    approval: ApprovalState
    approveCallback: () => Promise<void>
    parsedStakeAmount?: CurrencyAmount<Token>
    availableStakeAmount: string
    stakedAmountBN: any
    masterChefContract: Contract | null
    stakedUSD: number
    availableStakeUSD: number
    setStakeAmount: React.Dispatch<React.SetStateAction<string>>
    lpSymbol: string
  }
}> = ({ pairData, rewardData, dataDetails }) => {
  const { account } = useWeb3React()
  const addTransaction = useTransactionAdder()
  const finalizedTransaction = useTransactionFinalizer()
  const [unStakeAmount, setUnStakeAmount] = useState('')
  const [approveOrStaking, setApproveOrStaking] = useState(false)
  const [attemptUnstaking, setAttemptUnstaking] = useState(false)
  const [attemptClaiming, setAttemptClaiming] = useState(false)
  const isMobile = useIsMobile()
  const theme = useTheme()
  const rewardTokenAddress = rewardData?.rewardTokenAddress
  const token = useToken(rewardTokenAddress?.result?.toString())

  const rewards = useSingleCallResult(dataDetails.masterChefContract, 'pendingReward', [
    pairData.pid,
    account ?? undefined,
  ])
  const rewardsBN = !rewards.loading && rewards.result && rewards.result.length > 0 ? rewards.result[0] : undefined
  const rewardsAmount = rewardsBN ? formatUnits(rewardsBN, 18) : '0'

  const rewardTokenContract = useSingleCallResult(dataDetails.masterChefContract, 'REWARD')
  const rewardToken = useToken(rewardTokenContract?.result?.toString())

  const stakeButtonDisabled =
    Number(dataDetails.stakeAmount) <= 0 ||
    !dataDetails.lpTokenBalance ||
    dataDetails.parsedStakeAmount?.greaterThan(dataDetails.lpTokenBalance) ||
    !dataDetails.masterChefContract ||
    !account ||
    approveOrStaking

  const unStakeButtonDisabled =
    Number(unStakeAmount) <= 0 ||
    Number(unStakeAmount) > Number(dataDetails.stakedAmount) ||
    !dataDetails.masterChefContract ||
    !account ||
    attemptUnstaking

  const claimButtonDisabled = Number(rewardsAmount) == 0 || attemptClaiming

  const approveOrStakeLP = async () => {
    setApproveOrStaking(true)
    try {
      if (dataDetails.approval === ApprovalState.APPROVED) {
        await stakeLP()
      } else {
        await dataDetails.approveCallback()
      }
      setApproveOrStaking(false)
    } catch (e) {
      console.log('Err:', e)
      setApproveOrStaking(false)
    }
  }

  const stakeLP = async () => {
    if (!dataDetails.masterChefContract || !account || !dataDetails.lpBalanceBN) return

    const estimatedGas = await dataDetails.masterChefContract.estimateGas.deposit(
      pairData.pid,
      dataDetails.stakeAmount === dataDetails.availableStakeAmount
        ? dataDetails.lpBalanceBN
        : parseUnits(Number(dataDetails.stakeAmount).toFixed(18), 18),
      account
    )

    const response: TransactionResponse = await dataDetails.masterChefContract.deposit(
      pairData.pid,
      dataDetails.stakeAmount === dataDetails.availableStakeAmount
        ? dataDetails.lpBalanceBN
        : parseUnits(Number(dataDetails.stakeAmount).toFixed(18), 18),
      account,
      {
        gasLimit: calculateGasMargin(estimatedGas),
      }
    )

    addTransaction(response, {
      type: TransactionType.DEPOSIT_FARM,
      pid: pairData.pid,
      amount: (dataDetails.stakeAmount === dataDetails.availableStakeAmount
        ? dataDetails.lpBalanceBN
        : parseUnits(Number(dataDetails.stakeAmount).toFixed(18), 18)
      ).toString(),
      tokenAddress: pairData.hypervisor,
    })
    const receipt = await response.wait()
    finalizedTransaction(receipt, {
      summary: 'depositliquidity',
    })
  }

  const unStakeLP = async () => {
    if (!dataDetails.masterChefContract || !account || !dataDetails.stakedAmountBN) return
    setAttemptUnstaking(true)
    try {
      const estimatedGas = await dataDetails.masterChefContract.estimateGas.withdraw(
        pairData.pid,
        unStakeAmount === dataDetails.stakedAmount
          ? dataDetails.stakedAmountBN
          : parseUnits(Number(unStakeAmount).toFixed(18), 18),
        account
      )
      const response: TransactionResponse = await dataDetails.masterChefContract.withdraw(
        pairData.pid,
        unStakeAmount === dataDetails.stakedAmount
          ? dataDetails.stakedAmountBN
          : parseUnits(Number(unStakeAmount).toFixed(18), 18),
        account,
        {
          gasLimit: calculateGasMargin(estimatedGas),
        }
      )

      addTransaction(response, {
        type: TransactionType.WITHDRAW_FARM,
        pid: pairData.pid,
        amount: (unStakeAmount === dataDetails.stakedAmount
          ? dataDetails.stakedAmountBN
          : parseUnits(Number(unStakeAmount).toFixed(18), 18)
        ).toString(),
        tokenAddress: pairData.hypervisor,
      })
      const receipt = await response.wait()
      finalizedTransaction(receipt, {
        summary: 'withdrawliquidity',
      })
      setAttemptUnstaking(false)
    } catch (e) {
      setAttemptUnstaking(false)
      console.log('err: ', e)
    }
  }

  const claimReward = async () => {
    if (!dataDetails.masterChefContract || !account) return
    setAttemptClaiming(true)
    try {
      const estimatedGas = await dataDetails.masterChefContract.estimateGas.harvest(pairData.pid, account)
      const response: TransactionResponse = await dataDetails.masterChefContract.harvest(pairData.pid, account, {
        gasLimit: calculateGasMargin(estimatedGas),
      })

      addTransaction(response, {
        type: TransactionType.CLAIM_FARM,
        pid: pairData.pid,
        amount: rewardsBN.toString(),
        tokenAddress: rewardData.rewardTokenAddress,
      })
      const receipt = await response.wait()
      finalizedTransaction(receipt, {
        summary: 'claimrewards',
      })
      setAttemptClaiming(false)
    } catch (e) {
      setAttemptClaiming(false)
      console.log('err: ', e)
    }
  }

  return (
    <Box width="100%">
      {!isMobile && <Divider margin="none" />}
      {isMobile && (
        <>
          <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-around' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                flexDirection: 'column',
                fontWeight: 600,
              }}
            >
              <small style={{ color: theme.accentActive }}>TVL</small>
              {rewardData?.tvl && <small style={{ fontWeight: 600 }}> ${formatNumber(rewardData.tvl)}</small>}
            </div>
            <div
              style={{
                fontWeight: 600,
                display: 'flex',
                justifyContent: 'space-between',
                flexDirection: 'column',
              }}
            >
              <small style={{ color: theme.accentActive }}>Rewards</small>
              <small style={{ display: 'flex', justifyContent: 'space-between' }}>
                {rewardsAmount &&
                  Number(rewardsAmount) > 0 &&
                  token &&
                  `${formatNumber(Number(rewardsAmount) * 3600 * 24)} ${token.symbol} / day`}
              </small>
            </div>
          </div>
          <Divider margin="none" />
        </>
      )}

      <div style={{ padding: 1.5 }}>
        <Grid isMobile={isMobile} hasRewards={Number(rewardsAmount) > 0}>
          {pairData.ableToFarm && (
            <GridItemGammaCard
              titleText="Available:"
              approveOrStakeLP={approveOrStakeLP}
              availableStakeAmount={dataDetails.availableStakeAmount}
              availableStakeUSD={dataDetails.availableStakeUSD}
              stakeAmount={dataDetails.stakeAmount}
              setStakeAmount={dataDetails.setStakeAmount}
              stakeButtonDisabled={stakeButtonDisabled}
              textButton={
                dataDetails.approval === ApprovalState.APPROVED
                  ? approveOrStaking
                    ? 'Depositing LP'
                    : 'Deposit LP'
                  : approveOrStaking
                  ? 'Approving'
                  : 'Approve'
              }
              setUnStakeAmount={setUnStakeAmount}
              tokenLPSymbol={dataDetails.lpSymbol}
            />
          )}

          <GridItemGammaCard
            titleText="Deposited:"
            stakedUSD={dataDetails.stakedUSD}
            setUnStakeAmount={setUnStakeAmount}
            stakedAmount={dataDetails.stakedAmount}
            unStakeAmount={unStakeAmount}
            unStakeButtonDisabled={unStakeButtonDisabled}
            textButton={attemptUnstaking ? 'Withdrawing' : 'Withdraw'}
            setStakeAmount={dataDetails.setStakeAmount}
            stakeAmount={dataDetails.stakeAmount}
            unStakeLP={unStakeLP}
            tokenLPSymbol={dataDetails.lpSymbol}
          />

          {rewardToken && Number(rewardsAmount) !== 0 && (
            <GridItem>
              <ClaimContainer>
                <small style={{ color: theme.textSecondary }}>EarnedRewards</small>
                <div style={{ marginBottom: 10, marginTop: 10 }}>
                  <div
                    key={rewardToken.address}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <CurrencyLogo currency={rewardToken} size="16px" />
                    <div style={{ marginLeft: '6px' }}>
                      <small>
                        {formatNumber(Number(rewardsAmount))} {rewardToken.symbol}
                      </small>
                    </div>
                  </div>
                </div>
                <Box width="100%">
                  <ButtonPrimary style={{ height: '40px' }} disabled={claimButtonDisabled} onClick={claimReward}>
                    {attemptClaiming ? 'Claiming' : 'Claim'}
                  </ButtonPrimary>
                </Box>
              </ClaimContainer>
            </GridItem>
          )}
        </Grid>
      </div>
    </Box>
  )
}

export default GammaFarmCardDetails
