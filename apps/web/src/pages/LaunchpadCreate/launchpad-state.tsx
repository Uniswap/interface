import { atomWithStorage } from 'jotai/utils'

export interface TokenomicsTableValues {
  index: number
  name: string
  amount: number
  unlockedAmount: number
  cliffInDays: number
  vestingInDays: number
}
export interface TeamTableValues {
  index: number
  name: string
  position: string
  imgUrl: string
  linkedin: string
  twitter: string
}

export interface ProjectTokenInfo {
  tokenAddress: string
  logoUrl: string
  description: string
  auditLinks: string
  website: string

  twitter: string
  telegram: string
  discord: string
  medium: string
  youtube: string
  farcaster: string

  tokenomics: TokenomicsTableValues[]
  teamMembers: TeamTableValues[]
}

export interface LaunchpadOptions {
  tokenInfo: ProjectTokenInfo

  tokenSale: {
    quoteToken: string
    owner: string
    startDate: string
    durationDays: string
    sellPrice: string
    releaseDurationDays: string
    cliffDurationDays: string
    initialReleaseRate: string
    cliffReleaseRate: string
    hardCapAsQuote: string
    softCapAsQuote: string
  }

  liquidity: {
    liquidityRate: string
    listingPrice: string
    liquidityFee: '100' | '500' | '3000' | '10000'
    liquidityRange: 'NARROW' | 'MEDIUM' | 'WIDE' | 'FULL'
    liquidityAction: 'BURN' | 'LOCK'
    lockDurationDays: string
  }
}

const defaultState: LaunchpadOptions = {
  tokenInfo: {
    tokenAddress: '',
    logoUrl: '',
    description: '',
    auditLinks: '',
    website: '',
    twitter: '',
    telegram: '',
    discord: '',
    medium: '',
    youtube: '',
    farcaster: '',
    tokenomics: [],
    teamMembers: [],
  },
  tokenSale: {
    quoteToken: '0x71e26d0E519D14591b9dE9a0fE9513A398101490',
    owner: '',
    startDate: '',
    durationDays: '3',
    sellPrice: '0',
    releaseDurationDays: '0',
    cliffDurationDays: '0',
    initialReleaseRate: '',
    cliffReleaseRate: '',
    hardCapAsQuote: '',
    softCapAsQuote: '',
  },
  liquidity: {
    liquidityRate: '50',
    listingPrice: '0',
    liquidityFee: '3000',
    liquidityRange: 'MEDIUM',
    liquidityAction: 'BURN',
    lockDurationDays: '123',
  },
}
export const launchpadParams = atomWithStorage<LaunchpadOptions>('ubestarter_options', defaultState)
