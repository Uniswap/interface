import { useMutation } from '@tanstack/react-query'
import { useQueryClient } from '@tanstack/react-query'
import { fetchIsBlockedAddress, toScreenInput, useComplianceClient } from '@universe/compliance'
import { useState } from 'react'
import { useEvent } from 'utilities/src/react/hooks'

/** Which side of the transfer compliance refused. The sender is reported first. */
export type BlockedSendParty = 'sender' | 'recipient'

/** The pair a press screened, carried on the mutation so a verdict can be matched to it. */
type ScreenedParties = { senderAddress?: string; recipientAddress?: string }

/**
 * Screens the sender and the recipient when Send is pressed, and runs `onClear` only if
 * both come back clean.
 *
 * Send is the one flow with no backend call, so this client screen is the only screen it
 * has — unlike swap, where `/swap` refuses a blocked wallet server-side. It still fails
 * open on a compliance outage, per the fail-open policy.
 *
 * Both addresses are screened in one mutation rather than two. Two `mutate` calls on one
 * hook would resolve only the second one's continuation, and the pair has to settle
 * together to decide which party to name.
 */
export function useScreenSendOnPress({
  senderAddress,
  recipientAddress,
  chainId,
}: {
  senderAddress?: string
  recipientAddress?: string
  chainId: number
}): {
  screenSend: (onClear: () => void) => void
  /** Whether a screen is in flight, so the button can show a loader and refuse a second press. */
  isScreening: boolean
  /** Whether to show the blocked-address modal. */
  isBlocked: boolean
  /** The refused address, so the modal can name which party it was. */
  blockedAddress: string | undefined
  dismissBlocked: () => void
} {
  const client = useComplianceClient()
  const queryClient = useQueryClient()
  const [blockedParty, setBlockedParty] = useState<BlockedSendParty | undefined>(undefined)

  const { mutate, isPending } = useMutation({
    // Matches the compliance query options. `useMutation` otherwise defaults to
    // `networkMode: 'online'`, which parks an offline press instead of letting it settle
    // and fail open, then fires a long-stale continuation on reconnect.
    networkMode: 'always',
    mutationFn: async ({
      senderAddress: screenedSender,
      recipientAddress: screenedRecipient,
    }: ScreenedParties): Promise<BlockedSendParty | undefined> => {
      const [isSenderBlocked, isRecipientBlocked] = await Promise.all([
        fetchIsBlockedAddress(toScreenInput(screenedSender, chainId), { queryClient, client }),
        fetchIsBlockedAddress(toScreenInput(screenedRecipient, chainId), { queryClient, client }),
      ])
      if (isSenderBlocked) {
        return 'sender'
      }
      return isRecipientBlocked ? 'recipient' : undefined
    },
  })

  // The recipient field stays editable while the screen is in flight, so a verdict that
  // lands after the form has moved on says nothing about what would be sent now.
  const stillTheFormsParties = useEvent(
    (screened: ScreenedParties): boolean =>
      screened.senderAddress === senderAddress && screened.recipientAddress === recipientAddress,
  )

  const screenSend = useEvent((onClear: () => void) => {
    const screened: ScreenedParties = { senderAddress, recipientAddress }
    mutate(screened, {
      onSuccess: (party) => {
        if (!stillTheFormsParties(screened)) {
          return
        }
        if (party) {
          setBlockedParty(party)
        } else {
          onClear()
        }
      },
    })
  })

  const dismissBlocked = useEvent(() => setBlockedParty(undefined))

  // Resolved here rather than at the call site: the form screen is already at its
  // complexity ceiling, and the party-to-address mapping belongs with the party.
  const blockedAddress = blockedParty === 'sender' ? senderAddress : recipientAddress

  return { screenSend, isScreening: isPending, isBlocked: blockedParty !== undefined, blockedAddress, dismissBlocked }
}
