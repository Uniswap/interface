import { GraphQLApi, TradingApi } from '@universe/api'

export function toGqlSafetyLevel(safetyLevel: TradingApi.SafetyLevel): GraphQLApi.SafetyLevel | null {
  switch (safetyLevel) {
    case TradingApi.SafetyLevel.BLOCKED:
      return GraphQLApi.SafetyLevel.Blocked
    case TradingApi.SafetyLevel.MEDIUM_WARNING:
      return GraphQLApi.SafetyLevel.MediumWarning
    case TradingApi.SafetyLevel.STRONG_WARNING:
      return GraphQLApi.SafetyLevel.StrongWarning
    case TradingApi.SafetyLevel.VERIFIED:
      return GraphQLApi.SafetyLevel.Verified
    default:
      return null
  }
}
