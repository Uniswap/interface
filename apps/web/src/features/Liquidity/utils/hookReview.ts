import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import type { PositionState } from '~/features/Liquidity/Create/types'
import { normalizeHookForMatch } from '~/features/Liquidity/utils/normalizeHookForMatch'

/**
 * Whether the hook in position state still owes the user a review. One predicate for every site
 * that asks, so they can't drift: hooks only exist on v4, and both sides go through
 * `normalizeHookForMatch` so the zero address never counts as a hook and a URL-sourced checksum
 * matches an API-sourced lowercase.
 */
export function needsHookReview({
  hook,
  userApprovedHook,
  protocolVersion,
}: Pick<PositionState, 'hook' | 'userApprovedHook' | 'protocolVersion'>): boolean {
  const pendingHook = normalizeHookForMatch(hook)
  return (
    protocolVersion === ProtocolVersion.V4 &&
    pendingHook !== undefined &&
    pendingHook !== normalizeHookForMatch(userApprovedHook)
  )
}
