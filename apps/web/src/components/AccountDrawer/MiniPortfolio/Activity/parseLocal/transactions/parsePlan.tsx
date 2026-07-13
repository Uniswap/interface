import { CurrencyAmount } from '@uniswap/sdk-core'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import {
  CrossChainCurrencyRow,
  CrossChainCurrencyRowProps,
} from 'uniswap/src/features/transactions/swap/components/CrossChainCurrencyRow'
import type { PlanTransactionInfo } from 'uniswap/src/features/transactions/types/transactionDetails'
import i18n from 'uniswap/src/i18n'
import { currencyIdToChain } from 'uniswap/src/utils/currencyId'
import { NumberType } from 'utilities/src/format/types'
import { getCurrencyFromCurrencyId } from '~/components/AccountDrawer/MiniPortfolio/Activity/getCurrency'
import type { FormatNumberFunctionType } from '~/components/AccountDrawer/MiniPortfolio/Activity/parseLocal/types'
import type { Activity } from '~/components/AccountDrawer/MiniPortfolio/Activity/types'

export function getCrossChainDescriptor(params: CrossChainCurrencyRowProps) {
  return <CrossChainCurrencyRow {...params} />
}

export async function parsePlan({
  plan,
  formatNumber,
  chainId,
}: {
  plan: PlanTransactionInfo
  formatNumber: FormatNumberFunctionType
  chainId: UniverseChainId
}): Promise<Partial<Activity>> {
  const [tokenIn, tokenOut] = await Promise.all([
    getCurrencyFromCurrencyId(plan.inputCurrencyId),
    getCurrencyFromCurrencyId(plan.outputCurrencyId),
  ])

  const inputAmount = tokenIn
    ? formatNumber({
        value: parseFloat(CurrencyAmount.fromRawAmount(tokenIn, plan.inputCurrencyAmountRaw).toSignificant()),
        type: NumberType.TokenNonTx,
      })
    : i18n.t('common.unknown')

  const outputAmount = tokenOut
    ? formatNumber({
        value: parseFloat(CurrencyAmount.fromRawAmount(tokenOut, plan.outputCurrencyAmountRaw).toSignificant()),
        type: NumberType.TokenNonTx,
      })
    : i18n.t('common.unknown')

  return {
    descriptor: getCrossChainDescriptor({
      inputChainId: tokenIn?.chainId ?? null,
      inputSymbol: tokenIn?.symbol ?? '',
      outputChainId: tokenOut?.chainId ?? null,
      outputSymbol: tokenOut?.symbol ?? '',
      formattedInputTokenAmount: inputAmount,
      formattedOutputTokenAmount: outputAmount,
    }),
    chainId: currencyIdToChain(plan.inputCurrencyId) ?? chainId,
    outputChainId: plan.tokenOutChainId,
    currencies: [tokenIn, tokenOut],
  }
}
