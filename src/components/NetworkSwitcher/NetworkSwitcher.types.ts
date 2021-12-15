import { ReactNode, RefObject } from 'react'
import { ChainId } from '@swapr/sdk'
import { Placement } from '@popperjs/core'
export interface NetworkSwitcherProps {
  children?: ReactNode
  show: boolean
  onOuterClick: () => void
  networksList: NetworksList[]
  placement?: Placement
  showWalletConnector?: boolean
  parentRef?: RefObject<HTMLElement>
  showEthOptionPopover?: boolean
}

export interface EthereumOptionPopoverProps {
  children: ReactNode
  show: boolean
}

export type NetworkOptionsPreset = {
  chainId: ChainId
  name: React.ReactNode
  logoSrc: string
  color: string
  tag?: string
}

export type NetworkOptions = {
  preset: NetworkOptionsPreset
  active?: boolean
  disabled?: boolean
  onClick?: any
}

export type NetworksList = {
  tag: string
  networks: NetworkOptions[]
}
