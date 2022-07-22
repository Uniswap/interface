import { CurrencyAmount } from '@uniswap/sdk-core'
import { WarningLabel } from 'src/components/warnings/types'
import { ChainId } from 'src/constants/chains'
import { NativeCurrency } from 'src/features/tokenLists/NativeCurrency'
import { CurrencyField } from 'src/features/transactions/transactionState/transactionState'
import {
  getTransferWarnings,
  PartialDerivedTransferInfo,
} from 'src/features/transactions/transfer/validate'

const ETH = NativeCurrency.onChain(ChainId.Mainnet)

const partialTransferState: PartialDerivedTransferInfo = {
  currencyAmounts: {
    [CurrencyField.INPUT]: CurrencyAmount.fromRawAmount(ETH, '10000'),
  },
  currencyBalances: {
    [CurrencyField.INPUT]: CurrencyAmount.fromRawAmount(ETH, '20000'),
  },
  currencies: {
    [CurrencyField.INPUT]: ETH,
  },
}

const partialTransferState2: PartialDerivedTransferInfo = {
  currencyAmounts: {
    [CurrencyField.INPUT]: undefined,
  },
  currencyBalances: {
    [CurrencyField.INPUT]: CurrencyAmount.fromRawAmount(ETH, '20000'),
  },
  currencies: {
    [CurrencyField.INPUT]: ETH,
  },
  recipient: '0x0eae044f00b0af300500f090ea00027097d03000',
}

const insufficientBalanceState: PartialDerivedTransferInfo = {
  currencyAmounts: {
    [CurrencyField.INPUT]: CurrencyAmount.fromRawAmount(ETH, '10000'),
  },
  currencyBalances: {
    [CurrencyField.INPUT]: CurrencyAmount.fromRawAmount(ETH, '1000'),
  },
  currencies: {
    [CurrencyField.INPUT]: ETH,
  },
  recipient: '0x0eae044f00b0af300500f090ea00027097d03000',
}

const mockTranslate = jest.fn()

describe(getTransferWarnings, () => {
  it('catches incomplete form errors: no recipient', async () => {
    const warnings = getTransferWarnings(mockTranslate, partialTransferState)
    expect(warnings.length).toBe(1)
    expect(warnings[0].type).toEqual(WarningLabel.FormIncomplete)
  })

  it('catches incomplete form errors: no amount', async () => {
    const warnings = getTransferWarnings(mockTranslate, partialTransferState2)
    expect(warnings.length).toBe(1)
    expect(warnings[0].type).toEqual(WarningLabel.FormIncomplete)
  })

  it('catches insufficient balance errors', () => {
    const warnings = getTransferWarnings(mockTranslate, insufficientBalanceState)
    expect(warnings.length).toBe(1)
    expect(warnings[0].type).toEqual(WarningLabel.InsufficientFunds)
  })

  it('catches multiple errors', () => {
    const incompleteAndInsufficientBalanceState = {
      ...partialTransferState,
      currencyAmounts: {
        ...partialTransferState.currencyAmounts,
        [CurrencyField.INPUT]: CurrencyAmount.fromRawAmount(ETH, '30000'),
      },
    }

    const warnings = getTransferWarnings(mockTranslate, incompleteAndInsufficientBalanceState)
    expect(warnings.length).toBe(2)
  })
})
