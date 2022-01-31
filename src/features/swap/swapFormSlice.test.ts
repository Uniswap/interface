import { Ether } from '@uniswap/sdk-core'
import { ChainId } from 'src/constants/chains'
import { currencyId } from 'src/utils/currencyId'
import {
  CurrencyField,
  enterExactAmount,
  initialSwapFormState,
  selectCurrency,
  swapFormReducer,
  switchCurrencySides,
} from './swapFormSlice'

const chainId = ChainId.RINKEBY
const ethAddress = currencyId(Ether.onChain(ChainId.RINKEBY))

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
          address: ethAddress,
          chainId,
        })
      )
    ).toEqual({
      ...previousState,
      [CurrencyField.INPUT]: {
        address: ethAddress,
        chainId,
      },
    })
  })

  test('should handle a selected output currency', () => {
    const previousState = { ...initialSwapFormState }
    expect(
      swapFormReducer(
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
      ...initialSwapFormState,
      [CurrencyField.INPUT]: { address: ethAddress, chainId },
    }
    expect(
      swapFormReducer(
        previousState,
        selectCurrency({
          field: CurrencyField.OUTPUT,
          address: ethAddress,
          chainId,
        })
      )
    ).toEqual({
      ...previousState,
      exactCurrencyField: CurrencyField.OUTPUT,
      [CurrencyField.INPUT]: null,
      [CurrencyField.OUTPUT]: {
        address: ethAddress,
        chainId,
      },
    })
  })

  test('should swap currencies when selecting the other one', () => {
    const previousState = {
      ...initialSwapFormState,
      [CurrencyField.INPUT]: { address: ethAddress, chainId },
      [CurrencyField.OUTPUT]: { address: 'DAI', chainId },
    }
    expect(
      swapFormReducer(
        previousState,
        selectCurrency({
          field: CurrencyField.OUTPUT,
          address: ethAddress,
          chainId,
        })
      )
    ).toEqual({
      ...previousState,
      exactCurrencyField: CurrencyField.OUTPUT,
      [CurrencyField.INPUT]: { address: 'DAI', chainId },
      [CurrencyField.OUTPUT]: {
        address: ethAddress,
        chainId,
      },
    })
  })

  test('should reset other currency when network changes', () => {
    const otherChainId = chainId + 1
    const previousState = {
      ...initialSwapFormState,
      [CurrencyField.INPUT]: { address: ethAddress, chainId },
      [CurrencyField.OUTPUT]: { address: 'DAI', chainId },
    }
    expect(
      swapFormReducer(
        previousState,
        selectCurrency({
          field: CurrencyField.OUTPUT,
          address: ethAddress,
          chainId: otherChainId,
        })
      )
    ).toEqual({
      ...previousState,
      exactCurrencyField: CurrencyField.OUTPUT,
      [CurrencyField.INPUT]: null,
      [CurrencyField.OUTPUT]: {
        address: ethAddress,
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
      [CurrencyField.INPUT]: { address: 'DAI', chainId },
      [CurrencyField.OUTPUT]: { address: ethAddress, chainId },
    }

    expect(swapFormReducer(previousState, switchCurrencySides())).toEqual({
      ...previousState,
      exactCurrencyField: CurrencyField.OUTPUT,
      [CurrencyField.INPUT]: { address: ethAddress, chainId },
      [CurrencyField.OUTPUT]: { address: 'DAI', chainId },
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
