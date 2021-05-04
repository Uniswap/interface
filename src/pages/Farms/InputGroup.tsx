import { MaxUint256 } from '@ethersproject/constants'
import React, { useState } from 'react'
import { useHistory } from 'react-router-dom'
import { useActiveWeb3React } from 'hooks'
import { formattedNum, isAddressString } from 'utils'
import useTokenBalance from 'hooks/useTokenBalance'
import { Fraction, JSBI, Token, TokenAmount } from 'libs/sdk/src'
import { ApprovalState, useApproveCallback } from 'hooks/useApproveCallback'
import { ROUTER_ADDRESS } from 'constants/index'
import { Dots } from '../Pool/styleds'
import { ButtonPrimary } from 'components/Button'
import { BigNumber, BigNumberish } from '@ethersproject/bignumber'
import { BigintIsh } from 'libs/sdk/src/constants'
import NumericalInput from 'components/NumericalInput'
import CurrencyInputPanel from 'components/CurrencyInputPanel'
import { AutoColumn } from 'components/Column'
import useMasterChef from 'hooks/useMasterchef'

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
  pid: string
  pairSymbol: string
  token0Address: string
  token1Address: string
  type?: string
  assetSymbol?: string
  assetDecimals?: number
}): JSX.Element {
  const history = useHistory()
  const { account, chainId } = useActiveWeb3React()
  const [pendingTx, setPendingTx] = useState(false)
  const [depositValue, setDepositValue] = useState('')
  const [withdrawValue, setWithdrawValue] = useState('')
  const pairAddressChecksum = isAddressString(pairAddress)
  const balance = useTokenBalance(pairAddressChecksum)
  console.log('==balance', pairAddressChecksum, balance.value)
  // const staked = useStakedBalance(pid, assetDecimals) // kMP depends on decimals of asset, SLP is always 18
  // const pending = usePendingSushi(pid)
  const [approvalState, approve] = useApproveCallback(
    new TokenAmount(
      new Token(chainId || 1, pairAddressChecksum, balance.decimals, pairSymbol, ''),
      MaxUint256.toString()
    ),
    ROUTER_ADDRESS
  )
  const { deposit, withdraw, harvest } = useMasterChef()
  console.log('approvalState', approvalState)
  return (
    <>
      {(approvalState === ApprovalState.NOT_APPROVED || approvalState === ApprovalState.PENDING) && (
        <div className="px-4">
          <ButtonPrimary color="blue" disabled={approvalState === ApprovalState.PENDING} onClick={approve}>
            {approvalState === ApprovalState.PENDING ? <Dots>Approving </Dots> : 'Approve'}
          </ButtonPrimary>
        </div>
      )}
      {approvalState === ApprovalState.APPROVED && (
        <div className="">
          {/* Deposit */}
          <div className="text-center">
            {account && (
              <div className="text-sm text-secondary cursor-pointer text-right mb-2 pr-4">
                Wallet Balance: {formattedNum(fixedFormatting(balance.value, balance.decimals))} {type}
              </div>
            )}
            <AutoColumn gap="20px">
              {/* <CurrencyInputPanel
                value={depositValue}
                onUserInput={value => {
                  setDepositValue(value)
                }}
                onMax={() => {
                  setDepositValue(fixedFormatting(balance.value, balance.decimals))
                }}
                onCurrencySelect={() => {}}
                disableCurrencySelect={true}
                showMaxButton={true}
                currency={undefined}
                id="add-liquidity-input-tokena"
              /> */}
              <div className="flex items-center relative w-full mb-4">
                <NumericalInput
                  className="token-amount-input"
                  style={{ width: '100px' }}
                  value={depositValue}
                  onUserInput={value => {
                    setDepositValue(value)
                  }}
                />
                {account && (
                  <ButtonPrimary
                    variant="outlined"
                    color="blue"
                    onClick={() => {
                      setDepositValue(fixedFormatting(balance.value, balance.decimals))
                    }}
                    className="absolute right-4 focus:ring focus:ring-blue border-0"
                  >
                    MAX
                  </ButtonPrimary>
                )}
              </div>
              <ButtonPrimary
                color="blue"
                disabled={
                  pendingTx ||
                  !balance ||
                  Number(depositValue) === 0 ||
                  Number(depositValue) > Number(fixedFormatting(balance.value, balance.decimals))
                }
                onClick={async () => {
                  setPendingTx(true)
                  await deposit(pid, depositValue, pairSymbol, balance.decimals)
                  setPendingTx(false)
                }}
              >
                Deposit
              </ButtonPrimary>
            </AutoColumn>
          </div>
        </div>
      )}
    </>
  )
}
