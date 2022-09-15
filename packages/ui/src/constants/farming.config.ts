import { ChainId, Token } from '@teleswap/sdk'

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
        // pid 0
        stakingAsset: {
          name: 'USDC-USDT sLP',
          decimal: 18,
          symbol: 'SLP',
          isLpToken: true,
          isStable: true,
          tokenA: new Token(ChainId.OP_GOERLI, '0x56c822f91C1DC40ce32Ae6109C7cc1D18eD08ECE', 6, 'USDC', 'USDC'),
          tokenB: new Token(ChainId.OP_GOERLI, '0x70aBC17e870366C336A5DAd05061828fEff76fF5', 6, 'USDT', 'USDT')
        }
      }
    ]
  }
}
