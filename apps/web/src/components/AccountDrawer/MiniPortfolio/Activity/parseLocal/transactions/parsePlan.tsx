import { CurrencyAmount } from '@uniswap/sdk-core'
import { UniverseChainId } from '@universe/chains'
import { getEarnPlanDisplayInfo } from 'uniswap/src/features/activity/utils/getEarnPlanDisplayInfo'
import { getEarnPlanStatusTitleKeyFromTransactionStatus } from 'uniswap/src/features/earn/planActivityTitles'
import { fetchCurrency } from 'uniswap/src/features/tokens/fetchCurrencyInfo'
import {
  CrossChainCurrencyRow,
  CrossChainCurrencyRowProps,
} from 'uniswap/src/features/transactions/swap/components/CrossChainCurrencyRow'
import type { PlanTransactionInfo } from 'uniswap/src/features/transactions/types/transactionDetails'
import { TransactionStatus, TransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'
import i18n from 'uniswap/src/i18n'
import { currencyIdToChain } from 'uniswap/src/utils/currencyId'
import { NumberType } from 'utilities/src/format/types'
import type { FormatNumberFunctionType } from '~/components/AccountDrawer/MiniPortfolio/Activity/parseLocal/types'
import type { Activity } from '~/components/AccountDrawer/MiniPortfolio/Activity/types'

export function getCrossChainDescriptor(params: CrossChainCurrencyRowProps) {
  return <CrossChainCurrencyRow {...params} />
}

export async function parsePlan({
  plan,
  formatNumber,
  chainId,
  status,
}: {
  plan: PlanTransactionInfo
  formatNumber: FormatNumberFunctionType
  chainId: UniverseChainId
  status: TransactionStatus
}): Promise<Partial<Activity>> {
  const [tokenIn, tokenOut] = await Promise.all([
    fetchCurrency(plan.inputCurrencyId),
    fetchCurrency(plan.outputCurrencyId),
  ])
  const earnDisplayInfo = getEarnPlanDisplayInfo(plan)
  const earnToken = earnDisplayInfo ? await fetchCurrency(earnDisplayInfo.currencyId) : undefined

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

  if (plan.earnAction && earnDisplayInfo) {
    const primaryAmount = earnToken
      ? formatNumber({
          value: parseFloat(CurrencyAmount.fromRawAmount(earnToken, earnDisplayInfo.amountRaw).toSignificant()),
          type: NumberType.TokenNonTx,
        })
      : i18n.t('common.unknown')
    const primaryChainId = currencyIdToChain(earnDisplayInfo.currencyId)
    const unknownAmountLabel = i18n.t('common.unknown')
    const primarySymbol = earnToken?.symbol && primaryAmount !== unknownAmountLabel ? ` ${earnToken.symbol}` : ''
    const amountWithSymbol = `${primaryAmount}${primarySymbol}`
    const isWithdraw = earnDisplayInfo.transactionType === TransactionType.Withdraw

    return {
      title: i18n.t(
        getEarnPlanStatusTitleKeyFromTransactionStatus({
          earnAction: plan.earnAction,
          transactionStatus: status,
        }),
      ),
      descriptor: isWithdraw
        ? i18n.t('activity.transaction.earn.withdraw.descriptor', {
            amountWithSymbol,
          })
        : i18n.t('activity.transaction.earn.deposit.descriptor', {
            amountWithSymbol,
          }),
      chainId: primaryChainId ?? chainId,
      outputChainId: plan.tokenOutChainId,
      currencies: [earnToken],
    }
  }

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
