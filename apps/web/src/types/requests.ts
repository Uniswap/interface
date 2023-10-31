import { ChainId } from 'wallet/src/constants/chains'

// Requests outgoing from the extension to the injected script
export enum ExtensionToDappRequestType {
  UpdateConnections = 'UpdateConnections',
  SwitchChain = 'SwitchChain',
}

// Request from extension background script to content script
export enum ExtensionToContentScriptRequestType {
  InjectAsset = 'InjectAsset',
  InjectedAssetRemove = 'InjectedAssetRemove',
}

// Requests from background script to the extension sidebar
export enum BackgroundToExtensionRequestType {
  StoreInitialized = 'StoreInitialized',
  TabActivated = 'TabActivated',
}

export interface BaseExtensionRequest {
  type:
    | ExtensionToDappRequestType
    | ExtensionToContentScriptRequestType
    | BackgroundToExtensionRequestType
}

export interface ExtensionChainChange extends BaseExtensionRequest {
  type: ExtensionToDappRequestType.SwitchChain
  chainId: ChainId
  providerUrl: string
}

export interface UpdateConnectionRequest extends BaseExtensionRequest {
  type: ExtensionToDappRequestType.UpdateConnections
  addresses: Address[]
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
