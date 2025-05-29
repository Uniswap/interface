import { Token } from '@uniswap/sdk-core'
import { flattenObjectOfObjects, sortKeysRecursively, unnestObject } from 'utilities/src/primitives/objects'

const DAI = new Token(1, '0x6b175474e89094c44da98b954eedeac495271d0f', 18, 'DAI', 'Dai Stablecoin')

const USDC = new Token(1, '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', 6, 'USDC', 'USD Coin')

const USDC_ARBITRUM = new Token(42161, '0xff970a61a04b1ca14834a43f5de4533ebddb5cc8', 6, 'USDC', 'USD Coin')

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
      }),
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

describe(sortKeysRecursively, () => {
  it('should sort the keys of an object', () => {
    const obj = { b: 2, f: 1, d: 3, c: 4, e: 5, a: 6 }
    const result = JSON.stringify(sortKeysRecursively(obj))
    expect(result).toBe('{"a":6,"b":2,"c":4,"d":3,"e":5,"f":1}')
  })

  it('should handle an empty object', () => {
    const obj = {}
    const result = JSON.stringify(sortKeysRecursively(obj))
    expect(result).toBe('{}')
  })

  it('should handle an object with arrays without sorting the arrays', () => {
    const obj = { b: [3, '2', 1], a: [1, 2, '3'] }
    const result = JSON.stringify(sortKeysRecursively(obj))
    expect(result).toBe(`{"a":[1,2,"3"],"b":[3,"2",1]}`)
  })

  it('should handle deep nested objects', () => {
    const obj = {
      a: {
        d: { b: 2, a: 1 },
        c: { z: 10, a: { x: { b: 'test', a: 'blah', x: null } } },
      },
      b: 1,
    }
    const result = JSON.stringify(sortKeysRecursively(obj))
    expect(result).toBe(`{"a":{"c":{"a":{"x":{"a":"blah","b":"test","x":null}},"z":10},"d":{"a":1,"b":2}},"b":1}`)
  })
})
