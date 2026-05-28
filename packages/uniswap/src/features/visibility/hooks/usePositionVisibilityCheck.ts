import { useCallback } from 'react'
import { useSelector } from 'react-redux'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { selectPositionsVisibility } from 'uniswap/src/features/visibility/selectors'
import { getUniquePositionId } from 'uniswap/src/features/visibility/utils'
import { UniswapRootState } from 'uniswap/src/state'

type VisibilityCheckParams = {
  poolId: string
  tokenId: string | undefined
  chainId: UniverseChainId
  isFlaggedSpam?: boolean
}

export function usePositionVisibilityCheck(): (params: VisibilityCheckParams) => boolean {
  const positionVisibilities = useSelector((state: UniswapRootState) => selectPositionsVisibility(state))

  const isPositionVisible = useCallback(
    ({ poolId, tokenId, chainId, isFlaggedSpam = false }: VisibilityCheckParams): boolean => {
      const positionId = getUniquePositionId({ poolId, tokenId, chainId })
      const positionState = positionVisibilities[positionId]

      if (positionState === undefined) {
        // If undefined, default to visible unless flagged as spam by the API (i.e. the isHidden property on Position)
        return !isFlaggedSpam
      }

      return positionState.isVisible
    },
    [positionVisibilities],
  )

  return isPositionVisible
}
