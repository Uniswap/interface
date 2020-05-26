import { Contract } from '@ethersproject/contracts'
import { getAddress } from '@ethersproject/address'
import { AddressZero } from '@ethersproject/constants'
import { JsonRpcSigner, Web3Provider } from '@ethersproject/providers'
import { parseBytes32String } from '@ethersproject/strings'
import { BigNumber } from '@ethersproject/bignumber'

import { abi as IUniswapV2PairABI } from '@uniswap/v2-core/build/IUniswapV2Pair.json'
import { abi as IUniswapV2Router01ABI } from '@uniswap/v2-periphery/build/IUniswapV2Router01.json'
import { ROUTER_ADDRESS } from '../constants'

import ERC20_ABI from '../constants/abis/erc20.json'
import ERC20_BYTES32_ABI from '../constants/abis/erc20_bytes32.json'
import { ChainId, JSBI, Percent, TokenAmount } from '@uniswap/sdk'

// returns the checksummed address if the address is valid, otherwise returns false
export function isAddress(value: any): string | false {
  try {
    return getAddress(value)
  } catch {
    return false
  }
}

const ETHERSCAN_PREFIXES: { [chainId in ChainId]: string } = {
  1: '',
  3: 'ropsten.',
  4: 'rinkeby.',
  5: 'goerli.',
  42: 'kovan.'
}

export function getEtherscanLink(chainId: ChainId, data: string, type: 'transaction' | 'address'): string {
  const prefix = `https://${ETHERSCAN_PREFIXES[chainId] || ETHERSCAN_PREFIXES[1]}etherscan.io`

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

// shorten the checksummed version of the input address to have 0x + 4 characters at start and end
export function shortenAddress(address: string, chars = 4): string {
  const parsed = isAddress(address)
  if (!parsed) {
    throw Error(`Invalid 'address' parameter '${address}'.`)
  }
  return `${parsed.substring(0, chars + 2)}...${parsed.substring(42 - chars)}`
}

// add 10%
export function calculateGasMargin(value: BigNumber): BigNumber {
  return value.mul(BigNumber.from(10000).add(BigNumber.from(1000))).div(BigNumber.from(10000))
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
export function getRouterContract(chainId: number, library: Web3Provider, account?: string) {
  return getContract(ROUTER_ADDRESS, IUniswapV2Router01ABI, library, account)
}

// account is optional
export function getExchangeContract(pairAddress: string, library: Web3Provider, account?: string) {
  return getContract(pairAddress, IUniswapV2PairABI, library, account)
}

// get token info and fall back to unknown if not available, except for the
// decimals which falls back to null
export async function getTokenInfoWithFallback(
  tokenAddress: string,
  library: Web3Provider
): Promise<{ name: string; symbol: string; decimals: null | number }> {
  if (!isAddress(tokenAddress)) {
    throw Error(`Invalid 'tokenAddress' parameter '${tokenAddress}'.`)
  }

  const token = getContract(tokenAddress, ERC20_ABI, library)

  const namePromise: Promise<string> = token.name().catch(() =>
    getContract(tokenAddress, ERC20_BYTES32_ABI, library)
      .name()
      .then(parseBytes32String)
      .catch((e: Error) => {
        console.debug('Failed to get name for token address', e, tokenAddress)
        return 'Unknown'
      })
  )

  const symbolPromise: Promise<string> = token.symbol().catch(() => {
    const contractBytes32 = getContract(tokenAddress, ERC20_BYTES32_ABI, library)
    return contractBytes32
      .symbol()
      .then(parseBytes32String)
      .catch((e: Error) => {
        console.debug('Failed to get symbol for token address', e, tokenAddress)
        return 'UNKNOWN'
      })
  })
  const decimalsPromise: Promise<number | null> = token.decimals().catch((e: Error) => {
    console.debug('Failed to get decimals for token address', e, tokenAddress)
    return null
  })

  const [name, symbol, decimals]: [string, string, number | null] = (await Promise.all([
    namePromise,
    symbolPromise,
    decimalsPromise
  ])) as [string, string, number | null]
  return { name, symbol, decimals }
}

export function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // $& means the whole matched string
}
