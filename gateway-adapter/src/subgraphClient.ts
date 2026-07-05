/**
 * Thin fetch-based GraphQL client for querying a chain's v3-subgraph (graph-node) endpoint.
 *
 * No caching / batching here — kept deliberately minimal for the skeleton. Add a small TTL cache
 * (e.g. per-(url,query,vars) for ~5s) in front of this if subgraph load becomes a concern.
 */

import fetch from 'cross-fetch'

export interface SubgraphError {
  message: string
  path?: Array<string | number>
}

export class SubgraphQueryError extends Error {
  constructor(
    message: string,
    public readonly url: string,
    public readonly errors?: SubgraphError[],
  ) {
    super(message)
    this.name = 'SubgraphQueryError'
  }
}

/**
 * Execute a GraphQL query against a subgraph URL and return `data` (typed by the caller).
 * Throws SubgraphQueryError on HTTP failure or GraphQL errors — the resolver decides whether that
 * bubbles up as a GraphQL error or degrades to `null` (it must never become fabricated data).
 */
export async function querySubgraph<T>(
  url: string,
  query: string,
  variables: Record<string, unknown> = {},
): Promise<T> {
  let res
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ query, variables }),
    })
  } catch (e) {
    throw new SubgraphQueryError(`Subgraph fetch failed: ${(e as Error).message}`, url)
  }

  if (!res.ok) {
    throw new SubgraphQueryError(`Subgraph HTTP ${res.status} ${res.statusText}`, url)
  }

  const json = (await res.json()) as { data?: T; errors?: SubgraphError[] }
  if (json.errors && json.errors.length > 0) {
    throw new SubgraphQueryError(
      `Subgraph GraphQL errors: ${json.errors.map((e) => e.message).join('; ')}`,
      url,
      json.errors,
    )
  }
  if (json.data === undefined || json.data === null) {
    throw new SubgraphQueryError('Subgraph returned no data', url)
  }
  return json.data
}
