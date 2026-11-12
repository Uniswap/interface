import type { UniverseChainId } from '@universe/chains'
import type { ElementName } from 'uniswap/src/features/telemetry/constants'
import type { HookListStatus } from '~/features/Hooks/getHookListStatus'

export interface HookTableRow extends HookListStatus {
  id: string
  name: string | undefined
  address: string
  chainIds: UniverseChainId[]
  href: string
  customAccounting: boolean
  partialIndexing: boolean
  pools: number | null
  volume: number | null
  tvl: number | null
  testId: string
  analytics: {
    elementName: ElementName.HookListRow
    properties: {
      hook_address: string
      chain: string
      chain_id: UniverseChainId
      position: number
      sort: string
    }
  }
}
