import { type PropsWithChildren, useState } from 'react'
import { useEvent } from 'utilities/src/react/hooks'
import { TokenDetailsAuctionErrorBoundary } from '~/pages/TokenDetails/components/auction/TokenDetailsAuctionErrorBoundary'
import { TokenDetailsClaimOwner } from '~/pages/TokenDetails/components/claim/TokenDetailsClaimCard'
import {
  TokenDetailsClaimContext,
  type TokenDetailsClaimSlot,
} from '~/pages/TokenDetails/components/claim/TokenDetailsClaimContext'

/** One transaction owner per claim session serves both responsive placements; canonical content stays outside its boundary. */
export function TokenDetailsClaimProvider({ children }: PropsWithChildren): JSX.Element {
  const [slots, setSlots] = useState<ReadonlyMap<string, TokenDetailsClaimSlot>>(() => new Map())
  const onPresentationChange = useEvent((sessionKey: string, slot: TokenDetailsClaimSlot | null) => {
    setSlots((previous) => {
      const next = new Map(previous)
      if (slot === null) {
        next.delete(sessionKey)
      } else {
        next.set(sessionKey, slot)
      }
      return next
    })
  })

  return (
    <>
      <TokenDetailsAuctionErrorBoundary>
        <TokenDetailsClaimOwner onPresentationChange={onPresentationChange} />
      </TokenDetailsAuctionErrorBoundary>
      <TokenDetailsClaimContext.Provider value={slots}>{children}</TokenDetailsClaimContext.Provider>
    </>
  )
}
