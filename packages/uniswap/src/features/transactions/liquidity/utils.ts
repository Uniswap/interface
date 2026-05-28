import { ConnectError } from '@connectrpc/connect'

// Takes the two potential errors from calls to the trading api and returns:
//   - false if there is no error
//   - a string with an error message if one can be parsed
//   - true if there is an error but no message could be parsed
// The calldata error takes precedence over the approval error for the message.
export function getErrorMessageToDisplay({
  calldataError,
  approvalError,
}: {
  calldataError: unknown
  approvalError?: unknown
}): string | boolean {
  if (calldataError) {
    return parseErrorMessageTitle(calldataError, { includeRequestId: true }) || true
  }

  if (approvalError) {
    return parseErrorMessageTitle(approvalError, { includeRequestId: true }) || true
  }

  return false
}

interface LegacyErrorStructure {
  data?: {
    detail?: string
    requestId?: string
  }
  name?: string
}

function isConnectError(error: unknown): error is ConnectError {
  return error instanceof ConnectError
}

function isLegacyError(error: unknown): error is LegacyErrorStructure {
  return typeof error === 'object' && error !== null && ('data' in error || 'name' in error)
}

function parseLegacyErrorMessage(
  error: LegacyErrorStructure,
  options: { defaultTitle?: string; includeRequestId?: boolean },
): string | undefined {
  const requestId = error.data?.requestId
  const title = error.data?.detail || error.name || options.defaultTitle

  return options.includeRequestId && title && requestId ? `${title}, id: ${requestId}` : title
}

function extractErrorNameFromRawMessage(rawMessage: string): string | undefined {
  // rawMessage format: "ResourceNotFound: BadRequest: FAILED_TO_ESTIMATE_GAS:{...json...}"
  // Extract the JSON substring and parse the "name" field from it
  const jsonStart = rawMessage.indexOf('{')
  if (jsonStart === -1) {
    return rawMessage
  }
  try {
    const parsed = JSON.parse(rawMessage.slice(jsonStart))
    return typeof parsed.name === 'string' ? (parsed.name as string) : rawMessage
  } catch {
    return undefined
  }
}

function parseConnectRpcErrorMessage(
  error: ConnectError,
  options: { defaultTitle?: string; includeRequestId?: boolean },
): string | undefined {
  const requestId = error.metadata.get('x-request-id')
  const errorName = extractErrorNameFromRawMessage(error.rawMessage)
  const title = errorName || options.defaultTitle

  return options.includeRequestId && title && requestId ? `${title}, id: ${requestId}` : title
}

export function parseErrorMessageTitle(
  error: unknown,
  { defaultTitle }: { defaultTitle: string; includeRequestId?: boolean },
): string
export function parseErrorMessageTitle(
  error: unknown,
  { includeRequestId }: { includeRequestId?: boolean },
): string | undefined
export function parseErrorMessageTitle(
  error: unknown,
  { defaultTitle, includeRequestId }: { defaultTitle?: string; includeRequestId?: boolean },
): string | undefined {
  if (!error) {
    return defaultTitle
  }

  if (isConnectError(error)) {
    return parseConnectRpcErrorMessage(error, { defaultTitle, includeRequestId })
  }

  if (isLegacyError(error)) {
    return parseLegacyErrorMessage(error, { defaultTitle, includeRequestId })
  }

  return defaultTitle
}
