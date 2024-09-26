import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { BaseDerivedInfo } from 'uniswap/src/features/transactions/types/baseDerivedInfo'
import { WrapType } from 'uniswap/src/features/transactions/types/wrap'
import { TradeWithStatus } from 'uniswap/src/features/transactions/swap/types/trade'
import { WalletChainId } from 'uniswap/src/types/chains'
import { CurrencyField } from 'uniswap/src/types/currency'

export type DerivedSwapInfo<
  TInput = CurrencyInfo,
  TOutput extends CurrencyInfo = CurrencyInfo,
> = BaseDerivedInfo<TInput> & {
  chainId: WalletChainId
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
  currencyBalances: BaseDerivedInfo<TInput>['currencyBalances'] & {
    [CurrencyField.OUTPUT]: Maybe<CurrencyAmount<Currency>>
  }
  focusOnCurrencyField: CurrencyField | null
  trade: TradeWithStatus
  wrapType: WrapType
  selectingCurrencyField?: CurrencyField
  txId?: string
  autoSlippageTolerance?: number
  customSlippageTolerance?: number
  customDeadline?: number
}
