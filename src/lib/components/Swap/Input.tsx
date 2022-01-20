import { Trans } from '@lingui/macro'
import { Currency } from '@uniswap/sdk-core'
import { useUSDCValue } from 'hooks/useUSDCPrice'
import { useInputAmount, useInputCurrency, useSwapInfo } from 'lib/hooks/swap'
import { Field } from 'lib/state/swap'
import styled, { ThemedText } from 'lib/theme'

import Column from '../Column'
import Row from '../Row'
import TokenImg from '../TokenImg'
import TokenInput from './TokenInput'

const InputColumn = styled(Column)<{ approved?: boolean }>`
  margin: 0.75em;
  position: relative;

  ${TokenImg} {
    filter: ${({ approved }) => (approved ? undefined : 'saturate(0) opacity(0.4)')};
    transition: filter 0.25s;
  }
`

interface InputProps {
  disabled?: boolean
}

export default function Input({ disabled }: InputProps) {
  const {
    currencyBalances: { [Field.INPUT]: balance },
    currencyAmounts: { [Field.INPUT]: inputCurrencyAmount },
  } = useSwapInfo()
  const inputUSDC = useUSDCValue(inputCurrencyAmount)

  const [typedInputAmount, updateTypedInputAmount] = useInputAmount()
  const [inputCurrency, updateInputCurrency] = useInputCurrency()

  //TODO(ianlapham): mimic logic from app swap page
  const mockApproved = true

  return (
    <InputColumn gap={0.5} approved={mockApproved}>
      <Row>
        <ThemedText.Subhead2 color="secondary">
          <Trans>Trading</Trans>
        </ThemedText.Subhead2>
      </Row>
      <TokenInput
        currency={inputCurrency}
        amount={(typedInputAmount !== undefined ? typedInputAmount : inputCurrencyAmount?.toSignificant(6)) ?? ''}
        disabled={disabled}
        onMax={balance ? () => updateTypedInputAmount(balance.toExact()) : undefined}
        onChangeInput={(val) => updateTypedInputAmount(val ?? '')}
        onChangeCurrency={(currency: Currency) => updateInputCurrency(currency)}
      >
        <ThemedText.Body2 color="secondary">
          <Row>
            {inputUSDC ? `~ $${inputUSDC.toFixed(2)}` : '-'}
            {balance && (
              <ThemedText.Body2
                color={inputCurrencyAmount && inputCurrencyAmount.greaterThan(balance) ? 'error' : undefined}
              >
                Balance: <span style={{ userSelect: 'text' }}>{balance}</span>
              </ThemedText.Body2>
            )}
          </Row>
        </ThemedText.Body2>
      </TokenInput>
      <Row />
    </InputColumn>
  )
}
