import { NATIVE_ADDRESS } from 'src/constants/addresses'
import { ChainId } from 'src/constants/chains'
import { AssetType, CurrencyAsset } from 'src/entities/assets'
import {
  CurrencyField,
  enterExactAmount,
  initialState,
  selectCurrency,
  switchCurrencySides,
  TransactionState,
  transactionStateReducer,
} from './transactionState'

const chainId = ChainId.Rinkeby
const ethAddress = NATIVE_ADDRESS
const daiTradeableAsset: CurrencyAsset = { address: 'DAI', chainId, type: AssetType.Currency }
const ethTradeableAsset: CurrencyAsset = { address: ethAddress, chainId, type: AssetType.Currency }

const testInitialState: Readonly<TransactionState> = {
  [CurrencyField.INPUT]: {
    address: NATIVE_ADDRESS,
    chainId: ChainId.Rinkeby,
    type: AssetType.Currency,
  },
  [CurrencyField.OUTPUT]: null,
  exactCurrencyField: CurrencyField.INPUT,
  exactAmount: '',
}

test('should return the initial state', () => {
  expect(transactionStateReducer(undefined, {} as any)).toEqual(initialState)
})

describe(selectCurrency, () => {
  test('should handle a selected input currency', () => {
    const previousState = { ...testInitialState }
    expect(
      transactionStateReducer(
        previousState,
        selectCurrency({
          field: CurrencyField.INPUT,
          tradeableAsset: ethTradeableAsset,
        })
      )
    ).toEqual({
      ...previousState,
      [CurrencyField.INPUT]: ethTradeableAsset,
    })
  })

  test('should handle a selected output currency', () => {
    const previousState = { ...testInitialState }
    expect(
      transactionStateReducer(
        previousState,
        selectCurrency({
          field: CurrencyField.OUTPUT,
          tradeableAsset: daiTradeableAsset,
        })
      )
    ).toEqual({
      ...previousState,
      [CurrencyField.OUTPUT]: daiTradeableAsset,
    })
  })

  test('should set other currency to null when selecting the other one', () => {
    const previousState = {
      ...testInitialState,
      [CurrencyField.INPUT]: ethTradeableAsset,
    }
    expect(
      transactionStateReducer(
        previousState,
        selectCurrency({
          field: CurrencyField.OUTPUT,
          tradeableAsset: ethTradeableAsset,
        })
      )
    ).toEqual({
      ...previousState,
      exactCurrencyField: CurrencyField.OUTPUT,
      [CurrencyField.INPUT]: null,
      [CurrencyField.OUTPUT]: ethTradeableAsset,
    })
  })

  test('should swap currencies when selecting the other one', () => {
    const previousState = {
      ...testInitialState,
      [CurrencyField.INPUT]: ethTradeableAsset,
      [CurrencyField.OUTPUT]: daiTradeableAsset,
    }
    expect(
      transactionStateReducer(
        previousState,
        selectCurrency({
          field: CurrencyField.OUTPUT,
          tradeableAsset: ethTradeableAsset,
        })
      )
    ).toEqual({
      ...previousState,
      exactCurrencyField: CurrencyField.OUTPUT,
      [CurrencyField.INPUT]: daiTradeableAsset,
      [CurrencyField.OUTPUT]: ethTradeableAsset,
    })
  })

  test('should reset other currency when network changes', () => {
    const otherChainId = chainId + 1
    const previousState = {
      ...testInitialState,
      [CurrencyField.INPUT]: ethTradeableAsset,
      [CurrencyField.OUTPUT]: daiTradeableAsset,
    }
    expect(
      transactionStateReducer(
        previousState,
        selectCurrency({
          field: CurrencyField.OUTPUT,
          tradeableAsset: {
            address: ethAddress,
            chainId: otherChainId,
            type: AssetType.Currency,
          },
        })
      )
    ).toEqual({
      ...previousState,
      exactCurrencyField: CurrencyField.OUTPUT,
      [CurrencyField.INPUT]: null,
      [CurrencyField.OUTPUT]: {
        address: ethAddress,
        chainId: otherChainId,
        type: AssetType.Currency,
      },
    })
  })
})

describe(switchCurrencySides, () => {
  it('should switch currencies', () => {
    const previousState = {
      ...testInitialState,
      exactCurrencyField: CurrencyField.INPUT,
      [CurrencyField.INPUT]: daiTradeableAsset,
      [CurrencyField.OUTPUT]: ethTradeableAsset,
    }

    expect(transactionStateReducer(previousState, switchCurrencySides())).toEqual({
      ...previousState,
      exactCurrencyField: CurrencyField.OUTPUT,
      [CurrencyField.INPUT]: ethTradeableAsset,
      [CurrencyField.OUTPUT]: daiTradeableAsset,
    })
  })
})

describe(enterExactAmount, () => {
  it('should set typed value', () => {
    const previousState = { ...testInitialState }

    expect(
      transactionStateReducer(
        previousState,
        enterExactAmount({ field: CurrencyField.INPUT, exactAmount: '1' })
      )
    ).toEqual({
      ...previousState,
      exactCurrencyField: CurrencyField.INPUT,
      exactAmount: '1',
    })
  })

  it('should set independent field when dependent receives typed input', () => {
    const previousState = { ...testInitialState }

    expect(
      transactionStateReducer(
        previousState,
        enterExactAmount({ field: CurrencyField.OUTPUT, exactAmount: '5' })
      )
    ).toEqual({
      ...previousState,
      exactCurrencyField: CurrencyField.OUTPUT,
      exactAmount: '5',
    })
  })
})
