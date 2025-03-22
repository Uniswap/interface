import { CurrencyAmount } from '@uniswap/sdk-core'
import { WarningLabel } from 'uniswap/src/components/modals/WarningModal/types'
import { AssetType } from 'uniswap/src/entities/assets'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { GQLNftAsset } from 'uniswap/src/features/nfts/types'
import { NativeCurrency } from 'uniswap/src/features/tokens/NativeCurrency'
import { DerivedSendInfo } from 'uniswap/src/features/transactions/send/types'
import i18n from 'uniswap/src/i18n'
import { uniCurrencyInfo } from 'uniswap/src/test/fixtures'
import { CurrencyField } from 'uniswap/src/types/currency'
import { getSendWarnings } from 'wallet/src/features/transactions/send/hooks/useSendWarnings'

const ETH = NativeCurrency.onChain(UniverseChainId.Mainnet)

const emptySendInfo: Pick<
  DerivedSendInfo,
  'currencyTypes' | 'currencies' | 'exactAmountToken' | 'exactCurrencyField' | 'exactAmountFiat'
> = {
  currencyTypes: {
    [CurrencyField.INPUT]: AssetType.Currency,
  },
  currencies: {
    [CurrencyField.INPUT]: undefined,
  },
  // these numbers don't really match up but that's ok
  exactAmountToken: '10000',
  exactAmountFiat: '',
  exactCurrencyField: CurrencyField.INPUT,
}

const sendState: DerivedSendInfo = {
  ...emptySendInfo,
  currencyAmounts: {
    [CurrencyField.INPUT]: CurrencyAmount.fromRawAmount(ETH, '10000'),
  },
  currencyBalances: {
    [CurrencyField.INPUT]: CurrencyAmount.fromRawAmount(ETH, '20000'),
  },
  chainId: UniverseChainId.Mainnet,
  currencyInInfo: uniCurrencyInfo(),
  nftIn: undefined,
}

const sendState2: DerivedSendInfo = {
  ...emptySendInfo,
  currencyAmounts: {
    [CurrencyField.INPUT]: undefined,
  },
  currencyBalances: {
    [CurrencyField.INPUT]: CurrencyAmount.fromRawAmount(ETH, '20000'),
  },
  recipient: '0x0eae044f00b0af300500f090ea00027097d03000',
  chainId: UniverseChainId.Mainnet,
  currencyInInfo: uniCurrencyInfo(),
  nftIn: undefined,
}

const mockNFT = {
  id: '1',
  collection: {
    id: '123',
    collectionId: '123',
    isVerified: true,
    markets: [],
    name: 'BAYC',
    numAssets: 10,
  },
  name: 'BAYC1',
  tokenId: '1',
  nftContract: { id: '2', address: '0xNFTAddress', chain: 'ETHEREUM' },
  creator: {
    id: '3',
    address: '0xCreateAddress',
    username: 'Username',
  },
} as GQLNftAsset

const sendNFT: DerivedSendInfo = {
  ...emptySendInfo,
  currencyTypes: {
    [CurrencyField.INPUT]: AssetType.ERC721,
  },
  currencyAmounts: {
    [CurrencyField.INPUT]: undefined,
  },
  currencyBalances: {
    [CurrencyField.INPUT]: undefined,
  },
  recipient: '0x0eae044f00b0af300500f090ea00027097d03000',
  chainId: UniverseChainId.Mainnet,
  currencyInInfo: undefined,
  nftIn: mockNFT,
}

const sendCurrency: DerivedSendInfo = {
  ...emptySendInfo,
  currencyAmounts: {
    [CurrencyField.INPUT]: CurrencyAmount.fromRawAmount(ETH, '1000'),
  },
  currencyBalances: {
    [CurrencyField.INPUT]: CurrencyAmount.fromRawAmount(ETH, '10000'),
  },
  recipient: '0x0eae044f00b0af300500f090ea00027097d03000',
  chainId: UniverseChainId.Mainnet,
  currencyInInfo: uniCurrencyInfo(),
  nftIn: undefined,
}

const insufficientBalanceState: DerivedSendInfo = {
  ...emptySendInfo,
  currencyAmounts: {
    [CurrencyField.INPUT]: CurrencyAmount.fromRawAmount(ETH, '10000'),
  },
  currencyBalances: {
    [CurrencyField.INPUT]: CurrencyAmount.fromRawAmount(ETH, '1000'),
  },
  recipient: '0x0eae044f00b0af300500f090ea00027097d03000',
  chainId: UniverseChainId.Mainnet,
  currencyInInfo: uniCurrencyInfo(),
  nftIn: undefined,
}

describe(getSendWarnings, () => {
  it('does not error when Currency with balances and amounts is provided', () => {
    const warnings = getSendWarnings(i18n.t, sendCurrency, false)
    expect(warnings.length).toBe(0)
  })

  it('errors if there is no internet', () => {
    const warnings = getSendWarnings(i18n.t, sendCurrency, true)
    expect(warnings.length).toBe(1)
  })

  it('does not error when offline is false', () => {
    const warnings = getSendWarnings(i18n.t, sendNFT, false)
    expect(warnings.length).toBe(0)
  })

  it('does not error when correctly formed NFT is provided', () => {
    const warnings = getSendWarnings(i18n.t, sendNFT, false)
    expect(warnings.length).toBe(0)
  })

  it('catches incomplete form errors: no recipient', async () => {
    const warnings = getSendWarnings(i18n.t, sendState, false)
    expect(warnings.length).toBe(1)
    expect(warnings[0]?.type).toEqual(WarningLabel.FormIncomplete)
  })

  it('catches incomplete form errors: no amount', async () => {
    const warnings = getSendWarnings(i18n.t, sendState2, false)
    expect(warnings.length).toBe(1)
    expect(warnings[0]?.type).toEqual(WarningLabel.FormIncomplete)
  })

  it('catches insufficient balance errors', () => {
    const warnings = getSendWarnings(i18n.t, insufficientBalanceState, false)
    expect(warnings.length).toBe(1)
    expect(warnings[0]?.type).toEqual(WarningLabel.InsufficientFunds)
  })

  it('catches multiple errors', () => {
    const incompleteAndInsufficientBalanceState = {
      ...sendState,
      currencyAmounts: {
        ...sendState.currencyAmounts,
        [CurrencyField.INPUT]: CurrencyAmount.fromRawAmount(ETH, '30000'),
      },
    }

    const warnings = getSendWarnings(i18n.t, incompleteAndInsufficientBalanceState, false)
    expect(warnings.length).toBe(2)
  })
})
