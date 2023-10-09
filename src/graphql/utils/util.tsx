import { Currency } from '@pollum-io/sdk-core'
import { FarmPoolData, InfoAddress } from 'components/Farm/constants'
import { SupportedChainId } from 'constants/chains'
import { NATIVE_CHAIN_ID, nativeOnChain, WRAPPED_NATIVE_CURRENCY } from 'constants/tokens'
import { HistoryDuration } from 'graphql/data/__generated__/types-and-hooks'
import ms from 'ms.macro'
import { getNativeTokenDBAddress } from 'utils/nativeTokens'

import { Chain, ContractInput } from './types'

export enum PollingInterval {
  Slow = ms`5m`,
  Normal = ms`1m`,
  Fast = ms`12s`, // 12 seconds, block times for mainnet
  LightningMcQueen = ms`3s`, // 3 seconds, approx block times for polygon
}

// Polls a query only when the current component is mounted, as useQuery's pollInterval prop will continue to poll after unmount
// export function usePollQueryWhileMounted<T, K>(queryResult: QueryResult<T, K>, interval: PollingInterval) {
//   const { startPolling, stopPolling } = queryResult

//   useEffect(() => {
//     startPolling(interval)
//     return stopPolling
//   }, [interval, startPolling, stopPolling])
//   return queryResult
// }

export enum TimePeriod {
  DAY,
  WEEK,
  MONTH,
  YEAR,
}

export enum TimePeriodLeaderboard {
  DAY,
  WEEK,
  MONTH,
}

export function toHistoryDuration(timePeriod: TimePeriod): HistoryDuration {
  switch (timePeriod) {
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

// export function isPricePoint(p: PricePoint | null): p is PricePoint {
//   return p !== null
// }

export const CHAIN_ID_TO_BACKEND_NAME: { [key: number]: Chain } = {
  [SupportedChainId.ROLLUX]: 'ROLLUX' as Chain,
  [SupportedChainId.ROLLUX_TANENBAUM]: 'ROLLUX' as Chain,
}

export function chainIdToBackendName(chainId: number | undefined) {
  return chainId && CHAIN_ID_TO_BACKEND_NAME[chainId]
    ? CHAIN_ID_TO_BACKEND_NAME[chainId]
    : CHAIN_ID_TO_BACKEND_NAME[SupportedChainId.ROLLUX]
}

const GQL_CHAINS: number[] = [
  // SupportedChainId.MAINNET,
  SupportedChainId.ROLLUX,
  // SupportedChainId.POLYGON,
  // SupportedChainId.ARBITRUM_ONE,
  // SupportedChainId.CELO,
]

export function isGqlSupportedChain(chainId: number | undefined): chainId is SupportedChainId {
  return !!chainId && GQL_CHAINS.includes(chainId)
}
export function toContractInput(currency: Currency): ContractInput {
  const chain = chainIdToBackendName(currency.chainId)
  return { chain, address: currency.isToken ? currency.address : getNativeTokenDBAddress(chain) }
}

const URL_CHAIN_PARAM_TO_BACKEND: { [key: string]: Chain } = {
  // ethereum: Chain.Ethereum,
  // polygon: Chain.Polygon,
  // celo: Chain.Celo,
  // arbitrum: Chain.Arbitrum,
  rollux: 'ROLLUX' as Chain,
  // bnb: Chain.Bnb,
}

export function validateUrlChainParam(chainName: string | undefined) {
  return chainName && URL_CHAIN_PARAM_TO_BACKEND[chainName]
    ? URL_CHAIN_PARAM_TO_BACKEND[chainName]
    : ('ROLLUX' as Chain)
}

// TODO(cartcrom): refactor into safer lookup & replace usage
// TODO verify this later
export const CHAIN_NAME_TO_CHAIN_ID: { [key in string]: ChainId } = {
  ['ROLLUX' as Chain]: ChainId.ROLLUX,
}

export function fromGraphQLChain(chain: Chain): ChainId {
  return CHAIN_NAME_TO_CHAIN_ID[chain]
}

export const BACKEND_CHAIN_NAMES: Chain[] = ['ROLLUX' as Chain]

export function getTokenDetailsURL({
  address,
  chain,
  inputAddress,
}: {
  address?: string | null
  chain: Chain | string
  inputAddress?: string | null
}) {
  const chainName = chain.toLowerCase()
  const tokenAddress = address ?? NATIVE_CHAIN_ID
  const inputAddressSuffix = inputAddress ? `?inputCurrency=${inputAddress}` : ''
  return `/tokens/${chainName}/${tokenAddress}${inputAddressSuffix}`
}

// export function unwrapToken<
//   T extends {
//     address?: string | null | undefined
//   } | null
// >(chainId: number, token: T): T {
//   if (!token?.address) return token

//   const address = token.address.toLowerCase()
//   const nativeAddress = WRAPPED_NATIVE_CURRENCY[chainId]?.address.toLowerCase()
//   if (address !== nativeAddress) return token

//   const nativeToken = nativeOnChain(chainId)
//   return {
//     ...token,
//     ...nativeToken,
//     address: NATIVE_CHAIN_ID,
//     extensions: undefined, // prevents marking cross-chain wrapped tokens as native
//   }
// }

export function unwrapTokenRollux<
  T extends {
    id?: string | null
  } | null
>(chainId: number, token: T): T {
  if (!token?.id) return token

  const address = token.id.toLowerCase()
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

export const getGammaData = async () => {
  try {
    const data = await fetch(`${process.env.REACT_APP_GAMMA_API_ENDPOINT}/pegasys/rollux/hypervisors/allData`)
    const gammaData = (await data.json()) as { [key: string]: FarmPoolData }
    return gammaData
  } catch (e) {
    console.log(e)
    return null
    // TODO: check backup endpoint with gamma
    // try {
    //   const data = await fetch(`${process.env.REACT_APP_GAMMA_API_ENDPOINT_BACKUP}/pegasys/rollux/hypervisors/allData`)
    //   const gammaData = await data.json()
    //   return gammaData
    // } catch (e) {
    //   console.log(e)
    //   return null
    // }
  }
}

export const getGammaPositions = async (account?: string) => {
  if (!account) return null
  try {
    const data = await fetch(`${process.env.REACT_APP_GAMMA_API_ENDPOINT}/pegasys/rollux/user/${account}`)
    const positions = (await data.json()) as { [key: string]: InfoAddress }

    return positions[account.toLowerCase()]
  } catch (e) {
    console.log(e)
    return null
    // try {
    //   const data = await fetch(`${process.env.REACT_APP_GAMMA_API_ENDPOINT_BACKUP}/pegasys/rollux/user/${account}`)
    //   const positions = await data.json()
    //   return positions[account.toLowerCase()]
    // } catch (e) {
    //   console.log(e)
    //   return null
    // }
  }
}

export const getGammaRewards = async () => {
  try {
    const data = await fetch(`${process.env.REACT_APP_GAMMA_API_ENDPOINT}/pegasys/rollux/allRewards2`)
    const gammaData = await data.json()
    return gammaData
  } catch (e) {
    console.log(e)
    return null
    // try {
    //   const data = await fetch(`${process.env.REACT_APP_GAMMA_API_ENDPOINT_BACKUP}/pegasys/rollux/allRewards2`)
    //   const gammaData = await data.json()
    //   return gammaData
    // } catch (e) {
    //   console.log(e)
    //   return null
    // }
  }
}
