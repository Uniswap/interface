import { DappInfo, dappStore } from 'src/app/features/dapp/store'
import { getCapitalizedDisplayNameFromTab } from 'src/app/features/dapp/utils'
import { externalDappMessageChannel } from 'src/background/messagePassing/messageChannels'
import {
  ExtensionChainChange,
  ExtensionToDappRequestType,
  UpdateConnectionRequest,
} from 'src/background/messagePassing/types/requests'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { chainIdToHexadecimalString } from 'uniswap/src/features/chains/utils'
import { Account } from 'wallet/src/features/wallet/accounts/types'
import { getProviderSync } from 'wallet/src/features/wallet/context'

export async function saveDappChain(dappUrl: string, chainId: UniverseChainId): Promise<void> {
  dappStore.updateDappLatestChainId(dappUrl, chainId)
  const provider = getProviderSync(chainId)

  const response: ExtensionChainChange = {
    type: ExtensionToDappRequestType.SwitchChain,
    providerUrl: provider.connection.url,
    chainId: chainIdToHexadecimalString(chainId),
  }

  await externalDappMessageChannel.sendMessageToTabUrl(dappUrl, response)
}

export async function saveDappConnection({
  dappUrl,
  account,
  iconUrl,
}: {
  dappUrl: string
  account: Account
  iconUrl?: string
}): Promise<void> {
  const displayName = await getCapitalizedDisplayNameFromTab(dappUrl)

  const initialProperties: Partial<DappInfo> = {}

  if (displayName) {
    initialProperties.displayName = displayName
  }

  if (iconUrl) {
    initialProperties.iconUrl = iconUrl
  }

  dappStore.saveDappActiveAccount({ dappUrl, account, initialProperties })
  await updateConnectionFromExtension(dappUrl)
}

export async function removeDappConnection(dappUrl: string, account?: Account): Promise<void> {
  dappStore.removeDappConnection(dappUrl, account)
  await updateConnectionFromExtension(dappUrl)
}

async function updateConnectionFromExtension(dappUrl: string): Promise<void> {
  const connectedWallets = dappStore.getDappOrderedConnectedAddresses(dappUrl) ?? []
  const response: UpdateConnectionRequest = {
    type: ExtensionToDappRequestType.UpdateConnections,
    addresses: connectedWallets,
  }

  await externalDappMessageChannel.sendMessageToTabUrl(dappUrl, response)
}

/**
 * Set the display name of a dapp from the tab title
 * @param dappUrl - extracted url for dapp
 */
export async function updateDisplayNameFromTab(dappUrl: string): Promise<void> {
  // do not update if dapp is not in state
  if (!dappStore.getDappInfo(dappUrl)) {
    return
  }

  const displayName = await getCapitalizedDisplayNameFromTab(dappUrl)

  // no-op if display name isn't found (prevents overwriting existing display name)
  if (!displayName) {
    return
  }

  dappStore.updateDappDisplayName(dappUrl, displayName)
}

export async function updateDappConnectedAddressFromExtension(address: Address): Promise<void> {
  dappStore.updateDappConnectedAddress(address)
  const connectedDapps = dappStore.getConnectedDapps(address)
  for (const dappUrl of connectedDapps) {
    await updateConnectionFromExtension(dappUrl)
  }
}

export async function removeAllDappConnectionsForAccount(account: Account): Promise<void> {
  const connectedDapps = dappStore.getConnectedDapps(account.address)
  dappStore.removeAccountDappConnections(account)
  for (const dappUrl of connectedDapps) {
    await updateConnectionFromExtension(dappUrl)
  }
}

export async function removeAllDappConnectionsFromExtension(): Promise<void> {
  const dappUrls = dappStore.getDappUrls()
  for (const dappUrl of dappUrls) {
    const response: UpdateConnectionRequest = {
      type: ExtensionToDappRequestType.UpdateConnections,
      addresses: [],
    }
    await externalDappMessageChannel.sendMessageToTabUrl(dappUrl, response)
  }
  dappStore.removeAllDappConnections()
}
