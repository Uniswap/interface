import type { GetPortfolioResponse } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import type { ChainBalance, MultichainBalance, ProtectionInfo } from '@uniswap/client-data-api/dist/data/v1/types_pb'
import type { GraphQLApi, SpamCode } from '@universe/api'
import { normalizeTokenAddressForCache } from 'uniswap/src/data/cache'
import { type PortfolioChainBalance, type PortfolioMultichainBalance } from 'uniswap/src/features/dataApi/types'
import { buildCurrency, buildCurrencyInfo } from 'uniswap/src/features/dataApi/utils/buildCurrency'
import {
  getRestCurrencySafetyInfo,
  getRestTokenSafetyInfo,
} from 'uniswap/src/features/dataApi/utils/getCurrencySafetyInfo'
import { currencyId } from 'uniswap/src/utils/currencyId'

/**
 * Converts API MultichainBalance (with chainBalances[]) to app PortfolioMultichainBalance.
 * Handles both true multichain (N chainBalances) and legacy (1 chainBalance) — the latter
 * after transformPortfolioToMultichain has been applied to the response.
 * Uses multichain ID from the API when present; otherwise falls back to first token's currencyId.
 */
export function toPortfolioMultichainBalance(
  multichainBalance: MultichainBalance,
  ownerAddress?: string,
): PortfolioMultichainBalance | undefined {
  const chainBalances = multichainBalance.chainBalances
  if (chainBalances.length === 0) {
    return undefined
  }

  const tokens: PortfolioChainBalance[] = []
  const { name, symbol, logoUrl, protectionInfo, safetyLevel, spamCode } = multichainBalance

  const { isSpam, spamCodeValue, mappedSafetyLevel } = getRestTokenSafetyInfo({ spamCode, safetyLevel })

  for (const cb of chainBalances) {
    const chainToken = chainBalanceToPortfolioChainBalance(cb, {
      name,
      symbol,
      logoUrl,
      isSpam,
      spamCodeValue,
      mappedSafetyLevel,
      protectionInfo,
    })
    if (chainToken) {
      tokens.push(chainToken)
    }
  }

  const firstToken = tokens[0]
  if (!firstToken) {
    return undefined
  }
  const totalAmount = multichainBalance.totalAmount?.amount ?? tokens.reduce((sum, t) => sum + t.quantity, 0)

  const firstTokenId = firstToken.currencyInfo.currencyId

  return {
    id: firstTokenId,
    cacheId: `TokenBalance:${firstTokenId}${ownerAddress ? `-${ownerAddress}` : ''}`,
    name: multichainBalance.name,
    symbol: multichainBalance.symbol,
    logoUrl: multichainBalance.logoUrl,
    totalAmount,
    priceUsd: multichainBalance.priceUsd,
    pricePercentChange1d: multichainBalance.pricePercentChange1d,
    totalValueUsd: multichainBalance.totalValueUsd,
    isHidden: multichainBalance.isHidden,
    tokens,
  }
}

/**
 * Builds a by-id map of portfolio multichain balances from a GetPortfolio response.
 * Keys are multichain ID from the API when present, otherwise the single token's currencyId (legacy).
 * Returns undefined when the response has no multichainBalances.
 */
export function getPortfolioMultichainBalancesById(
  response: GetPortfolioResponse | undefined,
  ownerAddress?: string,
): Record<string, PortfolioMultichainBalance> | undefined {
  const multichainBalances = response?.portfolio?.multichainBalances
  if (!multichainBalances?.length) {
    return undefined
  }

  const byId: Record<string, PortfolioMultichainBalance> = {}
  for (const mb of multichainBalances) {
    const balance = toPortfolioMultichainBalance(mb, ownerAddress)
    if (balance) {
      byId[balance.id] = balance
    }
  }
  return byId
}

function chainBalanceToPortfolioChainBalance(
  chainBalance: ChainBalance,
  shared: {
    name: string
    symbol: string
    logoUrl: string
    isSpam: boolean
    spamCodeValue: SpamCode
    mappedSafetyLevel: GraphQLApi.SafetyLevel | undefined
    protectionInfo?: ProtectionInfo
  },
): PortfolioChainBalance | undefined {
  const { chainId, address: unnormalizedAddress, decimals, amount, valueUsd } = chainBalance
  const address = normalizeTokenAddressForCache(unnormalizedAddress)

  const currency = buildCurrency({
    chainId,
    address,
    decimals,
    symbol: shared.symbol,
    name: shared.name,
  })

  if (!currency) {
    return undefined
  }

  const currencyIdResult = currencyId(currency)
  const quantity = amount?.amount ?? 0

  const currencyInfo = buildCurrencyInfo({
    currency,
    currencyId: currencyIdResult,
    logoUrl: shared.logoUrl || undefined,
    isSpam: shared.isSpam,
    safetyInfo: getRestCurrencySafetyInfo(shared.mappedSafetyLevel, shared.protectionInfo),
    spamCode: shared.spamCodeValue,
  })

  return {
    chainId,
    address,
    decimals,
    quantity,
    valueUsd,
    currencyInfo,
  }
}
