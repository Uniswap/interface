import { useAccount } from 'hooks/useAccount'
import { useAtom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useActiveSmartPool } from 'state/application/hooks'
import { useUnitagByAddress } from 'uniswap/src/features/unitags/hooks'
import { shortenAddress } from 'utilities/src/addresses'
import { useAccountEffect, useEnsName } from 'wagmi'

const recentAccountIdentifierMapAtom = atomWithStorage<{
  [account in string]?: { unitag?: string; ensName?: string }
}>('recentAccountIdentifierMap', { recent: {} })

// Returns an identifier for the current or recently connected account, prioritizing unitag -> ENS name -> address
export function useAccountIdentifier() {
  const [recentAccountIdentifierMap, updateRecentAccountIdentifierMap] = useAtom(recentAccountIdentifierMapAtom)
  // TODO: check if we can dynamically return correct target (smart pool or user wallet) in useAccount hook
  const { address: signerAddress } = useAccount()
  const activeSmartPool = useActiveSmartPool()
  const { pathname: page } = useLocation()

  // display user address if user does not have an operated smart pool
  const address =
    activeSmartPool.address && activeSmartPool.address !== '' && page !== '/send'
      ? activeSmartPool.address
      : signerAddress

  const { unitag: unitagResponse } = useUnitagByAddress(address)
  const { data: ensNameResponse } = useEnsName({ address: address as `0x${string}` })

  // Clear the `recent` account identifier when the user disconnects
  useAccountEffect({
    onDisconnect() {
      updateRecentAccountIdentifierMap((prev) => ({ ...prev, recent: undefined }))
    },
  })

  // Keep the stored account identifiers synced with the latest unitag and ENS name
  useEffect(() => {
    if (!address) {
      return
    }
    updateRecentAccountIdentifierMap((prev) => {
      const updatedIdentifiers = prev[address] ?? {}
      if (unitagResponse) {
        updatedIdentifiers.unitag = unitagResponse.username
      }
      if (ensNameResponse) {
        updatedIdentifiers.ensName = ensNameResponse
      }

      return { ...prev, [address]: updatedIdentifiers, recent: updatedIdentifiers }
    })
  }, [address, unitagResponse, ensNameResponse, updateRecentAccountIdentifierMap])

  // If there is no account yet, optimistically use the stored `recent` account identifier
  const { unitag, ensName } =
    (address ? recentAccountIdentifierMap[address] : recentAccountIdentifierMap['recent']) ?? {}

  const accountIdentifier = unitag ?? ensName ?? shortenAddress(address)
  return {
    accountIdentifier,
    hasUnitag: Boolean(unitag),
    hasRecent: Boolean(Object.keys(recentAccountIdentifierMap['recent'] || {}).length),
  }
}
