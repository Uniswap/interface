import { ApolloClient, NormalizedCacheObject } from '@apollo/client'
import { BigNumber } from '@ethersproject/bignumber'
import { ChainId, Currency, CurrencyAmount, Percent, Token, WETH } from '@kyberswap/ks-sdk-core'
import { PublicKey } from '@solana/web3.js'
import dayjs from 'dayjs'
import JSBI from 'jsbi'
import Numeral from 'numeral'

import { GET_BLOCK, GET_BLOCKS } from 'apollo/queries'
import { ENV_LEVEL } from 'constants/env'
import { DEFAULT_GAS_LIMIT_MARGIN, ZERO_ADDRESS } from 'constants/index'
import { NETWORKS_INFO, NETWORKS_INFO_CONFIG, isEVM } from 'constants/networks'
import { KNC, KNCL_ADDRESS } from 'constants/tokens'
import { ENV_TYPE } from 'constants/type'
import { EVMWalletInfo, SUPPORTED_WALLET, SolanaWalletInfo, WalletInfo } from 'constants/wallets'
import store from 'state'
import { GroupedTxsByHash, TransactionDetails } from 'state/transactions/type'
import checkForBraveBrowser from 'utils/checkForBraveBrowser'

export const isWalletAddressSolana = async (addr: string) => {
  try {
    if (!addr) return false
    const publicKey = new PublicKey(addr)
    return await PublicKey.isOnCurve(publicKey.toBytes())
  } catch (err) {
    return false
  }
}

// returns the checksummed address if the address is valid, otherwise returns false
export function isAddress(chainId: ChainId, value: any): string | false {
  try {
    return new Token(chainId, value, 0).address
  } catch {
    return false
  }
}

export function isAddressString(chainId: ChainId, value: any): string {
  try {
    return new Token(chainId, value, 0).address
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

// shorten the checksummed version of the input address to have 0x + 4 characters at start and end
export function shortenAddress(chainId: ChainId, address: string, chars = 4, checksum = true): string {
  const parsed = isAddress(chainId, address)
  if (!parsed && checksum) {
    throw Error(`Invalid 'address' parameter '${address}' on chain ${chainId}.`)
  }
  const value = (checksum && parsed ? parsed : address) ?? ''
  return `${value.substring(0, chars + 2)}...${value.substring(42 - chars)}`
}

/**
 * Add a margin amount equal to max of 20000 or 20% of estimatedGas
 * total = estimate + max(20k, 20% * estimate)
 *
 * @param value BigNumber
 * @returns BigNumber
 */
export function calculateGasMargin(value: BigNumber, chainId?: ChainId): BigNumber {
  const defaultGasLimitMargin = BigNumber.from(DEFAULT_GAS_LIMIT_MARGIN)
  const needHigherGas = [ChainId.MATIC, ChainId.OPTIMISM].includes(chainId as ChainId)
  const gasMargin = value.mul(BigNumber.from(needHigherGas ? 5000 : 2000)).div(BigNumber.from(10000))

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

export function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // $& means the whole matched string
}

const toK = (num: string) => {
  return Numeral(num).format('0.[00]a')
}

export const toKInChart = (num: string, unit?: string) => {
  if (parseFloat(num) < 0.0000001) return `< ${unit ?? ''}0.0000001`
  if (parseFloat(num) >= 0.1) return (unit ?? '') + Numeral(num).format('0.[00]a')
  return (unit ?? '') + Numeral(num).format('0.[0000000]a')
}

// using a currency library here in case we want to add more in future
const formatDollarFractionAmount = (num: number, digits: number) => {
  const formatter = new Intl.NumberFormat(['en-US'], {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
  return formatter.format(num)
}

const formatDollarSignificantAmount = (num: number, minDigits: number, maxDigits?: number) => {
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

  if (num >= 1000) {
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

export async function splitQuery<ResultType, T, U>(
  query: (values: T[], ...vars: U[]) => import('graphql').DocumentNode,
  localClient: ApolloClient<NormalizedCacheObject>,
  list: T[],
  vars: U[],
  skipCount = 100,
): Promise<
  | {
      [key: string]: ResultType
    }
  | undefined
> {
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
      query: query(sliced, ...vars),
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
export async function getBlockFromTimestamp(timestamp: number, chainId: ChainId) {
  if (!isEVM(chainId)) return
  const result = await NETWORKS_INFO[chainId].blockClient.query({
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
  chainId: ChainId,
  skipCount = 500,
): Promise<{ timestamp: string; number: number }[]> {
  if (!isEVM(chainId)) return []
  if (timestamps?.length === 0) {
    return []
  }

  const fetchedData = await splitQuery<{ number: number }[], number, any>(
    GET_BLOCKS,
    NETWORKS_INFO[chainId].blockClient,
    timestamps,
    [],
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

export const getTokenLogoURL = (inputAddress: string, chainId: ChainId): string => {
  let address = inputAddress
  if (address === ZERO_ADDRESS) {
    address = WETH[chainId].address
  }

  if (chainId !== ChainId.ETHW) {
    if (address.toLowerCase() === KNC[chainId].address.toLowerCase()) {
      return 'https://raw.githubusercontent.com/KyberNetwork/kyberswap-interface/develop/src/assets/images/KNC.svg'
    }

    if (address.toLowerCase() === KNCL_ADDRESS.toLowerCase()) {
      return 'https://raw.githubusercontent.com/KyberNetwork/kyberswap-interface/develop/src/assets/images/KNCL.png'
    }

    // WBTC
    if (address.toLowerCase() === '0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f') {
      return 'https://assets.coingecko.com/coins/images/7598/thumb/wrapped_bitcoin_wbtc.png?1548822744'
    }
  }

  const imageURL = store.getState()?.lists?.mapWhitelistTokens?.[chainId]?.[address]?.logoURI
  return imageURL || ''
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

export const isEVMWallet = (wallet: WalletInfo): wallet is EVMWalletInfo =>
  !!(wallet as EVMWalletInfo).connector || !!(wallet as EVMWalletInfo).href
export const isSolanaWallet = (wallet: WalletInfo): wallet is SolanaWalletInfo => !!(wallet as SolanaWalletInfo).adapter

// https://docs.metamask.io/guide/ethereum-provider.html#basic-usage
// https://docs.cloud.coinbase.com/wallet-sdk/docs/injected-provider#properties
// Coin98 and Brave wallet is overriding Metamask. So at a time, there is only 1 exists
export const detectInjectedType = (): 'COIN98' | 'BRAVE' | 'METAMASK' | 'COINBASE' | 'TRUST_WALLET' | null => {
  const { ethereum } = window
  // When Coinbase wallet connected will inject selectedProvider property and some others props
  if (ethereum?.selectedProvider) {
    if (ethereum?.selectedProvider?.isMetaMask) return 'METAMASK'
    if (ethereum?.selectedProvider?.isCoinbaseWallet) return 'COINBASE'
  }

  if (ethereum?.isCoinbaseWallet) return 'COINBASE'

  if (ethereum?.isTrustWallet) return 'TRUST_WALLET'

  if (checkForBraveBrowser() && ethereum?.isBraveWallet) return 'BRAVE'

  if (ethereum?.isMetaMask) {
    if (ethereum?.isCoin98) {
      return 'COIN98'
    }
    return 'METAMASK'
  }
  return null
}

export const isOverriddenWallet = (wallet: SUPPORTED_WALLET) => {
  const injectedType = detectInjectedType()
  return (
    (wallet === 'COIN98' && injectedType === 'METAMASK') ||
    (wallet === 'METAMASK' && injectedType === 'COIN98') ||
    (wallet === 'BRAVE' && injectedType === 'COIN98') ||
    (wallet === 'COIN98' && injectedType === 'BRAVE') ||
    (wallet === 'COINBASE' && injectedType === 'COIN98') ||
    // Coin98 turned off override MetaMask in setting
    (wallet === 'COIN98' && window.coin98 && !window.ethereum?.isCoin98)
  )
}

export const filterTruthy = <T>(array: (T | undefined | null | false)[]): T[] => {
  return array.filter(Boolean) as T[]
}

export const findTx = (txs: GroupedTxsByHash | undefined, hash: string): TransactionDetails | undefined => {
  return txs
    ? txs?.[hash]?.[0] ||
        Object.values(txs)
          .flat()
          .find(tx => tx?.hash === hash)
    : undefined
}

export const isChristmasTime = () => {
  const currentTime = dayjs()
  return currentTime.month() === 11 && currentTime.date() >= 15
}

export const getLimitOrderContract = (chainId: ChainId) => {
  const { production, development } = NETWORKS_INFO_CONFIG[chainId]?.limitOrder ?? {}
  return ENV_LEVEL === ENV_TYPE.PROD ? production : development
}
