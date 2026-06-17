import { PositionStatus, ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { Protocols } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v1/types_pb'
import { GraphQLApi } from '@universe/api'
import { AppTFunction } from 'ui/src/i18n/types'

export function getProtocolVersionLabel(version: ProtocolVersion): string | undefined {
  switch (version) {
    case ProtocolVersion.V2:
      return 'v2'
    case ProtocolVersion.V3:
      return 'v3'
    case ProtocolVersion.V4:
      return 'v4'
    default:
      return undefined
  }
}

export function getProtocolVersionFromLabel(label: string | null | undefined): ProtocolVersion | undefined {
  switch (label) {
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

export function getProtocols(version: ProtocolVersion | undefined): Protocols | undefined {
  switch (version) {
    case ProtocolVersion.V2:
      return Protocols.V2
    case ProtocolVersion.V3:
      return Protocols.V3
    case ProtocolVersion.V4:
      return Protocols.V4
    default:
      return undefined
  }
}

export function protocolsToProtocolVersion(version: Protocols | string | undefined): ProtocolVersion {
  // Persisted ListPools data rehydrates protobuf enums as their name ("V2"/"V3"/"V4"); normalize to the numeric enum.
  const normalized = typeof version === 'string' ? Protocols[version as keyof typeof Protocols] : version
  switch (normalized) {
    case Protocols.V2:
      return ProtocolVersion.V2
    case Protocols.V3:
      return ProtocolVersion.V3
    case Protocols.V4:
      return ProtocolVersion.V4
    default:
      return ProtocolVersion.UNSPECIFIED
  }
}

export function getProtocolStatusLabel(status: PositionStatus, t: AppTFunction): string | undefined {
  switch (status) {
    case PositionStatus.IN_RANGE:
      return t('common.withinRange')
    case PositionStatus.OUT_OF_RANGE:
      return t('common.outOfRange')
    case PositionStatus.CLOSED:
      return t('common.closed')
  }
  return undefined
}

export function gqlToRestProtocolVersion(version: GraphQLApi.ProtocolVersion | undefined): ProtocolVersion | undefined {
  switch (version) {
    case GraphQLApi.ProtocolVersion.V2:
      return ProtocolVersion.V2
    case GraphQLApi.ProtocolVersion.V3:
      return ProtocolVersion.V3
    case GraphQLApi.ProtocolVersion.V4:
      return ProtocolVersion.V4
    default:
      return undefined
  }
}

export function poolEnabledProtocolVersion(
  protocolVersion: ProtocolVersion,
): protocolVersion is ProtocolVersion.V3 | ProtocolVersion.V4 {
  return protocolVersion === ProtocolVersion.V3 || protocolVersion === ProtocolVersion.V4
}
