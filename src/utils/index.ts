import { getAddress } from '@ethersproject/address'
import { BigNumber } from '@ethersproject/bignumber'
import { AddressZero } from '@ethersproject/constants'
import { Contract } from '@ethersproject/contracts'
import { JsonRpcSigner, Web3Provider } from '@ethersproject/providers'
import { ChainId, Currency, CurrencyAmount, Percent, Token, WETH } from '@kyberswap/ks-sdk-core'
import dayjs from 'dayjs'
import { ethers } from 'ethers'
import JSBI from 'jsbi'
import Numeral from 'numeral'

import { GET_BLOCK, GET_BLOCKS } from 'apollo/queries'
import ZAP_STATIC_FEE_ABI from 'constants/abis/zap-static-fee.json'
import {
  DEFAULT_GAS_LIMIT_MARGIN,
  KNC,
  KNCL_ADDRESS,
  KNCL_ADDRESS_ROPSTEN,
  ROPSTEN_TOKEN_LOGOS_MAPPING,
  ZERO_ADDRESS,
} from 'constants/index'
import { NETWORKS_INFO } from 'constants/networks'
import store from 'state'

import CLAIM_REWARD_ABI from '../constants/abis/claim-reward.json'
import ROUTER_DYNAMIC_FEE_ABI from '../constants/abis/dmm-router-dynamic-fee.json'
import ROUTER_STATIC_FEE_ABI from '../constants/abis/dmm-router-static-fee.json'
import KS_ROUTER_STATIC_FEE_ABI from '../constants/abis/ks-router-static-fee.json'
import ROUTER_PRO_AMM from '../constants/abis/v2/ProAmmRouter.json'
import ZAP_ABI from '../constants/abis/zap.json'
import { TokenAddressMap } from '../state/lists/hooks'
import { getAuroraTokenLogoURL } from './auroraTokenMapping'
import { getAvaxMainnetTokenLogoURL } from './avaxMainnetTokenMapping'
import { getAvaxTestnetTokenLogoURL } from './avaxTestnetTokenMapping'
import { getBscMainnetTokenLogoURL } from './bscMainnetTokenMapping'
import { getBscTestnetTokenLogoURL } from './bscTestnetTokenMapping'
import { getCronosTokenLogoURL } from './cronosTokenMapping'
import { getEthereumMainnetTokenLogoURL } from './ethereumMainnetTokenMapping'
import { getFantomTokenLogoURL } from './fantomTokenMapping'
import { getMaticTokenLogoURL } from './maticTokenMapping'
import { getMumbaiTokenLogoURL } from './mumbaiTokenMapping'

// returns the checksummed address if the address is valid, otherwise returns false
export function isAddress(value: any): string | false {
  try {
    return getAddress(value)
  } catch {
    return false
  }
}

export function isAddressString(value: any): string {
  try {
    return getAddress(value)
  } catch {
    return ''
  }
}

export function getEtherscanLink(
  chainId: ChainId,
  data: string,
  type: 'transaction' | 'token' | 'address' | 'block',
): string {
  const prefix = NETWORKS_INFO[chainId].etherscanUrl

  switch (type) {
    case 'transaction': {
      return `${prefix}/tx/${data}`
    }
    case 'token': {
      return `${prefix}/token/${data}`
    }
    case 'block': {
      return `${prefix}/block/${data}`
    }
    case 'address':
    default: {
      return `${prefix}/address/${data}`
    }
  }
}

export function getEtherscanLinkText(chainId: ChainId): string {
  return NETWORKS_INFO[chainId].etherscanName
}

// shorten the checksummed version of the input address to have 0x + 4 characters at start and end
export function shortenAddress(address: string, chars = 4): string {
  const parsed = isAddress(address)
  if (!parsed) {
    throw Error(`Invalid 'address' parameter '${address}'.`)
  }
  return `${parsed.substring(0, chars + 2)}...${parsed.substring(42 - chars)}`
}

/**
 * Add a margin amount equal to max of 20000 or 20% of estimatedGas
 * total = estimate + max(20k, 20% * estimate)
 *
 * @param value BigNumber
 * @returns BigNumber
 */
export function calculateGasMargin(value: BigNumber): BigNumber {
  const defaultGasLimitMargin = BigNumber.from(DEFAULT_GAS_LIMIT_MARGIN)
  const gasMargin = value.mul(BigNumber.from(2000)).div(BigNumber.from(10000))

  return gasMargin.gte(defaultGasLimitMargin) ? value.add(gasMargin) : value.add(defaultGasLimitMargin)
}

// converts a basis points value to a sdk percent
export function basisPointsToPercent(num: number): Percent {
  return new Percent(JSBI.BigInt(num), JSBI.BigInt(10000))
}

export function calculateSlippageAmount(value: CurrencyAmount<Currency>, slippage: number): [JSBI, JSBI] {
  if (slippage < 0 || slippage > 10000) {
    throw Error(`Unexpected slippage value: ${slippage}`)
  }
  return [
    JSBI.divide(JSBI.multiply(value.quotient, JSBI.BigInt(10000 - slippage)), JSBI.BigInt(10000)),
    JSBI.divide(JSBI.multiply(value.quotient, JSBI.BigInt(10000 + slippage)), JSBI.BigInt(10000)),
  ]
}

// account is not optional
export function getSigner(library: Web3Provider, account: string): JsonRpcSigner {
  return library.getSigner(account).connectUnchecked()
}

// account is optional
export function getProviderOrSigner(library: Web3Provider, account?: string): Web3Provider | JsonRpcSigner {
  return account ? getSigner(library, account) : library
}

// account is optional
export function getContract(address: string, ABI: any, library: Web3Provider, account?: string): Contract {
  if (!isAddress(address) || address === AddressZero) {
    throw Error(`Invalid 'address' parameter '${address}'.`)
  }

  return new Contract(address, ABI, getProviderOrSigner(library, account) as any)
}
// account is optional
export function getContractForReading(address: string, ABI: any, library: ethers.providers.JsonRpcProvider): Contract {
  if (!isAddress(address) || address === AddressZero) {
    throw Error(`Invalid 'address' parameter '${address}'.`)
  }

  return new Contract(address, ABI, library)
}

// account is optional
export function getOldStaticFeeRouterContract(chainId: ChainId, library: Web3Provider, account?: string): Contract {
  return getContract(NETWORKS_INFO[chainId].classic.oldStatic?.router ?? '', ROUTER_STATIC_FEE_ABI, library, account)
}
// account is optional
export function getStaticFeeRouterContract(chainId: ChainId, library: Web3Provider, account?: string): Contract {
  return getContract(NETWORKS_INFO[chainId].classic.static.router, KS_ROUTER_STATIC_FEE_ABI, library, account)
}
// account is optional
export function getDynamicFeeRouterContract(chainId: ChainId, library: Web3Provider, account?: string): Contract {
  return getContract(NETWORKS_INFO[chainId].classic.dynamic?.router ?? '', ROUTER_DYNAMIC_FEE_ABI, library, account)
}

// account is optional
export function getProAmmRouterContract(chainId: ChainId, library: Web3Provider, account?: string): Contract {
  return getContract(NETWORKS_INFO[chainId].elastic.routers, ROUTER_PRO_AMM.abi, library, account)
}

// account is optional
export function getZapContract(
  chainId: ChainId,
  library: Web3Provider,
  account?: string,
  isStaticFeeContract?: boolean,
  isOldStaticFeeContract?: boolean,
): Contract {
  return getContract(
    isStaticFeeContract
      ? isOldStaticFeeContract
        ? NETWORKS_INFO[chainId].classic.oldStatic?.zap || ''
        : NETWORKS_INFO[chainId].classic.static.zap
      : NETWORKS_INFO[chainId].classic.dynamic?.zap || '',
    isStaticFeeContract && !isOldStaticFeeContract ? ZAP_STATIC_FEE_ABI : ZAP_ABI,
    library,
    account,
  )
}

export function getClaimRewardContract(
  chainId: ChainId,
  library: Web3Provider,
  account?: string,
): Contract | undefined {
  if (!NETWORKS_INFO[chainId].classic.claimReward) return
  return getContract(NETWORKS_INFO[chainId].classic.claimReward, CLAIM_REWARD_ABI, library, account)
}

export function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // $& means the whole matched string
}

export function isTokenOnList(defaultTokens: TokenAddressMap, currency?: Currency): boolean {
  if (currency?.isNative) return true
  return Boolean(currency instanceof Token && defaultTokens[currency.chainId]?.[currency.address])
}

export const toK = (num: string) => {
  return Numeral(num).format('0.[00]a')
}

export const toKInChart = (num: string, unit?: string) => {
  if (parseFloat(num) < 0.0000001) return `< ${unit ?? ''}0.0000001`
  if (parseFloat(num) >= 0.1) return (unit ?? '') + Numeral(num).format('0.[00]a')
  return (unit ?? '') + Numeral(num).format('0.[0000000]a')
}

// using a currency library here in case we want to add more in future
export const formatDollarFractionAmount = (num: number, digits: number) => {
  const formatter = new Intl.NumberFormat(['en-US'], {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
  return formatter.format(num)
}

export const formatDollarSignificantAmount = (num: number, minDigits: number, maxDigits?: number) => {
  const formatter = new Intl.NumberFormat(['en-US'], {
    style: 'currency',
    currency: 'USD',
    minimumSignificantDigits: minDigits,
    maximumSignificantDigits: maxDigits ?? minDigits,
  })
  return formatter.format(num)
}

export function formatNumberWithPrecisionRange(number: number, minPrecision = 2, maxPrecision = 2) {
  const options = {
    minimumFractionDigits: minPrecision,
    maximumFractionDigits: maxPrecision,
  }
  return number.toLocaleString(undefined, options)
}

export function formattedNum(number: string, usd = false, fractionDigits = 5) {
  if (number === '' || number === undefined) {
    return usd ? '$0' : 0
  }

  const num = parseFloat(number)

  if (num > 500000000) {
    return (usd ? '$' : '') + toK(num.toFixed(0))
  }

  if (num === 0) {
    if (usd) {
      return '$0'
    }
    return 0
  }

  if (num < 0.0001 && num > 0) {
    return usd ? '< $0.0001' : '< 0.0001'
  }

  if (num > 1000) {
    return usd ? formatDollarFractionAmount(num, 0) : Number(num.toFixed(0)).toLocaleString()
  }

  if (usd) {
    if (num < 0.1) {
      return formatDollarFractionAmount(num, 4)
    } else {
      return formatDollarFractionAmount(num, 2)
    }
  }

  return Number(num.toFixed(fractionDigits)).toLocaleString()
}

export function formattedNumLong(num: number, usd = false) {
  if (num === 0) {
    if (usd) {
      return '$0'
    }
    return '0'
  }

  if (num > 1000) {
    return usd ? formatDollarFractionAmount(num, 0) : Number(num.toFixed(0)).toLocaleString()
  }

  if (usd) return formatDollarSignificantAmount(num, 1, 4)

  return Number(num.toFixed(5)).toLocaleString()
}

/**
 * get standard percent change between two values
 * @param {*} valueNow
 * @param {*} value24HoursAgo
 */
export const getPercentChange = (valueNow: string, value24HoursAgo: string) => {
  const adjustedPercentChange =
    ((parseFloat(valueNow) - parseFloat(value24HoursAgo)) / parseFloat(value24HoursAgo)) * 100

  if (isNaN(adjustedPercentChange) || !isFinite(adjustedPercentChange)) {
    return 0
  }

  return adjustedPercentChange
}

export function getTimestampsForChanges(): [number, number, number] {
  const utcCurrentTime = dayjs()
  const t1 = utcCurrentTime.subtract(1, 'day').startOf('minute').unix()
  const t2 = utcCurrentTime.subtract(2, 'day').startOf('minute').unix()
  const tWeek = utcCurrentTime.subtract(1, 'week').startOf('minute').unix()
  return [t1, t2, tWeek]
}

export async function splitQuery(query: any, localClient: any, vars: any, list: any, skipCount = 100): Promise<any> {
  let fetchedData = {}
  let allFound = false
  let skip = 0

  while (!allFound) {
    let end = list.length
    if (skip + skipCount < list.length) {
      end = skip + skipCount
    }
    const sliced = list.slice(skip, end)
    const result = await localClient.query({
      query: query(...vars, sliced),
      fetchPolicy: 'no-cache',
    })
    fetchedData = {
      ...fetchedData,
      ...result.data,
    }
    if (Object.keys(result.data).length < skipCount || skip + skipCount > list.length) {
      allFound = true
    } else {
      skip += skipCount
    }
  }

  return fetchedData
}

/**
 * @notice Fetches first block after a given timestamp
 * @dev Query speed is optimized by limiting to a 600-second period
 * @param {Int} timestamp in seconds
 */
export async function getBlockFromTimestamp(timestamp: number, chainId?: ChainId) {
  const result = await NETWORKS_INFO[chainId || ChainId.MAINNET].blockClient.query({
    query: GET_BLOCK,
    variables: {
      timestampFrom: timestamp,
      timestampTo: timestamp + 600,
    },
    fetchPolicy: 'cache-first',
  })

  return result?.data?.blocks?.[0]?.number
}

/**
 * @notice Fetches block objects for an array of timestamps.
 * @dev blocks are returned in chronological order (ASC) regardless of input.
 * @dev blocks are returned at string representations of Int
 * @dev timestamps are returns as they were provided; not the block time.
 * @param {Array} timestamps
 */
export async function getBlocksFromTimestamps(
  timestamps: number[],
  chainId?: ChainId,
  skipCount = 500,
): Promise<{ timestamp: string; number: number }[]> {
  if (timestamps?.length === 0) {
    return []
  }

  const fetchedData = await splitQuery(
    GET_BLOCKS,
    NETWORKS_INFO[chainId || ChainId.MAINNET].blockClient,
    [],
    timestamps,
    skipCount,
  )
  const blocks: { timestamp: string; number: number }[] = []
  if (fetchedData) {
    for (const t in fetchedData) {
      if (fetchedData[t].length > 0) {
        blocks.push({
          timestamp: t.split('t')[1],
          number: fetchedData[t][0]['number'],
        })
      }
    }
  }
  return blocks
}

/**
 * gets the amount difference in 24h
 * @param {*} valueNow
 * @param {*} value24HoursAgo
 */
export const get24hValue = (valueNow: string, value24HoursAgo: string | undefined): number => {
  if (value24HoursAgo === undefined) {
    return 0
  }
  // get volume info for both 24 hour periods
  const currentChange = parseFloat(valueNow) - parseFloat(value24HoursAgo)

  return currentChange
}

export const getRopstenTokenLogoURL = (address: string) => {
  if (address.toLowerCase() === KNCL_ADDRESS_ROPSTEN.toLowerCase()) {
    return 'https://raw.githubusercontent.com/KyberNetwork/kyberswap-interface/develop/src/assets/images/KNCL.png'
  }

  if (ROPSTEN_TOKEN_LOGOS_MAPPING[address.toLowerCase()]) {
    address = ROPSTEN_TOKEN_LOGOS_MAPPING[address.toLowerCase()]
  }

  return `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/${isAddress(
    address,
  )}/logo.png`
}

export const getTokenLogoURL = (inputAddress: string, chainId?: ChainId): string => {
  let address = inputAddress
  if (address === ZERO_ADDRESS && chainId) {
    address = WETH[chainId].address
  }

  if (address.toLowerCase() === KNC[chainId as ChainId].address.toLowerCase()) {
    return 'https://raw.githubusercontent.com/KyberNetwork/kyberswap-interface/develop/src/assets/images/KNC.svg'
  }

  if (address.toLowerCase() === KNCL_ADDRESS.toLowerCase()) {
    return 'https://raw.githubusercontent.com/KyberNetwork/kyberswap-interface/develop/src/assets/images/KNCL.png'
  }

  // WBTC
  if (address.toLowerCase() === '0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f') {
    return 'https://assets.coingecko.com/coins/images/7598/thumb/wrapped_bitcoin_wbtc.png?1548822744'
  }

  let imageURL

  imageURL = store
    .getState()
    .lists.byUrl[NETWORKS_INFO[chainId || ChainId.MAINNET].tokenListUrl].current?.tokens.find(
      item => item.address.toLowerCase() === address.toLowerCase(),
    )?.logoURI
  if (imageURL) return imageURL

  switch (chainId) {
    //todo namgold: merge these adhoc func to tokenllist
    case ChainId.MAINNET:
      imageURL = getEthereumMainnetTokenLogoURL(address)
      break
    case ChainId.ROPSTEN:
      imageURL = getRopstenTokenLogoURL(address)
      break
    case ChainId.MATIC:
      imageURL = getMaticTokenLogoURL(address)
      break
    case ChainId.MUMBAI:
      imageURL = getMumbaiTokenLogoURL(address)
      break
    case ChainId.BSCTESTNET:
      imageURL = getBscTestnetTokenLogoURL(address)
      break
    case ChainId.BSCMAINNET:
      imageURL = getBscMainnetTokenLogoURL(address)
      break
    case ChainId.AVAXTESTNET:
      imageURL = getAvaxTestnetTokenLogoURL(address)
      break
    case ChainId.AVAXMAINNET:
      imageURL = getAvaxMainnetTokenLogoURL(address)
      break
    case ChainId.FANTOM:
      imageURL = getFantomTokenLogoURL(address)
      break
    case ChainId.CRONOS:
      imageURL = getCronosTokenLogoURL(address)
      break
    case ChainId.AURORA:
      imageURL = getAuroraTokenLogoURL(address)
      break
    case ChainId.ARBITRUM:
      imageURL = `https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/arbitrum/assets/${address}/logo.png`
      break
    default:
      imageURL = `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/${isAddress(
        address,
      )}/logo.png`
      break
  }

  return imageURL
}

export const getTokenSymbol = (token: Token, chainId?: ChainId): string => {
  if (chainId && token.address.toLowerCase() === WETH[chainId as ChainId].address.toLowerCase()) {
    return NETWORKS_INFO[chainId].nativeToken.symbol
  }

  return token.symbol || 'ETH'
}

export const nativeNameFromETH = (chainId: ChainId | undefined) => {
  if (!chainId) return 'ETH'
  return NETWORKS_INFO[chainId].nativeToken.symbol
}

// push unique
// return original instance if no change
export const pushUnique = <T>(array: T[] | undefined, element: T): T[] => {
  if (!array) return [element]

  const set = new Set<T>(array)

  if (set.has(element)) return array
  return [...array, element]
}

// delete unique
// return original instance if no change
export const deleteUnique = <T>(array: T[] | undefined, element: T): T[] => {
  if (!array) return []

  const set = new Set<T>(array)

  if (set.has(element)) {
    set.delete(element)
    return [...set]
  }
  return array
}
