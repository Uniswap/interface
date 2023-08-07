import { Trans } from '@lingui/macro'
import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { AutoColumn } from 'components/Column'
import { RowBetween } from 'components/Row'
import { Field } from 'state/burn/actions'
import { ThemedText } from 'theme'

import { CurrencyDropdown } from '../styled'

export function SelectPair({
  currencies,
  maxAmounts,
  atMaxAmounts,
  formattedAmounts,
  onFieldAInput,
  onFieldBInput,
  handleCurrencyASelect,
  handleCurrencyBSelect,
}: {
  currencies: { [field in Field]?: Currency }
  maxAmounts: { [field in Field]?: CurrencyAmount<Currency> }
  atMaxAmounts: { [field in Field]?: CurrencyAmount<Currency> }
  formattedAmounts: { [x: string]: string }
  onFieldAInput: (typedValue: string) => void
  onFieldBInput: (typedValue: string) => void
  handleCurrencyASelect: (currencyANew: Currency) => void
  handleCurrencyBSelect: (currencyANew: Currency) => void
}) {
  return (
    <AutoColumn gap="md">
      <RowBetween paddingBottom="20px">
        <ThemedText.DeprecatedLabel>
          <Trans>Select Pair</Trans>
        </ThemedText.DeprecatedLabel>
      </RowBetween>
      <RowBetween>
        <CurrencyDropdown
          value={formattedAmounts[Field.CURRENCY_A]}
          onUserInput={onFieldAInput}
          hideInput={true}
          onMax={() => {
            onFieldAInput(maxAmounts[Field.CURRENCY_A]?.toExact() ?? '')
          }}
          onCurrencySelect={handleCurrencyASelect}
          showMaxButton={!atMaxAmounts[Field.CURRENCY_A]}
          currency={currencies[Field.CURRENCY_A] ?? null}
          id="add-liquidity-input-tokena"
          showCommonBases
        />

        <div style={{ width: '12px' }} />

        <CurrencyDropdown
          value={formattedAmounts[Field.CURRENCY_B]}
          hideInput={true}
          onUserInput={onFieldBInput}
          onCurrencySelect={handleCurrencyBSelect}
          onMax={() => {
            onFieldBInput(maxAmounts[Field.CURRENCY_B]?.toExact() ?? '')
          }}
          showMaxButton={!atMaxAmounts[Field.CURRENCY_B]}
          currency={currencies[Field.CURRENCY_B] ?? null}
          id="add-liquidity-input-tokenb"
          showCommonBases
        />
      </RowBetween>
    </AutoColumn>
  )
}
