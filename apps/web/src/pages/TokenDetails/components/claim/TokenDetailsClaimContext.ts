import { createContext, type ReactNode } from 'react'

/** A session's published slot: a card to paint, or a reservation whose content has not resolved yet. */
export interface TokenDetailsClaimSlot {
  card: ReactNode
  isReserved: boolean
}

/** sessionKey → published slot; the owner publishes, the responsive outlets paint. */
export const TokenDetailsClaimContext = createContext<ReadonlyMap<string, TokenDetailsClaimSlot>>(new Map())
