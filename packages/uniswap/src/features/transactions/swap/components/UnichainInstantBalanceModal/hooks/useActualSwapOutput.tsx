import { BigNumber } from '@ethersproject/bignumber'
import inRange from 'lodash/inRange'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { ValueType, getCurrencyAmount } from 'uniswap/src/features/tokens/getCurrencyAmount'
import { useAcceptedTrade } from 'uniswap/src/features/transactions/swap/review/hooks/useAcceptedTrade'
import { useSwapDependenciesStore } from 'uniswap/src/features/transactions/swap/stores/swapDependenciesStore/useSwapDependenciesStore'
import { useSwapFormStore } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore'
import {
  TOKEN_AMOUNT_DISPLAY_FLOOR,
  TOKEN_AMOUNT_DISPLAY_FLOOR_FALLBACK,
} from 'utilities/src/format/localeBasedFormats'
import { NumberType } from 'utilities/src/format/types'

export function useActualSwapOutput(): {
  outputCurrencyInfo?: CurrencyInfo
  lastSwapOutputBalance: string | undefined
} {
  const { formatCurrencyAmount } = useLocalizationContext()

  const isSubmitting = useSwapFormStore((s) => s.isSubmitting)
  const { derivedSwapInfo } = useSwapDependenciesStore((s) => ({
    derivedSwapInfo: s.derivedSwapInfo,
  }))
  const { acceptedDerivedSwapInfo } = useAcceptedTrade({
    derivedSwapInfo,
    isSubmitting,
  })

  const outputCurrencyInfo = acceptedDerivedSwapInfo?.currencies.output ?? undefined

  const swapOutputAmountFinal = useSwapFormStore((s) => {
    const { preSwapDataPreserved, postSwapDataPreserved } = s

    if (!preSwapDataPreserved || !postSwapDataPreserved) {
      return undefined
    }

    if (preSwapDataPreserved.currencyId !== postSwapDataPreserved.currencyId) {
      return undefined
    }

    const slippage = acceptedDerivedSwapInfo?.trade.trade?.slippageTolerance
    const actualSwapOutput = formatCurrencyAmount({
      value: getCurrencyAmount({
        value: BigNumber.from(postSwapDataPreserved.outputBalanceRaw)
          .sub(BigNumber.from(preSwapDataPreserved.outputBalanceRaw))
          .toString(),
        valueType: ValueType.Raw,
        currency: outputCurrencyInfo?.currency,
      }),
      type: NumberType.TokenTx,
    })

    const estimatedOutputAmount = +preSwapDataPreserved.preSwapOutputAmountEstimateExact
    const isBelowTokenDisplayFloor =
      Number.isNaN(estimatedOutputAmount) &&
      preSwapDataPreserved.preSwapOutputAmountEstimateExact === TOKEN_AMOUNT_DISPLAY_FLOOR_FALLBACK

    if (slippage && estimatedOutputAmount) {
      const lowBound = +estimatedOutputAmount * (1 - +slippage.toFixed() / 100)
      const highBound = +estimatedOutputAmount * (1 + +slippage.toFixed() / 100)

      if (
        !inRange(
          isBelowTokenDisplayFloor ? TOKEN_AMOUNT_DISPLAY_FLOOR : estimatedOutputAmount,
          lowBound - Number.EPSILON,
          highBound + (isBelowTokenDisplayFloor ? TOKEN_AMOUNT_DISPLAY_FLOOR : Number.EPSILON),
        )
      ) {
        return undefined
      }
    }

    return actualSwapOutput
  })

  return {
    outputCurrencyInfo,
    lastSwapOutputBalance: swapOutputAmountFinal,
  }
}
