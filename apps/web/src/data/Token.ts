import { GraphQLApi } from '@universe/api'

// The difference between Token and TokenProject:
// Token: an on-chain entity referring to a contract (e.g. uni token on ethereum 0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984)
// TokenProject: an off-chain, aggregated entity that consists of a token and its bridged tokens (e.g. uni token on all chains)
// TokenMarket and TokenProjectMarket then are market data entities for the above.
//     TokenMarket is per-chain market data for contracts pulled from the graph.
//     TokenProjectMarket is aggregated market data (aggregated over multiple dexes and centralized exchanges) that we get from coingecko.

export type TokenQueryData = GraphQLApi.TokenWebQuery['token']
