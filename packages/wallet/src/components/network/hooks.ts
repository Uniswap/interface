import { useMemo } from 'react'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { WalletChainId } from 'uniswap/src/types/chains'
import { NumberType } from 'utilities/src/format/types'
import { useUSDValue } from 'wallet/src/features/gas/hooks'
import { UniswapXGasBreakdown } from 'wallet/src/features/transactions/swap/trade/api/hooks/useSwapTxAndGasInfo'

export type FormattedUniswapXGasFeeInfo = {
  approvalFeeFormatted?: string
  wrapFeeFormatted?: string
  swapFeeFormatted: string
  preSavingsGasFeeFormatted: string
  inputTokenSymbol?: string
}

export function useFormattedUniswapXGasFeeInfo(
  uniswapXGasBreakdown: UniswapXGasBreakdown | undefined,
  chainId: WalletChainId,
): FormattedUniswapXGasFeeInfo | undefined {
  const { convertFiatAmountFormatted } = useLocalizationContext()

  const approvalCostUsd = useUSDValue(chainId, uniswapXGasBreakdown?.approvalCost)
  const wrapCostUsd = useUSDValue(chainId, uniswapXGasBreakdown?.wrapCost)

  return useMemo(() => {
    if (!uniswapXGasBreakdown) {
      return undefined
    }
    const { approvalCost, wrapCost, inputTokenSymbol } = uniswapXGasBreakdown
    // Without uniswapx, the swap would have costed approval price + classic swap fee. A separate wrap tx would not have occurred.
    const preSavingsGasCostUsd =
      Number(approvalCostUsd ?? 0) + Number(uniswapXGasBreakdown?.classicGasUseEstimateUSD ?? 0)
    const preSavingsGasFeeFormatted = convertFiatAmountFormatted(preSavingsGasCostUsd, NumberType.FiatGasPrice)

    // Swap submission will always cost 0, since it's not an on-chain tx.
    const swapFeeFormatted = convertFiatAmountFormatted(0, NumberType.FiatGasPrice)

    return {
      approvalFeeFormatted: approvalCost
        ? convertFiatAmountFormatted(approvalCostUsd, NumberType.FiatGasPrice)
        : undefined,
      wrapFeeFormatted: wrapCost ? convertFiatAmountFormatted(wrapCostUsd, NumberType.FiatGasPrice) : undefined,
      preSavingsGasFeeFormatted,
      swapFeeFormatted,
      inputTokenSymbol,
    }
  }, [uniswapXGasBreakdown, approvalCostUsd, convertFiatAmountFormatted, wrapCostUsd])
}
