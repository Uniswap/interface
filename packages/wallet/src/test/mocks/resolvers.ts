import { GraphQLJSON } from 'graphql-scalars'
import { HistoryDuration, Resolvers } from 'wallet/src/data/__generated__/types-and-hooks'
import {
  TokenProjectDay,
  TokenProjectMonth,
  TokenProjectWeek,
  TokenProjectYear,
} from 'wallet/src/test/gqlFixtures'

export const resolvers: Resolvers = {
  Query: {
    tokenProjects: (parent, args, context, info) => {
      // Select token project based on the duration
      switch (info.variableValues.duration) {
        case HistoryDuration.Year:
          return [TokenProjectYear]
        case HistoryDuration.Month:
          return [TokenProjectMonth]
        case HistoryDuration.Week:
          return [TokenProjectWeek]
        case HistoryDuration.Day:
        default:
          return [TokenProjectDay]
      }
    },
  },
  AWSJSON: GraphQLJSON,
  ActivityDetails: {
    __resolveType: (details) => {
      if (details.__typename) {
        return details.__typename
      }

      if ('inputToken' in details && 'outputToken' in details) {
        return 'SwapOrderDetails'
      } else if ('from' in details && 'to' in details) {
        return 'TransactionDetails'
      }

      return 'TransactionDetails'
    },
  },
  AssetChange: {
    __resolveType: (change) => {
      if (change.__typename) {
        return change.__typename
      }

      if ('nftStandard' in change) {
        if ('approvedAddress' in change) {
          return 'NftApproval'
        } else if ('recipient' in change) {
          return 'NftTransfer'
        } else if ('approved' in change) {
          return 'NftApproveForAll'
        }
      } else {
        if ('approvedAddress' in change) {
          return 'TokenApproval'
        } else if ('recipient' in change) {
          return 'TokenTransfer'
        }
      }

      return null
    },
  },
}
