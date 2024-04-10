import { renderHook } from 'test-utils/render'

import { useNftAssetDetails } from './Details'

describe('useNftAssetDetails', () => {
  it('should handle listing.price.value of 1e-18 without crashing', () => {
    // Mock the useDetailsQuery hook
    const mockUseDetailsQuery = jest.fn(() => ({
      data: {
        nftAssets: {
          edges: [
            {
              node: {
                listings: {
                  edges: [
                    {
                      node: {
                        price: {
                          value: 1e-18,
                        },
                      },
                    },
                  ],
                },
              },
            },
          ],
        },
      },
      loading: false,
    }))
    jest.mock('../__generated__/types-and-hooks', () => ({
      useDetailsQuery: mockUseDetailsQuery,
    }))
    const { result } = renderHook(() => useNftAssetDetails('address', 'tokenId'))
    expect(result.current.data[0].priceInfo.ETHPrice).toBe('0')
  })
})
