import { ChainId } from 'wallet/src/constants/chains'

// Requests outgoing from the extension to the injected script
export enum ExtensionRequestType {
  Disconnect = 'Disconnect',
  SwitchChain = 'SwitchChain',
}

// Request from extension background script to content script
export enum ExtensionToContentScriptRequestType {
  InjectAsset = 'InjectAsset',
  InjectedAssetRemove = 'InjectedAssetRemove',
}

export interface BaseExtensionRequest {
  type: ExtensionRequestType | ExtensionToContentScriptRequestType
}

export interface ExtensionChainChange extends BaseExtensionRequest {
  type: ExtensionRequestType.SwitchChain
  chainId: ChainId
  providerUrl: string
}

export interface DisconnectResponse extends BaseExtensionRequest {
  type: ExtensionRequestType.Disconnect
}

export interface InjectAssetRequest extends BaseExtensionRequest {
  assetType: 'frame'
  filename: string
}

export interface InjectFrameRequest extends InjectAssetRequest {
  type: ExtensionToContentScriptRequestType.InjectAsset
}

export interface InjectedAssetRemoveRequest extends InjectAssetRequest {
  type: ExtensionToContentScriptRequestType.InjectedAssetRemove
}
