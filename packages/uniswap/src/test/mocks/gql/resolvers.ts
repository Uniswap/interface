import { GraphQLApi } from '@universe/api'
import { GraphQLJSON } from 'graphql-scalars'
import { priceHistory, tokenProject } from 'uniswap/src/test/fixtures'

export const defaultResolvers: GraphQLApi.Resolvers = {
  Query: {
    // eslint-disable-next-line max-params
    tokenProjects: (parent, args, context, info) => [
      tokenProject({
        priceHistory: priceHistory({
          duration: info.variableValues.duration
            ? (info.variableValues.duration as GraphQLApi.HistoryDuration)
            : GraphQLApi.HistoryDuration.Day,
        }),
      }),
    ],
  },
  AWSJSON: GraphQLJSON,
}
