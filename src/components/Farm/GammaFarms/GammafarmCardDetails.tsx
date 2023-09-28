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
import { FarmPoolData } from '../constants'
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
  data: FarmPoolData
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
  }
}> = ({ pairData, rewardData, data, dataDetails }) => {
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

  // const getDepositAmounts = async (tokenInput: number) => {
  //   if (!uniProxyContract) return

  //   let amounts
  //   if (tokenInput === 0 && deposit0) {
  //     amounts = await uniProxyContract.getDepositAmount(pairData.hypervisor, token0Address, parseUnits(deposit0, 18))
  //     setDeposit1(formatUnits(amounts.amountEnd, 18))
  //   } else if (tokenInput === 1 && deposit1) {
  //     amounts = await uniProxyContract.getDepositAmount(pairData.hypervisor, token1Address, parseUnits(deposit1, 18))
  //     setDeposit0(formatUnits(amounts.amountEnd, 18))
  //   }
  // }

  // const depositUniProxy = async () => {
  //   if (!uniProxyContract || !account) return
  //   if (approvalToken0 !== ApprovalState.APPROVED || approvalToken1 !== ApprovalState.APPROVED) {
  //     console.error('Tokens not approved')
  //     return
  //   }

  //   try {
  //     const response = await uniProxyContract.deposit(
  //       parseUnits(deposit0, 18),
  //       parseUnits(deposit1, 18),
  //       account,
  //       pairData.hypervisor,
  //       [0, 0, 0, 0]
  //     )
  //     addTransaction(response, {
  //       type: TransactionType.ADD_LIQUIDITY_GAMMA,
  //       currencyId0: token0Address,
  //       currencyId1: token1Address,
  //       amount0: parseUnits(deposit0, 18).toString(),
  //       amount1: parseUnits(deposit1, 18).toString(),
  //     })
  //     const receipt = await response.wait()
  //     finalizedTransaction(receipt, {
  //       summary: 'depositliquidity',
  //     })
  //   } catch (e) {
  //     console.error('Deposit failed', e)
  //   }
  // }

  // const withdrawHypervisor = async () => {
  //   if (!hypervisorContract || !account) return

  //   try {
  //     const response = await hypervisorContract.withdraw(parseUnits(unStakeGamma, 18), account, account, [0, 0, 0, 0])
  //     addTransaction(response, {
  //       type: TransactionType.REMOVE_LIQUIDITY_GAMMA,
  //       amount: parseUnits(unStakeGamma, 18).toString(),
  //       tokenAddress: pairData.hypervisor,
  //     })
  //     const receipt = await response.wait()
  //     finalizedTransaction(receipt, {
  //       summary: 'withdrawliquidity',
  //     })
  //   } catch (e) {
  //     console.error('Withdraw failed', e)
  //   }
  // }

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

      {/* <input
        value={deposit0}
        onChange={async (e) => {
          setDeposit0(e.target.value)
          getDepositAmounts(0)
        }}
        placeholder="Deposit 0"
      />

      <input
        value={deposit1}
        onChange={async (e) => {
          setDeposit1(e.target.value)
          getDepositAmounts(1)
        }}
        placeholder="Deposit 1"
      />

      <button onClick={approveCallbackToken0} disabled={approvalToken0 === ApprovalState.APPROVED}>
        {approvalToken0 === ApprovalState.PENDING ? 'Aproving Token 0...' : 'Approve Token 0'}
      </button> */}

      {/* <button onClick={approveCallbackToken1} disabled={approvalToken1 === ApprovalState.APPROVED}>
        {approvalToken1 === ApprovalState.PENDING ? 'Aproving Token 1...' : 'Approve Token 1'}
      </button>

      <button onClick={depositUniProxy}>Deposit via UniProxy</button>

      <input
        value={unStakeGamma}
        onChange={async (e) => {
          setUnStakeGamma(e.target.value)
        }}
        placeholder="Unstake Gamma"
      /> */}

      {/* <button onClick={withdrawHypervisor}>Withdraw Gamma Liquidity</button> */}

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
                    ? 'stakingLPTokens'
                    : 'stakeLPTokens'
                  : approveOrStaking
                  ? 'approving'
                  : 'approve'
              }
              setUnStakeAmount={setUnStakeAmount}
            />
          )}

          <GridItemGammaCard
            titleText="Deposited:"
            stakedUSD={dataDetails.stakedUSD}
            setUnStakeAmount={setUnStakeAmount}
            stakedAmount={dataDetails.stakedAmount}
            unStakeAmount={unStakeAmount}
            unStakeButtonDisabled={unStakeButtonDisabled}
            textButton={attemptUnstaking ? 'unstakingLPTokens' : 'unstakeLPTokens'}
            setStakeAmount={dataDetails.setStakeAmount}
            stakeAmount={dataDetails.stakeAmount}
            unStakeLP={unStakeLP}
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
                    {attemptClaiming ? 'claiming' : 'claim'}
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
