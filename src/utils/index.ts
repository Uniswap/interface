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
import { getNetworkLibrary, getNetworkLibraryByChain } from '../connectors'
import { TransactionResponse } from '@ethersproject/providers'
import { CUSTOM_BRIDGE_TOKENS } from '../constants/bridge'
import { formatUnits } from 'ethers/lib/utils'

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

export function getAMBErc20ToErc677Contract(address: string, library: Web3Provider, account?: string): Contract {
  return getContract(address, HomeMultiAMBErc20ToErc677ABI, library, account)
}

export function getMultiBridgeHomeAddress(chainId?: number): string {
  switch (chainId) {
    case ChainId.MAINNET:
      return FUSE_MAINNET_HOME_BRIDGE_ADDRESS
    case ChainId.ROPSTEN:
      return FUSE_ROPSTEN_HOME_BRIDGE_ADDRESS
    default:
      throw new Error('Unsupported chainId')
  }
}

export function getBridgeForeignAddress(chainId?: number): string {
  switch (chainId) {
    case ChainId.MAINNET:
      return MAINNET_FOREIGN_BRIDGE_ADDRESS
    case ChainId.ROPSTEN:
      return ROPSTEN_FOREIGN_BRIDGE_ADDRESS
    default:
      throw new Error('Unsupported chainId')
  }
}

export function getHomeMultiBridgeContract(library: Web3Provider, account?: string): Contract {
  const address =
    FOREIGN_BRIDGE_CHAIN === ChainId.ROPSTEN ? FUSE_ROPSTEN_HOME_BRIDGE_ADDRESS : FUSE_MAINNET_HOME_BRIDGE_ADDRESS
  return getContract(address, HomeMultiAMBErc20ToErc677ABI, library, account)
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

export function getBridgeContractWithRpc(chainId: number): Contract {
  if (chainId === ChainId.MAINNET) {
    return getContract(FUSE_MAINNET_HOME_BRIDGE_ADDRESS, HomeMultiAMBErc20ToErc677ABI, getNetworkLibrary())
  } else if (chainId === ChainId.ROPSTEN) {
    return getContract(FUSE_ROPSTEN_HOME_BRIDGE_ADDRESS, HomeMultiAMBErc20ToErc677ABI, getNetworkLibrary())
  } else if (chainId === ChainId.FUSE) {
    const address =
      FOREIGN_BRIDGE_CHAIN === ChainId.ROPSTEN ? ROPSTEN_FOREIGN_BRIDGE_ADDRESS : MAINNET_FOREIGN_BRIDGE_ADDRESS
    return getContract(address, ForeignMultiAMBErc20ToErc677ABI, getNetworkLibraryByChain(chainId))
  } else {
    throw new Error('Unsupported chainId')
  }
}

export function getHomeBridgeContractJsonRpc(chainId: number): Contract {
  if (chainId === ChainId.MAINNET) {
    return getContract(FUSE_MAINNET_HOME_BRIDGE_ADDRESS, HomeMultiAMBErc20ToErc677ABI, getNetworkLibrary())
  } else {
    return getContract(FUSE_ROPSTEN_HOME_BRIDGE_ADDRESS, HomeMultiAMBErc20ToErc677ABI, getNetworkLibrary())
  }
}

export function getForiegnBridgeContractJsonRpc(chainId: number): Contract {
  const address =
    FOREIGN_BRIDGE_CHAIN === ChainId.ROPSTEN ? ROPSTEN_FOREIGN_BRIDGE_ADDRESS : MAINNET_FOREIGN_BRIDGE_ADDRESS
  return getContract(address, ForeignMultiAMBErc20ToErc677ABI, getNetworkLibraryByChain(chainId))
}

export function getBasicForeignBridgeAddress(tokenAddress: string, chainId: number) {
  const formattedTokenAddress = tokenAddress.toLowerCase()
  const list =
    chainId === ChainId.MAINNET ? CUSTOM_BRIDGE_TOKENS[ChainId.MAINNET] : CUSTOM_BRIDGE_TOKENS[ChainId.ROPSTEN]
  const token = list.find(
    token =>
      token.FOREIGN_TOKEN_ADDRESS.toLowerCase() === formattedTokenAddress ||
      token.HOME_TOKEN_ADDRESS.toLowerCase() === formattedTokenAddress
  )
  return token ? token.FOREIGN_BRIDGE_MEDIATOR : null
}

export function getBasicHomeBridgeAddress(tokenAddress: string) {
  const formattedTokenAddress = tokenAddress.toLowerCase()

  const list =
    FOREIGN_BRIDGE_CHAIN === ChainId.MAINNET
      ? CUSTOM_BRIDGE_TOKENS[ChainId.MAINNET]
      : CUSTOM_BRIDGE_TOKENS[ChainId.ROPSTEN]

  const token = list.find(
    token =>
      token.HOME_TOKEN_ADDRESS.toLowerCase() === formattedTokenAddress ||
      token.FOREIGN_TOKEN_ADDRESS.toLowerCase() === formattedTokenAddress
  )

  return token ? token.HOME_BRIDGE_MEDIATOR : null
}

export function isBasicBridgeToken(tokenAddress?: string) {
  if (!tokenAddress) return

  const formattedTokenAddress = tokenAddress.toLowerCase()

  const addresses = [...CUSTOM_BRIDGE_TOKENS[ChainId.MAINNET], ...CUSTOM_BRIDGE_TOKENS[ChainId.ROPSTEN]]
    .flatMap(token => [token.FOREIGN_TOKEN_ADDRESS, token.HOME_TOKEN_ADDRESS])
    .map(token => token.toLowerCase())

  return addresses.includes(formattedTokenAddress)
}

/**
 *
 * @param homeTokenAddress home address of token been transferred
 * @param foreignTokenAddress foreign address of token been transferred
 * @param library
 * @param account user address
 */
export const confirmHomeTokenTransfer = async (
  homeTokenAddress: string,
  foreignTokenAddress: string,
  library: Web3Provider,
  account: string
) => {
  const contract = getHomeMultiBridgeContract(library, account)
  const address = await contract.foreignTokenAddress(homeTokenAddress)
  return foreignTokenAddress === address
}

/**
 *
 * @param foreignTokenAddress foreign address of token been transferred
 * @param HomeTokenAddress home address of token that was transferred
 * @param contract
 */
export const confirmForeignTokenTransfer = async (
  foreignTokenAddress: string,
  HomeTokenAddress: string,
  contract: Contract
) => {
  const address = await contract.foreignTokenAddress(HomeTokenAddress)
  return foreignTokenAddress === address
}

export const waitForTransaction = async (
  transaction: TransactionResponse,
  confirmations: number,
  library: Web3Provider,
  callbackFn: Function
) => {
  transaction.wait()

  const transactionHash = transaction.hash
  const receipt = await library.getTransactionReceipt(transactionHash)

  if ((receipt ? receipt.confirmations : 0) >= confirmations) return receipt

  return new Promise(resolve => {
    let done = false

    const interval = setInterval(async () => {
      const receipt = await library.getTransactionReceipt(transactionHash)
      const confirmedBlocks = receipt ? receipt.confirmations : 0
      const count = confirmedBlocks + 1

      if (!receipt) {
        callbackFn(count)
        return
      }

      if (!done) {
        callbackFn(count > confirmations ? confirmations : count)
      }

      if (count < confirmations + 1) {
        return
      }

      done = true

      clearInterval(interval)
      resolve(receipt)
    }, 500)
  })
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

export const getHomeMinPerTxn = async (
  tokenAddress: string,
  isMultiBridge: boolean,
  library: Web3Provider,
  account?: string
) => {
  let method, args: string[]

  if (isMultiBridge) {
    const contract = getHomeMultiBridgeContract(library, account)
    method = contract.minPerTx
    args = [tokenAddress]
  } else {
    const address = getBasicHomeBridgeAddress(tokenAddress)
    const contract = getAMBErc677To677Contract(address ?? '', library, account)
    method = contract.minPerTx
    args = []
  }

  return await method(...args)
}

export const getHomeMaxPerTxn = async (
  tokenAddress: string,
  isMultiBridge: boolean,
  library: Web3Provider,
  account?: string
) => {
  let method, args: string[]

  if (isMultiBridge) {
    const contract = getHomeMultiBridgeContract(library, account)
    method = contract.maxPerTx
    args = [tokenAddress]
  } else {
    const address = getBasicHomeBridgeAddress(tokenAddress)
    const contract = getAMBErc677To677Contract(address ?? '', library, account)
    method = contract.maxPerTx
    args = []
  }

  return await method(...args)
}

export const getForeignMinPerTxn = async (
  tokenAddress: string,
  isMultiBridge: boolean,
  chainId?: number,
  library?: Web3Provider,
  account?: string
) => {
  if (!library || !chainId || !account) return

  let method, args: string[]

  if (isMultiBridge) {
    const contract = getForiegnBridgeContract(chainId, library, account)
    method = contract.minPerTx
    args = [tokenAddress]
  } else {
    const address = getBasicForeignBridgeAddress(tokenAddress, chainId)
    const contract = getAMBErc677To677Contract(address ?? '', library, account)
    method = contract.minPerTx
    args = []
  }

  return await method(...args)
}

export const getForeignMaxPerTxn = async (
  tokenAddress: string,
  isMultiBridge: boolean,
  chainId?: number,
  library?: Web3Provider,
  account?: string
) => {
  if (!library || !chainId || !account) return

  let method, args: string[]

  if (isMultiBridge) {
    const contract = getForiegnBridgeContract(chainId, library, account)
    method = contract.maxPerTx
    args = [tokenAddress]
  } else {
    const address = getBasicForeignBridgeAddress(tokenAddress, chainId)
    const contract = getAMBErc677To677Contract(address ?? '', library, account)
    method = contract.maxPerTx
    args = []
  }

  return await method(...args)
}

export const getMinMaxPerTxn = async (
  tokenAddress: string,
  decimals: number | undefined,
  isHome: boolean,
  chainId: number,
  library: Web3Provider,
  account: string
) => {
  let minAmount: string | undefined,
    maxAmount: string | undefined,
    minPerTxn: (...args: any) => Promise<any>,
    maxPerTxn: (...args: any) => Promise<any>,
    args: any,
    defaultAmountArgs: any

  const isMultiBridge = !isBasicBridgeToken(tokenAddress)

  if (isHome) {
    minPerTxn = getHomeMinPerTxn
    maxPerTxn = getHomeMaxPerTxn
    args = [tokenAddress, isMultiBridge, library, account]
    defaultAmountArgs = ['0x0000000000000000000000000000000000000000', true, library, account]
  } else {
    minPerTxn = getForeignMinPerTxn
    maxPerTxn = getForeignMaxPerTxn
    args = [tokenAddress, isMultiBridge, chainId, library, account]
    defaultAmountArgs = ['0x0000000000000000000000000000000000000000', true, chainId, library, account]
  }

  const rawMinAmount = await minPerTxn(...args)
  const rawMaxAmount = await maxPerTxn(...args)
  const rawDefaultAmount = await maxPerTxn(...defaultAmountArgs)

  // eslint-disable-next-line prefer-const
  minAmount = tryFormatAmount(rawMinAmount, decimals)

  if (isMultiBridge) {
    const amount = tryFormatAmount(rawMaxAmount, decimals)
    const defaultAmount = tryFormatAmount(rawDefaultAmount, decimals)
    maxAmount = amount === '0.0' ? defaultAmount : amount
  } else {
    maxAmount = tryFormatAmount(rawMaxAmount, decimals)
  }

  return { minAmount, maxAmount }
}
