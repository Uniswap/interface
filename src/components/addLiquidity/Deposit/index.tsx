import { Trans } from '@lingui/macro'
import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { AutoColumn } from 'components/Column'
import CurrencyInputPanel from 'components/CurrencyInputPanel'
import { Field } from 'state/burn/actions'
import { ThemedText } from 'theme'

export function Deposit({
  hasExistingPosition,
  currencies,
  currencyAFiat,
  currencyBFiat,
  maxAmounts,
  atMaxAmounts,
  formattedAmounts,
  depositADisabled,
  depositBDisabled,
  onFieldAInput,
  onFieldBInput,
}: {
  hasExistingPosition: boolean
  currencies: { [field in Field]?: Currency }
  currencyAFiat: {
    data?: number
    isLoading: boolean
  }
  currencyBFiat: {
    data?: number
    isLoading: boolean
  }
  maxAmounts: { [field in Field]?: CurrencyAmount<Currency> }
  atMaxAmounts: { [field in Field]?: CurrencyAmount<Currency> }
  formattedAmounts: { [x: string]: string }
  tickLower?: number
  tickUpper?: number
  invalidPool: boolean
  invalidRange: boolean
  depositADisabled: boolean
  depositBDisabled: boolean
  onFieldAInput: (typedValue: string) => void
  onFieldBInput: (typedValue: string) => void
}) {
  return (
    <AutoColumn gap="md">
      <ThemedText.DeprecatedLabel>
        {hasExistingPosition ? <Trans>Add more liquidity</Trans> : <Trans>Deposit Amounts</Trans>}
      </ThemedText.DeprecatedLabel>

      <CurrencyInputPanel
        value={formattedAmounts[Field.CURRENCY_A]}
        onUserInput={onFieldAInput}
        onMax={() => {
          onFieldAInput(maxAmounts[Field.CURRENCY_A]?.toExact() ?? '')
        }}
        showMaxButton={!atMaxAmounts[Field.CURRENCY_A]}
        currency={currencies[Field.CURRENCY_A] ?? null}
        id="add-liquidity-input-tokena"
        fiatValue={currencyAFiat}
        showCommonBases
        locked={depositADisabled}
      />

      <CurrencyInputPanel
        value={formattedAmounts[Field.CURRENCY_B]}
        onUserInput={onFieldBInput}
        onMax={() => {
          onFieldBInput(maxAmounts[Field.CURRENCY_B]?.toExact() ?? '')
        }}
        showMaxButton={!atMaxAmounts[Field.CURRENCY_B]}
        fiatValue={currencyBFiat}
        currency={currencies[Field.CURRENCY_B] ?? null}
        id="add-liquidity-input-tokenb"
        showCommonBases
        locked={depositBDisabled}
      />
    </AutoColumn>
  )
}
