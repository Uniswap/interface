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

  const errorWithData = error as { data?: { detail?: string; requestId?: string }; name?: string }
  const requestId = errorWithData.data?.requestId

  const title = errorWithData.data?.detail || errorWithData.name || defaultTitle
  return includeRequestId && title ? `${title}, id: ${requestId}` : title
}
