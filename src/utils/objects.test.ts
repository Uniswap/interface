import { DAI, USDC, USDC_ARBITRUM } from 'src/constants/tokens'
import { flattenObjectOfObjects } from 'src/utils/objects'

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
