import type { ReactNode } from 'react'
import { SplitLogo } from 'uniswap/src/components/CurrencyLogo/SplitLogo'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { getSymbolDisplayText } from 'uniswap/src/utils/currency'
import { CompactLayout } from '~/pages/Portfolio/Activity/ActivityTable/ActivityAmountCell/CompactLayout'
import { DualTokenLayout } from '~/pages/Portfolio/Activity/ActivityTable/ActivityAmountCell/DualTokenLayout'
import { ActivityTokenAmount } from '~/pages/Portfolio/Activity/ActivityTable/ActivityAmountCell/useActivityTokenAmount'
import {
  COMPACT_THUMBNAIL_SIZE,
  createTokenLogo,
} from '~/pages/Portfolio/Activity/ActivityTable/ActivityAmountCell/utils'
import { ActivityCellVariant } from '~/pages/Portfolio/Activity/ActivityTable/activityTableModels'

function createSplitLogo({
  chainId,
  inputCurrencyInfo,
  outputCurrencyInfo,
}: {
  chainId: number
  inputCurrencyInfo: CurrencyInfo | null | undefined
  outputCurrencyInfo: CurrencyInfo | null | undefined
}): ReactNode {
  if (!inputCurrencyInfo || !outputCurrencyInfo) {
    return null
  }

  return (
    <SplitLogo
      chainId={chainId}
      inputCurrencyInfo={inputCurrencyInfo}
      outputCurrencyInfo={outputCurrencyInfo}
      size={COMPACT_THUMBNAIL_SIZE}
    />
  )
}

function formatCompactAmountText({
  inputAmount,
  inputSymbol,
  outputAmount,
  outputSymbol,
  separator = '→',
}: {
  inputAmount: string | undefined
  inputSymbol: string | undefined
  outputAmount?: string | undefined
  outputSymbol?: string | undefined
  separator?: string
}): string | null {
  const left = inputAmount && inputSymbol ? `${inputAmount} ${getSymbolDisplayText(inputSymbol)}` : null
  const right = outputAmount && outputSymbol ? `${outputAmount} ${getSymbolDisplayText(outputSymbol)}` : null
  if (!left && !right) {
    return null
  }
  if (left && right) {
    return `${left} ${separator} ${right}`
  }
  return left ?? right
}

interface TokenAmountsCellProps {
  variant: ActivityCellVariant
  typeLabel: string
  chainId: number
  input: ActivityTokenAmount
  output?: ActivityTokenAmount
  compactSeparator?: string
  fullSeparator?: ReactNode
}

export function TokenAmountsCell({
  variant,
  typeLabel,
  chainId,
  input,
  output,
  compactSeparator,
  fullSeparator,
}: TokenAmountsCellProps): JSX.Element {
  if (variant === 'compact') {
    const logo = output
      ? createSplitLogo({
          chainId,
          inputCurrencyInfo: input.currencyInfo,
          outputCurrencyInfo: output.currencyInfo,
        })
      : createTokenLogo(input.currencyInfo)

    const amountText = output
      ? formatCompactAmountText({
          inputAmount: input.amountText,
          inputSymbol: input.currencyInfo?.currency.symbol,
          outputAmount: output.amountText,
          outputSymbol: output.currencyInfo?.currency.symbol,
          separator: compactSeparator,
        })
      : formatCompactAmountText({
          inputAmount: input.amountText,
          inputSymbol: input.currencyInfo?.currency.symbol,
        })

    return <CompactLayout typeLabel={typeLabel} logo={logo} amountText={amountText} />
  }

  return (
    <DualTokenLayout
      inputCurrency={input.currencyInfo}
      outputCurrency={output?.currencyInfo ?? null}
      inputFormattedAmount={input.formattedAmount}
      outputFormattedAmount={output?.formattedAmount ?? null}
      inputUsdValue={input.usdValue}
      outputUsdValue={output?.usdValue ?? null}
      separator={output ? fullSeparator : null}
    />
  )
}
