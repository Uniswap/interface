import { ApolloError } from '@apollo/client'
import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import type { TransactionTokenSide, UniswapTransaction } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { TransactionEventType } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { GraphQLApi } from '@universe/api'
import { isUniverseChainId, toGraphQLChain } from 'uniswap/src/features/chains/utils'
import { NATIVE_CHAIN_ID } from '~/constants/tokens'

const EVENT_TYPE_TO_POOL_TRANSACTION_TYPE: Partial<Record<TransactionEventType, GraphQLApi.PoolTransactionType>> = {
  [TransactionEventType.SWAP]: GraphQLApi.PoolTransactionType.Swap,
  [TransactionEventType.ADD]: GraphQLApi.PoolTransactionType.Add,
  [TransactionEventType.REMOVE]: GraphQLApi.PoolTransactionType.Remove,
}

const PROTOCOL_VERSION_TO_GQL: Partial<Record<ProtocolVersion, GraphQLApi.ProtocolVersion>> = {
  [ProtocolVersion.V2]: GraphQLApi.ProtocolVersion.V2,
  [ProtocolVersion.V3]: GraphQLApi.ProtocolVersion.V3,
  [ProtocolVersion.V4]: GraphQLApi.ProtocolVersion.V4,
}

const GQL_TO_PROTOCOL_VERSION: Partial<Record<GraphQLApi.ProtocolVersion, ProtocolVersion>> = {
  [GraphQLApi.ProtocolVersion.V2]: ProtocolVersion.V2,
  [GraphQLApi.ProtocolVersion.V3]: ProtocolVersion.V3,
  [GraphQLApi.ProtocolVersion.V4]: ProtocolVersion.V4,
}

export function gqlProtocolVersionToRestProtocolVersion(
  version: GraphQLApi.ProtocolVersion,
): ProtocolVersion | undefined {
  return GQL_TO_PROTOCOL_VERSION[version]
}

/** Wraps a REST/Connect error so consumers built around Apollo error plumbing keep working. */
export function connectErrorToApolloError(error: Error | null): ApolloError | undefined {
  return error ? new ApolloError({ errorMessage: error.message }) : undefined
}

type GqlPoolTxToken = GraphQLApi.PoolTxFragment['token0']

function v2TokenSideToGqlToken(side: TransactionTokenSide | undefined, chain: GraphQLApi.Chain): GqlPoolTxToken {
  const token = side?.token
  const address = token?.address || undefined
  const id = `${chain}:${address ?? NATIVE_CHAIN_ID}`
  return {
    __typename: 'Token',
    id,
    chain,
    address,
    symbol: token?.symbol || undefined,
    decimals: token?.decimals,
    project: token
      ? {
          __typename: 'TokenProject',
          id: `${id}:project`,
          name: token.name || undefined,
          tokens: [],
          logo: token.project?.logoUrl
            ? { __typename: 'Image', id: `${id}:logo`, url: token.project.logoUrl }
            : undefined,
        }
      : undefined,
  }
}

/**
 * Adapts a v2 ListTransactions row to the GraphQL PoolTxFragment shape consumed by the
 * Explore Recent Transactions table. Returns undefined for rows that can't be represented
 * (unknown chain, unspecified event type or protocol version).
 *
 * Amounts pass through as-is. BE currently returns absolute values but is adding legacy-style
 * signed quantities (positive = token entering the pool / sold); consumers deriving Buy/Sell
 * from the sign will be wrong until that lands (flag stays off).
 */
export function uniswapTransactionToPoolTx(
  tx: UniswapTransaction,
  index: number,
): GraphQLApi.PoolTxFragment | undefined {
  const type = EVENT_TYPE_TO_POOL_TRANSACTION_TYPE[tx.eventType]
  const protocolVersion = PROTOCOL_VERSION_TO_GQL[tx.protocolVersion]
  if (!type || !protocolVersion || !isUniverseChainId(tx.chainId)) {
    return undefined
  }
  const chain = toGraphQLChain(tx.chainId)
  return {
    __typename: 'PoolTransaction',
    // One tx hash can contain multiple pool events; index disambiguates the row id.
    id: `${tx.chainId}:${tx.txHash}:${tx.poolId}:${tx.eventType}:${index}`,
    chain,
    protocolVersion,
    timestamp: Number(tx.timestampMs / 1000n),
    hash: tx.txHash,
    account: tx.walletAddress,
    token0: v2TokenSideToGqlToken(tx.token0, chain),
    token1: v2TokenSideToGqlToken(tx.token1, chain),
    token0Quantity: tx.token0?.amount ?? '0',
    token1Quantity: tx.token1?.amount ?? '0',
    type,
    usdValue: { __typename: 'Amount', id: `${tx.chainId}:${tx.txHash}:${index}:usd`, value: tx.amountUsd },
  }
}
