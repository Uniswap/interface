import React, { useState } from 'react'
import { MaxUint256 } from '@ethersproject/constants'
import { ethers } from 'ethers'
import { BigNumber } from '@ethersproject/bignumber'
import styled from 'styled-components'

import { ZERO } from 'libs/sdk/src/constants'
import { useActiveWeb3React } from 'hooks'
import { formattedNum, getTokenSymbol, isAddressString } from 'utils'
import useTokenBalance from 'hooks/useTokenBalance'
import { Fraction, JSBI, Token, TokenAmount } from 'libs/sdk/src'
import { ApprovalState, useApproveCallback } from 'hooks/useApproveCallback'
import { MASTERCHEF_ADDRESS } from 'constants/index'
import { Dots } from '../swap/styleds'
import { ButtonPrimary } from 'components/Button'
import CurrencyInputPanel from 'components/CurrencyInputPanel'
import useMasterChef from 'hooks/useMasterchef'
import useStakedBalance from 'hooks/useStakedBalance'
import { AutoRow } from 'components/Row'
import { getFullDisplayBalance } from 'utils/formatBalance'
import { Reward } from 'state/farms/types'
import { useFarmRewardsUSD } from 'utils/dmm'

const fixedFormatting = (value: BigNumber, decimals: number) => {
  const fraction = new Fraction(value.toString(), JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(decimals)))

  if (fraction.equalTo(ZERO)) {
    return '0'
  }

  return fraction.toFixed(18)
}

const RewardBalanceWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
`

const RewardUSD = styled.div`
  color: ${({ theme }) => theme.primaryText2};
`

export default function InputGroup({
  pairAddress,
  pid,
  pairSymbol,
  token0Address,
  token1Address,
  type,
  assetSymbol,
  assetDecimals = 18,
  farmRewards
}: {
  pairAddress: string
  pid: number
  pairSymbol: string
  token0Address: string
  token1Address: string
  type?: string
  assetSymbol?: string
  assetDecimals?: number
  farmRewards: Reward[]
}): JSX.Element {
  const { chainId } = useActiveWeb3React()
  const [pendingTx, setPendingTx] = useState(false)
  const [depositValue, setDepositValue] = useState('')
  const [withdrawValue, setWithdrawValue] = useState('')
  const pairAddressChecksum = isAddressString(pairAddress)
  const balance = useTokenBalance(pairAddressChecksum)
  const staked = useStakedBalance(pid, assetDecimals)
  const rewardUSD = useFarmRewardsUSD(farmRewards)

  const [approvalState, approve] = useApproveCallback(
    new TokenAmount(
      new Token(chainId || 1, pairAddressChecksum, balance.decimals, pairSymbol, ''),
      MaxUint256.toString()
    ),
    !!chainId ? MASTERCHEF_ADDRESS[chainId] : undefined
  )

  let isStakeInvalidAmount

  try {
    isStakeInvalidAmount =
      depositValue === '' ||
      parseFloat(depositValue) === 0 ||
      ethers.utils.parseUnits(depositValue || '0', balance.decimals).gt(balance.value) // This causes error if number of decimals > 18
  } catch (err) {
    isStakeInvalidAmount = true
  }

  const isStakeDisabled = pendingTx || isStakeInvalidAmount

  let isUnstakeInvalidAmount

  try {
    isUnstakeInvalidAmount =
      withdrawValue === '' ||
      parseFloat(withdrawValue) === 0 ||
      ethers.utils.parseUnits(withdrawValue || '0', staked.decimals).gt(staked.value) // This causes error if number of decimals > 18
  } catch (err) {
    isUnstakeInvalidAmount = true
  }

  const isUnstakeDisabled = pendingTx || isUnstakeInvalidAmount

  const canHarvest = (rewards: Reward[]): boolean => {
    const canHarvest = rewards.some(reward => reward?.amount.gt(BigNumber.from('0')))

    return canHarvest
  }

  const isHarvestDisabled = pendingTx || !canHarvest(farmRewards)

  const { deposit, withdraw, harvest } = useMasterChef()

  const handleClickStake = async () => {
    setPendingTx(true)
    await deposit(pid, ethers.utils.parseUnits(depositValue, balance.decimals), pairSymbol, false)
    setPendingTx(false)
  }

  const handleWithdraw = async () => {
    setPendingTx(true)
    await withdraw(pid, ethers.utils.parseUnits(withdrawValue, staked.decimals), pairSymbol)
    setPendingTx(false)
  }

  const handleClickHarvest = async () => {
    setPendingTx(true)
    await harvest(pid, pairSymbol)
    setPendingTx(false)
  }

  return (
    <>
      {approvalState === ApprovalState.UNKNOWN && <Dots></Dots>}
      {(approvalState === ApprovalState.NOT_APPROVED || approvalState === ApprovalState.PENDING) && (
        <div className="px-4">
          <ButtonPrimary color="blue" disabled={approvalState === ApprovalState.PENDING} onClick={approve}>
            {approvalState === ApprovalState.PENDING ? <Dots>Approving </Dots> : 'Approve'}
          </ButtonPrimary>
        </div>
      )}
      {approvalState === ApprovalState.APPROVED && (
        <>
          <AutoRow justify="space-between">
            {chainId && (
              <>
                <CurrencyInputPanel
                  value={depositValue}
                  onUserInput={value => {
                    setDepositValue(value)
                  }}
                  onMax={() => {
                    setDepositValue(fixedFormatting(balance.value, balance.decimals))
                  }}
                  showMaxButton={true}
                  currency={new Token(chainId, pairAddress, balance.decimals, `${pairSymbol}`, `${pairSymbol}`)}
                  id="stake-lp-input"
                  disableCurrencySelect
                  balancePosition="left"
                  hideBalance={true}
                  hideLogo={true}
                  fontSize="14px"
                />

                <ButtonPrimary disabled={isStakeDisabled} padding="12px" margin="14px 0" onClick={handleClickStake}>
                  {depositValue && isStakeInvalidAmount ? 'Invalid Amount' : 'Stake'}
                </ButtonPrimary>
              </>
            )}
          </AutoRow>
          <AutoRow justify="space-between">
            {chainId && (
              <>
                <CurrencyInputPanel
                  value={withdrawValue}
                  onUserInput={value => {
                    setWithdrawValue(value)
                  }}
                  onMax={() => {
                    setWithdrawValue(fixedFormatting(staked.value, staked.decimals))
                  }}
                  showMaxButton={true}
                  currency={new Token(chainId, pairAddress, balance.decimals, `${pairSymbol}`, `${pairSymbol}`)}
                  id="unstake-lp-input"
                  disableCurrencySelect
                  customBalanceText={`Deposited LP: ${fixedFormatting(staked.value, staked.decimals)}`}
                  balancePosition="left"
                  hideBalance={true}
                  hideLogo={true}
                  fontSize="14px"
                />

                <ButtonPrimary disabled={isUnstakeDisabled} padding="12px" margin="14px 0" onClick={handleWithdraw}>
                  {withdrawValue && isUnstakeInvalidAmount ? 'Invalid Amount' : 'Unstake'}
                </ButtonPrimary>
              </>
            )}
          </AutoRow>
          <AutoRow justify="space-between" align="flex-start" style={{ flexDirection: 'column' }}>
            <RewardBalanceWrapper>
              <div>
                {farmRewards?.map((reward, index) => {
                  return (
                    <span key={reward.token.address}>
                      <span>{`${getFullDisplayBalance(reward?.amount)} ${getTokenSymbol(reward.token, chainId)}`}</span>
                      {index + 1 < farmRewards.length ? <span style={{ margin: '0 4px' }}>+</span> : null}
                    </span>
                  )
                })}
              </div>
              <RewardUSD>{rewardUSD && formattedNum(rewardUSD.toString(), true)}</RewardUSD>
            </RewardBalanceWrapper>
            <ButtonPrimary disabled={isHarvestDisabled} padding="12px" margin="15px 0" onClick={handleClickHarvest}>
              Harvest
            </ButtonPrimary>
          </AutoRow>
        </>
      )}
    </>
  )
}
