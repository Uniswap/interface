import { DAI, DAI_RINKEBY, USDC } from 'src/constants/tokens'
import { flattenChainIdToAddressTo } from 'src/utils/objects'

describe(flattenChainIdToAddressTo, () => {
  it('correctly flattens', () => {
    expect(flattenChainIdToAddressTo({})).toEqual([])

    expect(flattenChainIdToAddressTo({ 1: {}, 4: {} })).toEqual([])

    expect(
      flattenChainIdToAddressTo({
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

    expect(flattenChainIdToAddressTo({ 1: { '0x1': [1, 2, 3], '0x2': 4 } })).toEqual([[1, 2, 3], 4])
  })
})
