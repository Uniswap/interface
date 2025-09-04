import { Percent } from '@uniswap/sdk-core'
import type { GeneratedIcon } from 'ui/src'
import { Trade } from 'uniswap/src/features/transactions/swap/types/trade'

export type RoutingHop =
  | {
      type: 'uniswapPool'
      inputCurrencyId: string
      outputCurrencyId: string
      poolType: 'V2' | 'V3' | 'V4'
      fee: number // Basis points
      isDynamic?: boolean
    }
  | {
      type: 'genericHop'
      inputCurrencyId: string
      outputCurrencyId: string
      name: string // Name for the hop (for example, the name of the AMM: Orca, Raydium, etc.)
    }

// Route entry with percentage split
export interface RoutingDiagramEntry {
  percent: Percent
  path: RoutingHop[]
  protocolLabel: string // Display label for route badge: "V2", "V3", "V2 + V3", "Jupiter", etc.
}

// Provider interface
export interface RoutingProvider {
  name: string
  icon?: GeneratedIcon
  iconColor?: string
  getRoutingEntries: (trade: Trade) => RoutingDiagramEntry[]
  getDescription?: (t: (key: string) => string) => string
}
