import { ChainId } from 'wallet/src/constants/chains'

// Requests outgoing from the extension to the injected script
export enum ExtensionRequestType {
  Disconnect = 'Disconnect',
  SwitchChain = 'SwitchChain',
}

export interface BaseExtensionRequest {
  type: ExtensionRequestType
}

export interface ExtensionChainChange extends BaseExtensionRequest {
  type: ExtensionRequestType.SwitchChain
  chainId: ChainId
  providerUrl: string
}

export interface DisconnectResponse extends BaseExtensionRequest {
  type: ExtensionRequestType.Disconnect
}
