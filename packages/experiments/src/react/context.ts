import { createContext } from 'react'
import type { ExperimentsClient } from '../client'

/**
 * Optional override for the experiments client used by the React hooks. When unset, the
 * hooks fall back to the shared `getExperimentsClient()` — the same instance the fetch
 * client uses — so reads and writes line up with no wiring. Provide a value only to inject
 * an isolated client (tests, advanced scoping).
 */
export const ExperimentsClientContext = createContext<ExperimentsClient | undefined>(undefined)
