import { GraphQLJSON } from 'graphql-scalars'
import {
  HistoryDuration,
  Resolvers,
} from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { priceHistory, tokenProject } from 'wallet/src/test/fixtures'

export const defaultResolvers: Resolvers = {
  Query: {
    tokenProjects: (parent, args, context, info) => [
      tokenProject({
        priceHistory: priceHistory({
          duration: (info.variableValues.duration as HistoryDuration) ?? HistoryDuration.Day,
        }),
      }),
    ],
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
