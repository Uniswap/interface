import { Contract } from '@ethersproject/contracts'
import { getAddress } from '@ethersproject/address'
import { AddressZero } from '@ethersproject/constants'
import { JsonRpcSigner, Web3Provider } from '@ethersproject/providers'
import { BigNumber } from '@ethersproject/bignumber'
import { abi as IUniswapV2Router02ABI } from '@harmony-swoop/periphery/build/contracts/IUniswapV2Router02.json'
import { ROUTER_ADDRESS } from '../constants'
import { ChainID } from '@harmony-js/utils';
import { JSBI, Percent, Token, CurrencyAmount, Currency, HARMONY } from '@harmony-swoop/sdk'
import { TokenAddressMap } from '../state/lists/hooks'

import { Hmy } from '@harmony-swoop/utils';
import { hmy } from '../connectors'
import { AbstractWallet } from '@harmony-swoop/utils'

// returns the checksummed address if the address is valid, otherwise returns false
export function isAddress(value: any): string | false {
  try {
    return getAddress(value)
  } catch {
    return false
  }
}

export function isHarmonyAddress(value: any): string | false {
  try {
    return hmy.client.crypto.getAddress(value).raw
  } catch {
    return false
  }
}

const ETHERSCAN_PREFIXES: { [chainId in ChainID]: string } = {
  0: '',
  1: '',
  2: 'testnet.',
  3: '',
  4: '',
  30: '',
  31: '',
  42: '',
  61: '',
  62: '',
  1337: ''
}

export function getHarmonyExplorerLink(hmy: Hmy, data: string, type: 'transaction' | 'token' | 'address'): string {
  const prefix = hmy.explorerUrl;

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

export function getEtherscanLink(chainId: ChainID, data: string, type: 'transaction' | 'token' | 'address'): string {
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

// shorten the checksummed version of the input address to have 0x + 4 characters at start and end
export function shortenAddress(address: string, chars = 4): string {
  const parsed = isAddress(address)
  if (!parsed) {
    throw Error(`Invalid 'address' parameter '${address}'.`)
  }
  return `${parsed.substring(0, chars + 2)}...${parsed.substring(42 - chars)}`
}

export function shortenHarmonyAddress(address: string, chars = 4): string {
  const parsed = isHarmonyAddress(address)
  
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
export function getHarmonyContract(address: string, ABI: any, library: Web3Provider, wallet?: AbstractWallet): any {
  let contract = hmy.client.contracts.createContract(ABI, address);
  
  if (wallet) {
    contract = wallet.attachToContract(contract);
  }

  return contract;
}

// account is optional
export function getRouterContract(_: number, library: Web3Provider, account?: string): Contract {
  return getContract(ROUTER_ADDRESS, IUniswapV2Router02ABI, library, account)
}

// account is optional
export function getHarmonyRouterContract(_: number, library: Web3Provider, wallet?: AbstractWallet): any {
  return getHarmonyContract(ROUTER_ADDRESS, IUniswapV2Router02ABI, library, wallet)
}

export function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // $& means the whole matched string
}

export function isTokenOnList(defaultTokens: TokenAddressMap, currency?: Currency): boolean {
  if (currency === HARMONY) return true
  return Boolean(currency instanceof Token && defaultTokens[currency.chainId]?.[currency.address])
}
