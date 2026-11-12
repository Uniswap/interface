import type { SharedEventName } from '@uniswap/analytics-events'
import { UniverseChainId } from '@universe/chains'
import type { TriggerButtonCompatSize } from '@universe/mycelium/trigger-button-compat'
import type { ReactNode } from 'react'
import type { TieredNetworkOptions } from 'uniswap/src/components/network/NetworkFilter/types'
import type { UniverseEventProperties } from 'uniswap/src/features/telemetry/types'
import { PlatformSplitStubError } from 'utilities/src/errors'

export type NetworkFilterTriggerConfig =
  | { variant: 'icon'; outlined?: boolean; chevronSize?: 16 | 20 }
  | { variant: 'pill'; size?: TriggerButtonCompatSize; showLabel?: boolean; transition?: string }
  | { variant: 'custom'; content: ReactNode }

type NetworkSelectionAnalytics = Pick<
  UniverseEventProperties[SharedEventName.ELEMENT_CLICKED],
  'page' | 'tab' | 'element' | 'hook_address'
>

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
  /** Names the outer trigger and makes it the only tab stop; inner trigger content becomes presentational. */
  triggerLabel?: string
  trigger?: NetworkFilterTriggerConfig
  placement?: 'bottom-start' | 'bottom-end'
  contentMaxHeight?: number
  selectionAnalytics?: NetworkSelectionAnalytics | ((chainId: UniverseChainId | null) => NetworkSelectionAnalytics)
  /** Web only: open as a dropdown on mobile instead of a bottom sheet, for filters already inside a sheet. */
  dropdownOnMobile?: boolean
}

export function NetworkFilter(_: NetworkFilterProps): JSX.Element {
  throw new PlatformSplitStubError('NetworkFilter')
}
