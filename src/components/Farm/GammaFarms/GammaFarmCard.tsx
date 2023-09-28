import { Trans } from '@lingui/macro'
import { Token } from '@pollum-io/sdk-core'
import { formatNumber } from '@uniswap/conedison/format'
import { CallState } from '@uniswap/redux-multicall'
import { TokenList } from '@uniswap/token-lists'
import { useWeb3React } from '@web3-react/core'
import { ButtonEmpty } from 'components/Button'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import ModalAddGammaLiquidity from 'components/ModalAddGammaLiquidity'
import { RowBetween } from 'components/Row'
import TotalAPRTooltip from 'components/TotalAPRTooltip/TotalAPRTooltip'
import { formatUnits } from 'ethers/lib/utils'
import { useToken } from 'hooks/Tokens'
import { ApprovalState, useApproveCallback } from 'hooks/useApproveCallback'
import {
  useGammaHypervisorContract,
  useGammaUniProxyContract,
  useMasterChefContract,
  useTokenContract,
} from 'hooks/useContract'
import { useSingleCallResult } from 'lib/hooks/multicall'
import tryParseCurrencyAmount from 'lib/utils/tryParseCurrencyAmount'
import { useIsMobile } from 'nft/hooks'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertCircle, ChevronDown, ChevronUp } from 'react-feather'
import { Box } from 'rebass'
import { WrappedTokenInfo } from 'state/lists/wrappedTokenInfo'
import { useTransactionAdder } from 'state/transactions/hooks'
import styled, { useTheme } from 'styled-components/macro'
import { CloseIcon, ThemedText } from 'theme'
import { useTransactionFinalizer } from 'utils/farmUtils'

import { GridItemAddLiquidity } from '../AddGammaLiquidity/GridItemAddLiquidity'
import { FarmPoolData, ONE_TOKEN, ZERO } from '../constants'
import { getDepositAmounts, useApr, usePoolInfo, useTotalAllocationPoints, withdrawHypervisor } from '../utils'
import GammaFarmCardDetails from './GammafarmCardDetails'

const CardContainer = styled.div<{ showDetails: boolean }>`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
  border-radius: 16px;
  background: ${({ theme }) => theme.backgroundSurface};
  border: 1px solid ${({ showDetails, theme }) => (showDetails ? theme.userThemeColor : 'none')};
`
const Grid = styled.div<{ isMobile: boolean; hasRewards: boolean }>`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-columns: ${(props) => (props.isMobile ? 'none' : 'repeat(3, 1fr)')};
  grid-template-rows: ${(props) =>
    props.isMobile ? (props.hasRewards ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)') : 'none'};
  gap: 16px;
`

const Wrapper = styled(RowBetween)`
  display: flex;
  flex-direction: column;
  padding: 20px 16px 16px;
`
const HeaderRow = styled(RowBetween)`
  display: flex;
`

interface GammaFarmProps {
  data?: FarmPoolData
  rewardData: {
    tvl: number
    rewardPerSecond: CallState
    rewardTokenAddress: CallState
  }
  token0:
    | Token
    | {
        token: WrappedTokenInfo
        list?: TokenList
      }
  token1:
    | Token
    | {
        token: WrappedTokenInfo
        list?: TokenList
      }
  pairData: any
}

export function GammaFarmCard({ data, rewardData, pairData, token0, token1 }: GammaFarmProps) {
  const [showDetails, setShowDetails] = useState(false)
  const theme = useTheme()
  const isMobile = useIsMobile()
  const { chainId, account } = useWeb3React()
  const rewardPerSecond = rewardData?.rewardPerSecond
  const rewardTokenAddress = rewardData?.rewardTokenAddress
  const totalAllocPoints = useTotalAllocationPoints()
  const poolInfo = usePoolInfo(pairData?.pid)
  const [farmAPR, setFarmAPR] = useState<number>(0)
  const [stakeAmount, setStakeAmount] = useState('')
  const [deposit0, setDeposit0] = useState('')
  const [deposit1, setDeposit1] = useState('')
  const [unStakeGamma, setUnStakeGamma] = useState('')
  const finalizedTransaction = useTransactionFinalizer()
  const addTransaction = useTransactionAdder()

  const hypervisorContract = useGammaHypervisorContract(pairData.hypervisor)
  const uniProxyContract = useGammaUniProxyContract()
  const masterChefContract = useMasterChefContract()

  const token0Address = useSingleCallResult(hypervisorContract, 'token0').result?.[0]
  const token1Address = useSingleCallResult(hypervisorContract, 'token1').result?.[0]

  const token0BalanceRequest = useSingleCallResult(useTokenContract(token0Address, true), 'balanceOf', [
    account ?? undefined,
  ])
  const token1BalanceRequest = useSingleCallResult(useTokenContract(token1Address, true), 'balanceOf', [
    account ?? undefined,
  ])
  const stakedData = useSingleCallResult(masterChefContract, 'userInfo', [pairData.pid, account ?? undefined])

  const token0BalanceBN =
    !token0BalanceRequest.loading && token0BalanceRequest.result && token0BalanceRequest.result.length > 0
      ? token0BalanceRequest.result[0]
      : undefined
  const token0Balance = token0BalanceBN ? formatUnits(token0BalanceBN, 18) : '0'

  const token1BalanceBN =
    !token1BalanceRequest.loading && token1BalanceRequest.result && token1BalanceRequest.result.length > 0
      ? token1BalanceRequest.result[0]
      : undefined
  const token1Balance = token1BalanceBN ? formatUnits(token1BalanceBN, 18) : '0'

  const stakedAmountBN =
    !stakedData.loading && stakedData.result && stakedData.result.length > 0 ? stakedData.result[0] : undefined
  const stakedAmount = stakedAmountBN ? formatUnits(stakedAmountBN, 18) : '0'

  const lpToken = chainId ? new Token(chainId, pairData.hypervisor, 18) : undefined
  const lpTokenUSD =
    data && data.totalSupply && Number(data.totalSupply) > 0
      ? (Number(data.tvlUSD) / Number(data.totalSupply)) * 10 ** 18
      : 0
  const stakedUSD = Number(stakedAmount) * lpTokenUSD

  const tokenStake0 = useToken(token0Address)
  const tokenStake1 = useToken(token1Address)

  const lpBalanceData = useSingleCallResult(hypervisorContract, 'balanceOf', [account ?? undefined])
  const lpBalanceBN =
    !lpBalanceData.loading && lpBalanceData.result && lpBalanceData.result.length > 0
      ? lpBalanceData.result[0]
      : undefined
  const availableStakeAmount = lpBalanceBN ? formatUnits(lpBalanceBN, 18) : '0'

  const availableStakeUSD = Number(availableStakeAmount) * lpTokenUSD
  const lpTokenBalance = tryParseCurrencyAmount(availableStakeAmount, lpToken)

  const parsedStakeAmount = tryParseCurrencyAmount(stakeAmount, lpToken)
  const parsedDeposit0 = deposit0 && tokenStake0 ? tryParseCurrencyAmount(deposit0, tokenStake0) : undefined
  const parsedDeposit1 = deposit1 && tokenStake1 ? tryParseCurrencyAmount(deposit1, tokenStake1) : undefined

  const [approval, approveCallback] = useApproveCallback(parsedStakeAmount, masterChefContract?.address)
  const [approvalToken0, approveCallbackToken0] = useApproveCallback(parsedDeposit0, uniProxyContract?.address)
  const [approvalToken1, approveCallbackToken1] = useApproveCallback(parsedDeposit1, uniProxyContract?.address)

  const rewardPerSecondResult = useMemo(() => {
    if (!rewardPerSecond.loading && rewardPerSecond?.result) {
      return rewardPerSecond.result[0]
    }
    return ZERO
  }, [rewardPerSecond.loading, rewardPerSecond?.result])

  const poolInfoResultAllocPoint = useMemo(() => {
    if (!poolInfo.loading && poolInfo?.result) {
      return poolInfo.result.allocPoint
    }
    return ZERO
  }, [poolInfo.loading, poolInfo?.result])

  const totalAllocPointValue = totalAllocPoints?.result?.[0] || ONE_TOKEN
  const poolRewardPerSecInPSYS = rewardPerSecondResult.mul(poolInfoResultAllocPoint).div(totalAllocPointValue)

  const apr = useApr(pairData?.pid, poolRewardPerSecInPSYS, rewardData?.tvl)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const resolvedApr = await apr
        if (resolvedApr) setFarmAPR(resolvedApr)
      } catch (error) {
        console.error('Error fetching APR:', error)
      }
    }

    fetchData()
  }, [pairData, rewardPerSecond, rewardData, apr])

  const poolAPR =
    data && data.returns && data.returns.allTime && data.returns.allTime.feeApr
      ? Number(data.returns.allTime.feeApr)
      : 0
  const token = useToken(rewardTokenAddress?.result?.toString())

  const rewardsAmount = poolRewardPerSecInPSYS ? formatUnits(poolRewardPerSecInPSYS, 18) : '0'

  const getToken = (
    token:
      | Token
      | {
          token: WrappedTokenInfo
          list?: TokenList
        }
  ): Token | WrappedTokenInfo | null => {
    if (!token) return null
    return 'address' in token ? token : token.token
  }

  const tokenZero = getToken(token0)
  const tokenOne = getToken(token1)

  const [modalOpen, setModalOpen] = useState(false)

  const handleDismiss = useCallback(() => {
    setModalOpen(false)
  }, [setModalOpen])

  const dataDetails = {
    stakeAmount,
    stakedAmount,
    lpTokenBalance,
    lpBalanceBN,
    approval,
    approveCallback,
    parsedStakeAmount,
    availableStakeAmount,
    stakedAmountBN,
    masterChefContract,
    stakedUSD,
    availableStakeUSD,
    setStakeAmount,
  }

  return (
    <>
      <ModalAddGammaLiquidity isOpen={modalOpen} onDismiss={handleDismiss}>
        <Wrapper>
          <HeaderRow>
            <ThemedText.SubHeader>
              <Trans>Add Gamma Liquidity</Trans>
            </ThemedText.SubHeader>
            <CloseIcon onClick={handleDismiss} />
          </HeaderRow>
          <div
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'space-evenly',
              alignItems: 'center',
              marginRight: isMobile ? 'none' : '15px',
              marginLeft: isMobile ? '15px' : 'none',
            }}
          >
            <Grid isMobile={isMobile} hasRewards={Number(rewardsAmount) > 0}>
              <GridItemAddLiquidity
                titleText="Deposit: "
                availableStakeAmount={token0Balance}
                textButton={
                  approvalToken0 === ApprovalState.PENDING
                    ? `Aproving Token ${tokenStake0?.symbol}`
                    : `Approve Token ${tokenStake0?.symbol}`
                }
                tokenSymbol={tokenStake0?.symbol || ''}
                depositValue={deposit0}
                disabledButton={approvalToken0 === ApprovalState.APPROVED}
                setDepositAmount={(amount: string) => {
                  setDeposit0(amount)
                  if (uniProxyContract)
                    getDepositAmounts(
                      0,
                      uniProxyContract,
                      setDeposit1,
                      setDeposit0,
                      pairData,
                      token0Address,
                      token1Address,
                      deposit0,
                      deposit1
                    )
                }}
                approveOrStakeLPOrWithdraw={approveCallbackToken0}
              />

              <GridItemAddLiquidity
                titleText="Deposit: "
                availableStakeAmount={token1Balance}
                textButton={
                  approvalToken0 === ApprovalState.PENDING
                    ? `Aproving Token ${tokenStake1?.symbol}`
                    : `Approve Token ${tokenStake1?.symbol}`
                }
                tokenSymbol={tokenStake1?.symbol || ''}
                depositValue={deposit1}
                disabledButton={approvalToken1 === ApprovalState.APPROVED}
                setDepositAmount={(amount: string) => {
                  setDeposit1(amount)
                  if (uniProxyContract)
                    getDepositAmounts(
                      1,
                      uniProxyContract,
                      setDeposit1,
                      setDeposit0,
                      pairData,
                      token0Address,
                      token1Address,
                      deposit0,
                      deposit1
                    )
                }}
                approveOrStakeLPOrWithdraw={approveCallbackToken1}
              />

              <GridItemAddLiquidity
                titleText="Unstake Gamma: "
                availableStakeAmount="0"
                textButton="Withdraw Gamma Liquidity"
                tokenSymbol="LP"
                depositValue={unStakeGamma}
                disabledButton={false}
                setDepositAmount={(amount: string) => {
                  setUnStakeGamma(amount)
                }}
                approveOrStakeLPOrWithdraw={() =>
                  withdrawHypervisor(
                    hypervisorContract,
                    account,
                    unStakeGamma,
                    pairData,
                    finalizedTransaction,
                    addTransaction
                  )
                }
              />
            </Grid>
          </div>
        </Wrapper>
      </ModalAddGammaLiquidity>
      <CardContainer showDetails={showDetails}>
        <div style={{ width: '100%', display: 'flex', justifyContent: 'center', height: '60px', alignItems: 'center' }}>
          <div
            style={{
              width: '90%',
              display: 'flex',
              justifyContent: 'space-evenly',
              alignItems: 'center',
              marginRight: isMobile ? 'none' : '15px',
              marginLeft: isMobile ? '15px' : 'none',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              {token0 && token1 && tokenZero && tokenOne && (
                <>
                  <DoubleCurrencyLogo currency0={tokenZero} currency1={tokenOne} size={30} />
                  <div style={{ marginLeft: '6px' }}>
                    <small className="weight-600">{`${tokenZero.symbol}/${tokenOne.symbol} (${pairData.title})`}</small>
                    <Box className="cursor-pointer">
                      <ButtonEmpty width="fit-content" padding="0" onClick={() => setModalOpen(true)}>
                        <small style={{ color: theme.accentActive }}>Add Gamma Liquidity</small>
                      </ButtonEmpty>
                    </Box>
                  </div>
                </>
              )}
            </div>
            {!isMobile && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  {rewardData?.tvl && <small style={{ fontWeight: 600 }}>${formatNumber(rewardData.tvl)}</small>}
                </div>
                <small style={{ fontWeight: 600 }}>
                  {rewardsAmount &&
                    Number(rewardsAmount) > 0 &&
                    token &&
                    `${formatNumber(Number(rewardsAmount) * 3600 * 24)} ${token.symbol} / day`}
                </small>
              </>
            )}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <small style={{ color: theme.accentSuccess, fontWeight: 600 }}>
                {formatNumber((poolAPR + farmAPR) * 100)}%
              </small>
              <div style={{ marginLeft: '5px', alignItems: 'center' }}>
                <TotalAPRTooltip farmAPR={farmAPR * 100} poolAPR={poolAPR * 100}>
                  <AlertCircle size={16} />
                </TotalAPRTooltip>
              </div>
            </div>
          </div>

          <div style={{ width: '10%', display: 'flex', justifyContent: 'center' }}>
            <Box
              className="flex items-center justify-center cursor-pointer text-primary"
              width={20}
              height={20}
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? <ChevronUp color={theme.accentActive} /> : <ChevronDown color={theme.accentActive} />}
            </Box>
          </div>
        </div>
        {showDetails && data && (
          <GammaFarmCardDetails data={data} pairData={pairData} rewardData={rewardData} dataDetails={dataDetails} />
        )}
      </CardContainer>
    </>
  )
}
