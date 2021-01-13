import { Contract } from '@ethersproject/contracts'
import { getAddress } from '@ethersproject/address'
import { AddressZero } from '@ethersproject/constants'
import { JsonRpcSigner, Web3Provider } from '@ethersproject/providers'
import { BigNumber } from '@ethersproject/bignumber'
import { abi as IUniswapV2Router02ABI } from '@uniswap/v2-periphery/build/IUniswapV2Router02.json'
import {
  ROUTER_ADDRESS,
  MAINNET_FOREIGN_BRIDGE_ADDRESS,
  ROPSTEN_FOREIGN_BRIDGE_ADDRESS,
  FUSE_MAINNET_HOME_BRIDGE_ADDRESS,
  FUSE_ROPSTEN_HOME_BRIDGE_ADDRESS,
  FOREIGN_BRIDGE_CHAIN
} from '../constants'
import { ChainId, JSBI, Percent, Token, CurrencyAmount, Currency, ETHER } from '@fuseio/fuse-swap-sdk'
import { TokenAddressMap } from '../state/lists/hooks'
import ForeignMultiAMBErc20ToErc677ABI from '../constants/abis/foreignMultiAMBErc20ToErc677.json'
import HomeMultiAMBErc20ToErc677ABI from '../constants/abis/homeMultiAMBErc20ToErc677.json'
import AMBErc677To677ABI from '../constants/abis/ambErc677ToErc677.json'
import Erc677TokenABI from '../constants/abis/erc677.json'
import HomeBridgeNativeToErc from '../constants/abis/homeBridgeNativeToErc.json'
import ForeignBriddgeNativeToErc from '../constants/abis/foreignBridgeNativeToErc.json'
import { CUSTOM_BRIDGE_TOKENS } from '../constants/bridge'
import { formatUnits, Interface, id } from 'ethers/lib/utils'

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

export function getExplorerLink(chainId: ChainId, data: string, type: 'transaction' | 'token' | 'address'): string {
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

export function getExplorerLinkText(chainId: number): string {
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

export function getAMBErc677To677Contract(address: string, library: Web3Provider, account?: string): Contract {
  return getContract(address, AMBErc677To677ABI, library, account)
}

export function getHomeMultiAMBErc20ToErc677Contract(
  address: string,
  library: Web3Provider,
  account?: string
): Contract {
  return getContract(address, HomeMultiAMBErc20ToErc677ABI, library, account)
}

export function getForeignMultiAMBErc20ToErc677Contract(
  address: string,
  library: Web3Provider,
  account?: string
): Contract {
  return getContract(address, ForeignMultiAMBErc20ToErc677ABI, library, account)
}

export function getHomeBridgeNativeToErcContract(address: string, library: Web3Provider, account?: string): Contract {
  return getContract(address, HomeBridgeNativeToErc, library, account)
}

export function getForeignBridgeNativeToErcContract(
  address: string,
  library: Web3Provider,
  account?: string
): Contract {
  return getContract(address, ForeignBriddgeNativeToErc, library, account)
}

export function getHomeMultiErc20ToErc677BridgeAddress(): string {
  return FOREIGN_BRIDGE_CHAIN === ChainId.MAINNET ? FUSE_MAINNET_HOME_BRIDGE_ADDRESS : FUSE_ROPSTEN_HOME_BRIDGE_ADDRESS
}

export function getForeignMultiErc20ToErc677BridgeAddress(): string {
  return FOREIGN_BRIDGE_CHAIN === ChainId.MAINNET ? MAINNET_FOREIGN_BRIDGE_ADDRESS : ROPSTEN_FOREIGN_BRIDGE_ADDRESS
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

export function getForeignCustomBridgeAddress(tokenAddress: string) {
  const formattedTokenAddress = tokenAddress.toLowerCase()
  const list = CUSTOM_BRIDGE_TOKENS[FOREIGN_BRIDGE_CHAIN as ChainId]
  const token = list.find(
    token =>
      token.FOREIGN_TOKEN_ADDRESS.toLowerCase() === formattedTokenAddress ||
      token.HOME_TOKEN_ADDRESS.toLowerCase() === formattedTokenAddress
  )
  return token ? token.FOREIGN_BRIDGE_MEDIATOR : null
}

export function getHomeCustomBridgeAddress(tokenAddress: string) {
  const formattedTokenAddress = tokenAddress.toLowerCase()
  const list = CUSTOM_BRIDGE_TOKENS[FOREIGN_BRIDGE_CHAIN as ChainId]
  const token = list.find(
    token =>
      token.HOME_TOKEN_ADDRESS.toLowerCase() === formattedTokenAddress ||
      token.FOREIGN_TOKEN_ADDRESS.toLowerCase() === formattedTokenAddress
  )

  return token ? token.HOME_BRIDGE_MEDIATOR : null
}

export function isCustomBridgeToken(tokenAddress?: string) {
  if (!tokenAddress) return

  const formattedTokenAddress = tokenAddress.toLowerCase()
  const addresses = [...CUSTOM_BRIDGE_TOKENS[FOREIGN_BRIDGE_CHAIN as ChainId]]
    .flatMap((token: any) => [token.FOREIGN_TOKEN_ADDRESS, token.HOME_TOKEN_ADDRESS])
    .map((token: string) => token.toLowerCase())

  return addresses.includes(formattedTokenAddress)
}

export const tryFormatAmount = (amount?: string, deciamls?: number) => {
  if (!amount || !deciamls) return undefined

  try {
    const parsedAmount = formatUnits(amount, deciamls)
    if (parsedAmount !== '0') return parsedAmount
  } catch (error) {
    console.debug(`Failed to parse input amount: "${amount}"`, error)
  }

  return undefined
}

export async function pollEvent(
  event: string,
  address: string,
  abi: any,
  library: Web3Provider,
  fn: (...args: any) => Promise<boolean>
) {
  return new Promise(async resolve => {
    const fromBlock = await library.getBlockNumber()
    const toBlock = 'latest'
    const contractInterface = new Interface(abi)

    const interval = setInterval(async () => {
      const logs = await library.getLogs({ address, fromBlock, toBlock, topics: [id(event)] })

      for (const log of logs) {
        const { args } = contractInterface.parseLog(log)

        if (await fn(args)) {
          clearInterval(interval)
          resolve()
        }
      }
    }, 5000)
  })
}

export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production'
}
