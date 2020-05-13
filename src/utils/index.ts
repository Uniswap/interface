import { Contract } from '@ethersproject/contracts'
import { getAddress } from '@ethersproject/address'
import { AddressZero } from '@ethersproject/constants'
import { JsonRpcSigner, Web3Provider } from '@ethersproject/providers'
import { parseBytes32String } from '@ethersproject/strings'
import { BigNumber } from '@ethersproject/bignumber'

import { abi as IUniswapV2PairABI } from '@uniswap/v2-core/build/IUniswapV2Pair.json'
import { abi as IUniswapV2Router01ABI } from '@uniswap/v2-periphery/build/IUniswapV2Router01.json'
import { ROUTER_ADDRESS, SUPPORTED_THEMES } from '../constants'

import ERC20_ABI from '../constants/abis/erc20.json'
import ERC20_BYTES32_ABI from '../constants/abis/erc20_bytes32.json'
import { JSBI, Percent, TokenAmount } from '@uniswap/sdk'

export function isAddress(value: any): string | false {
  try {
    return getAddress(value.toLowerCase())
  } catch {
    return false
  }
}

export enum ERROR_CODES {
  TOKEN_SYMBOL = 1,
  TOKEN_DECIMALS = 2
}

const ETHERSCAN_PREFIXES = {
  1: '',
  3: 'ropsten.',
  4: 'rinkeby.',
  5: 'goerli.',
  42: 'kovan.'
}

export function getEtherscanLink(
  networkId: 1 | 3 | 4 | 5 | 42 | string | number,
  data: string,
  type: 'transaction' | 'address'
) {
  const prefix = `https://${ETHERSCAN_PREFIXES[networkId] || ETHERSCAN_PREFIXES[1]}etherscan.io`

  switch (type) {
    case 'transaction': {
      return `${prefix}/tx/${data}`
    }
    case 'address':
    default: {
      return `${prefix}/address/${data}`
    }
  }
}

export function getQueryParam(windowLocation: Location, name: string): string | undefined {
  const q = windowLocation.search.match(new RegExp('[?&]' + name + '=([^&#?]*)'))
  return q && q[1]
}

function parseUrlAddress(param: string): string {
  const addr = isAddress(getQueryParam(window.location, param))
  if (addr === false) {
    return ''
  }
  return addr
}

function parseUrlTokenAmount(paramName: string): string {
  const value = getQueryParam(window.location, paramName)
  if (!isNaN(Number(value))) {
    return ''
  }
  return value
}

export interface QueryParams {
  readonly inputTokenAddress: string
  readonly outputTokenAddress: string
  readonly inputTokenAmount: string
  readonly outputTokenAmount: string
}

export function getAllQueryParams(): QueryParams {
  return {
    inputTokenAddress: parseUrlAddress('inputTokenAddress'),
    outputTokenAddress: parseUrlAddress('outputTokenAddress'),
    inputTokenAmount: parseUrlTokenAmount('inputTokenAmount'),
    outputTokenAmount: parseUrlTokenAmount('outputTokenAmount')
  }
}

export function checkSupportedTheme(themeName: string) {
  if (themeName && themeName.toUpperCase() in SUPPORTED_THEMES) {
    return themeName.toUpperCase()
  }
  return null
}

export function shortenAddress(address: string, chars = 4): string {
  if (!isAddress(address)) {
    throw Error(`Invalid 'address' parameter '${address}'.`)
  }
  return `${address.substring(0, chars + 2)}...${address.substring(42 - chars)}`
}

export function calculateGasMargin(value: BigNumber): BigNumber {
  return value.mul(BigNumber.from(10000).add(BigNumber.from(1000))).div(BigNumber.from(10000)) // add 10%
}

// converts a basis points value to a sdk percent
export function basisPointsToPercent(num: number): Percent {
  return new Percent(JSBI.BigInt(num), JSBI.BigInt(10000))
}

export function calculateSlippageAmount(value: TokenAmount, slippage: number): [JSBI, JSBI] {
  if (slippage < 0 || slippage > 10000) {
    throw Error(`Unexpected slippage value: ${slippage}`)
  }
  return [
    JSBI.divide(JSBI.multiply(value.raw, JSBI.BigInt(10000 - slippage)), JSBI.BigInt(10000)),
    JSBI.divide(JSBI.multiply(value.raw, JSBI.BigInt(10000 + slippage)), JSBI.BigInt(10000))
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

  return new Contract(address, ABI, getProviderOrSigner(library, account))
}

// account is optional
export function getRouterContract(chainId, library, account) {
  return getContract(ROUTER_ADDRESS, IUniswapV2Router01ABI, library, account)
}

// account is optional
export function getExchangeContract(pairAddress, library, account) {
  return getContract(pairAddress, IUniswapV2PairABI, library, account)
}

// get token name
export async function getTokenName(tokenAddress, library) {
  if (!isAddress(tokenAddress)) {
    throw Error(`Invalid 'tokenAddress' parameter '${tokenAddress}'.`)
  }

  return getContract(tokenAddress, ERC20_ABI, library)
    .name()
    .catch(() =>
      getContract(tokenAddress, ERC20_BYTES32_ABI, library)
        .name()
        .then(parseBytes32String)
    )
    .catch(error => {
      error.code = ERROR_CODES.TOKEN_SYMBOL
      throw error
    })
}

// get token symbol
export async function getTokenSymbol(tokenAddress, library) {
  if (!isAddress(tokenAddress)) {
    throw Error(`Invalid 'tokenAddress' parameter '${tokenAddress}'.`)
  }

  return getContract(tokenAddress, ERC20_ABI, library)
    .symbol()
    .catch(() => {
      const contractBytes32 = getContract(tokenAddress, ERC20_BYTES32_ABI, library)
      return contractBytes32.symbol().then(parseBytes32String)
    })
    .catch(error => {
      error.code = ERROR_CODES.TOKEN_SYMBOL
      throw error
    })
}

// get token decimals
export async function getTokenDecimals(tokenAddress, library) {
  if (!isAddress(tokenAddress)) {
    throw Error(`Invalid 'tokenAddress' parameter '${tokenAddress}'.`)
  }

  return getContract(tokenAddress, ERC20_ABI, library)
    .decimals()
    .catch(error => {
      error.code = ERROR_CODES.TOKEN_DECIMALS
      throw error
    })
}

// get the ether balance of an address
export async function getEtherBalance(address, library) {
  if (!isAddress(address)) {
    throw Error(`Invalid 'address' parameter '${address}'`)
  }
  return library.getBalance(address)
}

// get the token balance of an address
export async function getTokenBalance(tokenAddress, address, library) {
  if (!isAddress(tokenAddress) || !isAddress(address)) {
    throw Error(`Invalid 'tokenAddress' or 'address' parameter '${tokenAddress}' or '${address}'.`)
  }

  return getContract(tokenAddress, ERC20_ABI, library).balanceOf(address)
}

export function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // $& means the whole matched string
}
