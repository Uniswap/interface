import { BigNumberish } from '@ethersproject/bignumber'
import { PrimitiveAtom, atom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import invariant from 'tiny-invariant'

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

export type LaunchpadParamsStruct = {
  token: string
  quoteToken: string
  owner: string
  startDate: BigNumberish
  endDate: BigNumberish
  exchangeRate: BigNumberish
  releaseDuration: BigNumberish
  releaseInterval: BigNumberish
  cliffDuration: BigNumberish
  initialReleaseRate: BigNumberish
  cliffReleaseRate: BigNumberish
  hardCapAsQuote: BigNumberish
  softCapAsQuote: BigNumberish
  liquidityRate: BigNumberish
  liquidityFee: BigNumberish
  priceTick: BigNumberish
  tickLower: BigNumberish
  tickUpper: BigNumberish
  lockDuration: BigNumberish
}

export interface LaunchpadValidationResult {
  implementation: string
  params: LaunchpadParamsStruct
  infoCID: string
  creatorDisclaimerHash: string
  creatorDisclaimerSignature: string
  verifierSignature: string
  feeAmountWei: string
  tokensForSaleWei: string
  tokensForLiquidityWei: string
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
    durationDays: '',
    sellPrice: '',
    releaseDurationDays: '',
    cliffDurationDays: '0',
    initialReleaseRate: '',
    cliffReleaseRate: '0',
    hardCapAsQuote: '',
    softCapAsQuote: '',
  },
  liquidity: {
    liquidityRate: '50',
    listingPrice: '',
    liquidityFee: '3000',
    liquidityRange: 'MEDIUM',
    liquidityAction: 'BURN',
    lockDurationDays: '',
  },
}
export const launchpadParams = atomWithStorage<LaunchpadOptions>('ubestarter_options', defaultState)

export const launchpadValidationResult = atom<LaunchpadValidationResult | null>(null)

const signatureAtoms: Record<string, PrimitiveAtom<string>> = {
  '-': atomWithStorage<string>('ubestarter_creator_signature', ''),
}
export function getCreatorSignatureAtom(account?: string) {
  if (account) {
    account = account.toLowerCase()
    if (!signatureAtoms[account]) {
      signatureAtoms[account] = atomWithStorage<string>('ubestarter_creator_signature_' + account, '')
    }
    return signatureAtoms[account]
  }
  return signatureAtoms['-']
}

const isValidUrl = (urlString: string) => {
  try {
    return Boolean(new URL(urlString))
  } catch (e) {
    return false
  }
}

const HOUR = 60 * 60 * 1000
const DAY = 24 * HOUR
const MIN_START_DELAY = 1 * HOUR
const MAX_START_DELAY = 10 * DAY
const MIN_LAUNCHPAD_DURATION = 1 * HOUR
const MAX_LAUNCHPAD_DURATION = 7 * DAY

interface ValidationError {
  field: string
  message: string
}
function _checkOptions(
  options: LaunchpadOptions,
  tokenSymbol: string | undefined,
  minSoftCap: number | undefined,
  maxSoftCap: number | undefined
) {
  const info = options.tokenInfo
  invariant(
    info.tokenAddress.length == 42 && info.tokenAddress.startsWith('0x'),
    'tokenInfo.tokenAddress | Invalid token address'
  )
  invariant(tokenSymbol && tokenSymbol.length > 0, 'tokenInfo.tokenAddress | Invalid token address')
  invariant(info.logoUrl.length > 0, 'tokenInfo.logoUrl | Enter logo url')
  invariant(isValidUrl(info.logoUrl), 'tokenInfo.logoUrl | Invalid logo url')
  invariant(info.description.length > 0, 'tokenInfo.description | Enter description')
  invariant(info.website.length > 0, 'tokenInfo.website | Enter website url')
  invariant(isValidUrl(info.website), 'tokenInfo.website | Invalid website url')

  invariant(info.twitter.length == 0 || isValidUrl(info.twitter), 'tokenInfo.twitter | Invalid Twitter url')
  invariant(info.telegram.length == 0 || isValidUrl(info.telegram), 'tokenInfo.telegram | Invalid Telegram url')
  invariant(info.discord.length == 0 || isValidUrl(info.discord), 'tokenInfo.discord | Invalid Discord url')
  invariant(info.medium.length == 0 || isValidUrl(info.medium), 'tokenInfo.medium | Invalid Medium url')
  invariant(info.youtube.length == 0 || isValidUrl(info.youtube), 'tokenInfo.youtube | Invalid Youtube url')
  invariant(info.farcaster.length == 0 || isValidUrl(info.farcaster), 'tokenInfo.farcaster | Invalid Farcaster url')

  invariant(info.tokenomics.length > 0, 'tokenInfo.tokenomics | You should add at least 1 tokenomics item')

  const sale = options.tokenSale
  const now = Date.now() + 10 * 60 * 60

  const hardCapAsQuote = parseFloat(sale.hardCapAsQuote)
  invariant(hardCapAsQuote > 0, 'tokenSale.hardCapAsQuote | Invalid value')

  const softCapAsQuote = parseFloat(sale.softCapAsQuote)
  invariant(softCapAsQuote > 0, 'tokenSale.softCapAsQuote | Invalid value')
  if (minSoftCap) {
    invariant(softCapAsQuote >= minSoftCap, 'tokenSale.softCapAsQuote | Soft cap must be bigger than ' + minSoftCap)
  }
  if (maxSoftCap) {
    invariant(softCapAsQuote <= maxSoftCap, 'tokenSale.softCapAsQuote | Soft cap must be smaller than ' + maxSoftCap)
  }

  invariant(hardCapAsQuote > softCapAsQuote, 'tokenSale.hardCapAsQuote | Hard cap must be bigger than soft cap')

  const sellPrice = parseFloat(sale.sellPrice)
  invariant(isNaN(sellPrice) == false && sellPrice > 0, 'tokenSale.sellPrice | Invalid price')
  const exchangeRate = Math.floor((1 / sellPrice) * 100_000)
  invariant(exchangeRate > 0 && exchangeRate < 4_000_000_000, 'tokenSale.sellPrice | Price range error')

  const listingPrice = parseFloat(options.liquidity.listingPrice)
  invariant(listingPrice > 0, 'liquidity.listingPrice | Invalid listing price')
  invariant(listingPrice > sellPrice, 'liquidity.listingPrice | Listing price must be bigger than sell price')

  const startDate = new Date(sale.startDate)
  invariant(
    startDate.valueOf() >= now + MIN_START_DELAY,
    'tokenSale.startDate | Start date cannot be earlier than 3 days later'
  )
  invariant(
    startDate.valueOf() <= now + MAX_START_DELAY,
    'tokenSale.startDate | Start date cannot be later than 10 days later'
  )

  const durationDays = Math.floor(parseFloat(sale.durationDays))
  invariant(durationDays.toString() === sale.durationDays, 'tokenSale.durationDays | Value must be integer')
  const durationMs = durationDays * DAY
  invariant(durationMs >= MIN_LAUNCHPAD_DURATION, 'tokenSale.durationDays | Launchpad duration must be at least 1 day')
  invariant(durationMs <= MAX_LAUNCHPAD_DURATION, 'tokenSale.durationDays | Launchpad duration must be at most 7 day')

  const initialReleaseRate = parseFloat(sale.initialReleaseRate)
  invariant(
    initialReleaseRate >= 0 && initialReleaseRate <= 100,
    'tokenSale.initialReleaseRate | Enter a valid percentage'
  )

  const releaseDurationDays = Math.floor(parseFloat(sale.releaseDurationDays))
  invariant(
    releaseDurationDays.toString() === sale.releaseDurationDays,
    'tokenSale.releaseDurationDays | Value must be integer'
  )
  invariant(
    releaseDurationDays >= 0 && releaseDurationDays <= 365,
    'tokenSale.releaseDurationDays | Value must be between 1 and 365'
  )

  const liquidityRate = parseFloat(options.liquidity.liquidityRate)
  invariant(liquidityRate >= 20 && liquidityRate <= 100, 'liquidity.liquidityRate | Value must be between 20 and 100')

  if (options.liquidity.liquidityAction == 'LOCK') {
    const lockDurationDays = Math.floor(parseFloat(options.liquidity.lockDurationDays))
    invariant(
      lockDurationDays.toString() === options.liquidity.lockDurationDays,
      'liquidity.lockDurationDays | Value must be integer'
    )
    invariant(
      lockDurationDays >= 7 && lockDurationDays <= 365,
      'liquidity.lockDurationDays | Value must be between 7 and 365'
    )
  }
}

export function validateOptions(
  options: LaunchpadOptions,
  tokenSymbol: string | undefined,
  minSoftCap: number | undefined,
  maxSoftCap: number | undefined
): ValidationError | undefined {
  try {
    _checkOptions(options, tokenSymbol, minSoftCap, maxSoftCap)
  } catch (e: any) {
    const err = e.message.split(':')[1]
    if (!err) {
      console.log(e)
      return {
        field: '',
        message: 'unknown error',
      }
    }
    return {
      field: err.split('|')[0].trim(),
      message: err.split('|')[1].trim(),
    }
  }
  return
}
