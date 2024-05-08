import { Provider } from '@web3-react/types'

export enum EIP6963Event {
  REQUEST_PROVIDER = 'eip6963:requestProvider',
  ANNOUNCE_PROVIDER = 'eip6963:announceProvider',
}

export interface EIP6963ProviderInfo {
  uuid: string
  name: string
  icon: string
  rdns: string
}

export interface EIP6963ProviderDetail {
  info: EIP6963ProviderInfo
  provider: Provider
}

export interface EIP6963AnnounceProviderEvent extends CustomEvent {
  type: EIP6963Event.ANNOUNCE_PROVIDER
  detail: EIP6963ProviderDetail
}
