import { useAccount } from 'hooks/useAccount'
import { useAtom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import { useEffect } from 'react'
import { useUnitagsAddressQuery } from 'uniswap/src/data/apiClients/unitagsApi/useUnitagsAddressQuery'
import { shortenAddress } from 'utilities/src/addresses'
import { useAccountEffect, useEnsName } from 'wagmi'

const recentAccountIdentifierMapAtom = atomWithStorage<{
  [account in string]?: { unitag?: string; ensName?: string }
}>('recentAccountIdentifierMap', { recent: {} })

// Returns an identifier for the current or recently connected account, prioritizing unitag -> ENS name -> address
export function useAccountIdentifier() {
  const [recentAccountIdentifierMap, updateRecentAccountIdentifierMap] = useAtom(recentAccountIdentifierMapAtom)
  const account = useAccount()

  const { data: unitagResponse } = useUnitagsAddressQuery({
    params: account.address ? { address: account.address } : undefined,
  })
  const { data: ensNameResponse } = useEnsName({ address: account.address })

  // Clear the `recent` account identifier when the user disconnects
  useAccountEffect({
    onDisconnect() {
      updateRecentAccountIdentifierMap((prev) => ({ ...prev, recent: undefined }))
    },
  })

  // Keep the stored account identifiers synced with the latest unitag and ENS name
  useEffect(() => {
    if (!account.address) {
      return
    }
    updateRecentAccountIdentifierMap((prev) => {
      const updatedIdentifiers = prev[account.address as string] ?? {}
      if (unitagResponse) {
        updatedIdentifiers.unitag = unitagResponse.username
      }
      if (ensNameResponse) {
        updatedIdentifiers.ensName = ensNameResponse
      }

      return { ...prev, [account.address as string]: updatedIdentifiers, recent: updatedIdentifiers }
    })
  }, [account.address, unitagResponse, ensNameResponse, updateRecentAccountIdentifierMap])

  // If there is no account yet, optimistically use the stored `recent` account identifier
  const { unitag, ensName } =
    (account.address ? recentAccountIdentifierMap[account.address] : recentAccountIdentifierMap['recent']) ?? {}

  const accountIdentifier = unitag ?? ensName ?? shortenAddress(account.address)
  return {
    accountIdentifier,
    hasUnitag: Boolean(unitag),
    hasRecent: Boolean(Object.keys(recentAccountIdentifierMap['recent'] || {}).length),
  }
}
