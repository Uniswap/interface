import { ChainId, WETH } from '@uniswap/sdk'
import { parse } from 'qs'
import { Field } from './actions'
import { queryParametersToSwapState } from './hooks'

describe('hooks', () => {
  describe('#queryParametersToSwapState', () => {
    test('ETH to DAI', () => {
      expect(
        queryParametersToSwapState(
          parse(
            '?inputCurrency=ETH&outputCurrency=0x6b175474e89094c44da98b954eedeac495271d0f&exactAmount=20.5&exactField=outPUT',
            { parseArrays: false, ignoreQueryPrefix: true }
          ),
          ChainId.MAINNET
        )
      ).toEqual({
        [Field.OUTPUT]: { address: '0x6B175474E89094C44Da98b954EedeAC495271d0F' },
        [Field.INPUT]: { address: WETH[ChainId.MAINNET].address },
        typedValue: '20.5',
        independentField: Field.OUTPUT,
        recipient: null
      })
    })

    test('does not duplicate eth for invalid output token', () => {
      expect(
        queryParametersToSwapState(
          parse('?outputCurrency=invalid', { parseArrays: false, ignoreQueryPrefix: true }),
          ChainId.MAINNET
        )
      ).toEqual({
        [Field.INPUT]: { address: '' },
        [Field.OUTPUT]: { address: WETH[ChainId.MAINNET].address },
        typedValue: '',
        independentField: Field.INPUT,
        recipient: null
      })
    })

    test('output ETH only', () => {
      expect(
        queryParametersToSwapState(
          parse('?outputCurrency=eth&exactAmount=20.5', { parseArrays: false, ignoreQueryPrefix: true }),
          ChainId.MAINNET
        )
      ).toEqual({
        [Field.OUTPUT]: { address: WETH[ChainId.MAINNET].address },
        [Field.INPUT]: { address: '' },
        typedValue: '20.5',
        independentField: Field.INPUT,
        recipient: null
      })
    })

    test('invalid recipient', () => {
      expect(
        queryParametersToSwapState(
          parse('?outputCurrency=eth&exactAmount=20.5&recipient=abc', { parseArrays: false, ignoreQueryPrefix: true }),
          ChainId.MAINNET
        )
      ).toEqual({
        [Field.OUTPUT]: { address: WETH[ChainId.MAINNET].address },
        [Field.INPUT]: { address: '' },
        typedValue: '20.5',
        independentField: Field.INPUT,
        recipient: null
      })
    })

    test('valid recipient', () => {
      expect(
        queryParametersToSwapState(
          parse('?outputCurrency=eth&exactAmount=20.5&recipient=0x0fF2D1eFd7A57B7562b2bf27F3f37899dB27F4a5', {
            parseArrays: false,
            ignoreQueryPrefix: true
          }),
          ChainId.MAINNET
        )
      ).toEqual({
        [Field.OUTPUT]: { address: WETH[ChainId.MAINNET].address },
        [Field.INPUT]: { address: '' },
        typedValue: '20.5',
        independentField: Field.INPUT,
        recipient: '0x0fF2D1eFd7A57B7562b2bf27F3f37899dB27F4a5'
      })
    })
    test('accepts any recipient', () => {
      expect(
        queryParametersToSwapState(
          parse('?outputCurrency=eth&exactAmount=20.5&recipient=bob.argent.xyz', {
            parseArrays: false,
            ignoreQueryPrefix: true
          }),
          ChainId.MAINNET
        )
      ).toEqual({
        [Field.OUTPUT]: { address: WETH[ChainId.MAINNET].address },
        [Field.INPUT]: { address: '' },
        typedValue: '20.5',
        independentField: Field.INPUT,
        recipient: 'bob.argent.xyz'
      })
    })
  })
})
