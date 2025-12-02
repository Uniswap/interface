import { TradingApi } from '@universe/api'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { isMobileApp } from 'utilities/src/platform'
import { ONE_SECOND_MS } from 'utilities/src/time/time'

export const FLASHBLOCKS_INSTANT_BALANCE_TIMEOUT = isMobileApp ? 5 * ONE_SECOND_MS : 2 * ONE_SECOND_MS
export const NON_FLASHBLOCKS_INSTANT_BALANCE_BUTTON_DURATION = 1 * ONE_SECOND_MS

export const ERC20_TRANSFER_SIGNATURE = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'
export const NATIVE_WITHDRAWAL_SIGNATURE = '0x7fcf532c15f0a6db0bd6d0e038bea71d30d808c7d98cb3bf7268a95bf5081b65'

export const CHAIN_TO_UNIVERSAL_ROUTER_ADDRESS: Partial<Record<UniverseChainId, string[]>> = {
  [UniverseChainId.Unichain]: [
    '0x4D73A4411CA1c660035e4AECC8270E5DdDEC8C17',
    '0xef740bf23acae26f6492b10de645d6b98dc8eaf3',
  ],
  [UniverseChainId.UnichainSepolia]: [
    '0x8909Dc15e40173Ff4699343b6eB8132c65e18eC6',
    '0xf70536b3bcc1bd1a972dc186a2cf84cc6da6be5d',
  ],
}

export const FLASHBLOCKS_UI_SKIP_ROUTES: TradingApi.Routing[] = [
  TradingApi.Routing.WRAP,
  TradingApi.Routing.UNWRAP,
  TradingApi.Routing.BRIDGE,
  TradingApi.Routing.CHAINED,
]
