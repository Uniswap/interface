import { Token } from '@uniswap/sdk-core'
import { flattenObjectOfObjects, unnestObject } from './objects'

const DAI = new Token(1, '0x6b175474e89094c44da98b954eedeac495271d0f', 18, 'DAI', 'Dai Stablecoin')

const USDC = new Token(1, '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', 6, 'USDC', 'USD//C')

const USDC_ARBITRUM = new Token(
  42161,
  '0xff970a61a04b1ca14834a43f5de4533ebddb5cc8',
  6,
  'USDC',
  'USD//C'
)

describe(flattenObjectOfObjects, () => {
  it('correctly flattens', () => {
    expect(flattenObjectOfObjects({})).toEqual([])

    expect(flattenObjectOfObjects({ 1: {}, 4: {} })).toEqual([])

    expect(
      flattenObjectOfObjects({
        1: {
          [DAI.address]: DAI,
          [USDC.address]: USDC,
        },
        5: {},
        42161: {
          [USDC_ARBITRUM.address]: USDC_ARBITRUM,
        },
      })
    ).toEqual([DAI, USDC, USDC_ARBITRUM])

    expect(flattenObjectOfObjects({ 1: { '0x1': [1, 2, 3], '0x2': 4 } })).toEqual([[1, 2, 3], 4])
  })
})

describe(unnestObject, () => {
  it('handles simple objects', () => {
    expect(unnestObject({ a: '1', b: 1 })).toEqual({ a: '1', b: 1 })
    expect(unnestObject({ a: { b: 1, c: '1' } })).toEqual({ 'a.b': 1, 'a.c': '1' })
  })

  it('handles arrays', () => {
    expect(unnestObject({ a: ['constructor', 2, 3], b: [{ c: 1 }, { d: 2 }] })).toEqual({
      'a.0': 'constructor',
      'a.1': 2,
      'a.2': 3,
      'b.0.c': 1,
      'b.1.d': 2,
    })
  })
})
