/* eslint-disable @typescript-eslint/no-explicit-any */

import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { selectPositionsVisibility } from 'uniswap/src/features/visibility/selectors'
import { VisibilityState, togglePositionVisibility, visibilityReducer } from 'uniswap/src/features/visibility/slice'
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
      }

      const action = togglePositionVisibility({ poolId, tokenId, chainId })
      const newState = visibilityReducer(initialState, action)

      expect(newState.positions[positionId]?.isVisible).toBe(false)
      expect(getUniquePositionId).toHaveBeenCalledWith(poolId, tokenId, chainId)
    })

    it('should toggle visibility from false to true', () => {
      const initialState: VisibilityState = {
        positions: {
          [positionId]: { isVisible: false },
        },
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
        },
      }

      const result = selectPositionsVisibility(state)
      expect(result).toEqual({})
    })
  })
})
