import { QueryResult } from '@apollo/client'
import { SupportedChainId } from 'constants/chains'
import { NATIVE_CHAIN_ID, nativeOnChain, WRAPPED_NATIVE_CURRENCY } from 'constants/tokens'
import ms from 'ms.macro'
import { useEffect } from 'react'

import { Chain, HistoryDuration } from './__generated__/types-and-hooks'

export enum PollingInterval {
  Slow = ms`5m`,
  Normal = ms`1m`,
  Fast = ms`12s`, // 12 seconds, block times for mainnet
  LightningMcQueen = ms`3s`, // 3 seconds, approx block times for polygon
}

// Polls a query only when the current component is mounted, as useQuery's pollInterval prop will continue to poll after unmount
export function usePollQueryWhileMounted<T, K>(queryResult: QueryResult<T, K>, interval: PollingInterval) {
  const { startPolling, stopPolling } = queryResult

  useEffect(() => {
    startPolling(interval)
    return stopPolling
  }, [interval, startPolling, stopPolling])

  return queryResult
}

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
  [SupportedChainId.MAINNET]: Chain.Evmos,
  [SupportedChainId.FUJI]: Chain.Fuji,
  [SupportedChainId.TESTNET]: Chain.Tevmos,
}

export function chainIdToBackendName(chainId: number | undefined) {
  return chainId && CHAIN_ID_TO_BACKEND_NAME[chainId]
    ? CHAIN_ID_TO_BACKEND_NAME[chainId]
    : CHAIN_ID_TO_BACKEND_NAME[SupportedChainId.MAINNET]
}

const URL_CHAIN_PARAM_TO_BACKEND: { [key: string]: Chain } = {
  evmos: Chain.Evmos,
  fuji: Chain.Fuji,
  tevmos: Chain.Tevmos,
}

export function validateUrlChainParam(chainName: string | undefined) {
  return chainName && URL_CHAIN_PARAM_TO_BACKEND[chainName] ? URL_CHAIN_PARAM_TO_BACKEND[chainName] : Chain.Evmos
}

export const CHAIN_NAME_TO_CHAIN_ID: { [key: string]: SupportedChainId } = {
  EVMOS: SupportedChainId.MAINNET,
  FUJI: SupportedChainId.FUJI,
  TEVMOS: SupportedChainId.TESTNET,
}

export const BACKEND_CHAIN_NAMES: Chain[] = [Chain.Evmos, Chain.Fuji, Chain.Tevmos]

export function getTokenDetailsURL({ address, chain }: { address?: string | null; chain: Chain }) {
  return `/tokens/${chain.toLowerCase()}/${address ?? NATIVE_CHAIN_ID}`
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
