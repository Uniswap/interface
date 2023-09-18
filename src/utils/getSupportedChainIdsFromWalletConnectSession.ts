import type { SessionTypes } from '@walletconnect/types'
import { SupportedInterfaceChain } from 'constants/chains'

// Helper function to extract chainId from string in format 'eip155:{chainId}'
function getChainIdFromFormattedString(item: string): number | null {
  const splitItem = item.startsWith('eip155:') ? item.split(':') : []
  return splitItem.length > 1 && !isNaN(Number(splitItem[1])) ? Number(splitItem[1]) : null
}

export function getSupportedChainIdsFromWalletConnectSession(session?: SessionTypes.Struct): SupportedInterfaceChain[] {
  if (!session?.namespaces) return []

  const eip155Keys = Object.keys(session.namespaces)
  const namespaces = Object.values(session.namespaces)

  // Collect all arrays into one for unified processing
  const allItems = [
    ...eip155Keys,
    ...namespaces.flatMap((namespace) => namespace.chains),
    ...namespaces.flatMap((namespace) => namespace.accounts),
  ]

  // Process all items to extract chainIds
  const allChainIds = allItems
    .map((item) => {
      if (typeof item === 'string') {
        return getChainIdFromFormattedString(item)
      }
      // Check if the item is a number
      return isNaN(Number(item)) ? null : Number(item)
    })
    .filter((item) => item !== null) // Filter out any null values

  return Array.from(new Set(allChainIds)) as SupportedInterfaceChain[]
}
