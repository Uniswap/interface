import { MaxUint256 } from '@ethersproject/constants'
import React, { useState, useContext } from 'react'
import { useHistory } from 'react-router-dom'
import { useActiveWeb3React } from 'hooks'
import { formattedNum, isAddressString } from 'utils'
import useTokenBalance from 'hooks/useTokenBalance'
import { Currency, Fraction, JSBI, Token, TokenAmount } from 'libs/sdk/src'
import { ApprovalState, useApproveCallback } from 'hooks/useApproveCallback'
import { MASTERCHEF_ADDRESS, ROUTER_ADDRESS } from 'constants/index'
import { Dots } from '../swap/styleds'
import { ButtonPrimary } from 'components/Button'
import { BigNumber, BigNumberish } from '@ethersproject/bignumber'
import { BigintIsh } from 'libs/sdk/src/constants'
import NumericalInput from 'components/NumericalInput'
import CurrencyInputPanel from 'components/CurrencyInputPanel'
import { AutoColumn } from 'components/Column'
import useMasterChef from 'hooks/useMasterchef'
import { useFarmClaimModalToggle, useFarmStakeModalToggle } from 'state/application/hooks'
import useStakedBalance from 'hooks/useStakedBalance'
import styled, { ThemeContext } from 'styled-components'
import { AutoRow, RowFixed } from 'components/Row'
import usePendingRewardBalance from 'hooks/usePendingRewardBalance'
import { TYPE } from 'theme'

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
  const history = useHistory()
  const theme = useContext(ThemeContext)
  const { account, chainId } = useActiveWeb3React()
  const [pendingTx, setPendingTx] = useState(false)
  const [depositValue, setDepositValue] = useState('')
  const [withdrawValue, setWithdrawValue] = useState('')
  const pairAddressChecksum = isAddressString(pairAddress)
  const balance = useTokenBalance(pairAddressChecksum)

  const staked = useStakedBalance(pid, assetDecimals) // kMP depends on decimals of asset, SLP is always 18
  // const pending = usePendingSushi(pid)
  const pendingReward = usePendingRewardBalance(pid, assetDecimals)
  const [approvalState, approve] = useApproveCallback(
    new TokenAmount(
      new Token(chainId || 1, pairAddressChecksum, balance.decimals, pairSymbol, ''),
      MaxUint256.toString()
    ),
    !!chainId ? MASTERCHEF_ADDRESS[chainId] : undefined
  )

  const { deposit, withdraw, harvest } = useMasterChef()

  const toggleFarmClaimModal = useFarmClaimModalToggle()
  const toggleFarmStakeModal = useFarmStakeModalToggle()

  const handleClickHarvest = async () => {
    // toggleFarmClaimModal()

    console.log('===harvest', pid)
    setPendingTx(true)
    await harvest(pid, pairSymbol)
    setPendingTx(false)
  }

  const handleClickStake = async () => {
    setPendingTx(true)
    await deposit(pid, depositValue, pairSymbol, false)
    setPendingTx(false)
    // toggleFarmStakeModal()
  }

  const handleWithdraw = async () => {
    console.log('===withdraw', pid, withdrawValue, pairSymbol)
    setPendingTx(true)
    await withdraw(pid, withdrawValue, pairSymbol)
    setPendingTx(false)
  }

  // public constructor(chainId: ChainId, address: string, decimals: number, symbol?: string, name?: string) {

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
                  currency={new Token(chainId, pairAddress, balance.decimals, 'LP', 'LP')}
                  id="add-liquidity-input-token"
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
                  value={withdrawValue}
                  onUserInput={value => {
                    setWithdrawValue(value)
                  }}
                  onMax={() => {
                    setWithdrawValue(fixedFormatting(staked.value, staked.decimals))
                  }}
                  showMaxButton={true}
                  currency={new Token(chainId, pairAddress, balance.decimals, 'LP', 'LP')}
                  id="remove-liquidity-input-token"
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
