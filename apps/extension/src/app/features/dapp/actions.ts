import { dappStore } from 'src/app/features/dapp/store'
import { externalDappMessageChannel } from 'src/background/messagePassing/messageChannels'
import {
  ExtensionChainChange,
  ExtensionToDappRequestType,
  UpdateConnectionRequest,
} from 'src/background/messagePassing/types/requests'
import { chainIdToHexadecimalString } from 'uniswap/src/features/chains/utils'
import { WalletChainId } from 'uniswap/src/types/chains'
import { Account } from 'wallet/src/features/wallet/accounts/types'
import { getProviderSync } from 'wallet/src/features/wallet/context'

export async function saveDappChain(dappUrl: string, chainId: WalletChainId): Promise<void> {
  dappStore.updateDappLatestChainId(dappUrl, chainId)
  const provider = getProviderSync(chainId)

  const response: ExtensionChainChange = {
    type: ExtensionToDappRequestType.SwitchChain,
    providerUrl: provider.connection.url,
    chainId: chainIdToHexadecimalString(chainId),
  }

  await externalDappMessageChannel.sendMessageToTabUrl(dappUrl, response)
}

export async function saveDappConnection(dappUrl: string, account: Account): Promise<void> {
  dappStore.saveDappActiveAccount(dappUrl, account)
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

export async function updateDappConnectedAddressFromExtension(address: Address): Promise<void> {
  dappStore.updateDappConnectedAddress(address)
  const connectedDapps = dappStore.getConnectedDapps(address)
  for (const dappUrl of connectedDapps) {
    await updateConnectionFromExtension(dappUrl)
  }
}

export async function removeAllDappConnectionsForAccount(account: Account): Promise<void> {
  const connectedDapps = dappStore.getConnectedDapps(account.address)
  for (const dappUrl of connectedDapps) {
    await removeDappConnection(dappUrl, account)
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
