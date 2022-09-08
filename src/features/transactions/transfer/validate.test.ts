import { CurrencyAmount } from '@uniswap/sdk-core'
import { WarningLabel } from 'src/components/modals/types'
import { ChainId } from 'src/constants/chains'
import { DAI } from 'src/constants/tokens'
import { NFTAsset } from 'src/features/nfts/types'
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
  chainId: ChainId.Mainnet,
  currencyIn: DAI,
  nftIn: undefined,
}

const partialTransferState2: PartialDerivedTransferInfo = {
  currencyAmounts: {
    [CurrencyField.INPUT]: undefined,
  },
  currencyBalances: {
    [CurrencyField.INPUT]: CurrencyAmount.fromRawAmount(ETH, '20000'),
  },
  recipient: '0x0eae044f00b0af300500f090ea00027097d03000',
  chainId: ChainId.Mainnet,
  currencyIn: DAI,
  nftIn: undefined,
}

const mockNFT = {
  id: 1,
  name: 'BAYC',
  token_id: '1',
  asset_contract: { address: '0xNFTAddress' },
} as NFTAsset.Asset

const transferNFT: PartialDerivedTransferInfo = {
  currencyAmounts: {
    [CurrencyField.INPUT]: undefined,
  },
  currencyBalances: {
    [CurrencyField.INPUT]: undefined,
  },
  recipient: '0x0eae044f00b0af300500f090ea00027097d03000',
  chainId: ChainId.Mainnet,
  currencyIn: undefined,
  nftIn: mockNFT,
}

const transferCurrency: PartialDerivedTransferInfo = {
  currencyAmounts: {
    [CurrencyField.INPUT]: CurrencyAmount.fromRawAmount(ETH, '1000'),
  },
  currencyBalances: {
    [CurrencyField.INPUT]: CurrencyAmount.fromRawAmount(ETH, '10000'),
  },
  recipient: '0x0eae044f00b0af300500f090ea00027097d03000',
  chainId: ChainId.Mainnet,
  currencyIn: DAI,
  nftIn: undefined,
}

const insufficientBalanceState: PartialDerivedTransferInfo = {
  currencyAmounts: {
    [CurrencyField.INPUT]: CurrencyAmount.fromRawAmount(ETH, '10000'),
  },
  currencyBalances: {
    [CurrencyField.INPUT]: CurrencyAmount.fromRawAmount(ETH, '1000'),
  },
  recipient: '0x0eae044f00b0af300500f090ea00027097d03000',
  chainId: ChainId.Mainnet,
  currencyIn: DAI,
  nftIn: undefined,
}

const mockTranslate = jest.fn()

describe(getTransferWarnings, () => {
  it('does not error when Currency with balances and amounts is provided', () => {
    const warnings = getTransferWarnings(mockTranslate, transferCurrency)
    expect(warnings.length).toBe(0)
  })

  it('does not error when correctly formed NFT is provided', () => {
    const warnings = getTransferWarnings(mockTranslate, transferNFT)
    expect(warnings.length).toBe(0)
  })

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
