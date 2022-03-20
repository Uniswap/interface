import { ChainId } from '@dynamic-amm/sdk'

interface Reward {
  symbol: string
  logo: string
}

export interface UpcomingPool {
  poolToken1Symbol: string
  poolToken1Logo: string
  poolToken2Symbol: string
  poolToken2Logo: string
  startingIn?: string
  network: ChainId
  rewards: Reward[]
  information: string
}

export const UPCOMING_POOLS: UpcomingPool[] = []
