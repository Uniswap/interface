import { useDispatch } from 'react-redux'
import type { PositionInfo } from 'uniswap/src/features/positions/types'
import { submitPoolSpamReport } from 'uniswap/src/features/reporting/reports'
import { setPositionVisibility } from 'uniswap/src/features/visibility/slice'
import { useEvent } from 'utilities/src/react/hooks'

/**
 * Cross-platform core for reporting a liquidity position as spam.
 * Sends the analytics event and hides the position client-side; surfaces
 * (toast, navigation, etc.) layer on via `onSuccess`.
 */
export function useReportPositionAction(options?: {
  /** Fired after the analytics event and (when applicable) the visibility dispatch. */
  onSuccess?: (input: { position: PositionInfo; isVisible: boolean }) => void
}): (input: { position: PositionInfo; isVisible: boolean }) => void {
  const dispatch = useDispatch()

  return useEvent((input: { position: PositionInfo; isVisible: boolean }) => {
    const { position, isVisible } = input

    submitPoolSpamReport({
      chainId: position.chainId,
      poolId: position.poolId,
      version: position.version,
      token0: position.currency0Amount.currency,
      token1: position.currency1Amount.currency,
    })

    if (isVisible) {
      dispatch(
        setPositionVisibility({
          poolId: position.poolId,
          tokenId: position.tokenId,
          chainId: position.chainId,
          isVisible: false,
        }),
      )
    }

    options?.onSuccess?.(input)
  })
}
