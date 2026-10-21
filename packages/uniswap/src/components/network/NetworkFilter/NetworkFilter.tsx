import { UniverseChainId } from '@universe/chains'
import type { TriggerButtonCompatSize } from '@universe/mycelium/trigger-button-compat'
import type { ReactNode } from 'react'
import type { TieredNetworkOptions } from 'uniswap/src/components/network/NetworkFilter/types'
import { PlatformSplitStubError } from 'utilities/src/errors'

export type NetworkFilterTriggerConfig =
  | { variant: 'icon'; outlined?: boolean }
  | { variant: 'pill'; size?: TriggerButtonCompatSize; showLabel?: boolean; transition?: string }
  | { variant: 'custom'; content: ReactNode }

export interface NetworkFilterProps {
  chainIds: UniverseChainId[]
  selectedChain: UniverseChainId | null
  onPressChain: (chainId: UniverseChainId | null) => void
  includeAllNetworks?: boolean
  tieredOptions?: TieredNetworkOptions
  allNetworksChainIds?: UniverseChainId[]
  forceAllNetworksLabel?: boolean
  footer?: ReactNode
  showSearchInput?: boolean
  trigger?: NetworkFilterTriggerConfig
  placement?: 'bottom-start' | 'bottom-end'
  contentMaxHeight?: number
  selectionAnalytics?: { page?: string; tab?: string }
  /** Web only: open as a dropdown on mobile instead of a bottom sheet, for filters already inside a sheet. */
  dropdownOnMobile?: boolean
}

export function NetworkFilter(_: NetworkFilterProps): JSX.Element {
  throw new PlatformSplitStubError('NetworkFilter')
}
