import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { useRemoveLiquidityModalContext } from 'components/RemoveLiquidity/RemoveLiquidityModalContext'
import { useRemoveLiquidityTxAndGasInfo } from 'components/RemoveLiquidity/hooks'
import { useCurrencyInfoWithUnwrapForTradingApi } from 'pages/Pool/Positions/create/utils'
import { PropsWithChildren, createContext, useContext, useEffect, useMemo } from 'react'
import { useAccountMeta } from 'uniswap/src/contexts/UniswapContext'
import { CheckApprovalLPResponse, DecreaseLPPositionResponse } from 'uniswap/src/data/tradingApi/__generated__'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import {
  LiquidityTransactionType,
  ValidatedDecreasePositionTxAndGasInfo,
} from 'uniswap/src/features/transactions/liquidity/types'
import { validateTransactionRequest } from 'uniswap/src/features/transactions/swap/utils/trade'
import { logContextUpdate } from 'utilities/src/logger/contextEnhancer'

export type RemoveLiquidityTxInfo = {
  gasFeeEstimateUSD?: CurrencyAmount<Currency>
  v2LpTokenApproval?: CheckApprovalLPResponse
  decreaseCalldata?: DecreaseLPPositionResponse
  decreaseCalldataLoading: boolean
  approvalLoading: boolean
  txContext?: ValidatedDecreasePositionTxAndGasInfo
  error?: boolean
  refetch?: () => void
}

const RemoveLiquidityTxContext = createContext<RemoveLiquidityTxInfo | undefined>(undefined)

export function RemoveLiquidityTxContextProvider({ children }: PropsWithChildren): JSX.Element {
  const account = useAccountMeta()
  const { positionInfo, percent, unwrapNativeCurrency } = useRemoveLiquidityModalContext()

  const removeLiquidityTxInfo = useRemoveLiquidityTxAndGasInfo({ account: account?.address })
  const { approvalLoading, decreaseCalldataLoading, decreaseCalldata, error, refetch } = removeLiquidityTxInfo
  const datadogEnabled = useFeatureFlag(FeatureFlags.Datadog)

  useEffect(() => {
    logContextUpdate('RemoveLiquidityTxContext', removeLiquidityTxInfo, datadogEnabled)
  }, [removeLiquidityTxInfo, datadogEnabled])

  const currency0Info = useCurrencyInfoWithUnwrapForTradingApi({
    currency: positionInfo?.currency0Amount.currency,
    shouldUnwrap: unwrapNativeCurrency,
  })
  const currency1Info = useCurrencyInfoWithUnwrapForTradingApi({
    currency: positionInfo?.currency1Amount.currency,
    shouldUnwrap: unwrapNativeCurrency,
  })
  const token0 = currency0Info?.currency
  const token1 = currency1Info?.currency

  const decreaseLiquidityTxContext = useMemo((): ValidatedDecreasePositionTxAndGasInfo | undefined => {
    if (!positionInfo || approvalLoading || decreaseCalldataLoading || !decreaseCalldata || !token0 || !token1) {
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
    const token0Amount = CurrencyAmount.fromRawAmount(token0, currency0Amount.quotient)
    const token1Amount = CurrencyAmount.fromRawAmount(token1, currency1Amount.quotient)
    const currency0AmountToRemove = token0Amount.multiply(percent).divide(100)
    const currency1AmountToRemove = token1Amount.multiply(percent).divide(100)

    return {
      type: LiquidityTransactionType.Decrease,
      protocolVersion: positionInfo.version,
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
      revocationTxRequest: undefined,
      permit: undefined,
    }
  }, [
    positionInfo,
    approvalLoading,
    decreaseCalldataLoading,
    decreaseCalldata,
    token0,
    token1,
    removeLiquidityTxInfo.v2LpTokenApproval?.positionTokenApproval,
    percent,
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
