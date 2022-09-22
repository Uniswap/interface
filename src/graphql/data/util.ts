import { SupportedChainId } from 'constants/chains'
import { useAppSelector } from 'state/hooks'

import { Chain, HistoryDuration } from './__generated__/TokenQuery.graphql'

export enum TimePeriod {
  HOUR,
  DAY,
  WEEK,
  MONTH,
  YEAR,
  ALL,
}

export function toHistoryDuration(timePeriod: TimePeriod): HistoryDuration {
  switch (timePeriod) {
    case TimePeriod.HOUR:
      return 'HOUR'
    case TimePeriod.DAY:
      return 'DAY'
    case TimePeriod.WEEK:
      return 'WEEK'
    case TimePeriod.MONTH:
      return 'MONTH'
    case TimePeriod.YEAR:
      return 'YEAR'
    case TimePeriod.ALL:
      return 'MAX'
  }
}

export const CHAIN_IDS_TO_BACKEND_NAME: { [key: number]: Chain } = {
  [SupportedChainId.MAINNET]: 'ETHEREUM',
  [SupportedChainId.GOERLI]: 'ETHEREUM_GOERLI',
  [SupportedChainId.POLYGON]: 'POLYGON',
  [SupportedChainId.POLYGON_MUMBAI]: 'POLYGON',
  [SupportedChainId.CELO]: 'CELO',
  [SupportedChainId.CELO_ALFAJORES]: 'CELO',
  [SupportedChainId.ARBITRUM_ONE]: 'ARBITRUM',
  [SupportedChainId.ARBITRUM_RINKEBY]: 'ARBITRUM',
  [SupportedChainId.OPTIMISM]: 'OPTIMISM',
  [SupportedChainId.OPTIMISTIC_KOVAN]: 'OPTIMISM',
}

export function useGlobalChainName() {
  const chainId = useAppSelector((state) => state.application.chainId)
  return chainId && CHAIN_IDS_TO_BACKEND_NAME[chainId] ? CHAIN_IDS_TO_BACKEND_NAME[chainId] : 'ETHEREUM'
}

export const URL_CHAIN_PARAM_TO_BACKEND: { [key: string]: Chain } = {
  ethereum: 'ETHEREUM',
  polygon: 'POLYGON',
  celo: 'CELO',
  arbitrum: 'ARBITRUM',
  optimism: 'OPTIMISM',
}

export function validateUrlChainParam(chainName: string | undefined) {
  return chainName && URL_CHAIN_PARAM_TO_BACKEND[chainName] ? URL_CHAIN_PARAM_TO_BACKEND[chainName] : 'ETHEREUM'
}

export const CHAIN_NAME_TO_CHAIN_ID: { [key: string]: SupportedChainId } = {
  ETHEREUM: SupportedChainId.MAINNET,
  POLYGON: SupportedChainId.POLYGON,
  CELO: SupportedChainId.CELO,
  ARBITRUM: SupportedChainId.ARBITRUM_ONE,
  OPTIMISM: SupportedChainId.OPTIMISM,
}

export const BACKEND_CHAIN_NAMES: Chain[] = ['ARBITRUM', 'CELO', 'ETHEREUM', 'OPTIMISM', 'POLYGON']

export function isValidBackendChainName(chainName: string | undefined): chainName is Chain {
  if (!chainName) return false
  for (let i = 0; i < BACKEND_CHAIN_NAMES.length; i++) {
    if (chainName === BACKEND_CHAIN_NAMES[i]) return true
  }
  return false
}
