import { ChainId, WETH } from '@uniswap/sdk'
import { createStore, Store } from 'redux'

import { Field, setDefaultsFromURLMatchParams } from './actions'
import reducer, { MintState } from './reducer'

describe('mint reducer', () => {
  let store: Store<MintState>

  beforeEach(() => {
    store = createStore(reducer, {
      independentField: Field.TOKEN_A,
      typedValue: '',
      otherTypedValue: '',
      [Field.TOKEN_A]: { address: '' },
      [Field.TOKEN_B]: { address: '' }
    })
  })

  describe('setDefaultsFromURLMatchParams', () => {
    test('ETH to DAI', () => {
      store.dispatch(
        setDefaultsFromURLMatchParams({
          chainId: ChainId.MAINNET,
          params: {
            tokens: 'ETH-0x6b175474e89094c44da98b954eedeac495271d0f'
          }
        })
      )

      expect(store.getState()).toEqual({
        independentField: Field.TOKEN_A,
        typedValue: '',
        otherTypedValue: '',
        [Field.TOKEN_A]: { address: WETH[ChainId.MAINNET].address },
        [Field.TOKEN_B]: { address: '0x6b175474e89094c44da98b954eedeac495271d0f' }
      })
    })
  })
})
