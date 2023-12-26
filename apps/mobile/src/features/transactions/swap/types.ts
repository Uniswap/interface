import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { CurrencyInfo } from 'src/features/dataApi/types'
import { BaseDerivedInfo } from 'src/features/transactions/transactionState/types'
import { ChainId } from 'wallet/src/constants/chains'
import { useTrade } from 'wallet/src/features/transactions/swap/useTrade'
import { CurrencyField } from 'wallet/src/features/transactions/transactionState/types'
import { WrapType } from 'wallet/src/features/transactions/types'

export type DerivedSwapInfo<
  TInput = CurrencyInfo,
  TOutput extends CurrencyInfo = CurrencyInfo
> = BaseDerivedInfo<TInput> & {
  chainId: ChainId
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
  trade: ReturnType<typeof useTrade>
  wrapType: WrapType
  selectingCurrencyField?: CurrencyField
  txId?: string
  autoSlippageTolerance?: number
  customSlippageTolerance?: number
}
