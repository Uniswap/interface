import { ChainId, Token, WETH } from '@teleswap/sdk'
import { UNI, USDC, USDT } from 'constants/index'

import { Chef } from './farm/chef.enum'

export interface LiquidityAsset {
  name: string
  decimal: 18
  isLpToken: true
  isStable: boolean
  symbol: 'SLP' | 'VLP'

  tokenA: Token
  tokenB: Token
}

export interface TokenAsset {
  name: string
  decimal: number
  /**
   * `isLpToken` - this affect the way for our evaluation of the staked asset and its logo
   */
  isLpToken: false
  symbol: string
}

type StakingAsset = TokenAsset | LiquidityAsset

export interface FarmingPool {
  /**
   * this control whether the pool will be hidden or not (if user have no deposit in this pool)
   */
  isHidden?: boolean

  stakingAsset: StakingAsset
}

interface FarmConfig {
  chefType: Chef
  chainId: ChainId
  /**
   * @Note
   * here is the tricky part. `pools` must be added in the seqenuce of the `poolInfo` in chef's contract
   */
  pools: FarmingPool[]
}

export const CHAINID_TO_FARMING_CONFIG: { [chainId in ChainId]?: FarmConfig } = {
  [ChainId.OP_GOERLI]: {
    chefType: Chef.MINICHEF,
    chainId: ChainId.OP_GOERLI,
    pools: [
      {
        isHidden: true,
        // pid 0 -- ABANDONED for changing the swap contract
        stakingAsset: {
          name: 'USDC-USDT',
          decimal: 18,
          symbol: 'SLP',
          // if you disable a LP token pool, make sure to set `isLpToken` to `false`
          isLpToken: false
        }
      },
      {
        isHidden: true,
        // pid 1 -- ABANDONED for changing the swap contract
        stakingAsset: {
          name: 'USDC-USDT',
          decimal: 18,
          symbol: 'SLP',
          isLpToken: true,
          isStable: true,
          tokenA: USDC,
          tokenB: USDT
        }
      },
      {
        isHidden: true,
        // pid 2 -- ABANDONED for changing the swap contract
        stakingAsset: {
          name: 'USDT-ETH (Bad Evaluation)',
          decimal: 18,
          symbol: 'VLP',
          isLpToken: true,
          isStable: false,
          tokenA: USDT,
          tokenB: WETH[ChainId.OP_GOERLI]
        }
      },
      {
        isHidden: true,
        // pid 3 -- ABANDONED for changing the swap contract
        stakingAsset: {
          name: 'USDC-ETH',
          decimal: 18,
          symbol: 'VLP',
          isLpToken: true,
          isStable: false,
          tokenA: USDC,
          tokenB: WETH[ChainId.OP_GOERLI]
        }
      },
      {
        isHidden: true,
        // pid 4 -- ABANDONED for changing the swap contract
        stakingAsset: {
          name: 'USDC-USDT',
          decimal: 18,
          symbol: 'SLP',
          isLpToken: true,
          isStable: true,
          tokenA: USDC,
          tokenB: USDT
        }
      },
      {
        // pid 5
        stakingAsset: {
          name: 'USDC-USDT',
          decimal: 18,
          symbol: 'SLP',
          isLpToken: true,
          isStable: true,
          tokenA: USDC,
          tokenB: USDT
        }
      },
      {
        // pid 6
        stakingAsset: {
          name: 'USDC-SUSHI',
          decimal: 18,
          symbol: 'SLP',
          isLpToken: true,
          isStable: false,
          tokenA: USDC,
          tokenB: UNI[420]
        }
      }
    ]
  }
}
