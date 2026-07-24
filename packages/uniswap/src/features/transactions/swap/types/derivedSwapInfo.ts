import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { TradeWithStatus } from 'uniswap/src/features/transactions/swap/types/trade'
import { SwapUsdPricing } from 'uniswap/src/features/transactions/swap/utils/usdAnchoring/anchoredUsdPricing'
import { BaseDerivedInfo } from 'uniswap/src/features/transactions/types/baseDerivedInfo'
import { WrapType } from 'uniswap/src/features/transactions/types/wrap'
import { CurrencyField } from 'uniswap/src/types/currency'

export type DerivedSwapInfo<
  TInput = CurrencyInfo,
  TOutput extends CurrencyInfo = CurrencyInfo,
> = BaseDerivedInfo<TInput> & {
  chainId: UniverseChainId
  currencies: BaseDerivedInfo<TInput>['currencies'] & {
    [CurrencyField.OUTPUT]: Maybe<TOutput>
  }
  currencyAmounts: BaseDerivedInfo<TInput>['currencyAmounts'] & {
    [CurrencyField.OUTPUT]: Maybe<CurrencyAmount<Currency>>
  }
  currencyAmountsUSDValue: {
    [CurrencyField.INPUT]: Maybe<CurrencyAmount<Currency>>
    [CurrencyField.OUTPUT]: Maybe<CurrencyAmount<Currency>>
  }
  /** How `currencyAmountsUSDValue` was computed (single-anchor trade-derived vs independent oracles), for analytics. */
  usdPricing?: SwapUsdPricing
  currencyBalances: BaseDerivedInfo<TInput>['currencyBalances'] & {
    [CurrencyField.OUTPUT]: Maybe<CurrencyAmount<Currency>>
  }
  outputAmountUserWillReceive: Maybe<CurrencyAmount<Currency>>
  focusOnCurrencyField: CurrencyField | null
  trade: TradeWithStatus
  wrapType: WrapType
  txId?: string
}
