import { ChainId } from 'src/constants/chains'
import { NativeCurrency } from 'src/features/tokenLists/NativeCurrency'
import { currencyId } from 'src/utils/currencyId'
import {
  CurrencyField,
  enterExactAmount,
  initialSwapFormState,
  selectCurrency,
  swapFormReducer,
  switchCurrencySides,
} from './swapFormSlice'

const chainId = ChainId.Rinkeby
const ethAddress = currencyId(NativeCurrency.onChain(ChainId.Rinkeby))

test('should return the initial state', () => {
  expect(swapFormReducer(undefined, {} as any)).toEqual(initialSwapFormState)
})

describe(selectCurrency, () => {
  test('should handle a selected input currency', () => {
    const previousState = { ...initialSwapFormState }
    expect(
      swapFormReducer(
        previousState,
        selectCurrency({
          field: CurrencyField.INPUT,
          currencyId: ethAddress,
          chainId,
        })
      )
    ).toEqual({
      ...previousState,
      [CurrencyField.INPUT]: {
        currencyId: ethAddress,
        chainId,
      },
    })
  })

  test('should handle a selected output currency', () => {
    const previousState = { ...initialSwapFormState }
    expect(
      swapFormReducer(
        previousState,
        selectCurrency({ field: CurrencyField.OUTPUT, currencyId: 'DAI', chainId })
      )
    ).toEqual({
      ...previousState,
      [CurrencyField.OUTPUT]: {
        currencyId: 'DAI',
        chainId,
      },
    })
  })

  test('should set other currency to null when selecting the other one', () => {
    const previousState = {
      ...initialSwapFormState,
      [CurrencyField.INPUT]: { currencyId: ethAddress, chainId },
    }
    expect(
      swapFormReducer(
        previousState,
        selectCurrency({
          field: CurrencyField.OUTPUT,
          currencyId: ethAddress,
          chainId,
        })
      )
    ).toEqual({
      ...previousState,
      exactCurrencyField: CurrencyField.OUTPUT,
      [CurrencyField.INPUT]: null,
      [CurrencyField.OUTPUT]: {
        currencyId: ethAddress,
        chainId,
      },
    })
  })

  test('should swap currencies when selecting the other one', () => {
    const previousState = {
      ...initialSwapFormState,
      [CurrencyField.INPUT]: { currencyId: ethAddress, chainId },
      [CurrencyField.OUTPUT]: { currencyId: 'DAI', chainId },
    }
    expect(
      swapFormReducer(
        previousState,
        selectCurrency({
          field: CurrencyField.OUTPUT,
          currencyId: ethAddress,
          chainId,
        })
      )
    ).toEqual({
      ...previousState,
      exactCurrencyField: CurrencyField.OUTPUT,
      [CurrencyField.INPUT]: { currencyId: 'DAI', chainId },
      [CurrencyField.OUTPUT]: {
        currencyId: ethAddress,
        chainId,
      },
    })
  })

  test('should reset other currency when network changes', () => {
    const otherChainId = chainId + 1
    const previousState = {
      ...initialSwapFormState,
      [CurrencyField.INPUT]: { currencyId: ethAddress, chainId },
      [CurrencyField.OUTPUT]: { currencyId: 'DAI', chainId },
    }
    expect(
      swapFormReducer(
        previousState,
        selectCurrency({
          field: CurrencyField.OUTPUT,
          currencyId: ethAddress,
          chainId: otherChainId,
        })
      )
    ).toEqual({
      ...previousState,
      exactCurrencyField: CurrencyField.OUTPUT,
      [CurrencyField.INPUT]: null,
      [CurrencyField.OUTPUT]: {
        currencyId: ethAddress,
        chainId: otherChainId,
      },
    })
  })
})

describe(switchCurrencySides, () => {
  it('should switch currencies', () => {
    const previousState = {
      ...initialSwapFormState,
      exactCurrencyField: CurrencyField.INPUT,
      [CurrencyField.INPUT]: { currencyId: 'DAI', chainId },
      [CurrencyField.OUTPUT]: { currencyId: ethAddress, chainId },
    }

    expect(swapFormReducer(previousState, switchCurrencySides())).toEqual({
      ...previousState,
      exactCurrencyField: CurrencyField.OUTPUT,
      [CurrencyField.INPUT]: { currencyId: ethAddress, chainId },
      [CurrencyField.OUTPUT]: { currencyId: 'DAI', chainId },
    })
  })
})

describe(enterExactAmount, () => {
  it('should set typed value', () => {
    const previousState = { ...initialSwapFormState }

    expect(
      swapFormReducer(
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
    const previousState = { ...initialSwapFormState }

    expect(
      swapFormReducer(
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
