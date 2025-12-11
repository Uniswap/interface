import { ApolloError } from '@apollo/client'

/**
 * GraphQL error codes that indicate a server-side outage.
 * These are standard Apollo Server error codes, but not exported by @apollo/client.
 */
const OUTAGE_ERROR_CODES = {
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  TIMEOUT: 'TIMEOUT',
} as const

/**
 * Custom Uniswap API error types that indicate an outage.
 * These are returned at the root level of GraphQL errors from the Uniswap API,
 * not in the standard `extensions` field.
 */
const OUTAGE_ERROR_TYPES = {
  EXTERNAL_API_ERROR: 'ExternalAPIError',
} as const

/**
 * Type for Uniswap API GraphQL errors which include custom fields
 * like `errorType` at the root level (not in extensions).
 */
interface UniswapGraphQLError {
  message: string
  errorType?: string
  extensions?: {
    code?: string
    errorType?: string
    [key: string]: unknown
  }
}

/**
 * Classifies Apollo errors to determine if they indicate a genuine outage.
 * Only network errors, server errors, and timeouts are considered outages.
 *
 * @param error - The ApolloError to classify
 * @returns true if the error indicates a data outage, false otherwise
 */
export function isOutageError(error: ApolloError): boolean {
  // Network errors are strong indicators of outage
  if (error.networkError) {
    // Exclude 4xx client errors (bad request, unauthorized, etc)
    if (
      'statusCode' in error.networkError &&
      error.networkError.statusCode >= 400 &&
      error.networkError.statusCode < 500
    ) {
      return false
    }

    return true
  }

  // Check for server errors (5xx), timeouts, and external API errors
  if (error.graphQLErrors.length > 0) {
    for (const gqlError of error.graphQLErrors) {
      // Cast to our extended type since Uniswap API returns custom fields at root level
      const uniswapError = gqlError as UniswapGraphQLError

      // Check standard Apollo error codes in extensions
      const extensions = uniswapError.extensions
      if (
        extensions?.code === OUTAGE_ERROR_CODES.INTERNAL_SERVER_ERROR ||
        extensions?.code === OUTAGE_ERROR_CODES.TIMEOUT
      ) {
        return true
      }

      // Check custom Uniswap API error types at root level (not in extensions)
      // The Uniswap API returns errorType directly on the error object
      if (uniswapError.errorType === OUTAGE_ERROR_TYPES.EXTERNAL_API_ERROR) {
        return true
      }
    }
  }

  return false
}
