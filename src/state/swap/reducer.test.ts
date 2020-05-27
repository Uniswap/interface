import { ChainId, WETH } from '@uniswap/sdk'
import { createStore, Store } from 'redux'
import { Field, setDefaultsFromURLSearch } from './actions'
import reducer, { SwapState } from './reducer'

describe('swap reducer', () => {
  let store: Store<SwapState>

  beforeEach(() => {
    store = createStore(reducer, {
      [Field.OUTPUT]: { address: '' },
      [Field.INPUT]: { address: '' },
      typedValue: '',
      independentField: Field.INPUT
    })
  })

  describe('setDefaultsFromURL', () => {
    test('ETH to DAI', () => {
      store.dispatch(
        setDefaultsFromURLSearch({
          chainId: ChainId.MAINNET,
          queryString:
            '?inputCurrency=ETH&outputCurrency=0x6b175474e89094c44da98b954eedeac495271d0f&exactAmount=20.5&exactField=outPUT'
        })
      )

      expect(store.getState()).toEqual({
        [Field.OUTPUT]: { address: '0x6B175474E89094C44Da98b954EedeAC495271d0F' },
        [Field.INPUT]: { address: WETH[ChainId.MAINNET].address },
        typedValue: '20.5',
        independentField: Field.OUTPUT
      })
    })

    test('does not duplicate eth for invalid output token', () => {
      store.dispatch(
        setDefaultsFromURLSearch({
          chainId: ChainId.MAINNET,
          queryString: '?outputCurrency=invalid'
        })
      )

      expect(store.getState()).toEqual({
        [Field.INPUT]: { address: '' },
        [Field.OUTPUT]: { address: WETH[ChainId.MAINNET].address },
        typedValue: '',
        independentField: Field.INPUT
      })
    })

    test('output ETH only', () => {
      store.dispatch(
        setDefaultsFromURLSearch({
          chainId: ChainId.MAINNET,
          queryString: '?outputCurrency=eth&exactAmount=20.5'
        })
      )

      expect(store.getState()).toEqual({
        [Field.OUTPUT]: { address: WETH[ChainId.MAINNET].address },
        [Field.INPUT]: { address: '' },
        typedValue: '20.5',
        independentField: Field.INPUT
      })
    })
  })
})
