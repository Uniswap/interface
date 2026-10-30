import { skipToken, useQuery, type UseQueryResult } from '@tanstack/react-query'
import { FetchError, type UseQueryApiHelperHookArgs } from '@universe/api'
import {
  MarginApiClient,
  marginRequestActionKey,
  marginRequestPositionId,
  marginRequestVenueKey,
  marginRequestWalletChainId,
  marginRequestWalletToken,
  type MarginActionKey,
  type MarginQuoteRequest,
  type MarginQuoteResponse,
} from 'uniswap/src/data/apiClients/tradingApi/MarginApiClient'
import { type MarginTokenDecimals } from 'uniswap/src/data/apiClients/tradingApi/marginQuoteView'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'

const MARGIN_QUOTE_MAX_RETRIES = 2

// Retry transient failures only. Infra failures (5xx, 429, 408) retry on every action key. The two
// arms of the dispatcher disagree on what a 422 means, so the action key selects that one policy: on
// `open` the routing 422 conflates upstream router timeouts with genuine no-liquidity, and a retry is
// the only way to recover the timeout case; on every manage key it is a business rejection (health
// floor, invalid leverage) whose retry just delays the message. Note isRateLimitFetchError's 412-429
// range would also match a business 422, which is why 429 is checked directly rather than delegated
// to it wholesale.
export function isTransientMarginQuoteError({
  error,
  actionKey,
}: {
  error: unknown
  actionKey?: MarginActionKey
}): boolean {
  if (!(error instanceof FetchError)) {
    return true // network / non-HTTP failure
  }
  const status = error.response.status
  if (status >= 500) {
    return true
  }
  return status === 429 || status === 408 || (actionKey === 'open' && status === 422)
}

export function marginQuoteRetry({
  actionKey,
}: {
  actionKey?: MarginActionKey
}): (failureCount: number, error: unknown) => boolean {
  return (failureCount, error) =>
    failureCount < MARGIN_QUOTE_MAX_RETRIES && isTransientMarginQuoteError({ error, actionKey })
}

// The one /margin/quote dispatcher query — every action key through a single cache namespace. The
// request object is itself the discriminator (the ten keys are structurally exclusive), so an open
// and a manage quote cannot collide, and two callers asking the same question share one fetch.
// The key PREFIX — see MARGIN_POSITIONS_QUERY_KEY for why this is not retyped at the call site.
export const MARGIN_QUOTE_QUERY_KEY = [ReactQueryCacheKey.TradingApi, 'margin/quote'] as const

// The request rides LAST in the key. `placeholderData` callbacks need it to decide whether the
// previous quote may be bridged onto the new one, and react-query hands them a bare `QueryKey` —
// so read it through here rather than indexing the tuple at the call site, and the key's shape
// stays owned by this module instead of being guessed at by every consumer. A key of another
// shape reports absent, which drops the bridge rather than bridging off the wrong element.
export function marginQuoteParamsFromKey(queryKey: readonly unknown[]): MarginQuoteRequest | undefined {
  if (queryKey.length !== MARGIN_QUOTE_QUERY_KEY.length + 1) {
    return undefined
  }
  return queryKey[queryKey.length - 1] as MarginQuoteRequest | undefined
}

/**
 * Whether a previous quote may stay on screen while a new one loads.
 *
 * The bridge exists so the size / before-after rows don't blank mid-edit, so what it has to refuse is
 * any change that re-DENOMINATES or re-TARGETS the figures: a different wallet, position, market leg,
 * direction, or payment leg. ONE predicate for the open and manage paths — spelled separately, the two
 * lists drifted apart twice, each closing an axis the other still bridged across.
 *
 * Absent params on either side is a refusal: there is nothing to compare, so nothing may carry over.
 */
export function isSameMarginQuoteSubject({
  previous,
  next,
}: {
  previous: MarginQuoteRequest | undefined
  next: MarginQuoteRequest | undefined
}): boolean {
  if (!previous || !next) {
    return false
  }
  return (
    // The envelope's own chain as well as the payment leg's: margin is pinned to one chain today, so
    // this cannot differ — but the axis list is the contract, and omitting a required field from it is
    // how the payment chain came to be missing in the first place.
    previous.positionChainId === next.positionChainId &&
    previous.swapper === next.swapper &&
    // The action KEY, not its contents: it is the only discriminator of the amount's denomination (a
    // deposit's rail is in the payment token, a withdrawal's in collateral), so bridging across it
    // shows one action's figures under another's. Comparing the key rather than the whole action object
    // keeps a leverage retarget bridging — that is the edit the bridge exists for — at the cost of one
    // blank frame when a retarget crosses 1:1 and flips between the increase and decrease keys.
    marginRequestActionKey(previous) === marginRequestActionKey(next) &&
    marginRequestPositionId(previous) === marginRequestPositionId(next) &&
    // The venue allowlist an `open` was quoted against. Toggling a venue in the preferences sheet
    // re-keys the query, and bridging across that keeps the excluded venue's LLTV-derived rows —
    // liquidation price, borrow rate — on screen until the new fetch lands. Unlike the axes above
    // these figures are re-SOURCED rather than re-denominated, so it is a staleness window rather
    // than wrong units; it belongs in the list all the same.
    marginRequestVenueKey(previous) === marginRequestVenueKey(next) &&
    previous.exposureToken === next.exposureToken &&
    previous.counterToken === next.counterToken &&
    previous.direction === next.direction &&
    // The payment leg: the equity a deposit buys is priced in ITS decimals, and every native token
    // shares one address sentinel, so the chain is as load-bearing as the token.
    marginRequestWalletToken(previous) === marginRequestWalletToken(next) &&
    marginRequestWalletChainId(previous) === marginRequestWalletChainId(next)
  )
}

export function useMarginQuoteQuery({
  params,
  tokenDecimals,
  ...rest
}: UseQueryApiHelperHookArgs<MarginQuoteRequest, MarginQuoteResponse> & {
  // Exposure/counter decimals the view renders with — resolved from the market by the caller, so the
  // adapter no longer keeps a second address-keyed copy. Derived from the request's tokens, so it does
  // not belong in the query key.
  tokenDecimals: MarginTokenDecimals
}): UseQueryResult<MarginQuoteResponse> {
  return useQuery<MarginQuoteResponse>({
    queryKey: [...MARGIN_QUOTE_QUERY_KEY, params],
    queryFn: params
      ? async (): Promise<MarginQuoteResponse> => await MarginApiClient.fetchMarginQuote(params, { tokenDecimals })
      : skipToken,
    ...rest,
    // AFTER the spread on purpose: the 422-on-open policy is the whole reason this hook exists rather
    // than a bare useQuery, and a caller spreading a shared options bag would otherwise replace it
    // silently — the retries would just stop, with nothing failing to say so.
    retry: marginQuoteRetry({ actionKey: params ? marginRequestActionKey(params) : undefined }),
  })
}
