import { MaxUint256 } from '@ethersproject/constants'
import React, { useState } from 'react'
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
  const { account, chainId } = useActiveWeb3React()
  const [pendingTx, setPendingTx] = useState(false)
  const [depositValue, setDepositValue] = useState('')
  const [withdrawValue, setWithdrawValue] = useState('')
  const pairAddressChecksum = isAddressString(pairAddress)
  const balance = useTokenBalance(pairAddressChecksum)

  const staked = useStakedBalance(pid, assetDecimals) // kMP depends on decimals of asset, SLP is always 18
  // const pending = usePendingSushi(pid)

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
          <div grid-area="stake">
            {/* <NumericalInput
              className="token-amount-input"
              style={{ width: '100px' }}
              value={depositValue}
              onUserInput={value => {
                setDepositValue(value)
              }}
            /> */}
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
                  currency={new Token(chainId, pairAddress, balance.decimals, pairSymbol, pairSymbol)}
                  id="add-liquidity-input-token"
                  disableCurrencySelect
                  hideBalance={true}
                />

                <ButtonPrimary disabled={pendingTx} padding="12px" margin="14px 0" onClick={handleClickStake}>
                  Stake
                </ButtonPrimary>
              </>
            )}
          </div>
          <div grid-area="unstake">
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
                  currency={new Token(chainId, pairAddress, balance.decimals, pairSymbol, pairSymbol)}
                  id="remove-liquidity-input-token"
                  disableCurrencySelect
                  hideBalance={true}
                />

                <ButtonPrimary disabled={pendingTx} padding="12px" margin="14px 0" onClick={handleWithdraw}>
                  Unstake
                </ButtonPrimary>
              </>
            )}
          </div>
          <div grid-area="harvest">
            <ButtonPrimary padding="12px" onClick={handleClickHarvest}>
              Claim
            </ButtonPrimary>
          </div>
        </>
        // <div className="">
        //   {/* Deposit */}
        //   <div className="text-center">
        //     {account && (
        //       <div className="text-sm text-secondary cursor-pointer text-right mb-2 pr-4">
        //         Wallet Balance: {formattedNum(fixedFormatting(balance.value, balance.decimals))} {type}
        //       </div>
        //     )}
        //     <AutoColumn gap="20px">
        //       <div className="flex items-center relative w-full mb-4">
        //         <NumericalInput
        //           className="token-amount-input"
        //           style={{ width: '100px' }}
        //           value={depositValue}
        //           onUserInput={value => {
        //             setDepositValue(value)
        //           }}
        //         />
        //         {account && (
        //           <ButtonPrimary
        //             variant="outlined"
        //             color="blue"
        //             onClick={() => {
        //               setDepositValue(fixedFormatting(balance.value, balance.decimals))
        //             }}
        //             className="absolute right-4 focus:ring focus:ring-blue border-0"
        //           >
        //             MAX
        //           </ButtonPrimary>
        //         )}
        //       </div>
        //       <ButtonPrimary
        //         color="blue"
        //         disabled={
        //           pendingTx ||
        //           !balance ||
        //           Number(depositValue) === 0 ||
        //           Number(depositValue) > Number(fixedFormatting(balance.value, balance.decimals))
        //         }
        //         onClick={async () => {
        //           setPendingTx(true)
        //           await deposit(pid, depositValue, pairSymbol, balance.decimals)
        //           setPendingTx(false)
        //         }}
        //       >
        //         Deposit
        //       </ButtonPrimary>
        //     </AutoColumn>
        //   </div>
        // </div>
      )}
    </>
  )
}
