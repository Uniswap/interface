import { Contract } from '@ethersproject/contracts'
import { getAddress } from '@ethersproject/address'
import { AddressZero } from '@ethersproject/constants'
import { JsonRpcSigner, Web3Provider, JsonRpcProvider } from '@ethersproject/providers'
import { BigNumber } from '@ethersproject/bignumber'
import { abi as IDXswapRouterABI } from '@swapr/periphery/build/IDXswapRouter.json'
import { ChainId, JSBI, Percent, Token, CurrencyAmount, Currency, Pair, RoutablePlatform } from '@swapr/sdk'
import { TokenAddressMap } from '../state/lists/hooks'
import Decimal from 'decimal.js-light'
import { commify } from 'ethers/lib/utils'
import { NetworkDetails } from '../constants'

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
  4: 'rinkeby.',
  [ChainId.ARBITRUM_ONE]: '',
  [ChainId.ARBITRUM_RINKEBY]: '',
  [ChainId.XDAI]: ''
}

const getExplorerPrefix = (chainId: ChainId) => {
  switch (chainId) {
    case ChainId.ARBITRUM_ONE:
      return 'https://arbiscan.io'
    case ChainId.ARBITRUM_RINKEBY:
      return 'https://rinkeby-explorer.arbitrum.io/#'
    case ChainId.XDAI:
      return 'https://blockscout.com/xdai/mainnet'
    default:
      return `https://${ETHERSCAN_PREFIXES[chainId] || ETHERSCAN_PREFIXES[1]}etherscan.io`
  }
}

export function getExplorerLink(
  chainId: ChainId,
  data: string,
  type: 'transaction' | 'token' | 'address' | 'block'
): string {
  const prefix = getExplorerPrefix(chainId)

  // exception. blockscout doesn't have a token-specific address
  if (chainId === ChainId.XDAI && type === 'token') {
    return `${prefix}/address/${data}`
  }

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
export function shortenAddress(address: string, charsBefore = 4, charsAfter = 4): string {
  const parsed = isAddress(address)
  if (!parsed) {
    throw Error(`Invalid 'address' parameter '${address}'.`)
  }
  return `${parsed.substring(0, charsBefore + 2)}...${parsed.substring(42 - charsAfter)}`
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
export function getSigner(library: Web3Provider | JsonRpcProvider, account: string): JsonRpcSigner {
  return library.getSigner(account).connectUnchecked()
}

// account is optional
export function getProviderOrSigner(
  library: Web3Provider | JsonRpcProvider,
  account?: string
): Web3Provider | JsonRpcProvider | JsonRpcSigner {
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
export function getRouterContract(
  chainId: ChainId,
  library: Web3Provider,
  platform: RoutablePlatform,
  account?: string
): Contract {
  return getContract(
    platform.routerAddress[chainId ? chainId : ChainId.MAINNET] as string,
    IDXswapRouterABI,
    library,
    account
  )
}

export function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // $& means the whole matched string
}

export function isTokenOnList(defaultTokens: TokenAddressMap, currency: Currency): boolean {
  if (Currency.isNative(currency)) return true
  return Boolean(currency instanceof Token && defaultTokens[currency.chainId]?.[currency.address])
}

export function isPairOnList(pairs: Pair[], pair?: Pair): boolean {
  if (!pair) return false
  return !!pairs.find(loopedPair => loopedPair.equals(pair))
}

export const formatCurrencyAmount = (amount: CurrencyAmount, significantDecimalPlaces = 2): string => {
  const decimalAmount = new Decimal(amount.toExact())
  if (decimalAmount.lessThan('0.00000001')) {
    return '0.00'
  }
  const decimalPlaces = decimalAmount.decimalPlaces()
  if (decimalPlaces === 0) {
    return commify(decimalAmount.toString())
  }
  const [integers, decimals] = decimalAmount.toFixed(decimalPlaces).split('.')
  let adjustedDecimals = ''
  let significantDecimalPlacesAdded = 0
  for (let i = 0; i < decimals.length; i++) {
    const char = decimals.charAt(i)
    if (significantDecimalPlacesAdded === 1 && char === '0') {
      // handle cases like 0.0010001, stopping at the first 1
      break
    }
    adjustedDecimals += char
    if (char !== '0' && ++significantDecimalPlacesAdded === significantDecimalPlaces) {
      break
    }
  }
  return `${commify(integers)}.${adjustedDecimals}`
}

export const switchOrAddNetwork = (networkDetails?: NetworkDetails, account?: string) => {
  if (!window.ethereum || !window.ethereum.request || !window.ethereum.isMetaMask || !networkDetails || !account) return
  window.ethereum
    .request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: networkDetails.chainId }]
    })
    .catch(error => {
      if (error.code !== 4902) {
        console.error('error switching to chain id', networkDetails.chainId, error)
      }
      if (!window.ethereum || !window.ethereum.request) return
      window.ethereum
        .request({
          method: 'wallet_addEthereumChain',
          params: [{ ...networkDetails }, account]
        })
        .catch(error => {
          console.error('error adding chain with id', networkDetails.chainId, error)
        })
    })
}
