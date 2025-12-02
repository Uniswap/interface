import type { Currency } from '@uniswap/sdk-core'
import { CurrencyAmount } from '@uniswap/sdk-core'
import { TradingApi } from '@universe/api'
import { useRemoveLiquidityTxAndGasInfo } from 'pages/RemoveLiquidity/hooks/useRemoveLiquidityTxAndGasInfo'
import { useRemoveLiquidityModalContext } from 'pages/RemoveLiquidity/RemoveLiquidityModalContext'
import type { PropsWithChildren } from 'react'
import { createContext, useContext, useEffect, useMemo } from 'react'
import type { ValidatedDecreasePositionTxAndGasInfo } from 'uniswap/src/features/transactions/liquidity/types'
import { LiquidityTransactionType } from 'uniswap/src/features/transactions/liquidity/types'
import { validateTransactionRequest } from 'uniswap/src/features/transactions/swap/utils/trade'
import { useWallet } from 'uniswap/src/features/wallet/hooks/useWallet'
import { logContextUpdate } from 'utilities/src/logger/contextEnhancer'

export type RemoveLiquidityTxInfo = {
  gasFeeEstimateUSD?: CurrencyAmount<Currency>
  v2LpTokenApproval?: TradingApi.CheckApprovalLPResponse
  decreaseCalldata?: TradingApi.DecreaseLPPositionResponse
  decreaseCalldataLoading: boolean
  approvalLoading: boolean
  txContext?: ValidatedDecreasePositionTxAndGasInfo
  error: boolean | string
  refetch?: () => void
}

const RemoveLiquidityTxContext = createContext<RemoveLiquidityTxInfo | undefined>(undefined)

export function RemoveLiquidityTxContextProvider({ children }: PropsWithChildren): JSX.Element {
  const account = useWallet().evmAccount
  const { positionInfo, percent, currencies } = useRemoveLiquidityModalContext()

  const removeLiquidityTxInfo = useRemoveLiquidityTxAndGasInfo({ account: account?.address })
  const { approvalLoading, decreaseCalldataLoading, decreaseCalldata, error, refetch } = removeLiquidityTxInfo
  const { sqrtRatioX96 } = decreaseCalldata || {}

  useEffect(() => {
    logContextUpdate('RemoveLiquidityTxContext', removeLiquidityTxInfo)
  }, [removeLiquidityTxInfo])

  const currency0 = currencies?.TOKEN0
  const currency1 = currencies?.TOKEN1

  const decreaseLiquidityTxContext = useMemo((): ValidatedDecreasePositionTxAndGasInfo | undefined => {
    if (!positionInfo || approvalLoading || decreaseCalldataLoading || !decreaseCalldata || !currency0 || !currency1) {
      return undefined
    }
    const approvePositionTokenRequest = validateTransactionRequest(
      removeLiquidityTxInfo.v2LpTokenApproval?.positionTokenApproval,
    )
    const txRequest = validateTransactionRequest(decreaseCalldata.decrease)
    if (!txRequest) {
      return undefined
    }

    const { currency0Amount, currency1Amount } = positionInfo
    const token0Amount = CurrencyAmount.fromRawAmount(currency0, currency0Amount.quotient)
    const token1Amount = CurrencyAmount.fromRawAmount(currency1, currency1Amount.quotient)
    const currency0AmountToRemove = token0Amount.multiply(percent).divide(100)
    const currency1AmountToRemove = token1Amount.multiply(percent).divide(100)

    return {
      type: LiquidityTransactionType.Decrease,
      canBatchTransactions: false, // when batching is supported check canBatchTransactions
      action: {
        type: LiquidityTransactionType.Decrease,
        currency0Amount: currency0AmountToRemove,
        currency1Amount: currency1AmountToRemove,
        liquidityToken: positionInfo.liquidityToken,
      },
      approvePositionTokenRequest,
      txRequest,
      approveToken0Request: undefined,
      approveToken1Request: undefined,
      revokeToken0Request: undefined,
      revokeToken1Request: undefined,
      token0PermitTransaction: undefined,
      token1PermitTransaction: undefined,
      positionTokenPermitTransaction: undefined,
      permit: undefined,
      sqrtRatioX96,
    }
  }, [
    positionInfo,
    approvalLoading,
    decreaseCalldataLoading,
    decreaseCalldata,
    currency0,
    currency1,
    removeLiquidityTxInfo.v2LpTokenApproval?.positionTokenApproval,
    percent,
    sqrtRatioX96,
  ])

  return (
    <RemoveLiquidityTxContext.Provider
      value={{ ...removeLiquidityTxInfo, txContext: decreaseLiquidityTxContext, error, refetch }}
    >
      {children}
    </RemoveLiquidityTxContext.Provider>
  )
}

export const useRemoveLiquidityTxContext = (): RemoveLiquidityTxInfo => {
  const removeContext = useContext(RemoveLiquidityTxContext)

  if (removeContext === undefined) {
    throw new Error('`useRemoveLiquidityTxContext` must be used inside of `RemoveLiquidityTxContextProvider`')
  }

  return removeContext
}
