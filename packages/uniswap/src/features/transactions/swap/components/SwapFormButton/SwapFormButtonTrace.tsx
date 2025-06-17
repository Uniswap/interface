import { useMemo } from 'react'
import { Trace } from 'uniswap/src/features/telemetry/Trace'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { useSwapFormContext } from 'uniswap/src/features/transactions/swap/contexts/SwapFormContext'

const useTraceProperties = (): {
  chainId: number
  tokenAmount: string | undefined
  fiatAmount: string | undefined
} => {
  const {
    exactAmountToken,
    exactAmountFiat,
    derivedSwapInfo: { chainId },
  } = useSwapFormContext()

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
