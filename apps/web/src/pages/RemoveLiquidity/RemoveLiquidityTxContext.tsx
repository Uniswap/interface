import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { useLiquidityModalContext } from 'pages/RemoveLiquidity/RemoveLiquidityModalContext'
import { useRemoveLiquidityTxAndGasInfo } from 'pages/RemoveLiquidity/hooks'
import { PropsWithChildren, createContext, useContext, useEffect, useMemo } from 'react'
import { useAccountMeta } from 'uniswap/src/contexts/UniswapContext'
import { CheckApprovalLPResponse, DecreaseLPPositionResponse } from 'uniswap/src/data/tradingApi/__generated__'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { ValidatedDecreasePositionTxAndGasInfo } from 'uniswap/src/features/transactions/liquidity/types'
import { validateTransactionRequest } from 'uniswap/src/features/transactions/swap/utils/trade'
import { logContextUpdate } from 'utilities/src/logger/contextEnhancer'

export type RemoveLiquidityTxInfo = {
  gasFeeEstimateUSD?: CurrencyAmount<Currency>
  v2LpTokenApproval?: CheckApprovalLPResponse
  decreaseCalldata?: DecreaseLPPositionResponse
  decreaseCalldataLoading: boolean
  approvalLoading: boolean
  txContext?: ValidatedDecreasePositionTxAndGasInfo
}

const RemoveLiquidityTxContext = createContext<RemoveLiquidityTxInfo | undefined>(undefined)

export function RemoveLiquidityTxContextProvider({ children }: PropsWithChildren): JSX.Element {
  const account = useAccountMeta()
  const { positionInfo } = useLiquidityModalContext()

  const removeLiquidityTxInfo = useRemoveLiquidityTxAndGasInfo({ account: account?.address })
  const { approvalLoading, decreaseCalldataLoading, decreaseCalldata } = removeLiquidityTxInfo
  const datadogEnabled = useFeatureFlag(FeatureFlags.Datadog)

  useEffect(() => {
    logContextUpdate('RemoveLiquidityTxContext', removeLiquidityTxInfo, datadogEnabled)
  }, [removeLiquidityTxInfo, datadogEnabled])

  const decreaseLiquidityTxContext: ValidatedDecreasePositionTxAndGasInfo | undefined = useMemo(() => {
    if (!positionInfo || approvalLoading || decreaseCalldataLoading || !decreaseCalldata) {
      return undefined
    }
    const approvePositionTokenRequest = validateTransactionRequest(
      removeLiquidityTxInfo.v2LpTokenApproval?.positionTokenApproval,
    )
    const txRequest = validateTransactionRequest(decreaseCalldata.decrease)
    if (!txRequest) {
      return undefined
    }
    return {
      type: 'decrease',
      approvalError: false,
      protocolVersion: positionInfo.version,
      action: positionInfo,
      approvePositionTokenRequest,
      txRequest,
      approveToken0Request: undefined,
      approveToken1Request: undefined,
      revocationTxRequest: undefined,
      permit: undefined,
    }
  }, [approvalLoading, positionInfo, decreaseCalldataLoading, decreaseCalldata, removeLiquidityTxInfo])

  return (
    <RemoveLiquidityTxContext.Provider value={{ ...removeLiquidityTxInfo, txContext: decreaseLiquidityTxContext }}>
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
