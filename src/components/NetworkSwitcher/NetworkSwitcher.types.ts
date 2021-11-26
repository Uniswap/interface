import { ReactNode, RefObject } from 'react'
import { ChainId } from '@swapr/sdk'
import { Placement } from '@popperjs/core'
export interface NetworkSwitcherProps {
  children?: ReactNode
  show: boolean
  onOuterClick: () => void
  networksList: NetworkList[]
  placement?: Placement
  showWalletConnector?: boolean
  parentRef?: RefObject<HTMLElement>
}

export interface EthereumOptionPopoverProps {
  children: ReactNode
  show: boolean
}

export type NetworkSwitcherOptionsPreset = {
  [K in ChainId]?: NetworkOptionProps
}

export type NetworkOptionProps = {
  onClick?: any
  header: React.ReactNode
  logoSrc?: string
  active?: boolean
  disabled?: boolean
  comingSoon?: boolean
  chainId?: ChainId
}

export type NetworkOptionsPreset = {
  chainId: ChainId
  name: string
  logoSrc: string
  color: string
  tag?: string
}

export type NetworkList = {
  tag: string
  networks: NetworkOptionProps[]
}
