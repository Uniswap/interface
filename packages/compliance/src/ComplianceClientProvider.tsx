import { type ComplianceV2Client, createComplianceV2Client } from '@universe/compliance/src/client'
import { ComplianceClientContext } from '@universe/compliance/src/ComplianceClientContext'
import { createComplianceV2Transport } from '@universe/compliance/src/transport'
import { type JSX, type ReactNode, useState } from 'react'

/**
 * Provides a single compliance v2 client to the tree, created once from the
 * platform transport (`transport.web.ts` sends cookies for the web app). Mount it
 * above every consumer of `useTokenComplianceStatus` / `useComplianceClient`. Pass
 * `client` to inject a stub in tests.
 */
export function ComplianceClientProvider({
  children,
  client,
}: {
  children: ReactNode
  client?: ComplianceV2Client
}): JSX.Element {
  const [fallbackClient] = useState(() => createComplianceV2Client(createComplianceV2Transport()))

  return (
    <ComplianceClientContext.Provider value={client ?? fallbackClient}>{children}</ComplianceClientContext.Provider>
  )
}
