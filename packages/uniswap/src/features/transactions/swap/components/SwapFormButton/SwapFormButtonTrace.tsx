import { useMemo } from 'react'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { Trace } from 'uniswap/src/features/telemetry/Trace'
import {
  useSwapFormStore,
  useSwapFormStoreDerivedSwapInfo,
} from 'uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore'
import { SwapFormButtonAction } from 'uniswap/src/features/transactions/swap/types/swapFormButtonAction'

const useTraceProperties = (
  action: SwapFormButtonAction,
): {
  chainId: number
  tokenAmount: string | undefined
  fiatAmount: string | undefined
  action: SwapFormButtonAction
} => {
  const { exactAmountToken, exactAmountFiat } = useSwapFormStore((s) => ({
    exactAmountToken: s.exactAmountToken,
    exactAmountFiat: s.exactAmountFiat,
  }))
  const chainId = useSwapFormStoreDerivedSwapInfo((s) => s.chainId)

  return useMemo(
    () => ({
      chainId,
      tokenAmount: exactAmountToken,
      fiatAmount: exactAmountFiat,
      action,
    }),
    [chainId, exactAmountToken, exactAmountFiat, action],
  )
}

export const SwapFormButtonTrace = ({
  children,
  action,
}: {
  children: React.ReactNode
  action: SwapFormButtonAction
}): JSX.Element => {
  const traceProperties = useTraceProperties(action)

  return (
    <Trace logPress properties={traceProperties} element={ElementName.SwapReview}>
      {children}
    </Trace>
  )
}
