/** How often to poll REST as a fallback for fresh prices */
export const REST_POLL_INTERVAL_MS = 30_000

/** If a cached price is older than this while WS reports connected,
 *  trigger REST polling as a safety net against silent WS failures. */
export const STALE_PRICE_THRESHOLD_MS = 60_000

/** Maximum tokens per REST request (backend limit) */
export const MAX_BATCH_SIZE = 100

/** Delay before flushing a batch (~one frame). Allows requests from separate
 *  macrotasks (e.g. React Query refetchInterval callbacks) to be grouped. */
export const BATCH_DELAY_MS = 16
