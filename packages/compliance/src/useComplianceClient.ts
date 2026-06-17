import type { ComplianceV2Client } from '@universe/compliance/src/client'
import { ComplianceClientContext } from '@universe/compliance/src/ComplianceClientContext'
import { useContext } from 'react'

/**
 * Returns the injected compliance v2 client. Throws when no
 * `ComplianceClientProvider` is mounted above the caller.
 */
export function useComplianceClient(): ComplianceV2Client {
  const client = useContext(ComplianceClientContext)

  if (!client) {
    throw new Error('useComplianceClient must be used within a ComplianceClientProvider')
  }

  return client
}
