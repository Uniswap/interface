import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { CurrencyField } from 'uniswap/src/features/transactions/transactionState/types'
import { WalletChainId } from 'uniswap/src/types/chains'
import { useTrade } from 'wallet/src/features/transactions/swap/trade/api/hooks/useTrade'
import { BaseDerivedInfo } from 'wallet/src/features/transactions/transfer/types'
import { WrapType } from 'wallet/src/features/transactions/types'

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
  trade: ReturnType<typeof useTrade>
  wrapType: WrapType
  selectingCurrencyField?: CurrencyField
  txId?: string
  autoSlippageTolerance?: number
  customSlippageTolerance?: number
}
