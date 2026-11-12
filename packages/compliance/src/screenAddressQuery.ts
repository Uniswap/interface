import {
  type DataTag,
  type QueryClient,
  queryOptions,
  skipToken,
  type UndefinedInitialDataOptions,
  useMutation,
  type UseMutationOptions,
  type UseMutationResult,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { type ComplianceV2Client, type ScreenAddressInput, screenAddress } from '@universe/compliance/src/client'
import { useComplianceClient } from '@universe/compliance/src/useComplianceClient'
import { logger } from 'utilities/src/logger/logger'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { ONE_MINUTE_MS } from 'utilities/src/time/time'

const FIVE_MINUTES_MS = ONE_MINUTE_MS * 5

type ScreenAddressQueryKey = readonly [
  ReactQueryCacheKey.Compliance,
  'screenAddress',
  number | undefined,
  string | undefined,
]

// Spelled out rather than via `QueryOptionsResult`, whose branches don't admit a
// `skipToken` queryFn.
type ScreenAddressQueryOptions = UndefinedInitialDataOptions<boolean, Error, boolean, ScreenAddressQueryKey> & {
  queryKey: DataTag<ScreenAddressQueryKey, boolean, Error>
}

/**
 * Shared options for one address's screen. Every reader — the render-time hook, a
 * press-time screen, an imperative caller — goes through this factory, so they all
 * land on one cache entry per (chainId, address) and a press is served by, or joins,
 * a mounted observer's in-flight fetch.
 */
export function screenAddressQueryOptions(
  client: ComplianceV2Client,
  input: ScreenAddressInput | undefined,
): ScreenAddressQueryOptions {
  return queryOptions({
    queryKey: [ReactQueryCacheKey.Compliance, 'screenAddress', input?.chainId, input?.address] as ScreenAddressQueryKey,
    queryFn: input ? (): Promise<boolean> => screenAddress(client, input) : skipToken,
    staleTime: FIVE_MINUTES_MS,
    // A press while offline has to settle so it can fail open, not pause until reconnect.
    networkMode: 'always',
    refetchOnReconnect: true,
    // One quick retry. The app-wide default retries only an error carrying an HTTP
    // `status` >= 500, which a ConnectError never does, so a screen would otherwise get
    // none — and a screen that lands is also what warms the vendor cache `/swap` reads.
    retry: 1,
    retryDelay: 300,
  })
}

/**
 * Screens a wallet address against the compliance provider and reports whether it
 * should be blocked (e.g. sanctioned / OFAC-listed). Pass `undefined` to skip the
 * query (no address yet, or a view-only account you don't screen).
 *
 * `enabled: false` reads the shared cache entry without fetching: the observer still
 * sees a fetch another caller starts on the same key, so a surface that screens on
 * press rather than on render keeps reading its result here.
 *
 * A gateway wallet block (403 with a `walletBlocked` `ComplianceBlock` detail)
 * and the compliancev2 200 `{ block: true }` both resolve to `isBlocked: true`,
 * without retrying (see `screenAddress`).
 *
 * Otherwise fails open: `isBlocked` is `false` while the call is loading, on any
 * other error, and for unauthenticated callers — never read `false` as a
 * verified-clean signal. Gate the
 * action on `isBlocked || isBlockedLoading` at the call site if you need
 * fail-closed-while-pending.
 */
export function useIsBlockedAddress(
  input: ScreenAddressInput | undefined,
  { enabled = true }: { enabled?: boolean } = {},
): {
  isBlocked: boolean
  isBlockedLoading: boolean
} {
  const client = useComplianceClient()
  const { data, isLoading } = useQuery({ ...screenAddressQueryOptions(client, input), enabled })
  return {
    isBlocked: data ?? false,
    isBlockedLoading: isLoading,
  }
}

/**
 * Non-React counterpart of `useIsBlockedAddress`, for screening a user action rather
 * than a render. Answers from the shared cache entry like the hook, and only waits on
 * the network for a miss or a stale entry.
 *
 * Fails open on an error with nothing cached, transport failures included, so callers
 * gate on the returned boolean alone. A verdict already in the cache outlives a failed
 * refresh: see the fallback below. A caller screening several addresses for one action
 * resolves them together (`Promise.all`) rather than racing separate mutations.
 */
export async function fetchIsBlockedAddress(
  input: ScreenAddressInput | undefined,
  ctx: { queryClient: QueryClient; client: ComplianceV2Client },
): Promise<boolean> {
  if (!input) {
    return false
  }
  const options = screenAddressQueryOptions(ctx.client, input)
  try {
    return await ctx.queryClient.fetchQuery(options)
  } catch (error) {
    // A failed refresh must not downgrade a block the cache already holds. `fetchQuery`
    // refetches a stale entry and throws if that fails, while a mounted
    // `useIsBlockedAddress` keeps rendering the previous verdict — so returning `false`
    // here would let the press through for an address the UI still shows as blocked.
    const cached = ctx.queryClient.getQueryData(options.queryKey)
    logger.warn('screenAddressQuery', 'fetchIsBlockedAddress', 'Address screen failed', {
      error,
      cachedVerdict: cached,
    })
    return cached ?? false
  }
}

/**
 * The press-time screen's policy, split from the hook so it can be exercised without a
 * React renderer. Not part of the package's public surface — call sites take the hook.
 */
export function screenAddressMutationOptions(ctx: {
  queryClient: QueryClient
  client: ComplianceV2Client
}): UseMutationOptions<boolean, Error, ScreenAddressInput | undefined> {
  return {
    // Matches the query options. `useMutation` otherwise defaults to
    // `networkMode: 'online'`, which parks the press while offline instead of letting it
    // settle, and then fires a long-stale continuation on reconnect.
    networkMode: 'always',
    mutationFn: (input: ScreenAddressInput | undefined): Promise<boolean> => fetchIsBlockedAddress(input, ctx),
  }
}

/**
 * Screens an address on a user action instead of at render, against the same cache
 * entry as `useIsBlockedAddress`. Fails open.
 *
 * Needs no single-flight guard of its own: `mutate`'s per-call `onSuccess` fires only
 * for the latest call and never after unmount, and the fetch underneath dedupes by
 * key — so a double press is one request and one continuation.
 */
export function useScreenAddressOnPress(): UseMutationResult<boolean, Error, ScreenAddressInput | undefined> {
  const client = useComplianceClient()
  const queryClient = useQueryClient()
  return useMutation(screenAddressMutationOptions({ queryClient, client }))
}
