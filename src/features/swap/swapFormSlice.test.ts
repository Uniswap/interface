import { ChainId } from 'src/constants/chains'
import {
  CurrencyField,
  enterExactAmount,
  initialSwapState,
  selectCurrency,
  swapReducer,
  switchCurrencySides,
} from './swapFormSlice'

const chainId = ChainId.MAINNET

test('should return the initial state', () => {
  expect(swapReducer(undefined, {} as any)).toEqual(initialSwapState)
})

describe(selectCurrency, () => {
  test('should handle a selected input currency', () => {
    const previousState = { ...initialSwapState }
    expect(
      swapReducer(
        previousState,
        selectCurrency({ field: CurrencyField.INPUT, address: 'ETH', chainId })
      )
    ).toEqual({
      ...previousState,
      [CurrencyField.INPUT]: {
        address: 'ETH',
        chainId,
      },
    })
  })

  test('should handle a selected output currency', () => {
    const previousState = { ...initialSwapState }
    expect(
      swapReducer(
        previousState,
        selectCurrency({ field: CurrencyField.OUTPUT, address: 'DAI', chainId })
      )
    ).toEqual({
      ...previousState,
      [CurrencyField.OUTPUT]: {
        address: 'DAI',
        chainId,
      },
    })
  })

  test('should set other currency to null when selecting the other one', () => {
    const previousState = {
      ...initialSwapState,
      [CurrencyField.INPUT]: { address: 'ETH', chainId },
    }
    expect(
      swapReducer(
        previousState,
        selectCurrency({ field: CurrencyField.OUTPUT, address: 'ETH', chainId })
      )
    ).toEqual({
      ...previousState,
      exactCurrencyField: CurrencyField.OUTPUT,
      [CurrencyField.INPUT]: null,
      [CurrencyField.OUTPUT]: {
        address: 'ETH',
        chainId,
      },
    })
  })

  test('should swap currencies when selecting the other one', () => {
    const previousState = {
      ...initialSwapState,
      [CurrencyField.INPUT]: { address: 'ETH', chainId },
      [CurrencyField.OUTPUT]: { address: 'DAI', chainId },
    }
    expect(
      swapReducer(
        previousState,
        selectCurrency({ field: CurrencyField.OUTPUT, address: 'ETH', chainId })
      )
    ).toEqual({
      ...previousState,
      exactCurrencyField: CurrencyField.OUTPUT,
      [CurrencyField.INPUT]: { address: 'DAI', chainId },
      [CurrencyField.OUTPUT]: {
        address: 'ETH',
        chainId,
      },
    })
  })

  test('should reset other currency when network changes', () => {
    const otherChainId = chainId + 1
    const previousState = {
      ...initialSwapState,
      [CurrencyField.INPUT]: { address: 'ETH', chainId },
      [CurrencyField.OUTPUT]: { address: 'DAI', chainId },
    }
    expect(
      swapReducer(
        previousState,
        selectCurrency({ field: CurrencyField.OUTPUT, address: 'ETH', chainId: otherChainId })
      )
    ).toEqual({
      ...previousState,
      exactCurrencyField: CurrencyField.OUTPUT,
      [CurrencyField.INPUT]: null,
      [CurrencyField.OUTPUT]: {
        address: 'ETH',
        chainId: otherChainId,
      },
    })
  })
})

describe(switchCurrencySides, () => {
  it('should switch currencies', () => {
    const previousState = {
      ...initialSwapState,
      exactCurrencyField: CurrencyField.INPUT,
      [CurrencyField.INPUT]: { address: 'DAI', chainId },
      [CurrencyField.OUTPUT]: { address: 'ETH', chainId },
    }

    expect(swapReducer(previousState, switchCurrencySides())).toEqual({
      ...previousState,
      exactCurrencyField: CurrencyField.OUTPUT,
      [CurrencyField.INPUT]: { address: 'ETH', chainId },
      [CurrencyField.OUTPUT]: { address: 'DAI', chainId },
    })
  })
})

describe(enterExactAmount, () => {
  it('should set typed value', () => {
    const previousState = { ...initialSwapState }

    expect(
      swapReducer(previousState, enterExactAmount({ field: CurrencyField.INPUT, exactAmount: '1' }))
    ).toEqual({
      ...previousState,
      exactCurrencyField: CurrencyField.INPUT,
      exactAmount: '1',
    })
  })

  it('should set independent field when dependent receives typed input', () => {
    const previousState = { ...initialSwapState }

    expect(
      swapReducer(
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
