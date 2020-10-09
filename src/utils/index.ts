import { Contract } from '@ethersproject/contracts'
import { getAddress } from '@ethersproject/address'
import { AddressZero } from '@ethersproject/constants'
import { JsonRpcSigner, Web3Provider } from '@ethersproject/providers'
import { BigNumber } from '@ethersproject/bignumber'
import { abi as IUniswapV2Router02ABI } from '@uniswap/v2-periphery/build/IUniswapV2Router02.json'
import { ROUTER_ADDRESS } from '../constants'
import { ChainId, JSBI, Percent, Token, CurrencyAmount, Currency, ETHER } from 'uniswap-fuse-sdk'
import { TokenAddressMap } from '../state/lists/hooks'
import ForeignMultiAMBErc20ToErc677ABI from '../constants/abis/foreignMultiAMBErc20ToErc677.json'
import Erc677TokenABI from '../constants/abis/erc677.json'

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
  42: 'kovan.',
  122: 'fuse.'
}

export function getEtherscanLink(chainId: ChainId, data: string, type: 'transaction' | 'token' | 'address'): string {
  let prefix

  if (chainId === 122) {
    prefix = 'https://explorer.fuse.io'
  } else {
    prefix = `https://${ETHERSCAN_PREFIXES[chainId] || ETHERSCAN_PREFIXES[1]}etherscan.io`
  }

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

export function getEtherscanLinkText(chainId: number): string {
  switch (chainId) {
    case ChainId.FUSE:
      return 'View on Fuse Explorer'
    case ChainId.MAINNET:
      return 'View on Etherscan'
    case ChainId.ROPSTEN:
      return 'View on Etherscan'
    default:
      return 'View on Etherscan'
  }
}

export function getNativeCurrencySymbol(chainId?: number): string {
  switch (chainId) {
    case ChainId.FUSE:
      return 'FUSE'
    case ChainId.MAINNET:
      return 'ETH'
    case ChainId.ROPSTEN:
      return 'ETH'
    default:
      return 'FUSE'
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

export function calculateSlippageAmount(value: CurrencyAmount, slippage: number): [JSBI, JSBI] {
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
export function getRouterContract(_: number, library: Web3Provider, account?: string): Contract {
  return getContract(ROUTER_ADDRESS, IUniswapV2Router02ABI, library, account)
}

export function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // $& means the whole matched string
}

export function isTokenOnList(defaultTokens: TokenAddressMap, currency?: Currency): boolean {
  if (currency === ETHER) return true
  return Boolean(currency instanceof Token && defaultTokens[currency.chainId]?.[currency.address])
}

export function getERC677TokenContract(address: string, library: Web3Provider, account?: string): Contract {
  return getContract(address, Erc677TokenABI, library, account)
}

export function getBridgeHomeAddress(chainId?: number): string {
  switch (chainId) {
    case ChainId.MAINNET:
      return '0xc2220646E1E76D5fF3a441eDd9E8EFF0e4A8EF03'
    case ChainId.ROPSTEN:
      return '0xAEBC2058780eb0372e7Ee75c11019d26E36894ad'
    default:
      throw new Error('Unsupported chainId')
  }
}

export function getBridgeForeignAddress(chainId?: number): string {
  switch (chainId) {
    case ChainId.MAINNET:
      return '0xf301d525da003e874DF574BCdd309a6BF0535bb6'
    case ChainId.ROPSTEN:
      return '0x68b762A7a68F6D87Fcf2E2EaF7eF48D00cAa2419'
    default:
      throw new Error('Unsupported chainId')
  }
}

export function getForiegnBridgeContract(chainId: number, library: Web3Provider, account?: string): Contract {
  const address = getBridgeForeignAddress(chainId)
  return getContract(address, ForeignMultiAMBErc20ToErc677ABI, library, account)
}

export function getCurrencySymbol(currency: Currency | null | undefined, chainId: number | undefined) {
  if (chainId === ChainId.MAINNET || chainId === ChainId.ROPSTEN) {
    if (currency === ETHER) {
      return 'ETH'
    } else {
      return currency?.symbol
    }
  } else {
    return currency?.symbol
  }
}

export function getDefaultMainnetCurrency() {
  return '0x970b9bb2c0444f5e81e9d0efb84c8ccdcdcaf84d'
}
