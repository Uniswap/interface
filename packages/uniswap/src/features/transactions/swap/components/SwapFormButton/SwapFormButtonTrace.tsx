import { useMemo } from 'react'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { Trace } from 'uniswap/src/features/telemetry/Trace'
import {
  useSwapFormStore,
  useSwapFormStoreDerivedSwapInfo,
} from 'uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore'

const useTraceProperties = (): {
  chainId: number
  tokenAmount: string | undefined
  fiatAmount: string | undefined
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
    }),
    [chainId, exactAmountToken, exactAmountFiat],
  )
}

export const SwapFormButtonTrace = ({ children }: { children: React.ReactNode }): JSX.Element => {
  const traceProperties = useTraceProperties()

  return (
    <Trace logPress properties={traceProperties} element={ElementName.SwapReview}>
      {children}
    </Trace>
  )
}
