import React, { useState } from 'react'
import { MaxUint256 } from '@ethersproject/constants'
import { ethers } from 'ethers'
import { BigNumber } from '@ethersproject/bignumber'

import { useActiveWeb3React } from 'hooks'
import { isAddressString } from 'utils'
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

const fixedFormatting = (value: BigNumber, decimals: number) => {
  return new Fraction(value.toString(), JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(decimals))).toSignificant(6)
}

export default function InputGroup({
  pairAddress,
  pid,
  pairSymbol,
  token0Address,
  token1Address,
  type,
  assetSymbol,
  assetDecimals = 18
}: {
  pairAddress: string
  pid: number
  pairSymbol: string
  token0Address: string
  token1Address: string
  type?: string
  assetSymbol?: string
  assetDecimals?: number
}): JSX.Element {
  const { chainId } = useActiveWeb3React()
  const [pendingTx, setPendingTx] = useState(false)
  const [depositValue, setDepositValue] = useState('')
  const [withdrawValue, setWithdrawValue] = useState('')
  const pairAddressChecksum = isAddressString(pairAddress)
  const balance = useTokenBalance(pairAddressChecksum)
  const staked = useStakedBalance(pid, assetDecimals)

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
                  currency={new Token(chainId, pairAddress, balance.decimals, 'LP', 'LP')}
                  id="stake-lp-input"
                  disableCurrencySelect
                  balancePosition="left"
                  hideBalance={true}
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
                  currency={new Token(chainId, pairAddress, balance.decimals, 'LP', 'LP')}
                  id="unstake-lp-input"
                  disableCurrencySelect
                  customBalanceText={`Deposited LP: ${fixedFormatting(staked.value, staked.decimals)}`}
                  balancePosition="left"
                  hideBalance={true}
                />

                <ButtonPrimary disabled={pendingTx} padding="12px" margin="14px 0" onClick={handleWithdraw}>
                  Unstake
                </ButtonPrimary>
              </>
            )}
          </AutoRow>
          <AutoRow justify="flex-end" style={{ flexDirection: 'column' }}>
            {/* <div style={{ width: '100%' }}>
              <TYPE.body color={theme.text2} fontWeight={500} fontSize={14}>
                KNC Reward
              </TYPE.body>
              <br></br>
              <TYPE.body color={theme.text2} fontWeight={500} fontSize={18}>
                {fixedFormatting(pendingReward.value, pendingReward.decimals)} KNC &nbsp;
              </TYPE.body>
              <br></br>
            </div> */}
            <ButtonPrimary padding="12px" margin="15px 0" onClick={handleClickHarvest}>
              Harvest
            </ButtonPrimary>
          </AutoRow>
        </>
      )}
    </>
  )
}
