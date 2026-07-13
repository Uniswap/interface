import type { ComplianceV2Client } from '@universe/compliance/src/client'
import { createContext } from 'react'

export const ComplianceClientContext = createContext<ComplianceV2Client | null>(null)
