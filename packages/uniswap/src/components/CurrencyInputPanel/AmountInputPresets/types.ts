import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { ButtonProps } from 'ui/src/components/buttons/Button/types'
import { TransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'

export type PresetPercentage = 25 | 50 | 75 | 100

export interface AmountInputPresetsProps {
  hoverLtr?: boolean
  currencyAmount: CurrencyAmount<Currency> | null | undefined
  currencyBalance: CurrencyAmount<Currency>
  transactionType?: TransactionType
  buttonProps?: ButtonProps
  onSetPresetValue: (amount: string, percentage: PresetPercentage) => void
}
