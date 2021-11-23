import { ReactNode, RefObject } from 'react'
import { ChainId } from '@swapr/sdk'
import { Placement } from '@popperjs/core'
export interface NetworkSwitcherProps {
  children?: ReactNode
  show: boolean
  onOuterClick: () => void
  options: NetworkOptionProps[]
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
}

export type NetworkOptionsPreset = {
  chainId: ChainId
  name: string
  logoSrc: string
  color: string
}

export type NetworkList = {
  tag: string
  networks: NetworkOptionsPreset[]
}
