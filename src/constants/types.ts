import { Token } from 'libs/sdk/src'

export interface FarmConfig {
  lpAddress: string
  token?: Token
  quoteToken?: Token
  multiplier?: string
  isCommunity?: boolean
  dual?: {
    rewardPerBlock: number
    earnLabel: string
    endBlock: number
  }
}
