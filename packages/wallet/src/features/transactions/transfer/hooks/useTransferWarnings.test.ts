import { CurrencyAmount } from '@uniswap/sdk-core'
import { ChainId } from 'wallet/src/constants/chains'
import { AssetType } from 'wallet/src/entities/assets'
import { GQLNftAsset } from 'wallet/src/features/nfts/hooks'
import { NativeCurrency } from 'wallet/src/features/tokens/NativeCurrency'
import { CurrencyField } from 'wallet/src/features/transactions/transactionState/types'
import { getTransferWarnings } from 'wallet/src/features/transactions/transfer/hooks/useTransferWarnings'
import { DerivedTransferInfo } from 'wallet/src/features/transactions/transfer/types'
import { isOffline } from 'wallet/src/features/transactions/utils'
import { WarningLabel } from 'wallet/src/features/transactions/WarningModal/types'
import i18n from 'wallet/src/i18n/i18n'
import { networkDown, networkUnknown, networkUp, uniCurrencyInfo } from 'wallet/src/test/fixtures'

const ETH = NativeCurrency.onChain(ChainId.Mainnet)

const emptyTransferInfo: Pick<
  DerivedTransferInfo,
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

const transferState: DerivedTransferInfo = {
  ...emptyTransferInfo,
  currencyAmounts: {
    [CurrencyField.INPUT]: CurrencyAmount.fromRawAmount(ETH, '10000'),
  },
  currencyBalances: {
    [CurrencyField.INPUT]: CurrencyAmount.fromRawAmount(ETH, '20000'),
  },
  chainId: ChainId.Mainnet,
  currencyInInfo: uniCurrencyInfo(),
  nftIn: undefined,
}

const transferState2: DerivedTransferInfo = {
  ...emptyTransferInfo,
  currencyAmounts: {
    [CurrencyField.INPUT]: undefined,
  },
  currencyBalances: {
    [CurrencyField.INPUT]: CurrencyAmount.fromRawAmount(ETH, '20000'),
  },
  recipient: '0x0eae044f00b0af300500f090ea00027097d03000',
  chainId: ChainId.Mainnet,
  currencyInInfo: uniCurrencyInfo(),
  nftIn: undefined,
}

const mockNFT = {
  id: '1',
  collection: {
    id: '123',
    collectionId: '123',
    description: null,
    image: null,
    isVerified: true,
    markets: [],
    name: 'BAYC',
    numAssets: 10,
  },
  name: 'BAYC1',
  description: null,
  image: null,
  thumbnail: null,
  tokenId: '1',
  nftContract: { id: '2', address: '0xNFTAddress', chain: 'ETHEREUM', standard: null },
  creator: {
    id: '3',
    address: '0xCreateAddress',
    username: 'Username',
  },
} as GQLNftAsset

const transferNFT: DerivedTransferInfo = {
  ...emptyTransferInfo,
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
  chainId: ChainId.Mainnet,
  currencyInInfo: undefined,
  nftIn: mockNFT,
}

const transferCurrency: DerivedTransferInfo = {
  ...emptyTransferInfo,
  currencyAmounts: {
    [CurrencyField.INPUT]: CurrencyAmount.fromRawAmount(ETH, '1000'),
  },
  currencyBalances: {
    [CurrencyField.INPUT]: CurrencyAmount.fromRawAmount(ETH, '10000'),
  },
  recipient: '0x0eae044f00b0af300500f090ea00027097d03000',
  chainId: ChainId.Mainnet,
  currencyInInfo: uniCurrencyInfo(),
  nftIn: undefined,
}

const insufficientBalanceState: DerivedTransferInfo = {
  ...emptyTransferInfo,
  currencyAmounts: {
    [CurrencyField.INPUT]: CurrencyAmount.fromRawAmount(ETH, '10000'),
  },
  currencyBalances: {
    [CurrencyField.INPUT]: CurrencyAmount.fromRawAmount(ETH, '1000'),
  },
  recipient: '0x0eae044f00b0af300500f090ea00027097d03000',
  chainId: ChainId.Mainnet,
  currencyInInfo: uniCurrencyInfo(),
  nftIn: undefined,
}

describe(getTransferWarnings, () => {
  it('does not error when Currency with balances and amounts is provided', () => {
    const warnings = getTransferWarnings(i18n.t, transferCurrency, isOffline(networkUp()))
    expect(warnings.length).toBe(0)
  })

  it('errors if there is no internet', () => {
    const warnings = getTransferWarnings(i18n.t, transferCurrency, isOffline(networkDown()))
    expect(warnings.length).toBe(1)
  })

  it('does not error when network state is unknown', () => {
    const warnings = getTransferWarnings(i18n.t, transferNFT, isOffline(networkUnknown()))
    expect(warnings.length).toBe(0)
  })

  it('does not error when correctly formed NFT is provided', () => {
    const warnings = getTransferWarnings(i18n.t, transferNFT, isOffline(networkUp()))
    expect(warnings.length).toBe(0)
  })

  it('catches incomplete form errors: no recipient', async () => {
    const warnings = getTransferWarnings(i18n.t, transferState, isOffline(networkUp()))
    expect(warnings.length).toBe(1)
    expect(warnings[0]?.type).toEqual(WarningLabel.FormIncomplete)
  })

  it('catches incomplete form errors: no amount', async () => {
    const warnings = getTransferWarnings(i18n.t, transferState2, isOffline(networkUp()))
    expect(warnings.length).toBe(1)
    expect(warnings[0]?.type).toEqual(WarningLabel.FormIncomplete)
  })

  it('catches insufficient balance errors', () => {
    const warnings = getTransferWarnings(i18n.t, insufficientBalanceState, isOffline(networkUp()))
    expect(warnings.length).toBe(1)
    expect(warnings[0]?.type).toEqual(WarningLabel.InsufficientFunds)
  })

  it('catches multiple errors', () => {
    const incompleteAndInsufficientBalanceState = {
      ...transferState,
      currencyAmounts: {
        ...transferState.currencyAmounts,
        [CurrencyField.INPUT]: CurrencyAmount.fromRawAmount(ETH, '30000'),
      },
    }

    const warnings = getTransferWarnings(
      i18n.t,
      incompleteAndInsufficientBalanceState,
      isOffline(networkUp())
    )
    expect(warnings.length).toBe(2)
  })
})
