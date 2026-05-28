/**
 * Shared ConnectRPC-over-HTTP helper for config-manager server clients.
 * POSTs JSON to `${baseUrl}${path}` — the ConnectRPC HTTP/JSON protocol.
 */

// oxlint-disable-next-line max-params -- verbatim signature from mission-control migration
export async function rpcPost<T>(
  baseUrl: string,
  path: string,
  headers: Record<string, string>,
  body: unknown,
): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10_000),
  })

  const text = await response.text()
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    return {} as T
  }

  if (!response.ok) {
    const msg =
      typeof parsed === 'object' && parsed !== null && 'message' in parsed
        ? String((parsed as { message: unknown }).message)
        : `HTTP ${response.status}`
    throw new Error(msg)
  }

  return parsed as T
}
