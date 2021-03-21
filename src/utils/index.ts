import { Contract } from '@ethersproject/contracts'
import { getAddress } from '@ethersproject/address'
import { AddressZero } from '@ethersproject/constants'
import { JsonRpcSigner, Web3Provider } from '@ethersproject/providers'
import { BigNumber } from '@ethersproject/bignumber'
import { abi as IUniswapV2Router02ABI } from '@uniswap/v2-periphery/build/IUniswapV2Router02.json'
import {
  ROUTER_ADDRESS,
  BINANCE_ERC20_TO_ERC677_FOREIGN_BRIDGE_ADDRESS,
  FUSE_ERC20_TO_ERC677_BRIDGE_FOREIGN_ADDRESS,
  FUSE_FOREIGN_TOKEN_ADDRESS,
  GOODDOLLAR_HOME_TOKEN_ADDRESS,
  GOODDOLLAR_FOREIGN_TOKEN_ADDRESS,
  FUSE_NATIVE_TO_ERC677_BRIDGE_FOREIGN_ADDRESS,
  FUSE_ERC677_TO_ERC677_BRIDGE_FOREIGN_ADDRESS,
  TOKEN_MIGRATOR_ADDRESS,
  BINANCE_TESTNET_CHAINID,
  BINANCE_MAINNET_CHAINID
} from '../constants'
import { ChainId, JSBI, Percent, Token, CurrencyAmount, Currency, ETHER as FUSE } from '@fuseio/fuse-swap-sdk'
import { TokenAddressMap, WrappedTokenInfo } from '../state/lists/hooks'
import ForeignMultiAMBErc20ToErc677ABI from '../constants/abis/foreignMultiAMBErc20ToErc677.json'
import HomeMultiAMBErc20ToErc677ABI from '../constants/abis/homeMultiAMBErc20ToErc677.json'
import AMBErc677To677ABI from '../constants/abis/ambErc677ToErc677.json'
import Erc677TokenABI from '../constants/abis/erc677.json'
import HomeBridgeNativeToErc from '../constants/abis/homeBridgeNativeToErc.json'
import ForeignBriddgeNativeToErc from '../constants/abis/foreignBridgeNativeToErc.json'
import { formatUnits, Interface, id } from 'ethers/lib/utils'
import { BridgeDirection, BridgeType } from '../state/bridge/hooks'
import BinanceBridge from '../state/bridge/bridges/binance'
import NativeToErcBridge from '../state/bridge/bridges/nativeToErc'
import Erc677ToErc677Bridge from '../state/bridge/bridges/erc677Toerc677'
import Erc20ToErc677Bridge from '../state/bridge/bridges/erc20Toerc677'
import BRIDGED_TOKENS_MIGRATOR_ABI from '../constants/abis/bridgedTokenMigrator.json'
import { ERC20_ABI } from '../constants/abis/erc20'
import PROD_BRIDGE_LIST from '@fuseio/fuse-swap-default-token-list'
import QA_BRIDGE_LIST from '../constants/qa/tokenlist.json'
import BETA_BRIDGE_LIST from '../constants/qa/beta-tokenlist.json'
import { TokenList } from '@fuseio/token-lists'

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
  } else if (chainId === BINANCE_TESTNET_CHAINID) {
    prefix = 'https://testnet.bscscan.com'
  } else if (chainId === BINANCE_MAINNET_CHAINID) {
    prefix = 'https://bscscan.com'
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
    case BINANCE_TESTNET_CHAINID:
      return 'View on BscScan Testnet'
    case BINANCE_MAINNET_CHAINID:
      return 'View on BscScan'
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
    case BINANCE_MAINNET_CHAINID:
    case BINANCE_TESTNET_CHAINID:
      return 'BNB'
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
  if (currency === FUSE) return true
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

export function getCurrencySymbol(currency: Currency | null | undefined, chainId: number | undefined) {
  if (chainId === ChainId.MAINNET || chainId === ChainId.ROPSTEN) {
    if (currency === FUSE) {
      return 'ETH'
    } else {
      return currency?.symbol
    }
  } else {
    return currency?.symbol
  }
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

export function isFuse(tokenAddress: string) {
  return tokenAddress === FUSE.symbol || tokenAddress === FUSE_FOREIGN_TOKEN_ADDRESS
}

export function isGoodDollar(tokenAddress: string) {
  return tokenAddress === GOODDOLLAR_HOME_TOKEN_ADDRESS || tokenAddress === GOODDOLLAR_FOREIGN_TOKEN_ADDRESS
}

export function getEthFuseBridge(tokenAddress: string) {
  if (isFuse(tokenAddress)) {
    return NativeToErcBridge
  } else if (isGoodDollar(tokenAddress)) {
    return Erc677ToErc677Bridge
  } else {
    return Erc20ToErc677Bridge
  }
}

export function getBnbFuseBridge() {
  return BinanceBridge
}

export function isEthFuseDirection(bridgeDirection: BridgeDirection) {
  return bridgeDirection === BridgeDirection.ETH_TO_FUSE || bridgeDirection === BridgeDirection.FUSE_TO_ETH
}

export function isBnbFuseDirection(bridgeDirection: BridgeDirection) {
  return bridgeDirection === BridgeDirection.BSC_TO_FUSE || bridgeDirection === BridgeDirection.FUSE_TO_BSC
}

export function getBridge(tokenAddress: string, bridgeDirection: BridgeDirection) {
  if (isEthFuseDirection(bridgeDirection)) {
    return getEthFuseBridge(tokenAddress)
  } else if (isBnbFuseDirection(bridgeDirection)) {
    return getBnbFuseBridge()
  }
  return undefined
}

export function getEthFuseBridgeType(tokenAddress: string) {
  if (isFuse(tokenAddress)) {
    return BridgeType.ETH_FUSE_NATIVE
  } else if (isGoodDollar(tokenAddress)) {
    return BridgeType.ETH_FUSE_ERC677_TO_ERC677
  } else {
    return BridgeType.ETH_FUSE_ERC20_TO_ERC677
  }
}

export function getBnbFuseBridgeType() {
  return BridgeType.BSC_FUSE_ERC20_TO_ERC677
}

export function getBridgeType(tokenAddress: string, bridgeDirection: BridgeDirection) {
  if (isEthFuseDirection(bridgeDirection)) {
    return getEthFuseBridgeType(tokenAddress)
  } else if (isBnbFuseDirection(bridgeDirection)) {
    return getBnbFuseBridgeType()
  }
  return undefined
}

export function getEthToFuseApprovalAddress(tokenAddress: string) {
  const bridgeType = getEthFuseBridgeType(tokenAddress)

  switch (bridgeType) {
    case BridgeType.ETH_FUSE_NATIVE:
      return FUSE_NATIVE_TO_ERC677_BRIDGE_FOREIGN_ADDRESS
    case BridgeType.ETH_FUSE_ERC20_TO_ERC677:
      return FUSE_ERC20_TO_ERC677_BRIDGE_FOREIGN_ADDRESS
    case BridgeType.ETH_FUSE_ERC677_TO_ERC677:
      return FUSE_ERC677_TO_ERC677_BRIDGE_FOREIGN_ADDRESS
  }
}

export function getApprovalAddress(tokenAddress?: string, bridgeDirection?: BridgeDirection) {
  if (!tokenAddress || !bridgeDirection) return

  switch (bridgeDirection) {
    case BridgeDirection.ETH_TO_FUSE:
      return getEthToFuseApprovalAddress(tokenAddress)
    case BridgeDirection.FUSE_TO_ETH:
    case BridgeDirection.FUSE_TO_BSC:
      return tokenAddress
    case BridgeDirection.BSC_TO_FUSE:
      return BINANCE_ERC20_TO_ERC677_FOREIGN_BRIDGE_ADDRESS
  }
}

export function unwrapOrThrow(envName: string) {
  const value = process.env[`REACT_APP_${envName}`]
  if (!value) {
    throw new Error(`${envName} must be a defined environment variable`)
  }

  return value
}

export function safeShortenAddress(address = '') {
  return `${address.slice(0, 3)}...${address.slice(-4)}`
}
export function getTokenMigrationContract(library: Web3Provider, account: string) {
  return getContract(TOKEN_MIGRATOR_ADDRESS, BRIDGED_TOKENS_MIGRATOR_ABI, library, account)
}

export function getTokenContract(address: string, library: Web3Provider, account: string) {
  return getContract(address, ERC20_ABI, library, account)
}

export function isArrayEmpty(arr: Array<any>) {
  return arr.filter(Boolean).length ? false : true
}

export function getBridgeList(env: string): TokenList {
  switch (env) {
    case 'development':
      return QA_BRIDGE_LIST
    case 'production':
      return PROD_BRIDGE_LIST
    case 'beta':
      return BETA_BRIDGE_LIST
    default:
      return QA_BRIDGE_LIST
  }
}

export async function addTokenToWallet(token: Token, library: Web3Provider) {
  if (library.provider && library.provider.request) {
    try {
      await library.provider.request({
        method: 'wallet_watchAsset',
        params: {
          // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
          //@ts-ignore // need this for incorrect ethers provider type
          type: 'ERC20',
          options: {
            address: token.address,
            symbol: token.symbol,
            decimals: token.decimals,
            ...(token instanceof WrappedTokenInfo ? { image: token.logoURI } : {})
          }
        }
      })
    } catch (e) {
      console.log(e)
    }
  }
}

export function isTokenOnTokenList(tokenList: any, currency: Currency | undefined) {
  if (currency === FUSE) return true

  const token = currency as Token
  return Boolean(tokenList[token?.address])
}
