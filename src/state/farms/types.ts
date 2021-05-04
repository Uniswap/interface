export interface Farm {
  pid: number
  id: string
  rewardPerBlock: string
  accRewardPerShare: string
  totalStake: string
  stakeToken: string
  startBlock: number
  endBlock: number
  lastRewardBlock: number
  token0?: any
  token1?: any
  amp: number
  userData?: {
    allowance?: string
    tokenBalance?: string
    stakedBalance?: string
    earnings?: string
  }
}

export interface FarmUserData {
  pid: number
  allowance?: string
  tokenBalance?: string
  stakedBalance?: string
  earnings?: string
}
