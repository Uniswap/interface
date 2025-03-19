import { PartialMessage } from '@bufbuild/protobuf'
import { ConnectError } from '@connectrpc/connect'
import { useQuery } from '@connectrpc/connect-query'
import { UseQueryResult } from '@tanstack/react-query'
import { tokenRankings } from '@uniswap/client-explore/dist/uniswap/explore/v1/service-ExploreStatsService_connectquery'
import {
  ProtectionInfo as ProtectionInfoProtobuf,
  TokenRankingsRequest,
  TokenRankingsResponse,
  TokenRankingsStat,
} from '@uniswap/client-explore/dist/uniswap/explore/v1/service_pb'
import {
  ProtectionAttackType,
  ProtectionInfo,
  ProtectionResult,
  SafetyLevel,
} from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { uniswapGetTransport } from 'uniswap/src/data/rest/base'
import { fromGraphQLChain } from 'uniswap/src/features/chains/utils'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { buildCurrency, buildCurrencyInfo, getCurrencySafetyInfo } from 'uniswap/src/features/dataApi/utils'
import { currencyId } from 'uniswap/src/utils/currencyId'
import { logger } from 'utilities/src/logger/logger'

/**
 * Wrapper around Tanstack useQuery for the Uniswap REST BE service TokenRankings
 * This includes the top tokens pre-sorted by various filters
 * @param input { chainId: string } - string representation of the chain to query or `ALL_NETWORKS` for aggregated data
 * @returns UseQueryResult<TokenRankingsResponse, ConnectError>
 */
export function useTokenRankingsQuery(
  input?: PartialMessage<TokenRankingsRequest>,
  enabled = true,
): UseQueryResult<TokenRankingsResponse, ConnectError> {
  return useQuery(tokenRankings, input, { transport: uniswapGetTransport, enabled })
}

/**
 * Helper functions to parse string enum fields from REST API responses.
 *
 * Note: The Protobuf types use string enums instead of strictly typed enums because
 * Protobuf does not allow defining two of the same enum name in the same proto file. (i.e. both ProtectionAttackType and
 * ProtectionResult contain 'UNKNOWN')
 *
 * Since the Explore service just calls GraphQL, we have confidence the string values will match the GraphQL enums.
 * Just validating here!
 */
function parseSafetyLevel(safetyLevel?: string): SafetyLevel | undefined {
  if (!safetyLevel) {
    return undefined
  }
  const validSafetyLevels: SafetyLevel[] = Object.values(SafetyLevel)
  if (validSafetyLevels.includes(safetyLevel as SafetyLevel)) {
    return safetyLevel as SafetyLevel
  } else {
    logger.warn(
      'uniswap/data/rest/tokenRankings.ts',
      'parseSafetyLevel',
      `Invalid safetyLevel from REST TokenRankings query: ${safetyLevel}`,
    )
    return undefined
  }
}

function parseProtectionInfo(protectionInfo?: ProtectionInfoProtobuf): ProtectionInfo | undefined {
  if (!protectionInfo) {
    return undefined
  }

  let protectionResult: ProtectionResult | undefined
  const validProtectionResults: ProtectionResult[] = Object.values(ProtectionResult)
  if (validProtectionResults.includes(protectionInfo.result as ProtectionResult)) {
    protectionResult = protectionInfo.result as ProtectionResult
  } else {
    logger.warn(
      'uniswap/data/rest/tokenRankings.ts',
      'parseProtectionInfo',
      `Invalid protectionResult from REST TokenRankings query: ${protectionInfo.result}`,
    )
    return undefined
  }

  const validAttackTypes: ProtectionAttackType[] = Object.values(ProtectionAttackType)
  const attackTypes = protectionInfo.attackTypes
    .filter((at) => validAttackTypes.includes(at as ProtectionAttackType))
    .map((at) => at as ProtectionAttackType)
  if (attackTypes.length !== protectionInfo.attackTypes.length) {
    logger.warn(
      'uniswap/data/rest/tokenRankings.ts',
      'parseProtectionInfo',
      `Invalid attackTypes in REST TokenRankings query: ${protectionInfo.attackTypes}`,
    )
  }

  return { attackTypes, result: protectionResult }
}

export function tokenRankingsStatToCurrencyInfo(tokenRankingsStat: TokenRankingsStat): CurrencyInfo | null {
  const { chain, address, symbol, name, logo, decimals, feeData } = tokenRankingsStat
  const chainId = fromGraphQLChain(chain)
  const protectionInfo = parseProtectionInfo(tokenRankingsStat.protectionInfo)
  const safetyLevel = parseSafetyLevel(tokenRankingsStat.safetyLevel)

  if (!chainId || !symbol || !name) {
    return null
  }

  const currency = buildCurrency({
    chainId,
    address,
    decimals,
    symbol,
    name,
    buyFeeBps: feeData?.buyFeeBps,
    sellFeeBps: feeData?.sellFeeBps,
  })

  if (!currency) {
    return null
  }

  return buildCurrencyInfo({
    currency,
    currencyId: currencyId(currency),
    logoUrl: logo,
    safetyInfo: getCurrencySafetyInfo(safetyLevel, protectionInfo),
  })
}
