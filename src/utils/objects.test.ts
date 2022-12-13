import { DAI, USDC, USDC_ARBITRUM } from 'src/constants/tokens'
import { flattenObjectOfObjects, unnestObject } from 'src/utils/objects'

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
