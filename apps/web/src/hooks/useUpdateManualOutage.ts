import { ApolloError } from '@apollo/client'
import { GraphQLApi } from '@universe/api'
import { RESET, useAtomCallback } from 'jotai/utils'
import { useCallback, useEffect } from 'react'
import { manualChainOutageAtom } from 'state/outage/atoms'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useIsOffline } from 'utilities/src/connection/useIsOffline'
import { isOutageError } from 'utils/errors/isOutageError'

/**
 * Hook to automatically detect data outages based on GraphQL errors.
 *
 * Since RetryLink retries failed requests multiple times before surfacing errors to components,
 * any error that reaches this hook indicates a genuine outage. The banner is shown
 * immediately and dismissed on the next successful query.
 *
 * @param params - Configuration object
 * @param params.chainId - The chain ID to track errors for
 * @param params.errorV3 - GraphQL V3 error from Apollo query (if any)
 * @param params.errorV2 - GraphQL V2 error from Apollo query (if any)
 * @param params.trigger - Optional value to force effect re-execution (e.g. data timestamp or query loading state)
 */
export function useUpdateManualOutage({
  chainId,
  errorV3,
  errorV2,
  trigger,
}: {
  chainId?: UniverseChainId
  errorV3?: ApolloError
  errorV2?: ApolloError
  trigger?: unknown
}) {
  const isOffline = useIsOffline()

  const handleOutageUpdate = useAtomCallback(
    useCallback(
      (
        _get,
        set,
        {
          chainId,
          hasAnyOutageError,
          hasOutageErrorV2,
        }: { chainId: UniverseChainId; hasAnyOutageError: boolean; hasOutageErrorV2: boolean },
        // eslint-disable-next-line max-params -- useAtomCallback requires (get, set, arg) signature
      ) => {
        if (hasAnyOutageError) {
          set(
            manualChainOutageAtom,
            hasOutageErrorV2 ? { chainId, version: GraphQLApi.ProtocolVersion.V2 } : { chainId },
          )
        } else {
          set(manualChainOutageAtom, RESET)
        }
      },
      [],
    ),
  )

  // biome-ignore lint/correctness/useExhaustiveDependencies: trigger is intentionally included to force re-execution when its value changes
  useEffect(() => {
    if (!chainId || isOffline) {
      return
    }

    const hasOutageErrorV3 = Boolean(errorV3 && isOutageError(errorV3))
    const hasOutageErrorV2 = Boolean(errorV2 && isOutageError(errorV2))
    const hasAnyOutageError = hasOutageErrorV3 || hasOutageErrorV2

    handleOutageUpdate({ chainId, hasAnyOutageError, hasOutageErrorV2 })
  }, [chainId, errorV3, errorV2, isOffline, trigger, handleOutageUpdate])
}
