import { Interface } from '@ethersproject/abi'
import { Token } from '@pollum-io/sdk-core'
import { formatNumber } from '@uniswap/conedison/format'
import { useWeb3React } from '@web3-react/core'
import { ButtonPrimary } from 'components/Button'
import Divider from 'components/Divider/Divider'
import CurrencyLogo from 'components/Logo/CurrencyLogo'
import Input from 'components/NumericalInput'
import { formatUnits } from 'ethers/lib/utils'
import { ApprovalState } from 'hooks/useApproveCallback'
import { useGammaHypervisorContract, useMasterChefContract } from 'hooks/useContract'
import { useMultipleContractSingleData, useSingleCallResult } from 'lib/hooks/multicall'
import { useIsMobile } from 'nft/hooks'
import React, { useState } from 'react'
import { Box } from 'react-feather'
import { useCombinedActiveList } from 'state/lists/hooks'
import { useTransactionAdder } from 'state/transactions/hooks'
import styled from 'styled-components/macro'
import { getTokenFromAddress, useTransactionFinalizer } from 'utils/farmUtils'

import QIGammaMasterChef from '../../../abis/gamma-masterchef1.json'
import GammaRewarder from '../../../abis/gamma-rewarder.json'

// Estilo do Grid
const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
`

// Estilo do Item do Grid
const GridItem = styled.div`
  background-color: #f1f1f1;
  padding: 20px;
  text-align: center;
  font-size: 18px;
`
const GammaFarmCardDetails: React.FC<{
  data: any
  pairData: any
  rewardData: any
}> = ({ pairData, rewardData, data }) => {
  const { chainId, account } = useWeb3React()
  const addTransaction = useTransactionAdder()
  const finalizedTransaction = useTransactionFinalizer()
  const [stakeAmount, setStakeAmount] = useState('')
  const [unStakeAmount, setUnStakeAmount] = useState('')
  const [approveOrStaking, setApproveOrStaking] = useState(false)
  const [attemptUnstaking, setAttemptUnstaking] = useState(false)
  const [attemptClaiming, setAttemptClaiming] = useState(false)
  const isMobile = useIsMobile()

  const tokenMap = useCombinedActiveList()

  const masterChefContract = useMasterChefContract(
    pairData.masterChefIndex ?? 0,
    undefined,
    pairData.masterChefIndex === 2 ? QIGammaMasterChef : undefined
  )
  const hypervisorContract = useGammaHypervisorContract(pairData.address)

  const stakedData = useSingleCallResult(masterChefContract, 'userInfo', [pairData.pid, account ?? undefined])

  const stakedAmountBN =
    !stakedData.loading && stakedData.result && stakedData.result.length > 0 ? stakedData.result[0] : undefined
  const stakedAmount = stakedAmountBN ? formatUnits(stakedAmountBN, 18) : '0'

  const lpTokenUSD =
    data && data.totalSupply && Number(data.totalSupply) > 0
      ? (Number(data.tvlUSD) / Number(data.totalSupply)) * 10 ** 18
      : 0
  const stakedUSD = Number(stakedAmount) * lpTokenUSD

  const rewards: any[] = rewardData && rewardData['rewarders'] ? Object.values(rewardData['rewarders']) : []
  const rewarderAddresses =
    pairData.masterChefIndex !== 2 && rewardData && rewardData['rewarders'] ? Object.keys(rewardData['rewarders']) : []
  const gammaPendingRewardsData = useMultipleContractSingleData(
    rewarderAddresses,
    new Interface(GammaRewarder),
    'pendingToken',
    [pairData.pid, account ?? undefined]
  )
  const qipendingRewardData = useSingleCallResult(
    pairData.masterChefIndex === 2 ? masterChefContract : undefined,
    'pending',
    [pairData.pid, account ?? undefined]
  )

  const pendingRewardsData = pairData.masterChefIndex === 2 ? [qipendingRewardData] : gammaPendingRewardsData

  const pendingRewards = pendingRewardsData
    .reduce<{ token: Token; amount: number }[]>((rewardArray, callData, index) => {
      const reward = rewards.length > 0 ? rewards[index] : undefined
      if (chainId && reward && tokenMap) {
        const rewardToken = getTokenFromAddress(reward.rewardToken, tokenMap, [])

        if (rewardToken) {
          const existingRewardIndex = rewardArray.findIndex(
            (item) => item.token.address.toLowerCase() === reward.rewardToken.toLowerCase()
          )
          const rewardAmountBN =
            !callData.loading && callData.result && callData.result.length > 0 ? callData.result[0] : undefined

          const rewardAmount =
            // (rewardAmountBN ? Number(formatUnits(rewardAmountBN, rewardToken.decimals as unknown as Token)) : 0) +
            0 + (existingRewardIndex > -1 ? rewardArray[existingRewardIndex].amount : 0)
          if (existingRewardIndex === -1) {
            rewardArray.push({ token: rewardToken as unknown as Token, amount: rewardAmount })
          } else {
            rewardArray[existingRewardIndex] = {
              token: rewardToken as unknown as Token,
              amount: rewardAmount,
            }
          }
        }
      }
      return rewardArray
    }, [])
    .filter((reward) => reward && Number(reward.amount) > 0)

  const lpToken = chainId ? new Token(chainId, pairData.address, 18) : undefined
  const lpBalanceData = useSingleCallResult(hypervisorContract, 'balanceOf', [account ?? undefined])
  const lpBalanceBN =
    !lpBalanceData.loading && lpBalanceData.result && lpBalanceData.result.length > 0
      ? lpBalanceData.result[0]
      : undefined
  const availableStakeAmount = lpBalanceBN ? formatUnits(lpBalanceBN, 18) : '0'

  const availableStakeUSD = Number(availableStakeAmount) * lpTokenUSD
  // const lpTokenBalance = chainId ? tryParseAmount(chainId, availableStakeAmount, lpToken) : undefined
  const lpTokenBalance = 0
  // const parsedStakeAmount = chainId ? tryParseAmount(chainId, stakeAmount, lpToken) : undefined
  const parsedStakeAmount = 0
  const stakeButtonDisabled = true
  // Number(stakeAmount) <= 0 ||
  // !lpTokenBalance ||
  // parsedStakeAmount?.greaterThan(lpTokenBalance) ||
  // !masterChefContract ||
  // !account ||
  // approveOrStaking
  const unStakeButtonDisabled = false
  // Number(unStakeAmount) <= 0 ||
  // Number(unStakeAmount) > Number(stakedAmount) ||
  // !masterChefContract ||
  // !account ||
  // attemptUnstaking
  // const [approval, approveCallback] = useApproveCallback(parsedStakeAmount, masterChefContract?.address)
  const approval = ApprovalState.APPROVED
  const claimButtonDisabled = pendingRewards.length === 0 || attemptClaiming

  const approveOrStakeLP = async () => {
    setApproveOrStaking(true)
    try {
      //     if (approval === ApprovalState.APPROVED) {
      //       await stakeLP()
      //     } else {
      //       await approveCallback()
      //     }
      setApproveOrStaking(false)
    } catch (e) {
      console.log('Err:', e)
      setApproveOrStaking(false)
    }
  }

  const stakeLP = async () => {
    // if (!masterChefContract || !account || !lpBalanceBN) return
    // let response: TransactionResponse
    // if (pairData.masterChefIndex === 2) {
    //   const estimatedGas = await masterChefContract.estimateGas.deposit(
    //     pairData.pid,
    //     stakeAmount === availableStakeAmount ? lpBalanceBN : parseUnits(Number(stakeAmount).toFixed(18), 18)
    //   )
    //   response = await masterChefContract.deposit(
    //     pairData.pid,
    //     stakeAmount === availableStakeAmount ? lpBalanceBN : parseUnits(Number(stakeAmount).toFixed(18), 18),
    //     {
    //       gasLimit: calculateGasMargin(estimatedGas),
    //     }
    //   )
    // } else {
    //   const estimatedGas = await masterChefContract.estimateGas.deposit(
    //     pairData.pid,
    //     stakeAmount === availableStakeAmount ? lpBalanceBN : parseUnits(Number(stakeAmount).toFixed(18), 18),
    //     account
    //   )
    //   response = await masterChefContract.deposit(
    //     pairData.pid,
    //     stakeAmount === availableStakeAmount ? lpBalanceBN : parseUnits(Number(stakeAmount).toFixed(18), 18),
    //     account,
    //     {
    //       gasLimit: calculateGasMargin(estimatedGas),
    //     }
    //   )
    // }
    // addTransaction(response, {
    //   summary: 'depositliquidity',
    // })
    // const receipt = await response.wait()
    // finalizedTransaction(receipt, {
    //   summary: 'depositliquidity',
    // })
  }

  const unStakeLP = async () => {
    if (!masterChefContract || !account || !stakedAmountBN) return
    setAttemptUnstaking(true)
    try {
      // let response: TransactionResponse
      // if (pairData.masterChefIndex === 2) {
      //   const estimatedGas = await masterChefContract.estimateGas.withdraw(
      //     pairData.pid,
      //     unStakeAmount === stakedAmount ? stakedAmountBN : parseUnits(Number(unStakeAmount).toFixed(18), 18)
      //   )
      //   response = await masterChefContract.withdraw(
      //     pairData.pid,
      //     unStakeAmount === stakedAmount ? stakedAmountBN : parseUnits(Number(unStakeAmount).toFixed(18), 18),
      //     {
      //       gasLimit: calculateGasMargin(estimatedGas),
      //     }
      //   )
      // } else {
      //   const estimatedGas = await masterChefContract.estimateGas.withdraw(
      //     pairData.pid,
      //     unStakeAmount === stakedAmount ? stakedAmountBN : parseUnits(Number(unStakeAmount).toFixed(18), 18),
      //     account
      //   )
      //   response = await masterChefContract.withdraw(
      //     pairData.pid,
      //     unStakeAmount === stakedAmount ? stakedAmountBN : parseUnits(Number(unStakeAmount).toFixed(18), 18),
      //     account,
      //     {
      //       gasLimit: calculateGasMargin(estimatedGas),
      //     }
      //   )
      // }

      // addTransaction(response, {
      //   summary: 'withdrawliquidity',
      // })
      // const receipt = await response.wait()
      // finalizedTransaction(receipt, {
      //   summary: 'withdrawliquidity',
      // })
      setAttemptUnstaking(false)
    } catch (e) {
      setAttemptUnstaking(false)
      console.log('err: ', e)
    }
  }

  const claimReward = async () => {
    if (!masterChefContract || !account) return
    setAttemptClaiming(true)
    try {
      // let response: TransactionResponse
      // if (pairData.masterChefIndex === 2) {
      //   const estimatedGas = await masterChefContract.estimateGas.deposit(pairData.pid, '0')
      //   response = await masterChefContract.deposit(pairData.pid, '0', {
      //     gasLimit: calculateGasMargin(estimatedGas),
      //   })
      // } else {
      //   const estimatedGas = await masterChefContract.estimateGas.harvest(pairData.pid, account)
      //   response = await masterChefContract.harvest(pairData.pid, account, {
      //     gasLimit: calculateGasMargin(estimatedGas),
      //   })
      // }
      // addTransaction(response, {
      //   summary: 'claimrewards',
      // })
      // const receipt = await response.wait()
      // finalizedTransaction(receipt, {
      //   summary: 'claimrewards',
      // })
      setAttemptClaiming(false)
    } catch (e) {
      setAttemptClaiming(false)
      console.log('err: ', e)
    }
  }

  return (
    <Box>
      <Divider />
      {isMobile && (
        <div style={{ padding: 1.5 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
            <small className="text-secondary">tvl</small>
            <small className="weight-600">
              ${formatNumber(rewardData && rewardData['stakedAmountUSD'] ? rewardData['stakedAmountUSD'] : 0)}
            </small>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
            <small className="text-secondary">rewards</small>
            <div style={{ textAlign: 'right' }}>
              {rewards.map((reward, ind) => (
                <div key={ind}>
                  {reward && Number(reward['rewardPerSecond']) > 0 && (
                    <p className="small weight-600">
                      {formatNumber(reward.rewardPerSecond * 3600 * 24)} {reward.rewardTokenSymbol} / day
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
            <small className="text-secondary">poolAPR</small>
            <small className="text-success weight-600">
              {formatNumber(
                Number(
                  data && data['returns'] && data['returns']['allTime'] && data['returns']['allTime']['feeApr']
                    ? data['returns']['allTime']['feeApr']
                    : 0
                ) * 100
              )}
              %
            </small>
          </div>
          <Box className="flex justify-between">
            <small className="text-secondary">farmAPR</small>
            <small className="text-success weight-600">
              {formatNumber(Number(rewardData && rewardData['apr'] ? rewardData['apr'] : 0) * 100)}%
            </small>
          </Box>
        </div>
      )}
      <div style={{ padding: 1.5 }}>
        <Grid>
          {pairData.ableToFarm && (
            <GridItem>
              <Box className="flex justify-between">
                <small className="text-secondary">available:</small>
                <small>
                  {formatNumber(Number(availableStakeAmount))} LP ($
                  {formatNumber(availableStakeUSD)})
                </small>
              </Box>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center ',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  marginTop: 2,
                }}
              >
                <Input value={stakeAmount} onUserInput={setStakeAmount} />
                <span
                  className="cursor-pointer weight-600 text-primary"
                  onClick={() => setStakeAmount(availableStakeAmount)}
                >
                  max
                </span>
              </div>
              <div style={{ marginTop: 2 }}>
                <ButtonPrimary
                  // style={{ height: 40, borderRadius: 10 }}
                  disabled={stakeButtonDisabled}
                  onClick={approveOrStakeLP}
                >
                  {approval === ApprovalState.APPROVED
                    ? approveOrStaking
                      ? 'stakingLPTokens'
                      : 'stakeLPTokens'
                    : approveOrStaking
                    ? 'approving'
                    : 'approve'}
                </ButtonPrimary>
              </div>
            </GridItem>
          )}

          <GridItem>
            <Box className="flex justify-between">
              <small className="text-secondary">deposited: </small>
              <small>
                {formatNumber(Number(stakedAmount))} LP (${formatNumber(stakedUSD)})
              </small>
            </Box>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px 16px',
                borderRadius: '10px',
                marginTop: 2,
              }}
            >
              <Input value={unStakeAmount} onUserInput={setUnStakeAmount} />
              <span className="cursor-pointer weight-600 text-primary" onClick={() => setUnStakeAmount(stakedAmount)}>
                max
              </span>
            </div>
            <div style={{ marginTop: 2 }}>
              <ButtonPrimary
                // style={{ height: 40, borderRadius: 10 }}
                disabled={unStakeButtonDisabled}
                // fullWidth
                onClick={unStakeLP}
              >
                {attemptUnstaking ? 'unstakingLPTokens' : 'unstakeLPTokens'}
              </ButtonPrimary>
            </div>
          </GridItem>

          {rewards.length > 0 && chainId && (
            <GridItem>
              <Box height="100%" className="flex flex-col justify-between">
                <small className="text-secondary">earnedRewards</small>
                <div style={{ marginBottom: 2, marginTop: 2 }}>
                  {pendingRewards.map((reward) => {
                    return (
                      <Box key={reward.token.address} className="flex items-center justify-center">
                        <CurrencyLogo currency={reward.token} size="16px" />
                        <div style={{ marginLeft: '6px' }}>
                          <small>
                            {formatNumber(reward.amount)} {reward.token.symbol}
                          </small>
                        </div>
                      </Box>
                    )
                  })}
                </div>
                <Box width="100%">
                  <ButtonPrimary
                    // style={{ height: 40, borderRadius: 10 }}
                    // fullWidth
                    disabled={claimButtonDisabled}
                    onClick={claimReward}
                  >
                    {attemptClaiming ? 'claiming' : 'claim'}
                  </ButtonPrimary>
                </Box>
              </Box>
            </GridItem>
          )}
        </Grid>
      </div>
    </Box>
  )
}

export default GammaFarmCardDetails
