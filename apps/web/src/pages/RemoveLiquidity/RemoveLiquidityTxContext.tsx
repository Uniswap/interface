import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { useRemoveLiquidityTxAndGasInfo } from 'pages/RemoveLiquidity/hooks'
import { PropsWithChildren, createContext, useContext, useEffect } from 'react'
import { useAccountMeta } from 'uniswap/src/contexts/UniswapContext'
import { CheckApprovalLPResponse, DecreaseLPPositionResponse } from 'uniswap/src/data/tradingApi/__generated__'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { logContextUpdate } from 'utilities/src/logger/contextEnhancer'

export type RemoveLiquidityTxInfo = {
  v2ApprovalGasFeeUSD?: CurrencyAmount<Currency>
  decreaseGasFeeUsd?: CurrencyAmount<Currency>
  v2LpTokenApproval?: CheckApprovalLPResponse
  reduceCalldata?: DecreaseLPPositionResponse
}

const RemoveLiquidityTxContext = createContext<RemoveLiquidityTxInfo | undefined>(undefined)

export function RemoveLiquidityTxContextProvider({ children }: PropsWithChildren): JSX.Element {
  const account = useAccountMeta()

  const removeLiquidityTxInfo = useRemoveLiquidityTxAndGasInfo({ account: account?.address })
  const datadogEnabled = useFeatureFlag(FeatureFlags.Datadog)

  useEffect(() => {
    logContextUpdate('RemoveLiquidityTxContext', removeLiquidityTxInfo, datadogEnabled)
  }, [removeLiquidityTxInfo, datadogEnabled])

  return <RemoveLiquidityTxContext.Provider value={removeLiquidityTxInfo}>{children}</RemoveLiquidityTxContext.Provider>
}

export const useRemoveLiquidityTxContext = (): RemoveLiquidityTxInfo => {
  const removeContext = useContext(RemoveLiquidityTxContext)

  if (removeContext === undefined) {
    throw new Error('`useRemoveLiquidityTxContext` must be used inside of `RemoveLiquidityTxContextProvider`')
  }

  return removeContext
}
