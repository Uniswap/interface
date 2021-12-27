import { DAI, DAI_RINKEBY, USDC } from 'src/constants/tokens'
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
        4: {
          [DAI_RINKEBY.address]: DAI_RINKEBY,
        },
        5: {},
      })
    ).toEqual([DAI, USDC, DAI_RINKEBY])

    expect(flattenObjectOfObjects({ 1: { '0x1': [1, 2, 3], '0x2': 4 } })).toEqual([[1, 2, 3], 4])
  })
})
