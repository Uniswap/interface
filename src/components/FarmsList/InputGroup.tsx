import React, { useState } from 'react'
import { MaxUint256 } from '@ethersproject/constants'
import { ethers } from 'ethers'
import { BigNumber } from '@ethersproject/bignumber'
import styled from 'styled-components'

import { useActiveWeb3React } from 'hooks'
import { formattedNum, isAddressString } from 'utils'
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
import usePendingRewardBalance from 'hooks/usePendingRewardBalance'
import { getFullDisplayBalance } from 'utils/formatBalance'

const fixedFormatting = (value: BigNumber, decimals: number) => {
  return new Fraction(value.toString(), JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(decimals))).toSignificant(6)
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
  kncPrice
}: {
  pairAddress: string
  pid: number
  pairSymbol: string
  token0Address: string
  token1Address: string
  type?: string
  assetSymbol?: string
  assetDecimals?: number
  kncPrice?: string
}): JSX.Element {
  const { chainId } = useActiveWeb3React()
  const [pendingTx, setPendingTx] = useState(false)
  const [depositValue, setDepositValue] = useState('')
  const [withdrawValue, setWithdrawValue] = useState('')
  const pairAddressChecksum = isAddressString(pairAddress)
  const balance = useTokenBalance(pairAddressChecksum)
  const staked = useStakedBalance(pid, assetDecimals)
  const userEarning = usePendingRewardBalance(pid, assetDecimals)
  const rewardUSD =
    userEarning &&
    kncPrice &&
    (parseFloat(kncPrice) * parseFloat(getFullDisplayBalance(userEarning.value, userEarning.decimals))).toString()

  const [approvalState, approve] = useApproveCallback(
    new TokenAmount(
      new Token(chainId || 1, pairAddressChecksum, balance.decimals, pairSymbol, ''),
      MaxUint256.toString()
    ),
    !!chainId ? MASTERCHEF_ADDRESS[chainId] : undefined
  )

  const { deposit, withdraw, harvest } = useMasterChef()

  const handleClickStake = async () => {
    setPendingTx(true)
    await deposit(pid, depositValue, pairSymbol, false)
    setPendingTx(false)
  }

  const handleWithdraw = async () => {
    setPendingTx(true)
    await withdraw(pid, withdrawValue, pairSymbol)
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
                  value={depositValue ? fixedFormatting(BigNumber.from(depositValue), balance.decimals) : ''}
                  onUserInput={value => {
                    setDepositValue(ethers.utils.parseUnits(value, balance.decimals).toString())
                  }}
                  onMax={() => {
                    setDepositValue(balance.value.toString())
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

                <ButtonPrimary disabled={pendingTx} padding="12px" margin="14px 0" onClick={handleClickStake}>
                  Stake
                </ButtonPrimary>
              </>
            )}
          </AutoRow>
          <AutoRow justify="space-between">
            {chainId && (
              <>
                <CurrencyInputPanel
                  value={withdrawValue ? fixedFormatting(BigNumber.from(withdrawValue), staked.decimals) : ''}
                  onUserInput={value => {
                    setWithdrawValue(ethers.utils.parseUnits(value, staked.decimals).toString())
                  }}
                  onMax={() => {
                    setWithdrawValue(staked.value.toString())
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

                <ButtonPrimary disabled={pendingTx} padding="12px" margin="14px 0" onClick={handleWithdraw}>
                  Unstake
                </ButtonPrimary>
              </>
            )}
          </AutoRow>
          <AutoRow justify="space-between" align="flex-start" style={{ flexDirection: 'column' }}>
            <RewardBalanceWrapper>
              <div>{`${getFullDisplayBalance(userEarning.value, userEarning.decimals)} KNC`}</div>
              <RewardUSD>{rewardUSD && formattedNum(rewardUSD, true)}</RewardUSD>
            </RewardBalanceWrapper>
            <ButtonPrimary padding="12px" margin="15px 0" onClick={handleClickHarvest}>
              Harvest
            </ButtonPrimary>
          </AutoRow>
        </>
      )}
    </>
  )
}
