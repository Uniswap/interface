import { type PlainMessage } from '@bufbuild/protobuf'
import { Platform, type PlatformAddress, type WalletAccount } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { type ProtectionInfo as ProtectionInfoProtobuf } from '@uniswap/client-explore/dist/uniswap/explore/v1/service_pb'
import {
  ProtectionAttackType,
  type ProtectionInfo,
  ProtectionResult,
  SafetyLevel,
} from '@universe/api/src/clients/graphql/__generated__/schema-types'
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
      'api/clients/connectRpc/utils.ts',
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
      'api/clients/connectRpc/utils.ts',
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
      'api/clients/connectRpc/utils.ts',
      'parseProtectionInfo',
      `Invalid attackTypes in REST TokenRankings query: ${protectionInfo.attackTypes}`,
    )
  }

  return { attackTypes, result: protectionResult }
}

export function parseRestProtocolVersion(version: string | undefined): ProtocolVersion | undefined {
  switch (version?.toLowerCase()) {
    case 'v2':
      return ProtocolVersion.V2
    case 'v3':
      return ProtocolVersion.V3
    case 'v4':
      return ProtocolVersion.V4
    default:
      return undefined
  }
}

/**
 * Helps simplify REST endpoint interfaces that expect a walletAccount object instead
 * of simple address fields
 */
function createWalletAccount({ evmAddress, svmAddress }: { evmAddress?: string; svmAddress?: string }): {
  walletAccount: PlainMessage<WalletAccount>
} {
  const platformAddresses: PlainMessage<PlatformAddress>[] = []

  if (evmAddress) {
    platformAddresses.push({ platform: Platform.EVM, address: evmAddress })
  }

  if (svmAddress) {
    platformAddresses.push({ platform: Platform.SVM, address: svmAddress })
  }

  return {
    walletAccount: {
      platformAddresses,
    },
  }
}

export type WithoutWalletAccount<T> = Omit<T, 'walletAccount'>

/**
 * Helper function to transform input that includes evmAddress/svmAddress to use walletAccount instead
 */
export function transformInput<T extends Record<string, unknown> & { walletAccount?: never }>(
  input: (T & { evmAddress?: string; svmAddress?: string }) | undefined,
):
  | (Omit<T, 'evmAddress' | 'svmAddress' | 'walletAccount'> & { walletAccount: PlainMessage<WalletAccount> })
  | undefined {
  if (!input) {
    return undefined
  }

  const { evmAddress, svmAddress, walletAccount: _walletAccount, ...restInput } = input

  return {
    ...restInput,
    ...createWalletAccount({ evmAddress, svmAddress }),
  }
}
