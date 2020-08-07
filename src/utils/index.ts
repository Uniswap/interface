import { Contract } from '@ethersproject/contracts'
import { getAddress } from '@ethersproject/address'
import { AddressZero, MaxUint256 } from '@ethersproject/constants'
import { JsonRpcSigner, Web3Provider } from '@ethersproject/providers'
import { BigNumber } from '@ethersproject/bignumber'
import { abi as IUniswapV2Router02ABI } from '@uniswap/v2-periphery/build/IUniswapV2Router02.json'
import MooniswapABI from '../constants/v1-mooniswap/v1_mooniswap_exchange.json'
import MooniswapFactoryABI from '../constants/v1-mooniswap/v1_mooniswap_factory.json'
import { ROUTER_ADDRESS } from '../constants'
import { ChainId, JSBI, Percent, Token, TokenAmount, ETHER } from '@uniswap/sdk'
import { TokenAddressMap } from '../state/lists/hooks'
import { V1_MOONISWAP_FACTORY_ADDRESSES } from '../constants/v1-mooniswap'
import { ONE_SPLIT_ABI, ONE_SPLIT_ADDRESSES } from '../constants/one-split'

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

export function getEtherscanLink(chainId: ChainId, data: string, type: 'transaction' | 'token' | 'address'): string {
  const prefix = `https://${ETHERSCAN_PREFIXES[chainId] || ETHERSCAN_PREFIXES[1]}etherscan.io`

  switch (type) {
    case 'transaction': {
      return `${prefix}/tx/${data}`
    }
    case 'token': {
      return `${prefix}/token/${data}`
    }
    case 'address':
    default: {
      return `${prefix}/address/${data}`
    }
  }
}

export function isUseOneSplitContract(distribution: BigNumber[] | undefined): boolean {
  return Boolean(
    distribution &&
    (
      distribution?.filter((x: BigNumber) => x && !x.isZero())?.length > 1 ||
      distribution[12].isZero()
    )
  )
}

export const maxUint256Div2 = MaxUint256.div(2)

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

  return new Contract(address, ABI, getProviderOrSigner(library, account) as any)
}

// account is optional
export function getRouterContract(_: number, library: Web3Provider, account?: string) {
  return getContract(ROUTER_ADDRESS, IUniswapV2Router02ABI, library, account)
}

export function getOneSplit(chainId: ChainId, library: Web3Provider, account?: string) {
  return getContract(ONE_SPLIT_ADDRESSES[chainId], ONE_SPLIT_ABI, library, account)
}

export function getMooniswapContract(_: number, library: Web3Provider, pairAddress: string, account?: string) {
  return getContract(pairAddress, MooniswapABI, library, account)
}

export function getMooniswapFactoryContract( chainId: ChainId, library: Web3Provider, account?: string) {
  return getContract(V1_MOONISWAP_FACTORY_ADDRESSES[chainId], MooniswapFactoryABI, library, account)
}

export function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // $& means the whole matched string
}

export function isDefaultToken(defaultTokens: TokenAddressMap, currency?: Token): boolean {
  if (currency === ETHER) return true
  return Boolean(currency instanceof Token && defaultTokens[currency.chainId]?.[currency.address])
}
