import { ProtectionInfo as ProtectionInfoProtobuf } from '@uniswap/client-explore/dist/uniswap/explore/v1/service_pb'
import {
  ProtectionAttackType,
  ProtectionInfo,
  ProtectionResult,
  SafetyLevel,
} from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { logger } from 'utilities/src/logger/logger'

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
export function parseSafetyLevel(safetyLevel?: string): SafetyLevel | undefined {
  if (!safetyLevel) {
    return undefined
  }
  const validSafetyLevels: SafetyLevel[] = Object.values(SafetyLevel)
  if (validSafetyLevels.includes(safetyLevel as SafetyLevel)) {
    return safetyLevel as SafetyLevel
  } else {
    logger.warn(
      'uniswap/data/rest/utils.ts',
      'parseSafetyLevel',
      `Invalid safetyLevel from REST TokenRankings query: ${safetyLevel}`,
    )
    return undefined
  }
}

export function parseProtectionInfo(protectionInfo?: ProtectionInfoProtobuf): ProtectionInfo | undefined {
  if (!protectionInfo) {
    return undefined
  }

  let protectionResult: ProtectionResult | undefined
  // protectionInfo.result and protectionInfo.attackTypes are a string instead of an enum
  // message TokenProtectionInfo {
  //   string result = 1;
  //   ...
  // }
  // So result and attackTypes are a capitalized string instead of an uppercase enum value
  const validProtectionResults: string[] = Object.values(ProtectionResult)
  if (validProtectionResults.includes(protectionInfo.result.toUpperCase())) {
    protectionResult = protectionInfo.result.toUpperCase() as ProtectionResult
  } else {
    logger.warn(
      'uniswap/data/rest/utils.ts',
      'parseProtectionInfo',
      `Invalid protectionResult from REST TokenRankings query: ${protectionInfo.result}`,
    )
    return undefined
  }

  const validAttackTypes: string[] = Object.values(ProtectionAttackType)
  const attackTypes = protectionInfo.attackTypes
    .filter((at) => validAttackTypes.includes(at.toUpperCase()))
    .map((at) => at.toUpperCase() as ProtectionAttackType)
  if (attackTypes.length !== protectionInfo.attackTypes.length) {
    logger.warn(
      'uniswap/data/rest/utils.ts',
      'parseProtectionInfo',
      `Invalid attackTypes in REST TokenRankings query: ${protectionInfo.attackTypes}`,
    )
  }

  return { attackTypes, result: protectionResult }
}
