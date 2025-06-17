import { GraphQLJSON } from 'graphql-scalars'
import { HistoryDuration, Resolvers } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { priceHistory, tokenProject } from 'uniswap/src/test/fixtures'

export const defaultResolvers: Resolvers = {
  Query: {
    // eslint-disable-next-line max-params
    tokenProjects: (parent, args, context, info) => [
      tokenProject({
        priceHistory: priceHistory({
          duration: info.variableValues.duration
            ? (info.variableValues.duration as HistoryDuration)
            : HistoryDuration.Day,
        }),
      }),
    ],
  },
  AWSJSON: GraphQLJSON,
}
