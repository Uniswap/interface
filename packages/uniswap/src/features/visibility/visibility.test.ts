/* biome-ignore-all lint/suspicious/noExplicitAny: legacy code needs review */

import { UniverseChainId } from 'uniswap/src/features/chains/types'
import {
  selectNftsVisibility,
  selectPositionsVisibility,
  selectTokensVisibility,
} from 'uniswap/src/features/visibility/selectors'
import {
  setNftVisibility,
  setTokenVisibility,
  togglePositionVisibility,
  VisibilityState,
  visibilityReducer,
} from 'uniswap/src/features/visibility/slice'
import { getUniquePositionId } from 'uniswap/src/features/visibility/utils'

jest.mock('uniswap/src/features/visibility/utils', () => ({
  getUniquePositionId: jest.fn(),
}))

const mockedGetUniquePositionId = getUniquePositionId as jest.Mock

describe('visibility slice', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return the initial state', () => {
    expect(visibilityReducer(undefined, { type: 'unknown' })).toEqual({
      positions: {},
      tokens: {},
      nfts: {},
    })
  })

  describe('togglePositionVisibility', () => {
    const poolId = 'pool1'
    const tokenId = 'token1'
    const chainId: UniverseChainId = 1
    const positionId = 'position1'

    beforeEach(() => {
      mockedGetUniquePositionId.mockReturnValue(positionId)
    })

    it('should toggle visibility from undefined to false', () => {
      const initialState: VisibilityState = {
        positions: {},
        tokens: {},
        nfts: {},
      }

      const action = togglePositionVisibility({ poolId, tokenId, chainId })
      const newState = visibilityReducer(initialState, action)

      expect(newState.positions[positionId]?.isVisible).toBe(false)
      expect(getUniquePositionId).toHaveBeenCalledWith({ poolId, tokenId, chainId })
    })

    it('should toggle visibility from false to true', () => {
      const initialState: VisibilityState = {
        positions: {
          [positionId]: { isVisible: false },
        },
        tokens: {},
        nfts: {},
      }

      const action = togglePositionVisibility({ poolId, tokenId, chainId })
      const newState = visibilityReducer(initialState, action)

      expect(newState.positions[positionId]?.isVisible).toBe(true)
    })

    it('should toggle visibility from true to false', () => {
      const initialState: VisibilityState = {
        positions: {
          [positionId]: { isVisible: true },
        },
        tokens: {
          [tokenId]: { isVisible: true },
        },
        nfts: {},
      }

      const action = togglePositionVisibility({ poolId, tokenId, chainId })
      const newState = visibilityReducer(initialState, action)

      expect(newState.positions[positionId]?.isVisible).toBe(false)
    })
  })

  describe('selectors', () => {
    it('selectPositionsVisibility should return correct visibility map', () => {
      const positionId1 = 'pos1'
      const positionId2 = 'pos2'

      const state: any = {
        visibility: {
          positions: {
            [positionId1]: { isVisible: true },
            [positionId2]: { isVisible: false },
          },
          tokens: {},
        },
      }

      const result = selectPositionsVisibility(state)
      expect(result).toEqual({
        [positionId1]: { isVisible: true },
        [positionId2]: { isVisible: false },
      })
    })

    it('selectPositionsVisibility should return empty object if context not present', () => {
      const state: any = {
        visibility: {
          positions: {},
          tokens: {},
        },
      }

      const result = selectPositionsVisibility(state)
      expect(result).toEqual({})
    })
  })

  describe('setTokenVisibility', () => {
    const currencyId = 'token1'

    it('should set token visibility from undefined to false', () => {
      const initialState: VisibilityState = {
        positions: {},
        tokens: {},
        nfts: {},
      }

      const action = setTokenVisibility({ currencyId, isVisible: false })
      const newState = visibilityReducer(initialState, action)

      expect(newState.tokens[currencyId]?.isVisible).toBe(false)
    })

    it('should set token visibility from false to true', () => {
      const initialState: VisibilityState = {
        positions: {},
        tokens: {
          [currencyId]: { isVisible: false },
        },
        nfts: {},
      }

      const action = setTokenVisibility({ currencyId, isVisible: true })
      const newState = visibilityReducer(initialState, action)

      expect(newState.tokens[currencyId]?.isVisible).toBe(true)
    })

    it('should set token visibility from true to false', () => {
      const initialState: VisibilityState = {
        positions: {},
        tokens: {
          [currencyId]: { isVisible: true },
        },
        nfts: {},
      }

      const action = setTokenVisibility({ currencyId, isVisible: false })
      const newState = visibilityReducer(initialState, action)

      expect(newState.tokens[currencyId]?.isVisible).toBe(false)
    })

    it('selectTokensVisibility should return empty object if context not present', () => {
      const state: any = {
        visibility: {
          positions: {},
          tokens: {},
          nfts: {},
        },
      }

      const result = selectTokensVisibility(state)
      expect(result).toEqual({})
    })
  })

  describe('setNftVisibility', () => {
    const nftKey = 'nft1'

    it('should set nft visibility from undefined to false', () => {
      const initialState: VisibilityState = {
        positions: {},
        tokens: {},
        nfts: {},
      }

      const action = setNftVisibility({ nftKey, isVisible: false })
      const newState = visibilityReducer(initialState, action)

      expect(newState.nfts[nftKey]?.isVisible).toBe(false)
    })

    it('should set nft visibility from false to true', () => {
      const initialState: VisibilityState = {
        positions: {},
        tokens: {},
        nfts: {
          [nftKey]: { isVisible: false },
        },
      }

      const action = setNftVisibility({ nftKey, isVisible: true })
      const newState = visibilityReducer(initialState, action)

      expect(newState.nfts[nftKey]?.isVisible).toBe(true)
    })

    it('should set nft visibility from true to false', () => {
      const initialState: VisibilityState = {
        positions: {},
        tokens: {},
        nfts: {
          [nftKey]: { isVisible: true },
        },
      }

      const action = setNftVisibility({ nftKey, isVisible: false })
      const newState = visibilityReducer(initialState, action)

      expect(newState.nfts[nftKey]?.isVisible).toBe(false)
    })

    it('selectNftsVisibility should return empty object if context not present', () => {
      const state: any = {
        visibility: {
          positions: {},
          tokens: {},
          nfts: {},
        },
      }

      const result = selectNftsVisibility(state)
      expect(result).toEqual({})
    })
  })
})
