import { SupportedChainId } from 'constants/chains'
import { ZERO_ADDRESS } from 'constants/misc'
import { NATIVE_CHAIN_ID, nativeOnChain, WRAPPED_NATIVE_CURRENCY } from 'constants/tokens'

import { Chain, HistoryDuration } from './__generated__/types-and-hooks'

export enum TimePeriod {
  HOUR,
  DAY,
  WEEK,
  MONTH,
  YEAR,
}

export function toHistoryDuration(timePeriod: TimePeriod): HistoryDuration {
  switch (timePeriod) {
    case TimePeriod.HOUR:
      return HistoryDuration.Hour
    case TimePeriod.DAY:
      return HistoryDuration.Day
    case TimePeriod.WEEK:
      return HistoryDuration.Week
    case TimePeriod.MONTH:
      return HistoryDuration.Month
    case TimePeriod.YEAR:
      return HistoryDuration.Year
  }
}

export type PricePoint = { timestamp: number; value: number }

export function isPricePoint(p: PricePoint | null): p is PricePoint {
  return p !== null
}

export const CHAIN_ID_TO_BACKEND_NAME: { [key: number]: Chain } = {
  [SupportedChainId.MAINNET]: Chain.Ethereum,
  [SupportedChainId.GOERLI]: Chain.EthereumGoerli,
  [SupportedChainId.POLYGON]: Chain.Polygon,
  [SupportedChainId.POLYGON_MUMBAI]: Chain.Polygon,
  [SupportedChainId.CELO]: Chain.Celo,
  [SupportedChainId.CELO_ALFAJORES]: Chain.Celo,
  [SupportedChainId.ARBITRUM_ONE]: Chain.Arbitrum,
  [SupportedChainId.ARBITRUM_RINKEBY]: Chain.Arbitrum,
  [SupportedChainId.OPTIMISM]: Chain.Optimism,
  [SupportedChainId.OPTIMISM_GOERLI]: Chain.Optimism,
}

export function chainIdToBackendName(chainId: number | undefined) {
  return chainId && CHAIN_ID_TO_BACKEND_NAME[chainId]
    ? CHAIN_ID_TO_BACKEND_NAME[chainId]
    : CHAIN_ID_TO_BACKEND_NAME[SupportedChainId.MAINNET]
}

const URL_CHAIN_PARAM_TO_BACKEND: { [key: string]: Chain } = {
  ethereum: Chain.Ethereum,
  polygon: Chain.Polygon,
  celo: Chain.Celo,
  arbitrum: Chain.Arbitrum,
  optimism: Chain.Optimism,
}

export function validateUrlChainParam(chainName: string | undefined) {
  return chainName && URL_CHAIN_PARAM_TO_BACKEND[chainName] ? URL_CHAIN_PARAM_TO_BACKEND[chainName] : Chain.Ethereum
}

export const CHAIN_NAME_TO_CHAIN_ID: { [key: string]: SupportedChainId } = {
  ETHEREUM: SupportedChainId.MAINNET,
  POLYGON: SupportedChainId.POLYGON,
  CELO: SupportedChainId.CELO,
  ARBITRUM: SupportedChainId.ARBITRUM_ONE,
  OPTIMISM: SupportedChainId.OPTIMISM,
}

export const BACKEND_CHAIN_NAMES: Chain[] = [Chain.Ethereum, Chain.Polygon, Chain.Optimism, Chain.Arbitrum, Chain.Celo]

export function isValidBackendChainName(chainName: string | undefined): chainName is Chain {
  if (!chainName) return false
  for (let i = 0; i < BACKEND_CHAIN_NAMES.length; i++) {
    if (chainName === BACKEND_CHAIN_NAMES[i]) return true
  }
  return false
}

export function getTokenDetailsURL(address: string, chainName?: Chain, chainId?: number) {
  if (address === ZERO_ADDRESS && chainId && chainId === SupportedChainId.MAINNET) {
    return `/tokens/${CHAIN_ID_TO_BACKEND_NAME[chainId].toLowerCase()}/${NATIVE_CHAIN_ID}`
  } else if (chainName) {
    return `/tokens/${chainName.toLowerCase()}/${address}`
  } else if (chainId) {
    const chainName = CHAIN_ID_TO_BACKEND_NAME[chainId]
    return chainName ? `/tokens/${chainName.toLowerCase()}/${address}` : ''
  } else {
    return ''
  }
}

export function unwrapToken<
  T extends {
    address?: string | null | undefined
  } | null
>(chainId: number, token: T): T {
  if (!token?.address) return token

  const address = token.address.toLowerCase()
  const nativeAddress = WRAPPED_NATIVE_CURRENCY[chainId]?.address.toLowerCase()
  if (address !== nativeAddress) return token

  const nativeToken = nativeOnChain(chainId)
  return {
    ...token,
    ...nativeToken,
    address: NATIVE_CHAIN_ID,
    extensions: undefined, // prevents marking cross-chain wrapped tokens as native
  }
}
