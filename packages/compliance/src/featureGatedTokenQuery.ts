import { skipToken, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { RestrictionReason } from '@uniswap/client-compliancev2/dist/uniswap/compliance/v1/api_pb'
import {
  type ComplianceTokenInput,
  fetchFeatureGatedToken,
  setTokenAcknowledgement,
} from '@universe/compliance/src/client'
import { useTokenReasonsOverride } from '@universe/compliance/src/devComplianceOverride'
import { useComplianceClient } from '@universe/compliance/src/useComplianceClient'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { ONE_MINUTE_MS } from 'utilities/src/time/time'

const FIVE_MINUTES_MS = ONE_MINUTE_MS * 5

/**
 * Returns the deny-list reasons for the given token. Empty when the token is
 * not blocked or when the call hasn't resolved yet. Consumers decide which
 * reasons map to their UX (e.g. only `DERIVATIVE` triggers the geo-restriction
 * card).
 */
export function useTokenComplianceStatus(token: ComplianceTokenInput | undefined): {
  reasons: RestrictionReason[]
  isLoading: boolean
} {
  const client = useComplianceClient()
  // Dev-only override (see devComplianceOverride); no-op in prod.
  const override = useTokenReasonsOverride()
  const isOverridden = token !== undefined && override !== undefined
  const { data, isLoading } = useQuery({
    queryKey: [ReactQueryCacheKey.Compliance, 'featureGatedToken', token?.chainId, token?.address],
    queryFn: token && !isOverridden ? () => fetchFeatureGatedToken(client, token) : skipToken,
    staleTime: FIVE_MINUTES_MS,
  })
  if (isOverridden) {
    return { reasons: override, isLoading: false }
  }
  return {
    reasons: data?.reasons ?? [],
    isLoading,
  }
}

/**
 * Acknowledges a single ack-gated token, then invalidates its
 * `featureGatedToken` query so the next read flips `REQUIRES_ACKNOWLEDGEMENT`
 * to `ACKNOWLEDGED`. Invalidation is mandatory: the set RPC returns an empty
 * response, so without it the UI would not update until the 5-minute stale
 * time elapses. The invalidation key must match `useTokenComplianceStatus`.
 */
export function useSetTokenAcknowledgement(): {
  acknowledgeToken: (token: ComplianceTokenInput) => Promise<void>
  isPending: boolean
} {
  const client = useComplianceClient()
  const queryClient = useQueryClient()
  const { mutateAsync, isPending } = useMutation({
    mutationFn: (token: ComplianceTokenInput) => setTokenAcknowledgement(client, token),
    onSuccess: async (_result, token) => {
      await queryClient.invalidateQueries({
        queryKey: [ReactQueryCacheKey.Compliance, 'featureGatedToken', token.chainId, token.address],
      })
    },
  })
  return { acknowledgeToken: mutateAsync, isPending }
}
