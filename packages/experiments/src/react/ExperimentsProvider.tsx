import { type ReactNode } from 'react'
import type { ExperimentsClient } from '../client'
import { ExperimentsClientContext } from './context'

/**
 * Injects an experiments client into the React tree. Only needed to override the shared
 * singleton (tests, isolated scopes) — without it, the hooks already use the shared client.
 */
export function ExperimentsProvider({
  client,
  children,
}: {
  client: ExperimentsClient
  children: ReactNode
}): ReactNode {
  return <ExperimentsClientContext.Provider value={client}>{children}</ExperimentsClientContext.Provider>
}
