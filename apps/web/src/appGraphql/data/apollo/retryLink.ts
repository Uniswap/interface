import { RetryLink } from '@apollo/client/link/retry'

/**
 * Operations that should retry on network failure.
 * These are queries used by useUpdateManualOutage hooks that power the outage banner.
 */
const RETRY_OPERATIONS = new Set([
  // Transaction queries
  'V4TokenTransactions',
  'V3TokenTransactions',
  'V2TokenTransactions',
  'V4Transactions',
  'V3Transactions',
  'V2Transactions',
  // Pool queries
  'TopV4Pools',
  'TopV3Pools',
  'TopV2Pairs',
])

/**
 * Creates an Apollo RetryLink that retries specific operations on network failure.
 * Uses exponential backoff with jitter to avoid thundering herd.
 */
export function getRetryLink(): RetryLink {
  return new RetryLink({
    delay: {
      initial: 1000,
      max: 10000,
      jitter: true,
    },
    attempts: {
      max: 3,
      retryIf: (error, operation) => {
        if (!RETRY_OPERATIONS.has(operation.operationName)) {
          return false
        }
        // Only retry on network errors, not GraphQL errors (validation, auth, etc.)
        return !!error?.networkError
      },
    },
  })
}
