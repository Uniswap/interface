import { GraphQLClient } from 'graphql-request'
import { RequestInit } from 'graphql-request/dist/types.dom'
import { useQuery, UseQueryOptions } from 'react-query'
export type Maybe<T> = T | null
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] }
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> }
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> }

function fetcher<TData, TVariables>(
  client: GraphQLClient,
  query: string,
  variables?: TVariables,
  headers?: RequestInit['headers']
) {
  return async (): Promise<TData> => client.request<TData, TVariables>(query, variables, headers)
}
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string
  String: string
  Boolean: boolean
  Int: number
  Float: number
  DateTime: any
  bigint: any
  bytea: any
  timestamp: any
  v2_BigDecimal: any
  v2_BigInt: any
  v2_Bytes: any
  v3_BigDecimal: any
  v3_BigInt: any
  v3_Bytes: any
  v3arbitrum_BigDecimal: any
  v3arbitrum_BigInt: any
  v3arbitrum_Bytes: any
  v3polygon_BigDecimal: any
  v3polygon_BigInt: any
  v3polygon_Bytes: any
  v3rinkeby_BigDecimal: any
  v3rinkeby_BigInt: any
  v3rinkeby_Bytes: any
}

/** Boolean expression to compare columns of type "Int". All fields are combined with logical 'AND'. */
export type Int_Comparison_Exp = {
  _eq?: Maybe<Scalars['Int']>
  _gt?: Maybe<Scalars['Int']>
  _gte?: Maybe<Scalars['Int']>
  _in?: Maybe<Array<Scalars['Int']>>
  _is_null?: Maybe<Scalars['Boolean']>
  _lt?: Maybe<Scalars['Int']>
  _lte?: Maybe<Scalars['Int']>
  _neq?: Maybe<Scalars['Int']>
  _nin?: Maybe<Array<Scalars['Int']>>
}

/** mutation root */
export type Mutation = {
  __typename?: 'Mutation'
  /** delete data from the table: "blocks" */
  delete_blocks?: Maybe<Blocks_Mutation_Response>
  /** delete single row from the table: "blocks" */
  delete_blocks_by_pk?: Maybe<Blocks>
  /** insert data into the table: "blocks" */
  insert_blocks?: Maybe<Blocks_Mutation_Response>
  /** insert a single row into the table: "blocks" */
  insert_blocks_one?: Maybe<Blocks>
  /** update data of the table: "blocks" */
  update_blocks?: Maybe<Blocks_Mutation_Response>
  /** update single row of the table: "blocks" */
  update_blocks_by_pk?: Maybe<Blocks>
}

/** mutation root */
export type MutationDelete_BlocksArgs = {
  where: Blocks_Bool_Exp
}

/** mutation root */
export type MutationDelete_Blocks_By_PkArgs = {
  number: Scalars['Int']
}

/** mutation root */
export type MutationInsert_BlocksArgs = {
  objects: Array<Blocks_Insert_Input>
  on_conflict?: Maybe<Blocks_On_Conflict>
}

/** mutation root */
export type MutationInsert_Blocks_OneArgs = {
  object: Blocks_Insert_Input
  on_conflict?: Maybe<Blocks_On_Conflict>
}

/** mutation root */
export type MutationUpdate_BlocksArgs = {
  _inc?: Maybe<Blocks_Inc_Input>
  _set?: Maybe<Blocks_Set_Input>
  where: Blocks_Bool_Exp
}

/** mutation root */
export type MutationUpdate_Blocks_By_PkArgs = {
  _inc?: Maybe<Blocks_Inc_Input>
  _set?: Maybe<Blocks_Set_Input>
  pk_columns: Blocks_Pk_Columns_Input
}

export type Query = {
  __typename?: 'Query'
  /** Access to subgraph metadata */
  _meta?: Maybe<V3__Meta_>
  /** fetch data from the table: "blocks" */
  blocks: Array<Blocks>
  /** fetch aggregated fields from the table: "blocks" */
  blocks_aggregate: Blocks_Aggregate
  /** fetch data from the table: "blocks" using primary key columns */
  blocks_by_pk?: Maybe<Blocks>
  bundle?: Maybe<V3_Bundle>
  bundles: Array<V3_Bundle>
  burn?: Maybe<V3_Burn>
  burns: Array<V3_Burn>
  collect?: Maybe<V3_Collect>
  collects: Array<V3_Collect>
  factories: Array<V3_Factory>
  factory?: Maybe<V3_Factory>
  flash?: Maybe<V3_Flash>
  flashes: Array<V3_Flash>
  mint?: Maybe<V3_Mint>
  mints: Array<V3_Mint>
  pool?: Maybe<V3_Pool>
  poolDayData?: Maybe<V3_PoolDayData>
  poolDayDatas: Array<V3_PoolDayData>
  poolHourData?: Maybe<V3_PoolHourData>
  poolHourDatas: Array<V3_PoolHourData>
  pools: Array<V3_Pool>
  position?: Maybe<V3_Position>
  positionSnapshot?: Maybe<V3_PositionSnapshot>
  positionSnapshots: Array<V3_PositionSnapshot>
  positions: Array<V3_Position>
  swap?: Maybe<V3_Swap>
  swaps: Array<V3_Swap>
  tick?: Maybe<V3_Tick>
  tickDayData?: Maybe<V3_TickDayData>
  tickDayDatas: Array<V3_TickDayData>
  tickHourData?: Maybe<V3_TickHourData>
  tickHourDatas: Array<V3_TickHourData>
  ticks: Array<V3_Tick>
  token?: Maybe<V3_Token>
  tokenDayData?: Maybe<V3_TokenDayData>
  tokenDayDatas: Array<V3_TokenDayData>
  tokenHourData?: Maybe<V3_TokenHourData>
  tokenHourDatas: Array<V3_TokenHourData>
  tokenTimeseries?: Maybe<TimeseriesOutput>
  tokens: Array<V3_Token>
  transaction?: Maybe<V3_Transaction>
  transactions: Array<V3_Transaction>
  uniswapDayData?: Maybe<V3_UniswapDayData>
  uniswapDayDatas: Array<V3_UniswapDayData>
  /** Access to subgraph metadata */
  v2__meta?: Maybe<V2__Meta_>
  v2_bundle?: Maybe<V2_Bundle>
  v2_bundles: Array<V2_Bundle>
  v2_burn?: Maybe<V2_Burn>
  v2_burns: Array<V2_Burn>
  v2_liquidityPosition?: Maybe<V2_LiquidityPosition>
  v2_liquidityPositionSnapshot?: Maybe<V2_LiquidityPositionSnapshot>
  v2_liquidityPositionSnapshots: Array<V2_LiquidityPositionSnapshot>
  v2_liquidityPositions: Array<V2_LiquidityPosition>
  v2_mint?: Maybe<V2_Mint>
  v2_mints: Array<V2_Mint>
  v2_pair?: Maybe<V2_Pair>
  v2_pairDayData?: Maybe<V2_PairDayData>
  v2_pairDayDatas: Array<V2_PairDayData>
  v2_pairHourData?: Maybe<V2_PairHourData>
  v2_pairHourDatas: Array<V2_PairHourData>
  v2_pairs: Array<V2_Pair>
  v2_swap?: Maybe<V2_Swap>
  v2_swaps: Array<V2_Swap>
  v2_token?: Maybe<V2_Token>
  v2_tokenDayData?: Maybe<V2_TokenDayData>
  v2_tokenDayDatas: Array<V2_TokenDayData>
  v2_tokens: Array<V2_Token>
  v2_transaction?: Maybe<V2_Transaction>
  v2_transactions: Array<V2_Transaction>
  v2_uniswapDayData?: Maybe<V2_UniswapDayData>
  v2_uniswapDayDatas: Array<V2_UniswapDayData>
  v2_uniswapFactories: Array<V2_UniswapFactory>
  v2_uniswapFactory?: Maybe<V2_UniswapFactory>
  v2_user?: Maybe<V2_User>
  v2_users: Array<V2_User>
  /** Access to subgraph metadata */
  v3__meta?: Maybe<V3__Meta_>
  v3_bundle?: Maybe<V3_Bundle>
  v3_bundles: Array<V3_Bundle>
  v3_burn?: Maybe<V3_Burn>
  v3_burns: Array<V3_Burn>
  v3_collect?: Maybe<V3_Collect>
  v3_collects: Array<V3_Collect>
  v3_factories: Array<V3_Factory>
  v3_factory?: Maybe<V3_Factory>
  v3_flash?: Maybe<V3_Flash>
  v3_flashes: Array<V3_Flash>
  v3_mint?: Maybe<V3_Mint>
  v3_mints: Array<V3_Mint>
  v3_pool?: Maybe<V3_Pool>
  v3_poolDayData?: Maybe<V3_PoolDayData>
  v3_poolDayDatas: Array<V3_PoolDayData>
  v3_poolHourData?: Maybe<V3_PoolHourData>
  v3_poolHourDatas: Array<V3_PoolHourData>
  v3_pools: Array<V3_Pool>
  v3_position?: Maybe<V3_Position>
  v3_positionSnapshot?: Maybe<V3_PositionSnapshot>
  v3_positionSnapshots: Array<V3_PositionSnapshot>
  v3_positions: Array<V3_Position>
  v3_swap?: Maybe<V3_Swap>
  v3_swaps: Array<V3_Swap>
  v3_tick?: Maybe<V3_Tick>
  v3_tickDayData?: Maybe<V3_TickDayData>
  v3_tickDayDatas: Array<V3_TickDayData>
  v3_tickHourData?: Maybe<V3_TickHourData>
  v3_tickHourDatas: Array<V3_TickHourData>
  v3_ticks: Array<V3_Tick>
  v3_token?: Maybe<V3_Token>
  v3_tokenDayData?: Maybe<V3_TokenDayData>
  v3_tokenDayDatas: Array<V3_TokenDayData>
  v3_tokenHourData?: Maybe<V3_TokenHourData>
  v3_tokenHourDatas: Array<V3_TokenHourData>
  v3_tokens: Array<V3_Token>
  v3_transaction?: Maybe<V3_Transaction>
  v3_transactions: Array<V3_Transaction>
  v3_uniswapDayData?: Maybe<V3_UniswapDayData>
  v3_uniswapDayDatas: Array<V3_UniswapDayData>
  /** Access to subgraph metadata */
  v3arbitrum__meta?: Maybe<V3arbitrum__Meta_>
  v3arbitrum_bundle?: Maybe<V3arbitrum_Bundle>
  v3arbitrum_bundles: Array<V3arbitrum_Bundle>
  v3arbitrum_burn?: Maybe<V3arbitrum_Burn>
  v3arbitrum_burns: Array<V3arbitrum_Burn>
  v3arbitrum_collect?: Maybe<V3arbitrum_Collect>
  v3arbitrum_collects: Array<V3arbitrum_Collect>
  v3arbitrum_factories: Array<V3arbitrum_Factory>
  v3arbitrum_factory?: Maybe<V3arbitrum_Factory>
  v3arbitrum_flash?: Maybe<V3arbitrum_Flash>
  v3arbitrum_flashes: Array<V3arbitrum_Flash>
  v3arbitrum_mint?: Maybe<V3arbitrum_Mint>
  v3arbitrum_mints: Array<V3arbitrum_Mint>
  v3arbitrum_pool?: Maybe<V3arbitrum_Pool>
  v3arbitrum_poolDayData?: Maybe<V3arbitrum_PoolDayData>
  v3arbitrum_poolDayDatas: Array<V3arbitrum_PoolDayData>
  v3arbitrum_poolHourData?: Maybe<V3arbitrum_PoolHourData>
  v3arbitrum_poolHourDatas: Array<V3arbitrum_PoolHourData>
  v3arbitrum_pools: Array<V3arbitrum_Pool>
  v3arbitrum_swap?: Maybe<V3arbitrum_Swap>
  v3arbitrum_swaps: Array<V3arbitrum_Swap>
  v3arbitrum_tick?: Maybe<V3arbitrum_Tick>
  v3arbitrum_tickDayData?: Maybe<V3arbitrum_TickDayData>
  v3arbitrum_tickDayDatas: Array<V3arbitrum_TickDayData>
  v3arbitrum_tickHourData?: Maybe<V3arbitrum_TickHourData>
  v3arbitrum_tickHourDatas: Array<V3arbitrum_TickHourData>
  v3arbitrum_ticks: Array<V3arbitrum_Tick>
  v3arbitrum_token?: Maybe<V3arbitrum_Token>
  v3arbitrum_tokenDayData?: Maybe<V3arbitrum_TokenDayData>
  v3arbitrum_tokenDayDatas: Array<V3arbitrum_TokenDayData>
  v3arbitrum_tokenHourData?: Maybe<V3arbitrum_TokenHourData>
  v3arbitrum_tokenHourDatas: Array<V3arbitrum_TokenHourData>
  v3arbitrum_tokens: Array<V3arbitrum_Token>
  v3arbitrum_transaction?: Maybe<V3arbitrum_Transaction>
  v3arbitrum_transactions: Array<V3arbitrum_Transaction>
  v3arbitrum_uniswapDayData?: Maybe<V3arbitrum_UniswapDayData>
  v3arbitrum_uniswapDayDatas: Array<V3arbitrum_UniswapDayData>
  /** Access to subgraph metadata */
  v3polygon__meta?: Maybe<V3polygon__Meta_>
  v3polygon_bundle?: Maybe<V3polygon_Bundle>
  v3polygon_bundles: Array<V3polygon_Bundle>
  v3polygon_burn?: Maybe<V3polygon_Burn>
  v3polygon_burns: Array<V3polygon_Burn>
  v3polygon_collect?: Maybe<V3polygon_Collect>
  v3polygon_collects: Array<V3polygon_Collect>
  v3polygon_factories: Array<V3polygon_Factory>
  v3polygon_factory?: Maybe<V3polygon_Factory>
  v3polygon_flash?: Maybe<V3polygon_Flash>
  v3polygon_flashes: Array<V3polygon_Flash>
  v3polygon_mint?: Maybe<V3polygon_Mint>
  v3polygon_mints: Array<V3polygon_Mint>
  v3polygon_pool?: Maybe<V3polygon_Pool>
  v3polygon_poolDayData?: Maybe<V3polygon_PoolDayData>
  v3polygon_poolDayDatas: Array<V3polygon_PoolDayData>
  v3polygon_poolHourData?: Maybe<V3polygon_PoolHourData>
  v3polygon_poolHourDatas: Array<V3polygon_PoolHourData>
  v3polygon_pools: Array<V3polygon_Pool>
  v3polygon_position?: Maybe<V3polygon_Position>
  v3polygon_positionSnapshot?: Maybe<V3polygon_PositionSnapshot>
  v3polygon_positionSnapshots: Array<V3polygon_PositionSnapshot>
  v3polygon_positions: Array<V3polygon_Position>
  v3polygon_swap?: Maybe<V3polygon_Swap>
  v3polygon_swaps: Array<V3polygon_Swap>
  v3polygon_tick?: Maybe<V3polygon_Tick>
  v3polygon_tickDayData?: Maybe<V3polygon_TickDayData>
  v3polygon_tickDayDatas: Array<V3polygon_TickDayData>
  v3polygon_tickHourData?: Maybe<V3polygon_TickHourData>
  v3polygon_tickHourDatas: Array<V3polygon_TickHourData>
  v3polygon_ticks: Array<V3polygon_Tick>
  v3polygon_token?: Maybe<V3polygon_Token>
  v3polygon_tokenDayData?: Maybe<V3polygon_TokenDayData>
  v3polygon_tokenDayDatas: Array<V3polygon_TokenDayData>
  v3polygon_tokenHourData?: Maybe<V3polygon_TokenHourData>
  v3polygon_tokenHourDatas: Array<V3polygon_TokenHourData>
  v3polygon_tokens: Array<V3polygon_Token>
  v3polygon_transaction?: Maybe<V3polygon_Transaction>
  v3polygon_transactions: Array<V3polygon_Transaction>
  v3polygon_uniswapDayData?: Maybe<V3polygon_UniswapDayData>
  v3polygon_uniswapDayDatas: Array<V3polygon_UniswapDayData>
  /** Access to subgraph metadata */
  v3rinkeby__meta?: Maybe<V3rinkeby__Meta_>
  v3rinkeby_bundle?: Maybe<V3rinkeby_Bundle>
  v3rinkeby_bundles: Array<V3rinkeby_Bundle>
  v3rinkeby_burn?: Maybe<V3rinkeby_Burn>
  v3rinkeby_burns: Array<V3rinkeby_Burn>
  v3rinkeby_collect?: Maybe<V3rinkeby_Collect>
  v3rinkeby_collects: Array<V3rinkeby_Collect>
  v3rinkeby_factories: Array<V3rinkeby_Factory>
  v3rinkeby_factory?: Maybe<V3rinkeby_Factory>
  v3rinkeby_flash?: Maybe<V3rinkeby_Flash>
  v3rinkeby_flashes: Array<V3rinkeby_Flash>
  v3rinkeby_mint?: Maybe<V3rinkeby_Mint>
  v3rinkeby_mints: Array<V3rinkeby_Mint>
  v3rinkeby_pool?: Maybe<V3rinkeby_Pool>
  v3rinkeby_poolDayData?: Maybe<V3rinkeby_PoolDayData>
  v3rinkeby_poolDayDatas: Array<V3rinkeby_PoolDayData>
  v3rinkeby_poolHourData?: Maybe<V3rinkeby_PoolHourData>
  v3rinkeby_poolHourDatas: Array<V3rinkeby_PoolHourData>
  v3rinkeby_pools: Array<V3rinkeby_Pool>
  v3rinkeby_position?: Maybe<V3rinkeby_Position>
  v3rinkeby_positionSnapshot?: Maybe<V3rinkeby_PositionSnapshot>
  v3rinkeby_positionSnapshots: Array<V3rinkeby_PositionSnapshot>
  v3rinkeby_positions: Array<V3rinkeby_Position>
  v3rinkeby_swap?: Maybe<V3rinkeby_Swap>
  v3rinkeby_swaps: Array<V3rinkeby_Swap>
  v3rinkeby_tick?: Maybe<V3rinkeby_Tick>
  v3rinkeby_tickDayData?: Maybe<V3rinkeby_TickDayData>
  v3rinkeby_tickDayDatas: Array<V3rinkeby_TickDayData>
  v3rinkeby_tickHourData?: Maybe<V3rinkeby_TickHourData>
  v3rinkeby_tickHourDatas: Array<V3rinkeby_TickHourData>
  v3rinkeby_ticks: Array<V3rinkeby_Tick>
  v3rinkeby_token?: Maybe<V3rinkeby_Token>
  v3rinkeby_tokenDayData?: Maybe<V3rinkeby_TokenDayData>
  v3rinkeby_tokenDayDatas: Array<V3rinkeby_TokenDayData>
  v3rinkeby_tokenHourData?: Maybe<V3rinkeby_TokenHourData>
  v3rinkeby_tokenHourDatas: Array<V3rinkeby_TokenHourData>
  v3rinkeby_tokens: Array<V3rinkeby_Token>
  v3rinkeby_transaction?: Maybe<V3rinkeby_Transaction>
  v3rinkeby_transactions: Array<V3rinkeby_Transaction>
  v3rinkeby_uniswapDayData?: Maybe<V3rinkeby_UniswapDayData>
  v3rinkeby_uniswapDayDatas: Array<V3rinkeby_UniswapDayData>
}

export type Query_MetaArgs = {
  block?: Maybe<V3_Block_Height>
  chainId?: Maybe<Scalars['Int']>
}

export type QueryBlocksArgs = {
  distinct_on?: Maybe<Array<Blocks_Select_Column>>
  limit?: Maybe<Scalars['Int']>
  offset?: Maybe<Scalars['Int']>
  order_by?: Maybe<Array<Blocks_Order_By>>
  where?: Maybe<Blocks_Bool_Exp>
}

export type QueryBlocks_AggregateArgs = {
  distinct_on?: Maybe<Array<Blocks_Select_Column>>
  limit?: Maybe<Scalars['Int']>
  offset?: Maybe<Scalars['Int']>
  order_by?: Maybe<Array<Blocks_Order_By>>
  where?: Maybe<Blocks_Bool_Exp>
}

export type QueryBlocks_By_PkArgs = {
  number: Scalars['Int']
}

export type QueryBundleArgs = {
  block?: Maybe<V3_Block_Height>
  chainId?: Maybe<Scalars['Int']>
  id: Scalars['ID']
  subgraphError?: V3__SubgraphErrorPolicy_
}

export type QueryBundlesArgs = {
  block?: Maybe<V3_Block_Height>
  chainId?: Maybe<Scalars['Int']>
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3_Bundle_OrderBy>
  orderDirection?: Maybe<V3_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  subgraphError?: V3__SubgraphErrorPolicy_
  where?: Maybe<V3_Bundle_Filter>
}

export type QueryBurnArgs = {
  block?: Maybe<V3_Block_Height>
  chainId?: Maybe<Scalars['Int']>
  id: Scalars['ID']
  subgraphError?: V3__SubgraphErrorPolicy_
}

export type QueryBurnsArgs = {
  block?: Maybe<V3_Block_Height>
  chainId?: Maybe<Scalars['Int']>
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3_Burn_OrderBy>
  orderDirection?: Maybe<V3_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  subgraphError?: V3__SubgraphErrorPolicy_
  where?: Maybe<V3_Burn_Filter>
}

export type QueryCollectArgs = {
  block?: Maybe<V3_Block_Height>
  chainId?: Maybe<Scalars['Int']>
  id: Scalars['ID']
  subgraphError?: V3__SubgraphErrorPolicy_
}

export type QueryCollectsArgs = {
  block?: Maybe<V3_Block_Height>
  chainId?: Maybe<Scalars['Int']>
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3_Collect_OrderBy>
  orderDirection?: Maybe<V3_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  subgraphError?: V3__SubgraphErrorPolicy_
  where?: Maybe<V3_Collect_Filter>
}

export type QueryFactoriesArgs = {
  block?: Maybe<V3_Block_Height>
  chainId?: Maybe<Scalars['Int']>
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3_Factory_OrderBy>
  orderDirection?: Maybe<V3_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  subgraphError?: V3__SubgraphErrorPolicy_
  where?: Maybe<V3_Factory_Filter>
}

export type QueryFactoryArgs = {
  block?: Maybe<V3_Block_Height>
  chainId?: Maybe<Scalars['Int']>
  id: Scalars['ID']
  subgraphError?: V3__SubgraphErrorPolicy_
}

export type QueryFlashArgs = {
  block?: Maybe<V3_Block_Height>
  chainId?: Maybe<Scalars['Int']>
  id: Scalars['ID']
  subgraphError?: V3__SubgraphErrorPolicy_
}

export type QueryFlashesArgs = {
  block?: Maybe<V3_Block_Height>
  chainId?: Maybe<Scalars['Int']>
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3_Flash_OrderBy>
  orderDirection?: Maybe<V3_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  subgraphError?: V3__SubgraphErrorPolicy_
  where?: Maybe<V3_Flash_Filter>
}

export type QueryMintArgs = {
  block?: Maybe<V3_Block_Height>
  chainId?: Maybe<Scalars['Int']>
  id: Scalars['ID']
  subgraphError?: V3__SubgraphErrorPolicy_
}

export type QueryMintsArgs = {
  block?: Maybe<V3_Block_Height>
  chainId?: Maybe<Scalars['Int']>
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3_Mint_OrderBy>
  orderDirection?: Maybe<V3_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  subgraphError?: V3__SubgraphErrorPolicy_
  where?: Maybe<V3_Mint_Filter>
}

export type QueryPoolArgs = {
  block?: Maybe<V3_Block_Height>
  chainId?: Maybe<Scalars['Int']>
  id: Scalars['ID']
  subgraphError?: V3__SubgraphErrorPolicy_
}

export type QueryPoolDayDataArgs = {
  block?: Maybe<V3_Block_Height>
  chainId?: Maybe<Scalars['Int']>
  id: Scalars['ID']
  subgraphError?: V3__SubgraphErrorPolicy_
}

export type QueryPoolDayDatasArgs = {
  block?: Maybe<V3_Block_Height>
  chainId?: Maybe<Scalars['Int']>
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3_PoolDayData_OrderBy>
  orderDirection?: Maybe<V3_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  subgraphError?: V3__SubgraphErrorPolicy_
  where?: Maybe<V3_PoolDayData_Filter>
}

export type QueryPoolHourDataArgs = {
  block?: Maybe<V3_Block_Height>
  chainId?: Maybe<Scalars['Int']>
  id: Scalars['ID']
  subgraphError?: V3__SubgraphErrorPolicy_
}

export type QueryPoolHourDatasArgs = {
  block?: Maybe<V3_Block_Height>
  chainId?: Maybe<Scalars['Int']>
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3_PoolHourData_OrderBy>
  orderDirection?: Maybe<V3_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  subgraphError?: V3__SubgraphErrorPolicy_
  where?: Maybe<V3_PoolHourData_Filter>
}

export type QueryPoolsArgs = {
  block?: Maybe<V3_Block_Height>
  chainId?: Maybe<Scalars['Int']>
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3_Pool_OrderBy>
  orderDirection?: Maybe<V3_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  subgraphError?: V3__SubgraphErrorPolicy_
  where?: Maybe<V3_Pool_Filter>
}

export type QueryPositionArgs = {
  block?: Maybe<V3_Block_Height>
  chainId?: Maybe<Scalars['Int']>
  id: Scalars['ID']
  subgraphError?: V3__SubgraphErrorPolicy_
}

export type QueryPositionSnapshotArgs = {
  block?: Maybe<V3_Block_Height>
  chainId?: Maybe<Scalars['Int']>
  id: Scalars['ID']
  subgraphError?: V3__SubgraphErrorPolicy_
}

export type QueryPositionSnapshotsArgs = {
  block?: Maybe<V3_Block_Height>
  chainId?: Maybe<Scalars['Int']>
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3_PositionSnapshot_OrderBy>
  orderDirection?: Maybe<V3_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  subgraphError?: V3__SubgraphErrorPolicy_
  where?: Maybe<V3_PositionSnapshot_Filter>
}

export type QueryPositionsArgs = {
  block?: Maybe<V3_Block_Height>
  chainId?: Maybe<Scalars['Int']>
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3_Position_OrderBy>
  orderDirection?: Maybe<V3_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  subgraphError?: V3__SubgraphErrorPolicy_
  where?: Maybe<V3_Position_Filter>
}

export type QuerySwapArgs = {
  block?: Maybe<V3_Block_Height>
  chainId?: Maybe<Scalars['Int']>
  id: Scalars['ID']
  subgraphError?: V3__SubgraphErrorPolicy_
}

export type QuerySwapsArgs = {
  block?: Maybe<V3_Block_Height>
  chainId?: Maybe<Scalars['Int']>
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3_Swap_OrderBy>
  orderDirection?: Maybe<V3_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  subgraphError?: V3__SubgraphErrorPolicy_
  where?: Maybe<V3_Swap_Filter>
}

export type QueryTickArgs = {
  block?: Maybe<V3_Block_Height>
  chainId?: Maybe<Scalars['Int']>
  id: Scalars['ID']
  subgraphError?: V3__SubgraphErrorPolicy_
}

export type QueryTickDayDataArgs = {
  block?: Maybe<V3_Block_Height>
  chainId?: Maybe<Scalars['Int']>
  id: Scalars['ID']
  subgraphError?: V3__SubgraphErrorPolicy_
}

export type QueryTickDayDatasArgs = {
  block?: Maybe<V3_Block_Height>
  chainId?: Maybe<Scalars['Int']>
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3_TickDayData_OrderBy>
  orderDirection?: Maybe<V3_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  subgraphError?: V3__SubgraphErrorPolicy_
  where?: Maybe<V3_TickDayData_Filter>
}

export type QueryTickHourDataArgs = {
  block?: Maybe<V3_Block_Height>
  chainId?: Maybe<Scalars['Int']>
  id: Scalars['ID']
  subgraphError?: V3__SubgraphErrorPolicy_
}

export type QueryTickHourDatasArgs = {
  block?: Maybe<V3_Block_Height>
  chainId?: Maybe<Scalars['Int']>
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3_TickHourData_OrderBy>
  orderDirection?: Maybe<V3_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  subgraphError?: V3__SubgraphErrorPolicy_
  where?: Maybe<V3_TickHourData_Filter>
}

export type QueryTicksArgs = {
  block?: Maybe<V3_Block_Height>
  chainId?: Maybe<Scalars['Int']>
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3_Tick_OrderBy>
  orderDirection?: Maybe<V3_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  subgraphError?: V3__SubgraphErrorPolicy_
  where?: Maybe<V3_Tick_Filter>
}

export type QueryTokenArgs = {
  block?: Maybe<V3_Block_Height>
  chainId?: Maybe<Scalars['Int']>
  id: Scalars['ID']
  subgraphError?: V3__SubgraphErrorPolicy_
}

export type QueryTokenDayDataArgs = {
  block?: Maybe<V3_Block_Height>
  chainId?: Maybe<Scalars['Int']>
  id: Scalars['ID']
  subgraphError?: V3__SubgraphErrorPolicy_
}

export type QueryTokenDayDatasArgs = {
  block?: Maybe<V3_Block_Height>
  chainId?: Maybe<Scalars['Int']>
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3_TokenDayData_OrderBy>
  orderDirection?: Maybe<V3_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  subgraphError?: V3__SubgraphErrorPolicy_
  where?: Maybe<V3_TokenDayData_Filter>
}

export type QueryTokenHourDataArgs = {
  block?: Maybe<V3_Block_Height>
  chainId?: Maybe<Scalars['Int']>
  id: Scalars['ID']
  subgraphError?: V3__SubgraphErrorPolicy_
}

export type QueryTokenHourDatasArgs = {
  block?: Maybe<V3_Block_Height>
  chainId?: Maybe<Scalars['Int']>
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3_TokenHourData_OrderBy>
  orderDirection?: Maybe<V3_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  subgraphError?: V3__SubgraphErrorPolicy_
  where?: Maybe<V3_TokenHourData_Filter>
}

export type QueryTokenTimeseriesArgs = {
  count?: Maybe<Scalars['Int']>
  timestampEnd?: Maybe<Scalars['DateTime']>
  timestampStart: Scalars['DateTime']
  tokenAddress: Scalars['String']
}

export type QueryTokensArgs = {
  block?: Maybe<V3_Block_Height>
  chainId?: Maybe<Scalars['Int']>
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3_Token_OrderBy>
  orderDirection?: Maybe<V3_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  subgraphError?: V3__SubgraphErrorPolicy_
  where?: Maybe<V3_Token_Filter>
}

export type QueryTransactionArgs = {
  block?: Maybe<V3_Block_Height>
  chainId?: Maybe<Scalars['Int']>
  id: Scalars['ID']
  subgraphError?: V3__SubgraphErrorPolicy_
}

export type QueryTransactionsArgs = {
  block?: Maybe<V3_Block_Height>
  chainId?: Maybe<Scalars['Int']>
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3_Transaction_OrderBy>
  orderDirection?: Maybe<V3_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  subgraphError?: V3__SubgraphErrorPolicy_
  where?: Maybe<V3_Transaction_Filter>
}

export type QueryUniswapDayDataArgs = {
  block?: Maybe<V3_Block_Height>
  chainId?: Maybe<Scalars['Int']>
  id: Scalars['ID']
  subgraphError?: V3__SubgraphErrorPolicy_
}

export type QueryUniswapDayDatasArgs = {
  block?: Maybe<V3_Block_Height>
  chainId?: Maybe<Scalars['Int']>
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3_UniswapDayData_OrderBy>
  orderDirection?: Maybe<V3_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  subgraphError?: V3__SubgraphErrorPolicy_
  where?: Maybe<V3_UniswapDayData_Filter>
}

export type QueryV2__MetaArgs = {
  block?: Maybe<V2_Block_Height>
}

export type QueryV2_BundleArgs = {
  block?: Maybe<V2_Block_Height>
  id: Scalars['ID']
  subgraphError?: V2__SubgraphErrorPolicy_
}

export type QueryV2_BundlesArgs = {
  block?: Maybe<V2_Block_Height>
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V2_Bundle_OrderBy>
  orderDirection?: Maybe<V2_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  subgraphError?: V2__SubgraphErrorPolicy_
  where?: Maybe<V2_Bundle_Filter>
}

export type QueryV2_BurnArgs = {
  block?: Maybe<V2_Block_Height>
  id: Scalars['ID']
  subgraphError?: V2__SubgraphErrorPolicy_
}

export type QueryV2_BurnsArgs = {
  block?: Maybe<V2_Block_Height>
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V2_Burn_OrderBy>
  orderDirection?: Maybe<V2_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  subgraphError?: V2__SubgraphErrorPolicy_
  where?: Maybe<V2_Burn_Filter>
}

export type QueryV2_LiquidityPositionArgs = {
  block?: Maybe<V2_Block_Height>
  id: Scalars['ID']
  subgraphError?: V2__SubgraphErrorPolicy_
}

export type QueryV2_LiquidityPositionSnapshotArgs = {
  block?: Maybe<V2_Block_Height>
  id: Scalars['ID']
  subgraphError?: V2__SubgraphErrorPolicy_
}

export type QueryV2_LiquidityPositionSnapshotsArgs = {
  block?: Maybe<V2_Block_Height>
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V2_LiquidityPositionSnapshot_OrderBy>
  orderDirection?: Maybe<V2_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  subgraphError?: V2__SubgraphErrorPolicy_
  where?: Maybe<V2_LiquidityPositionSnapshot_Filter>
}

export type QueryV2_LiquidityPositionsArgs = {
  block?: Maybe<V2_Block_Height>
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V2_LiquidityPosition_OrderBy>
  orderDirection?: Maybe<V2_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  subgraphError?: V2__SubgraphErrorPolicy_
  where?: Maybe<V2_LiquidityPosition_Filter>
}

export type QueryV2_MintArgs = {
  block?: Maybe<V2_Block_Height>
  id: Scalars['ID']
  subgraphError?: V2__SubgraphErrorPolicy_
}

export type QueryV2_MintsArgs = {
  block?: Maybe<V2_Block_Height>
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V2_Mint_OrderBy>
  orderDirection?: Maybe<V2_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  subgraphError?: V2__SubgraphErrorPolicy_
  where?: Maybe<V2_Mint_Filter>
}

export type QueryV2_PairArgs = {
  block?: Maybe<V2_Block_Height>
  id: Scalars['ID']
  subgraphError?: V2__SubgraphErrorPolicy_
}

export type QueryV2_PairDayDataArgs = {
  block?: Maybe<V2_Block_Height>
  id: Scalars['ID']
  subgraphError?: V2__SubgraphErrorPolicy_
}

export type QueryV2_PairDayDatasArgs = {
  block?: Maybe<V2_Block_Height>
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V2_PairDayData_OrderBy>
  orderDirection?: Maybe<V2_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  subgraphError?: V2__SubgraphErrorPolicy_
  where?: Maybe<V2_PairDayData_Filter>
}

export type QueryV2_PairHourDataArgs = {
  block?: Maybe<V2_Block_Height>
  id: Scalars['ID']
  subgraphError?: V2__SubgraphErrorPolicy_
}

export type QueryV2_PairHourDatasArgs = {
  block?: Maybe<V2_Block_Height>
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V2_PairHourData_OrderBy>
  orderDirection?: Maybe<V2_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  subgraphError?: V2__SubgraphErrorPolicy_
  where?: Maybe<V2_PairHourData_Filter>
}

export type QueryV2_PairsArgs = {
  block?: Maybe<V2_Block_Height>
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V2_Pair_OrderBy>
  orderDirection?: Maybe<V2_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  subgraphError?: V2__SubgraphErrorPolicy_
  where?: Maybe<V2_Pair_Filter>
}

export type QueryV2_SwapArgs = {
  block?: Maybe<V2_Block_Height>
  id: Scalars['ID']
  subgraphError?: V2__SubgraphErrorPolicy_
}

export type QueryV2_SwapsArgs = {
  block?: Maybe<V2_Block_Height>
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V2_Swap_OrderBy>
  orderDirection?: Maybe<V2_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  subgraphError?: V2__SubgraphErrorPolicy_
  where?: Maybe<V2_Swap_Filter>
}

export type QueryV2_TokenArgs = {
  block?: Maybe<V2_Block_Height>
  id: Scalars['ID']
  subgraphError?: V2__SubgraphErrorPolicy_
}

export type QueryV2_TokenDayDataArgs = {
  block?: Maybe<V2_Block_Height>
  id: Scalars['ID']
  subgraphError?: V2__SubgraphErrorPolicy_
}

export type QueryV2_TokenDayDatasArgs = {
  block?: Maybe<V2_Block_Height>
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V2_TokenDayData_OrderBy>
  orderDirection?: Maybe<V2_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  subgraphError?: V2__SubgraphErrorPolicy_
  where?: Maybe<V2_TokenDayData_Filter>
}

export type QueryV2_TokensArgs = {
  block?: Maybe<V2_Block_Height>
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V2_Token_OrderBy>
  orderDirection?: Maybe<V2_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  subgraphError?: V2__SubgraphErrorPolicy_
  where?: Maybe<V2_Token_Filter>
}

export type QueryV2_TransactionArgs = {
  block?: Maybe<V2_Block_Height>
  id: Scalars['ID']
  subgraphError?: V2__SubgraphErrorPolicy_
}

export type QueryV2_TransactionsArgs = {
  block?: Maybe<V2_Block_Height>
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V2_Transaction_OrderBy>
  orderDirection?: Maybe<V2_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  subgraphError?: V2__SubgraphErrorPolicy_
  where?: Maybe<V2_Transaction_Filter>
}

export type QueryV2_UniswapDayDataArgs = {
  block?: Maybe<V2_Block_Height>
  id: Scalars['ID']
  subgraphError?: V2__SubgraphErrorPolicy_
}

export type QueryV2_UniswapDayDatasArgs = {
  block?: Maybe<V2_Block_Height>
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V2_UniswapDayData_OrderBy>
  orderDirection?: Maybe<V2_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  subgraphError?: V2__SubgraphErrorPolicy_
  where?: Maybe<V2_UniswapDayData_Filter>
}

export type QueryV2_UniswapFactoriesArgs = {
  block?: Maybe<V2_Block_Height>
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V2_UniswapFactory_OrderBy>
  orderDirection?: Maybe<V2_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  subgraphError?: V2__SubgraphErrorPolicy_
  where?: Maybe<V2_UniswapFactory_Filter>
}

export type QueryV2_UniswapFactoryArgs = {
  block?: Maybe<V2_Block_Height>
  id: Scalars['ID']
  subgraphError?: V2__SubgraphErrorPolicy_
}

export type QueryV2_UserArgs = {
  block?: Maybe<V2_Block_Height>
  id: Scalars['ID']
  subgraphError?: V2__SubgraphErrorPolicy_
}

export type QueryV2_UsersArgs = {
  block?: Maybe<V2_Block_Height>
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V2_User_OrderBy>
  orderDirection?: Maybe<V2_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  subgraphError?: V2__SubgraphErrorPolicy_
  where?: Maybe<V2_User_Filter>
}

export type QueryV3__MetaArgs = {
  block?: Maybe<V3_Block_Height>
}

export type QueryV3_BundleArgs = {
  block?: Maybe<V3_Block_Height>
  id: Scalars['ID']
  subgraphError?: V3__SubgraphErrorPolicy_
}

export type QueryV3_BundlesArgs = {
  block?: Maybe<V3_Block_Height>
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3_Bundle_OrderBy>
  orderDirection?: Maybe<V3_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  subgraphError?: V3__SubgraphErrorPolicy_
  where?: Maybe<V3_Bundle_Filter>
}

export type QueryV3_BurnArgs = {
  block?: Maybe<V3_Block_Height>
  id: Scalars['ID']
  subgraphError?: V3__SubgraphErrorPolicy_
}

export type QueryV3_BurnsArgs = {
  block?: Maybe<V3_Block_Height>
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3_Burn_OrderBy>
  orderDirection?: Maybe<V3_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  subgraphError?: V3__SubgraphErrorPolicy_
  where?: Maybe<V3_Burn_Filter>
}

export type QueryV3_CollectArgs = {
  block?: Maybe<V3_Block_Height>
  id: Scalars['ID']
  subgraphError?: V3__SubgraphErrorPolicy_
}

export type QueryV3_CollectsArgs = {
  block?: Maybe<V3_Block_Height>
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3_Collect_OrderBy>
  orderDirection?: Maybe<V3_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  subgraphError?: V3__SubgraphErrorPolicy_
  where?: Maybe<V3_Collect_Filter>
}

export type QueryV3_FactoriesArgs = {
  block?: Maybe<V3_Block_Height>
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3_Factory_OrderBy>
  orderDirection?: Maybe<V3_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  subgraphError?: V3__SubgraphErrorPolicy_
  where?: Maybe<V3_Factory_Filter>
}

export type QueryV3_FactoryArgs = {
  block?: Maybe<V3_Block_Height>
  id: Scalars['ID']
  subgraphError?: V3__SubgraphErrorPolicy_
}

export type QueryV3_FlashArgs = {
  block?: Maybe<V3_Block_Height>
  id: Scalars['ID']
  subgraphError?: V3__SubgraphErrorPolicy_
}

export type QueryV3_FlashesArgs = {
  block?: Maybe<V3_Block_Height>
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3_Flash_OrderBy>
  orderDirection?: Maybe<V3_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  subgraphError?: V3__SubgraphErrorPolicy_
  where?: Maybe<V3_Flash_Filter>
}

export type QueryV3_MintArgs = {
  block?: Maybe<V3_Block_Height>
  id: Scalars['ID']
  subgraphError?: V3__SubgraphErrorPolicy_
}

export type QueryV3_MintsArgs = {
  block?: Maybe<V3_Block_Height>
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3_Mint_OrderBy>
  orderDirection?: Maybe<V3_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  subgraphError?: V3__SubgraphErrorPolicy_
  where?: Maybe<V3_Mint_Filter>
}

export type QueryV3_PoolArgs = {
  block?: Maybe<V3_Block_Height>
  id: Scalars['ID']
  subgraphError?: V3__SubgraphErrorPolicy_
}

export type QueryV3_PoolDayDataArgs = {
  block?: Maybe<V3_Block_Height>
  id: Scalars['ID']
  subgraphError?: V3__SubgraphErrorPolicy_
}

export type QueryV3_PoolDayDatasArgs = {
  block?: Maybe<V3_Block_Height>
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3_PoolDayData_OrderBy>
  orderDirection?: Maybe<V3_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  subgraphError?: V3__SubgraphErrorPolicy_
  where?: Maybe<V3_PoolDayData_Filter>
}

export type QueryV3_PoolHourDataArgs = {
  block?: Maybe<V3_Block_Height>
  id: Scalars['ID']
  subgraphError?: V3__SubgraphErrorPolicy_
}

export type QueryV3_PoolHourDatasArgs = {
  block?: Maybe<V3_Block_Height>
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3_PoolHourData_OrderBy>
  orderDirection?: Maybe<V3_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  subgraphError?: V3__SubgraphErrorPolicy_
  where?: Maybe<V3_PoolHourData_Filter>
}

export type QueryV3_PoolsArgs = {
  block?: Maybe<V3_Block_Height>
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3_Pool_OrderBy>
  orderDirection?: Maybe<V3_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  subgraphError?: V3__SubgraphErrorPolicy_
  where?: Maybe<V3_Pool_Filter>
}

export type QueryV3_PositionArgs = {
  block?: Maybe<V3_Block_Height>
  id: Scalars['ID']
  subgraphError?: V3__SubgraphErrorPolicy_
}

export type QueryV3_PositionSnapshotArgs = {
  block?: Maybe<V3_Block_Height>
  id: Scalars['ID']
  subgraphError?: V3__SubgraphErrorPolicy_
}

export type QueryV3_PositionSnapshotsArgs = {
  block?: Maybe<V3_Block_Height>
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3_PositionSnapshot_OrderBy>
  orderDirection?: Maybe<V3_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  subgraphError?: V3__SubgraphErrorPolicy_
  where?: Maybe<V3_PositionSnapshot_Filter>
}

export type QueryV3_PositionsArgs = {
  block?: Maybe<V3_Block_Height>
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3_Position_OrderBy>
  orderDirection?: Maybe<V3_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  subgraphError?: V3__SubgraphErrorPolicy_
  where?: Maybe<V3_Position_Filter>
}

export type QueryV3_SwapArgs = {
  block?: Maybe<V3_Block_Height>
  id: Scalars['ID']
  subgraphError?: V3__SubgraphErrorPolicy_
}

export type QueryV3_SwapsArgs = {
  block?: Maybe<V3_Block_Height>
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3_Swap_OrderBy>
  orderDirection?: Maybe<V3_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  subgraphError?: V3__SubgraphErrorPolicy_
  where?: Maybe<V3_Swap_Filter>
}

export type QueryV3_TickArgs = {
  block?: Maybe<V3_Block_Height>
  id: Scalars['ID']
  subgraphError?: V3__SubgraphErrorPolicy_
}

export type QueryV3_TickDayDataArgs = {
  block?: Maybe<V3_Block_Height>
  id: Scalars['ID']
  subgraphError?: V3__SubgraphErrorPolicy_
}

export type QueryV3_TickDayDatasArgs = {
  block?: Maybe<V3_Block_Height>
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3_TickDayData_OrderBy>
  orderDirection?: Maybe<V3_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  subgraphError?: V3__SubgraphErrorPolicy_
  where?: Maybe<V3_TickDayData_Filter>
}

export type QueryV3_TickHourDataArgs = {
  block?: Maybe<V3_Block_Height>
  id: Scalars['ID']
  subgraphError?: V3__SubgraphErrorPolicy_
}

export type QueryV3_TickHourDatasArgs = {
  block?: Maybe<V3_Block_Height>
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3_TickHourData_OrderBy>
  orderDirection?: Maybe<V3_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  subgraphError?: V3__SubgraphErrorPolicy_
  where?: Maybe<V3_TickHourData_Filter>
}

export type QueryV3_TicksArgs = {
  block?: Maybe<V3_Block_Height>
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3_Tick_OrderBy>
  orderDirection?: Maybe<V3_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  subgraphError?: V3__SubgraphErrorPolicy_
  where?: Maybe<V3_Tick_Filter>
}

export type QueryV3_TokenArgs = {
  block?: Maybe<V3_Block_Height>
  id: Scalars['ID']
  subgraphError?: V3__SubgraphErrorPolicy_
}

export type QueryV3_TokenDayDataArgs = {
  block?: Maybe<V3_Block_Height>
  id: Scalars['ID']
  subgraphError?: V3__SubgraphErrorPolicy_
}

export type QueryV3_TokenDayDatasArgs = {
  block?: Maybe<V3_Block_Height>
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3_TokenDayData_OrderBy>
  orderDirection?: Maybe<V3_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  subgraphError?: V3__SubgraphErrorPolicy_
  where?: Maybe<V3_TokenDayData_Filter>
}

export type QueryV3_TokenHourDataArgs = {
  block?: Maybe<V3_Block_Height>
  id: Scalars['ID']
  subgraphError?: V3__SubgraphErrorPolicy_
}

export type QueryV3_TokenHourDatasArgs = {
  block?: Maybe<V3_Block_Height>
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3_TokenHourData_OrderBy>
  orderDirection?: Maybe<V3_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  subgraphError?: V3__SubgraphErrorPolicy_
  where?: Maybe<V3_TokenHourData_Filter>
}

export type QueryV3_TokensArgs = {
  block?: Maybe<V3_Block_Height>
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3_Token_OrderBy>
  orderDirection?: Maybe<V3_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  subgraphError?: V3__SubgraphErrorPolicy_
  where?: Maybe<V3_Token_Filter>
}

export type QueryV3_TransactionArgs = {
  block?: Maybe<V3_Block_Height>
  id: Scalars['ID']
  subgraphError?: V3__SubgraphErrorPolicy_
}

export type QueryV3_TransactionsArgs = {
  block?: Maybe<V3_Block_Height>
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3_Transaction_OrderBy>
  orderDirection?: Maybe<V3_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  subgraphError?: V3__SubgraphErrorPolicy_
  where?: Maybe<V3_Transaction_Filter>
}

export type QueryV3_UniswapDayDataArgs = {
  block?: Maybe<V3_Block_Height>
  id: Scalars['ID']
  subgraphError?: V3__SubgraphErrorPolicy_
}

export type QueryV3_UniswapDayDatasArgs = {
  block?: Maybe<V3_Block_Height>
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3_UniswapDayData_OrderBy>
  orderDirection?: Maybe<V3_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  subgraphError?: V3__SubgraphErrorPolicy_
  where?: Maybe<V3_UniswapDayData_Filter>
}

export type QueryV3arbitrum__MetaArgs = {
  block?: Maybe<V3arbitrum_Block_Height>
}

export type QueryV3arbitrum_BundleArgs = {
  block?: Maybe<V3arbitrum_Block_Height>
  id: Scalars['ID']
  subgraphError?: V3arbitrum__SubgraphErrorPolicy_
}

export type QueryV3arbitrum_BundlesArgs = {
  block?: Maybe<V3arbitrum_Block_Height>
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3arbitrum_Bundle_OrderBy>
  orderDirection?: Maybe<V3arbitrum_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  subgraphError?: V3arbitrum__SubgraphErrorPolicy_
  where?: Maybe<V3arbitrum_Bundle_Filter>
}

export type QueryV3arbitrum_BurnArgs = {
  block?: Maybe<V3arbitrum_Block_Height>
  id: Scalars['ID']
  subgraphError?: V3arbitrum__SubgraphErrorPolicy_
}

export type QueryV3arbitrum_BurnsArgs = {
  block?: Maybe<V3arbitrum_Block_Height>
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3arbitrum_Burn_OrderBy>
  orderDirection?: Maybe<V3arbitrum_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  subgraphError?: V3arbitrum__SubgraphErrorPolicy_
  where?: Maybe<V3arbitrum_Burn_Filter>
}

export type QueryV3arbitrum_CollectArgs = {
  block?: Maybe<V3arbitrum_Block_Height>
  id: Scalars['ID']
  subgraphError?: V3arbitrum__SubgraphErrorPolicy_
}

export type QueryV3arbitrum_CollectsArgs = {
  block?: Maybe<V3arbitrum_Block_Height>
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3arbitrum_Collect_OrderBy>
  orderDirection?: Maybe<V3arbitrum_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  subgraphError?: V3arbitrum__SubgraphErrorPolicy_
  where?: Maybe<V3arbitrum_Collect_Filter>
}

export type QueryV3arbitrum_FactoriesArgs = {
  block?: Maybe<V3arbitrum_Block_Height>
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3arbitrum_Factory_OrderBy>
  orderDirection?: Maybe<V3arbitrum_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  subgraphError?: V3arbitrum__SubgraphErrorPolicy_
  where?: Maybe<V3arbitrum_Factory_Filter>
}

export type QueryV3arbitrum_FactoryArgs = {
  block?: Maybe<V3arbitrum_Block_Height>
  id: Scalars['ID']
  subgraphError?: V3arbitrum__SubgraphErrorPolicy_
}

export type QueryV3arbitrum_FlashArgs = {
  block?: Maybe<V3arbitrum_Block_Height>
  id: Scalars['ID']
  subgraphError?: V3arbitrum__SubgraphErrorPolicy_
}

export type QueryV3arbitrum_FlashesArgs = {
  block?: Maybe<V3arbitrum_Block_Height>
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3arbitrum_Flash_OrderBy>
  orderDirection?: Maybe<V3arbitrum_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  subgraphError?: V3arbitrum__SubgraphErrorPolicy_
  where?: Maybe<V3arbitrum_Flash_Filter>
}

export type QueryV3arbitrum_MintArgs = {
  block?: Maybe<V3arbitrum_Block_Height>
  id: Scalars['ID']
  subgraphError?: V3arbitrum__SubgraphErrorPolicy_
}

export type QueryV3arbitrum_MintsArgs = {
  block?: Maybe<V3arbitrum_Block_Height>
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3arbitrum_Mint_OrderBy>
  orderDirection?: Maybe<V3arbitrum_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  subgraphError?: V3arbitrum__SubgraphErrorPolicy_
  where?: Maybe<V3arbitrum_Mint_Filter>
}

export type QueryV3arbitrum_PoolArgs = {
  block?: Maybe<V3arbitrum_Block_Height>
  id: Scalars['ID']
  subgraphError?: V3arbitrum__SubgraphErrorPolicy_
}

export type QueryV3arbitrum_PoolDayDataArgs = {
  block?: Maybe<V3arbitrum_Block_Height>
  id: Scalars['ID']
  subgraphError?: V3arbitrum__SubgraphErrorPolicy_
}

export type QueryV3arbitrum_PoolDayDatasArgs = {
  block?: Maybe<V3arbitrum_Block_Height>
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3arbitrum_PoolDayData_OrderBy>
  orderDirection?: Maybe<V3arbitrum_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  subgraphError?: V3arbitrum__SubgraphErrorPolicy_
  where?: Maybe<V3arbitrum_PoolDayData_Filter>
}

export type QueryV3arbitrum_PoolHourDataArgs = {
  block?: Maybe<V3arbitrum_Block_Height>
  id: Scalars['ID']
  subgraphError?: V3arbitrum__SubgraphErrorPolicy_
}

export type QueryV3arbitrum_PoolHourDatasArgs = {
  block?: Maybe<V3arbitrum_Block_Height>
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3arbitrum_PoolHourData_OrderBy>
  orderDirection?: Maybe<V3arbitrum_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  subgraphError?: V3arbitrum__SubgraphErrorPolicy_
  where?: Maybe<V3arbitrum_PoolHourData_Filter>
}

export type QueryV3arbitrum_PoolsArgs = {
  block?: Maybe<V3arbitrum_Block_Height>
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3arbitrum_Pool_OrderBy>
  orderDirection?: Maybe<V3arbitrum_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  subgraphError?: V3arbitrum__SubgraphErrorPolicy_
  where?: Maybe<V3arbitrum_Pool_Filter>
}

export type QueryV3arbitrum_SwapArgs = {
  block?: Maybe<V3arbitrum_Block_Height>
  id: Scalars['ID']
  subgraphError?: V3arbitrum__SubgraphErrorPolicy_
}

export type QueryV3arbitrum_SwapsArgs = {
  block?: Maybe<V3arbitrum_Block_Height>
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3arbitrum_Swap_OrderBy>
  orderDirection?: Maybe<V3arbitrum_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  subgraphError?: V3arbitrum__SubgraphErrorPolicy_
  where?: Maybe<V3arbitrum_Swap_Filter>
}

export type QueryV3arbitrum_TickArgs = {
  block?: Maybe<V3arbitrum_Block_Height>
  id: Scalars['ID']
  subgraphError?: V3arbitrum__SubgraphErrorPolicy_
}

export type QueryV3arbitrum_TickDayDataArgs = {
  block?: Maybe<V3arbitrum_Block_Height>
  id: Scalars['ID']
  subgraphError?: V3arbitrum__SubgraphErrorPolicy_
}

export type QueryV3arbitrum_TickDayDatasArgs = {
  block?: Maybe<V3arbitrum_Block_Height>
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3arbitrum_TickDayData_OrderBy>
  orderDirection?: Maybe<V3arbitrum_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  subgraphError?: V3arbitrum__SubgraphErrorPolicy_
  where?: Maybe<V3arbitrum_TickDayData_Filter>
}

export type QueryV3arbitrum_TickHourDataArgs = {
  block?: Maybe<V3arbitrum_Block_Height>
  id: Scalars['ID']
  subgraphError?: V3arbitrum__SubgraphErrorPolicy_
}

export type QueryV3arbitrum_TickHourDatasArgs = {
  block?: Maybe<V3arbitrum_Block_Height>
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3arbitrum_TickHourData_OrderBy>
  orderDirection?: Maybe<V3arbitrum_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  subgraphError?: V3arbitrum__SubgraphErrorPolicy_
  where?: Maybe<V3arbitrum_TickHourData_Filter>
}

export type QueryV3arbitrum_TicksArgs = {
  block?: Maybe<V3arbitrum_Block_Height>
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3arbitrum_Tick_OrderBy>
  orderDirection?: Maybe<V3arbitrum_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  subgraphError?: V3arbitrum__SubgraphErrorPolicy_
  where?: Maybe<V3arbitrum_Tick_Filter>
}

export type QueryV3arbitrum_TokenArgs = {
  block?: Maybe<V3arbitrum_Block_Height>
  id: Scalars['ID']
  subgraphError?: V3arbitrum__SubgraphErrorPolicy_
}

export type QueryV3arbitrum_TokenDayDataArgs = {
  block?: Maybe<V3arbitrum_Block_Height>
  id: Scalars['ID']
  subgraphError?: V3arbitrum__SubgraphErrorPolicy_
}

export type QueryV3arbitrum_TokenDayDatasArgs = {
  block?: Maybe<V3arbitrum_Block_Height>
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3arbitrum_TokenDayData_OrderBy>
  orderDirection?: Maybe<V3arbitrum_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  subgraphError?: V3arbitrum__SubgraphErrorPolicy_
  where?: Maybe<V3arbitrum_TokenDayData_Filter>
}

export type QueryV3arbitrum_TokenHourDataArgs = {
  block?: Maybe<V3arbitrum_Block_Height>
  id: Scalars['ID']
  subgraphError?: V3arbitrum__SubgraphErrorPolicy_
}

export type QueryV3arbitrum_TokenHourDatasArgs = {
  block?: Maybe<V3arbitrum_Block_Height>
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3arbitrum_TokenHourData_OrderBy>
  orderDirection?: Maybe<V3arbitrum_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  subgraphError?: V3arbitrum__SubgraphErrorPolicy_
  where?: Maybe<V3arbitrum_TokenHourData_Filter>
}

export type QueryV3arbitrum_TokensArgs = {
  block?: Maybe<V3arbitrum_Block_Height>
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3arbitrum_Token_OrderBy>
  orderDirection?: Maybe<V3arbitrum_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  subgraphError?: V3arbitrum__SubgraphErrorPolicy_
  where?: Maybe<V3arbitrum_Token_Filter>
}

export type QueryV3arbitrum_TransactionArgs = {
  block?: Maybe<V3arbitrum_Block_Height>
  id: Scalars['ID']
  subgraphError?: V3arbitrum__SubgraphErrorPolicy_
}

export type QueryV3arbitrum_TransactionsArgs = {
  block?: Maybe<V3arbitrum_Block_Height>
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3arbitrum_Transaction_OrderBy>
  orderDirection?: Maybe<V3arbitrum_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  subgraphError?: V3arbitrum__SubgraphErrorPolicy_
  where?: Maybe<V3arbitrum_Transaction_Filter>
}

export type QueryV3arbitrum_UniswapDayDataArgs = {
  block?: Maybe<V3arbitrum_Block_Height>
  id: Scalars['ID']
  subgraphError?: V3arbitrum__SubgraphErrorPolicy_
}

export type QueryV3arbitrum_UniswapDayDatasArgs = {
  block?: Maybe<V3arbitrum_Block_Height>
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3arbitrum_UniswapDayData_OrderBy>
  orderDirection?: Maybe<V3arbitrum_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  subgraphError?: V3arbitrum__SubgraphErrorPolicy_
  where?: Maybe<V3arbitrum_UniswapDayData_Filter>
}

export type QueryV3polygon__MetaArgs = {
  block?: Maybe<V3polygon_Block_Height>
}

export type QueryV3polygon_BundleArgs = {
  block?: Maybe<V3polygon_Block_Height>
  id: Scalars['ID']
  subgraphError?: V3polygon__SubgraphErrorPolicy_
}

export type QueryV3polygon_BundlesArgs = {
  block?: Maybe<V3polygon_Block_Height>
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3polygon_Bundle_OrderBy>
  orderDirection?: Maybe<V3polygon_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  subgraphError?: V3polygon__SubgraphErrorPolicy_
  where?: Maybe<V3polygon_Bundle_Filter>
}

export type QueryV3polygon_BurnArgs = {
  block?: Maybe<V3polygon_Block_Height>
  id: Scalars['ID']
  subgraphError?: V3polygon__SubgraphErrorPolicy_
}

export type QueryV3polygon_BurnsArgs = {
  block?: Maybe<V3polygon_Block_Height>
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3polygon_Burn_OrderBy>
  orderDirection?: Maybe<V3polygon_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  subgraphError?: V3polygon__SubgraphErrorPolicy_
  where?: Maybe<V3polygon_Burn_Filter>
}

export type QueryV3polygon_CollectArgs = {
  block?: Maybe<V3polygon_Block_Height>
  id: Scalars['ID']
  subgraphError?: V3polygon__SubgraphErrorPolicy_
}

export type QueryV3polygon_CollectsArgs = {
  block?: Maybe<V3polygon_Block_Height>
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3polygon_Collect_OrderBy>
  orderDirection?: Maybe<V3polygon_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  subgraphError?: V3polygon__SubgraphErrorPolicy_
  where?: Maybe<V3polygon_Collect_Filter>
}

export type QueryV3polygon_FactoriesArgs = {
  block?: Maybe<V3polygon_Block_Height>
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3polygon_Factory_OrderBy>
  orderDirection?: Maybe<V3polygon_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  subgraphError?: V3polygon__SubgraphErrorPolicy_
  where?: Maybe<V3polygon_Factory_Filter>
}

export type QueryV3polygon_FactoryArgs = {
  block?: Maybe<V3polygon_Block_Height>
  id: Scalars['ID']
  subgraphError?: V3polygon__SubgraphErrorPolicy_
}

export type QueryV3polygon_FlashArgs = {
  block?: Maybe<V3polygon_Block_Height>
  id: Scalars['ID']
  subgraphError?: V3polygon__SubgraphErrorPolicy_
}

export type QueryV3polygon_FlashesArgs = {
  block?: Maybe<V3polygon_Block_Height>
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3polygon_Flash_OrderBy>
  orderDirection?: Maybe<V3polygon_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  subgraphError?: V3polygon__SubgraphErrorPolicy_
  where?: Maybe<V3polygon_Flash_Filter>
}

export type QueryV3polygon_MintArgs = {
  block?: Maybe<V3polygon_Block_Height>
  id: Scalars['ID']
  subgraphError?: V3polygon__SubgraphErrorPolicy_
}

export type QueryV3polygon_MintsArgs = {
  block?: Maybe<V3polygon_Block_Height>
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3polygon_Mint_OrderBy>
  orderDirection?: Maybe<V3polygon_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  subgraphError?: V3polygon__SubgraphErrorPolicy_
  where?: Maybe<V3polygon_Mint_Filter>
}

export type QueryV3polygon_PoolArgs = {
  block?: Maybe<V3polygon_Block_Height>
  id: Scalars['ID']
  subgraphError?: V3polygon__SubgraphErrorPolicy_
}

export type QueryV3polygon_PoolDayDataArgs = {
  block?: Maybe<V3polygon_Block_Height>
  id: Scalars['ID']
  subgraphError?: V3polygon__SubgraphErrorPolicy_
}

export type QueryV3polygon_PoolDayDatasArgs = {
  block?: Maybe<V3polygon_Block_Height>
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3polygon_PoolDayData_OrderBy>
  orderDirection?: Maybe<V3polygon_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  subgraphError?: V3polygon__SubgraphErrorPolicy_
  where?: Maybe<V3polygon_PoolDayData_Filter>
}

export type QueryV3polygon_PoolHourDataArgs = {
  block?: Maybe<V3polygon_Block_Height>
  id: Scalars['ID']
  subgraphError?: V3polygon__SubgraphErrorPolicy_
}

export type QueryV3polygon_PoolHourDatasArgs = {
  block?: Maybe<V3polygon_Block_Height>
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3polygon_PoolHourData_OrderBy>
  orderDirection?: Maybe<V3polygon_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  subgraphError?: V3polygon__SubgraphErrorPolicy_
  where?: Maybe<V3polygon_PoolHourData_Filter>
}

export type QueryV3polygon_PoolsArgs = {
  block?: Maybe<V3polygon_Block_Height>
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3polygon_Pool_OrderBy>
  orderDirection?: Maybe<V3polygon_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  subgraphError?: V3polygon__SubgraphErrorPolicy_
  where?: Maybe<V3polygon_Pool_Filter>
}

export type QueryV3polygon_PositionArgs = {
  block?: Maybe<V3polygon_Block_Height>
  id: Scalars['ID']
  subgraphError?: V3polygon__SubgraphErrorPolicy_
}

export type QueryV3polygon_PositionSnapshotArgs = {
  block?: Maybe<V3polygon_Block_Height>
  id: Scalars['ID']
  subgraphError?: V3polygon__SubgraphErrorPolicy_
}

export type QueryV3polygon_PositionSnapshotsArgs = {
  block?: Maybe<V3polygon_Block_Height>
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3polygon_PositionSnapshot_OrderBy>
  orderDirection?: Maybe<V3polygon_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  subgraphError?: V3polygon__SubgraphErrorPolicy_
  where?: Maybe<V3polygon_PositionSnapshot_Filter>
}

export type QueryV3polygon_PositionsArgs = {
  block?: Maybe<V3polygon_Block_Height>
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3polygon_Position_OrderBy>
  orderDirection?: Maybe<V3polygon_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  subgraphError?: V3polygon__SubgraphErrorPolicy_
  where?: Maybe<V3polygon_Position_Filter>
}

export type QueryV3polygon_SwapArgs = {
  block?: Maybe<V3polygon_Block_Height>
  id: Scalars['ID']
  subgraphError?: V3polygon__SubgraphErrorPolicy_
}

export type QueryV3polygon_SwapsArgs = {
  block?: Maybe<V3polygon_Block_Height>
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3polygon_Swap_OrderBy>
  orderDirection?: Maybe<V3polygon_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  subgraphError?: V3polygon__SubgraphErrorPolicy_
  where?: Maybe<V3polygon_Swap_Filter>
}

export type QueryV3polygon_TickArgs = {
  block?: Maybe<V3polygon_Block_Height>
  id: Scalars['ID']
  subgraphError?: V3polygon__SubgraphErrorPolicy_
}

export type QueryV3polygon_TickDayDataArgs = {
  block?: Maybe<V3polygon_Block_Height>
  id: Scalars['ID']
  subgraphError?: V3polygon__SubgraphErrorPolicy_
}

export type QueryV3polygon_TickDayDatasArgs = {
  block?: Maybe<V3polygon_Block_Height>
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3polygon_TickDayData_OrderBy>
  orderDirection?: Maybe<V3polygon_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  subgraphError?: V3polygon__SubgraphErrorPolicy_
  where?: Maybe<V3polygon_TickDayData_Filter>
}

export type QueryV3polygon_TickHourDataArgs = {
  block?: Maybe<V3polygon_Block_Height>
  id: Scalars['ID']
  subgraphError?: V3polygon__SubgraphErrorPolicy_
}

export type QueryV3polygon_TickHourDatasArgs = {
  block?: Maybe<V3polygon_Block_Height>
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3polygon_TickHourData_OrderBy>
  orderDirection?: Maybe<V3polygon_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  subgraphError?: V3polygon__SubgraphErrorPolicy_
  where?: Maybe<V3polygon_TickHourData_Filter>
}

export type QueryV3polygon_TicksArgs = {
  block?: Maybe<V3polygon_Block_Height>
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3polygon_Tick_OrderBy>
  orderDirection?: Maybe<V3polygon_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  subgraphError?: V3polygon__SubgraphErrorPolicy_
  where?: Maybe<V3polygon_Tick_Filter>
}

export type QueryV3polygon_TokenArgs = {
  block?: Maybe<V3polygon_Block_Height>
  id: Scalars['ID']
  subgraphError?: V3polygon__SubgraphErrorPolicy_
}

export type QueryV3polygon_TokenDayDataArgs = {
  block?: Maybe<V3polygon_Block_Height>
  id: Scalars['ID']
  subgraphError?: V3polygon__SubgraphErrorPolicy_
}

export type QueryV3polygon_TokenDayDatasArgs = {
  block?: Maybe<V3polygon_Block_Height>
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3polygon_TokenDayData_OrderBy>
  orderDirection?: Maybe<V3polygon_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  subgraphError?: V3polygon__SubgraphErrorPolicy_
  where?: Maybe<V3polygon_TokenDayData_Filter>
}

export type QueryV3polygon_TokenHourDataArgs = {
  block?: Maybe<V3polygon_Block_Height>
  id: Scalars['ID']
  subgraphError?: V3polygon__SubgraphErrorPolicy_
}

export type QueryV3polygon_TokenHourDatasArgs = {
  block?: Maybe<V3polygon_Block_Height>
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3polygon_TokenHourData_OrderBy>
  orderDirection?: Maybe<V3polygon_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  subgraphError?: V3polygon__SubgraphErrorPolicy_
  where?: Maybe<V3polygon_TokenHourData_Filter>
}

export type QueryV3polygon_TokensArgs = {
  block?: Maybe<V3polygon_Block_Height>
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3polygon_Token_OrderBy>
  orderDirection?: Maybe<V3polygon_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  subgraphError?: V3polygon__SubgraphErrorPolicy_
  where?: Maybe<V3polygon_Token_Filter>
}

export type QueryV3polygon_TransactionArgs = {
  block?: Maybe<V3polygon_Block_Height>
  id: Scalars['ID']
  subgraphError?: V3polygon__SubgraphErrorPolicy_
}

export type QueryV3polygon_TransactionsArgs = {
  block?: Maybe<V3polygon_Block_Height>
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3polygon_Transaction_OrderBy>
  orderDirection?: Maybe<V3polygon_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  subgraphError?: V3polygon__SubgraphErrorPolicy_
  where?: Maybe<V3polygon_Transaction_Filter>
}

export type QueryV3polygon_UniswapDayDataArgs = {
  block?: Maybe<V3polygon_Block_Height>
  id: Scalars['ID']
  subgraphError?: V3polygon__SubgraphErrorPolicy_
}

export type QueryV3polygon_UniswapDayDatasArgs = {
  block?: Maybe<V3polygon_Block_Height>
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3polygon_UniswapDayData_OrderBy>
  orderDirection?: Maybe<V3polygon_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  subgraphError?: V3polygon__SubgraphErrorPolicy_
  where?: Maybe<V3polygon_UniswapDayData_Filter>
}

export type QueryV3rinkeby__MetaArgs = {
  block?: Maybe<V3rinkeby_Block_Height>
}

export type QueryV3rinkeby_BundleArgs = {
  block?: Maybe<V3rinkeby_Block_Height>
  id: Scalars['ID']
  subgraphError?: V3rinkeby__SubgraphErrorPolicy_
}

export type QueryV3rinkeby_BundlesArgs = {
  block?: Maybe<V3rinkeby_Block_Height>
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3rinkeby_Bundle_OrderBy>
  orderDirection?: Maybe<V3rinkeby_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  subgraphError?: V3rinkeby__SubgraphErrorPolicy_
  where?: Maybe<V3rinkeby_Bundle_Filter>
}

export type QueryV3rinkeby_BurnArgs = {
  block?: Maybe<V3rinkeby_Block_Height>
  id: Scalars['ID']
  subgraphError?: V3rinkeby__SubgraphErrorPolicy_
}

export type QueryV3rinkeby_BurnsArgs = {
  block?: Maybe<V3rinkeby_Block_Height>
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3rinkeby_Burn_OrderBy>
  orderDirection?: Maybe<V3rinkeby_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  subgraphError?: V3rinkeby__SubgraphErrorPolicy_
  where?: Maybe<V3rinkeby_Burn_Filter>
}

export type QueryV3rinkeby_CollectArgs = {
  block?: Maybe<V3rinkeby_Block_Height>
  id: Scalars['ID']
  subgraphError?: V3rinkeby__SubgraphErrorPolicy_
}

export type QueryV3rinkeby_CollectsArgs = {
  block?: Maybe<V3rinkeby_Block_Height>
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3rinkeby_Collect_OrderBy>
  orderDirection?: Maybe<V3rinkeby_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  subgraphError?: V3rinkeby__SubgraphErrorPolicy_
  where?: Maybe<V3rinkeby_Collect_Filter>
}

export type QueryV3rinkeby_FactoriesArgs = {
  block?: Maybe<V3rinkeby_Block_Height>
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3rinkeby_Factory_OrderBy>
  orderDirection?: Maybe<V3rinkeby_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  subgraphError?: V3rinkeby__SubgraphErrorPolicy_
  where?: Maybe<V3rinkeby_Factory_Filter>
}

export type QueryV3rinkeby_FactoryArgs = {
  block?: Maybe<V3rinkeby_Block_Height>
  id: Scalars['ID']
  subgraphError?: V3rinkeby__SubgraphErrorPolicy_
}

export type QueryV3rinkeby_FlashArgs = {
  block?: Maybe<V3rinkeby_Block_Height>
  id: Scalars['ID']
  subgraphError?: V3rinkeby__SubgraphErrorPolicy_
}

export type QueryV3rinkeby_FlashesArgs = {
  block?: Maybe<V3rinkeby_Block_Height>
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3rinkeby_Flash_OrderBy>
  orderDirection?: Maybe<V3rinkeby_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  subgraphError?: V3rinkeby__SubgraphErrorPolicy_
  where?: Maybe<V3rinkeby_Flash_Filter>
}

export type QueryV3rinkeby_MintArgs = {
  block?: Maybe<V3rinkeby_Block_Height>
  id: Scalars['ID']
  subgraphError?: V3rinkeby__SubgraphErrorPolicy_
}

export type QueryV3rinkeby_MintsArgs = {
  block?: Maybe<V3rinkeby_Block_Height>
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3rinkeby_Mint_OrderBy>
  orderDirection?: Maybe<V3rinkeby_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  subgraphError?: V3rinkeby__SubgraphErrorPolicy_
  where?: Maybe<V3rinkeby_Mint_Filter>
}

export type QueryV3rinkeby_PoolArgs = {
  block?: Maybe<V3rinkeby_Block_Height>
  id: Scalars['ID']
  subgraphError?: V3rinkeby__SubgraphErrorPolicy_
}

export type QueryV3rinkeby_PoolDayDataArgs = {
  block?: Maybe<V3rinkeby_Block_Height>
  id: Scalars['ID']
  subgraphError?: V3rinkeby__SubgraphErrorPolicy_
}

export type QueryV3rinkeby_PoolDayDatasArgs = {
  block?: Maybe<V3rinkeby_Block_Height>
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3rinkeby_PoolDayData_OrderBy>
  orderDirection?: Maybe<V3rinkeby_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  subgraphError?: V3rinkeby__SubgraphErrorPolicy_
  where?: Maybe<V3rinkeby_PoolDayData_Filter>
}

export type QueryV3rinkeby_PoolHourDataArgs = {
  block?: Maybe<V3rinkeby_Block_Height>
  id: Scalars['ID']
  subgraphError?: V3rinkeby__SubgraphErrorPolicy_
}

export type QueryV3rinkeby_PoolHourDatasArgs = {
  block?: Maybe<V3rinkeby_Block_Height>
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3rinkeby_PoolHourData_OrderBy>
  orderDirection?: Maybe<V3rinkeby_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  subgraphError?: V3rinkeby__SubgraphErrorPolicy_
  where?: Maybe<V3rinkeby_PoolHourData_Filter>
}

export type QueryV3rinkeby_PoolsArgs = {
  block?: Maybe<V3rinkeby_Block_Height>
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3rinkeby_Pool_OrderBy>
  orderDirection?: Maybe<V3rinkeby_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  subgraphError?: V3rinkeby__SubgraphErrorPolicy_
  where?: Maybe<V3rinkeby_Pool_Filter>
}

export type QueryV3rinkeby_PositionArgs = {
  block?: Maybe<V3rinkeby_Block_Height>
  id: Scalars['ID']
  subgraphError?: V3rinkeby__SubgraphErrorPolicy_
}

export type QueryV3rinkeby_PositionSnapshotArgs = {
  block?: Maybe<V3rinkeby_Block_Height>
  id: Scalars['ID']
  subgraphError?: V3rinkeby__SubgraphErrorPolicy_
}

export type QueryV3rinkeby_PositionSnapshotsArgs = {
  block?: Maybe<V3rinkeby_Block_Height>
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3rinkeby_PositionSnapshot_OrderBy>
  orderDirection?: Maybe<V3rinkeby_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  subgraphError?: V3rinkeby__SubgraphErrorPolicy_
  where?: Maybe<V3rinkeby_PositionSnapshot_Filter>
}

export type QueryV3rinkeby_PositionsArgs = {
  block?: Maybe<V3rinkeby_Block_Height>
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3rinkeby_Position_OrderBy>
  orderDirection?: Maybe<V3rinkeby_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  subgraphError?: V3rinkeby__SubgraphErrorPolicy_
  where?: Maybe<V3rinkeby_Position_Filter>
}

export type QueryV3rinkeby_SwapArgs = {
  block?: Maybe<V3rinkeby_Block_Height>
  id: Scalars['ID']
  subgraphError?: V3rinkeby__SubgraphErrorPolicy_
}

export type QueryV3rinkeby_SwapsArgs = {
  block?: Maybe<V3rinkeby_Block_Height>
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3rinkeby_Swap_OrderBy>
  orderDirection?: Maybe<V3rinkeby_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  subgraphError?: V3rinkeby__SubgraphErrorPolicy_
  where?: Maybe<V3rinkeby_Swap_Filter>
}

export type QueryV3rinkeby_TickArgs = {
  block?: Maybe<V3rinkeby_Block_Height>
  id: Scalars['ID']
  subgraphError?: V3rinkeby__SubgraphErrorPolicy_
}

export type QueryV3rinkeby_TickDayDataArgs = {
  block?: Maybe<V3rinkeby_Block_Height>
  id: Scalars['ID']
  subgraphError?: V3rinkeby__SubgraphErrorPolicy_
}

export type QueryV3rinkeby_TickDayDatasArgs = {
  block?: Maybe<V3rinkeby_Block_Height>
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3rinkeby_TickDayData_OrderBy>
  orderDirection?: Maybe<V3rinkeby_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  subgraphError?: V3rinkeby__SubgraphErrorPolicy_
  where?: Maybe<V3rinkeby_TickDayData_Filter>
}

export type QueryV3rinkeby_TickHourDataArgs = {
  block?: Maybe<V3rinkeby_Block_Height>
  id: Scalars['ID']
  subgraphError?: V3rinkeby__SubgraphErrorPolicy_
}

export type QueryV3rinkeby_TickHourDatasArgs = {
  block?: Maybe<V3rinkeby_Block_Height>
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3rinkeby_TickHourData_OrderBy>
  orderDirection?: Maybe<V3rinkeby_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  subgraphError?: V3rinkeby__SubgraphErrorPolicy_
  where?: Maybe<V3rinkeby_TickHourData_Filter>
}

export type QueryV3rinkeby_TicksArgs = {
  block?: Maybe<V3rinkeby_Block_Height>
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3rinkeby_Tick_OrderBy>
  orderDirection?: Maybe<V3rinkeby_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  subgraphError?: V3rinkeby__SubgraphErrorPolicy_
  where?: Maybe<V3rinkeby_Tick_Filter>
}

export type QueryV3rinkeby_TokenArgs = {
  block?: Maybe<V3rinkeby_Block_Height>
  id: Scalars['ID']
  subgraphError?: V3rinkeby__SubgraphErrorPolicy_
}

export type QueryV3rinkeby_TokenDayDataArgs = {
  block?: Maybe<V3rinkeby_Block_Height>
  id: Scalars['ID']
  subgraphError?: V3rinkeby__SubgraphErrorPolicy_
}

export type QueryV3rinkeby_TokenDayDatasArgs = {
  block?: Maybe<V3rinkeby_Block_Height>
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3rinkeby_TokenDayData_OrderBy>
  orderDirection?: Maybe<V3rinkeby_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  subgraphError?: V3rinkeby__SubgraphErrorPolicy_
  where?: Maybe<V3rinkeby_TokenDayData_Filter>
}

export type QueryV3rinkeby_TokenHourDataArgs = {
  block?: Maybe<V3rinkeby_Block_Height>
  id: Scalars['ID']
  subgraphError?: V3rinkeby__SubgraphErrorPolicy_
}

export type QueryV3rinkeby_TokenHourDatasArgs = {
  block?: Maybe<V3rinkeby_Block_Height>
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3rinkeby_TokenHourData_OrderBy>
  orderDirection?: Maybe<V3rinkeby_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  subgraphError?: V3rinkeby__SubgraphErrorPolicy_
  where?: Maybe<V3rinkeby_TokenHourData_Filter>
}

export type QueryV3rinkeby_TokensArgs = {
  block?: Maybe<V3rinkeby_Block_Height>
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3rinkeby_Token_OrderBy>
  orderDirection?: Maybe<V3rinkeby_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  subgraphError?: V3rinkeby__SubgraphErrorPolicy_
  where?: Maybe<V3rinkeby_Token_Filter>
}

export type QueryV3rinkeby_TransactionArgs = {
  block?: Maybe<V3rinkeby_Block_Height>
  id: Scalars['ID']
  subgraphError?: V3rinkeby__SubgraphErrorPolicy_
}

export type QueryV3rinkeby_TransactionsArgs = {
  block?: Maybe<V3rinkeby_Block_Height>
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3rinkeby_Transaction_OrderBy>
  orderDirection?: Maybe<V3rinkeby_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  subgraphError?: V3rinkeby__SubgraphErrorPolicy_
  where?: Maybe<V3rinkeby_Transaction_Filter>
}

export type QueryV3rinkeby_UniswapDayDataArgs = {
  block?: Maybe<V3rinkeby_Block_Height>
  id: Scalars['ID']
  subgraphError?: V3rinkeby__SubgraphErrorPolicy_
}

export type QueryV3rinkeby_UniswapDayDatasArgs = {
  block?: Maybe<V3rinkeby_Block_Height>
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3rinkeby_UniswapDayData_OrderBy>
  orderDirection?: Maybe<V3rinkeby_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  subgraphError?: V3rinkeby__SubgraphErrorPolicy_
  where?: Maybe<V3rinkeby_UniswapDayData_Filter>
}

export type Subscription = {
  __typename?: 'Subscription'
  /** fetch data from the table: "blocks" */
  blocks: Array<Blocks>
  /** fetch aggregated fields from the table: "blocks" */
  blocks_aggregate: Blocks_Aggregate
  /** fetch data from the table: "blocks" using primary key columns */
  blocks_by_pk?: Maybe<Blocks>
}

export type SubscriptionBlocksArgs = {
  distinct_on?: Maybe<Array<Blocks_Select_Column>>
  limit?: Maybe<Scalars['Int']>
  offset?: Maybe<Scalars['Int']>
  order_by?: Maybe<Array<Blocks_Order_By>>
  where?: Maybe<Blocks_Bool_Exp>
}

export type SubscriptionBlocks_AggregateArgs = {
  distinct_on?: Maybe<Array<Blocks_Select_Column>>
  limit?: Maybe<Scalars['Int']>
  offset?: Maybe<Scalars['Int']>
  order_by?: Maybe<Array<Blocks_Order_By>>
  where?: Maybe<Blocks_Bool_Exp>
}

export type SubscriptionBlocks_By_PkArgs = {
  number: Scalars['Int']
}

export type TimeseriesOutput = {
  __typename?: 'TimeseriesOutput'
  points: Scalars['String']
  timestamps: Scalars['String']
}

/** Boolean expression to compare columns of type "bigint". All fields are combined with logical 'AND'. */
export type Bigint_Comparison_Exp = {
  _eq?: Maybe<Scalars['bigint']>
  _gt?: Maybe<Scalars['bigint']>
  _gte?: Maybe<Scalars['bigint']>
  _in?: Maybe<Array<Scalars['bigint']>>
  _is_null?: Maybe<Scalars['Boolean']>
  _lt?: Maybe<Scalars['bigint']>
  _lte?: Maybe<Scalars['bigint']>
  _neq?: Maybe<Scalars['bigint']>
  _nin?: Maybe<Array<Scalars['bigint']>>
}

/** columns and relationships of "blocks" */
export type Blocks = {
  __typename?: 'blocks'
  difficulty: Scalars['bigint']
  extra_data: Scalars['bytea']
  gas_limit: Scalars['bigint']
  gas_used: Scalars['bigint']
  hash: Scalars['bytea']
  miner: Scalars['bytea']
  nonce: Scalars['bytea']
  number: Scalars['Int']
  parent_hash: Scalars['bytea']
  timestamp: Scalars['timestamp']
}

/** aggregated selection of "blocks" */
export type Blocks_Aggregate = {
  __typename?: 'blocks_aggregate'
  aggregate?: Maybe<Blocks_Aggregate_Fields>
  nodes: Array<Blocks>
}

/** aggregate fields of "blocks" */
export type Blocks_Aggregate_Fields = {
  __typename?: 'blocks_aggregate_fields'
  avg?: Maybe<Blocks_Avg_Fields>
  count: Scalars['Int']
  max?: Maybe<Blocks_Max_Fields>
  min?: Maybe<Blocks_Min_Fields>
  stddev?: Maybe<Blocks_Stddev_Fields>
  stddev_pop?: Maybe<Blocks_Stddev_Pop_Fields>
  stddev_samp?: Maybe<Blocks_Stddev_Samp_Fields>
  sum?: Maybe<Blocks_Sum_Fields>
  var_pop?: Maybe<Blocks_Var_Pop_Fields>
  var_samp?: Maybe<Blocks_Var_Samp_Fields>
  variance?: Maybe<Blocks_Variance_Fields>
}

/** aggregate fields of "blocks" */
export type Blocks_Aggregate_FieldsCountArgs = {
  columns?: Maybe<Array<Blocks_Select_Column>>
  distinct?: Maybe<Scalars['Boolean']>
}

/** aggregate avg on columns */
export type Blocks_Avg_Fields = {
  __typename?: 'blocks_avg_fields'
  difficulty?: Maybe<Scalars['Float']>
  gas_limit?: Maybe<Scalars['Float']>
  gas_used?: Maybe<Scalars['Float']>
  number?: Maybe<Scalars['Float']>
}

/** Boolean expression to filter rows from the table "blocks". All fields are combined with a logical 'AND'. */
export type Blocks_Bool_Exp = {
  _and?: Maybe<Array<Blocks_Bool_Exp>>
  _not?: Maybe<Blocks_Bool_Exp>
  _or?: Maybe<Array<Blocks_Bool_Exp>>
  difficulty?: Maybe<Bigint_Comparison_Exp>
  extra_data?: Maybe<Bytea_Comparison_Exp>
  gas_limit?: Maybe<Bigint_Comparison_Exp>
  gas_used?: Maybe<Bigint_Comparison_Exp>
  hash?: Maybe<Bytea_Comparison_Exp>
  miner?: Maybe<Bytea_Comparison_Exp>
  nonce?: Maybe<Bytea_Comparison_Exp>
  number?: Maybe<Int_Comparison_Exp>
  parent_hash?: Maybe<Bytea_Comparison_Exp>
  timestamp?: Maybe<Timestamp_Comparison_Exp>
}

/** unique or primary key constraints on table "blocks" */
export enum Blocks_Constraint {
  /** unique or primary key constraint */
  BlocksHashKey = 'blocks_hash_key',
  /** unique or primary key constraint */
  BlocksPkey = 'blocks_pkey',
}

/** input type for incrementing numeric columns in table "blocks" */
export type Blocks_Inc_Input = {
  difficulty?: Maybe<Scalars['bigint']>
  gas_limit?: Maybe<Scalars['bigint']>
  gas_used?: Maybe<Scalars['bigint']>
  number?: Maybe<Scalars['Int']>
}

/** input type for inserting data into table "blocks" */
export type Blocks_Insert_Input = {
  difficulty?: Maybe<Scalars['bigint']>
  extra_data?: Maybe<Scalars['bytea']>
  gas_limit?: Maybe<Scalars['bigint']>
  gas_used?: Maybe<Scalars['bigint']>
  hash?: Maybe<Scalars['bytea']>
  miner?: Maybe<Scalars['bytea']>
  nonce?: Maybe<Scalars['bytea']>
  number?: Maybe<Scalars['Int']>
  parent_hash?: Maybe<Scalars['bytea']>
  timestamp?: Maybe<Scalars['timestamp']>
}

/** aggregate max on columns */
export type Blocks_Max_Fields = {
  __typename?: 'blocks_max_fields'
  difficulty?: Maybe<Scalars['bigint']>
  gas_limit?: Maybe<Scalars['bigint']>
  gas_used?: Maybe<Scalars['bigint']>
  number?: Maybe<Scalars['Int']>
  timestamp?: Maybe<Scalars['timestamp']>
}

/** aggregate min on columns */
export type Blocks_Min_Fields = {
  __typename?: 'blocks_min_fields'
  difficulty?: Maybe<Scalars['bigint']>
  gas_limit?: Maybe<Scalars['bigint']>
  gas_used?: Maybe<Scalars['bigint']>
  number?: Maybe<Scalars['Int']>
  timestamp?: Maybe<Scalars['timestamp']>
}

/** response of any mutation on the table "blocks" */
export type Blocks_Mutation_Response = {
  __typename?: 'blocks_mutation_response'
  /** number of rows affected by the mutation */
  affected_rows: Scalars['Int']
  /** data from the rows affected by the mutation */
  returning: Array<Blocks>
}

/** on conflict condition type for table "blocks" */
export type Blocks_On_Conflict = {
  constraint: Blocks_Constraint
  update_columns?: Array<Blocks_Update_Column>
  where?: Maybe<Blocks_Bool_Exp>
}

/** Ordering options when selecting data from "blocks". */
export type Blocks_Order_By = {
  difficulty?: Maybe<Order_By>
  extra_data?: Maybe<Order_By>
  gas_limit?: Maybe<Order_By>
  gas_used?: Maybe<Order_By>
  hash?: Maybe<Order_By>
  miner?: Maybe<Order_By>
  nonce?: Maybe<Order_By>
  number?: Maybe<Order_By>
  parent_hash?: Maybe<Order_By>
  timestamp?: Maybe<Order_By>
}

/** primary key columns input for table: blocks */
export type Blocks_Pk_Columns_Input = {
  number: Scalars['Int']
}

/** select columns of table "blocks" */
export enum Blocks_Select_Column {
  /** column name */
  Difficulty = 'difficulty',
  /** column name */
  ExtraData = 'extra_data',
  /** column name */
  GasLimit = 'gas_limit',
  /** column name */
  GasUsed = 'gas_used',
  /** column name */
  Hash = 'hash',
  /** column name */
  Miner = 'miner',
  /** column name */
  Nonce = 'nonce',
  /** column name */
  Number = 'number',
  /** column name */
  ParentHash = 'parent_hash',
  /** column name */
  Timestamp = 'timestamp',
}

/** input type for updating data in table "blocks" */
export type Blocks_Set_Input = {
  difficulty?: Maybe<Scalars['bigint']>
  extra_data?: Maybe<Scalars['bytea']>
  gas_limit?: Maybe<Scalars['bigint']>
  gas_used?: Maybe<Scalars['bigint']>
  hash?: Maybe<Scalars['bytea']>
  miner?: Maybe<Scalars['bytea']>
  nonce?: Maybe<Scalars['bytea']>
  number?: Maybe<Scalars['Int']>
  parent_hash?: Maybe<Scalars['bytea']>
  timestamp?: Maybe<Scalars['timestamp']>
}

/** aggregate stddev on columns */
export type Blocks_Stddev_Fields = {
  __typename?: 'blocks_stddev_fields'
  difficulty?: Maybe<Scalars['Float']>
  gas_limit?: Maybe<Scalars['Float']>
  gas_used?: Maybe<Scalars['Float']>
  number?: Maybe<Scalars['Float']>
}

/** aggregate stddev_pop on columns */
export type Blocks_Stddev_Pop_Fields = {
  __typename?: 'blocks_stddev_pop_fields'
  difficulty?: Maybe<Scalars['Float']>
  gas_limit?: Maybe<Scalars['Float']>
  gas_used?: Maybe<Scalars['Float']>
  number?: Maybe<Scalars['Float']>
}

/** aggregate stddev_samp on columns */
export type Blocks_Stddev_Samp_Fields = {
  __typename?: 'blocks_stddev_samp_fields'
  difficulty?: Maybe<Scalars['Float']>
  gas_limit?: Maybe<Scalars['Float']>
  gas_used?: Maybe<Scalars['Float']>
  number?: Maybe<Scalars['Float']>
}

/** aggregate sum on columns */
export type Blocks_Sum_Fields = {
  __typename?: 'blocks_sum_fields'
  difficulty?: Maybe<Scalars['bigint']>
  gas_limit?: Maybe<Scalars['bigint']>
  gas_used?: Maybe<Scalars['bigint']>
  number?: Maybe<Scalars['Int']>
}

/** update columns of table "blocks" */
export enum Blocks_Update_Column {
  /** column name */
  Difficulty = 'difficulty',
  /** column name */
  ExtraData = 'extra_data',
  /** column name */
  GasLimit = 'gas_limit',
  /** column name */
  GasUsed = 'gas_used',
  /** column name */
  Hash = 'hash',
  /** column name */
  Miner = 'miner',
  /** column name */
  Nonce = 'nonce',
  /** column name */
  Number = 'number',
  /** column name */
  ParentHash = 'parent_hash',
  /** column name */
  Timestamp = 'timestamp',
}

/** aggregate var_pop on columns */
export type Blocks_Var_Pop_Fields = {
  __typename?: 'blocks_var_pop_fields'
  difficulty?: Maybe<Scalars['Float']>
  gas_limit?: Maybe<Scalars['Float']>
  gas_used?: Maybe<Scalars['Float']>
  number?: Maybe<Scalars['Float']>
}

/** aggregate var_samp on columns */
export type Blocks_Var_Samp_Fields = {
  __typename?: 'blocks_var_samp_fields'
  difficulty?: Maybe<Scalars['Float']>
  gas_limit?: Maybe<Scalars['Float']>
  gas_used?: Maybe<Scalars['Float']>
  number?: Maybe<Scalars['Float']>
}

/** aggregate variance on columns */
export type Blocks_Variance_Fields = {
  __typename?: 'blocks_variance_fields'
  difficulty?: Maybe<Scalars['Float']>
  gas_limit?: Maybe<Scalars['Float']>
  gas_used?: Maybe<Scalars['Float']>
  number?: Maybe<Scalars['Float']>
}

/** Boolean expression to compare columns of type "bytea". All fields are combined with logical 'AND'. */
export type Bytea_Comparison_Exp = {
  _eq?: Maybe<Scalars['bytea']>
  _gt?: Maybe<Scalars['bytea']>
  _gte?: Maybe<Scalars['bytea']>
  _in?: Maybe<Array<Scalars['bytea']>>
  _is_null?: Maybe<Scalars['Boolean']>
  _lt?: Maybe<Scalars['bytea']>
  _lte?: Maybe<Scalars['bytea']>
  _neq?: Maybe<Scalars['bytea']>
  _nin?: Maybe<Array<Scalars['bytea']>>
}

/** column ordering options */
export enum Order_By {
  /** in ascending order, nulls last */
  Asc = 'asc',
  /** in ascending order, nulls first */
  AscNullsFirst = 'asc_nulls_first',
  /** in ascending order, nulls last */
  AscNullsLast = 'asc_nulls_last',
  /** in descending order, nulls first */
  Desc = 'desc',
  /** in descending order, nulls first */
  DescNullsFirst = 'desc_nulls_first',
  /** in descending order, nulls last */
  DescNullsLast = 'desc_nulls_last',
}

/** Boolean expression to compare columns of type "timestamp". All fields are combined with logical 'AND'. */
export type Timestamp_Comparison_Exp = {
  _eq?: Maybe<Scalars['timestamp']>
  _gt?: Maybe<Scalars['timestamp']>
  _gte?: Maybe<Scalars['timestamp']>
  _in?: Maybe<Array<Scalars['timestamp']>>
  _is_null?: Maybe<Scalars['Boolean']>
  _lt?: Maybe<Scalars['timestamp']>
  _lte?: Maybe<Scalars['timestamp']>
  _neq?: Maybe<Scalars['timestamp']>
  _nin?: Maybe<Array<Scalars['timestamp']>>
}

export type V2_Block_Height = {
  hash?: Maybe<Scalars['v2_Bytes']>
  number?: Maybe<Scalars['Int']>
  number_gte?: Maybe<Scalars['Int']>
}

export type V2_Bundle = {
  __typename?: 'v2_Bundle'
  ethPrice: Scalars['v2_BigDecimal']
  id: Scalars['ID']
}

export type V2_Bundle_Filter = {
  ethPrice?: Maybe<Scalars['v2_BigDecimal']>
  ethPrice_gt?: Maybe<Scalars['v2_BigDecimal']>
  ethPrice_gte?: Maybe<Scalars['v2_BigDecimal']>
  ethPrice_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
  ethPrice_lt?: Maybe<Scalars['v2_BigDecimal']>
  ethPrice_lte?: Maybe<Scalars['v2_BigDecimal']>
  ethPrice_not?: Maybe<Scalars['v2_BigDecimal']>
  ethPrice_not_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
  id?: Maybe<Scalars['ID']>
  id_gt?: Maybe<Scalars['ID']>
  id_gte?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  id_lt?: Maybe<Scalars['ID']>
  id_lte?: Maybe<Scalars['ID']>
  id_not?: Maybe<Scalars['ID']>
  id_not_in?: Maybe<Array<Scalars['ID']>>
}

export enum V2_Bundle_OrderBy {
  EthPrice = 'ethPrice',
  Id = 'id',
}

export type V2_Burn = {
  __typename?: 'v2_Burn'
  amount0?: Maybe<Scalars['v2_BigDecimal']>
  amount1?: Maybe<Scalars['v2_BigDecimal']>
  amountUSD?: Maybe<Scalars['v2_BigDecimal']>
  feeLiquidity?: Maybe<Scalars['v2_BigDecimal']>
  feeTo?: Maybe<Scalars['v2_Bytes']>
  id: Scalars['ID']
  liquidity: Scalars['v2_BigDecimal']
  logIndex?: Maybe<Scalars['v2_BigInt']>
  needsComplete: Scalars['Boolean']
  pair: V2_Pair
  sender?: Maybe<Scalars['v2_Bytes']>
  timestamp: Scalars['v2_BigInt']
  to?: Maybe<Scalars['v2_Bytes']>
  transaction: V2_Transaction
}

export type V2_Burn_Filter = {
  amount0?: Maybe<Scalars['v2_BigDecimal']>
  amount0_gt?: Maybe<Scalars['v2_BigDecimal']>
  amount0_gte?: Maybe<Scalars['v2_BigDecimal']>
  amount0_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
  amount0_lt?: Maybe<Scalars['v2_BigDecimal']>
  amount0_lte?: Maybe<Scalars['v2_BigDecimal']>
  amount0_not?: Maybe<Scalars['v2_BigDecimal']>
  amount0_not_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
  amount1?: Maybe<Scalars['v2_BigDecimal']>
  amount1_gt?: Maybe<Scalars['v2_BigDecimal']>
  amount1_gte?: Maybe<Scalars['v2_BigDecimal']>
  amount1_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
  amount1_lt?: Maybe<Scalars['v2_BigDecimal']>
  amount1_lte?: Maybe<Scalars['v2_BigDecimal']>
  amount1_not?: Maybe<Scalars['v2_BigDecimal']>
  amount1_not_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
  amountUSD?: Maybe<Scalars['v2_BigDecimal']>
  amountUSD_gt?: Maybe<Scalars['v2_BigDecimal']>
  amountUSD_gte?: Maybe<Scalars['v2_BigDecimal']>
  amountUSD_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
  amountUSD_lt?: Maybe<Scalars['v2_BigDecimal']>
  amountUSD_lte?: Maybe<Scalars['v2_BigDecimal']>
  amountUSD_not?: Maybe<Scalars['v2_BigDecimal']>
  amountUSD_not_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
  feeLiquidity?: Maybe<Scalars['v2_BigDecimal']>
  feeLiquidity_gt?: Maybe<Scalars['v2_BigDecimal']>
  feeLiquidity_gte?: Maybe<Scalars['v2_BigDecimal']>
  feeLiquidity_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
  feeLiquidity_lt?: Maybe<Scalars['v2_BigDecimal']>
  feeLiquidity_lte?: Maybe<Scalars['v2_BigDecimal']>
  feeLiquidity_not?: Maybe<Scalars['v2_BigDecimal']>
  feeLiquidity_not_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
  feeTo?: Maybe<Scalars['v2_Bytes']>
  feeTo_contains?: Maybe<Scalars['v2_Bytes']>
  feeTo_in?: Maybe<Array<Scalars['v2_Bytes']>>
  feeTo_not?: Maybe<Scalars['v2_Bytes']>
  feeTo_not_contains?: Maybe<Scalars['v2_Bytes']>
  feeTo_not_in?: Maybe<Array<Scalars['v2_Bytes']>>
  id?: Maybe<Scalars['ID']>
  id_gt?: Maybe<Scalars['ID']>
  id_gte?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  id_lt?: Maybe<Scalars['ID']>
  id_lte?: Maybe<Scalars['ID']>
  id_not?: Maybe<Scalars['ID']>
  id_not_in?: Maybe<Array<Scalars['ID']>>
  liquidity?: Maybe<Scalars['v2_BigDecimal']>
  liquidity_gt?: Maybe<Scalars['v2_BigDecimal']>
  liquidity_gte?: Maybe<Scalars['v2_BigDecimal']>
  liquidity_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
  liquidity_lt?: Maybe<Scalars['v2_BigDecimal']>
  liquidity_lte?: Maybe<Scalars['v2_BigDecimal']>
  liquidity_not?: Maybe<Scalars['v2_BigDecimal']>
  liquidity_not_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
  logIndex?: Maybe<Scalars['v2_BigInt']>
  logIndex_gt?: Maybe<Scalars['v2_BigInt']>
  logIndex_gte?: Maybe<Scalars['v2_BigInt']>
  logIndex_in?: Maybe<Array<Scalars['v2_BigInt']>>
  logIndex_lt?: Maybe<Scalars['v2_BigInt']>
  logIndex_lte?: Maybe<Scalars['v2_BigInt']>
  logIndex_not?: Maybe<Scalars['v2_BigInt']>
  logIndex_not_in?: Maybe<Array<Scalars['v2_BigInt']>>
  needsComplete?: Maybe<Scalars['Boolean']>
  needsComplete_in?: Maybe<Array<Scalars['Boolean']>>
  needsComplete_not?: Maybe<Scalars['Boolean']>
  needsComplete_not_in?: Maybe<Array<Scalars['Boolean']>>
  pair?: Maybe<Scalars['String']>
  pair_contains?: Maybe<Scalars['String']>
  pair_ends_with?: Maybe<Scalars['String']>
  pair_gt?: Maybe<Scalars['String']>
  pair_gte?: Maybe<Scalars['String']>
  pair_in?: Maybe<Array<Scalars['String']>>
  pair_lt?: Maybe<Scalars['String']>
  pair_lte?: Maybe<Scalars['String']>
  pair_not?: Maybe<Scalars['String']>
  pair_not_contains?: Maybe<Scalars['String']>
  pair_not_ends_with?: Maybe<Scalars['String']>
  pair_not_in?: Maybe<Array<Scalars['String']>>
  pair_not_starts_with?: Maybe<Scalars['String']>
  pair_starts_with?: Maybe<Scalars['String']>
  sender?: Maybe<Scalars['v2_Bytes']>
  sender_contains?: Maybe<Scalars['v2_Bytes']>
  sender_in?: Maybe<Array<Scalars['v2_Bytes']>>
  sender_not?: Maybe<Scalars['v2_Bytes']>
  sender_not_contains?: Maybe<Scalars['v2_Bytes']>
  sender_not_in?: Maybe<Array<Scalars['v2_Bytes']>>
  timestamp?: Maybe<Scalars['v2_BigInt']>
  timestamp_gt?: Maybe<Scalars['v2_BigInt']>
  timestamp_gte?: Maybe<Scalars['v2_BigInt']>
  timestamp_in?: Maybe<Array<Scalars['v2_BigInt']>>
  timestamp_lt?: Maybe<Scalars['v2_BigInt']>
  timestamp_lte?: Maybe<Scalars['v2_BigInt']>
  timestamp_not?: Maybe<Scalars['v2_BigInt']>
  timestamp_not_in?: Maybe<Array<Scalars['v2_BigInt']>>
  to?: Maybe<Scalars['v2_Bytes']>
  to_contains?: Maybe<Scalars['v2_Bytes']>
  to_in?: Maybe<Array<Scalars['v2_Bytes']>>
  to_not?: Maybe<Scalars['v2_Bytes']>
  to_not_contains?: Maybe<Scalars['v2_Bytes']>
  to_not_in?: Maybe<Array<Scalars['v2_Bytes']>>
  transaction?: Maybe<Scalars['String']>
  transaction_contains?: Maybe<Scalars['String']>
  transaction_ends_with?: Maybe<Scalars['String']>
  transaction_gt?: Maybe<Scalars['String']>
  transaction_gte?: Maybe<Scalars['String']>
  transaction_in?: Maybe<Array<Scalars['String']>>
  transaction_lt?: Maybe<Scalars['String']>
  transaction_lte?: Maybe<Scalars['String']>
  transaction_not?: Maybe<Scalars['String']>
  transaction_not_contains?: Maybe<Scalars['String']>
  transaction_not_ends_with?: Maybe<Scalars['String']>
  transaction_not_in?: Maybe<Array<Scalars['String']>>
  transaction_not_starts_with?: Maybe<Scalars['String']>
  transaction_starts_with?: Maybe<Scalars['String']>
}

export enum V2_Burn_OrderBy {
  Amount0 = 'amount0',
  Amount1 = 'amount1',
  AmountUsd = 'amountUSD',
  FeeLiquidity = 'feeLiquidity',
  FeeTo = 'feeTo',
  Id = 'id',
  Liquidity = 'liquidity',
  LogIndex = 'logIndex',
  NeedsComplete = 'needsComplete',
  Pair = 'pair',
  Sender = 'sender',
  Timestamp = 'timestamp',
  To = 'to',
  Transaction = 'transaction',
}

export type V2_LiquidityPosition = {
  __typename?: 'v2_LiquidityPosition'
  id: Scalars['ID']
  liquidityTokenBalance: Scalars['v2_BigDecimal']
  pair: V2_Pair
  user: V2_User
}

export type V2_LiquidityPositionSnapshot = {
  __typename?: 'v2_LiquidityPositionSnapshot'
  block: Scalars['Int']
  id: Scalars['ID']
  liquidityPosition: V2_LiquidityPosition
  liquidityTokenBalance: Scalars['v2_BigDecimal']
  liquidityTokenTotalSupply: Scalars['v2_BigDecimal']
  pair: V2_Pair
  reserve0: Scalars['v2_BigDecimal']
  reserve1: Scalars['v2_BigDecimal']
  reserveUSD: Scalars['v2_BigDecimal']
  timestamp: Scalars['Int']
  token0PriceUSD: Scalars['v2_BigDecimal']
  token1PriceUSD: Scalars['v2_BigDecimal']
  user: V2_User
}

export type V2_LiquidityPositionSnapshot_Filter = {
  block?: Maybe<Scalars['Int']>
  block_gt?: Maybe<Scalars['Int']>
  block_gte?: Maybe<Scalars['Int']>
  block_in?: Maybe<Array<Scalars['Int']>>
  block_lt?: Maybe<Scalars['Int']>
  block_lte?: Maybe<Scalars['Int']>
  block_not?: Maybe<Scalars['Int']>
  block_not_in?: Maybe<Array<Scalars['Int']>>
  id?: Maybe<Scalars['ID']>
  id_gt?: Maybe<Scalars['ID']>
  id_gte?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  id_lt?: Maybe<Scalars['ID']>
  id_lte?: Maybe<Scalars['ID']>
  id_not?: Maybe<Scalars['ID']>
  id_not_in?: Maybe<Array<Scalars['ID']>>
  liquidityPosition?: Maybe<Scalars['String']>
  liquidityPosition_contains?: Maybe<Scalars['String']>
  liquidityPosition_ends_with?: Maybe<Scalars['String']>
  liquidityPosition_gt?: Maybe<Scalars['String']>
  liquidityPosition_gte?: Maybe<Scalars['String']>
  liquidityPosition_in?: Maybe<Array<Scalars['String']>>
  liquidityPosition_lt?: Maybe<Scalars['String']>
  liquidityPosition_lte?: Maybe<Scalars['String']>
  liquidityPosition_not?: Maybe<Scalars['String']>
  liquidityPosition_not_contains?: Maybe<Scalars['String']>
  liquidityPosition_not_ends_with?: Maybe<Scalars['String']>
  liquidityPosition_not_in?: Maybe<Array<Scalars['String']>>
  liquidityPosition_not_starts_with?: Maybe<Scalars['String']>
  liquidityPosition_starts_with?: Maybe<Scalars['String']>
  liquidityTokenBalance?: Maybe<Scalars['v2_BigDecimal']>
  liquidityTokenBalance_gt?: Maybe<Scalars['v2_BigDecimal']>
  liquidityTokenBalance_gte?: Maybe<Scalars['v2_BigDecimal']>
  liquidityTokenBalance_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
  liquidityTokenBalance_lt?: Maybe<Scalars['v2_BigDecimal']>
  liquidityTokenBalance_lte?: Maybe<Scalars['v2_BigDecimal']>
  liquidityTokenBalance_not?: Maybe<Scalars['v2_BigDecimal']>
  liquidityTokenBalance_not_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
  liquidityTokenTotalSupply?: Maybe<Scalars['v2_BigDecimal']>
  liquidityTokenTotalSupply_gt?: Maybe<Scalars['v2_BigDecimal']>
  liquidityTokenTotalSupply_gte?: Maybe<Scalars['v2_BigDecimal']>
  liquidityTokenTotalSupply_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
  liquidityTokenTotalSupply_lt?: Maybe<Scalars['v2_BigDecimal']>
  liquidityTokenTotalSupply_lte?: Maybe<Scalars['v2_BigDecimal']>
  liquidityTokenTotalSupply_not?: Maybe<Scalars['v2_BigDecimal']>
  liquidityTokenTotalSupply_not_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
  pair?: Maybe<Scalars['String']>
  pair_contains?: Maybe<Scalars['String']>
  pair_ends_with?: Maybe<Scalars['String']>
  pair_gt?: Maybe<Scalars['String']>
  pair_gte?: Maybe<Scalars['String']>
  pair_in?: Maybe<Array<Scalars['String']>>
  pair_lt?: Maybe<Scalars['String']>
  pair_lte?: Maybe<Scalars['String']>
  pair_not?: Maybe<Scalars['String']>
  pair_not_contains?: Maybe<Scalars['String']>
  pair_not_ends_with?: Maybe<Scalars['String']>
  pair_not_in?: Maybe<Array<Scalars['String']>>
  pair_not_starts_with?: Maybe<Scalars['String']>
  pair_starts_with?: Maybe<Scalars['String']>
  reserve0?: Maybe<Scalars['v2_BigDecimal']>
  reserve0_gt?: Maybe<Scalars['v2_BigDecimal']>
  reserve0_gte?: Maybe<Scalars['v2_BigDecimal']>
  reserve0_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
  reserve0_lt?: Maybe<Scalars['v2_BigDecimal']>
  reserve0_lte?: Maybe<Scalars['v2_BigDecimal']>
  reserve0_not?: Maybe<Scalars['v2_BigDecimal']>
  reserve0_not_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
  reserve1?: Maybe<Scalars['v2_BigDecimal']>
  reserve1_gt?: Maybe<Scalars['v2_BigDecimal']>
  reserve1_gte?: Maybe<Scalars['v2_BigDecimal']>
  reserve1_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
  reserve1_lt?: Maybe<Scalars['v2_BigDecimal']>
  reserve1_lte?: Maybe<Scalars['v2_BigDecimal']>
  reserve1_not?: Maybe<Scalars['v2_BigDecimal']>
  reserve1_not_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
  reserveUSD?: Maybe<Scalars['v2_BigDecimal']>
  reserveUSD_gt?: Maybe<Scalars['v2_BigDecimal']>
  reserveUSD_gte?: Maybe<Scalars['v2_BigDecimal']>
  reserveUSD_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
  reserveUSD_lt?: Maybe<Scalars['v2_BigDecimal']>
  reserveUSD_lte?: Maybe<Scalars['v2_BigDecimal']>
  reserveUSD_not?: Maybe<Scalars['v2_BigDecimal']>
  reserveUSD_not_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
  timestamp?: Maybe<Scalars['Int']>
  timestamp_gt?: Maybe<Scalars['Int']>
  timestamp_gte?: Maybe<Scalars['Int']>
  timestamp_in?: Maybe<Array<Scalars['Int']>>
  timestamp_lt?: Maybe<Scalars['Int']>
  timestamp_lte?: Maybe<Scalars['Int']>
  timestamp_not?: Maybe<Scalars['Int']>
  timestamp_not_in?: Maybe<Array<Scalars['Int']>>
  token0PriceUSD?: Maybe<Scalars['v2_BigDecimal']>
  token0PriceUSD_gt?: Maybe<Scalars['v2_BigDecimal']>
  token0PriceUSD_gte?: Maybe<Scalars['v2_BigDecimal']>
  token0PriceUSD_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
  token0PriceUSD_lt?: Maybe<Scalars['v2_BigDecimal']>
  token0PriceUSD_lte?: Maybe<Scalars['v2_BigDecimal']>
  token0PriceUSD_not?: Maybe<Scalars['v2_BigDecimal']>
  token0PriceUSD_not_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
  token1PriceUSD?: Maybe<Scalars['v2_BigDecimal']>
  token1PriceUSD_gt?: Maybe<Scalars['v2_BigDecimal']>
  token1PriceUSD_gte?: Maybe<Scalars['v2_BigDecimal']>
  token1PriceUSD_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
  token1PriceUSD_lt?: Maybe<Scalars['v2_BigDecimal']>
  token1PriceUSD_lte?: Maybe<Scalars['v2_BigDecimal']>
  token1PriceUSD_not?: Maybe<Scalars['v2_BigDecimal']>
  token1PriceUSD_not_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
  user?: Maybe<Scalars['String']>
  user_contains?: Maybe<Scalars['String']>
  user_ends_with?: Maybe<Scalars['String']>
  user_gt?: Maybe<Scalars['String']>
  user_gte?: Maybe<Scalars['String']>
  user_in?: Maybe<Array<Scalars['String']>>
  user_lt?: Maybe<Scalars['String']>
  user_lte?: Maybe<Scalars['String']>
  user_not?: Maybe<Scalars['String']>
  user_not_contains?: Maybe<Scalars['String']>
  user_not_ends_with?: Maybe<Scalars['String']>
  user_not_in?: Maybe<Array<Scalars['String']>>
  user_not_starts_with?: Maybe<Scalars['String']>
  user_starts_with?: Maybe<Scalars['String']>
}

export enum V2_LiquidityPositionSnapshot_OrderBy {
  Block = 'block',
  Id = 'id',
  LiquidityPosition = 'liquidityPosition',
  LiquidityTokenBalance = 'liquidityTokenBalance',
  LiquidityTokenTotalSupply = 'liquidityTokenTotalSupply',
  Pair = 'pair',
  Reserve0 = 'reserve0',
  Reserve1 = 'reserve1',
  ReserveUsd = 'reserveUSD',
  Timestamp = 'timestamp',
  Token0PriceUsd = 'token0PriceUSD',
  Token1PriceUsd = 'token1PriceUSD',
  User = 'user',
}

export type V2_LiquidityPosition_Filter = {
  id?: Maybe<Scalars['ID']>
  id_gt?: Maybe<Scalars['ID']>
  id_gte?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  id_lt?: Maybe<Scalars['ID']>
  id_lte?: Maybe<Scalars['ID']>
  id_not?: Maybe<Scalars['ID']>
  id_not_in?: Maybe<Array<Scalars['ID']>>
  liquidityTokenBalance?: Maybe<Scalars['v2_BigDecimal']>
  liquidityTokenBalance_gt?: Maybe<Scalars['v2_BigDecimal']>
  liquidityTokenBalance_gte?: Maybe<Scalars['v2_BigDecimal']>
  liquidityTokenBalance_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
  liquidityTokenBalance_lt?: Maybe<Scalars['v2_BigDecimal']>
  liquidityTokenBalance_lte?: Maybe<Scalars['v2_BigDecimal']>
  liquidityTokenBalance_not?: Maybe<Scalars['v2_BigDecimal']>
  liquidityTokenBalance_not_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
  pair?: Maybe<Scalars['String']>
  pair_contains?: Maybe<Scalars['String']>
  pair_ends_with?: Maybe<Scalars['String']>
  pair_gt?: Maybe<Scalars['String']>
  pair_gte?: Maybe<Scalars['String']>
  pair_in?: Maybe<Array<Scalars['String']>>
  pair_lt?: Maybe<Scalars['String']>
  pair_lte?: Maybe<Scalars['String']>
  pair_not?: Maybe<Scalars['String']>
  pair_not_contains?: Maybe<Scalars['String']>
  pair_not_ends_with?: Maybe<Scalars['String']>
  pair_not_in?: Maybe<Array<Scalars['String']>>
  pair_not_starts_with?: Maybe<Scalars['String']>
  pair_starts_with?: Maybe<Scalars['String']>
  user?: Maybe<Scalars['String']>
  user_contains?: Maybe<Scalars['String']>
  user_ends_with?: Maybe<Scalars['String']>
  user_gt?: Maybe<Scalars['String']>
  user_gte?: Maybe<Scalars['String']>
  user_in?: Maybe<Array<Scalars['String']>>
  user_lt?: Maybe<Scalars['String']>
  user_lte?: Maybe<Scalars['String']>
  user_not?: Maybe<Scalars['String']>
  user_not_contains?: Maybe<Scalars['String']>
  user_not_ends_with?: Maybe<Scalars['String']>
  user_not_in?: Maybe<Array<Scalars['String']>>
  user_not_starts_with?: Maybe<Scalars['String']>
  user_starts_with?: Maybe<Scalars['String']>
}

export enum V2_LiquidityPosition_OrderBy {
  Id = 'id',
  LiquidityTokenBalance = 'liquidityTokenBalance',
  Pair = 'pair',
  User = 'user',
}

export type V2_Mint = {
  __typename?: 'v2_Mint'
  amount0?: Maybe<Scalars['v2_BigDecimal']>
  amount1?: Maybe<Scalars['v2_BigDecimal']>
  amountUSD?: Maybe<Scalars['v2_BigDecimal']>
  feeLiquidity?: Maybe<Scalars['v2_BigDecimal']>
  feeTo?: Maybe<Scalars['v2_Bytes']>
  id: Scalars['ID']
  liquidity: Scalars['v2_BigDecimal']
  logIndex?: Maybe<Scalars['v2_BigInt']>
  pair: V2_Pair
  sender?: Maybe<Scalars['v2_Bytes']>
  timestamp: Scalars['v2_BigInt']
  to: Scalars['v2_Bytes']
  transaction: V2_Transaction
}

export type V2_Mint_Filter = {
  amount0?: Maybe<Scalars['v2_BigDecimal']>
  amount0_gt?: Maybe<Scalars['v2_BigDecimal']>
  amount0_gte?: Maybe<Scalars['v2_BigDecimal']>
  amount0_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
  amount0_lt?: Maybe<Scalars['v2_BigDecimal']>
  amount0_lte?: Maybe<Scalars['v2_BigDecimal']>
  amount0_not?: Maybe<Scalars['v2_BigDecimal']>
  amount0_not_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
  amount1?: Maybe<Scalars['v2_BigDecimal']>
  amount1_gt?: Maybe<Scalars['v2_BigDecimal']>
  amount1_gte?: Maybe<Scalars['v2_BigDecimal']>
  amount1_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
  amount1_lt?: Maybe<Scalars['v2_BigDecimal']>
  amount1_lte?: Maybe<Scalars['v2_BigDecimal']>
  amount1_not?: Maybe<Scalars['v2_BigDecimal']>
  amount1_not_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
  amountUSD?: Maybe<Scalars['v2_BigDecimal']>
  amountUSD_gt?: Maybe<Scalars['v2_BigDecimal']>
  amountUSD_gte?: Maybe<Scalars['v2_BigDecimal']>
  amountUSD_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
  amountUSD_lt?: Maybe<Scalars['v2_BigDecimal']>
  amountUSD_lte?: Maybe<Scalars['v2_BigDecimal']>
  amountUSD_not?: Maybe<Scalars['v2_BigDecimal']>
  amountUSD_not_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
  feeLiquidity?: Maybe<Scalars['v2_BigDecimal']>
  feeLiquidity_gt?: Maybe<Scalars['v2_BigDecimal']>
  feeLiquidity_gte?: Maybe<Scalars['v2_BigDecimal']>
  feeLiquidity_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
  feeLiquidity_lt?: Maybe<Scalars['v2_BigDecimal']>
  feeLiquidity_lte?: Maybe<Scalars['v2_BigDecimal']>
  feeLiquidity_not?: Maybe<Scalars['v2_BigDecimal']>
  feeLiquidity_not_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
  feeTo?: Maybe<Scalars['v2_Bytes']>
  feeTo_contains?: Maybe<Scalars['v2_Bytes']>
  feeTo_in?: Maybe<Array<Scalars['v2_Bytes']>>
  feeTo_not?: Maybe<Scalars['v2_Bytes']>
  feeTo_not_contains?: Maybe<Scalars['v2_Bytes']>
  feeTo_not_in?: Maybe<Array<Scalars['v2_Bytes']>>
  id?: Maybe<Scalars['ID']>
  id_gt?: Maybe<Scalars['ID']>
  id_gte?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  id_lt?: Maybe<Scalars['ID']>
  id_lte?: Maybe<Scalars['ID']>
  id_not?: Maybe<Scalars['ID']>
  id_not_in?: Maybe<Array<Scalars['ID']>>
  liquidity?: Maybe<Scalars['v2_BigDecimal']>
  liquidity_gt?: Maybe<Scalars['v2_BigDecimal']>
  liquidity_gte?: Maybe<Scalars['v2_BigDecimal']>
  liquidity_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
  liquidity_lt?: Maybe<Scalars['v2_BigDecimal']>
  liquidity_lte?: Maybe<Scalars['v2_BigDecimal']>
  liquidity_not?: Maybe<Scalars['v2_BigDecimal']>
  liquidity_not_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
  logIndex?: Maybe<Scalars['v2_BigInt']>
  logIndex_gt?: Maybe<Scalars['v2_BigInt']>
  logIndex_gte?: Maybe<Scalars['v2_BigInt']>
  logIndex_in?: Maybe<Array<Scalars['v2_BigInt']>>
  logIndex_lt?: Maybe<Scalars['v2_BigInt']>
  logIndex_lte?: Maybe<Scalars['v2_BigInt']>
  logIndex_not?: Maybe<Scalars['v2_BigInt']>
  logIndex_not_in?: Maybe<Array<Scalars['v2_BigInt']>>
  pair?: Maybe<Scalars['String']>
  pair_contains?: Maybe<Scalars['String']>
  pair_ends_with?: Maybe<Scalars['String']>
  pair_gt?: Maybe<Scalars['String']>
  pair_gte?: Maybe<Scalars['String']>
  pair_in?: Maybe<Array<Scalars['String']>>
  pair_lt?: Maybe<Scalars['String']>
  pair_lte?: Maybe<Scalars['String']>
  pair_not?: Maybe<Scalars['String']>
  pair_not_contains?: Maybe<Scalars['String']>
  pair_not_ends_with?: Maybe<Scalars['String']>
  pair_not_in?: Maybe<Array<Scalars['String']>>
  pair_not_starts_with?: Maybe<Scalars['String']>
  pair_starts_with?: Maybe<Scalars['String']>
  sender?: Maybe<Scalars['v2_Bytes']>
  sender_contains?: Maybe<Scalars['v2_Bytes']>
  sender_in?: Maybe<Array<Scalars['v2_Bytes']>>
  sender_not?: Maybe<Scalars['v2_Bytes']>
  sender_not_contains?: Maybe<Scalars['v2_Bytes']>
  sender_not_in?: Maybe<Array<Scalars['v2_Bytes']>>
  timestamp?: Maybe<Scalars['v2_BigInt']>
  timestamp_gt?: Maybe<Scalars['v2_BigInt']>
  timestamp_gte?: Maybe<Scalars['v2_BigInt']>
  timestamp_in?: Maybe<Array<Scalars['v2_BigInt']>>
  timestamp_lt?: Maybe<Scalars['v2_BigInt']>
  timestamp_lte?: Maybe<Scalars['v2_BigInt']>
  timestamp_not?: Maybe<Scalars['v2_BigInt']>
  timestamp_not_in?: Maybe<Array<Scalars['v2_BigInt']>>
  to?: Maybe<Scalars['v2_Bytes']>
  to_contains?: Maybe<Scalars['v2_Bytes']>
  to_in?: Maybe<Array<Scalars['v2_Bytes']>>
  to_not?: Maybe<Scalars['v2_Bytes']>
  to_not_contains?: Maybe<Scalars['v2_Bytes']>
  to_not_in?: Maybe<Array<Scalars['v2_Bytes']>>
  transaction?: Maybe<Scalars['String']>
  transaction_contains?: Maybe<Scalars['String']>
  transaction_ends_with?: Maybe<Scalars['String']>
  transaction_gt?: Maybe<Scalars['String']>
  transaction_gte?: Maybe<Scalars['String']>
  transaction_in?: Maybe<Array<Scalars['String']>>
  transaction_lt?: Maybe<Scalars['String']>
  transaction_lte?: Maybe<Scalars['String']>
  transaction_not?: Maybe<Scalars['String']>
  transaction_not_contains?: Maybe<Scalars['String']>
  transaction_not_ends_with?: Maybe<Scalars['String']>
  transaction_not_in?: Maybe<Array<Scalars['String']>>
  transaction_not_starts_with?: Maybe<Scalars['String']>
  transaction_starts_with?: Maybe<Scalars['String']>
}

export enum V2_Mint_OrderBy {
  Amount0 = 'amount0',
  Amount1 = 'amount1',
  AmountUsd = 'amountUSD',
  FeeLiquidity = 'feeLiquidity',
  FeeTo = 'feeTo',
  Id = 'id',
  Liquidity = 'liquidity',
  LogIndex = 'logIndex',
  Pair = 'pair',
  Sender = 'sender',
  Timestamp = 'timestamp',
  To = 'to',
  Transaction = 'transaction',
}

export enum V2_OrderDirection {
  Asc = 'asc',
  Desc = 'desc',
}

export type V2_Pair = {
  __typename?: 'v2_Pair'
  createdAtBlockNumber: Scalars['v2_BigInt']
  createdAtTimestamp: Scalars['v2_BigInt']
  id: Scalars['ID']
  liquidityProviderCount: Scalars['v2_BigInt']
  reserve0: Scalars['v2_BigDecimal']
  reserve1: Scalars['v2_BigDecimal']
  reserveETH: Scalars['v2_BigDecimal']
  reserveUSD: Scalars['v2_BigDecimal']
  token0: V2_Token
  token0Price: Scalars['v2_BigDecimal']
  token1: V2_Token
  token1Price: Scalars['v2_BigDecimal']
  totalSupply: Scalars['v2_BigDecimal']
  trackedReserveETH: Scalars['v2_BigDecimal']
  txCount: Scalars['v2_BigInt']
  untrackedVolumeUSD: Scalars['v2_BigDecimal']
  volumeToken0: Scalars['v2_BigDecimal']
  volumeToken1: Scalars['v2_BigDecimal']
  volumeUSD: Scalars['v2_BigDecimal']
}

export type V2_PairDayData = {
  __typename?: 'v2_PairDayData'
  dailyTxns: Scalars['v2_BigInt']
  dailyVolumeToken0: Scalars['v2_BigDecimal']
  dailyVolumeToken1: Scalars['v2_BigDecimal']
  dailyVolumeUSD: Scalars['v2_BigDecimal']
  date: Scalars['Int']
  id: Scalars['ID']
  pairAddress: Scalars['v2_Bytes']
  reserve0: Scalars['v2_BigDecimal']
  reserve1: Scalars['v2_BigDecimal']
  reserveUSD: Scalars['v2_BigDecimal']
  token0: V2_Token
  token1: V2_Token
  totalSupply: Scalars['v2_BigDecimal']
}

export type V2_PairDayData_Filter = {
  dailyTxns?: Maybe<Scalars['v2_BigInt']>
  dailyTxns_gt?: Maybe<Scalars['v2_BigInt']>
  dailyTxns_gte?: Maybe<Scalars['v2_BigInt']>
  dailyTxns_in?: Maybe<Array<Scalars['v2_BigInt']>>
  dailyTxns_lt?: Maybe<Scalars['v2_BigInt']>
  dailyTxns_lte?: Maybe<Scalars['v2_BigInt']>
  dailyTxns_not?: Maybe<Scalars['v2_BigInt']>
  dailyTxns_not_in?: Maybe<Array<Scalars['v2_BigInt']>>
  dailyVolumeToken0?: Maybe<Scalars['v2_BigDecimal']>
  dailyVolumeToken0_gt?: Maybe<Scalars['v2_BigDecimal']>
  dailyVolumeToken0_gte?: Maybe<Scalars['v2_BigDecimal']>
  dailyVolumeToken0_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
  dailyVolumeToken0_lt?: Maybe<Scalars['v2_BigDecimal']>
  dailyVolumeToken0_lte?: Maybe<Scalars['v2_BigDecimal']>
  dailyVolumeToken0_not?: Maybe<Scalars['v2_BigDecimal']>
  dailyVolumeToken0_not_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
  dailyVolumeToken1?: Maybe<Scalars['v2_BigDecimal']>
  dailyVolumeToken1_gt?: Maybe<Scalars['v2_BigDecimal']>
  dailyVolumeToken1_gte?: Maybe<Scalars['v2_BigDecimal']>
  dailyVolumeToken1_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
  dailyVolumeToken1_lt?: Maybe<Scalars['v2_BigDecimal']>
  dailyVolumeToken1_lte?: Maybe<Scalars['v2_BigDecimal']>
  dailyVolumeToken1_not?: Maybe<Scalars['v2_BigDecimal']>
  dailyVolumeToken1_not_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
  dailyVolumeUSD?: Maybe<Scalars['v2_BigDecimal']>
  dailyVolumeUSD_gt?: Maybe<Scalars['v2_BigDecimal']>
  dailyVolumeUSD_gte?: Maybe<Scalars['v2_BigDecimal']>
  dailyVolumeUSD_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
  dailyVolumeUSD_lt?: Maybe<Scalars['v2_BigDecimal']>
  dailyVolumeUSD_lte?: Maybe<Scalars['v2_BigDecimal']>
  dailyVolumeUSD_not?: Maybe<Scalars['v2_BigDecimal']>
  dailyVolumeUSD_not_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
  date?: Maybe<Scalars['Int']>
  date_gt?: Maybe<Scalars['Int']>
  date_gte?: Maybe<Scalars['Int']>
  date_in?: Maybe<Array<Scalars['Int']>>
  date_lt?: Maybe<Scalars['Int']>
  date_lte?: Maybe<Scalars['Int']>
  date_not?: Maybe<Scalars['Int']>
  date_not_in?: Maybe<Array<Scalars['Int']>>
  id?: Maybe<Scalars['ID']>
  id_gt?: Maybe<Scalars['ID']>
  id_gte?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  id_lt?: Maybe<Scalars['ID']>
  id_lte?: Maybe<Scalars['ID']>
  id_not?: Maybe<Scalars['ID']>
  id_not_in?: Maybe<Array<Scalars['ID']>>
  pairAddress?: Maybe<Scalars['v2_Bytes']>
  pairAddress_contains?: Maybe<Scalars['v2_Bytes']>
  pairAddress_in?: Maybe<Array<Scalars['v2_Bytes']>>
  pairAddress_not?: Maybe<Scalars['v2_Bytes']>
  pairAddress_not_contains?: Maybe<Scalars['v2_Bytes']>
  pairAddress_not_in?: Maybe<Array<Scalars['v2_Bytes']>>
  reserve0?: Maybe<Scalars['v2_BigDecimal']>
  reserve0_gt?: Maybe<Scalars['v2_BigDecimal']>
  reserve0_gte?: Maybe<Scalars['v2_BigDecimal']>
  reserve0_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
  reserve0_lt?: Maybe<Scalars['v2_BigDecimal']>
  reserve0_lte?: Maybe<Scalars['v2_BigDecimal']>
  reserve0_not?: Maybe<Scalars['v2_BigDecimal']>
  reserve0_not_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
  reserve1?: Maybe<Scalars['v2_BigDecimal']>
  reserve1_gt?: Maybe<Scalars['v2_BigDecimal']>
  reserve1_gte?: Maybe<Scalars['v2_BigDecimal']>
  reserve1_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
  reserve1_lt?: Maybe<Scalars['v2_BigDecimal']>
  reserve1_lte?: Maybe<Scalars['v2_BigDecimal']>
  reserve1_not?: Maybe<Scalars['v2_BigDecimal']>
  reserve1_not_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
  reserveUSD?: Maybe<Scalars['v2_BigDecimal']>
  reserveUSD_gt?: Maybe<Scalars['v2_BigDecimal']>
  reserveUSD_gte?: Maybe<Scalars['v2_BigDecimal']>
  reserveUSD_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
  reserveUSD_lt?: Maybe<Scalars['v2_BigDecimal']>
  reserveUSD_lte?: Maybe<Scalars['v2_BigDecimal']>
  reserveUSD_not?: Maybe<Scalars['v2_BigDecimal']>
  reserveUSD_not_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
  token0?: Maybe<Scalars['String']>
  token0_contains?: Maybe<Scalars['String']>
  token0_ends_with?: Maybe<Scalars['String']>
  token0_gt?: Maybe<Scalars['String']>
  token0_gte?: Maybe<Scalars['String']>
  token0_in?: Maybe<Array<Scalars['String']>>
  token0_lt?: Maybe<Scalars['String']>
  token0_lte?: Maybe<Scalars['String']>
  token0_not?: Maybe<Scalars['String']>
  token0_not_contains?: Maybe<Scalars['String']>
  token0_not_ends_with?: Maybe<Scalars['String']>
  token0_not_in?: Maybe<Array<Scalars['String']>>
  token0_not_starts_with?: Maybe<Scalars['String']>
  token0_starts_with?: Maybe<Scalars['String']>
  token1?: Maybe<Scalars['String']>
  token1_contains?: Maybe<Scalars['String']>
  token1_ends_with?: Maybe<Scalars['String']>
  token1_gt?: Maybe<Scalars['String']>
  token1_gte?: Maybe<Scalars['String']>
  token1_in?: Maybe<Array<Scalars['String']>>
  token1_lt?: Maybe<Scalars['String']>
  token1_lte?: Maybe<Scalars['String']>
  token1_not?: Maybe<Scalars['String']>
  token1_not_contains?: Maybe<Scalars['String']>
  token1_not_ends_with?: Maybe<Scalars['String']>
  token1_not_in?: Maybe<Array<Scalars['String']>>
  token1_not_starts_with?: Maybe<Scalars['String']>
  token1_starts_with?: Maybe<Scalars['String']>
  totalSupply?: Maybe<Scalars['v2_BigDecimal']>
  totalSupply_gt?: Maybe<Scalars['v2_BigDecimal']>
  totalSupply_gte?: Maybe<Scalars['v2_BigDecimal']>
  totalSupply_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
  totalSupply_lt?: Maybe<Scalars['v2_BigDecimal']>
  totalSupply_lte?: Maybe<Scalars['v2_BigDecimal']>
  totalSupply_not?: Maybe<Scalars['v2_BigDecimal']>
  totalSupply_not_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
}

export enum V2_PairDayData_OrderBy {
  DailyTxns = 'dailyTxns',
  DailyVolumeToken0 = 'dailyVolumeToken0',
  DailyVolumeToken1 = 'dailyVolumeToken1',
  DailyVolumeUsd = 'dailyVolumeUSD',
  Date = 'date',
  Id = 'id',
  PairAddress = 'pairAddress',
  Reserve0 = 'reserve0',
  Reserve1 = 'reserve1',
  ReserveUsd = 'reserveUSD',
  Token0 = 'token0',
  Token1 = 'token1',
  TotalSupply = 'totalSupply',
}

export type V2_PairHourData = {
  __typename?: 'v2_PairHourData'
  hourStartUnix: Scalars['Int']
  hourlyTxns: Scalars['v2_BigInt']
  hourlyVolumeToken0: Scalars['v2_BigDecimal']
  hourlyVolumeToken1: Scalars['v2_BigDecimal']
  hourlyVolumeUSD: Scalars['v2_BigDecimal']
  id: Scalars['ID']
  pair: V2_Pair
  reserve0: Scalars['v2_BigDecimal']
  reserve1: Scalars['v2_BigDecimal']
  reserveUSD: Scalars['v2_BigDecimal']
}

export type V2_PairHourData_Filter = {
  hourStartUnix?: Maybe<Scalars['Int']>
  hourStartUnix_gt?: Maybe<Scalars['Int']>
  hourStartUnix_gte?: Maybe<Scalars['Int']>
  hourStartUnix_in?: Maybe<Array<Scalars['Int']>>
  hourStartUnix_lt?: Maybe<Scalars['Int']>
  hourStartUnix_lte?: Maybe<Scalars['Int']>
  hourStartUnix_not?: Maybe<Scalars['Int']>
  hourStartUnix_not_in?: Maybe<Array<Scalars['Int']>>
  hourlyTxns?: Maybe<Scalars['v2_BigInt']>
  hourlyTxns_gt?: Maybe<Scalars['v2_BigInt']>
  hourlyTxns_gte?: Maybe<Scalars['v2_BigInt']>
  hourlyTxns_in?: Maybe<Array<Scalars['v2_BigInt']>>
  hourlyTxns_lt?: Maybe<Scalars['v2_BigInt']>
  hourlyTxns_lte?: Maybe<Scalars['v2_BigInt']>
  hourlyTxns_not?: Maybe<Scalars['v2_BigInt']>
  hourlyTxns_not_in?: Maybe<Array<Scalars['v2_BigInt']>>
  hourlyVolumeToken0?: Maybe<Scalars['v2_BigDecimal']>
  hourlyVolumeToken0_gt?: Maybe<Scalars['v2_BigDecimal']>
  hourlyVolumeToken0_gte?: Maybe<Scalars['v2_BigDecimal']>
  hourlyVolumeToken0_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
  hourlyVolumeToken0_lt?: Maybe<Scalars['v2_BigDecimal']>
  hourlyVolumeToken0_lte?: Maybe<Scalars['v2_BigDecimal']>
  hourlyVolumeToken0_not?: Maybe<Scalars['v2_BigDecimal']>
  hourlyVolumeToken0_not_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
  hourlyVolumeToken1?: Maybe<Scalars['v2_BigDecimal']>
  hourlyVolumeToken1_gt?: Maybe<Scalars['v2_BigDecimal']>
  hourlyVolumeToken1_gte?: Maybe<Scalars['v2_BigDecimal']>
  hourlyVolumeToken1_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
  hourlyVolumeToken1_lt?: Maybe<Scalars['v2_BigDecimal']>
  hourlyVolumeToken1_lte?: Maybe<Scalars['v2_BigDecimal']>
  hourlyVolumeToken1_not?: Maybe<Scalars['v2_BigDecimal']>
  hourlyVolumeToken1_not_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
  hourlyVolumeUSD?: Maybe<Scalars['v2_BigDecimal']>
  hourlyVolumeUSD_gt?: Maybe<Scalars['v2_BigDecimal']>
  hourlyVolumeUSD_gte?: Maybe<Scalars['v2_BigDecimal']>
  hourlyVolumeUSD_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
  hourlyVolumeUSD_lt?: Maybe<Scalars['v2_BigDecimal']>
  hourlyVolumeUSD_lte?: Maybe<Scalars['v2_BigDecimal']>
  hourlyVolumeUSD_not?: Maybe<Scalars['v2_BigDecimal']>
  hourlyVolumeUSD_not_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
  id?: Maybe<Scalars['ID']>
  id_gt?: Maybe<Scalars['ID']>
  id_gte?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  id_lt?: Maybe<Scalars['ID']>
  id_lte?: Maybe<Scalars['ID']>
  id_not?: Maybe<Scalars['ID']>
  id_not_in?: Maybe<Array<Scalars['ID']>>
  pair?: Maybe<Scalars['String']>
  pair_contains?: Maybe<Scalars['String']>
  pair_ends_with?: Maybe<Scalars['String']>
  pair_gt?: Maybe<Scalars['String']>
  pair_gte?: Maybe<Scalars['String']>
  pair_in?: Maybe<Array<Scalars['String']>>
  pair_lt?: Maybe<Scalars['String']>
  pair_lte?: Maybe<Scalars['String']>
  pair_not?: Maybe<Scalars['String']>
  pair_not_contains?: Maybe<Scalars['String']>
  pair_not_ends_with?: Maybe<Scalars['String']>
  pair_not_in?: Maybe<Array<Scalars['String']>>
  pair_not_starts_with?: Maybe<Scalars['String']>
  pair_starts_with?: Maybe<Scalars['String']>
  reserve0?: Maybe<Scalars['v2_BigDecimal']>
  reserve0_gt?: Maybe<Scalars['v2_BigDecimal']>
  reserve0_gte?: Maybe<Scalars['v2_BigDecimal']>
  reserve0_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
  reserve0_lt?: Maybe<Scalars['v2_BigDecimal']>
  reserve0_lte?: Maybe<Scalars['v2_BigDecimal']>
  reserve0_not?: Maybe<Scalars['v2_BigDecimal']>
  reserve0_not_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
  reserve1?: Maybe<Scalars['v2_BigDecimal']>
  reserve1_gt?: Maybe<Scalars['v2_BigDecimal']>
  reserve1_gte?: Maybe<Scalars['v2_BigDecimal']>
  reserve1_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
  reserve1_lt?: Maybe<Scalars['v2_BigDecimal']>
  reserve1_lte?: Maybe<Scalars['v2_BigDecimal']>
  reserve1_not?: Maybe<Scalars['v2_BigDecimal']>
  reserve1_not_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
  reserveUSD?: Maybe<Scalars['v2_BigDecimal']>
  reserveUSD_gt?: Maybe<Scalars['v2_BigDecimal']>
  reserveUSD_gte?: Maybe<Scalars['v2_BigDecimal']>
  reserveUSD_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
  reserveUSD_lt?: Maybe<Scalars['v2_BigDecimal']>
  reserveUSD_lte?: Maybe<Scalars['v2_BigDecimal']>
  reserveUSD_not?: Maybe<Scalars['v2_BigDecimal']>
  reserveUSD_not_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
}

export enum V2_PairHourData_OrderBy {
  HourStartUnix = 'hourStartUnix',
  HourlyTxns = 'hourlyTxns',
  HourlyVolumeToken0 = 'hourlyVolumeToken0',
  HourlyVolumeToken1 = 'hourlyVolumeToken1',
  HourlyVolumeUsd = 'hourlyVolumeUSD',
  Id = 'id',
  Pair = 'pair',
  Reserve0 = 'reserve0',
  Reserve1 = 'reserve1',
  ReserveUsd = 'reserveUSD',
}

export type V2_Pair_Filter = {
  createdAtBlockNumber?: Maybe<Scalars['v2_BigInt']>
  createdAtBlockNumber_gt?: Maybe<Scalars['v2_BigInt']>
  createdAtBlockNumber_gte?: Maybe<Scalars['v2_BigInt']>
  createdAtBlockNumber_in?: Maybe<Array<Scalars['v2_BigInt']>>
  createdAtBlockNumber_lt?: Maybe<Scalars['v2_BigInt']>
  createdAtBlockNumber_lte?: Maybe<Scalars['v2_BigInt']>
  createdAtBlockNumber_not?: Maybe<Scalars['v2_BigInt']>
  createdAtBlockNumber_not_in?: Maybe<Array<Scalars['v2_BigInt']>>
  createdAtTimestamp?: Maybe<Scalars['v2_BigInt']>
  createdAtTimestamp_gt?: Maybe<Scalars['v2_BigInt']>
  createdAtTimestamp_gte?: Maybe<Scalars['v2_BigInt']>
  createdAtTimestamp_in?: Maybe<Array<Scalars['v2_BigInt']>>
  createdAtTimestamp_lt?: Maybe<Scalars['v2_BigInt']>
  createdAtTimestamp_lte?: Maybe<Scalars['v2_BigInt']>
  createdAtTimestamp_not?: Maybe<Scalars['v2_BigInt']>
  createdAtTimestamp_not_in?: Maybe<Array<Scalars['v2_BigInt']>>
  id?: Maybe<Scalars['ID']>
  id_gt?: Maybe<Scalars['ID']>
  id_gte?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  id_lt?: Maybe<Scalars['ID']>
  id_lte?: Maybe<Scalars['ID']>
  id_not?: Maybe<Scalars['ID']>
  id_not_in?: Maybe<Array<Scalars['ID']>>
  liquidityProviderCount?: Maybe<Scalars['v2_BigInt']>
  liquidityProviderCount_gt?: Maybe<Scalars['v2_BigInt']>
  liquidityProviderCount_gte?: Maybe<Scalars['v2_BigInt']>
  liquidityProviderCount_in?: Maybe<Array<Scalars['v2_BigInt']>>
  liquidityProviderCount_lt?: Maybe<Scalars['v2_BigInt']>
  liquidityProviderCount_lte?: Maybe<Scalars['v2_BigInt']>
  liquidityProviderCount_not?: Maybe<Scalars['v2_BigInt']>
  liquidityProviderCount_not_in?: Maybe<Array<Scalars['v2_BigInt']>>
  reserve0?: Maybe<Scalars['v2_BigDecimal']>
  reserve0_gt?: Maybe<Scalars['v2_BigDecimal']>
  reserve0_gte?: Maybe<Scalars['v2_BigDecimal']>
  reserve0_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
  reserve0_lt?: Maybe<Scalars['v2_BigDecimal']>
  reserve0_lte?: Maybe<Scalars['v2_BigDecimal']>
  reserve0_not?: Maybe<Scalars['v2_BigDecimal']>
  reserve0_not_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
  reserve1?: Maybe<Scalars['v2_BigDecimal']>
  reserve1_gt?: Maybe<Scalars['v2_BigDecimal']>
  reserve1_gte?: Maybe<Scalars['v2_BigDecimal']>
  reserve1_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
  reserve1_lt?: Maybe<Scalars['v2_BigDecimal']>
  reserve1_lte?: Maybe<Scalars['v2_BigDecimal']>
  reserve1_not?: Maybe<Scalars['v2_BigDecimal']>
  reserve1_not_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
  reserveETH?: Maybe<Scalars['v2_BigDecimal']>
  reserveETH_gt?: Maybe<Scalars['v2_BigDecimal']>
  reserveETH_gte?: Maybe<Scalars['v2_BigDecimal']>
  reserveETH_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
  reserveETH_lt?: Maybe<Scalars['v2_BigDecimal']>
  reserveETH_lte?: Maybe<Scalars['v2_BigDecimal']>
  reserveETH_not?: Maybe<Scalars['v2_BigDecimal']>
  reserveETH_not_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
  reserveUSD?: Maybe<Scalars['v2_BigDecimal']>
  reserveUSD_gt?: Maybe<Scalars['v2_BigDecimal']>
  reserveUSD_gte?: Maybe<Scalars['v2_BigDecimal']>
  reserveUSD_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
  reserveUSD_lt?: Maybe<Scalars['v2_BigDecimal']>
  reserveUSD_lte?: Maybe<Scalars['v2_BigDecimal']>
  reserveUSD_not?: Maybe<Scalars['v2_BigDecimal']>
  reserveUSD_not_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
  token0?: Maybe<Scalars['String']>
  token0Price?: Maybe<Scalars['v2_BigDecimal']>
  token0Price_gt?: Maybe<Scalars['v2_BigDecimal']>
  token0Price_gte?: Maybe<Scalars['v2_BigDecimal']>
  token0Price_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
  token0Price_lt?: Maybe<Scalars['v2_BigDecimal']>
  token0Price_lte?: Maybe<Scalars['v2_BigDecimal']>
  token0Price_not?: Maybe<Scalars['v2_BigDecimal']>
  token0Price_not_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
  token0_contains?: Maybe<Scalars['String']>
  token0_ends_with?: Maybe<Scalars['String']>
  token0_gt?: Maybe<Scalars['String']>
  token0_gte?: Maybe<Scalars['String']>
  token0_in?: Maybe<Array<Scalars['String']>>
  token0_lt?: Maybe<Scalars['String']>
  token0_lte?: Maybe<Scalars['String']>
  token0_not?: Maybe<Scalars['String']>
  token0_not_contains?: Maybe<Scalars['String']>
  token0_not_ends_with?: Maybe<Scalars['String']>
  token0_not_in?: Maybe<Array<Scalars['String']>>
  token0_not_starts_with?: Maybe<Scalars['String']>
  token0_starts_with?: Maybe<Scalars['String']>
  token1?: Maybe<Scalars['String']>
  token1Price?: Maybe<Scalars['v2_BigDecimal']>
  token1Price_gt?: Maybe<Scalars['v2_BigDecimal']>
  token1Price_gte?: Maybe<Scalars['v2_BigDecimal']>
  token1Price_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
  token1Price_lt?: Maybe<Scalars['v2_BigDecimal']>
  token1Price_lte?: Maybe<Scalars['v2_BigDecimal']>
  token1Price_not?: Maybe<Scalars['v2_BigDecimal']>
  token1Price_not_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
  token1_contains?: Maybe<Scalars['String']>
  token1_ends_with?: Maybe<Scalars['String']>
  token1_gt?: Maybe<Scalars['String']>
  token1_gte?: Maybe<Scalars['String']>
  token1_in?: Maybe<Array<Scalars['String']>>
  token1_lt?: Maybe<Scalars['String']>
  token1_lte?: Maybe<Scalars['String']>
  token1_not?: Maybe<Scalars['String']>
  token1_not_contains?: Maybe<Scalars['String']>
  token1_not_ends_with?: Maybe<Scalars['String']>
  token1_not_in?: Maybe<Array<Scalars['String']>>
  token1_not_starts_with?: Maybe<Scalars['String']>
  token1_starts_with?: Maybe<Scalars['String']>
  totalSupply?: Maybe<Scalars['v2_BigDecimal']>
  totalSupply_gt?: Maybe<Scalars['v2_BigDecimal']>
  totalSupply_gte?: Maybe<Scalars['v2_BigDecimal']>
  totalSupply_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
  totalSupply_lt?: Maybe<Scalars['v2_BigDecimal']>
  totalSupply_lte?: Maybe<Scalars['v2_BigDecimal']>
  totalSupply_not?: Maybe<Scalars['v2_BigDecimal']>
  totalSupply_not_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
  trackedReserveETH?: Maybe<Scalars['v2_BigDecimal']>
  trackedReserveETH_gt?: Maybe<Scalars['v2_BigDecimal']>
  trackedReserveETH_gte?: Maybe<Scalars['v2_BigDecimal']>
  trackedReserveETH_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
  trackedReserveETH_lt?: Maybe<Scalars['v2_BigDecimal']>
  trackedReserveETH_lte?: Maybe<Scalars['v2_BigDecimal']>
  trackedReserveETH_not?: Maybe<Scalars['v2_BigDecimal']>
  trackedReserveETH_not_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
  txCount?: Maybe<Scalars['v2_BigInt']>
  txCount_gt?: Maybe<Scalars['v2_BigInt']>
  txCount_gte?: Maybe<Scalars['v2_BigInt']>
  txCount_in?: Maybe<Array<Scalars['v2_BigInt']>>
  txCount_lt?: Maybe<Scalars['v2_BigInt']>
  txCount_lte?: Maybe<Scalars['v2_BigInt']>
  txCount_not?: Maybe<Scalars['v2_BigInt']>
  txCount_not_in?: Maybe<Array<Scalars['v2_BigInt']>>
  untrackedVolumeUSD?: Maybe<Scalars['v2_BigDecimal']>
  untrackedVolumeUSD_gt?: Maybe<Scalars['v2_BigDecimal']>
  untrackedVolumeUSD_gte?: Maybe<Scalars['v2_BigDecimal']>
  untrackedVolumeUSD_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
  untrackedVolumeUSD_lt?: Maybe<Scalars['v2_BigDecimal']>
  untrackedVolumeUSD_lte?: Maybe<Scalars['v2_BigDecimal']>
  untrackedVolumeUSD_not?: Maybe<Scalars['v2_BigDecimal']>
  untrackedVolumeUSD_not_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
  volumeToken0?: Maybe<Scalars['v2_BigDecimal']>
  volumeToken0_gt?: Maybe<Scalars['v2_BigDecimal']>
  volumeToken0_gte?: Maybe<Scalars['v2_BigDecimal']>
  volumeToken0_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
  volumeToken0_lt?: Maybe<Scalars['v2_BigDecimal']>
  volumeToken0_lte?: Maybe<Scalars['v2_BigDecimal']>
  volumeToken0_not?: Maybe<Scalars['v2_BigDecimal']>
  volumeToken0_not_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
  volumeToken1?: Maybe<Scalars['v2_BigDecimal']>
  volumeToken1_gt?: Maybe<Scalars['v2_BigDecimal']>
  volumeToken1_gte?: Maybe<Scalars['v2_BigDecimal']>
  volumeToken1_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
  volumeToken1_lt?: Maybe<Scalars['v2_BigDecimal']>
  volumeToken1_lte?: Maybe<Scalars['v2_BigDecimal']>
  volumeToken1_not?: Maybe<Scalars['v2_BigDecimal']>
  volumeToken1_not_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
  volumeUSD?: Maybe<Scalars['v2_BigDecimal']>
  volumeUSD_gt?: Maybe<Scalars['v2_BigDecimal']>
  volumeUSD_gte?: Maybe<Scalars['v2_BigDecimal']>
  volumeUSD_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
  volumeUSD_lt?: Maybe<Scalars['v2_BigDecimal']>
  volumeUSD_lte?: Maybe<Scalars['v2_BigDecimal']>
  volumeUSD_not?: Maybe<Scalars['v2_BigDecimal']>
  volumeUSD_not_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
}

export enum V2_Pair_OrderBy {
  CreatedAtBlockNumber = 'createdAtBlockNumber',
  CreatedAtTimestamp = 'createdAtTimestamp',
  Id = 'id',
  LiquidityProviderCount = 'liquidityProviderCount',
  Reserve0 = 'reserve0',
  Reserve1 = 'reserve1',
  ReserveEth = 'reserveETH',
  ReserveUsd = 'reserveUSD',
  Token0 = 'token0',
  Token0Price = 'token0Price',
  Token1 = 'token1',
  Token1Price = 'token1Price',
  TotalSupply = 'totalSupply',
  TrackedReserveEth = 'trackedReserveETH',
  TxCount = 'txCount',
  UntrackedVolumeUsd = 'untrackedVolumeUSD',
  VolumeToken0 = 'volumeToken0',
  VolumeToken1 = 'volumeToken1',
  VolumeUsd = 'volumeUSD',
}

export type V2_Swap = {
  __typename?: 'v2_Swap'
  amount0In: Scalars['v2_BigDecimal']
  amount0Out: Scalars['v2_BigDecimal']
  amount1In: Scalars['v2_BigDecimal']
  amount1Out: Scalars['v2_BigDecimal']
  amountUSD: Scalars['v2_BigDecimal']
  id: Scalars['ID']
  logIndex?: Maybe<Scalars['v2_BigInt']>
  pair: V2_Pair
  sender: Scalars['v2_Bytes']
  timestamp: Scalars['v2_BigInt']
  to: Scalars['v2_Bytes']
  transaction: V2_Transaction
}

export type V2_Swap_Filter = {
  amount0In?: Maybe<Scalars['v2_BigDecimal']>
  amount0In_gt?: Maybe<Scalars['v2_BigDecimal']>
  amount0In_gte?: Maybe<Scalars['v2_BigDecimal']>
  amount0In_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
  amount0In_lt?: Maybe<Scalars['v2_BigDecimal']>
  amount0In_lte?: Maybe<Scalars['v2_BigDecimal']>
  amount0In_not?: Maybe<Scalars['v2_BigDecimal']>
  amount0In_not_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
  amount0Out?: Maybe<Scalars['v2_BigDecimal']>
  amount0Out_gt?: Maybe<Scalars['v2_BigDecimal']>
  amount0Out_gte?: Maybe<Scalars['v2_BigDecimal']>
  amount0Out_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
  amount0Out_lt?: Maybe<Scalars['v2_BigDecimal']>
  amount0Out_lte?: Maybe<Scalars['v2_BigDecimal']>
  amount0Out_not?: Maybe<Scalars['v2_BigDecimal']>
  amount0Out_not_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
  amount1In?: Maybe<Scalars['v2_BigDecimal']>
  amount1In_gt?: Maybe<Scalars['v2_BigDecimal']>
  amount1In_gte?: Maybe<Scalars['v2_BigDecimal']>
  amount1In_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
  amount1In_lt?: Maybe<Scalars['v2_BigDecimal']>
  amount1In_lte?: Maybe<Scalars['v2_BigDecimal']>
  amount1In_not?: Maybe<Scalars['v2_BigDecimal']>
  amount1In_not_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
  amount1Out?: Maybe<Scalars['v2_BigDecimal']>
  amount1Out_gt?: Maybe<Scalars['v2_BigDecimal']>
  amount1Out_gte?: Maybe<Scalars['v2_BigDecimal']>
  amount1Out_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
  amount1Out_lt?: Maybe<Scalars['v2_BigDecimal']>
  amount1Out_lte?: Maybe<Scalars['v2_BigDecimal']>
  amount1Out_not?: Maybe<Scalars['v2_BigDecimal']>
  amount1Out_not_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
  amountUSD?: Maybe<Scalars['v2_BigDecimal']>
  amountUSD_gt?: Maybe<Scalars['v2_BigDecimal']>
  amountUSD_gte?: Maybe<Scalars['v2_BigDecimal']>
  amountUSD_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
  amountUSD_lt?: Maybe<Scalars['v2_BigDecimal']>
  amountUSD_lte?: Maybe<Scalars['v2_BigDecimal']>
  amountUSD_not?: Maybe<Scalars['v2_BigDecimal']>
  amountUSD_not_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
  id?: Maybe<Scalars['ID']>
  id_gt?: Maybe<Scalars['ID']>
  id_gte?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  id_lt?: Maybe<Scalars['ID']>
  id_lte?: Maybe<Scalars['ID']>
  id_not?: Maybe<Scalars['ID']>
  id_not_in?: Maybe<Array<Scalars['ID']>>
  logIndex?: Maybe<Scalars['v2_BigInt']>
  logIndex_gt?: Maybe<Scalars['v2_BigInt']>
  logIndex_gte?: Maybe<Scalars['v2_BigInt']>
  logIndex_in?: Maybe<Array<Scalars['v2_BigInt']>>
  logIndex_lt?: Maybe<Scalars['v2_BigInt']>
  logIndex_lte?: Maybe<Scalars['v2_BigInt']>
  logIndex_not?: Maybe<Scalars['v2_BigInt']>
  logIndex_not_in?: Maybe<Array<Scalars['v2_BigInt']>>
  pair?: Maybe<Scalars['String']>
  pair_contains?: Maybe<Scalars['String']>
  pair_ends_with?: Maybe<Scalars['String']>
  pair_gt?: Maybe<Scalars['String']>
  pair_gte?: Maybe<Scalars['String']>
  pair_in?: Maybe<Array<Scalars['String']>>
  pair_lt?: Maybe<Scalars['String']>
  pair_lte?: Maybe<Scalars['String']>
  pair_not?: Maybe<Scalars['String']>
  pair_not_contains?: Maybe<Scalars['String']>
  pair_not_ends_with?: Maybe<Scalars['String']>
  pair_not_in?: Maybe<Array<Scalars['String']>>
  pair_not_starts_with?: Maybe<Scalars['String']>
  pair_starts_with?: Maybe<Scalars['String']>
  sender?: Maybe<Scalars['v2_Bytes']>
  sender_contains?: Maybe<Scalars['v2_Bytes']>
  sender_in?: Maybe<Array<Scalars['v2_Bytes']>>
  sender_not?: Maybe<Scalars['v2_Bytes']>
  sender_not_contains?: Maybe<Scalars['v2_Bytes']>
  sender_not_in?: Maybe<Array<Scalars['v2_Bytes']>>
  timestamp?: Maybe<Scalars['v2_BigInt']>
  timestamp_gt?: Maybe<Scalars['v2_BigInt']>
  timestamp_gte?: Maybe<Scalars['v2_BigInt']>
  timestamp_in?: Maybe<Array<Scalars['v2_BigInt']>>
  timestamp_lt?: Maybe<Scalars['v2_BigInt']>
  timestamp_lte?: Maybe<Scalars['v2_BigInt']>
  timestamp_not?: Maybe<Scalars['v2_BigInt']>
  timestamp_not_in?: Maybe<Array<Scalars['v2_BigInt']>>
  to?: Maybe<Scalars['v2_Bytes']>
  to_contains?: Maybe<Scalars['v2_Bytes']>
  to_in?: Maybe<Array<Scalars['v2_Bytes']>>
  to_not?: Maybe<Scalars['v2_Bytes']>
  to_not_contains?: Maybe<Scalars['v2_Bytes']>
  to_not_in?: Maybe<Array<Scalars['v2_Bytes']>>
  transaction?: Maybe<Scalars['String']>
  transaction_contains?: Maybe<Scalars['String']>
  transaction_ends_with?: Maybe<Scalars['String']>
  transaction_gt?: Maybe<Scalars['String']>
  transaction_gte?: Maybe<Scalars['String']>
  transaction_in?: Maybe<Array<Scalars['String']>>
  transaction_lt?: Maybe<Scalars['String']>
  transaction_lte?: Maybe<Scalars['String']>
  transaction_not?: Maybe<Scalars['String']>
  transaction_not_contains?: Maybe<Scalars['String']>
  transaction_not_ends_with?: Maybe<Scalars['String']>
  transaction_not_in?: Maybe<Array<Scalars['String']>>
  transaction_not_starts_with?: Maybe<Scalars['String']>
  transaction_starts_with?: Maybe<Scalars['String']>
}

export enum V2_Swap_OrderBy {
  Amount0In = 'amount0In',
  Amount0Out = 'amount0Out',
  Amount1In = 'amount1In',
  Amount1Out = 'amount1Out',
  AmountUsd = 'amountUSD',
  Id = 'id',
  LogIndex = 'logIndex',
  Pair = 'pair',
  Sender = 'sender',
  Timestamp = 'timestamp',
  To = 'to',
  Transaction = 'transaction',
}

export type V2_Token = {
  __typename?: 'v2_Token'
  decimals: Scalars['v2_BigInt']
  derivedETH?: Maybe<Scalars['v2_BigDecimal']>
  id: Scalars['ID']
  mostLiquidPairs: Array<Maybe<V2_PairDayData>>
  name: Scalars['String']
  symbol: Scalars['String']
  totalLiquidity: Scalars['v2_BigDecimal']
  totalSupply: Scalars['v2_BigInt']
  tradeVolume: Scalars['v2_BigDecimal']
  tradeVolumeUSD: Scalars['v2_BigDecimal']
  txCount: Scalars['v2_BigInt']
  untrackedVolumeUSD: Scalars['v2_BigDecimal']
}

export type V2_TokenMostLiquidPairsArgs = {
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V2_PairDayData_OrderBy>
  orderDirection?: Maybe<V2_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  where?: Maybe<V2_PairDayData_Filter>
}

export type V2_TokenDayData = {
  __typename?: 'v2_TokenDayData'
  dailyTxns: Scalars['v2_BigInt']
  dailyVolumeETH: Scalars['v2_BigDecimal']
  dailyVolumeToken: Scalars['v2_BigDecimal']
  dailyVolumeUSD: Scalars['v2_BigDecimal']
  date: Scalars['Int']
  id: Scalars['ID']
  maxStored: Scalars['Int']
  mostLiquidPairs: Array<V2_PairDayData>
  priceUSD: Scalars['v2_BigDecimal']
  token: V2_Token
  totalLiquidityETH: Scalars['v2_BigDecimal']
  totalLiquidityToken: Scalars['v2_BigDecimal']
  totalLiquidityUSD: Scalars['v2_BigDecimal']
}

export type V2_TokenDayDataMostLiquidPairsArgs = {
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V2_PairDayData_OrderBy>
  orderDirection?: Maybe<V2_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  where?: Maybe<V2_PairDayData_Filter>
}

export type V2_TokenDayData_Filter = {
  dailyTxns?: Maybe<Scalars['v2_BigInt']>
  dailyTxns_gt?: Maybe<Scalars['v2_BigInt']>
  dailyTxns_gte?: Maybe<Scalars['v2_BigInt']>
  dailyTxns_in?: Maybe<Array<Scalars['v2_BigInt']>>
  dailyTxns_lt?: Maybe<Scalars['v2_BigInt']>
  dailyTxns_lte?: Maybe<Scalars['v2_BigInt']>
  dailyTxns_not?: Maybe<Scalars['v2_BigInt']>
  dailyTxns_not_in?: Maybe<Array<Scalars['v2_BigInt']>>
  dailyVolumeETH?: Maybe<Scalars['v2_BigDecimal']>
  dailyVolumeETH_gt?: Maybe<Scalars['v2_BigDecimal']>
  dailyVolumeETH_gte?: Maybe<Scalars['v2_BigDecimal']>
  dailyVolumeETH_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
  dailyVolumeETH_lt?: Maybe<Scalars['v2_BigDecimal']>
  dailyVolumeETH_lte?: Maybe<Scalars['v2_BigDecimal']>
  dailyVolumeETH_not?: Maybe<Scalars['v2_BigDecimal']>
  dailyVolumeETH_not_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
  dailyVolumeToken?: Maybe<Scalars['v2_BigDecimal']>
  dailyVolumeToken_gt?: Maybe<Scalars['v2_BigDecimal']>
  dailyVolumeToken_gte?: Maybe<Scalars['v2_BigDecimal']>
  dailyVolumeToken_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
  dailyVolumeToken_lt?: Maybe<Scalars['v2_BigDecimal']>
  dailyVolumeToken_lte?: Maybe<Scalars['v2_BigDecimal']>
  dailyVolumeToken_not?: Maybe<Scalars['v2_BigDecimal']>
  dailyVolumeToken_not_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
  dailyVolumeUSD?: Maybe<Scalars['v2_BigDecimal']>
  dailyVolumeUSD_gt?: Maybe<Scalars['v2_BigDecimal']>
  dailyVolumeUSD_gte?: Maybe<Scalars['v2_BigDecimal']>
  dailyVolumeUSD_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
  dailyVolumeUSD_lt?: Maybe<Scalars['v2_BigDecimal']>
  dailyVolumeUSD_lte?: Maybe<Scalars['v2_BigDecimal']>
  dailyVolumeUSD_not?: Maybe<Scalars['v2_BigDecimal']>
  dailyVolumeUSD_not_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
  date?: Maybe<Scalars['Int']>
  date_gt?: Maybe<Scalars['Int']>
  date_gte?: Maybe<Scalars['Int']>
  date_in?: Maybe<Array<Scalars['Int']>>
  date_lt?: Maybe<Scalars['Int']>
  date_lte?: Maybe<Scalars['Int']>
  date_not?: Maybe<Scalars['Int']>
  date_not_in?: Maybe<Array<Scalars['Int']>>
  id?: Maybe<Scalars['ID']>
  id_gt?: Maybe<Scalars['ID']>
  id_gte?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  id_lt?: Maybe<Scalars['ID']>
  id_lte?: Maybe<Scalars['ID']>
  id_not?: Maybe<Scalars['ID']>
  id_not_in?: Maybe<Array<Scalars['ID']>>
  maxStored?: Maybe<Scalars['Int']>
  maxStored_gt?: Maybe<Scalars['Int']>
  maxStored_gte?: Maybe<Scalars['Int']>
  maxStored_in?: Maybe<Array<Scalars['Int']>>
  maxStored_lt?: Maybe<Scalars['Int']>
  maxStored_lte?: Maybe<Scalars['Int']>
  maxStored_not?: Maybe<Scalars['Int']>
  maxStored_not_in?: Maybe<Array<Scalars['Int']>>
  mostLiquidPairs?: Maybe<Array<Scalars['String']>>
  mostLiquidPairs_contains?: Maybe<Array<Scalars['String']>>
  mostLiquidPairs_not?: Maybe<Array<Scalars['String']>>
  mostLiquidPairs_not_contains?: Maybe<Array<Scalars['String']>>
  priceUSD?: Maybe<Scalars['v2_BigDecimal']>
  priceUSD_gt?: Maybe<Scalars['v2_BigDecimal']>
  priceUSD_gte?: Maybe<Scalars['v2_BigDecimal']>
  priceUSD_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
  priceUSD_lt?: Maybe<Scalars['v2_BigDecimal']>
  priceUSD_lte?: Maybe<Scalars['v2_BigDecimal']>
  priceUSD_not?: Maybe<Scalars['v2_BigDecimal']>
  priceUSD_not_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
  token?: Maybe<Scalars['String']>
  token_contains?: Maybe<Scalars['String']>
  token_ends_with?: Maybe<Scalars['String']>
  token_gt?: Maybe<Scalars['String']>
  token_gte?: Maybe<Scalars['String']>
  token_in?: Maybe<Array<Scalars['String']>>
  token_lt?: Maybe<Scalars['String']>
  token_lte?: Maybe<Scalars['String']>
  token_not?: Maybe<Scalars['String']>
  token_not_contains?: Maybe<Scalars['String']>
  token_not_ends_with?: Maybe<Scalars['String']>
  token_not_in?: Maybe<Array<Scalars['String']>>
  token_not_starts_with?: Maybe<Scalars['String']>
  token_starts_with?: Maybe<Scalars['String']>
  totalLiquidityETH?: Maybe<Scalars['v2_BigDecimal']>
  totalLiquidityETH_gt?: Maybe<Scalars['v2_BigDecimal']>
  totalLiquidityETH_gte?: Maybe<Scalars['v2_BigDecimal']>
  totalLiquidityETH_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
  totalLiquidityETH_lt?: Maybe<Scalars['v2_BigDecimal']>
  totalLiquidityETH_lte?: Maybe<Scalars['v2_BigDecimal']>
  totalLiquidityETH_not?: Maybe<Scalars['v2_BigDecimal']>
  totalLiquidityETH_not_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
  totalLiquidityToken?: Maybe<Scalars['v2_BigDecimal']>
  totalLiquidityToken_gt?: Maybe<Scalars['v2_BigDecimal']>
  totalLiquidityToken_gte?: Maybe<Scalars['v2_BigDecimal']>
  totalLiquidityToken_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
  totalLiquidityToken_lt?: Maybe<Scalars['v2_BigDecimal']>
  totalLiquidityToken_lte?: Maybe<Scalars['v2_BigDecimal']>
  totalLiquidityToken_not?: Maybe<Scalars['v2_BigDecimal']>
  totalLiquidityToken_not_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
  totalLiquidityUSD?: Maybe<Scalars['v2_BigDecimal']>
  totalLiquidityUSD_gt?: Maybe<Scalars['v2_BigDecimal']>
  totalLiquidityUSD_gte?: Maybe<Scalars['v2_BigDecimal']>
  totalLiquidityUSD_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
  totalLiquidityUSD_lt?: Maybe<Scalars['v2_BigDecimal']>
  totalLiquidityUSD_lte?: Maybe<Scalars['v2_BigDecimal']>
  totalLiquidityUSD_not?: Maybe<Scalars['v2_BigDecimal']>
  totalLiquidityUSD_not_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
}

export enum V2_TokenDayData_OrderBy {
  DailyTxns = 'dailyTxns',
  DailyVolumeEth = 'dailyVolumeETH',
  DailyVolumeToken = 'dailyVolumeToken',
  DailyVolumeUsd = 'dailyVolumeUSD',
  Date = 'date',
  Id = 'id',
  MaxStored = 'maxStored',
  MostLiquidPairs = 'mostLiquidPairs',
  PriceUsd = 'priceUSD',
  Token = 'token',
  TotalLiquidityEth = 'totalLiquidityETH',
  TotalLiquidityToken = 'totalLiquidityToken',
  TotalLiquidityUsd = 'totalLiquidityUSD',
}

export type V2_Token_Filter = {
  decimals?: Maybe<Scalars['v2_BigInt']>
  decimals_gt?: Maybe<Scalars['v2_BigInt']>
  decimals_gte?: Maybe<Scalars['v2_BigInt']>
  decimals_in?: Maybe<Array<Scalars['v2_BigInt']>>
  decimals_lt?: Maybe<Scalars['v2_BigInt']>
  decimals_lte?: Maybe<Scalars['v2_BigInt']>
  decimals_not?: Maybe<Scalars['v2_BigInt']>
  decimals_not_in?: Maybe<Array<Scalars['v2_BigInt']>>
  derivedETH?: Maybe<Scalars['v2_BigDecimal']>
  derivedETH_gt?: Maybe<Scalars['v2_BigDecimal']>
  derivedETH_gte?: Maybe<Scalars['v2_BigDecimal']>
  derivedETH_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
  derivedETH_lt?: Maybe<Scalars['v2_BigDecimal']>
  derivedETH_lte?: Maybe<Scalars['v2_BigDecimal']>
  derivedETH_not?: Maybe<Scalars['v2_BigDecimal']>
  derivedETH_not_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
  id?: Maybe<Scalars['ID']>
  id_gt?: Maybe<Scalars['ID']>
  id_gte?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  id_lt?: Maybe<Scalars['ID']>
  id_lte?: Maybe<Scalars['ID']>
  id_not?: Maybe<Scalars['ID']>
  id_not_in?: Maybe<Array<Scalars['ID']>>
  mostLiquidPairs?: Maybe<Array<Scalars['String']>>
  mostLiquidPairs_contains?: Maybe<Array<Scalars['String']>>
  mostLiquidPairs_not?: Maybe<Array<Scalars['String']>>
  mostLiquidPairs_not_contains?: Maybe<Array<Scalars['String']>>
  name?: Maybe<Scalars['String']>
  name_contains?: Maybe<Scalars['String']>
  name_ends_with?: Maybe<Scalars['String']>
  name_gt?: Maybe<Scalars['String']>
  name_gte?: Maybe<Scalars['String']>
  name_in?: Maybe<Array<Scalars['String']>>
  name_lt?: Maybe<Scalars['String']>
  name_lte?: Maybe<Scalars['String']>
  name_not?: Maybe<Scalars['String']>
  name_not_contains?: Maybe<Scalars['String']>
  name_not_ends_with?: Maybe<Scalars['String']>
  name_not_in?: Maybe<Array<Scalars['String']>>
  name_not_starts_with?: Maybe<Scalars['String']>
  name_starts_with?: Maybe<Scalars['String']>
  symbol?: Maybe<Scalars['String']>
  symbol_contains?: Maybe<Scalars['String']>
  symbol_ends_with?: Maybe<Scalars['String']>
  symbol_gt?: Maybe<Scalars['String']>
  symbol_gte?: Maybe<Scalars['String']>
  symbol_in?: Maybe<Array<Scalars['String']>>
  symbol_lt?: Maybe<Scalars['String']>
  symbol_lte?: Maybe<Scalars['String']>
  symbol_not?: Maybe<Scalars['String']>
  symbol_not_contains?: Maybe<Scalars['String']>
  symbol_not_ends_with?: Maybe<Scalars['String']>
  symbol_not_in?: Maybe<Array<Scalars['String']>>
  symbol_not_starts_with?: Maybe<Scalars['String']>
  symbol_starts_with?: Maybe<Scalars['String']>
  totalLiquidity?: Maybe<Scalars['v2_BigDecimal']>
  totalLiquidity_gt?: Maybe<Scalars['v2_BigDecimal']>
  totalLiquidity_gte?: Maybe<Scalars['v2_BigDecimal']>
  totalLiquidity_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
  totalLiquidity_lt?: Maybe<Scalars['v2_BigDecimal']>
  totalLiquidity_lte?: Maybe<Scalars['v2_BigDecimal']>
  totalLiquidity_not?: Maybe<Scalars['v2_BigDecimal']>
  totalLiquidity_not_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
  totalSupply?: Maybe<Scalars['v2_BigInt']>
  totalSupply_gt?: Maybe<Scalars['v2_BigInt']>
  totalSupply_gte?: Maybe<Scalars['v2_BigInt']>
  totalSupply_in?: Maybe<Array<Scalars['v2_BigInt']>>
  totalSupply_lt?: Maybe<Scalars['v2_BigInt']>
  totalSupply_lte?: Maybe<Scalars['v2_BigInt']>
  totalSupply_not?: Maybe<Scalars['v2_BigInt']>
  totalSupply_not_in?: Maybe<Array<Scalars['v2_BigInt']>>
  tradeVolume?: Maybe<Scalars['v2_BigDecimal']>
  tradeVolumeUSD?: Maybe<Scalars['v2_BigDecimal']>
  tradeVolumeUSD_gt?: Maybe<Scalars['v2_BigDecimal']>
  tradeVolumeUSD_gte?: Maybe<Scalars['v2_BigDecimal']>
  tradeVolumeUSD_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
  tradeVolumeUSD_lt?: Maybe<Scalars['v2_BigDecimal']>
  tradeVolumeUSD_lte?: Maybe<Scalars['v2_BigDecimal']>
  tradeVolumeUSD_not?: Maybe<Scalars['v2_BigDecimal']>
  tradeVolumeUSD_not_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
  tradeVolume_gt?: Maybe<Scalars['v2_BigDecimal']>
  tradeVolume_gte?: Maybe<Scalars['v2_BigDecimal']>
  tradeVolume_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
  tradeVolume_lt?: Maybe<Scalars['v2_BigDecimal']>
  tradeVolume_lte?: Maybe<Scalars['v2_BigDecimal']>
  tradeVolume_not?: Maybe<Scalars['v2_BigDecimal']>
  tradeVolume_not_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
  txCount?: Maybe<Scalars['v2_BigInt']>
  txCount_gt?: Maybe<Scalars['v2_BigInt']>
  txCount_gte?: Maybe<Scalars['v2_BigInt']>
  txCount_in?: Maybe<Array<Scalars['v2_BigInt']>>
  txCount_lt?: Maybe<Scalars['v2_BigInt']>
  txCount_lte?: Maybe<Scalars['v2_BigInt']>
  txCount_not?: Maybe<Scalars['v2_BigInt']>
  txCount_not_in?: Maybe<Array<Scalars['v2_BigInt']>>
  untrackedVolumeUSD?: Maybe<Scalars['v2_BigDecimal']>
  untrackedVolumeUSD_gt?: Maybe<Scalars['v2_BigDecimal']>
  untrackedVolumeUSD_gte?: Maybe<Scalars['v2_BigDecimal']>
  untrackedVolumeUSD_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
  untrackedVolumeUSD_lt?: Maybe<Scalars['v2_BigDecimal']>
  untrackedVolumeUSD_lte?: Maybe<Scalars['v2_BigDecimal']>
  untrackedVolumeUSD_not?: Maybe<Scalars['v2_BigDecimal']>
  untrackedVolumeUSD_not_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
}

export enum V2_Token_OrderBy {
  Decimals = 'decimals',
  DerivedEth = 'derivedETH',
  Id = 'id',
  MostLiquidPairs = 'mostLiquidPairs',
  Name = 'name',
  Symbol = 'symbol',
  TotalLiquidity = 'totalLiquidity',
  TotalSupply = 'totalSupply',
  TradeVolume = 'tradeVolume',
  TradeVolumeUsd = 'tradeVolumeUSD',
  TxCount = 'txCount',
  UntrackedVolumeUsd = 'untrackedVolumeUSD',
}

export type V2_Transaction = {
  __typename?: 'v2_Transaction'
  blockNumber: Scalars['v2_BigInt']
  burns: Array<Maybe<V2_Burn>>
  id: Scalars['ID']
  mints: Array<Maybe<V2_Mint>>
  swaps: Array<Maybe<V2_Swap>>
  timestamp: Scalars['v2_BigInt']
}

export type V2_TransactionBurnsArgs = {
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V2_Burn_OrderBy>
  orderDirection?: Maybe<V2_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  where?: Maybe<V2_Burn_Filter>
}

export type V2_TransactionMintsArgs = {
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V2_Mint_OrderBy>
  orderDirection?: Maybe<V2_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  where?: Maybe<V2_Mint_Filter>
}

export type V2_TransactionSwapsArgs = {
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V2_Swap_OrderBy>
  orderDirection?: Maybe<V2_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  where?: Maybe<V2_Swap_Filter>
}

export type V2_Transaction_Filter = {
  blockNumber?: Maybe<Scalars['v2_BigInt']>
  blockNumber_gt?: Maybe<Scalars['v2_BigInt']>
  blockNumber_gte?: Maybe<Scalars['v2_BigInt']>
  blockNumber_in?: Maybe<Array<Scalars['v2_BigInt']>>
  blockNumber_lt?: Maybe<Scalars['v2_BigInt']>
  blockNumber_lte?: Maybe<Scalars['v2_BigInt']>
  blockNumber_not?: Maybe<Scalars['v2_BigInt']>
  blockNumber_not_in?: Maybe<Array<Scalars['v2_BigInt']>>
  burns?: Maybe<Array<Scalars['String']>>
  burns_contains?: Maybe<Array<Scalars['String']>>
  burns_not?: Maybe<Array<Scalars['String']>>
  burns_not_contains?: Maybe<Array<Scalars['String']>>
  id?: Maybe<Scalars['ID']>
  id_gt?: Maybe<Scalars['ID']>
  id_gte?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  id_lt?: Maybe<Scalars['ID']>
  id_lte?: Maybe<Scalars['ID']>
  id_not?: Maybe<Scalars['ID']>
  id_not_in?: Maybe<Array<Scalars['ID']>>
  mints?: Maybe<Array<Scalars['String']>>
  mints_contains?: Maybe<Array<Scalars['String']>>
  mints_not?: Maybe<Array<Scalars['String']>>
  mints_not_contains?: Maybe<Array<Scalars['String']>>
  swaps?: Maybe<Array<Scalars['String']>>
  swaps_contains?: Maybe<Array<Scalars['String']>>
  swaps_not?: Maybe<Array<Scalars['String']>>
  swaps_not_contains?: Maybe<Array<Scalars['String']>>
  timestamp?: Maybe<Scalars['v2_BigInt']>
  timestamp_gt?: Maybe<Scalars['v2_BigInt']>
  timestamp_gte?: Maybe<Scalars['v2_BigInt']>
  timestamp_in?: Maybe<Array<Scalars['v2_BigInt']>>
  timestamp_lt?: Maybe<Scalars['v2_BigInt']>
  timestamp_lte?: Maybe<Scalars['v2_BigInt']>
  timestamp_not?: Maybe<Scalars['v2_BigInt']>
  timestamp_not_in?: Maybe<Array<Scalars['v2_BigInt']>>
}

export enum V2_Transaction_OrderBy {
  BlockNumber = 'blockNumber',
  Burns = 'burns',
  Id = 'id',
  Mints = 'mints',
  Swaps = 'swaps',
  Timestamp = 'timestamp',
}

export type V2_UniswapDayData = {
  __typename?: 'v2_UniswapDayData'
  dailyVolumeETH: Scalars['v2_BigDecimal']
  dailyVolumeUSD: Scalars['v2_BigDecimal']
  dailyVolumeUntracked: Scalars['v2_BigDecimal']
  date: Scalars['Int']
  id: Scalars['ID']
  maxStored?: Maybe<Scalars['Int']>
  mostLiquidTokens: Array<V2_TokenDayData>
  totalLiquidityETH: Scalars['v2_BigDecimal']
  totalLiquidityUSD: Scalars['v2_BigDecimal']
  totalVolumeETH: Scalars['v2_BigDecimal']
  totalVolumeUSD: Scalars['v2_BigDecimal']
  txCount: Scalars['v2_BigInt']
}

export type V2_UniswapDayDataMostLiquidTokensArgs = {
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V2_TokenDayData_OrderBy>
  orderDirection?: Maybe<V2_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  where?: Maybe<V2_TokenDayData_Filter>
}

export type V2_UniswapDayData_Filter = {
  dailyVolumeETH?: Maybe<Scalars['v2_BigDecimal']>
  dailyVolumeETH_gt?: Maybe<Scalars['v2_BigDecimal']>
  dailyVolumeETH_gte?: Maybe<Scalars['v2_BigDecimal']>
  dailyVolumeETH_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
  dailyVolumeETH_lt?: Maybe<Scalars['v2_BigDecimal']>
  dailyVolumeETH_lte?: Maybe<Scalars['v2_BigDecimal']>
  dailyVolumeETH_not?: Maybe<Scalars['v2_BigDecimal']>
  dailyVolumeETH_not_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
  dailyVolumeUSD?: Maybe<Scalars['v2_BigDecimal']>
  dailyVolumeUSD_gt?: Maybe<Scalars['v2_BigDecimal']>
  dailyVolumeUSD_gte?: Maybe<Scalars['v2_BigDecimal']>
  dailyVolumeUSD_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
  dailyVolumeUSD_lt?: Maybe<Scalars['v2_BigDecimal']>
  dailyVolumeUSD_lte?: Maybe<Scalars['v2_BigDecimal']>
  dailyVolumeUSD_not?: Maybe<Scalars['v2_BigDecimal']>
  dailyVolumeUSD_not_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
  dailyVolumeUntracked?: Maybe<Scalars['v2_BigDecimal']>
  dailyVolumeUntracked_gt?: Maybe<Scalars['v2_BigDecimal']>
  dailyVolumeUntracked_gte?: Maybe<Scalars['v2_BigDecimal']>
  dailyVolumeUntracked_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
  dailyVolumeUntracked_lt?: Maybe<Scalars['v2_BigDecimal']>
  dailyVolumeUntracked_lte?: Maybe<Scalars['v2_BigDecimal']>
  dailyVolumeUntracked_not?: Maybe<Scalars['v2_BigDecimal']>
  dailyVolumeUntracked_not_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
  date?: Maybe<Scalars['Int']>
  date_gt?: Maybe<Scalars['Int']>
  date_gte?: Maybe<Scalars['Int']>
  date_in?: Maybe<Array<Scalars['Int']>>
  date_lt?: Maybe<Scalars['Int']>
  date_lte?: Maybe<Scalars['Int']>
  date_not?: Maybe<Scalars['Int']>
  date_not_in?: Maybe<Array<Scalars['Int']>>
  id?: Maybe<Scalars['ID']>
  id_gt?: Maybe<Scalars['ID']>
  id_gte?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  id_lt?: Maybe<Scalars['ID']>
  id_lte?: Maybe<Scalars['ID']>
  id_not?: Maybe<Scalars['ID']>
  id_not_in?: Maybe<Array<Scalars['ID']>>
  maxStored?: Maybe<Scalars['Int']>
  maxStored_gt?: Maybe<Scalars['Int']>
  maxStored_gte?: Maybe<Scalars['Int']>
  maxStored_in?: Maybe<Array<Scalars['Int']>>
  maxStored_lt?: Maybe<Scalars['Int']>
  maxStored_lte?: Maybe<Scalars['Int']>
  maxStored_not?: Maybe<Scalars['Int']>
  maxStored_not_in?: Maybe<Array<Scalars['Int']>>
  mostLiquidTokens?: Maybe<Array<Scalars['String']>>
  mostLiquidTokens_contains?: Maybe<Array<Scalars['String']>>
  mostLiquidTokens_not?: Maybe<Array<Scalars['String']>>
  mostLiquidTokens_not_contains?: Maybe<Array<Scalars['String']>>
  totalLiquidityETH?: Maybe<Scalars['v2_BigDecimal']>
  totalLiquidityETH_gt?: Maybe<Scalars['v2_BigDecimal']>
  totalLiquidityETH_gte?: Maybe<Scalars['v2_BigDecimal']>
  totalLiquidityETH_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
  totalLiquidityETH_lt?: Maybe<Scalars['v2_BigDecimal']>
  totalLiquidityETH_lte?: Maybe<Scalars['v2_BigDecimal']>
  totalLiquidityETH_not?: Maybe<Scalars['v2_BigDecimal']>
  totalLiquidityETH_not_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
  totalLiquidityUSD?: Maybe<Scalars['v2_BigDecimal']>
  totalLiquidityUSD_gt?: Maybe<Scalars['v2_BigDecimal']>
  totalLiquidityUSD_gte?: Maybe<Scalars['v2_BigDecimal']>
  totalLiquidityUSD_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
  totalLiquidityUSD_lt?: Maybe<Scalars['v2_BigDecimal']>
  totalLiquidityUSD_lte?: Maybe<Scalars['v2_BigDecimal']>
  totalLiquidityUSD_not?: Maybe<Scalars['v2_BigDecimal']>
  totalLiquidityUSD_not_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
  totalVolumeETH?: Maybe<Scalars['v2_BigDecimal']>
  totalVolumeETH_gt?: Maybe<Scalars['v2_BigDecimal']>
  totalVolumeETH_gte?: Maybe<Scalars['v2_BigDecimal']>
  totalVolumeETH_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
  totalVolumeETH_lt?: Maybe<Scalars['v2_BigDecimal']>
  totalVolumeETH_lte?: Maybe<Scalars['v2_BigDecimal']>
  totalVolumeETH_not?: Maybe<Scalars['v2_BigDecimal']>
  totalVolumeETH_not_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
  totalVolumeUSD?: Maybe<Scalars['v2_BigDecimal']>
  totalVolumeUSD_gt?: Maybe<Scalars['v2_BigDecimal']>
  totalVolumeUSD_gte?: Maybe<Scalars['v2_BigDecimal']>
  totalVolumeUSD_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
  totalVolumeUSD_lt?: Maybe<Scalars['v2_BigDecimal']>
  totalVolumeUSD_lte?: Maybe<Scalars['v2_BigDecimal']>
  totalVolumeUSD_not?: Maybe<Scalars['v2_BigDecimal']>
  totalVolumeUSD_not_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
  txCount?: Maybe<Scalars['v2_BigInt']>
  txCount_gt?: Maybe<Scalars['v2_BigInt']>
  txCount_gte?: Maybe<Scalars['v2_BigInt']>
  txCount_in?: Maybe<Array<Scalars['v2_BigInt']>>
  txCount_lt?: Maybe<Scalars['v2_BigInt']>
  txCount_lte?: Maybe<Scalars['v2_BigInt']>
  txCount_not?: Maybe<Scalars['v2_BigInt']>
  txCount_not_in?: Maybe<Array<Scalars['v2_BigInt']>>
}

export enum V2_UniswapDayData_OrderBy {
  DailyVolumeEth = 'dailyVolumeETH',
  DailyVolumeUsd = 'dailyVolumeUSD',
  DailyVolumeUntracked = 'dailyVolumeUntracked',
  Date = 'date',
  Id = 'id',
  MaxStored = 'maxStored',
  MostLiquidTokens = 'mostLiquidTokens',
  TotalLiquidityEth = 'totalLiquidityETH',
  TotalLiquidityUsd = 'totalLiquidityUSD',
  TotalVolumeEth = 'totalVolumeETH',
  TotalVolumeUsd = 'totalVolumeUSD',
  TxCount = 'txCount',
}

export type V2_UniswapFactory = {
  __typename?: 'v2_UniswapFactory'
  id: Scalars['ID']
  mostLiquidTokens: Array<V2_TokenDayData>
  pairCount: Scalars['Int']
  totalLiquidityETH: Scalars['v2_BigDecimal']
  totalLiquidityUSD: Scalars['v2_BigDecimal']
  totalVolumeETH: Scalars['v2_BigDecimal']
  totalVolumeUSD: Scalars['v2_BigDecimal']
  txCount: Scalars['v2_BigInt']
  untrackedVolumeUSD: Scalars['v2_BigDecimal']
}

export type V2_UniswapFactoryMostLiquidTokensArgs = {
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V2_TokenDayData_OrderBy>
  orderDirection?: Maybe<V2_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  where?: Maybe<V2_TokenDayData_Filter>
}

export type V2_UniswapFactory_Filter = {
  id?: Maybe<Scalars['ID']>
  id_gt?: Maybe<Scalars['ID']>
  id_gte?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  id_lt?: Maybe<Scalars['ID']>
  id_lte?: Maybe<Scalars['ID']>
  id_not?: Maybe<Scalars['ID']>
  id_not_in?: Maybe<Array<Scalars['ID']>>
  mostLiquidTokens?: Maybe<Array<Scalars['String']>>
  mostLiquidTokens_contains?: Maybe<Array<Scalars['String']>>
  mostLiquidTokens_not?: Maybe<Array<Scalars['String']>>
  mostLiquidTokens_not_contains?: Maybe<Array<Scalars['String']>>
  pairCount?: Maybe<Scalars['Int']>
  pairCount_gt?: Maybe<Scalars['Int']>
  pairCount_gte?: Maybe<Scalars['Int']>
  pairCount_in?: Maybe<Array<Scalars['Int']>>
  pairCount_lt?: Maybe<Scalars['Int']>
  pairCount_lte?: Maybe<Scalars['Int']>
  pairCount_not?: Maybe<Scalars['Int']>
  pairCount_not_in?: Maybe<Array<Scalars['Int']>>
  totalLiquidityETH?: Maybe<Scalars['v2_BigDecimal']>
  totalLiquidityETH_gt?: Maybe<Scalars['v2_BigDecimal']>
  totalLiquidityETH_gte?: Maybe<Scalars['v2_BigDecimal']>
  totalLiquidityETH_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
  totalLiquidityETH_lt?: Maybe<Scalars['v2_BigDecimal']>
  totalLiquidityETH_lte?: Maybe<Scalars['v2_BigDecimal']>
  totalLiquidityETH_not?: Maybe<Scalars['v2_BigDecimal']>
  totalLiquidityETH_not_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
  totalLiquidityUSD?: Maybe<Scalars['v2_BigDecimal']>
  totalLiquidityUSD_gt?: Maybe<Scalars['v2_BigDecimal']>
  totalLiquidityUSD_gte?: Maybe<Scalars['v2_BigDecimal']>
  totalLiquidityUSD_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
  totalLiquidityUSD_lt?: Maybe<Scalars['v2_BigDecimal']>
  totalLiquidityUSD_lte?: Maybe<Scalars['v2_BigDecimal']>
  totalLiquidityUSD_not?: Maybe<Scalars['v2_BigDecimal']>
  totalLiquidityUSD_not_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
  totalVolumeETH?: Maybe<Scalars['v2_BigDecimal']>
  totalVolumeETH_gt?: Maybe<Scalars['v2_BigDecimal']>
  totalVolumeETH_gte?: Maybe<Scalars['v2_BigDecimal']>
  totalVolumeETH_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
  totalVolumeETH_lt?: Maybe<Scalars['v2_BigDecimal']>
  totalVolumeETH_lte?: Maybe<Scalars['v2_BigDecimal']>
  totalVolumeETH_not?: Maybe<Scalars['v2_BigDecimal']>
  totalVolumeETH_not_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
  totalVolumeUSD?: Maybe<Scalars['v2_BigDecimal']>
  totalVolumeUSD_gt?: Maybe<Scalars['v2_BigDecimal']>
  totalVolumeUSD_gte?: Maybe<Scalars['v2_BigDecimal']>
  totalVolumeUSD_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
  totalVolumeUSD_lt?: Maybe<Scalars['v2_BigDecimal']>
  totalVolumeUSD_lte?: Maybe<Scalars['v2_BigDecimal']>
  totalVolumeUSD_not?: Maybe<Scalars['v2_BigDecimal']>
  totalVolumeUSD_not_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
  txCount?: Maybe<Scalars['v2_BigInt']>
  txCount_gt?: Maybe<Scalars['v2_BigInt']>
  txCount_gte?: Maybe<Scalars['v2_BigInt']>
  txCount_in?: Maybe<Array<Scalars['v2_BigInt']>>
  txCount_lt?: Maybe<Scalars['v2_BigInt']>
  txCount_lte?: Maybe<Scalars['v2_BigInt']>
  txCount_not?: Maybe<Scalars['v2_BigInt']>
  txCount_not_in?: Maybe<Array<Scalars['v2_BigInt']>>
  untrackedVolumeUSD?: Maybe<Scalars['v2_BigDecimal']>
  untrackedVolumeUSD_gt?: Maybe<Scalars['v2_BigDecimal']>
  untrackedVolumeUSD_gte?: Maybe<Scalars['v2_BigDecimal']>
  untrackedVolumeUSD_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
  untrackedVolumeUSD_lt?: Maybe<Scalars['v2_BigDecimal']>
  untrackedVolumeUSD_lte?: Maybe<Scalars['v2_BigDecimal']>
  untrackedVolumeUSD_not?: Maybe<Scalars['v2_BigDecimal']>
  untrackedVolumeUSD_not_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
}

export enum V2_UniswapFactory_OrderBy {
  Id = 'id',
  MostLiquidTokens = 'mostLiquidTokens',
  PairCount = 'pairCount',
  TotalLiquidityEth = 'totalLiquidityETH',
  TotalLiquidityUsd = 'totalLiquidityUSD',
  TotalVolumeEth = 'totalVolumeETH',
  TotalVolumeUsd = 'totalVolumeUSD',
  TxCount = 'txCount',
  UntrackedVolumeUsd = 'untrackedVolumeUSD',
}

export type V2_User = {
  __typename?: 'v2_User'
  id: Scalars['ID']
  liquidityPositions?: Maybe<Array<V2_LiquidityPosition>>
  usdSwapped: Scalars['v2_BigDecimal']
}

export type V2_UserLiquidityPositionsArgs = {
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V2_LiquidityPosition_OrderBy>
  orderDirection?: Maybe<V2_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  where?: Maybe<V2_LiquidityPosition_Filter>
}

export type V2_User_Filter = {
  id?: Maybe<Scalars['ID']>
  id_gt?: Maybe<Scalars['ID']>
  id_gte?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  id_lt?: Maybe<Scalars['ID']>
  id_lte?: Maybe<Scalars['ID']>
  id_not?: Maybe<Scalars['ID']>
  id_not_in?: Maybe<Array<Scalars['ID']>>
  usdSwapped?: Maybe<Scalars['v2_BigDecimal']>
  usdSwapped_gt?: Maybe<Scalars['v2_BigDecimal']>
  usdSwapped_gte?: Maybe<Scalars['v2_BigDecimal']>
  usdSwapped_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
  usdSwapped_lt?: Maybe<Scalars['v2_BigDecimal']>
  usdSwapped_lte?: Maybe<Scalars['v2_BigDecimal']>
  usdSwapped_not?: Maybe<Scalars['v2_BigDecimal']>
  usdSwapped_not_in?: Maybe<Array<Scalars['v2_BigDecimal']>>
}

export enum V2_User_OrderBy {
  Id = 'id',
  LiquidityPositions = 'liquidityPositions',
  UsdSwapped = 'usdSwapped',
}

export type V2__Block_ = {
  __typename?: 'v2__Block_'
  /** The hash of the block */
  hash?: Maybe<Scalars['v2_Bytes']>
  /** The block number */
  number: Scalars['Int']
}

/** The type for the top-level _meta field */
export type V2__Meta_ = {
  __typename?: 'v2__Meta_'
  /**
   * Information about a specific subgraph block. The hash of the block
   * will be null if the _meta field has a block constraint that asks for
   * a block number. It will be filled if the _meta field has no block constraint
   * and therefore asks for the latest  block
   *
   */
  block: V2__Block_
  /** The deployment ID */
  deployment: Scalars['String']
  /** If `true`, the subgraph encountered indexing errors at some past block */
  hasIndexingErrors: Scalars['Boolean']
}

export enum V2__SubgraphErrorPolicy_ {
  /** Data will be returned even if the subgraph has indexing errors */
  Allow = 'allow',
  /** If the subgraph has indexing errors, data will be omitted. The default. */
  Deny = 'deny',
}

export type V3_Block_Height = {
  hash?: Maybe<Scalars['v3_Bytes']>
  number?: Maybe<Scalars['Int']>
  number_gte?: Maybe<Scalars['Int']>
}

export type V3_Bundle = {
  __typename?: 'v3_Bundle'
  ethPriceUSD: Scalars['v3_BigDecimal']
  id: Scalars['ID']
}

export type V3_Bundle_Filter = {
  ethPriceUSD?: Maybe<Scalars['v3_BigDecimal']>
  ethPriceUSD_gt?: Maybe<Scalars['v3_BigDecimal']>
  ethPriceUSD_gte?: Maybe<Scalars['v3_BigDecimal']>
  ethPriceUSD_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  ethPriceUSD_lt?: Maybe<Scalars['v3_BigDecimal']>
  ethPriceUSD_lte?: Maybe<Scalars['v3_BigDecimal']>
  ethPriceUSD_not?: Maybe<Scalars['v3_BigDecimal']>
  ethPriceUSD_not_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  id?: Maybe<Scalars['ID']>
  id_gt?: Maybe<Scalars['ID']>
  id_gte?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  id_lt?: Maybe<Scalars['ID']>
  id_lte?: Maybe<Scalars['ID']>
  id_not?: Maybe<Scalars['ID']>
  id_not_in?: Maybe<Array<Scalars['ID']>>
}

export enum V3_Bundle_OrderBy {
  EthPriceUsd = 'ethPriceUSD',
  Id = 'id',
}

export type V3_Burn = {
  __typename?: 'v3_Burn'
  amount: Scalars['v3_BigInt']
  amount0: Scalars['v3_BigDecimal']
  amount1: Scalars['v3_BigDecimal']
  amountUSD?: Maybe<Scalars['v3_BigDecimal']>
  id: Scalars['ID']
  logIndex?: Maybe<Scalars['v3_BigInt']>
  origin: Scalars['v3_Bytes']
  owner?: Maybe<Scalars['v3_Bytes']>
  pool: V3_Pool
  tickLower: Scalars['v3_BigInt']
  tickUpper: Scalars['v3_BigInt']
  timestamp: Scalars['v3_BigInt']
  token0: V3_Token
  token1: V3_Token
  transaction: V3_Transaction
}

export type V3_Burn_Filter = {
  amount?: Maybe<Scalars['v3_BigInt']>
  amount0?: Maybe<Scalars['v3_BigDecimal']>
  amount0_gt?: Maybe<Scalars['v3_BigDecimal']>
  amount0_gte?: Maybe<Scalars['v3_BigDecimal']>
  amount0_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  amount0_lt?: Maybe<Scalars['v3_BigDecimal']>
  amount0_lte?: Maybe<Scalars['v3_BigDecimal']>
  amount0_not?: Maybe<Scalars['v3_BigDecimal']>
  amount0_not_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  amount1?: Maybe<Scalars['v3_BigDecimal']>
  amount1_gt?: Maybe<Scalars['v3_BigDecimal']>
  amount1_gte?: Maybe<Scalars['v3_BigDecimal']>
  amount1_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  amount1_lt?: Maybe<Scalars['v3_BigDecimal']>
  amount1_lte?: Maybe<Scalars['v3_BigDecimal']>
  amount1_not?: Maybe<Scalars['v3_BigDecimal']>
  amount1_not_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  amountUSD?: Maybe<Scalars['v3_BigDecimal']>
  amountUSD_gt?: Maybe<Scalars['v3_BigDecimal']>
  amountUSD_gte?: Maybe<Scalars['v3_BigDecimal']>
  amountUSD_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  amountUSD_lt?: Maybe<Scalars['v3_BigDecimal']>
  amountUSD_lte?: Maybe<Scalars['v3_BigDecimal']>
  amountUSD_not?: Maybe<Scalars['v3_BigDecimal']>
  amountUSD_not_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  amount_gt?: Maybe<Scalars['v3_BigInt']>
  amount_gte?: Maybe<Scalars['v3_BigInt']>
  amount_in?: Maybe<Array<Scalars['v3_BigInt']>>
  amount_lt?: Maybe<Scalars['v3_BigInt']>
  amount_lte?: Maybe<Scalars['v3_BigInt']>
  amount_not?: Maybe<Scalars['v3_BigInt']>
  amount_not_in?: Maybe<Array<Scalars['v3_BigInt']>>
  id?: Maybe<Scalars['ID']>
  id_gt?: Maybe<Scalars['ID']>
  id_gte?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  id_lt?: Maybe<Scalars['ID']>
  id_lte?: Maybe<Scalars['ID']>
  id_not?: Maybe<Scalars['ID']>
  id_not_in?: Maybe<Array<Scalars['ID']>>
  logIndex?: Maybe<Scalars['v3_BigInt']>
  logIndex_gt?: Maybe<Scalars['v3_BigInt']>
  logIndex_gte?: Maybe<Scalars['v3_BigInt']>
  logIndex_in?: Maybe<Array<Scalars['v3_BigInt']>>
  logIndex_lt?: Maybe<Scalars['v3_BigInt']>
  logIndex_lte?: Maybe<Scalars['v3_BigInt']>
  logIndex_not?: Maybe<Scalars['v3_BigInt']>
  logIndex_not_in?: Maybe<Array<Scalars['v3_BigInt']>>
  origin?: Maybe<Scalars['v3_Bytes']>
  origin_contains?: Maybe<Scalars['v3_Bytes']>
  origin_in?: Maybe<Array<Scalars['v3_Bytes']>>
  origin_not?: Maybe<Scalars['v3_Bytes']>
  origin_not_contains?: Maybe<Scalars['v3_Bytes']>
  origin_not_in?: Maybe<Array<Scalars['v3_Bytes']>>
  owner?: Maybe<Scalars['v3_Bytes']>
  owner_contains?: Maybe<Scalars['v3_Bytes']>
  owner_in?: Maybe<Array<Scalars['v3_Bytes']>>
  owner_not?: Maybe<Scalars['v3_Bytes']>
  owner_not_contains?: Maybe<Scalars['v3_Bytes']>
  owner_not_in?: Maybe<Array<Scalars['v3_Bytes']>>
  pool?: Maybe<Scalars['String']>
  pool_contains?: Maybe<Scalars['String']>
  pool_ends_with?: Maybe<Scalars['String']>
  pool_gt?: Maybe<Scalars['String']>
  pool_gte?: Maybe<Scalars['String']>
  pool_in?: Maybe<Array<Scalars['String']>>
  pool_lt?: Maybe<Scalars['String']>
  pool_lte?: Maybe<Scalars['String']>
  pool_not?: Maybe<Scalars['String']>
  pool_not_contains?: Maybe<Scalars['String']>
  pool_not_ends_with?: Maybe<Scalars['String']>
  pool_not_in?: Maybe<Array<Scalars['String']>>
  pool_not_starts_with?: Maybe<Scalars['String']>
  pool_starts_with?: Maybe<Scalars['String']>
  tickLower?: Maybe<Scalars['v3_BigInt']>
  tickLower_gt?: Maybe<Scalars['v3_BigInt']>
  tickLower_gte?: Maybe<Scalars['v3_BigInt']>
  tickLower_in?: Maybe<Array<Scalars['v3_BigInt']>>
  tickLower_lt?: Maybe<Scalars['v3_BigInt']>
  tickLower_lte?: Maybe<Scalars['v3_BigInt']>
  tickLower_not?: Maybe<Scalars['v3_BigInt']>
  tickLower_not_in?: Maybe<Array<Scalars['v3_BigInt']>>
  tickUpper?: Maybe<Scalars['v3_BigInt']>
  tickUpper_gt?: Maybe<Scalars['v3_BigInt']>
  tickUpper_gte?: Maybe<Scalars['v3_BigInt']>
  tickUpper_in?: Maybe<Array<Scalars['v3_BigInt']>>
  tickUpper_lt?: Maybe<Scalars['v3_BigInt']>
  tickUpper_lte?: Maybe<Scalars['v3_BigInt']>
  tickUpper_not?: Maybe<Scalars['v3_BigInt']>
  tickUpper_not_in?: Maybe<Array<Scalars['v3_BigInt']>>
  timestamp?: Maybe<Scalars['v3_BigInt']>
  timestamp_gt?: Maybe<Scalars['v3_BigInt']>
  timestamp_gte?: Maybe<Scalars['v3_BigInt']>
  timestamp_in?: Maybe<Array<Scalars['v3_BigInt']>>
  timestamp_lt?: Maybe<Scalars['v3_BigInt']>
  timestamp_lte?: Maybe<Scalars['v3_BigInt']>
  timestamp_not?: Maybe<Scalars['v3_BigInt']>
  timestamp_not_in?: Maybe<Array<Scalars['v3_BigInt']>>
  token0?: Maybe<Scalars['String']>
  token0_contains?: Maybe<Scalars['String']>
  token0_ends_with?: Maybe<Scalars['String']>
  token0_gt?: Maybe<Scalars['String']>
  token0_gte?: Maybe<Scalars['String']>
  token0_in?: Maybe<Array<Scalars['String']>>
  token0_lt?: Maybe<Scalars['String']>
  token0_lte?: Maybe<Scalars['String']>
  token0_not?: Maybe<Scalars['String']>
  token0_not_contains?: Maybe<Scalars['String']>
  token0_not_ends_with?: Maybe<Scalars['String']>
  token0_not_in?: Maybe<Array<Scalars['String']>>
  token0_not_starts_with?: Maybe<Scalars['String']>
  token0_starts_with?: Maybe<Scalars['String']>
  token1?: Maybe<Scalars['String']>
  token1_contains?: Maybe<Scalars['String']>
  token1_ends_with?: Maybe<Scalars['String']>
  token1_gt?: Maybe<Scalars['String']>
  token1_gte?: Maybe<Scalars['String']>
  token1_in?: Maybe<Array<Scalars['String']>>
  token1_lt?: Maybe<Scalars['String']>
  token1_lte?: Maybe<Scalars['String']>
  token1_not?: Maybe<Scalars['String']>
  token1_not_contains?: Maybe<Scalars['String']>
  token1_not_ends_with?: Maybe<Scalars['String']>
  token1_not_in?: Maybe<Array<Scalars['String']>>
  token1_not_starts_with?: Maybe<Scalars['String']>
  token1_starts_with?: Maybe<Scalars['String']>
  transaction?: Maybe<Scalars['String']>
  transaction_contains?: Maybe<Scalars['String']>
  transaction_ends_with?: Maybe<Scalars['String']>
  transaction_gt?: Maybe<Scalars['String']>
  transaction_gte?: Maybe<Scalars['String']>
  transaction_in?: Maybe<Array<Scalars['String']>>
  transaction_lt?: Maybe<Scalars['String']>
  transaction_lte?: Maybe<Scalars['String']>
  transaction_not?: Maybe<Scalars['String']>
  transaction_not_contains?: Maybe<Scalars['String']>
  transaction_not_ends_with?: Maybe<Scalars['String']>
  transaction_not_in?: Maybe<Array<Scalars['String']>>
  transaction_not_starts_with?: Maybe<Scalars['String']>
  transaction_starts_with?: Maybe<Scalars['String']>
}

export enum V3_Burn_OrderBy {
  Amount = 'amount',
  Amount0 = 'amount0',
  Amount1 = 'amount1',
  AmountUsd = 'amountUSD',
  Id = 'id',
  LogIndex = 'logIndex',
  Origin = 'origin',
  Owner = 'owner',
  Pool = 'pool',
  TickLower = 'tickLower',
  TickUpper = 'tickUpper',
  Timestamp = 'timestamp',
  Token0 = 'token0',
  Token1 = 'token1',
  Transaction = 'transaction',
}

export type V3_Collect = {
  __typename?: 'v3_Collect'
  amount0: Scalars['v3_BigDecimal']
  amount1: Scalars['v3_BigDecimal']
  amountUSD?: Maybe<Scalars['v3_BigDecimal']>
  id: Scalars['ID']
  logIndex?: Maybe<Scalars['v3_BigInt']>
  owner?: Maybe<Scalars['v3_Bytes']>
  pool: V3_Pool
  tickLower: Scalars['v3_BigInt']
  tickUpper: Scalars['v3_BigInt']
  timestamp: Scalars['v3_BigInt']
  transaction: V3_Transaction
}

export type V3_Collect_Filter = {
  amount0?: Maybe<Scalars['v3_BigDecimal']>
  amount0_gt?: Maybe<Scalars['v3_BigDecimal']>
  amount0_gte?: Maybe<Scalars['v3_BigDecimal']>
  amount0_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  amount0_lt?: Maybe<Scalars['v3_BigDecimal']>
  amount0_lte?: Maybe<Scalars['v3_BigDecimal']>
  amount0_not?: Maybe<Scalars['v3_BigDecimal']>
  amount0_not_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  amount1?: Maybe<Scalars['v3_BigDecimal']>
  amount1_gt?: Maybe<Scalars['v3_BigDecimal']>
  amount1_gte?: Maybe<Scalars['v3_BigDecimal']>
  amount1_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  amount1_lt?: Maybe<Scalars['v3_BigDecimal']>
  amount1_lte?: Maybe<Scalars['v3_BigDecimal']>
  amount1_not?: Maybe<Scalars['v3_BigDecimal']>
  amount1_not_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  amountUSD?: Maybe<Scalars['v3_BigDecimal']>
  amountUSD_gt?: Maybe<Scalars['v3_BigDecimal']>
  amountUSD_gte?: Maybe<Scalars['v3_BigDecimal']>
  amountUSD_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  amountUSD_lt?: Maybe<Scalars['v3_BigDecimal']>
  amountUSD_lte?: Maybe<Scalars['v3_BigDecimal']>
  amountUSD_not?: Maybe<Scalars['v3_BigDecimal']>
  amountUSD_not_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  id?: Maybe<Scalars['ID']>
  id_gt?: Maybe<Scalars['ID']>
  id_gte?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  id_lt?: Maybe<Scalars['ID']>
  id_lte?: Maybe<Scalars['ID']>
  id_not?: Maybe<Scalars['ID']>
  id_not_in?: Maybe<Array<Scalars['ID']>>
  logIndex?: Maybe<Scalars['v3_BigInt']>
  logIndex_gt?: Maybe<Scalars['v3_BigInt']>
  logIndex_gte?: Maybe<Scalars['v3_BigInt']>
  logIndex_in?: Maybe<Array<Scalars['v3_BigInt']>>
  logIndex_lt?: Maybe<Scalars['v3_BigInt']>
  logIndex_lte?: Maybe<Scalars['v3_BigInt']>
  logIndex_not?: Maybe<Scalars['v3_BigInt']>
  logIndex_not_in?: Maybe<Array<Scalars['v3_BigInt']>>
  owner?: Maybe<Scalars['v3_Bytes']>
  owner_contains?: Maybe<Scalars['v3_Bytes']>
  owner_in?: Maybe<Array<Scalars['v3_Bytes']>>
  owner_not?: Maybe<Scalars['v3_Bytes']>
  owner_not_contains?: Maybe<Scalars['v3_Bytes']>
  owner_not_in?: Maybe<Array<Scalars['v3_Bytes']>>
  pool?: Maybe<Scalars['String']>
  pool_contains?: Maybe<Scalars['String']>
  pool_ends_with?: Maybe<Scalars['String']>
  pool_gt?: Maybe<Scalars['String']>
  pool_gte?: Maybe<Scalars['String']>
  pool_in?: Maybe<Array<Scalars['String']>>
  pool_lt?: Maybe<Scalars['String']>
  pool_lte?: Maybe<Scalars['String']>
  pool_not?: Maybe<Scalars['String']>
  pool_not_contains?: Maybe<Scalars['String']>
  pool_not_ends_with?: Maybe<Scalars['String']>
  pool_not_in?: Maybe<Array<Scalars['String']>>
  pool_not_starts_with?: Maybe<Scalars['String']>
  pool_starts_with?: Maybe<Scalars['String']>
  tickLower?: Maybe<Scalars['v3_BigInt']>
  tickLower_gt?: Maybe<Scalars['v3_BigInt']>
  tickLower_gte?: Maybe<Scalars['v3_BigInt']>
  tickLower_in?: Maybe<Array<Scalars['v3_BigInt']>>
  tickLower_lt?: Maybe<Scalars['v3_BigInt']>
  tickLower_lte?: Maybe<Scalars['v3_BigInt']>
  tickLower_not?: Maybe<Scalars['v3_BigInt']>
  tickLower_not_in?: Maybe<Array<Scalars['v3_BigInt']>>
  tickUpper?: Maybe<Scalars['v3_BigInt']>
  tickUpper_gt?: Maybe<Scalars['v3_BigInt']>
  tickUpper_gte?: Maybe<Scalars['v3_BigInt']>
  tickUpper_in?: Maybe<Array<Scalars['v3_BigInt']>>
  tickUpper_lt?: Maybe<Scalars['v3_BigInt']>
  tickUpper_lte?: Maybe<Scalars['v3_BigInt']>
  tickUpper_not?: Maybe<Scalars['v3_BigInt']>
  tickUpper_not_in?: Maybe<Array<Scalars['v3_BigInt']>>
  timestamp?: Maybe<Scalars['v3_BigInt']>
  timestamp_gt?: Maybe<Scalars['v3_BigInt']>
  timestamp_gte?: Maybe<Scalars['v3_BigInt']>
  timestamp_in?: Maybe<Array<Scalars['v3_BigInt']>>
  timestamp_lt?: Maybe<Scalars['v3_BigInt']>
  timestamp_lte?: Maybe<Scalars['v3_BigInt']>
  timestamp_not?: Maybe<Scalars['v3_BigInt']>
  timestamp_not_in?: Maybe<Array<Scalars['v3_BigInt']>>
  transaction?: Maybe<Scalars['String']>
  transaction_contains?: Maybe<Scalars['String']>
  transaction_ends_with?: Maybe<Scalars['String']>
  transaction_gt?: Maybe<Scalars['String']>
  transaction_gte?: Maybe<Scalars['String']>
  transaction_in?: Maybe<Array<Scalars['String']>>
  transaction_lt?: Maybe<Scalars['String']>
  transaction_lte?: Maybe<Scalars['String']>
  transaction_not?: Maybe<Scalars['String']>
  transaction_not_contains?: Maybe<Scalars['String']>
  transaction_not_ends_with?: Maybe<Scalars['String']>
  transaction_not_in?: Maybe<Array<Scalars['String']>>
  transaction_not_starts_with?: Maybe<Scalars['String']>
  transaction_starts_with?: Maybe<Scalars['String']>
}

export enum V3_Collect_OrderBy {
  Amount0 = 'amount0',
  Amount1 = 'amount1',
  AmountUsd = 'amountUSD',
  Id = 'id',
  LogIndex = 'logIndex',
  Owner = 'owner',
  Pool = 'pool',
  TickLower = 'tickLower',
  TickUpper = 'tickUpper',
  Timestamp = 'timestamp',
  Transaction = 'transaction',
}

export type V3_Factory = {
  __typename?: 'v3_Factory'
  id: Scalars['ID']
  owner: Scalars['ID']
  poolCount: Scalars['v3_BigInt']
  totalFeesETH: Scalars['v3_BigDecimal']
  totalFeesUSD: Scalars['v3_BigDecimal']
  totalValueLockedETH: Scalars['v3_BigDecimal']
  totalValueLockedETHUntracked: Scalars['v3_BigDecimal']
  totalValueLockedUSD: Scalars['v3_BigDecimal']
  totalValueLockedUSDUntracked: Scalars['v3_BigDecimal']
  totalVolumeETH: Scalars['v3_BigDecimal']
  totalVolumeUSD: Scalars['v3_BigDecimal']
  txCount: Scalars['v3_BigInt']
  untrackedVolumeUSD: Scalars['v3_BigDecimal']
}

export type V3_Factory_Filter = {
  id?: Maybe<Scalars['ID']>
  id_gt?: Maybe<Scalars['ID']>
  id_gte?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  id_lt?: Maybe<Scalars['ID']>
  id_lte?: Maybe<Scalars['ID']>
  id_not?: Maybe<Scalars['ID']>
  id_not_in?: Maybe<Array<Scalars['ID']>>
  owner?: Maybe<Scalars['ID']>
  owner_gt?: Maybe<Scalars['ID']>
  owner_gte?: Maybe<Scalars['ID']>
  owner_in?: Maybe<Array<Scalars['ID']>>
  owner_lt?: Maybe<Scalars['ID']>
  owner_lte?: Maybe<Scalars['ID']>
  owner_not?: Maybe<Scalars['ID']>
  owner_not_in?: Maybe<Array<Scalars['ID']>>
  poolCount?: Maybe<Scalars['v3_BigInt']>
  poolCount_gt?: Maybe<Scalars['v3_BigInt']>
  poolCount_gte?: Maybe<Scalars['v3_BigInt']>
  poolCount_in?: Maybe<Array<Scalars['v3_BigInt']>>
  poolCount_lt?: Maybe<Scalars['v3_BigInt']>
  poolCount_lte?: Maybe<Scalars['v3_BigInt']>
  poolCount_not?: Maybe<Scalars['v3_BigInt']>
  poolCount_not_in?: Maybe<Array<Scalars['v3_BigInt']>>
  totalFeesETH?: Maybe<Scalars['v3_BigDecimal']>
  totalFeesETH_gt?: Maybe<Scalars['v3_BigDecimal']>
  totalFeesETH_gte?: Maybe<Scalars['v3_BigDecimal']>
  totalFeesETH_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  totalFeesETH_lt?: Maybe<Scalars['v3_BigDecimal']>
  totalFeesETH_lte?: Maybe<Scalars['v3_BigDecimal']>
  totalFeesETH_not?: Maybe<Scalars['v3_BigDecimal']>
  totalFeesETH_not_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  totalFeesUSD?: Maybe<Scalars['v3_BigDecimal']>
  totalFeesUSD_gt?: Maybe<Scalars['v3_BigDecimal']>
  totalFeesUSD_gte?: Maybe<Scalars['v3_BigDecimal']>
  totalFeesUSD_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  totalFeesUSD_lt?: Maybe<Scalars['v3_BigDecimal']>
  totalFeesUSD_lte?: Maybe<Scalars['v3_BigDecimal']>
  totalFeesUSD_not?: Maybe<Scalars['v3_BigDecimal']>
  totalFeesUSD_not_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  totalValueLockedETH?: Maybe<Scalars['v3_BigDecimal']>
  totalValueLockedETHUntracked?: Maybe<Scalars['v3_BigDecimal']>
  totalValueLockedETHUntracked_gt?: Maybe<Scalars['v3_BigDecimal']>
  totalValueLockedETHUntracked_gte?: Maybe<Scalars['v3_BigDecimal']>
  totalValueLockedETHUntracked_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  totalValueLockedETHUntracked_lt?: Maybe<Scalars['v3_BigDecimal']>
  totalValueLockedETHUntracked_lte?: Maybe<Scalars['v3_BigDecimal']>
  totalValueLockedETHUntracked_not?: Maybe<Scalars['v3_BigDecimal']>
  totalValueLockedETHUntracked_not_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  totalValueLockedETH_gt?: Maybe<Scalars['v3_BigDecimal']>
  totalValueLockedETH_gte?: Maybe<Scalars['v3_BigDecimal']>
  totalValueLockedETH_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  totalValueLockedETH_lt?: Maybe<Scalars['v3_BigDecimal']>
  totalValueLockedETH_lte?: Maybe<Scalars['v3_BigDecimal']>
  totalValueLockedETH_not?: Maybe<Scalars['v3_BigDecimal']>
  totalValueLockedETH_not_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  totalValueLockedUSD?: Maybe<Scalars['v3_BigDecimal']>
  totalValueLockedUSDUntracked?: Maybe<Scalars['v3_BigDecimal']>
  totalValueLockedUSDUntracked_gt?: Maybe<Scalars['v3_BigDecimal']>
  totalValueLockedUSDUntracked_gte?: Maybe<Scalars['v3_BigDecimal']>
  totalValueLockedUSDUntracked_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  totalValueLockedUSDUntracked_lt?: Maybe<Scalars['v3_BigDecimal']>
  totalValueLockedUSDUntracked_lte?: Maybe<Scalars['v3_BigDecimal']>
  totalValueLockedUSDUntracked_not?: Maybe<Scalars['v3_BigDecimal']>
  totalValueLockedUSDUntracked_not_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  totalValueLockedUSD_gt?: Maybe<Scalars['v3_BigDecimal']>
  totalValueLockedUSD_gte?: Maybe<Scalars['v3_BigDecimal']>
  totalValueLockedUSD_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  totalValueLockedUSD_lt?: Maybe<Scalars['v3_BigDecimal']>
  totalValueLockedUSD_lte?: Maybe<Scalars['v3_BigDecimal']>
  totalValueLockedUSD_not?: Maybe<Scalars['v3_BigDecimal']>
  totalValueLockedUSD_not_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  totalVolumeETH?: Maybe<Scalars['v3_BigDecimal']>
  totalVolumeETH_gt?: Maybe<Scalars['v3_BigDecimal']>
  totalVolumeETH_gte?: Maybe<Scalars['v3_BigDecimal']>
  totalVolumeETH_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  totalVolumeETH_lt?: Maybe<Scalars['v3_BigDecimal']>
  totalVolumeETH_lte?: Maybe<Scalars['v3_BigDecimal']>
  totalVolumeETH_not?: Maybe<Scalars['v3_BigDecimal']>
  totalVolumeETH_not_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  totalVolumeUSD?: Maybe<Scalars['v3_BigDecimal']>
  totalVolumeUSD_gt?: Maybe<Scalars['v3_BigDecimal']>
  totalVolumeUSD_gte?: Maybe<Scalars['v3_BigDecimal']>
  totalVolumeUSD_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  totalVolumeUSD_lt?: Maybe<Scalars['v3_BigDecimal']>
  totalVolumeUSD_lte?: Maybe<Scalars['v3_BigDecimal']>
  totalVolumeUSD_not?: Maybe<Scalars['v3_BigDecimal']>
  totalVolumeUSD_not_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  txCount?: Maybe<Scalars['v3_BigInt']>
  txCount_gt?: Maybe<Scalars['v3_BigInt']>
  txCount_gte?: Maybe<Scalars['v3_BigInt']>
  txCount_in?: Maybe<Array<Scalars['v3_BigInt']>>
  txCount_lt?: Maybe<Scalars['v3_BigInt']>
  txCount_lte?: Maybe<Scalars['v3_BigInt']>
  txCount_not?: Maybe<Scalars['v3_BigInt']>
  txCount_not_in?: Maybe<Array<Scalars['v3_BigInt']>>
  untrackedVolumeUSD?: Maybe<Scalars['v3_BigDecimal']>
  untrackedVolumeUSD_gt?: Maybe<Scalars['v3_BigDecimal']>
  untrackedVolumeUSD_gte?: Maybe<Scalars['v3_BigDecimal']>
  untrackedVolumeUSD_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  untrackedVolumeUSD_lt?: Maybe<Scalars['v3_BigDecimal']>
  untrackedVolumeUSD_lte?: Maybe<Scalars['v3_BigDecimal']>
  untrackedVolumeUSD_not?: Maybe<Scalars['v3_BigDecimal']>
  untrackedVolumeUSD_not_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
}

export enum V3_Factory_OrderBy {
  Id = 'id',
  Owner = 'owner',
  PoolCount = 'poolCount',
  TotalFeesEth = 'totalFeesETH',
  TotalFeesUsd = 'totalFeesUSD',
  TotalValueLockedEth = 'totalValueLockedETH',
  TotalValueLockedEthUntracked = 'totalValueLockedETHUntracked',
  TotalValueLockedUsd = 'totalValueLockedUSD',
  TotalValueLockedUsdUntracked = 'totalValueLockedUSDUntracked',
  TotalVolumeEth = 'totalVolumeETH',
  TotalVolumeUsd = 'totalVolumeUSD',
  TxCount = 'txCount',
  UntrackedVolumeUsd = 'untrackedVolumeUSD',
}

export type V3_Flash = {
  __typename?: 'v3_Flash'
  amount0: Scalars['v3_BigDecimal']
  amount0Paid: Scalars['v3_BigDecimal']
  amount1: Scalars['v3_BigDecimal']
  amount1Paid: Scalars['v3_BigDecimal']
  amountUSD: Scalars['v3_BigDecimal']
  id: Scalars['ID']
  logIndex?: Maybe<Scalars['v3_BigInt']>
  pool: V3_Pool
  recipient: Scalars['v3_Bytes']
  sender: Scalars['v3_Bytes']
  timestamp: Scalars['v3_BigInt']
  transaction: V3_Transaction
}

export type V3_Flash_Filter = {
  amount0?: Maybe<Scalars['v3_BigDecimal']>
  amount0Paid?: Maybe<Scalars['v3_BigDecimal']>
  amount0Paid_gt?: Maybe<Scalars['v3_BigDecimal']>
  amount0Paid_gte?: Maybe<Scalars['v3_BigDecimal']>
  amount0Paid_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  amount0Paid_lt?: Maybe<Scalars['v3_BigDecimal']>
  amount0Paid_lte?: Maybe<Scalars['v3_BigDecimal']>
  amount0Paid_not?: Maybe<Scalars['v3_BigDecimal']>
  amount0Paid_not_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  amount0_gt?: Maybe<Scalars['v3_BigDecimal']>
  amount0_gte?: Maybe<Scalars['v3_BigDecimal']>
  amount0_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  amount0_lt?: Maybe<Scalars['v3_BigDecimal']>
  amount0_lte?: Maybe<Scalars['v3_BigDecimal']>
  amount0_not?: Maybe<Scalars['v3_BigDecimal']>
  amount0_not_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  amount1?: Maybe<Scalars['v3_BigDecimal']>
  amount1Paid?: Maybe<Scalars['v3_BigDecimal']>
  amount1Paid_gt?: Maybe<Scalars['v3_BigDecimal']>
  amount1Paid_gte?: Maybe<Scalars['v3_BigDecimal']>
  amount1Paid_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  amount1Paid_lt?: Maybe<Scalars['v3_BigDecimal']>
  amount1Paid_lte?: Maybe<Scalars['v3_BigDecimal']>
  amount1Paid_not?: Maybe<Scalars['v3_BigDecimal']>
  amount1Paid_not_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  amount1_gt?: Maybe<Scalars['v3_BigDecimal']>
  amount1_gte?: Maybe<Scalars['v3_BigDecimal']>
  amount1_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  amount1_lt?: Maybe<Scalars['v3_BigDecimal']>
  amount1_lte?: Maybe<Scalars['v3_BigDecimal']>
  amount1_not?: Maybe<Scalars['v3_BigDecimal']>
  amount1_not_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  amountUSD?: Maybe<Scalars['v3_BigDecimal']>
  amountUSD_gt?: Maybe<Scalars['v3_BigDecimal']>
  amountUSD_gte?: Maybe<Scalars['v3_BigDecimal']>
  amountUSD_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  amountUSD_lt?: Maybe<Scalars['v3_BigDecimal']>
  amountUSD_lte?: Maybe<Scalars['v3_BigDecimal']>
  amountUSD_not?: Maybe<Scalars['v3_BigDecimal']>
  amountUSD_not_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  id?: Maybe<Scalars['ID']>
  id_gt?: Maybe<Scalars['ID']>
  id_gte?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  id_lt?: Maybe<Scalars['ID']>
  id_lte?: Maybe<Scalars['ID']>
  id_not?: Maybe<Scalars['ID']>
  id_not_in?: Maybe<Array<Scalars['ID']>>
  logIndex?: Maybe<Scalars['v3_BigInt']>
  logIndex_gt?: Maybe<Scalars['v3_BigInt']>
  logIndex_gte?: Maybe<Scalars['v3_BigInt']>
  logIndex_in?: Maybe<Array<Scalars['v3_BigInt']>>
  logIndex_lt?: Maybe<Scalars['v3_BigInt']>
  logIndex_lte?: Maybe<Scalars['v3_BigInt']>
  logIndex_not?: Maybe<Scalars['v3_BigInt']>
  logIndex_not_in?: Maybe<Array<Scalars['v3_BigInt']>>
  pool?: Maybe<Scalars['String']>
  pool_contains?: Maybe<Scalars['String']>
  pool_ends_with?: Maybe<Scalars['String']>
  pool_gt?: Maybe<Scalars['String']>
  pool_gte?: Maybe<Scalars['String']>
  pool_in?: Maybe<Array<Scalars['String']>>
  pool_lt?: Maybe<Scalars['String']>
  pool_lte?: Maybe<Scalars['String']>
  pool_not?: Maybe<Scalars['String']>
  pool_not_contains?: Maybe<Scalars['String']>
  pool_not_ends_with?: Maybe<Scalars['String']>
  pool_not_in?: Maybe<Array<Scalars['String']>>
  pool_not_starts_with?: Maybe<Scalars['String']>
  pool_starts_with?: Maybe<Scalars['String']>
  recipient?: Maybe<Scalars['v3_Bytes']>
  recipient_contains?: Maybe<Scalars['v3_Bytes']>
  recipient_in?: Maybe<Array<Scalars['v3_Bytes']>>
  recipient_not?: Maybe<Scalars['v3_Bytes']>
  recipient_not_contains?: Maybe<Scalars['v3_Bytes']>
  recipient_not_in?: Maybe<Array<Scalars['v3_Bytes']>>
  sender?: Maybe<Scalars['v3_Bytes']>
  sender_contains?: Maybe<Scalars['v3_Bytes']>
  sender_in?: Maybe<Array<Scalars['v3_Bytes']>>
  sender_not?: Maybe<Scalars['v3_Bytes']>
  sender_not_contains?: Maybe<Scalars['v3_Bytes']>
  sender_not_in?: Maybe<Array<Scalars['v3_Bytes']>>
  timestamp?: Maybe<Scalars['v3_BigInt']>
  timestamp_gt?: Maybe<Scalars['v3_BigInt']>
  timestamp_gte?: Maybe<Scalars['v3_BigInt']>
  timestamp_in?: Maybe<Array<Scalars['v3_BigInt']>>
  timestamp_lt?: Maybe<Scalars['v3_BigInt']>
  timestamp_lte?: Maybe<Scalars['v3_BigInt']>
  timestamp_not?: Maybe<Scalars['v3_BigInt']>
  timestamp_not_in?: Maybe<Array<Scalars['v3_BigInt']>>
  transaction?: Maybe<Scalars['String']>
  transaction_contains?: Maybe<Scalars['String']>
  transaction_ends_with?: Maybe<Scalars['String']>
  transaction_gt?: Maybe<Scalars['String']>
  transaction_gte?: Maybe<Scalars['String']>
  transaction_in?: Maybe<Array<Scalars['String']>>
  transaction_lt?: Maybe<Scalars['String']>
  transaction_lte?: Maybe<Scalars['String']>
  transaction_not?: Maybe<Scalars['String']>
  transaction_not_contains?: Maybe<Scalars['String']>
  transaction_not_ends_with?: Maybe<Scalars['String']>
  transaction_not_in?: Maybe<Array<Scalars['String']>>
  transaction_not_starts_with?: Maybe<Scalars['String']>
  transaction_starts_with?: Maybe<Scalars['String']>
}

export enum V3_Flash_OrderBy {
  Amount0 = 'amount0',
  Amount0Paid = 'amount0Paid',
  Amount1 = 'amount1',
  Amount1Paid = 'amount1Paid',
  AmountUsd = 'amountUSD',
  Id = 'id',
  LogIndex = 'logIndex',
  Pool = 'pool',
  Recipient = 'recipient',
  Sender = 'sender',
  Timestamp = 'timestamp',
  Transaction = 'transaction',
}

export type V3_Mint = {
  __typename?: 'v3_Mint'
  amount: Scalars['v3_BigInt']
  amount0: Scalars['v3_BigDecimal']
  amount1: Scalars['v3_BigDecimal']
  amountUSD?: Maybe<Scalars['v3_BigDecimal']>
  id: Scalars['ID']
  logIndex?: Maybe<Scalars['v3_BigInt']>
  origin: Scalars['v3_Bytes']
  owner: Scalars['v3_Bytes']
  pool: V3_Pool
  sender?: Maybe<Scalars['v3_Bytes']>
  tickLower: Scalars['v3_BigInt']
  tickUpper: Scalars['v3_BigInt']
  timestamp: Scalars['v3_BigInt']
  token0: V3_Token
  token1: V3_Token
  transaction: V3_Transaction
}

export type V3_Mint_Filter = {
  amount?: Maybe<Scalars['v3_BigInt']>
  amount0?: Maybe<Scalars['v3_BigDecimal']>
  amount0_gt?: Maybe<Scalars['v3_BigDecimal']>
  amount0_gte?: Maybe<Scalars['v3_BigDecimal']>
  amount0_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  amount0_lt?: Maybe<Scalars['v3_BigDecimal']>
  amount0_lte?: Maybe<Scalars['v3_BigDecimal']>
  amount0_not?: Maybe<Scalars['v3_BigDecimal']>
  amount0_not_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  amount1?: Maybe<Scalars['v3_BigDecimal']>
  amount1_gt?: Maybe<Scalars['v3_BigDecimal']>
  amount1_gte?: Maybe<Scalars['v3_BigDecimal']>
  amount1_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  amount1_lt?: Maybe<Scalars['v3_BigDecimal']>
  amount1_lte?: Maybe<Scalars['v3_BigDecimal']>
  amount1_not?: Maybe<Scalars['v3_BigDecimal']>
  amount1_not_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  amountUSD?: Maybe<Scalars['v3_BigDecimal']>
  amountUSD_gt?: Maybe<Scalars['v3_BigDecimal']>
  amountUSD_gte?: Maybe<Scalars['v3_BigDecimal']>
  amountUSD_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  amountUSD_lt?: Maybe<Scalars['v3_BigDecimal']>
  amountUSD_lte?: Maybe<Scalars['v3_BigDecimal']>
  amountUSD_not?: Maybe<Scalars['v3_BigDecimal']>
  amountUSD_not_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  amount_gt?: Maybe<Scalars['v3_BigInt']>
  amount_gte?: Maybe<Scalars['v3_BigInt']>
  amount_in?: Maybe<Array<Scalars['v3_BigInt']>>
  amount_lt?: Maybe<Scalars['v3_BigInt']>
  amount_lte?: Maybe<Scalars['v3_BigInt']>
  amount_not?: Maybe<Scalars['v3_BigInt']>
  amount_not_in?: Maybe<Array<Scalars['v3_BigInt']>>
  id?: Maybe<Scalars['ID']>
  id_gt?: Maybe<Scalars['ID']>
  id_gte?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  id_lt?: Maybe<Scalars['ID']>
  id_lte?: Maybe<Scalars['ID']>
  id_not?: Maybe<Scalars['ID']>
  id_not_in?: Maybe<Array<Scalars['ID']>>
  logIndex?: Maybe<Scalars['v3_BigInt']>
  logIndex_gt?: Maybe<Scalars['v3_BigInt']>
  logIndex_gte?: Maybe<Scalars['v3_BigInt']>
  logIndex_in?: Maybe<Array<Scalars['v3_BigInt']>>
  logIndex_lt?: Maybe<Scalars['v3_BigInt']>
  logIndex_lte?: Maybe<Scalars['v3_BigInt']>
  logIndex_not?: Maybe<Scalars['v3_BigInt']>
  logIndex_not_in?: Maybe<Array<Scalars['v3_BigInt']>>
  origin?: Maybe<Scalars['v3_Bytes']>
  origin_contains?: Maybe<Scalars['v3_Bytes']>
  origin_in?: Maybe<Array<Scalars['v3_Bytes']>>
  origin_not?: Maybe<Scalars['v3_Bytes']>
  origin_not_contains?: Maybe<Scalars['v3_Bytes']>
  origin_not_in?: Maybe<Array<Scalars['v3_Bytes']>>
  owner?: Maybe<Scalars['v3_Bytes']>
  owner_contains?: Maybe<Scalars['v3_Bytes']>
  owner_in?: Maybe<Array<Scalars['v3_Bytes']>>
  owner_not?: Maybe<Scalars['v3_Bytes']>
  owner_not_contains?: Maybe<Scalars['v3_Bytes']>
  owner_not_in?: Maybe<Array<Scalars['v3_Bytes']>>
  pool?: Maybe<Scalars['String']>
  pool_contains?: Maybe<Scalars['String']>
  pool_ends_with?: Maybe<Scalars['String']>
  pool_gt?: Maybe<Scalars['String']>
  pool_gte?: Maybe<Scalars['String']>
  pool_in?: Maybe<Array<Scalars['String']>>
  pool_lt?: Maybe<Scalars['String']>
  pool_lte?: Maybe<Scalars['String']>
  pool_not?: Maybe<Scalars['String']>
  pool_not_contains?: Maybe<Scalars['String']>
  pool_not_ends_with?: Maybe<Scalars['String']>
  pool_not_in?: Maybe<Array<Scalars['String']>>
  pool_not_starts_with?: Maybe<Scalars['String']>
  pool_starts_with?: Maybe<Scalars['String']>
  sender?: Maybe<Scalars['v3_Bytes']>
  sender_contains?: Maybe<Scalars['v3_Bytes']>
  sender_in?: Maybe<Array<Scalars['v3_Bytes']>>
  sender_not?: Maybe<Scalars['v3_Bytes']>
  sender_not_contains?: Maybe<Scalars['v3_Bytes']>
  sender_not_in?: Maybe<Array<Scalars['v3_Bytes']>>
  tickLower?: Maybe<Scalars['v3_BigInt']>
  tickLower_gt?: Maybe<Scalars['v3_BigInt']>
  tickLower_gte?: Maybe<Scalars['v3_BigInt']>
  tickLower_in?: Maybe<Array<Scalars['v3_BigInt']>>
  tickLower_lt?: Maybe<Scalars['v3_BigInt']>
  tickLower_lte?: Maybe<Scalars['v3_BigInt']>
  tickLower_not?: Maybe<Scalars['v3_BigInt']>
  tickLower_not_in?: Maybe<Array<Scalars['v3_BigInt']>>
  tickUpper?: Maybe<Scalars['v3_BigInt']>
  tickUpper_gt?: Maybe<Scalars['v3_BigInt']>
  tickUpper_gte?: Maybe<Scalars['v3_BigInt']>
  tickUpper_in?: Maybe<Array<Scalars['v3_BigInt']>>
  tickUpper_lt?: Maybe<Scalars['v3_BigInt']>
  tickUpper_lte?: Maybe<Scalars['v3_BigInt']>
  tickUpper_not?: Maybe<Scalars['v3_BigInt']>
  tickUpper_not_in?: Maybe<Array<Scalars['v3_BigInt']>>
  timestamp?: Maybe<Scalars['v3_BigInt']>
  timestamp_gt?: Maybe<Scalars['v3_BigInt']>
  timestamp_gte?: Maybe<Scalars['v3_BigInt']>
  timestamp_in?: Maybe<Array<Scalars['v3_BigInt']>>
  timestamp_lt?: Maybe<Scalars['v3_BigInt']>
  timestamp_lte?: Maybe<Scalars['v3_BigInt']>
  timestamp_not?: Maybe<Scalars['v3_BigInt']>
  timestamp_not_in?: Maybe<Array<Scalars['v3_BigInt']>>
  token0?: Maybe<Scalars['String']>
  token0_contains?: Maybe<Scalars['String']>
  token0_ends_with?: Maybe<Scalars['String']>
  token0_gt?: Maybe<Scalars['String']>
  token0_gte?: Maybe<Scalars['String']>
  token0_in?: Maybe<Array<Scalars['String']>>
  token0_lt?: Maybe<Scalars['String']>
  token0_lte?: Maybe<Scalars['String']>
  token0_not?: Maybe<Scalars['String']>
  token0_not_contains?: Maybe<Scalars['String']>
  token0_not_ends_with?: Maybe<Scalars['String']>
  token0_not_in?: Maybe<Array<Scalars['String']>>
  token0_not_starts_with?: Maybe<Scalars['String']>
  token0_starts_with?: Maybe<Scalars['String']>
  token1?: Maybe<Scalars['String']>
  token1_contains?: Maybe<Scalars['String']>
  token1_ends_with?: Maybe<Scalars['String']>
  token1_gt?: Maybe<Scalars['String']>
  token1_gte?: Maybe<Scalars['String']>
  token1_in?: Maybe<Array<Scalars['String']>>
  token1_lt?: Maybe<Scalars['String']>
  token1_lte?: Maybe<Scalars['String']>
  token1_not?: Maybe<Scalars['String']>
  token1_not_contains?: Maybe<Scalars['String']>
  token1_not_ends_with?: Maybe<Scalars['String']>
  token1_not_in?: Maybe<Array<Scalars['String']>>
  token1_not_starts_with?: Maybe<Scalars['String']>
  token1_starts_with?: Maybe<Scalars['String']>
  transaction?: Maybe<Scalars['String']>
  transaction_contains?: Maybe<Scalars['String']>
  transaction_ends_with?: Maybe<Scalars['String']>
  transaction_gt?: Maybe<Scalars['String']>
  transaction_gte?: Maybe<Scalars['String']>
  transaction_in?: Maybe<Array<Scalars['String']>>
  transaction_lt?: Maybe<Scalars['String']>
  transaction_lte?: Maybe<Scalars['String']>
  transaction_not?: Maybe<Scalars['String']>
  transaction_not_contains?: Maybe<Scalars['String']>
  transaction_not_ends_with?: Maybe<Scalars['String']>
  transaction_not_in?: Maybe<Array<Scalars['String']>>
  transaction_not_starts_with?: Maybe<Scalars['String']>
  transaction_starts_with?: Maybe<Scalars['String']>
}

export enum V3_Mint_OrderBy {
  Amount = 'amount',
  Amount0 = 'amount0',
  Amount1 = 'amount1',
  AmountUsd = 'amountUSD',
  Id = 'id',
  LogIndex = 'logIndex',
  Origin = 'origin',
  Owner = 'owner',
  Pool = 'pool',
  Sender = 'sender',
  TickLower = 'tickLower',
  TickUpper = 'tickUpper',
  Timestamp = 'timestamp',
  Token0 = 'token0',
  Token1 = 'token1',
  Transaction = 'transaction',
}

export enum V3_OrderDirection {
  Asc = 'asc',
  Desc = 'desc',
}

export type V3_Pool = {
  __typename?: 'v3_Pool'
  burns: Array<V3_Burn>
  collectedFeesToken0: Scalars['v3_BigDecimal']
  collectedFeesToken1: Scalars['v3_BigDecimal']
  collectedFeesUSD: Scalars['v3_BigDecimal']
  collects: Array<V3_Collect>
  createdAtBlockNumber: Scalars['v3_BigInt']
  createdAtTimestamp: Scalars['v3_BigInt']
  feeGrowthGlobal0X128: Scalars['v3_BigInt']
  feeGrowthGlobal1X128: Scalars['v3_BigInt']
  feeTier: Scalars['v3_BigInt']
  feesUSD: Scalars['v3_BigDecimal']
  id: Scalars['ID']
  liquidity: Scalars['v3_BigInt']
  liquidityProviderCount: Scalars['v3_BigInt']
  mints: Array<V3_Mint>
  observationIndex: Scalars['v3_BigInt']
  poolDayData: Array<V3_PoolDayData>
  poolHourData: Array<V3_PoolHourData>
  sqrtPrice: Scalars['v3_BigInt']
  swaps: Array<V3_Swap>
  tick?: Maybe<Scalars['v3_BigInt']>
  ticks: Array<V3_Tick>
  token0: V3_Token
  token0Price: Scalars['v3_BigDecimal']
  token1: V3_Token
  token1Price: Scalars['v3_BigDecimal']
  totalValueLockedETH: Scalars['v3_BigDecimal']
  totalValueLockedToken0: Scalars['v3_BigDecimal']
  totalValueLockedToken1: Scalars['v3_BigDecimal']
  totalValueLockedUSD: Scalars['v3_BigDecimal']
  totalValueLockedUSDUntracked: Scalars['v3_BigDecimal']
  txCount: Scalars['v3_BigInt']
  untrackedVolumeUSD: Scalars['v3_BigDecimal']
  volumeToken0: Scalars['v3_BigDecimal']
  volumeToken1: Scalars['v3_BigDecimal']
  volumeUSD: Scalars['v3_BigDecimal']
}

export type V3_PoolBurnsArgs = {
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3_Burn_OrderBy>
  orderDirection?: Maybe<V3_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  where?: Maybe<V3_Burn_Filter>
}

export type V3_PoolCollectsArgs = {
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3_Collect_OrderBy>
  orderDirection?: Maybe<V3_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  where?: Maybe<V3_Collect_Filter>
}

export type V3_PoolMintsArgs = {
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3_Mint_OrderBy>
  orderDirection?: Maybe<V3_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  where?: Maybe<V3_Mint_Filter>
}

export type V3_PoolPoolDayDataArgs = {
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3_PoolDayData_OrderBy>
  orderDirection?: Maybe<V3_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  where?: Maybe<V3_PoolDayData_Filter>
}

export type V3_PoolPoolHourDataArgs = {
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3_PoolHourData_OrderBy>
  orderDirection?: Maybe<V3_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  where?: Maybe<V3_PoolHourData_Filter>
}

export type V3_PoolSwapsArgs = {
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3_Swap_OrderBy>
  orderDirection?: Maybe<V3_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  where?: Maybe<V3_Swap_Filter>
}

export type V3_PoolTicksArgs = {
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3_Tick_OrderBy>
  orderDirection?: Maybe<V3_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  where?: Maybe<V3_Tick_Filter>
}

export type V3_PoolDayData = {
  __typename?: 'v3_PoolDayData'
  close: Scalars['v3_BigDecimal']
  date: Scalars['Int']
  feeGrowthGlobal0X128: Scalars['v3_BigInt']
  feeGrowthGlobal1X128: Scalars['v3_BigInt']
  feesUSD: Scalars['v3_BigDecimal']
  high: Scalars['v3_BigDecimal']
  id: Scalars['ID']
  liquidity: Scalars['v3_BigInt']
  low: Scalars['v3_BigDecimal']
  open: Scalars['v3_BigDecimal']
  pool: V3_Pool
  sqrtPrice: Scalars['v3_BigInt']
  tick?: Maybe<Scalars['v3_BigInt']>
  token0Price: Scalars['v3_BigDecimal']
  token1Price: Scalars['v3_BigDecimal']
  tvlUSD: Scalars['v3_BigDecimal']
  txCount: Scalars['v3_BigInt']
  volumeToken0: Scalars['v3_BigDecimal']
  volumeToken1: Scalars['v3_BigDecimal']
  volumeUSD: Scalars['v3_BigDecimal']
}

export type V3_PoolDayData_Filter = {
  close?: Maybe<Scalars['v3_BigDecimal']>
  close_gt?: Maybe<Scalars['v3_BigDecimal']>
  close_gte?: Maybe<Scalars['v3_BigDecimal']>
  close_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  close_lt?: Maybe<Scalars['v3_BigDecimal']>
  close_lte?: Maybe<Scalars['v3_BigDecimal']>
  close_not?: Maybe<Scalars['v3_BigDecimal']>
  close_not_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  date?: Maybe<Scalars['Int']>
  date_gt?: Maybe<Scalars['Int']>
  date_gte?: Maybe<Scalars['Int']>
  date_in?: Maybe<Array<Scalars['Int']>>
  date_lt?: Maybe<Scalars['Int']>
  date_lte?: Maybe<Scalars['Int']>
  date_not?: Maybe<Scalars['Int']>
  date_not_in?: Maybe<Array<Scalars['Int']>>
  feeGrowthGlobal0X128?: Maybe<Scalars['v3_BigInt']>
  feeGrowthGlobal0X128_gt?: Maybe<Scalars['v3_BigInt']>
  feeGrowthGlobal0X128_gte?: Maybe<Scalars['v3_BigInt']>
  feeGrowthGlobal0X128_in?: Maybe<Array<Scalars['v3_BigInt']>>
  feeGrowthGlobal0X128_lt?: Maybe<Scalars['v3_BigInt']>
  feeGrowthGlobal0X128_lte?: Maybe<Scalars['v3_BigInt']>
  feeGrowthGlobal0X128_not?: Maybe<Scalars['v3_BigInt']>
  feeGrowthGlobal0X128_not_in?: Maybe<Array<Scalars['v3_BigInt']>>
  feeGrowthGlobal1X128?: Maybe<Scalars['v3_BigInt']>
  feeGrowthGlobal1X128_gt?: Maybe<Scalars['v3_BigInt']>
  feeGrowthGlobal1X128_gte?: Maybe<Scalars['v3_BigInt']>
  feeGrowthGlobal1X128_in?: Maybe<Array<Scalars['v3_BigInt']>>
  feeGrowthGlobal1X128_lt?: Maybe<Scalars['v3_BigInt']>
  feeGrowthGlobal1X128_lte?: Maybe<Scalars['v3_BigInt']>
  feeGrowthGlobal1X128_not?: Maybe<Scalars['v3_BigInt']>
  feeGrowthGlobal1X128_not_in?: Maybe<Array<Scalars['v3_BigInt']>>
  feesUSD?: Maybe<Scalars['v3_BigDecimal']>
  feesUSD_gt?: Maybe<Scalars['v3_BigDecimal']>
  feesUSD_gte?: Maybe<Scalars['v3_BigDecimal']>
  feesUSD_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  feesUSD_lt?: Maybe<Scalars['v3_BigDecimal']>
  feesUSD_lte?: Maybe<Scalars['v3_BigDecimal']>
  feesUSD_not?: Maybe<Scalars['v3_BigDecimal']>
  feesUSD_not_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  high?: Maybe<Scalars['v3_BigDecimal']>
  high_gt?: Maybe<Scalars['v3_BigDecimal']>
  high_gte?: Maybe<Scalars['v3_BigDecimal']>
  high_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  high_lt?: Maybe<Scalars['v3_BigDecimal']>
  high_lte?: Maybe<Scalars['v3_BigDecimal']>
  high_not?: Maybe<Scalars['v3_BigDecimal']>
  high_not_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  id?: Maybe<Scalars['ID']>
  id_gt?: Maybe<Scalars['ID']>
  id_gte?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  id_lt?: Maybe<Scalars['ID']>
  id_lte?: Maybe<Scalars['ID']>
  id_not?: Maybe<Scalars['ID']>
  id_not_in?: Maybe<Array<Scalars['ID']>>
  liquidity?: Maybe<Scalars['v3_BigInt']>
  liquidity_gt?: Maybe<Scalars['v3_BigInt']>
  liquidity_gte?: Maybe<Scalars['v3_BigInt']>
  liquidity_in?: Maybe<Array<Scalars['v3_BigInt']>>
  liquidity_lt?: Maybe<Scalars['v3_BigInt']>
  liquidity_lte?: Maybe<Scalars['v3_BigInt']>
  liquidity_not?: Maybe<Scalars['v3_BigInt']>
  liquidity_not_in?: Maybe<Array<Scalars['v3_BigInt']>>
  low?: Maybe<Scalars['v3_BigDecimal']>
  low_gt?: Maybe<Scalars['v3_BigDecimal']>
  low_gte?: Maybe<Scalars['v3_BigDecimal']>
  low_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  low_lt?: Maybe<Scalars['v3_BigDecimal']>
  low_lte?: Maybe<Scalars['v3_BigDecimal']>
  low_not?: Maybe<Scalars['v3_BigDecimal']>
  low_not_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  open?: Maybe<Scalars['v3_BigDecimal']>
  open_gt?: Maybe<Scalars['v3_BigDecimal']>
  open_gte?: Maybe<Scalars['v3_BigDecimal']>
  open_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  open_lt?: Maybe<Scalars['v3_BigDecimal']>
  open_lte?: Maybe<Scalars['v3_BigDecimal']>
  open_not?: Maybe<Scalars['v3_BigDecimal']>
  open_not_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  pool?: Maybe<Scalars['String']>
  pool_contains?: Maybe<Scalars['String']>
  pool_ends_with?: Maybe<Scalars['String']>
  pool_gt?: Maybe<Scalars['String']>
  pool_gte?: Maybe<Scalars['String']>
  pool_in?: Maybe<Array<Scalars['String']>>
  pool_lt?: Maybe<Scalars['String']>
  pool_lte?: Maybe<Scalars['String']>
  pool_not?: Maybe<Scalars['String']>
  pool_not_contains?: Maybe<Scalars['String']>
  pool_not_ends_with?: Maybe<Scalars['String']>
  pool_not_in?: Maybe<Array<Scalars['String']>>
  pool_not_starts_with?: Maybe<Scalars['String']>
  pool_starts_with?: Maybe<Scalars['String']>
  sqrtPrice?: Maybe<Scalars['v3_BigInt']>
  sqrtPrice_gt?: Maybe<Scalars['v3_BigInt']>
  sqrtPrice_gte?: Maybe<Scalars['v3_BigInt']>
  sqrtPrice_in?: Maybe<Array<Scalars['v3_BigInt']>>
  sqrtPrice_lt?: Maybe<Scalars['v3_BigInt']>
  sqrtPrice_lte?: Maybe<Scalars['v3_BigInt']>
  sqrtPrice_not?: Maybe<Scalars['v3_BigInt']>
  sqrtPrice_not_in?: Maybe<Array<Scalars['v3_BigInt']>>
  tick?: Maybe<Scalars['v3_BigInt']>
  tick_gt?: Maybe<Scalars['v3_BigInt']>
  tick_gte?: Maybe<Scalars['v3_BigInt']>
  tick_in?: Maybe<Array<Scalars['v3_BigInt']>>
  tick_lt?: Maybe<Scalars['v3_BigInt']>
  tick_lte?: Maybe<Scalars['v3_BigInt']>
  tick_not?: Maybe<Scalars['v3_BigInt']>
  tick_not_in?: Maybe<Array<Scalars['v3_BigInt']>>
  token0Price?: Maybe<Scalars['v3_BigDecimal']>
  token0Price_gt?: Maybe<Scalars['v3_BigDecimal']>
  token0Price_gte?: Maybe<Scalars['v3_BigDecimal']>
  token0Price_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  token0Price_lt?: Maybe<Scalars['v3_BigDecimal']>
  token0Price_lte?: Maybe<Scalars['v3_BigDecimal']>
  token0Price_not?: Maybe<Scalars['v3_BigDecimal']>
  token0Price_not_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  token1Price?: Maybe<Scalars['v3_BigDecimal']>
  token1Price_gt?: Maybe<Scalars['v3_BigDecimal']>
  token1Price_gte?: Maybe<Scalars['v3_BigDecimal']>
  token1Price_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  token1Price_lt?: Maybe<Scalars['v3_BigDecimal']>
  token1Price_lte?: Maybe<Scalars['v3_BigDecimal']>
  token1Price_not?: Maybe<Scalars['v3_BigDecimal']>
  token1Price_not_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  tvlUSD?: Maybe<Scalars['v3_BigDecimal']>
  tvlUSD_gt?: Maybe<Scalars['v3_BigDecimal']>
  tvlUSD_gte?: Maybe<Scalars['v3_BigDecimal']>
  tvlUSD_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  tvlUSD_lt?: Maybe<Scalars['v3_BigDecimal']>
  tvlUSD_lte?: Maybe<Scalars['v3_BigDecimal']>
  tvlUSD_not?: Maybe<Scalars['v3_BigDecimal']>
  tvlUSD_not_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  txCount?: Maybe<Scalars['v3_BigInt']>
  txCount_gt?: Maybe<Scalars['v3_BigInt']>
  txCount_gte?: Maybe<Scalars['v3_BigInt']>
  txCount_in?: Maybe<Array<Scalars['v3_BigInt']>>
  txCount_lt?: Maybe<Scalars['v3_BigInt']>
  txCount_lte?: Maybe<Scalars['v3_BigInt']>
  txCount_not?: Maybe<Scalars['v3_BigInt']>
  txCount_not_in?: Maybe<Array<Scalars['v3_BigInt']>>
  volumeToken0?: Maybe<Scalars['v3_BigDecimal']>
  volumeToken0_gt?: Maybe<Scalars['v3_BigDecimal']>
  volumeToken0_gte?: Maybe<Scalars['v3_BigDecimal']>
  volumeToken0_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  volumeToken0_lt?: Maybe<Scalars['v3_BigDecimal']>
  volumeToken0_lte?: Maybe<Scalars['v3_BigDecimal']>
  volumeToken0_not?: Maybe<Scalars['v3_BigDecimal']>
  volumeToken0_not_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  volumeToken1?: Maybe<Scalars['v3_BigDecimal']>
  volumeToken1_gt?: Maybe<Scalars['v3_BigDecimal']>
  volumeToken1_gte?: Maybe<Scalars['v3_BigDecimal']>
  volumeToken1_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  volumeToken1_lt?: Maybe<Scalars['v3_BigDecimal']>
  volumeToken1_lte?: Maybe<Scalars['v3_BigDecimal']>
  volumeToken1_not?: Maybe<Scalars['v3_BigDecimal']>
  volumeToken1_not_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  volumeUSD?: Maybe<Scalars['v3_BigDecimal']>
  volumeUSD_gt?: Maybe<Scalars['v3_BigDecimal']>
  volumeUSD_gte?: Maybe<Scalars['v3_BigDecimal']>
  volumeUSD_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  volumeUSD_lt?: Maybe<Scalars['v3_BigDecimal']>
  volumeUSD_lte?: Maybe<Scalars['v3_BigDecimal']>
  volumeUSD_not?: Maybe<Scalars['v3_BigDecimal']>
  volumeUSD_not_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
}

export enum V3_PoolDayData_OrderBy {
  Close = 'close',
  Date = 'date',
  FeeGrowthGlobal0X128 = 'feeGrowthGlobal0X128',
  FeeGrowthGlobal1X128 = 'feeGrowthGlobal1X128',
  FeesUsd = 'feesUSD',
  High = 'high',
  Id = 'id',
  Liquidity = 'liquidity',
  Low = 'low',
  Open = 'open',
  Pool = 'pool',
  SqrtPrice = 'sqrtPrice',
  Tick = 'tick',
  Token0Price = 'token0Price',
  Token1Price = 'token1Price',
  TvlUsd = 'tvlUSD',
  TxCount = 'txCount',
  VolumeToken0 = 'volumeToken0',
  VolumeToken1 = 'volumeToken1',
  VolumeUsd = 'volumeUSD',
}

export type V3_PoolHourData = {
  __typename?: 'v3_PoolHourData'
  close: Scalars['v3_BigDecimal']
  feeGrowthGlobal0X128: Scalars['v3_BigInt']
  feeGrowthGlobal1X128: Scalars['v3_BigInt']
  feesUSD: Scalars['v3_BigDecimal']
  high: Scalars['v3_BigDecimal']
  id: Scalars['ID']
  liquidity: Scalars['v3_BigInt']
  low: Scalars['v3_BigDecimal']
  open: Scalars['v3_BigDecimal']
  periodStartUnix: Scalars['Int']
  pool: V3_Pool
  sqrtPrice: Scalars['v3_BigInt']
  tick?: Maybe<Scalars['v3_BigInt']>
  token0Price: Scalars['v3_BigDecimal']
  token1Price: Scalars['v3_BigDecimal']
  tvlUSD: Scalars['v3_BigDecimal']
  txCount: Scalars['v3_BigInt']
  volumeToken0: Scalars['v3_BigDecimal']
  volumeToken1: Scalars['v3_BigDecimal']
  volumeUSD: Scalars['v3_BigDecimal']
}

export type V3_PoolHourData_Filter = {
  close?: Maybe<Scalars['v3_BigDecimal']>
  close_gt?: Maybe<Scalars['v3_BigDecimal']>
  close_gte?: Maybe<Scalars['v3_BigDecimal']>
  close_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  close_lt?: Maybe<Scalars['v3_BigDecimal']>
  close_lte?: Maybe<Scalars['v3_BigDecimal']>
  close_not?: Maybe<Scalars['v3_BigDecimal']>
  close_not_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  feeGrowthGlobal0X128?: Maybe<Scalars['v3_BigInt']>
  feeGrowthGlobal0X128_gt?: Maybe<Scalars['v3_BigInt']>
  feeGrowthGlobal0X128_gte?: Maybe<Scalars['v3_BigInt']>
  feeGrowthGlobal0X128_in?: Maybe<Array<Scalars['v3_BigInt']>>
  feeGrowthGlobal0X128_lt?: Maybe<Scalars['v3_BigInt']>
  feeGrowthGlobal0X128_lte?: Maybe<Scalars['v3_BigInt']>
  feeGrowthGlobal0X128_not?: Maybe<Scalars['v3_BigInt']>
  feeGrowthGlobal0X128_not_in?: Maybe<Array<Scalars['v3_BigInt']>>
  feeGrowthGlobal1X128?: Maybe<Scalars['v3_BigInt']>
  feeGrowthGlobal1X128_gt?: Maybe<Scalars['v3_BigInt']>
  feeGrowthGlobal1X128_gte?: Maybe<Scalars['v3_BigInt']>
  feeGrowthGlobal1X128_in?: Maybe<Array<Scalars['v3_BigInt']>>
  feeGrowthGlobal1X128_lt?: Maybe<Scalars['v3_BigInt']>
  feeGrowthGlobal1X128_lte?: Maybe<Scalars['v3_BigInt']>
  feeGrowthGlobal1X128_not?: Maybe<Scalars['v3_BigInt']>
  feeGrowthGlobal1X128_not_in?: Maybe<Array<Scalars['v3_BigInt']>>
  feesUSD?: Maybe<Scalars['v3_BigDecimal']>
  feesUSD_gt?: Maybe<Scalars['v3_BigDecimal']>
  feesUSD_gte?: Maybe<Scalars['v3_BigDecimal']>
  feesUSD_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  feesUSD_lt?: Maybe<Scalars['v3_BigDecimal']>
  feesUSD_lte?: Maybe<Scalars['v3_BigDecimal']>
  feesUSD_not?: Maybe<Scalars['v3_BigDecimal']>
  feesUSD_not_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  high?: Maybe<Scalars['v3_BigDecimal']>
  high_gt?: Maybe<Scalars['v3_BigDecimal']>
  high_gte?: Maybe<Scalars['v3_BigDecimal']>
  high_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  high_lt?: Maybe<Scalars['v3_BigDecimal']>
  high_lte?: Maybe<Scalars['v3_BigDecimal']>
  high_not?: Maybe<Scalars['v3_BigDecimal']>
  high_not_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  id?: Maybe<Scalars['ID']>
  id_gt?: Maybe<Scalars['ID']>
  id_gte?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  id_lt?: Maybe<Scalars['ID']>
  id_lte?: Maybe<Scalars['ID']>
  id_not?: Maybe<Scalars['ID']>
  id_not_in?: Maybe<Array<Scalars['ID']>>
  liquidity?: Maybe<Scalars['v3_BigInt']>
  liquidity_gt?: Maybe<Scalars['v3_BigInt']>
  liquidity_gte?: Maybe<Scalars['v3_BigInt']>
  liquidity_in?: Maybe<Array<Scalars['v3_BigInt']>>
  liquidity_lt?: Maybe<Scalars['v3_BigInt']>
  liquidity_lte?: Maybe<Scalars['v3_BigInt']>
  liquidity_not?: Maybe<Scalars['v3_BigInt']>
  liquidity_not_in?: Maybe<Array<Scalars['v3_BigInt']>>
  low?: Maybe<Scalars['v3_BigDecimal']>
  low_gt?: Maybe<Scalars['v3_BigDecimal']>
  low_gte?: Maybe<Scalars['v3_BigDecimal']>
  low_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  low_lt?: Maybe<Scalars['v3_BigDecimal']>
  low_lte?: Maybe<Scalars['v3_BigDecimal']>
  low_not?: Maybe<Scalars['v3_BigDecimal']>
  low_not_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  open?: Maybe<Scalars['v3_BigDecimal']>
  open_gt?: Maybe<Scalars['v3_BigDecimal']>
  open_gte?: Maybe<Scalars['v3_BigDecimal']>
  open_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  open_lt?: Maybe<Scalars['v3_BigDecimal']>
  open_lte?: Maybe<Scalars['v3_BigDecimal']>
  open_not?: Maybe<Scalars['v3_BigDecimal']>
  open_not_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  periodStartUnix?: Maybe<Scalars['Int']>
  periodStartUnix_gt?: Maybe<Scalars['Int']>
  periodStartUnix_gte?: Maybe<Scalars['Int']>
  periodStartUnix_in?: Maybe<Array<Scalars['Int']>>
  periodStartUnix_lt?: Maybe<Scalars['Int']>
  periodStartUnix_lte?: Maybe<Scalars['Int']>
  periodStartUnix_not?: Maybe<Scalars['Int']>
  periodStartUnix_not_in?: Maybe<Array<Scalars['Int']>>
  pool?: Maybe<Scalars['String']>
  pool_contains?: Maybe<Scalars['String']>
  pool_ends_with?: Maybe<Scalars['String']>
  pool_gt?: Maybe<Scalars['String']>
  pool_gte?: Maybe<Scalars['String']>
  pool_in?: Maybe<Array<Scalars['String']>>
  pool_lt?: Maybe<Scalars['String']>
  pool_lte?: Maybe<Scalars['String']>
  pool_not?: Maybe<Scalars['String']>
  pool_not_contains?: Maybe<Scalars['String']>
  pool_not_ends_with?: Maybe<Scalars['String']>
  pool_not_in?: Maybe<Array<Scalars['String']>>
  pool_not_starts_with?: Maybe<Scalars['String']>
  pool_starts_with?: Maybe<Scalars['String']>
  sqrtPrice?: Maybe<Scalars['v3_BigInt']>
  sqrtPrice_gt?: Maybe<Scalars['v3_BigInt']>
  sqrtPrice_gte?: Maybe<Scalars['v3_BigInt']>
  sqrtPrice_in?: Maybe<Array<Scalars['v3_BigInt']>>
  sqrtPrice_lt?: Maybe<Scalars['v3_BigInt']>
  sqrtPrice_lte?: Maybe<Scalars['v3_BigInt']>
  sqrtPrice_not?: Maybe<Scalars['v3_BigInt']>
  sqrtPrice_not_in?: Maybe<Array<Scalars['v3_BigInt']>>
  tick?: Maybe<Scalars['v3_BigInt']>
  tick_gt?: Maybe<Scalars['v3_BigInt']>
  tick_gte?: Maybe<Scalars['v3_BigInt']>
  tick_in?: Maybe<Array<Scalars['v3_BigInt']>>
  tick_lt?: Maybe<Scalars['v3_BigInt']>
  tick_lte?: Maybe<Scalars['v3_BigInt']>
  tick_not?: Maybe<Scalars['v3_BigInt']>
  tick_not_in?: Maybe<Array<Scalars['v3_BigInt']>>
  token0Price?: Maybe<Scalars['v3_BigDecimal']>
  token0Price_gt?: Maybe<Scalars['v3_BigDecimal']>
  token0Price_gte?: Maybe<Scalars['v3_BigDecimal']>
  token0Price_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  token0Price_lt?: Maybe<Scalars['v3_BigDecimal']>
  token0Price_lte?: Maybe<Scalars['v3_BigDecimal']>
  token0Price_not?: Maybe<Scalars['v3_BigDecimal']>
  token0Price_not_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  token1Price?: Maybe<Scalars['v3_BigDecimal']>
  token1Price_gt?: Maybe<Scalars['v3_BigDecimal']>
  token1Price_gte?: Maybe<Scalars['v3_BigDecimal']>
  token1Price_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  token1Price_lt?: Maybe<Scalars['v3_BigDecimal']>
  token1Price_lte?: Maybe<Scalars['v3_BigDecimal']>
  token1Price_not?: Maybe<Scalars['v3_BigDecimal']>
  token1Price_not_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  tvlUSD?: Maybe<Scalars['v3_BigDecimal']>
  tvlUSD_gt?: Maybe<Scalars['v3_BigDecimal']>
  tvlUSD_gte?: Maybe<Scalars['v3_BigDecimal']>
  tvlUSD_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  tvlUSD_lt?: Maybe<Scalars['v3_BigDecimal']>
  tvlUSD_lte?: Maybe<Scalars['v3_BigDecimal']>
  tvlUSD_not?: Maybe<Scalars['v3_BigDecimal']>
  tvlUSD_not_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  txCount?: Maybe<Scalars['v3_BigInt']>
  txCount_gt?: Maybe<Scalars['v3_BigInt']>
  txCount_gte?: Maybe<Scalars['v3_BigInt']>
  txCount_in?: Maybe<Array<Scalars['v3_BigInt']>>
  txCount_lt?: Maybe<Scalars['v3_BigInt']>
  txCount_lte?: Maybe<Scalars['v3_BigInt']>
  txCount_not?: Maybe<Scalars['v3_BigInt']>
  txCount_not_in?: Maybe<Array<Scalars['v3_BigInt']>>
  volumeToken0?: Maybe<Scalars['v3_BigDecimal']>
  volumeToken0_gt?: Maybe<Scalars['v3_BigDecimal']>
  volumeToken0_gte?: Maybe<Scalars['v3_BigDecimal']>
  volumeToken0_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  volumeToken0_lt?: Maybe<Scalars['v3_BigDecimal']>
  volumeToken0_lte?: Maybe<Scalars['v3_BigDecimal']>
  volumeToken0_not?: Maybe<Scalars['v3_BigDecimal']>
  volumeToken0_not_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  volumeToken1?: Maybe<Scalars['v3_BigDecimal']>
  volumeToken1_gt?: Maybe<Scalars['v3_BigDecimal']>
  volumeToken1_gte?: Maybe<Scalars['v3_BigDecimal']>
  volumeToken1_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  volumeToken1_lt?: Maybe<Scalars['v3_BigDecimal']>
  volumeToken1_lte?: Maybe<Scalars['v3_BigDecimal']>
  volumeToken1_not?: Maybe<Scalars['v3_BigDecimal']>
  volumeToken1_not_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  volumeUSD?: Maybe<Scalars['v3_BigDecimal']>
  volumeUSD_gt?: Maybe<Scalars['v3_BigDecimal']>
  volumeUSD_gte?: Maybe<Scalars['v3_BigDecimal']>
  volumeUSD_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  volumeUSD_lt?: Maybe<Scalars['v3_BigDecimal']>
  volumeUSD_lte?: Maybe<Scalars['v3_BigDecimal']>
  volumeUSD_not?: Maybe<Scalars['v3_BigDecimal']>
  volumeUSD_not_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
}

export enum V3_PoolHourData_OrderBy {
  Close = 'close',
  FeeGrowthGlobal0X128 = 'feeGrowthGlobal0X128',
  FeeGrowthGlobal1X128 = 'feeGrowthGlobal1X128',
  FeesUsd = 'feesUSD',
  High = 'high',
  Id = 'id',
  Liquidity = 'liquidity',
  Low = 'low',
  Open = 'open',
  PeriodStartUnix = 'periodStartUnix',
  Pool = 'pool',
  SqrtPrice = 'sqrtPrice',
  Tick = 'tick',
  Token0Price = 'token0Price',
  Token1Price = 'token1Price',
  TvlUsd = 'tvlUSD',
  TxCount = 'txCount',
  VolumeToken0 = 'volumeToken0',
  VolumeToken1 = 'volumeToken1',
  VolumeUsd = 'volumeUSD',
}

export type V3_Pool_Filter = {
  collectedFeesToken0?: Maybe<Scalars['v3_BigDecimal']>
  collectedFeesToken0_gt?: Maybe<Scalars['v3_BigDecimal']>
  collectedFeesToken0_gte?: Maybe<Scalars['v3_BigDecimal']>
  collectedFeesToken0_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  collectedFeesToken0_lt?: Maybe<Scalars['v3_BigDecimal']>
  collectedFeesToken0_lte?: Maybe<Scalars['v3_BigDecimal']>
  collectedFeesToken0_not?: Maybe<Scalars['v3_BigDecimal']>
  collectedFeesToken0_not_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  collectedFeesToken1?: Maybe<Scalars['v3_BigDecimal']>
  collectedFeesToken1_gt?: Maybe<Scalars['v3_BigDecimal']>
  collectedFeesToken1_gte?: Maybe<Scalars['v3_BigDecimal']>
  collectedFeesToken1_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  collectedFeesToken1_lt?: Maybe<Scalars['v3_BigDecimal']>
  collectedFeesToken1_lte?: Maybe<Scalars['v3_BigDecimal']>
  collectedFeesToken1_not?: Maybe<Scalars['v3_BigDecimal']>
  collectedFeesToken1_not_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  collectedFeesUSD?: Maybe<Scalars['v3_BigDecimal']>
  collectedFeesUSD_gt?: Maybe<Scalars['v3_BigDecimal']>
  collectedFeesUSD_gte?: Maybe<Scalars['v3_BigDecimal']>
  collectedFeesUSD_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  collectedFeesUSD_lt?: Maybe<Scalars['v3_BigDecimal']>
  collectedFeesUSD_lte?: Maybe<Scalars['v3_BigDecimal']>
  collectedFeesUSD_not?: Maybe<Scalars['v3_BigDecimal']>
  collectedFeesUSD_not_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  createdAtBlockNumber?: Maybe<Scalars['v3_BigInt']>
  createdAtBlockNumber_gt?: Maybe<Scalars['v3_BigInt']>
  createdAtBlockNumber_gte?: Maybe<Scalars['v3_BigInt']>
  createdAtBlockNumber_in?: Maybe<Array<Scalars['v3_BigInt']>>
  createdAtBlockNumber_lt?: Maybe<Scalars['v3_BigInt']>
  createdAtBlockNumber_lte?: Maybe<Scalars['v3_BigInt']>
  createdAtBlockNumber_not?: Maybe<Scalars['v3_BigInt']>
  createdAtBlockNumber_not_in?: Maybe<Array<Scalars['v3_BigInt']>>
  createdAtTimestamp?: Maybe<Scalars['v3_BigInt']>
  createdAtTimestamp_gt?: Maybe<Scalars['v3_BigInt']>
  createdAtTimestamp_gte?: Maybe<Scalars['v3_BigInt']>
  createdAtTimestamp_in?: Maybe<Array<Scalars['v3_BigInt']>>
  createdAtTimestamp_lt?: Maybe<Scalars['v3_BigInt']>
  createdAtTimestamp_lte?: Maybe<Scalars['v3_BigInt']>
  createdAtTimestamp_not?: Maybe<Scalars['v3_BigInt']>
  createdAtTimestamp_not_in?: Maybe<Array<Scalars['v3_BigInt']>>
  feeGrowthGlobal0X128?: Maybe<Scalars['v3_BigInt']>
  feeGrowthGlobal0X128_gt?: Maybe<Scalars['v3_BigInt']>
  feeGrowthGlobal0X128_gte?: Maybe<Scalars['v3_BigInt']>
  feeGrowthGlobal0X128_in?: Maybe<Array<Scalars['v3_BigInt']>>
  feeGrowthGlobal0X128_lt?: Maybe<Scalars['v3_BigInt']>
  feeGrowthGlobal0X128_lte?: Maybe<Scalars['v3_BigInt']>
  feeGrowthGlobal0X128_not?: Maybe<Scalars['v3_BigInt']>
  feeGrowthGlobal0X128_not_in?: Maybe<Array<Scalars['v3_BigInt']>>
  feeGrowthGlobal1X128?: Maybe<Scalars['v3_BigInt']>
  feeGrowthGlobal1X128_gt?: Maybe<Scalars['v3_BigInt']>
  feeGrowthGlobal1X128_gte?: Maybe<Scalars['v3_BigInt']>
  feeGrowthGlobal1X128_in?: Maybe<Array<Scalars['v3_BigInt']>>
  feeGrowthGlobal1X128_lt?: Maybe<Scalars['v3_BigInt']>
  feeGrowthGlobal1X128_lte?: Maybe<Scalars['v3_BigInt']>
  feeGrowthGlobal1X128_not?: Maybe<Scalars['v3_BigInt']>
  feeGrowthGlobal1X128_not_in?: Maybe<Array<Scalars['v3_BigInt']>>
  feeTier?: Maybe<Scalars['v3_BigInt']>
  feeTier_gt?: Maybe<Scalars['v3_BigInt']>
  feeTier_gte?: Maybe<Scalars['v3_BigInt']>
  feeTier_in?: Maybe<Array<Scalars['v3_BigInt']>>
  feeTier_lt?: Maybe<Scalars['v3_BigInt']>
  feeTier_lte?: Maybe<Scalars['v3_BigInt']>
  feeTier_not?: Maybe<Scalars['v3_BigInt']>
  feeTier_not_in?: Maybe<Array<Scalars['v3_BigInt']>>
  feesUSD?: Maybe<Scalars['v3_BigDecimal']>
  feesUSD_gt?: Maybe<Scalars['v3_BigDecimal']>
  feesUSD_gte?: Maybe<Scalars['v3_BigDecimal']>
  feesUSD_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  feesUSD_lt?: Maybe<Scalars['v3_BigDecimal']>
  feesUSD_lte?: Maybe<Scalars['v3_BigDecimal']>
  feesUSD_not?: Maybe<Scalars['v3_BigDecimal']>
  feesUSD_not_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  id?: Maybe<Scalars['ID']>
  id_gt?: Maybe<Scalars['ID']>
  id_gte?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  id_lt?: Maybe<Scalars['ID']>
  id_lte?: Maybe<Scalars['ID']>
  id_not?: Maybe<Scalars['ID']>
  id_not_in?: Maybe<Array<Scalars['ID']>>
  liquidity?: Maybe<Scalars['v3_BigInt']>
  liquidityProviderCount?: Maybe<Scalars['v3_BigInt']>
  liquidityProviderCount_gt?: Maybe<Scalars['v3_BigInt']>
  liquidityProviderCount_gte?: Maybe<Scalars['v3_BigInt']>
  liquidityProviderCount_in?: Maybe<Array<Scalars['v3_BigInt']>>
  liquidityProviderCount_lt?: Maybe<Scalars['v3_BigInt']>
  liquidityProviderCount_lte?: Maybe<Scalars['v3_BigInt']>
  liquidityProviderCount_not?: Maybe<Scalars['v3_BigInt']>
  liquidityProviderCount_not_in?: Maybe<Array<Scalars['v3_BigInt']>>
  liquidity_gt?: Maybe<Scalars['v3_BigInt']>
  liquidity_gte?: Maybe<Scalars['v3_BigInt']>
  liquidity_in?: Maybe<Array<Scalars['v3_BigInt']>>
  liquidity_lt?: Maybe<Scalars['v3_BigInt']>
  liquidity_lte?: Maybe<Scalars['v3_BigInt']>
  liquidity_not?: Maybe<Scalars['v3_BigInt']>
  liquidity_not_in?: Maybe<Array<Scalars['v3_BigInt']>>
  observationIndex?: Maybe<Scalars['v3_BigInt']>
  observationIndex_gt?: Maybe<Scalars['v3_BigInt']>
  observationIndex_gte?: Maybe<Scalars['v3_BigInt']>
  observationIndex_in?: Maybe<Array<Scalars['v3_BigInt']>>
  observationIndex_lt?: Maybe<Scalars['v3_BigInt']>
  observationIndex_lte?: Maybe<Scalars['v3_BigInt']>
  observationIndex_not?: Maybe<Scalars['v3_BigInt']>
  observationIndex_not_in?: Maybe<Array<Scalars['v3_BigInt']>>
  sqrtPrice?: Maybe<Scalars['v3_BigInt']>
  sqrtPrice_gt?: Maybe<Scalars['v3_BigInt']>
  sqrtPrice_gte?: Maybe<Scalars['v3_BigInt']>
  sqrtPrice_in?: Maybe<Array<Scalars['v3_BigInt']>>
  sqrtPrice_lt?: Maybe<Scalars['v3_BigInt']>
  sqrtPrice_lte?: Maybe<Scalars['v3_BigInt']>
  sqrtPrice_not?: Maybe<Scalars['v3_BigInt']>
  sqrtPrice_not_in?: Maybe<Array<Scalars['v3_BigInt']>>
  tick?: Maybe<Scalars['v3_BigInt']>
  tick_gt?: Maybe<Scalars['v3_BigInt']>
  tick_gte?: Maybe<Scalars['v3_BigInt']>
  tick_in?: Maybe<Array<Scalars['v3_BigInt']>>
  tick_lt?: Maybe<Scalars['v3_BigInt']>
  tick_lte?: Maybe<Scalars['v3_BigInt']>
  tick_not?: Maybe<Scalars['v3_BigInt']>
  tick_not_in?: Maybe<Array<Scalars['v3_BigInt']>>
  token0?: Maybe<Scalars['String']>
  token0Price?: Maybe<Scalars['v3_BigDecimal']>
  token0Price_gt?: Maybe<Scalars['v3_BigDecimal']>
  token0Price_gte?: Maybe<Scalars['v3_BigDecimal']>
  token0Price_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  token0Price_lt?: Maybe<Scalars['v3_BigDecimal']>
  token0Price_lte?: Maybe<Scalars['v3_BigDecimal']>
  token0Price_not?: Maybe<Scalars['v3_BigDecimal']>
  token0Price_not_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  token0_contains?: Maybe<Scalars['String']>
  token0_ends_with?: Maybe<Scalars['String']>
  token0_gt?: Maybe<Scalars['String']>
  token0_gte?: Maybe<Scalars['String']>
  token0_in?: Maybe<Array<Scalars['String']>>
  token0_lt?: Maybe<Scalars['String']>
  token0_lte?: Maybe<Scalars['String']>
  token0_not?: Maybe<Scalars['String']>
  token0_not_contains?: Maybe<Scalars['String']>
  token0_not_ends_with?: Maybe<Scalars['String']>
  token0_not_in?: Maybe<Array<Scalars['String']>>
  token0_not_starts_with?: Maybe<Scalars['String']>
  token0_starts_with?: Maybe<Scalars['String']>
  token1?: Maybe<Scalars['String']>
  token1Price?: Maybe<Scalars['v3_BigDecimal']>
  token1Price_gt?: Maybe<Scalars['v3_BigDecimal']>
  token1Price_gte?: Maybe<Scalars['v3_BigDecimal']>
  token1Price_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  token1Price_lt?: Maybe<Scalars['v3_BigDecimal']>
  token1Price_lte?: Maybe<Scalars['v3_BigDecimal']>
  token1Price_not?: Maybe<Scalars['v3_BigDecimal']>
  token1Price_not_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  token1_contains?: Maybe<Scalars['String']>
  token1_ends_with?: Maybe<Scalars['String']>
  token1_gt?: Maybe<Scalars['String']>
  token1_gte?: Maybe<Scalars['String']>
  token1_in?: Maybe<Array<Scalars['String']>>
  token1_lt?: Maybe<Scalars['String']>
  token1_lte?: Maybe<Scalars['String']>
  token1_not?: Maybe<Scalars['String']>
  token1_not_contains?: Maybe<Scalars['String']>
  token1_not_ends_with?: Maybe<Scalars['String']>
  token1_not_in?: Maybe<Array<Scalars['String']>>
  token1_not_starts_with?: Maybe<Scalars['String']>
  token1_starts_with?: Maybe<Scalars['String']>
  totalValueLockedETH?: Maybe<Scalars['v3_BigDecimal']>
  totalValueLockedETH_gt?: Maybe<Scalars['v3_BigDecimal']>
  totalValueLockedETH_gte?: Maybe<Scalars['v3_BigDecimal']>
  totalValueLockedETH_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  totalValueLockedETH_lt?: Maybe<Scalars['v3_BigDecimal']>
  totalValueLockedETH_lte?: Maybe<Scalars['v3_BigDecimal']>
  totalValueLockedETH_not?: Maybe<Scalars['v3_BigDecimal']>
  totalValueLockedETH_not_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  totalValueLockedToken0?: Maybe<Scalars['v3_BigDecimal']>
  totalValueLockedToken0_gt?: Maybe<Scalars['v3_BigDecimal']>
  totalValueLockedToken0_gte?: Maybe<Scalars['v3_BigDecimal']>
  totalValueLockedToken0_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  totalValueLockedToken0_lt?: Maybe<Scalars['v3_BigDecimal']>
  totalValueLockedToken0_lte?: Maybe<Scalars['v3_BigDecimal']>
  totalValueLockedToken0_not?: Maybe<Scalars['v3_BigDecimal']>
  totalValueLockedToken0_not_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  totalValueLockedToken1?: Maybe<Scalars['v3_BigDecimal']>
  totalValueLockedToken1_gt?: Maybe<Scalars['v3_BigDecimal']>
  totalValueLockedToken1_gte?: Maybe<Scalars['v3_BigDecimal']>
  totalValueLockedToken1_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  totalValueLockedToken1_lt?: Maybe<Scalars['v3_BigDecimal']>
  totalValueLockedToken1_lte?: Maybe<Scalars['v3_BigDecimal']>
  totalValueLockedToken1_not?: Maybe<Scalars['v3_BigDecimal']>
  totalValueLockedToken1_not_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  totalValueLockedUSD?: Maybe<Scalars['v3_BigDecimal']>
  totalValueLockedUSDUntracked?: Maybe<Scalars['v3_BigDecimal']>
  totalValueLockedUSDUntracked_gt?: Maybe<Scalars['v3_BigDecimal']>
  totalValueLockedUSDUntracked_gte?: Maybe<Scalars['v3_BigDecimal']>
  totalValueLockedUSDUntracked_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  totalValueLockedUSDUntracked_lt?: Maybe<Scalars['v3_BigDecimal']>
  totalValueLockedUSDUntracked_lte?: Maybe<Scalars['v3_BigDecimal']>
  totalValueLockedUSDUntracked_not?: Maybe<Scalars['v3_BigDecimal']>
  totalValueLockedUSDUntracked_not_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  totalValueLockedUSD_gt?: Maybe<Scalars['v3_BigDecimal']>
  totalValueLockedUSD_gte?: Maybe<Scalars['v3_BigDecimal']>
  totalValueLockedUSD_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  totalValueLockedUSD_lt?: Maybe<Scalars['v3_BigDecimal']>
  totalValueLockedUSD_lte?: Maybe<Scalars['v3_BigDecimal']>
  totalValueLockedUSD_not?: Maybe<Scalars['v3_BigDecimal']>
  totalValueLockedUSD_not_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  txCount?: Maybe<Scalars['v3_BigInt']>
  txCount_gt?: Maybe<Scalars['v3_BigInt']>
  txCount_gte?: Maybe<Scalars['v3_BigInt']>
  txCount_in?: Maybe<Array<Scalars['v3_BigInt']>>
  txCount_lt?: Maybe<Scalars['v3_BigInt']>
  txCount_lte?: Maybe<Scalars['v3_BigInt']>
  txCount_not?: Maybe<Scalars['v3_BigInt']>
  txCount_not_in?: Maybe<Array<Scalars['v3_BigInt']>>
  untrackedVolumeUSD?: Maybe<Scalars['v3_BigDecimal']>
  untrackedVolumeUSD_gt?: Maybe<Scalars['v3_BigDecimal']>
  untrackedVolumeUSD_gte?: Maybe<Scalars['v3_BigDecimal']>
  untrackedVolumeUSD_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  untrackedVolumeUSD_lt?: Maybe<Scalars['v3_BigDecimal']>
  untrackedVolumeUSD_lte?: Maybe<Scalars['v3_BigDecimal']>
  untrackedVolumeUSD_not?: Maybe<Scalars['v3_BigDecimal']>
  untrackedVolumeUSD_not_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  volumeToken0?: Maybe<Scalars['v3_BigDecimal']>
  volumeToken0_gt?: Maybe<Scalars['v3_BigDecimal']>
  volumeToken0_gte?: Maybe<Scalars['v3_BigDecimal']>
  volumeToken0_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  volumeToken0_lt?: Maybe<Scalars['v3_BigDecimal']>
  volumeToken0_lte?: Maybe<Scalars['v3_BigDecimal']>
  volumeToken0_not?: Maybe<Scalars['v3_BigDecimal']>
  volumeToken0_not_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  volumeToken1?: Maybe<Scalars['v3_BigDecimal']>
  volumeToken1_gt?: Maybe<Scalars['v3_BigDecimal']>
  volumeToken1_gte?: Maybe<Scalars['v3_BigDecimal']>
  volumeToken1_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  volumeToken1_lt?: Maybe<Scalars['v3_BigDecimal']>
  volumeToken1_lte?: Maybe<Scalars['v3_BigDecimal']>
  volumeToken1_not?: Maybe<Scalars['v3_BigDecimal']>
  volumeToken1_not_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  volumeUSD?: Maybe<Scalars['v3_BigDecimal']>
  volumeUSD_gt?: Maybe<Scalars['v3_BigDecimal']>
  volumeUSD_gte?: Maybe<Scalars['v3_BigDecimal']>
  volumeUSD_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  volumeUSD_lt?: Maybe<Scalars['v3_BigDecimal']>
  volumeUSD_lte?: Maybe<Scalars['v3_BigDecimal']>
  volumeUSD_not?: Maybe<Scalars['v3_BigDecimal']>
  volumeUSD_not_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
}

export enum V3_Pool_OrderBy {
  Burns = 'burns',
  CollectedFeesToken0 = 'collectedFeesToken0',
  CollectedFeesToken1 = 'collectedFeesToken1',
  CollectedFeesUsd = 'collectedFeesUSD',
  Collects = 'collects',
  CreatedAtBlockNumber = 'createdAtBlockNumber',
  CreatedAtTimestamp = 'createdAtTimestamp',
  FeeGrowthGlobal0X128 = 'feeGrowthGlobal0X128',
  FeeGrowthGlobal1X128 = 'feeGrowthGlobal1X128',
  FeeTier = 'feeTier',
  FeesUsd = 'feesUSD',
  Id = 'id',
  Liquidity = 'liquidity',
  LiquidityProviderCount = 'liquidityProviderCount',
  Mints = 'mints',
  ObservationIndex = 'observationIndex',
  PoolDayData = 'poolDayData',
  PoolHourData = 'poolHourData',
  SqrtPrice = 'sqrtPrice',
  Swaps = 'swaps',
  Tick = 'tick',
  Ticks = 'ticks',
  Token0 = 'token0',
  Token0Price = 'token0Price',
  Token1 = 'token1',
  Token1Price = 'token1Price',
  TotalValueLockedEth = 'totalValueLockedETH',
  TotalValueLockedToken0 = 'totalValueLockedToken0',
  TotalValueLockedToken1 = 'totalValueLockedToken1',
  TotalValueLockedUsd = 'totalValueLockedUSD',
  TotalValueLockedUsdUntracked = 'totalValueLockedUSDUntracked',
  TxCount = 'txCount',
  UntrackedVolumeUsd = 'untrackedVolumeUSD',
  VolumeToken0 = 'volumeToken0',
  VolumeToken1 = 'volumeToken1',
  VolumeUsd = 'volumeUSD',
}

export type V3_Position = {
  __typename?: 'v3_Position'
  collectedFeesToken0: Scalars['v3_BigDecimal']
  collectedFeesToken1: Scalars['v3_BigDecimal']
  depositedToken0: Scalars['v3_BigDecimal']
  depositedToken1: Scalars['v3_BigDecimal']
  feeGrowthInside0LastX128: Scalars['v3_BigInt']
  feeGrowthInside1LastX128: Scalars['v3_BigInt']
  id: Scalars['ID']
  liquidity: Scalars['v3_BigInt']
  owner: Scalars['v3_Bytes']
  pool: V3_Pool
  tickLower: V3_Tick
  tickUpper: V3_Tick
  token0: V3_Token
  token1: V3_Token
  transaction: V3_Transaction
  withdrawnToken0: Scalars['v3_BigDecimal']
  withdrawnToken1: Scalars['v3_BigDecimal']
}

export type V3_PositionSnapshot = {
  __typename?: 'v3_PositionSnapshot'
  blockNumber: Scalars['v3_BigInt']
  collectedFeesToken0: Scalars['v3_BigDecimal']
  collectedFeesToken1: Scalars['v3_BigDecimal']
  depositedToken0: Scalars['v3_BigDecimal']
  depositedToken1: Scalars['v3_BigDecimal']
  feeGrowthInside0LastX128: Scalars['v3_BigInt']
  feeGrowthInside1LastX128: Scalars['v3_BigInt']
  id: Scalars['ID']
  liquidity: Scalars['v3_BigInt']
  owner: Scalars['v3_Bytes']
  pool: V3_Pool
  position: V3_Position
  timestamp: Scalars['v3_BigInt']
  transaction: V3_Transaction
  withdrawnToken0: Scalars['v3_BigDecimal']
  withdrawnToken1: Scalars['v3_BigDecimal']
}

export type V3_PositionSnapshot_Filter = {
  blockNumber?: Maybe<Scalars['v3_BigInt']>
  blockNumber_gt?: Maybe<Scalars['v3_BigInt']>
  blockNumber_gte?: Maybe<Scalars['v3_BigInt']>
  blockNumber_in?: Maybe<Array<Scalars['v3_BigInt']>>
  blockNumber_lt?: Maybe<Scalars['v3_BigInt']>
  blockNumber_lte?: Maybe<Scalars['v3_BigInt']>
  blockNumber_not?: Maybe<Scalars['v3_BigInt']>
  blockNumber_not_in?: Maybe<Array<Scalars['v3_BigInt']>>
  collectedFeesToken0?: Maybe<Scalars['v3_BigDecimal']>
  collectedFeesToken0_gt?: Maybe<Scalars['v3_BigDecimal']>
  collectedFeesToken0_gte?: Maybe<Scalars['v3_BigDecimal']>
  collectedFeesToken0_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  collectedFeesToken0_lt?: Maybe<Scalars['v3_BigDecimal']>
  collectedFeesToken0_lte?: Maybe<Scalars['v3_BigDecimal']>
  collectedFeesToken0_not?: Maybe<Scalars['v3_BigDecimal']>
  collectedFeesToken0_not_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  collectedFeesToken1?: Maybe<Scalars['v3_BigDecimal']>
  collectedFeesToken1_gt?: Maybe<Scalars['v3_BigDecimal']>
  collectedFeesToken1_gte?: Maybe<Scalars['v3_BigDecimal']>
  collectedFeesToken1_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  collectedFeesToken1_lt?: Maybe<Scalars['v3_BigDecimal']>
  collectedFeesToken1_lte?: Maybe<Scalars['v3_BigDecimal']>
  collectedFeesToken1_not?: Maybe<Scalars['v3_BigDecimal']>
  collectedFeesToken1_not_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  depositedToken0?: Maybe<Scalars['v3_BigDecimal']>
  depositedToken0_gt?: Maybe<Scalars['v3_BigDecimal']>
  depositedToken0_gte?: Maybe<Scalars['v3_BigDecimal']>
  depositedToken0_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  depositedToken0_lt?: Maybe<Scalars['v3_BigDecimal']>
  depositedToken0_lte?: Maybe<Scalars['v3_BigDecimal']>
  depositedToken0_not?: Maybe<Scalars['v3_BigDecimal']>
  depositedToken0_not_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  depositedToken1?: Maybe<Scalars['v3_BigDecimal']>
  depositedToken1_gt?: Maybe<Scalars['v3_BigDecimal']>
  depositedToken1_gte?: Maybe<Scalars['v3_BigDecimal']>
  depositedToken1_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  depositedToken1_lt?: Maybe<Scalars['v3_BigDecimal']>
  depositedToken1_lte?: Maybe<Scalars['v3_BigDecimal']>
  depositedToken1_not?: Maybe<Scalars['v3_BigDecimal']>
  depositedToken1_not_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  feeGrowthInside0LastX128?: Maybe<Scalars['v3_BigInt']>
  feeGrowthInside0LastX128_gt?: Maybe<Scalars['v3_BigInt']>
  feeGrowthInside0LastX128_gte?: Maybe<Scalars['v3_BigInt']>
  feeGrowthInside0LastX128_in?: Maybe<Array<Scalars['v3_BigInt']>>
  feeGrowthInside0LastX128_lt?: Maybe<Scalars['v3_BigInt']>
  feeGrowthInside0LastX128_lte?: Maybe<Scalars['v3_BigInt']>
  feeGrowthInside0LastX128_not?: Maybe<Scalars['v3_BigInt']>
  feeGrowthInside0LastX128_not_in?: Maybe<Array<Scalars['v3_BigInt']>>
  feeGrowthInside1LastX128?: Maybe<Scalars['v3_BigInt']>
  feeGrowthInside1LastX128_gt?: Maybe<Scalars['v3_BigInt']>
  feeGrowthInside1LastX128_gte?: Maybe<Scalars['v3_BigInt']>
  feeGrowthInside1LastX128_in?: Maybe<Array<Scalars['v3_BigInt']>>
  feeGrowthInside1LastX128_lt?: Maybe<Scalars['v3_BigInt']>
  feeGrowthInside1LastX128_lte?: Maybe<Scalars['v3_BigInt']>
  feeGrowthInside1LastX128_not?: Maybe<Scalars['v3_BigInt']>
  feeGrowthInside1LastX128_not_in?: Maybe<Array<Scalars['v3_BigInt']>>
  id?: Maybe<Scalars['ID']>
  id_gt?: Maybe<Scalars['ID']>
  id_gte?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  id_lt?: Maybe<Scalars['ID']>
  id_lte?: Maybe<Scalars['ID']>
  id_not?: Maybe<Scalars['ID']>
  id_not_in?: Maybe<Array<Scalars['ID']>>
  liquidity?: Maybe<Scalars['v3_BigInt']>
  liquidity_gt?: Maybe<Scalars['v3_BigInt']>
  liquidity_gte?: Maybe<Scalars['v3_BigInt']>
  liquidity_in?: Maybe<Array<Scalars['v3_BigInt']>>
  liquidity_lt?: Maybe<Scalars['v3_BigInt']>
  liquidity_lte?: Maybe<Scalars['v3_BigInt']>
  liquidity_not?: Maybe<Scalars['v3_BigInt']>
  liquidity_not_in?: Maybe<Array<Scalars['v3_BigInt']>>
  owner?: Maybe<Scalars['v3_Bytes']>
  owner_contains?: Maybe<Scalars['v3_Bytes']>
  owner_in?: Maybe<Array<Scalars['v3_Bytes']>>
  owner_not?: Maybe<Scalars['v3_Bytes']>
  owner_not_contains?: Maybe<Scalars['v3_Bytes']>
  owner_not_in?: Maybe<Array<Scalars['v3_Bytes']>>
  pool?: Maybe<Scalars['String']>
  pool_contains?: Maybe<Scalars['String']>
  pool_ends_with?: Maybe<Scalars['String']>
  pool_gt?: Maybe<Scalars['String']>
  pool_gte?: Maybe<Scalars['String']>
  pool_in?: Maybe<Array<Scalars['String']>>
  pool_lt?: Maybe<Scalars['String']>
  pool_lte?: Maybe<Scalars['String']>
  pool_not?: Maybe<Scalars['String']>
  pool_not_contains?: Maybe<Scalars['String']>
  pool_not_ends_with?: Maybe<Scalars['String']>
  pool_not_in?: Maybe<Array<Scalars['String']>>
  pool_not_starts_with?: Maybe<Scalars['String']>
  pool_starts_with?: Maybe<Scalars['String']>
  position?: Maybe<Scalars['String']>
  position_contains?: Maybe<Scalars['String']>
  position_ends_with?: Maybe<Scalars['String']>
  position_gt?: Maybe<Scalars['String']>
  position_gte?: Maybe<Scalars['String']>
  position_in?: Maybe<Array<Scalars['String']>>
  position_lt?: Maybe<Scalars['String']>
  position_lte?: Maybe<Scalars['String']>
  position_not?: Maybe<Scalars['String']>
  position_not_contains?: Maybe<Scalars['String']>
  position_not_ends_with?: Maybe<Scalars['String']>
  position_not_in?: Maybe<Array<Scalars['String']>>
  position_not_starts_with?: Maybe<Scalars['String']>
  position_starts_with?: Maybe<Scalars['String']>
  timestamp?: Maybe<Scalars['v3_BigInt']>
  timestamp_gt?: Maybe<Scalars['v3_BigInt']>
  timestamp_gte?: Maybe<Scalars['v3_BigInt']>
  timestamp_in?: Maybe<Array<Scalars['v3_BigInt']>>
  timestamp_lt?: Maybe<Scalars['v3_BigInt']>
  timestamp_lte?: Maybe<Scalars['v3_BigInt']>
  timestamp_not?: Maybe<Scalars['v3_BigInt']>
  timestamp_not_in?: Maybe<Array<Scalars['v3_BigInt']>>
  transaction?: Maybe<Scalars['String']>
  transaction_contains?: Maybe<Scalars['String']>
  transaction_ends_with?: Maybe<Scalars['String']>
  transaction_gt?: Maybe<Scalars['String']>
  transaction_gte?: Maybe<Scalars['String']>
  transaction_in?: Maybe<Array<Scalars['String']>>
  transaction_lt?: Maybe<Scalars['String']>
  transaction_lte?: Maybe<Scalars['String']>
  transaction_not?: Maybe<Scalars['String']>
  transaction_not_contains?: Maybe<Scalars['String']>
  transaction_not_ends_with?: Maybe<Scalars['String']>
  transaction_not_in?: Maybe<Array<Scalars['String']>>
  transaction_not_starts_with?: Maybe<Scalars['String']>
  transaction_starts_with?: Maybe<Scalars['String']>
  withdrawnToken0?: Maybe<Scalars['v3_BigDecimal']>
  withdrawnToken0_gt?: Maybe<Scalars['v3_BigDecimal']>
  withdrawnToken0_gte?: Maybe<Scalars['v3_BigDecimal']>
  withdrawnToken0_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  withdrawnToken0_lt?: Maybe<Scalars['v3_BigDecimal']>
  withdrawnToken0_lte?: Maybe<Scalars['v3_BigDecimal']>
  withdrawnToken0_not?: Maybe<Scalars['v3_BigDecimal']>
  withdrawnToken0_not_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  withdrawnToken1?: Maybe<Scalars['v3_BigDecimal']>
  withdrawnToken1_gt?: Maybe<Scalars['v3_BigDecimal']>
  withdrawnToken1_gte?: Maybe<Scalars['v3_BigDecimal']>
  withdrawnToken1_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  withdrawnToken1_lt?: Maybe<Scalars['v3_BigDecimal']>
  withdrawnToken1_lte?: Maybe<Scalars['v3_BigDecimal']>
  withdrawnToken1_not?: Maybe<Scalars['v3_BigDecimal']>
  withdrawnToken1_not_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
}

export enum V3_PositionSnapshot_OrderBy {
  BlockNumber = 'blockNumber',
  CollectedFeesToken0 = 'collectedFeesToken0',
  CollectedFeesToken1 = 'collectedFeesToken1',
  DepositedToken0 = 'depositedToken0',
  DepositedToken1 = 'depositedToken1',
  FeeGrowthInside0LastX128 = 'feeGrowthInside0LastX128',
  FeeGrowthInside1LastX128 = 'feeGrowthInside1LastX128',
  Id = 'id',
  Liquidity = 'liquidity',
  Owner = 'owner',
  Pool = 'pool',
  Position = 'position',
  Timestamp = 'timestamp',
  Transaction = 'transaction',
  WithdrawnToken0 = 'withdrawnToken0',
  WithdrawnToken1 = 'withdrawnToken1',
}

export type V3_Position_Filter = {
  collectedFeesToken0?: Maybe<Scalars['v3_BigDecimal']>
  collectedFeesToken0_gt?: Maybe<Scalars['v3_BigDecimal']>
  collectedFeesToken0_gte?: Maybe<Scalars['v3_BigDecimal']>
  collectedFeesToken0_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  collectedFeesToken0_lt?: Maybe<Scalars['v3_BigDecimal']>
  collectedFeesToken0_lte?: Maybe<Scalars['v3_BigDecimal']>
  collectedFeesToken0_not?: Maybe<Scalars['v3_BigDecimal']>
  collectedFeesToken0_not_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  collectedFeesToken1?: Maybe<Scalars['v3_BigDecimal']>
  collectedFeesToken1_gt?: Maybe<Scalars['v3_BigDecimal']>
  collectedFeesToken1_gte?: Maybe<Scalars['v3_BigDecimal']>
  collectedFeesToken1_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  collectedFeesToken1_lt?: Maybe<Scalars['v3_BigDecimal']>
  collectedFeesToken1_lte?: Maybe<Scalars['v3_BigDecimal']>
  collectedFeesToken1_not?: Maybe<Scalars['v3_BigDecimal']>
  collectedFeesToken1_not_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  depositedToken0?: Maybe<Scalars['v3_BigDecimal']>
  depositedToken0_gt?: Maybe<Scalars['v3_BigDecimal']>
  depositedToken0_gte?: Maybe<Scalars['v3_BigDecimal']>
  depositedToken0_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  depositedToken0_lt?: Maybe<Scalars['v3_BigDecimal']>
  depositedToken0_lte?: Maybe<Scalars['v3_BigDecimal']>
  depositedToken0_not?: Maybe<Scalars['v3_BigDecimal']>
  depositedToken0_not_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  depositedToken1?: Maybe<Scalars['v3_BigDecimal']>
  depositedToken1_gt?: Maybe<Scalars['v3_BigDecimal']>
  depositedToken1_gte?: Maybe<Scalars['v3_BigDecimal']>
  depositedToken1_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  depositedToken1_lt?: Maybe<Scalars['v3_BigDecimal']>
  depositedToken1_lte?: Maybe<Scalars['v3_BigDecimal']>
  depositedToken1_not?: Maybe<Scalars['v3_BigDecimal']>
  depositedToken1_not_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  feeGrowthInside0LastX128?: Maybe<Scalars['v3_BigInt']>
  feeGrowthInside0LastX128_gt?: Maybe<Scalars['v3_BigInt']>
  feeGrowthInside0LastX128_gte?: Maybe<Scalars['v3_BigInt']>
  feeGrowthInside0LastX128_in?: Maybe<Array<Scalars['v3_BigInt']>>
  feeGrowthInside0LastX128_lt?: Maybe<Scalars['v3_BigInt']>
  feeGrowthInside0LastX128_lte?: Maybe<Scalars['v3_BigInt']>
  feeGrowthInside0LastX128_not?: Maybe<Scalars['v3_BigInt']>
  feeGrowthInside0LastX128_not_in?: Maybe<Array<Scalars['v3_BigInt']>>
  feeGrowthInside1LastX128?: Maybe<Scalars['v3_BigInt']>
  feeGrowthInside1LastX128_gt?: Maybe<Scalars['v3_BigInt']>
  feeGrowthInside1LastX128_gte?: Maybe<Scalars['v3_BigInt']>
  feeGrowthInside1LastX128_in?: Maybe<Array<Scalars['v3_BigInt']>>
  feeGrowthInside1LastX128_lt?: Maybe<Scalars['v3_BigInt']>
  feeGrowthInside1LastX128_lte?: Maybe<Scalars['v3_BigInt']>
  feeGrowthInside1LastX128_not?: Maybe<Scalars['v3_BigInt']>
  feeGrowthInside1LastX128_not_in?: Maybe<Array<Scalars['v3_BigInt']>>
  id?: Maybe<Scalars['ID']>
  id_gt?: Maybe<Scalars['ID']>
  id_gte?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  id_lt?: Maybe<Scalars['ID']>
  id_lte?: Maybe<Scalars['ID']>
  id_not?: Maybe<Scalars['ID']>
  id_not_in?: Maybe<Array<Scalars['ID']>>
  liquidity?: Maybe<Scalars['v3_BigInt']>
  liquidity_gt?: Maybe<Scalars['v3_BigInt']>
  liquidity_gte?: Maybe<Scalars['v3_BigInt']>
  liquidity_in?: Maybe<Array<Scalars['v3_BigInt']>>
  liquidity_lt?: Maybe<Scalars['v3_BigInt']>
  liquidity_lte?: Maybe<Scalars['v3_BigInt']>
  liquidity_not?: Maybe<Scalars['v3_BigInt']>
  liquidity_not_in?: Maybe<Array<Scalars['v3_BigInt']>>
  owner?: Maybe<Scalars['v3_Bytes']>
  owner_contains?: Maybe<Scalars['v3_Bytes']>
  owner_in?: Maybe<Array<Scalars['v3_Bytes']>>
  owner_not?: Maybe<Scalars['v3_Bytes']>
  owner_not_contains?: Maybe<Scalars['v3_Bytes']>
  owner_not_in?: Maybe<Array<Scalars['v3_Bytes']>>
  pool?: Maybe<Scalars['String']>
  pool_contains?: Maybe<Scalars['String']>
  pool_ends_with?: Maybe<Scalars['String']>
  pool_gt?: Maybe<Scalars['String']>
  pool_gte?: Maybe<Scalars['String']>
  pool_in?: Maybe<Array<Scalars['String']>>
  pool_lt?: Maybe<Scalars['String']>
  pool_lte?: Maybe<Scalars['String']>
  pool_not?: Maybe<Scalars['String']>
  pool_not_contains?: Maybe<Scalars['String']>
  pool_not_ends_with?: Maybe<Scalars['String']>
  pool_not_in?: Maybe<Array<Scalars['String']>>
  pool_not_starts_with?: Maybe<Scalars['String']>
  pool_starts_with?: Maybe<Scalars['String']>
  tickLower?: Maybe<Scalars['String']>
  tickLower_contains?: Maybe<Scalars['String']>
  tickLower_ends_with?: Maybe<Scalars['String']>
  tickLower_gt?: Maybe<Scalars['String']>
  tickLower_gte?: Maybe<Scalars['String']>
  tickLower_in?: Maybe<Array<Scalars['String']>>
  tickLower_lt?: Maybe<Scalars['String']>
  tickLower_lte?: Maybe<Scalars['String']>
  tickLower_not?: Maybe<Scalars['String']>
  tickLower_not_contains?: Maybe<Scalars['String']>
  tickLower_not_ends_with?: Maybe<Scalars['String']>
  tickLower_not_in?: Maybe<Array<Scalars['String']>>
  tickLower_not_starts_with?: Maybe<Scalars['String']>
  tickLower_starts_with?: Maybe<Scalars['String']>
  tickUpper?: Maybe<Scalars['String']>
  tickUpper_contains?: Maybe<Scalars['String']>
  tickUpper_ends_with?: Maybe<Scalars['String']>
  tickUpper_gt?: Maybe<Scalars['String']>
  tickUpper_gte?: Maybe<Scalars['String']>
  tickUpper_in?: Maybe<Array<Scalars['String']>>
  tickUpper_lt?: Maybe<Scalars['String']>
  tickUpper_lte?: Maybe<Scalars['String']>
  tickUpper_not?: Maybe<Scalars['String']>
  tickUpper_not_contains?: Maybe<Scalars['String']>
  tickUpper_not_ends_with?: Maybe<Scalars['String']>
  tickUpper_not_in?: Maybe<Array<Scalars['String']>>
  tickUpper_not_starts_with?: Maybe<Scalars['String']>
  tickUpper_starts_with?: Maybe<Scalars['String']>
  token0?: Maybe<Scalars['String']>
  token0_contains?: Maybe<Scalars['String']>
  token0_ends_with?: Maybe<Scalars['String']>
  token0_gt?: Maybe<Scalars['String']>
  token0_gte?: Maybe<Scalars['String']>
  token0_in?: Maybe<Array<Scalars['String']>>
  token0_lt?: Maybe<Scalars['String']>
  token0_lte?: Maybe<Scalars['String']>
  token0_not?: Maybe<Scalars['String']>
  token0_not_contains?: Maybe<Scalars['String']>
  token0_not_ends_with?: Maybe<Scalars['String']>
  token0_not_in?: Maybe<Array<Scalars['String']>>
  token0_not_starts_with?: Maybe<Scalars['String']>
  token0_starts_with?: Maybe<Scalars['String']>
  token1?: Maybe<Scalars['String']>
  token1_contains?: Maybe<Scalars['String']>
  token1_ends_with?: Maybe<Scalars['String']>
  token1_gt?: Maybe<Scalars['String']>
  token1_gte?: Maybe<Scalars['String']>
  token1_in?: Maybe<Array<Scalars['String']>>
  token1_lt?: Maybe<Scalars['String']>
  token1_lte?: Maybe<Scalars['String']>
  token1_not?: Maybe<Scalars['String']>
  token1_not_contains?: Maybe<Scalars['String']>
  token1_not_ends_with?: Maybe<Scalars['String']>
  token1_not_in?: Maybe<Array<Scalars['String']>>
  token1_not_starts_with?: Maybe<Scalars['String']>
  token1_starts_with?: Maybe<Scalars['String']>
  transaction?: Maybe<Scalars['String']>
  transaction_contains?: Maybe<Scalars['String']>
  transaction_ends_with?: Maybe<Scalars['String']>
  transaction_gt?: Maybe<Scalars['String']>
  transaction_gte?: Maybe<Scalars['String']>
  transaction_in?: Maybe<Array<Scalars['String']>>
  transaction_lt?: Maybe<Scalars['String']>
  transaction_lte?: Maybe<Scalars['String']>
  transaction_not?: Maybe<Scalars['String']>
  transaction_not_contains?: Maybe<Scalars['String']>
  transaction_not_ends_with?: Maybe<Scalars['String']>
  transaction_not_in?: Maybe<Array<Scalars['String']>>
  transaction_not_starts_with?: Maybe<Scalars['String']>
  transaction_starts_with?: Maybe<Scalars['String']>
  withdrawnToken0?: Maybe<Scalars['v3_BigDecimal']>
  withdrawnToken0_gt?: Maybe<Scalars['v3_BigDecimal']>
  withdrawnToken0_gte?: Maybe<Scalars['v3_BigDecimal']>
  withdrawnToken0_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  withdrawnToken0_lt?: Maybe<Scalars['v3_BigDecimal']>
  withdrawnToken0_lte?: Maybe<Scalars['v3_BigDecimal']>
  withdrawnToken0_not?: Maybe<Scalars['v3_BigDecimal']>
  withdrawnToken0_not_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  withdrawnToken1?: Maybe<Scalars['v3_BigDecimal']>
  withdrawnToken1_gt?: Maybe<Scalars['v3_BigDecimal']>
  withdrawnToken1_gte?: Maybe<Scalars['v3_BigDecimal']>
  withdrawnToken1_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  withdrawnToken1_lt?: Maybe<Scalars['v3_BigDecimal']>
  withdrawnToken1_lte?: Maybe<Scalars['v3_BigDecimal']>
  withdrawnToken1_not?: Maybe<Scalars['v3_BigDecimal']>
  withdrawnToken1_not_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
}

export enum V3_Position_OrderBy {
  CollectedFeesToken0 = 'collectedFeesToken0',
  CollectedFeesToken1 = 'collectedFeesToken1',
  DepositedToken0 = 'depositedToken0',
  DepositedToken1 = 'depositedToken1',
  FeeGrowthInside0LastX128 = 'feeGrowthInside0LastX128',
  FeeGrowthInside1LastX128 = 'feeGrowthInside1LastX128',
  Id = 'id',
  Liquidity = 'liquidity',
  Owner = 'owner',
  Pool = 'pool',
  TickLower = 'tickLower',
  TickUpper = 'tickUpper',
  Token0 = 'token0',
  Token1 = 'token1',
  Transaction = 'transaction',
  WithdrawnToken0 = 'withdrawnToken0',
  WithdrawnToken1 = 'withdrawnToken1',
}

export type V3_Swap = {
  __typename?: 'v3_Swap'
  amount0: Scalars['v3_BigDecimal']
  amount1: Scalars['v3_BigDecimal']
  amountUSD: Scalars['v3_BigDecimal']
  id: Scalars['ID']
  logIndex?: Maybe<Scalars['v3_BigInt']>
  origin: Scalars['v3_Bytes']
  pool: V3_Pool
  recipient: Scalars['v3_Bytes']
  sender: Scalars['v3_Bytes']
  sqrtPriceX96: Scalars['v3_BigInt']
  tick: Scalars['v3_BigInt']
  timestamp: Scalars['v3_BigInt']
  token0: V3_Token
  token1: V3_Token
  transaction: V3_Transaction
}

export type V3_Swap_Filter = {
  amount0?: Maybe<Scalars['v3_BigDecimal']>
  amount0_gt?: Maybe<Scalars['v3_BigDecimal']>
  amount0_gte?: Maybe<Scalars['v3_BigDecimal']>
  amount0_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  amount0_lt?: Maybe<Scalars['v3_BigDecimal']>
  amount0_lte?: Maybe<Scalars['v3_BigDecimal']>
  amount0_not?: Maybe<Scalars['v3_BigDecimal']>
  amount0_not_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  amount1?: Maybe<Scalars['v3_BigDecimal']>
  amount1_gt?: Maybe<Scalars['v3_BigDecimal']>
  amount1_gte?: Maybe<Scalars['v3_BigDecimal']>
  amount1_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  amount1_lt?: Maybe<Scalars['v3_BigDecimal']>
  amount1_lte?: Maybe<Scalars['v3_BigDecimal']>
  amount1_not?: Maybe<Scalars['v3_BigDecimal']>
  amount1_not_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  amountUSD?: Maybe<Scalars['v3_BigDecimal']>
  amountUSD_gt?: Maybe<Scalars['v3_BigDecimal']>
  amountUSD_gte?: Maybe<Scalars['v3_BigDecimal']>
  amountUSD_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  amountUSD_lt?: Maybe<Scalars['v3_BigDecimal']>
  amountUSD_lte?: Maybe<Scalars['v3_BigDecimal']>
  amountUSD_not?: Maybe<Scalars['v3_BigDecimal']>
  amountUSD_not_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  id?: Maybe<Scalars['ID']>
  id_gt?: Maybe<Scalars['ID']>
  id_gte?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  id_lt?: Maybe<Scalars['ID']>
  id_lte?: Maybe<Scalars['ID']>
  id_not?: Maybe<Scalars['ID']>
  id_not_in?: Maybe<Array<Scalars['ID']>>
  logIndex?: Maybe<Scalars['v3_BigInt']>
  logIndex_gt?: Maybe<Scalars['v3_BigInt']>
  logIndex_gte?: Maybe<Scalars['v3_BigInt']>
  logIndex_in?: Maybe<Array<Scalars['v3_BigInt']>>
  logIndex_lt?: Maybe<Scalars['v3_BigInt']>
  logIndex_lte?: Maybe<Scalars['v3_BigInt']>
  logIndex_not?: Maybe<Scalars['v3_BigInt']>
  logIndex_not_in?: Maybe<Array<Scalars['v3_BigInt']>>
  origin?: Maybe<Scalars['v3_Bytes']>
  origin_contains?: Maybe<Scalars['v3_Bytes']>
  origin_in?: Maybe<Array<Scalars['v3_Bytes']>>
  origin_not?: Maybe<Scalars['v3_Bytes']>
  origin_not_contains?: Maybe<Scalars['v3_Bytes']>
  origin_not_in?: Maybe<Array<Scalars['v3_Bytes']>>
  pool?: Maybe<Scalars['String']>
  pool_contains?: Maybe<Scalars['String']>
  pool_ends_with?: Maybe<Scalars['String']>
  pool_gt?: Maybe<Scalars['String']>
  pool_gte?: Maybe<Scalars['String']>
  pool_in?: Maybe<Array<Scalars['String']>>
  pool_lt?: Maybe<Scalars['String']>
  pool_lte?: Maybe<Scalars['String']>
  pool_not?: Maybe<Scalars['String']>
  pool_not_contains?: Maybe<Scalars['String']>
  pool_not_ends_with?: Maybe<Scalars['String']>
  pool_not_in?: Maybe<Array<Scalars['String']>>
  pool_not_starts_with?: Maybe<Scalars['String']>
  pool_starts_with?: Maybe<Scalars['String']>
  recipient?: Maybe<Scalars['v3_Bytes']>
  recipient_contains?: Maybe<Scalars['v3_Bytes']>
  recipient_in?: Maybe<Array<Scalars['v3_Bytes']>>
  recipient_not?: Maybe<Scalars['v3_Bytes']>
  recipient_not_contains?: Maybe<Scalars['v3_Bytes']>
  recipient_not_in?: Maybe<Array<Scalars['v3_Bytes']>>
  sender?: Maybe<Scalars['v3_Bytes']>
  sender_contains?: Maybe<Scalars['v3_Bytes']>
  sender_in?: Maybe<Array<Scalars['v3_Bytes']>>
  sender_not?: Maybe<Scalars['v3_Bytes']>
  sender_not_contains?: Maybe<Scalars['v3_Bytes']>
  sender_not_in?: Maybe<Array<Scalars['v3_Bytes']>>
  sqrtPriceX96?: Maybe<Scalars['v3_BigInt']>
  sqrtPriceX96_gt?: Maybe<Scalars['v3_BigInt']>
  sqrtPriceX96_gte?: Maybe<Scalars['v3_BigInt']>
  sqrtPriceX96_in?: Maybe<Array<Scalars['v3_BigInt']>>
  sqrtPriceX96_lt?: Maybe<Scalars['v3_BigInt']>
  sqrtPriceX96_lte?: Maybe<Scalars['v3_BigInt']>
  sqrtPriceX96_not?: Maybe<Scalars['v3_BigInt']>
  sqrtPriceX96_not_in?: Maybe<Array<Scalars['v3_BigInt']>>
  tick?: Maybe<Scalars['v3_BigInt']>
  tick_gt?: Maybe<Scalars['v3_BigInt']>
  tick_gte?: Maybe<Scalars['v3_BigInt']>
  tick_in?: Maybe<Array<Scalars['v3_BigInt']>>
  tick_lt?: Maybe<Scalars['v3_BigInt']>
  tick_lte?: Maybe<Scalars['v3_BigInt']>
  tick_not?: Maybe<Scalars['v3_BigInt']>
  tick_not_in?: Maybe<Array<Scalars['v3_BigInt']>>
  timestamp?: Maybe<Scalars['v3_BigInt']>
  timestamp_gt?: Maybe<Scalars['v3_BigInt']>
  timestamp_gte?: Maybe<Scalars['v3_BigInt']>
  timestamp_in?: Maybe<Array<Scalars['v3_BigInt']>>
  timestamp_lt?: Maybe<Scalars['v3_BigInt']>
  timestamp_lte?: Maybe<Scalars['v3_BigInt']>
  timestamp_not?: Maybe<Scalars['v3_BigInt']>
  timestamp_not_in?: Maybe<Array<Scalars['v3_BigInt']>>
  token0?: Maybe<Scalars['String']>
  token0_contains?: Maybe<Scalars['String']>
  token0_ends_with?: Maybe<Scalars['String']>
  token0_gt?: Maybe<Scalars['String']>
  token0_gte?: Maybe<Scalars['String']>
  token0_in?: Maybe<Array<Scalars['String']>>
  token0_lt?: Maybe<Scalars['String']>
  token0_lte?: Maybe<Scalars['String']>
  token0_not?: Maybe<Scalars['String']>
  token0_not_contains?: Maybe<Scalars['String']>
  token0_not_ends_with?: Maybe<Scalars['String']>
  token0_not_in?: Maybe<Array<Scalars['String']>>
  token0_not_starts_with?: Maybe<Scalars['String']>
  token0_starts_with?: Maybe<Scalars['String']>
  token1?: Maybe<Scalars['String']>
  token1_contains?: Maybe<Scalars['String']>
  token1_ends_with?: Maybe<Scalars['String']>
  token1_gt?: Maybe<Scalars['String']>
  token1_gte?: Maybe<Scalars['String']>
  token1_in?: Maybe<Array<Scalars['String']>>
  token1_lt?: Maybe<Scalars['String']>
  token1_lte?: Maybe<Scalars['String']>
  token1_not?: Maybe<Scalars['String']>
  token1_not_contains?: Maybe<Scalars['String']>
  token1_not_ends_with?: Maybe<Scalars['String']>
  token1_not_in?: Maybe<Array<Scalars['String']>>
  token1_not_starts_with?: Maybe<Scalars['String']>
  token1_starts_with?: Maybe<Scalars['String']>
  transaction?: Maybe<Scalars['String']>
  transaction_contains?: Maybe<Scalars['String']>
  transaction_ends_with?: Maybe<Scalars['String']>
  transaction_gt?: Maybe<Scalars['String']>
  transaction_gte?: Maybe<Scalars['String']>
  transaction_in?: Maybe<Array<Scalars['String']>>
  transaction_lt?: Maybe<Scalars['String']>
  transaction_lte?: Maybe<Scalars['String']>
  transaction_not?: Maybe<Scalars['String']>
  transaction_not_contains?: Maybe<Scalars['String']>
  transaction_not_ends_with?: Maybe<Scalars['String']>
  transaction_not_in?: Maybe<Array<Scalars['String']>>
  transaction_not_starts_with?: Maybe<Scalars['String']>
  transaction_starts_with?: Maybe<Scalars['String']>
}

export enum V3_Swap_OrderBy {
  Amount0 = 'amount0',
  Amount1 = 'amount1',
  AmountUsd = 'amountUSD',
  Id = 'id',
  LogIndex = 'logIndex',
  Origin = 'origin',
  Pool = 'pool',
  Recipient = 'recipient',
  Sender = 'sender',
  SqrtPriceX96 = 'sqrtPriceX96',
  Tick = 'tick',
  Timestamp = 'timestamp',
  Token0 = 'token0',
  Token1 = 'token1',
  Transaction = 'transaction',
}

export type V3_Tick = {
  __typename?: 'v3_Tick'
  collectedFeesToken0: Scalars['v3_BigDecimal']
  collectedFeesToken1: Scalars['v3_BigDecimal']
  collectedFeesUSD: Scalars['v3_BigDecimal']
  createdAtBlockNumber: Scalars['v3_BigInt']
  createdAtTimestamp: Scalars['v3_BigInt']
  feeGrowthOutside0X128: Scalars['v3_BigInt']
  feeGrowthOutside1X128: Scalars['v3_BigInt']
  feesUSD: Scalars['v3_BigDecimal']
  id: Scalars['ID']
  liquidityGross: Scalars['v3_BigInt']
  liquidityNet: Scalars['v3_BigInt']
  liquidityProviderCount: Scalars['v3_BigInt']
  pool: V3_Pool
  poolAddress?: Maybe<Scalars['String']>
  price0: Scalars['v3_BigDecimal']
  price1: Scalars['v3_BigDecimal']
  tickIdx: Scalars['v3_BigInt']
  untrackedVolumeUSD: Scalars['v3_BigDecimal']
  volumeToken0: Scalars['v3_BigDecimal']
  volumeToken1: Scalars['v3_BigDecimal']
  volumeUSD: Scalars['v3_BigDecimal']
}

export type V3_TickDayData = {
  __typename?: 'v3_TickDayData'
  date: Scalars['Int']
  feeGrowthOutside0X128: Scalars['v3_BigInt']
  feeGrowthOutside1X128: Scalars['v3_BigInt']
  feesUSD: Scalars['v3_BigDecimal']
  id: Scalars['ID']
  liquidityGross: Scalars['v3_BigInt']
  liquidityNet: Scalars['v3_BigInt']
  pool: V3_Pool
  tick: V3_Tick
  volumeToken0: Scalars['v3_BigDecimal']
  volumeToken1: Scalars['v3_BigDecimal']
  volumeUSD: Scalars['v3_BigDecimal']
}

export type V3_TickDayData_Filter = {
  date?: Maybe<Scalars['Int']>
  date_gt?: Maybe<Scalars['Int']>
  date_gte?: Maybe<Scalars['Int']>
  date_in?: Maybe<Array<Scalars['Int']>>
  date_lt?: Maybe<Scalars['Int']>
  date_lte?: Maybe<Scalars['Int']>
  date_not?: Maybe<Scalars['Int']>
  date_not_in?: Maybe<Array<Scalars['Int']>>
  feeGrowthOutside0X128?: Maybe<Scalars['v3_BigInt']>
  feeGrowthOutside0X128_gt?: Maybe<Scalars['v3_BigInt']>
  feeGrowthOutside0X128_gte?: Maybe<Scalars['v3_BigInt']>
  feeGrowthOutside0X128_in?: Maybe<Array<Scalars['v3_BigInt']>>
  feeGrowthOutside0X128_lt?: Maybe<Scalars['v3_BigInt']>
  feeGrowthOutside0X128_lte?: Maybe<Scalars['v3_BigInt']>
  feeGrowthOutside0X128_not?: Maybe<Scalars['v3_BigInt']>
  feeGrowthOutside0X128_not_in?: Maybe<Array<Scalars['v3_BigInt']>>
  feeGrowthOutside1X128?: Maybe<Scalars['v3_BigInt']>
  feeGrowthOutside1X128_gt?: Maybe<Scalars['v3_BigInt']>
  feeGrowthOutside1X128_gte?: Maybe<Scalars['v3_BigInt']>
  feeGrowthOutside1X128_in?: Maybe<Array<Scalars['v3_BigInt']>>
  feeGrowthOutside1X128_lt?: Maybe<Scalars['v3_BigInt']>
  feeGrowthOutside1X128_lte?: Maybe<Scalars['v3_BigInt']>
  feeGrowthOutside1X128_not?: Maybe<Scalars['v3_BigInt']>
  feeGrowthOutside1X128_not_in?: Maybe<Array<Scalars['v3_BigInt']>>
  feesUSD?: Maybe<Scalars['v3_BigDecimal']>
  feesUSD_gt?: Maybe<Scalars['v3_BigDecimal']>
  feesUSD_gte?: Maybe<Scalars['v3_BigDecimal']>
  feesUSD_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  feesUSD_lt?: Maybe<Scalars['v3_BigDecimal']>
  feesUSD_lte?: Maybe<Scalars['v3_BigDecimal']>
  feesUSD_not?: Maybe<Scalars['v3_BigDecimal']>
  feesUSD_not_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  id?: Maybe<Scalars['ID']>
  id_gt?: Maybe<Scalars['ID']>
  id_gte?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  id_lt?: Maybe<Scalars['ID']>
  id_lte?: Maybe<Scalars['ID']>
  id_not?: Maybe<Scalars['ID']>
  id_not_in?: Maybe<Array<Scalars['ID']>>
  liquidityGross?: Maybe<Scalars['v3_BigInt']>
  liquidityGross_gt?: Maybe<Scalars['v3_BigInt']>
  liquidityGross_gte?: Maybe<Scalars['v3_BigInt']>
  liquidityGross_in?: Maybe<Array<Scalars['v3_BigInt']>>
  liquidityGross_lt?: Maybe<Scalars['v3_BigInt']>
  liquidityGross_lte?: Maybe<Scalars['v3_BigInt']>
  liquidityGross_not?: Maybe<Scalars['v3_BigInt']>
  liquidityGross_not_in?: Maybe<Array<Scalars['v3_BigInt']>>
  liquidityNet?: Maybe<Scalars['v3_BigInt']>
  liquidityNet_gt?: Maybe<Scalars['v3_BigInt']>
  liquidityNet_gte?: Maybe<Scalars['v3_BigInt']>
  liquidityNet_in?: Maybe<Array<Scalars['v3_BigInt']>>
  liquidityNet_lt?: Maybe<Scalars['v3_BigInt']>
  liquidityNet_lte?: Maybe<Scalars['v3_BigInt']>
  liquidityNet_not?: Maybe<Scalars['v3_BigInt']>
  liquidityNet_not_in?: Maybe<Array<Scalars['v3_BigInt']>>
  pool?: Maybe<Scalars['String']>
  pool_contains?: Maybe<Scalars['String']>
  pool_ends_with?: Maybe<Scalars['String']>
  pool_gt?: Maybe<Scalars['String']>
  pool_gte?: Maybe<Scalars['String']>
  pool_in?: Maybe<Array<Scalars['String']>>
  pool_lt?: Maybe<Scalars['String']>
  pool_lte?: Maybe<Scalars['String']>
  pool_not?: Maybe<Scalars['String']>
  pool_not_contains?: Maybe<Scalars['String']>
  pool_not_ends_with?: Maybe<Scalars['String']>
  pool_not_in?: Maybe<Array<Scalars['String']>>
  pool_not_starts_with?: Maybe<Scalars['String']>
  pool_starts_with?: Maybe<Scalars['String']>
  tick?: Maybe<Scalars['String']>
  tick_contains?: Maybe<Scalars['String']>
  tick_ends_with?: Maybe<Scalars['String']>
  tick_gt?: Maybe<Scalars['String']>
  tick_gte?: Maybe<Scalars['String']>
  tick_in?: Maybe<Array<Scalars['String']>>
  tick_lt?: Maybe<Scalars['String']>
  tick_lte?: Maybe<Scalars['String']>
  tick_not?: Maybe<Scalars['String']>
  tick_not_contains?: Maybe<Scalars['String']>
  tick_not_ends_with?: Maybe<Scalars['String']>
  tick_not_in?: Maybe<Array<Scalars['String']>>
  tick_not_starts_with?: Maybe<Scalars['String']>
  tick_starts_with?: Maybe<Scalars['String']>
  volumeToken0?: Maybe<Scalars['v3_BigDecimal']>
  volumeToken0_gt?: Maybe<Scalars['v3_BigDecimal']>
  volumeToken0_gte?: Maybe<Scalars['v3_BigDecimal']>
  volumeToken0_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  volumeToken0_lt?: Maybe<Scalars['v3_BigDecimal']>
  volumeToken0_lte?: Maybe<Scalars['v3_BigDecimal']>
  volumeToken0_not?: Maybe<Scalars['v3_BigDecimal']>
  volumeToken0_not_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  volumeToken1?: Maybe<Scalars['v3_BigDecimal']>
  volumeToken1_gt?: Maybe<Scalars['v3_BigDecimal']>
  volumeToken1_gte?: Maybe<Scalars['v3_BigDecimal']>
  volumeToken1_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  volumeToken1_lt?: Maybe<Scalars['v3_BigDecimal']>
  volumeToken1_lte?: Maybe<Scalars['v3_BigDecimal']>
  volumeToken1_not?: Maybe<Scalars['v3_BigDecimal']>
  volumeToken1_not_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  volumeUSD?: Maybe<Scalars['v3_BigDecimal']>
  volumeUSD_gt?: Maybe<Scalars['v3_BigDecimal']>
  volumeUSD_gte?: Maybe<Scalars['v3_BigDecimal']>
  volumeUSD_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  volumeUSD_lt?: Maybe<Scalars['v3_BigDecimal']>
  volumeUSD_lte?: Maybe<Scalars['v3_BigDecimal']>
  volumeUSD_not?: Maybe<Scalars['v3_BigDecimal']>
  volumeUSD_not_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
}

export enum V3_TickDayData_OrderBy {
  Date = 'date',
  FeeGrowthOutside0X128 = 'feeGrowthOutside0X128',
  FeeGrowthOutside1X128 = 'feeGrowthOutside1X128',
  FeesUsd = 'feesUSD',
  Id = 'id',
  LiquidityGross = 'liquidityGross',
  LiquidityNet = 'liquidityNet',
  Pool = 'pool',
  Tick = 'tick',
  VolumeToken0 = 'volumeToken0',
  VolumeToken1 = 'volumeToken1',
  VolumeUsd = 'volumeUSD',
}

export type V3_TickHourData = {
  __typename?: 'v3_TickHourData'
  feesUSD: Scalars['v3_BigDecimal']
  id: Scalars['ID']
  liquidityGross: Scalars['v3_BigInt']
  liquidityNet: Scalars['v3_BigInt']
  periodStartUnix: Scalars['Int']
  pool: V3_Pool
  tick: V3_Tick
  volumeToken0: Scalars['v3_BigDecimal']
  volumeToken1: Scalars['v3_BigDecimal']
  volumeUSD: Scalars['v3_BigDecimal']
}

export type V3_TickHourData_Filter = {
  feesUSD?: Maybe<Scalars['v3_BigDecimal']>
  feesUSD_gt?: Maybe<Scalars['v3_BigDecimal']>
  feesUSD_gte?: Maybe<Scalars['v3_BigDecimal']>
  feesUSD_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  feesUSD_lt?: Maybe<Scalars['v3_BigDecimal']>
  feesUSD_lte?: Maybe<Scalars['v3_BigDecimal']>
  feesUSD_not?: Maybe<Scalars['v3_BigDecimal']>
  feesUSD_not_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  id?: Maybe<Scalars['ID']>
  id_gt?: Maybe<Scalars['ID']>
  id_gte?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  id_lt?: Maybe<Scalars['ID']>
  id_lte?: Maybe<Scalars['ID']>
  id_not?: Maybe<Scalars['ID']>
  id_not_in?: Maybe<Array<Scalars['ID']>>
  liquidityGross?: Maybe<Scalars['v3_BigInt']>
  liquidityGross_gt?: Maybe<Scalars['v3_BigInt']>
  liquidityGross_gte?: Maybe<Scalars['v3_BigInt']>
  liquidityGross_in?: Maybe<Array<Scalars['v3_BigInt']>>
  liquidityGross_lt?: Maybe<Scalars['v3_BigInt']>
  liquidityGross_lte?: Maybe<Scalars['v3_BigInt']>
  liquidityGross_not?: Maybe<Scalars['v3_BigInt']>
  liquidityGross_not_in?: Maybe<Array<Scalars['v3_BigInt']>>
  liquidityNet?: Maybe<Scalars['v3_BigInt']>
  liquidityNet_gt?: Maybe<Scalars['v3_BigInt']>
  liquidityNet_gte?: Maybe<Scalars['v3_BigInt']>
  liquidityNet_in?: Maybe<Array<Scalars['v3_BigInt']>>
  liquidityNet_lt?: Maybe<Scalars['v3_BigInt']>
  liquidityNet_lte?: Maybe<Scalars['v3_BigInt']>
  liquidityNet_not?: Maybe<Scalars['v3_BigInt']>
  liquidityNet_not_in?: Maybe<Array<Scalars['v3_BigInt']>>
  periodStartUnix?: Maybe<Scalars['Int']>
  periodStartUnix_gt?: Maybe<Scalars['Int']>
  periodStartUnix_gte?: Maybe<Scalars['Int']>
  periodStartUnix_in?: Maybe<Array<Scalars['Int']>>
  periodStartUnix_lt?: Maybe<Scalars['Int']>
  periodStartUnix_lte?: Maybe<Scalars['Int']>
  periodStartUnix_not?: Maybe<Scalars['Int']>
  periodStartUnix_not_in?: Maybe<Array<Scalars['Int']>>
  pool?: Maybe<Scalars['String']>
  pool_contains?: Maybe<Scalars['String']>
  pool_ends_with?: Maybe<Scalars['String']>
  pool_gt?: Maybe<Scalars['String']>
  pool_gte?: Maybe<Scalars['String']>
  pool_in?: Maybe<Array<Scalars['String']>>
  pool_lt?: Maybe<Scalars['String']>
  pool_lte?: Maybe<Scalars['String']>
  pool_not?: Maybe<Scalars['String']>
  pool_not_contains?: Maybe<Scalars['String']>
  pool_not_ends_with?: Maybe<Scalars['String']>
  pool_not_in?: Maybe<Array<Scalars['String']>>
  pool_not_starts_with?: Maybe<Scalars['String']>
  pool_starts_with?: Maybe<Scalars['String']>
  tick?: Maybe<Scalars['String']>
  tick_contains?: Maybe<Scalars['String']>
  tick_ends_with?: Maybe<Scalars['String']>
  tick_gt?: Maybe<Scalars['String']>
  tick_gte?: Maybe<Scalars['String']>
  tick_in?: Maybe<Array<Scalars['String']>>
  tick_lt?: Maybe<Scalars['String']>
  tick_lte?: Maybe<Scalars['String']>
  tick_not?: Maybe<Scalars['String']>
  tick_not_contains?: Maybe<Scalars['String']>
  tick_not_ends_with?: Maybe<Scalars['String']>
  tick_not_in?: Maybe<Array<Scalars['String']>>
  tick_not_starts_with?: Maybe<Scalars['String']>
  tick_starts_with?: Maybe<Scalars['String']>
  volumeToken0?: Maybe<Scalars['v3_BigDecimal']>
  volumeToken0_gt?: Maybe<Scalars['v3_BigDecimal']>
  volumeToken0_gte?: Maybe<Scalars['v3_BigDecimal']>
  volumeToken0_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  volumeToken0_lt?: Maybe<Scalars['v3_BigDecimal']>
  volumeToken0_lte?: Maybe<Scalars['v3_BigDecimal']>
  volumeToken0_not?: Maybe<Scalars['v3_BigDecimal']>
  volumeToken0_not_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  volumeToken1?: Maybe<Scalars['v3_BigDecimal']>
  volumeToken1_gt?: Maybe<Scalars['v3_BigDecimal']>
  volumeToken1_gte?: Maybe<Scalars['v3_BigDecimal']>
  volumeToken1_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  volumeToken1_lt?: Maybe<Scalars['v3_BigDecimal']>
  volumeToken1_lte?: Maybe<Scalars['v3_BigDecimal']>
  volumeToken1_not?: Maybe<Scalars['v3_BigDecimal']>
  volumeToken1_not_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  volumeUSD?: Maybe<Scalars['v3_BigDecimal']>
  volumeUSD_gt?: Maybe<Scalars['v3_BigDecimal']>
  volumeUSD_gte?: Maybe<Scalars['v3_BigDecimal']>
  volumeUSD_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  volumeUSD_lt?: Maybe<Scalars['v3_BigDecimal']>
  volumeUSD_lte?: Maybe<Scalars['v3_BigDecimal']>
  volumeUSD_not?: Maybe<Scalars['v3_BigDecimal']>
  volumeUSD_not_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
}

export enum V3_TickHourData_OrderBy {
  FeesUsd = 'feesUSD',
  Id = 'id',
  LiquidityGross = 'liquidityGross',
  LiquidityNet = 'liquidityNet',
  PeriodStartUnix = 'periodStartUnix',
  Pool = 'pool',
  Tick = 'tick',
  VolumeToken0 = 'volumeToken0',
  VolumeToken1 = 'volumeToken1',
  VolumeUsd = 'volumeUSD',
}

export type V3_Tick_Filter = {
  collectedFeesToken0?: Maybe<Scalars['v3_BigDecimal']>
  collectedFeesToken0_gt?: Maybe<Scalars['v3_BigDecimal']>
  collectedFeesToken0_gte?: Maybe<Scalars['v3_BigDecimal']>
  collectedFeesToken0_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  collectedFeesToken0_lt?: Maybe<Scalars['v3_BigDecimal']>
  collectedFeesToken0_lte?: Maybe<Scalars['v3_BigDecimal']>
  collectedFeesToken0_not?: Maybe<Scalars['v3_BigDecimal']>
  collectedFeesToken0_not_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  collectedFeesToken1?: Maybe<Scalars['v3_BigDecimal']>
  collectedFeesToken1_gt?: Maybe<Scalars['v3_BigDecimal']>
  collectedFeesToken1_gte?: Maybe<Scalars['v3_BigDecimal']>
  collectedFeesToken1_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  collectedFeesToken1_lt?: Maybe<Scalars['v3_BigDecimal']>
  collectedFeesToken1_lte?: Maybe<Scalars['v3_BigDecimal']>
  collectedFeesToken1_not?: Maybe<Scalars['v3_BigDecimal']>
  collectedFeesToken1_not_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  collectedFeesUSD?: Maybe<Scalars['v3_BigDecimal']>
  collectedFeesUSD_gt?: Maybe<Scalars['v3_BigDecimal']>
  collectedFeesUSD_gte?: Maybe<Scalars['v3_BigDecimal']>
  collectedFeesUSD_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  collectedFeesUSD_lt?: Maybe<Scalars['v3_BigDecimal']>
  collectedFeesUSD_lte?: Maybe<Scalars['v3_BigDecimal']>
  collectedFeesUSD_not?: Maybe<Scalars['v3_BigDecimal']>
  collectedFeesUSD_not_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  createdAtBlockNumber?: Maybe<Scalars['v3_BigInt']>
  createdAtBlockNumber_gt?: Maybe<Scalars['v3_BigInt']>
  createdAtBlockNumber_gte?: Maybe<Scalars['v3_BigInt']>
  createdAtBlockNumber_in?: Maybe<Array<Scalars['v3_BigInt']>>
  createdAtBlockNumber_lt?: Maybe<Scalars['v3_BigInt']>
  createdAtBlockNumber_lte?: Maybe<Scalars['v3_BigInt']>
  createdAtBlockNumber_not?: Maybe<Scalars['v3_BigInt']>
  createdAtBlockNumber_not_in?: Maybe<Array<Scalars['v3_BigInt']>>
  createdAtTimestamp?: Maybe<Scalars['v3_BigInt']>
  createdAtTimestamp_gt?: Maybe<Scalars['v3_BigInt']>
  createdAtTimestamp_gte?: Maybe<Scalars['v3_BigInt']>
  createdAtTimestamp_in?: Maybe<Array<Scalars['v3_BigInt']>>
  createdAtTimestamp_lt?: Maybe<Scalars['v3_BigInt']>
  createdAtTimestamp_lte?: Maybe<Scalars['v3_BigInt']>
  createdAtTimestamp_not?: Maybe<Scalars['v3_BigInt']>
  createdAtTimestamp_not_in?: Maybe<Array<Scalars['v3_BigInt']>>
  feeGrowthOutside0X128?: Maybe<Scalars['v3_BigInt']>
  feeGrowthOutside0X128_gt?: Maybe<Scalars['v3_BigInt']>
  feeGrowthOutside0X128_gte?: Maybe<Scalars['v3_BigInt']>
  feeGrowthOutside0X128_in?: Maybe<Array<Scalars['v3_BigInt']>>
  feeGrowthOutside0X128_lt?: Maybe<Scalars['v3_BigInt']>
  feeGrowthOutside0X128_lte?: Maybe<Scalars['v3_BigInt']>
  feeGrowthOutside0X128_not?: Maybe<Scalars['v3_BigInt']>
  feeGrowthOutside0X128_not_in?: Maybe<Array<Scalars['v3_BigInt']>>
  feeGrowthOutside1X128?: Maybe<Scalars['v3_BigInt']>
  feeGrowthOutside1X128_gt?: Maybe<Scalars['v3_BigInt']>
  feeGrowthOutside1X128_gte?: Maybe<Scalars['v3_BigInt']>
  feeGrowthOutside1X128_in?: Maybe<Array<Scalars['v3_BigInt']>>
  feeGrowthOutside1X128_lt?: Maybe<Scalars['v3_BigInt']>
  feeGrowthOutside1X128_lte?: Maybe<Scalars['v3_BigInt']>
  feeGrowthOutside1X128_not?: Maybe<Scalars['v3_BigInt']>
  feeGrowthOutside1X128_not_in?: Maybe<Array<Scalars['v3_BigInt']>>
  feesUSD?: Maybe<Scalars['v3_BigDecimal']>
  feesUSD_gt?: Maybe<Scalars['v3_BigDecimal']>
  feesUSD_gte?: Maybe<Scalars['v3_BigDecimal']>
  feesUSD_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  feesUSD_lt?: Maybe<Scalars['v3_BigDecimal']>
  feesUSD_lte?: Maybe<Scalars['v3_BigDecimal']>
  feesUSD_not?: Maybe<Scalars['v3_BigDecimal']>
  feesUSD_not_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  id?: Maybe<Scalars['ID']>
  id_gt?: Maybe<Scalars['ID']>
  id_gte?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  id_lt?: Maybe<Scalars['ID']>
  id_lte?: Maybe<Scalars['ID']>
  id_not?: Maybe<Scalars['ID']>
  id_not_in?: Maybe<Array<Scalars['ID']>>
  liquidityGross?: Maybe<Scalars['v3_BigInt']>
  liquidityGross_gt?: Maybe<Scalars['v3_BigInt']>
  liquidityGross_gte?: Maybe<Scalars['v3_BigInt']>
  liquidityGross_in?: Maybe<Array<Scalars['v3_BigInt']>>
  liquidityGross_lt?: Maybe<Scalars['v3_BigInt']>
  liquidityGross_lte?: Maybe<Scalars['v3_BigInt']>
  liquidityGross_not?: Maybe<Scalars['v3_BigInt']>
  liquidityGross_not_in?: Maybe<Array<Scalars['v3_BigInt']>>
  liquidityNet?: Maybe<Scalars['v3_BigInt']>
  liquidityNet_gt?: Maybe<Scalars['v3_BigInt']>
  liquidityNet_gte?: Maybe<Scalars['v3_BigInt']>
  liquidityNet_in?: Maybe<Array<Scalars['v3_BigInt']>>
  liquidityNet_lt?: Maybe<Scalars['v3_BigInt']>
  liquidityNet_lte?: Maybe<Scalars['v3_BigInt']>
  liquidityNet_not?: Maybe<Scalars['v3_BigInt']>
  liquidityNet_not_in?: Maybe<Array<Scalars['v3_BigInt']>>
  liquidityProviderCount?: Maybe<Scalars['v3_BigInt']>
  liquidityProviderCount_gt?: Maybe<Scalars['v3_BigInt']>
  liquidityProviderCount_gte?: Maybe<Scalars['v3_BigInt']>
  liquidityProviderCount_in?: Maybe<Array<Scalars['v3_BigInt']>>
  liquidityProviderCount_lt?: Maybe<Scalars['v3_BigInt']>
  liquidityProviderCount_lte?: Maybe<Scalars['v3_BigInt']>
  liquidityProviderCount_not?: Maybe<Scalars['v3_BigInt']>
  liquidityProviderCount_not_in?: Maybe<Array<Scalars['v3_BigInt']>>
  pool?: Maybe<Scalars['String']>
  poolAddress?: Maybe<Scalars['String']>
  poolAddress_contains?: Maybe<Scalars['String']>
  poolAddress_ends_with?: Maybe<Scalars['String']>
  poolAddress_gt?: Maybe<Scalars['String']>
  poolAddress_gte?: Maybe<Scalars['String']>
  poolAddress_in?: Maybe<Array<Scalars['String']>>
  poolAddress_lt?: Maybe<Scalars['String']>
  poolAddress_lte?: Maybe<Scalars['String']>
  poolAddress_not?: Maybe<Scalars['String']>
  poolAddress_not_contains?: Maybe<Scalars['String']>
  poolAddress_not_ends_with?: Maybe<Scalars['String']>
  poolAddress_not_in?: Maybe<Array<Scalars['String']>>
  poolAddress_not_starts_with?: Maybe<Scalars['String']>
  poolAddress_starts_with?: Maybe<Scalars['String']>
  pool_contains?: Maybe<Scalars['String']>
  pool_ends_with?: Maybe<Scalars['String']>
  pool_gt?: Maybe<Scalars['String']>
  pool_gte?: Maybe<Scalars['String']>
  pool_in?: Maybe<Array<Scalars['String']>>
  pool_lt?: Maybe<Scalars['String']>
  pool_lte?: Maybe<Scalars['String']>
  pool_not?: Maybe<Scalars['String']>
  pool_not_contains?: Maybe<Scalars['String']>
  pool_not_ends_with?: Maybe<Scalars['String']>
  pool_not_in?: Maybe<Array<Scalars['String']>>
  pool_not_starts_with?: Maybe<Scalars['String']>
  pool_starts_with?: Maybe<Scalars['String']>
  price0?: Maybe<Scalars['v3_BigDecimal']>
  price0_gt?: Maybe<Scalars['v3_BigDecimal']>
  price0_gte?: Maybe<Scalars['v3_BigDecimal']>
  price0_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  price0_lt?: Maybe<Scalars['v3_BigDecimal']>
  price0_lte?: Maybe<Scalars['v3_BigDecimal']>
  price0_not?: Maybe<Scalars['v3_BigDecimal']>
  price0_not_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  price1?: Maybe<Scalars['v3_BigDecimal']>
  price1_gt?: Maybe<Scalars['v3_BigDecimal']>
  price1_gte?: Maybe<Scalars['v3_BigDecimal']>
  price1_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  price1_lt?: Maybe<Scalars['v3_BigDecimal']>
  price1_lte?: Maybe<Scalars['v3_BigDecimal']>
  price1_not?: Maybe<Scalars['v3_BigDecimal']>
  price1_not_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  tickIdx?: Maybe<Scalars['v3_BigInt']>
  tickIdx_gt?: Maybe<Scalars['v3_BigInt']>
  tickIdx_gte?: Maybe<Scalars['v3_BigInt']>
  tickIdx_in?: Maybe<Array<Scalars['v3_BigInt']>>
  tickIdx_lt?: Maybe<Scalars['v3_BigInt']>
  tickIdx_lte?: Maybe<Scalars['v3_BigInt']>
  tickIdx_not?: Maybe<Scalars['v3_BigInt']>
  tickIdx_not_in?: Maybe<Array<Scalars['v3_BigInt']>>
  untrackedVolumeUSD?: Maybe<Scalars['v3_BigDecimal']>
  untrackedVolumeUSD_gt?: Maybe<Scalars['v3_BigDecimal']>
  untrackedVolumeUSD_gte?: Maybe<Scalars['v3_BigDecimal']>
  untrackedVolumeUSD_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  untrackedVolumeUSD_lt?: Maybe<Scalars['v3_BigDecimal']>
  untrackedVolumeUSD_lte?: Maybe<Scalars['v3_BigDecimal']>
  untrackedVolumeUSD_not?: Maybe<Scalars['v3_BigDecimal']>
  untrackedVolumeUSD_not_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  volumeToken0?: Maybe<Scalars['v3_BigDecimal']>
  volumeToken0_gt?: Maybe<Scalars['v3_BigDecimal']>
  volumeToken0_gte?: Maybe<Scalars['v3_BigDecimal']>
  volumeToken0_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  volumeToken0_lt?: Maybe<Scalars['v3_BigDecimal']>
  volumeToken0_lte?: Maybe<Scalars['v3_BigDecimal']>
  volumeToken0_not?: Maybe<Scalars['v3_BigDecimal']>
  volumeToken0_not_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  volumeToken1?: Maybe<Scalars['v3_BigDecimal']>
  volumeToken1_gt?: Maybe<Scalars['v3_BigDecimal']>
  volumeToken1_gte?: Maybe<Scalars['v3_BigDecimal']>
  volumeToken1_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  volumeToken1_lt?: Maybe<Scalars['v3_BigDecimal']>
  volumeToken1_lte?: Maybe<Scalars['v3_BigDecimal']>
  volumeToken1_not?: Maybe<Scalars['v3_BigDecimal']>
  volumeToken1_not_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  volumeUSD?: Maybe<Scalars['v3_BigDecimal']>
  volumeUSD_gt?: Maybe<Scalars['v3_BigDecimal']>
  volumeUSD_gte?: Maybe<Scalars['v3_BigDecimal']>
  volumeUSD_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  volumeUSD_lt?: Maybe<Scalars['v3_BigDecimal']>
  volumeUSD_lte?: Maybe<Scalars['v3_BigDecimal']>
  volumeUSD_not?: Maybe<Scalars['v3_BigDecimal']>
  volumeUSD_not_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
}

export enum V3_Tick_OrderBy {
  CollectedFeesToken0 = 'collectedFeesToken0',
  CollectedFeesToken1 = 'collectedFeesToken1',
  CollectedFeesUsd = 'collectedFeesUSD',
  CreatedAtBlockNumber = 'createdAtBlockNumber',
  CreatedAtTimestamp = 'createdAtTimestamp',
  FeeGrowthOutside0X128 = 'feeGrowthOutside0X128',
  FeeGrowthOutside1X128 = 'feeGrowthOutside1X128',
  FeesUsd = 'feesUSD',
  Id = 'id',
  LiquidityGross = 'liquidityGross',
  LiquidityNet = 'liquidityNet',
  LiquidityProviderCount = 'liquidityProviderCount',
  Pool = 'pool',
  PoolAddress = 'poolAddress',
  Price0 = 'price0',
  Price1 = 'price1',
  TickIdx = 'tickIdx',
  UntrackedVolumeUsd = 'untrackedVolumeUSD',
  VolumeToken0 = 'volumeToken0',
  VolumeToken1 = 'volumeToken1',
  VolumeUsd = 'volumeUSD',
}

export type V3_Token = {
  __typename?: 'v3_Token'
  decimals: Scalars['v3_BigInt']
  derivedETH: Scalars['v3_BigDecimal']
  feesUSD: Scalars['v3_BigDecimal']
  id: Scalars['ID']
  name: Scalars['String']
  poolCount: Scalars['v3_BigInt']
  symbol: Scalars['String']
  tokenDayData: Array<V3_TokenDayData>
  totalSupply: Scalars['v3_BigInt']
  totalValueLocked: Scalars['v3_BigDecimal']
  totalValueLockedUSD: Scalars['v3_BigDecimal']
  totalValueLockedUSDUntracked: Scalars['v3_BigDecimal']
  txCount: Scalars['v3_BigInt']
  untrackedVolumeUSD: Scalars['v3_BigDecimal']
  volume: Scalars['v3_BigDecimal']
  volumeUSD: Scalars['v3_BigDecimal']
  whitelistPools: Array<V3_Pool>
}

export type V3_TokenTokenDayDataArgs = {
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3_TokenDayData_OrderBy>
  orderDirection?: Maybe<V3_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  where?: Maybe<V3_TokenDayData_Filter>
}

export type V3_TokenWhitelistPoolsArgs = {
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3_Pool_OrderBy>
  orderDirection?: Maybe<V3_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  where?: Maybe<V3_Pool_Filter>
}

export type V3_TokenDayData = {
  __typename?: 'v3_TokenDayData'
  close: Scalars['v3_BigDecimal']
  date: Scalars['Int']
  feesUSD: Scalars['v3_BigDecimal']
  high: Scalars['v3_BigDecimal']
  id: Scalars['ID']
  low: Scalars['v3_BigDecimal']
  open: Scalars['v3_BigDecimal']
  priceUSD: Scalars['v3_BigDecimal']
  token: V3_Token
  totalValueLocked: Scalars['v3_BigDecimal']
  totalValueLockedUSD: Scalars['v3_BigDecimal']
  untrackedVolumeUSD: Scalars['v3_BigDecimal']
  volume: Scalars['v3_BigDecimal']
  volumeUSD: Scalars['v3_BigDecimal']
}

export type V3_TokenDayData_Filter = {
  close?: Maybe<Scalars['v3_BigDecimal']>
  close_gt?: Maybe<Scalars['v3_BigDecimal']>
  close_gte?: Maybe<Scalars['v3_BigDecimal']>
  close_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  close_lt?: Maybe<Scalars['v3_BigDecimal']>
  close_lte?: Maybe<Scalars['v3_BigDecimal']>
  close_not?: Maybe<Scalars['v3_BigDecimal']>
  close_not_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  date?: Maybe<Scalars['Int']>
  date_gt?: Maybe<Scalars['Int']>
  date_gte?: Maybe<Scalars['Int']>
  date_in?: Maybe<Array<Scalars['Int']>>
  date_lt?: Maybe<Scalars['Int']>
  date_lte?: Maybe<Scalars['Int']>
  date_not?: Maybe<Scalars['Int']>
  date_not_in?: Maybe<Array<Scalars['Int']>>
  feesUSD?: Maybe<Scalars['v3_BigDecimal']>
  feesUSD_gt?: Maybe<Scalars['v3_BigDecimal']>
  feesUSD_gte?: Maybe<Scalars['v3_BigDecimal']>
  feesUSD_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  feesUSD_lt?: Maybe<Scalars['v3_BigDecimal']>
  feesUSD_lte?: Maybe<Scalars['v3_BigDecimal']>
  feesUSD_not?: Maybe<Scalars['v3_BigDecimal']>
  feesUSD_not_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  high?: Maybe<Scalars['v3_BigDecimal']>
  high_gt?: Maybe<Scalars['v3_BigDecimal']>
  high_gte?: Maybe<Scalars['v3_BigDecimal']>
  high_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  high_lt?: Maybe<Scalars['v3_BigDecimal']>
  high_lte?: Maybe<Scalars['v3_BigDecimal']>
  high_not?: Maybe<Scalars['v3_BigDecimal']>
  high_not_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  id?: Maybe<Scalars['ID']>
  id_gt?: Maybe<Scalars['ID']>
  id_gte?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  id_lt?: Maybe<Scalars['ID']>
  id_lte?: Maybe<Scalars['ID']>
  id_not?: Maybe<Scalars['ID']>
  id_not_in?: Maybe<Array<Scalars['ID']>>
  low?: Maybe<Scalars['v3_BigDecimal']>
  low_gt?: Maybe<Scalars['v3_BigDecimal']>
  low_gte?: Maybe<Scalars['v3_BigDecimal']>
  low_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  low_lt?: Maybe<Scalars['v3_BigDecimal']>
  low_lte?: Maybe<Scalars['v3_BigDecimal']>
  low_not?: Maybe<Scalars['v3_BigDecimal']>
  low_not_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  open?: Maybe<Scalars['v3_BigDecimal']>
  open_gt?: Maybe<Scalars['v3_BigDecimal']>
  open_gte?: Maybe<Scalars['v3_BigDecimal']>
  open_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  open_lt?: Maybe<Scalars['v3_BigDecimal']>
  open_lte?: Maybe<Scalars['v3_BigDecimal']>
  open_not?: Maybe<Scalars['v3_BigDecimal']>
  open_not_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  priceUSD?: Maybe<Scalars['v3_BigDecimal']>
  priceUSD_gt?: Maybe<Scalars['v3_BigDecimal']>
  priceUSD_gte?: Maybe<Scalars['v3_BigDecimal']>
  priceUSD_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  priceUSD_lt?: Maybe<Scalars['v3_BigDecimal']>
  priceUSD_lte?: Maybe<Scalars['v3_BigDecimal']>
  priceUSD_not?: Maybe<Scalars['v3_BigDecimal']>
  priceUSD_not_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  token?: Maybe<Scalars['String']>
  token_contains?: Maybe<Scalars['String']>
  token_ends_with?: Maybe<Scalars['String']>
  token_gt?: Maybe<Scalars['String']>
  token_gte?: Maybe<Scalars['String']>
  token_in?: Maybe<Array<Scalars['String']>>
  token_lt?: Maybe<Scalars['String']>
  token_lte?: Maybe<Scalars['String']>
  token_not?: Maybe<Scalars['String']>
  token_not_contains?: Maybe<Scalars['String']>
  token_not_ends_with?: Maybe<Scalars['String']>
  token_not_in?: Maybe<Array<Scalars['String']>>
  token_not_starts_with?: Maybe<Scalars['String']>
  token_starts_with?: Maybe<Scalars['String']>
  totalValueLocked?: Maybe<Scalars['v3_BigDecimal']>
  totalValueLockedUSD?: Maybe<Scalars['v3_BigDecimal']>
  totalValueLockedUSD_gt?: Maybe<Scalars['v3_BigDecimal']>
  totalValueLockedUSD_gte?: Maybe<Scalars['v3_BigDecimal']>
  totalValueLockedUSD_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  totalValueLockedUSD_lt?: Maybe<Scalars['v3_BigDecimal']>
  totalValueLockedUSD_lte?: Maybe<Scalars['v3_BigDecimal']>
  totalValueLockedUSD_not?: Maybe<Scalars['v3_BigDecimal']>
  totalValueLockedUSD_not_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  totalValueLocked_gt?: Maybe<Scalars['v3_BigDecimal']>
  totalValueLocked_gte?: Maybe<Scalars['v3_BigDecimal']>
  totalValueLocked_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  totalValueLocked_lt?: Maybe<Scalars['v3_BigDecimal']>
  totalValueLocked_lte?: Maybe<Scalars['v3_BigDecimal']>
  totalValueLocked_not?: Maybe<Scalars['v3_BigDecimal']>
  totalValueLocked_not_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  untrackedVolumeUSD?: Maybe<Scalars['v3_BigDecimal']>
  untrackedVolumeUSD_gt?: Maybe<Scalars['v3_BigDecimal']>
  untrackedVolumeUSD_gte?: Maybe<Scalars['v3_BigDecimal']>
  untrackedVolumeUSD_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  untrackedVolumeUSD_lt?: Maybe<Scalars['v3_BigDecimal']>
  untrackedVolumeUSD_lte?: Maybe<Scalars['v3_BigDecimal']>
  untrackedVolumeUSD_not?: Maybe<Scalars['v3_BigDecimal']>
  untrackedVolumeUSD_not_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  volume?: Maybe<Scalars['v3_BigDecimal']>
  volumeUSD?: Maybe<Scalars['v3_BigDecimal']>
  volumeUSD_gt?: Maybe<Scalars['v3_BigDecimal']>
  volumeUSD_gte?: Maybe<Scalars['v3_BigDecimal']>
  volumeUSD_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  volumeUSD_lt?: Maybe<Scalars['v3_BigDecimal']>
  volumeUSD_lte?: Maybe<Scalars['v3_BigDecimal']>
  volumeUSD_not?: Maybe<Scalars['v3_BigDecimal']>
  volumeUSD_not_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  volume_gt?: Maybe<Scalars['v3_BigDecimal']>
  volume_gte?: Maybe<Scalars['v3_BigDecimal']>
  volume_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  volume_lt?: Maybe<Scalars['v3_BigDecimal']>
  volume_lte?: Maybe<Scalars['v3_BigDecimal']>
  volume_not?: Maybe<Scalars['v3_BigDecimal']>
  volume_not_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
}

export enum V3_TokenDayData_OrderBy {
  Close = 'close',
  Date = 'date',
  FeesUsd = 'feesUSD',
  High = 'high',
  Id = 'id',
  Low = 'low',
  Open = 'open',
  PriceUsd = 'priceUSD',
  Token = 'token',
  TotalValueLocked = 'totalValueLocked',
  TotalValueLockedUsd = 'totalValueLockedUSD',
  UntrackedVolumeUsd = 'untrackedVolumeUSD',
  Volume = 'volume',
  VolumeUsd = 'volumeUSD',
}

export type V3_TokenHourData = {
  __typename?: 'v3_TokenHourData'
  close: Scalars['v3_BigDecimal']
  feesUSD: Scalars['v3_BigDecimal']
  high: Scalars['v3_BigDecimal']
  id: Scalars['ID']
  low: Scalars['v3_BigDecimal']
  open: Scalars['v3_BigDecimal']
  periodStartUnix: Scalars['Int']
  priceUSD: Scalars['v3_BigDecimal']
  token: V3_Token
  totalValueLocked: Scalars['v3_BigDecimal']
  totalValueLockedUSD: Scalars['v3_BigDecimal']
  untrackedVolumeUSD: Scalars['v3_BigDecimal']
  volume: Scalars['v3_BigDecimal']
  volumeUSD: Scalars['v3_BigDecimal']
}

export type V3_TokenHourData_Filter = {
  close?: Maybe<Scalars['v3_BigDecimal']>
  close_gt?: Maybe<Scalars['v3_BigDecimal']>
  close_gte?: Maybe<Scalars['v3_BigDecimal']>
  close_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  close_lt?: Maybe<Scalars['v3_BigDecimal']>
  close_lte?: Maybe<Scalars['v3_BigDecimal']>
  close_not?: Maybe<Scalars['v3_BigDecimal']>
  close_not_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  feesUSD?: Maybe<Scalars['v3_BigDecimal']>
  feesUSD_gt?: Maybe<Scalars['v3_BigDecimal']>
  feesUSD_gte?: Maybe<Scalars['v3_BigDecimal']>
  feesUSD_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  feesUSD_lt?: Maybe<Scalars['v3_BigDecimal']>
  feesUSD_lte?: Maybe<Scalars['v3_BigDecimal']>
  feesUSD_not?: Maybe<Scalars['v3_BigDecimal']>
  feesUSD_not_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  high?: Maybe<Scalars['v3_BigDecimal']>
  high_gt?: Maybe<Scalars['v3_BigDecimal']>
  high_gte?: Maybe<Scalars['v3_BigDecimal']>
  high_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  high_lt?: Maybe<Scalars['v3_BigDecimal']>
  high_lte?: Maybe<Scalars['v3_BigDecimal']>
  high_not?: Maybe<Scalars['v3_BigDecimal']>
  high_not_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  id?: Maybe<Scalars['ID']>
  id_gt?: Maybe<Scalars['ID']>
  id_gte?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  id_lt?: Maybe<Scalars['ID']>
  id_lte?: Maybe<Scalars['ID']>
  id_not?: Maybe<Scalars['ID']>
  id_not_in?: Maybe<Array<Scalars['ID']>>
  low?: Maybe<Scalars['v3_BigDecimal']>
  low_gt?: Maybe<Scalars['v3_BigDecimal']>
  low_gte?: Maybe<Scalars['v3_BigDecimal']>
  low_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  low_lt?: Maybe<Scalars['v3_BigDecimal']>
  low_lte?: Maybe<Scalars['v3_BigDecimal']>
  low_not?: Maybe<Scalars['v3_BigDecimal']>
  low_not_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  open?: Maybe<Scalars['v3_BigDecimal']>
  open_gt?: Maybe<Scalars['v3_BigDecimal']>
  open_gte?: Maybe<Scalars['v3_BigDecimal']>
  open_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  open_lt?: Maybe<Scalars['v3_BigDecimal']>
  open_lte?: Maybe<Scalars['v3_BigDecimal']>
  open_not?: Maybe<Scalars['v3_BigDecimal']>
  open_not_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  periodStartUnix?: Maybe<Scalars['Int']>
  periodStartUnix_gt?: Maybe<Scalars['Int']>
  periodStartUnix_gte?: Maybe<Scalars['Int']>
  periodStartUnix_in?: Maybe<Array<Scalars['Int']>>
  periodStartUnix_lt?: Maybe<Scalars['Int']>
  periodStartUnix_lte?: Maybe<Scalars['Int']>
  periodStartUnix_not?: Maybe<Scalars['Int']>
  periodStartUnix_not_in?: Maybe<Array<Scalars['Int']>>
  priceUSD?: Maybe<Scalars['v3_BigDecimal']>
  priceUSD_gt?: Maybe<Scalars['v3_BigDecimal']>
  priceUSD_gte?: Maybe<Scalars['v3_BigDecimal']>
  priceUSD_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  priceUSD_lt?: Maybe<Scalars['v3_BigDecimal']>
  priceUSD_lte?: Maybe<Scalars['v3_BigDecimal']>
  priceUSD_not?: Maybe<Scalars['v3_BigDecimal']>
  priceUSD_not_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  token?: Maybe<Scalars['String']>
  token_contains?: Maybe<Scalars['String']>
  token_ends_with?: Maybe<Scalars['String']>
  token_gt?: Maybe<Scalars['String']>
  token_gte?: Maybe<Scalars['String']>
  token_in?: Maybe<Array<Scalars['String']>>
  token_lt?: Maybe<Scalars['String']>
  token_lte?: Maybe<Scalars['String']>
  token_not?: Maybe<Scalars['String']>
  token_not_contains?: Maybe<Scalars['String']>
  token_not_ends_with?: Maybe<Scalars['String']>
  token_not_in?: Maybe<Array<Scalars['String']>>
  token_not_starts_with?: Maybe<Scalars['String']>
  token_starts_with?: Maybe<Scalars['String']>
  totalValueLocked?: Maybe<Scalars['v3_BigDecimal']>
  totalValueLockedUSD?: Maybe<Scalars['v3_BigDecimal']>
  totalValueLockedUSD_gt?: Maybe<Scalars['v3_BigDecimal']>
  totalValueLockedUSD_gte?: Maybe<Scalars['v3_BigDecimal']>
  totalValueLockedUSD_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  totalValueLockedUSD_lt?: Maybe<Scalars['v3_BigDecimal']>
  totalValueLockedUSD_lte?: Maybe<Scalars['v3_BigDecimal']>
  totalValueLockedUSD_not?: Maybe<Scalars['v3_BigDecimal']>
  totalValueLockedUSD_not_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  totalValueLocked_gt?: Maybe<Scalars['v3_BigDecimal']>
  totalValueLocked_gte?: Maybe<Scalars['v3_BigDecimal']>
  totalValueLocked_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  totalValueLocked_lt?: Maybe<Scalars['v3_BigDecimal']>
  totalValueLocked_lte?: Maybe<Scalars['v3_BigDecimal']>
  totalValueLocked_not?: Maybe<Scalars['v3_BigDecimal']>
  totalValueLocked_not_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  untrackedVolumeUSD?: Maybe<Scalars['v3_BigDecimal']>
  untrackedVolumeUSD_gt?: Maybe<Scalars['v3_BigDecimal']>
  untrackedVolumeUSD_gte?: Maybe<Scalars['v3_BigDecimal']>
  untrackedVolumeUSD_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  untrackedVolumeUSD_lt?: Maybe<Scalars['v3_BigDecimal']>
  untrackedVolumeUSD_lte?: Maybe<Scalars['v3_BigDecimal']>
  untrackedVolumeUSD_not?: Maybe<Scalars['v3_BigDecimal']>
  untrackedVolumeUSD_not_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  volume?: Maybe<Scalars['v3_BigDecimal']>
  volumeUSD?: Maybe<Scalars['v3_BigDecimal']>
  volumeUSD_gt?: Maybe<Scalars['v3_BigDecimal']>
  volumeUSD_gte?: Maybe<Scalars['v3_BigDecimal']>
  volumeUSD_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  volumeUSD_lt?: Maybe<Scalars['v3_BigDecimal']>
  volumeUSD_lte?: Maybe<Scalars['v3_BigDecimal']>
  volumeUSD_not?: Maybe<Scalars['v3_BigDecimal']>
  volumeUSD_not_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  volume_gt?: Maybe<Scalars['v3_BigDecimal']>
  volume_gte?: Maybe<Scalars['v3_BigDecimal']>
  volume_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  volume_lt?: Maybe<Scalars['v3_BigDecimal']>
  volume_lte?: Maybe<Scalars['v3_BigDecimal']>
  volume_not?: Maybe<Scalars['v3_BigDecimal']>
  volume_not_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
}

export enum V3_TokenHourData_OrderBy {
  Close = 'close',
  FeesUsd = 'feesUSD',
  High = 'high',
  Id = 'id',
  Low = 'low',
  Open = 'open',
  PeriodStartUnix = 'periodStartUnix',
  PriceUsd = 'priceUSD',
  Token = 'token',
  TotalValueLocked = 'totalValueLocked',
  TotalValueLockedUsd = 'totalValueLockedUSD',
  UntrackedVolumeUsd = 'untrackedVolumeUSD',
  Volume = 'volume',
  VolumeUsd = 'volumeUSD',
}

export type V3_Token_Filter = {
  decimals?: Maybe<Scalars['v3_BigInt']>
  decimals_gt?: Maybe<Scalars['v3_BigInt']>
  decimals_gte?: Maybe<Scalars['v3_BigInt']>
  decimals_in?: Maybe<Array<Scalars['v3_BigInt']>>
  decimals_lt?: Maybe<Scalars['v3_BigInt']>
  decimals_lte?: Maybe<Scalars['v3_BigInt']>
  decimals_not?: Maybe<Scalars['v3_BigInt']>
  decimals_not_in?: Maybe<Array<Scalars['v3_BigInt']>>
  derivedETH?: Maybe<Scalars['v3_BigDecimal']>
  derivedETH_gt?: Maybe<Scalars['v3_BigDecimal']>
  derivedETH_gte?: Maybe<Scalars['v3_BigDecimal']>
  derivedETH_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  derivedETH_lt?: Maybe<Scalars['v3_BigDecimal']>
  derivedETH_lte?: Maybe<Scalars['v3_BigDecimal']>
  derivedETH_not?: Maybe<Scalars['v3_BigDecimal']>
  derivedETH_not_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  feesUSD?: Maybe<Scalars['v3_BigDecimal']>
  feesUSD_gt?: Maybe<Scalars['v3_BigDecimal']>
  feesUSD_gte?: Maybe<Scalars['v3_BigDecimal']>
  feesUSD_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  feesUSD_lt?: Maybe<Scalars['v3_BigDecimal']>
  feesUSD_lte?: Maybe<Scalars['v3_BigDecimal']>
  feesUSD_not?: Maybe<Scalars['v3_BigDecimal']>
  feesUSD_not_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  id?: Maybe<Scalars['ID']>
  id_gt?: Maybe<Scalars['ID']>
  id_gte?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  id_lt?: Maybe<Scalars['ID']>
  id_lte?: Maybe<Scalars['ID']>
  id_not?: Maybe<Scalars['ID']>
  id_not_in?: Maybe<Array<Scalars['ID']>>
  name?: Maybe<Scalars['String']>
  name_contains?: Maybe<Scalars['String']>
  name_ends_with?: Maybe<Scalars['String']>
  name_gt?: Maybe<Scalars['String']>
  name_gte?: Maybe<Scalars['String']>
  name_in?: Maybe<Array<Scalars['String']>>
  name_lt?: Maybe<Scalars['String']>
  name_lte?: Maybe<Scalars['String']>
  name_not?: Maybe<Scalars['String']>
  name_not_contains?: Maybe<Scalars['String']>
  name_not_ends_with?: Maybe<Scalars['String']>
  name_not_in?: Maybe<Array<Scalars['String']>>
  name_not_starts_with?: Maybe<Scalars['String']>
  name_starts_with?: Maybe<Scalars['String']>
  poolCount?: Maybe<Scalars['v3_BigInt']>
  poolCount_gt?: Maybe<Scalars['v3_BigInt']>
  poolCount_gte?: Maybe<Scalars['v3_BigInt']>
  poolCount_in?: Maybe<Array<Scalars['v3_BigInt']>>
  poolCount_lt?: Maybe<Scalars['v3_BigInt']>
  poolCount_lte?: Maybe<Scalars['v3_BigInt']>
  poolCount_not?: Maybe<Scalars['v3_BigInt']>
  poolCount_not_in?: Maybe<Array<Scalars['v3_BigInt']>>
  symbol?: Maybe<Scalars['String']>
  symbol_contains?: Maybe<Scalars['String']>
  symbol_ends_with?: Maybe<Scalars['String']>
  symbol_gt?: Maybe<Scalars['String']>
  symbol_gte?: Maybe<Scalars['String']>
  symbol_in?: Maybe<Array<Scalars['String']>>
  symbol_lt?: Maybe<Scalars['String']>
  symbol_lte?: Maybe<Scalars['String']>
  symbol_not?: Maybe<Scalars['String']>
  symbol_not_contains?: Maybe<Scalars['String']>
  symbol_not_ends_with?: Maybe<Scalars['String']>
  symbol_not_in?: Maybe<Array<Scalars['String']>>
  symbol_not_starts_with?: Maybe<Scalars['String']>
  symbol_starts_with?: Maybe<Scalars['String']>
  totalSupply?: Maybe<Scalars['v3_BigInt']>
  totalSupply_gt?: Maybe<Scalars['v3_BigInt']>
  totalSupply_gte?: Maybe<Scalars['v3_BigInt']>
  totalSupply_in?: Maybe<Array<Scalars['v3_BigInt']>>
  totalSupply_lt?: Maybe<Scalars['v3_BigInt']>
  totalSupply_lte?: Maybe<Scalars['v3_BigInt']>
  totalSupply_not?: Maybe<Scalars['v3_BigInt']>
  totalSupply_not_in?: Maybe<Array<Scalars['v3_BigInt']>>
  totalValueLocked?: Maybe<Scalars['v3_BigDecimal']>
  totalValueLockedUSD?: Maybe<Scalars['v3_BigDecimal']>
  totalValueLockedUSDUntracked?: Maybe<Scalars['v3_BigDecimal']>
  totalValueLockedUSDUntracked_gt?: Maybe<Scalars['v3_BigDecimal']>
  totalValueLockedUSDUntracked_gte?: Maybe<Scalars['v3_BigDecimal']>
  totalValueLockedUSDUntracked_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  totalValueLockedUSDUntracked_lt?: Maybe<Scalars['v3_BigDecimal']>
  totalValueLockedUSDUntracked_lte?: Maybe<Scalars['v3_BigDecimal']>
  totalValueLockedUSDUntracked_not?: Maybe<Scalars['v3_BigDecimal']>
  totalValueLockedUSDUntracked_not_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  totalValueLockedUSD_gt?: Maybe<Scalars['v3_BigDecimal']>
  totalValueLockedUSD_gte?: Maybe<Scalars['v3_BigDecimal']>
  totalValueLockedUSD_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  totalValueLockedUSD_lt?: Maybe<Scalars['v3_BigDecimal']>
  totalValueLockedUSD_lte?: Maybe<Scalars['v3_BigDecimal']>
  totalValueLockedUSD_not?: Maybe<Scalars['v3_BigDecimal']>
  totalValueLockedUSD_not_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  totalValueLocked_gt?: Maybe<Scalars['v3_BigDecimal']>
  totalValueLocked_gte?: Maybe<Scalars['v3_BigDecimal']>
  totalValueLocked_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  totalValueLocked_lt?: Maybe<Scalars['v3_BigDecimal']>
  totalValueLocked_lte?: Maybe<Scalars['v3_BigDecimal']>
  totalValueLocked_not?: Maybe<Scalars['v3_BigDecimal']>
  totalValueLocked_not_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  txCount?: Maybe<Scalars['v3_BigInt']>
  txCount_gt?: Maybe<Scalars['v3_BigInt']>
  txCount_gte?: Maybe<Scalars['v3_BigInt']>
  txCount_in?: Maybe<Array<Scalars['v3_BigInt']>>
  txCount_lt?: Maybe<Scalars['v3_BigInt']>
  txCount_lte?: Maybe<Scalars['v3_BigInt']>
  txCount_not?: Maybe<Scalars['v3_BigInt']>
  txCount_not_in?: Maybe<Array<Scalars['v3_BigInt']>>
  untrackedVolumeUSD?: Maybe<Scalars['v3_BigDecimal']>
  untrackedVolumeUSD_gt?: Maybe<Scalars['v3_BigDecimal']>
  untrackedVolumeUSD_gte?: Maybe<Scalars['v3_BigDecimal']>
  untrackedVolumeUSD_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  untrackedVolumeUSD_lt?: Maybe<Scalars['v3_BigDecimal']>
  untrackedVolumeUSD_lte?: Maybe<Scalars['v3_BigDecimal']>
  untrackedVolumeUSD_not?: Maybe<Scalars['v3_BigDecimal']>
  untrackedVolumeUSD_not_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  volume?: Maybe<Scalars['v3_BigDecimal']>
  volumeUSD?: Maybe<Scalars['v3_BigDecimal']>
  volumeUSD_gt?: Maybe<Scalars['v3_BigDecimal']>
  volumeUSD_gte?: Maybe<Scalars['v3_BigDecimal']>
  volumeUSD_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  volumeUSD_lt?: Maybe<Scalars['v3_BigDecimal']>
  volumeUSD_lte?: Maybe<Scalars['v3_BigDecimal']>
  volumeUSD_not?: Maybe<Scalars['v3_BigDecimal']>
  volumeUSD_not_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  volume_gt?: Maybe<Scalars['v3_BigDecimal']>
  volume_gte?: Maybe<Scalars['v3_BigDecimal']>
  volume_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  volume_lt?: Maybe<Scalars['v3_BigDecimal']>
  volume_lte?: Maybe<Scalars['v3_BigDecimal']>
  volume_not?: Maybe<Scalars['v3_BigDecimal']>
  volume_not_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  whitelistPools?: Maybe<Array<Scalars['String']>>
  whitelistPools_contains?: Maybe<Array<Scalars['String']>>
  whitelistPools_not?: Maybe<Array<Scalars['String']>>
  whitelistPools_not_contains?: Maybe<Array<Scalars['String']>>
}

export enum V3_Token_OrderBy {
  Decimals = 'decimals',
  DerivedEth = 'derivedETH',
  FeesUsd = 'feesUSD',
  Id = 'id',
  Name = 'name',
  PoolCount = 'poolCount',
  Symbol = 'symbol',
  TokenDayData = 'tokenDayData',
  TotalSupply = 'totalSupply',
  TotalValueLocked = 'totalValueLocked',
  TotalValueLockedUsd = 'totalValueLockedUSD',
  TotalValueLockedUsdUntracked = 'totalValueLockedUSDUntracked',
  TxCount = 'txCount',
  UntrackedVolumeUsd = 'untrackedVolumeUSD',
  Volume = 'volume',
  VolumeUsd = 'volumeUSD',
  WhitelistPools = 'whitelistPools',
}

export type V3_Transaction = {
  __typename?: 'v3_Transaction'
  blockNumber: Scalars['v3_BigInt']
  burns: Array<Maybe<V3_Burn>>
  collects: Array<Maybe<V3_Collect>>
  flashed: Array<Maybe<V3_Flash>>
  gasPrice: Scalars['v3_BigInt']
  gasUsed: Scalars['v3_BigInt']
  id: Scalars['ID']
  mints: Array<Maybe<V3_Mint>>
  swaps: Array<Maybe<V3_Swap>>
  timestamp: Scalars['v3_BigInt']
}

export type V3_TransactionBurnsArgs = {
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3_Burn_OrderBy>
  orderDirection?: Maybe<V3_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  where?: Maybe<V3_Burn_Filter>
}

export type V3_TransactionCollectsArgs = {
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3_Collect_OrderBy>
  orderDirection?: Maybe<V3_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  where?: Maybe<V3_Collect_Filter>
}

export type V3_TransactionFlashedArgs = {
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3_Flash_OrderBy>
  orderDirection?: Maybe<V3_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  where?: Maybe<V3_Flash_Filter>
}

export type V3_TransactionMintsArgs = {
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3_Mint_OrderBy>
  orderDirection?: Maybe<V3_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  where?: Maybe<V3_Mint_Filter>
}

export type V3_TransactionSwapsArgs = {
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3_Swap_OrderBy>
  orderDirection?: Maybe<V3_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  where?: Maybe<V3_Swap_Filter>
}

export type V3_Transaction_Filter = {
  blockNumber?: Maybe<Scalars['v3_BigInt']>
  blockNumber_gt?: Maybe<Scalars['v3_BigInt']>
  blockNumber_gte?: Maybe<Scalars['v3_BigInt']>
  blockNumber_in?: Maybe<Array<Scalars['v3_BigInt']>>
  blockNumber_lt?: Maybe<Scalars['v3_BigInt']>
  blockNumber_lte?: Maybe<Scalars['v3_BigInt']>
  blockNumber_not?: Maybe<Scalars['v3_BigInt']>
  blockNumber_not_in?: Maybe<Array<Scalars['v3_BigInt']>>
  gasPrice?: Maybe<Scalars['v3_BigInt']>
  gasPrice_gt?: Maybe<Scalars['v3_BigInt']>
  gasPrice_gte?: Maybe<Scalars['v3_BigInt']>
  gasPrice_in?: Maybe<Array<Scalars['v3_BigInt']>>
  gasPrice_lt?: Maybe<Scalars['v3_BigInt']>
  gasPrice_lte?: Maybe<Scalars['v3_BigInt']>
  gasPrice_not?: Maybe<Scalars['v3_BigInt']>
  gasPrice_not_in?: Maybe<Array<Scalars['v3_BigInt']>>
  gasUsed?: Maybe<Scalars['v3_BigInt']>
  gasUsed_gt?: Maybe<Scalars['v3_BigInt']>
  gasUsed_gte?: Maybe<Scalars['v3_BigInt']>
  gasUsed_in?: Maybe<Array<Scalars['v3_BigInt']>>
  gasUsed_lt?: Maybe<Scalars['v3_BigInt']>
  gasUsed_lte?: Maybe<Scalars['v3_BigInt']>
  gasUsed_not?: Maybe<Scalars['v3_BigInt']>
  gasUsed_not_in?: Maybe<Array<Scalars['v3_BigInt']>>
  id?: Maybe<Scalars['ID']>
  id_gt?: Maybe<Scalars['ID']>
  id_gte?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  id_lt?: Maybe<Scalars['ID']>
  id_lte?: Maybe<Scalars['ID']>
  id_not?: Maybe<Scalars['ID']>
  id_not_in?: Maybe<Array<Scalars['ID']>>
  timestamp?: Maybe<Scalars['v3_BigInt']>
  timestamp_gt?: Maybe<Scalars['v3_BigInt']>
  timestamp_gte?: Maybe<Scalars['v3_BigInt']>
  timestamp_in?: Maybe<Array<Scalars['v3_BigInt']>>
  timestamp_lt?: Maybe<Scalars['v3_BigInt']>
  timestamp_lte?: Maybe<Scalars['v3_BigInt']>
  timestamp_not?: Maybe<Scalars['v3_BigInt']>
  timestamp_not_in?: Maybe<Array<Scalars['v3_BigInt']>>
}

export enum V3_Transaction_OrderBy {
  BlockNumber = 'blockNumber',
  Burns = 'burns',
  Collects = 'collects',
  Flashed = 'flashed',
  GasPrice = 'gasPrice',
  GasUsed = 'gasUsed',
  Id = 'id',
  Mints = 'mints',
  Swaps = 'swaps',
  Timestamp = 'timestamp',
}

export type V3_UniswapDayData = {
  __typename?: 'v3_UniswapDayData'
  date: Scalars['Int']
  feesUSD: Scalars['v3_BigDecimal']
  id: Scalars['ID']
  tvlUSD: Scalars['v3_BigDecimal']
  txCount: Scalars['v3_BigInt']
  volumeETH: Scalars['v3_BigDecimal']
  volumeUSD: Scalars['v3_BigDecimal']
  volumeUSDUntracked: Scalars['v3_BigDecimal']
}

export type V3_UniswapDayData_Filter = {
  date?: Maybe<Scalars['Int']>
  date_gt?: Maybe<Scalars['Int']>
  date_gte?: Maybe<Scalars['Int']>
  date_in?: Maybe<Array<Scalars['Int']>>
  date_lt?: Maybe<Scalars['Int']>
  date_lte?: Maybe<Scalars['Int']>
  date_not?: Maybe<Scalars['Int']>
  date_not_in?: Maybe<Array<Scalars['Int']>>
  feesUSD?: Maybe<Scalars['v3_BigDecimal']>
  feesUSD_gt?: Maybe<Scalars['v3_BigDecimal']>
  feesUSD_gte?: Maybe<Scalars['v3_BigDecimal']>
  feesUSD_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  feesUSD_lt?: Maybe<Scalars['v3_BigDecimal']>
  feesUSD_lte?: Maybe<Scalars['v3_BigDecimal']>
  feesUSD_not?: Maybe<Scalars['v3_BigDecimal']>
  feesUSD_not_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  id?: Maybe<Scalars['ID']>
  id_gt?: Maybe<Scalars['ID']>
  id_gte?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  id_lt?: Maybe<Scalars['ID']>
  id_lte?: Maybe<Scalars['ID']>
  id_not?: Maybe<Scalars['ID']>
  id_not_in?: Maybe<Array<Scalars['ID']>>
  tvlUSD?: Maybe<Scalars['v3_BigDecimal']>
  tvlUSD_gt?: Maybe<Scalars['v3_BigDecimal']>
  tvlUSD_gte?: Maybe<Scalars['v3_BigDecimal']>
  tvlUSD_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  tvlUSD_lt?: Maybe<Scalars['v3_BigDecimal']>
  tvlUSD_lte?: Maybe<Scalars['v3_BigDecimal']>
  tvlUSD_not?: Maybe<Scalars['v3_BigDecimal']>
  tvlUSD_not_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  txCount?: Maybe<Scalars['v3_BigInt']>
  txCount_gt?: Maybe<Scalars['v3_BigInt']>
  txCount_gte?: Maybe<Scalars['v3_BigInt']>
  txCount_in?: Maybe<Array<Scalars['v3_BigInt']>>
  txCount_lt?: Maybe<Scalars['v3_BigInt']>
  txCount_lte?: Maybe<Scalars['v3_BigInt']>
  txCount_not?: Maybe<Scalars['v3_BigInt']>
  txCount_not_in?: Maybe<Array<Scalars['v3_BigInt']>>
  volumeETH?: Maybe<Scalars['v3_BigDecimal']>
  volumeETH_gt?: Maybe<Scalars['v3_BigDecimal']>
  volumeETH_gte?: Maybe<Scalars['v3_BigDecimal']>
  volumeETH_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  volumeETH_lt?: Maybe<Scalars['v3_BigDecimal']>
  volumeETH_lte?: Maybe<Scalars['v3_BigDecimal']>
  volumeETH_not?: Maybe<Scalars['v3_BigDecimal']>
  volumeETH_not_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  volumeUSD?: Maybe<Scalars['v3_BigDecimal']>
  volumeUSDUntracked?: Maybe<Scalars['v3_BigDecimal']>
  volumeUSDUntracked_gt?: Maybe<Scalars['v3_BigDecimal']>
  volumeUSDUntracked_gte?: Maybe<Scalars['v3_BigDecimal']>
  volumeUSDUntracked_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  volumeUSDUntracked_lt?: Maybe<Scalars['v3_BigDecimal']>
  volumeUSDUntracked_lte?: Maybe<Scalars['v3_BigDecimal']>
  volumeUSDUntracked_not?: Maybe<Scalars['v3_BigDecimal']>
  volumeUSDUntracked_not_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  volumeUSD_gt?: Maybe<Scalars['v3_BigDecimal']>
  volumeUSD_gte?: Maybe<Scalars['v3_BigDecimal']>
  volumeUSD_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
  volumeUSD_lt?: Maybe<Scalars['v3_BigDecimal']>
  volumeUSD_lte?: Maybe<Scalars['v3_BigDecimal']>
  volumeUSD_not?: Maybe<Scalars['v3_BigDecimal']>
  volumeUSD_not_in?: Maybe<Array<Scalars['v3_BigDecimal']>>
}

export enum V3_UniswapDayData_OrderBy {
  Date = 'date',
  FeesUsd = 'feesUSD',
  Id = 'id',
  TvlUsd = 'tvlUSD',
  TxCount = 'txCount',
  VolumeEth = 'volumeETH',
  VolumeUsd = 'volumeUSD',
  VolumeUsdUntracked = 'volumeUSDUntracked',
}

export type V3__Block_ = {
  __typename?: 'v3__Block_'
  /** The hash of the block */
  hash?: Maybe<Scalars['v3_Bytes']>
  /** The block number */
  number: Scalars['Int']
}

/** The type for the top-level _meta field */
export type V3__Meta_ = {
  __typename?: 'v3__Meta_'
  /**
   * Information about a specific subgraph block. The hash of the block
   * will be null if the _meta field has a block constraint that asks for
   * a block number. It will be filled if the _meta field has no block constraint
   * and therefore asks for the latest  block
   *
   */
  block: V3__Block_
  /** The deployment ID */
  deployment: Scalars['String']
  /** If `true`, the subgraph encountered indexing errors at some past block */
  hasIndexingErrors: Scalars['Boolean']
}

export enum V3__SubgraphErrorPolicy_ {
  /** Data will be returned even if the subgraph has indexing errors */
  Allow = 'allow',
  /** If the subgraph has indexing errors, data will be omitted. The default. */
  Deny = 'deny',
}

export type V3arbitrum_Block_Height = {
  hash?: Maybe<Scalars['v3arbitrum_Bytes']>
  number?: Maybe<Scalars['Int']>
  number_gte?: Maybe<Scalars['Int']>
}

export type V3arbitrum_Bundle = {
  __typename?: 'v3arbitrum_Bundle'
  ethPriceUSD: Scalars['v3arbitrum_BigDecimal']
  id: Scalars['ID']
}

export type V3arbitrum_Bundle_Filter = {
  ethPriceUSD?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  ethPriceUSD_gt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  ethPriceUSD_gte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  ethPriceUSD_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  ethPriceUSD_lt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  ethPriceUSD_lte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  ethPriceUSD_not?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  ethPriceUSD_not_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  id?: Maybe<Scalars['ID']>
  id_gt?: Maybe<Scalars['ID']>
  id_gte?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  id_lt?: Maybe<Scalars['ID']>
  id_lte?: Maybe<Scalars['ID']>
  id_not?: Maybe<Scalars['ID']>
  id_not_in?: Maybe<Array<Scalars['ID']>>
}

export enum V3arbitrum_Bundle_OrderBy {
  EthPriceUsd = 'ethPriceUSD',
  Id = 'id',
}

export type V3arbitrum_Burn = {
  __typename?: 'v3arbitrum_Burn'
  amount: Scalars['v3arbitrum_BigInt']
  amount0: Scalars['v3arbitrum_BigDecimal']
  amount1: Scalars['v3arbitrum_BigDecimal']
  amountUSD?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  id: Scalars['ID']
  logIndex?: Maybe<Scalars['v3arbitrum_BigInt']>
  origin: Scalars['v3arbitrum_Bytes']
  owner?: Maybe<Scalars['v3arbitrum_Bytes']>
  pool: V3arbitrum_Pool
  tickLower: Scalars['v3arbitrum_BigInt']
  tickUpper: Scalars['v3arbitrum_BigInt']
  timestamp: Scalars['v3arbitrum_BigInt']
  token0: V3arbitrum_Token
  token1: V3arbitrum_Token
  transaction: V3arbitrum_Transaction
}

export type V3arbitrum_Burn_Filter = {
  amount?: Maybe<Scalars['v3arbitrum_BigInt']>
  amount0?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  amount0_gt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  amount0_gte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  amount0_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  amount0_lt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  amount0_lte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  amount0_not?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  amount0_not_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  amount1?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  amount1_gt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  amount1_gte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  amount1_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  amount1_lt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  amount1_lte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  amount1_not?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  amount1_not_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  amountUSD?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  amountUSD_gt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  amountUSD_gte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  amountUSD_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  amountUSD_lt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  amountUSD_lte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  amountUSD_not?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  amountUSD_not_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  amount_gt?: Maybe<Scalars['v3arbitrum_BigInt']>
  amount_gte?: Maybe<Scalars['v3arbitrum_BigInt']>
  amount_in?: Maybe<Array<Scalars['v3arbitrum_BigInt']>>
  amount_lt?: Maybe<Scalars['v3arbitrum_BigInt']>
  amount_lte?: Maybe<Scalars['v3arbitrum_BigInt']>
  amount_not?: Maybe<Scalars['v3arbitrum_BigInt']>
  amount_not_in?: Maybe<Array<Scalars['v3arbitrum_BigInt']>>
  id?: Maybe<Scalars['ID']>
  id_gt?: Maybe<Scalars['ID']>
  id_gte?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  id_lt?: Maybe<Scalars['ID']>
  id_lte?: Maybe<Scalars['ID']>
  id_not?: Maybe<Scalars['ID']>
  id_not_in?: Maybe<Array<Scalars['ID']>>
  logIndex?: Maybe<Scalars['v3arbitrum_BigInt']>
  logIndex_gt?: Maybe<Scalars['v3arbitrum_BigInt']>
  logIndex_gte?: Maybe<Scalars['v3arbitrum_BigInt']>
  logIndex_in?: Maybe<Array<Scalars['v3arbitrum_BigInt']>>
  logIndex_lt?: Maybe<Scalars['v3arbitrum_BigInt']>
  logIndex_lte?: Maybe<Scalars['v3arbitrum_BigInt']>
  logIndex_not?: Maybe<Scalars['v3arbitrum_BigInt']>
  logIndex_not_in?: Maybe<Array<Scalars['v3arbitrum_BigInt']>>
  origin?: Maybe<Scalars['v3arbitrum_Bytes']>
  origin_contains?: Maybe<Scalars['v3arbitrum_Bytes']>
  origin_in?: Maybe<Array<Scalars['v3arbitrum_Bytes']>>
  origin_not?: Maybe<Scalars['v3arbitrum_Bytes']>
  origin_not_contains?: Maybe<Scalars['v3arbitrum_Bytes']>
  origin_not_in?: Maybe<Array<Scalars['v3arbitrum_Bytes']>>
  owner?: Maybe<Scalars['v3arbitrum_Bytes']>
  owner_contains?: Maybe<Scalars['v3arbitrum_Bytes']>
  owner_in?: Maybe<Array<Scalars['v3arbitrum_Bytes']>>
  owner_not?: Maybe<Scalars['v3arbitrum_Bytes']>
  owner_not_contains?: Maybe<Scalars['v3arbitrum_Bytes']>
  owner_not_in?: Maybe<Array<Scalars['v3arbitrum_Bytes']>>
  pool?: Maybe<Scalars['String']>
  pool_contains?: Maybe<Scalars['String']>
  pool_ends_with?: Maybe<Scalars['String']>
  pool_gt?: Maybe<Scalars['String']>
  pool_gte?: Maybe<Scalars['String']>
  pool_in?: Maybe<Array<Scalars['String']>>
  pool_lt?: Maybe<Scalars['String']>
  pool_lte?: Maybe<Scalars['String']>
  pool_not?: Maybe<Scalars['String']>
  pool_not_contains?: Maybe<Scalars['String']>
  pool_not_ends_with?: Maybe<Scalars['String']>
  pool_not_in?: Maybe<Array<Scalars['String']>>
  pool_not_starts_with?: Maybe<Scalars['String']>
  pool_starts_with?: Maybe<Scalars['String']>
  tickLower?: Maybe<Scalars['v3arbitrum_BigInt']>
  tickLower_gt?: Maybe<Scalars['v3arbitrum_BigInt']>
  tickLower_gte?: Maybe<Scalars['v3arbitrum_BigInt']>
  tickLower_in?: Maybe<Array<Scalars['v3arbitrum_BigInt']>>
  tickLower_lt?: Maybe<Scalars['v3arbitrum_BigInt']>
  tickLower_lte?: Maybe<Scalars['v3arbitrum_BigInt']>
  tickLower_not?: Maybe<Scalars['v3arbitrum_BigInt']>
  tickLower_not_in?: Maybe<Array<Scalars['v3arbitrum_BigInt']>>
  tickUpper?: Maybe<Scalars['v3arbitrum_BigInt']>
  tickUpper_gt?: Maybe<Scalars['v3arbitrum_BigInt']>
  tickUpper_gte?: Maybe<Scalars['v3arbitrum_BigInt']>
  tickUpper_in?: Maybe<Array<Scalars['v3arbitrum_BigInt']>>
  tickUpper_lt?: Maybe<Scalars['v3arbitrum_BigInt']>
  tickUpper_lte?: Maybe<Scalars['v3arbitrum_BigInt']>
  tickUpper_not?: Maybe<Scalars['v3arbitrum_BigInt']>
  tickUpper_not_in?: Maybe<Array<Scalars['v3arbitrum_BigInt']>>
  timestamp?: Maybe<Scalars['v3arbitrum_BigInt']>
  timestamp_gt?: Maybe<Scalars['v3arbitrum_BigInt']>
  timestamp_gte?: Maybe<Scalars['v3arbitrum_BigInt']>
  timestamp_in?: Maybe<Array<Scalars['v3arbitrum_BigInt']>>
  timestamp_lt?: Maybe<Scalars['v3arbitrum_BigInt']>
  timestamp_lte?: Maybe<Scalars['v3arbitrum_BigInt']>
  timestamp_not?: Maybe<Scalars['v3arbitrum_BigInt']>
  timestamp_not_in?: Maybe<Array<Scalars['v3arbitrum_BigInt']>>
  token0?: Maybe<Scalars['String']>
  token0_contains?: Maybe<Scalars['String']>
  token0_ends_with?: Maybe<Scalars['String']>
  token0_gt?: Maybe<Scalars['String']>
  token0_gte?: Maybe<Scalars['String']>
  token0_in?: Maybe<Array<Scalars['String']>>
  token0_lt?: Maybe<Scalars['String']>
  token0_lte?: Maybe<Scalars['String']>
  token0_not?: Maybe<Scalars['String']>
  token0_not_contains?: Maybe<Scalars['String']>
  token0_not_ends_with?: Maybe<Scalars['String']>
  token0_not_in?: Maybe<Array<Scalars['String']>>
  token0_not_starts_with?: Maybe<Scalars['String']>
  token0_starts_with?: Maybe<Scalars['String']>
  token1?: Maybe<Scalars['String']>
  token1_contains?: Maybe<Scalars['String']>
  token1_ends_with?: Maybe<Scalars['String']>
  token1_gt?: Maybe<Scalars['String']>
  token1_gte?: Maybe<Scalars['String']>
  token1_in?: Maybe<Array<Scalars['String']>>
  token1_lt?: Maybe<Scalars['String']>
  token1_lte?: Maybe<Scalars['String']>
  token1_not?: Maybe<Scalars['String']>
  token1_not_contains?: Maybe<Scalars['String']>
  token1_not_ends_with?: Maybe<Scalars['String']>
  token1_not_in?: Maybe<Array<Scalars['String']>>
  token1_not_starts_with?: Maybe<Scalars['String']>
  token1_starts_with?: Maybe<Scalars['String']>
  transaction?: Maybe<Scalars['String']>
  transaction_contains?: Maybe<Scalars['String']>
  transaction_ends_with?: Maybe<Scalars['String']>
  transaction_gt?: Maybe<Scalars['String']>
  transaction_gte?: Maybe<Scalars['String']>
  transaction_in?: Maybe<Array<Scalars['String']>>
  transaction_lt?: Maybe<Scalars['String']>
  transaction_lte?: Maybe<Scalars['String']>
  transaction_not?: Maybe<Scalars['String']>
  transaction_not_contains?: Maybe<Scalars['String']>
  transaction_not_ends_with?: Maybe<Scalars['String']>
  transaction_not_in?: Maybe<Array<Scalars['String']>>
  transaction_not_starts_with?: Maybe<Scalars['String']>
  transaction_starts_with?: Maybe<Scalars['String']>
}

export enum V3arbitrum_Burn_OrderBy {
  Amount = 'amount',
  Amount0 = 'amount0',
  Amount1 = 'amount1',
  AmountUsd = 'amountUSD',
  Id = 'id',
  LogIndex = 'logIndex',
  Origin = 'origin',
  Owner = 'owner',
  Pool = 'pool',
  TickLower = 'tickLower',
  TickUpper = 'tickUpper',
  Timestamp = 'timestamp',
  Token0 = 'token0',
  Token1 = 'token1',
  Transaction = 'transaction',
}

export type V3arbitrum_Collect = {
  __typename?: 'v3arbitrum_Collect'
  amount0: Scalars['v3arbitrum_BigDecimal']
  amount1: Scalars['v3arbitrum_BigDecimal']
  amountUSD?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  id: Scalars['ID']
  logIndex?: Maybe<Scalars['v3arbitrum_BigInt']>
  owner?: Maybe<Scalars['v3arbitrum_Bytes']>
  pool: V3arbitrum_Pool
  tickLower: Scalars['v3arbitrum_BigInt']
  tickUpper: Scalars['v3arbitrum_BigInt']
  timestamp: Scalars['v3arbitrum_BigInt']
  transaction: V3arbitrum_Transaction
}

export type V3arbitrum_Collect_Filter = {
  amount0?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  amount0_gt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  amount0_gte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  amount0_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  amount0_lt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  amount0_lte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  amount0_not?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  amount0_not_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  amount1?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  amount1_gt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  amount1_gte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  amount1_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  amount1_lt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  amount1_lte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  amount1_not?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  amount1_not_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  amountUSD?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  amountUSD_gt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  amountUSD_gte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  amountUSD_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  amountUSD_lt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  amountUSD_lte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  amountUSD_not?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  amountUSD_not_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  id?: Maybe<Scalars['ID']>
  id_gt?: Maybe<Scalars['ID']>
  id_gte?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  id_lt?: Maybe<Scalars['ID']>
  id_lte?: Maybe<Scalars['ID']>
  id_not?: Maybe<Scalars['ID']>
  id_not_in?: Maybe<Array<Scalars['ID']>>
  logIndex?: Maybe<Scalars['v3arbitrum_BigInt']>
  logIndex_gt?: Maybe<Scalars['v3arbitrum_BigInt']>
  logIndex_gte?: Maybe<Scalars['v3arbitrum_BigInt']>
  logIndex_in?: Maybe<Array<Scalars['v3arbitrum_BigInt']>>
  logIndex_lt?: Maybe<Scalars['v3arbitrum_BigInt']>
  logIndex_lte?: Maybe<Scalars['v3arbitrum_BigInt']>
  logIndex_not?: Maybe<Scalars['v3arbitrum_BigInt']>
  logIndex_not_in?: Maybe<Array<Scalars['v3arbitrum_BigInt']>>
  owner?: Maybe<Scalars['v3arbitrum_Bytes']>
  owner_contains?: Maybe<Scalars['v3arbitrum_Bytes']>
  owner_in?: Maybe<Array<Scalars['v3arbitrum_Bytes']>>
  owner_not?: Maybe<Scalars['v3arbitrum_Bytes']>
  owner_not_contains?: Maybe<Scalars['v3arbitrum_Bytes']>
  owner_not_in?: Maybe<Array<Scalars['v3arbitrum_Bytes']>>
  pool?: Maybe<Scalars['String']>
  pool_contains?: Maybe<Scalars['String']>
  pool_ends_with?: Maybe<Scalars['String']>
  pool_gt?: Maybe<Scalars['String']>
  pool_gte?: Maybe<Scalars['String']>
  pool_in?: Maybe<Array<Scalars['String']>>
  pool_lt?: Maybe<Scalars['String']>
  pool_lte?: Maybe<Scalars['String']>
  pool_not?: Maybe<Scalars['String']>
  pool_not_contains?: Maybe<Scalars['String']>
  pool_not_ends_with?: Maybe<Scalars['String']>
  pool_not_in?: Maybe<Array<Scalars['String']>>
  pool_not_starts_with?: Maybe<Scalars['String']>
  pool_starts_with?: Maybe<Scalars['String']>
  tickLower?: Maybe<Scalars['v3arbitrum_BigInt']>
  tickLower_gt?: Maybe<Scalars['v3arbitrum_BigInt']>
  tickLower_gte?: Maybe<Scalars['v3arbitrum_BigInt']>
  tickLower_in?: Maybe<Array<Scalars['v3arbitrum_BigInt']>>
  tickLower_lt?: Maybe<Scalars['v3arbitrum_BigInt']>
  tickLower_lte?: Maybe<Scalars['v3arbitrum_BigInt']>
  tickLower_not?: Maybe<Scalars['v3arbitrum_BigInt']>
  tickLower_not_in?: Maybe<Array<Scalars['v3arbitrum_BigInt']>>
  tickUpper?: Maybe<Scalars['v3arbitrum_BigInt']>
  tickUpper_gt?: Maybe<Scalars['v3arbitrum_BigInt']>
  tickUpper_gte?: Maybe<Scalars['v3arbitrum_BigInt']>
  tickUpper_in?: Maybe<Array<Scalars['v3arbitrum_BigInt']>>
  tickUpper_lt?: Maybe<Scalars['v3arbitrum_BigInt']>
  tickUpper_lte?: Maybe<Scalars['v3arbitrum_BigInt']>
  tickUpper_not?: Maybe<Scalars['v3arbitrum_BigInt']>
  tickUpper_not_in?: Maybe<Array<Scalars['v3arbitrum_BigInt']>>
  timestamp?: Maybe<Scalars['v3arbitrum_BigInt']>
  timestamp_gt?: Maybe<Scalars['v3arbitrum_BigInt']>
  timestamp_gte?: Maybe<Scalars['v3arbitrum_BigInt']>
  timestamp_in?: Maybe<Array<Scalars['v3arbitrum_BigInt']>>
  timestamp_lt?: Maybe<Scalars['v3arbitrum_BigInt']>
  timestamp_lte?: Maybe<Scalars['v3arbitrum_BigInt']>
  timestamp_not?: Maybe<Scalars['v3arbitrum_BigInt']>
  timestamp_not_in?: Maybe<Array<Scalars['v3arbitrum_BigInt']>>
  transaction?: Maybe<Scalars['String']>
  transaction_contains?: Maybe<Scalars['String']>
  transaction_ends_with?: Maybe<Scalars['String']>
  transaction_gt?: Maybe<Scalars['String']>
  transaction_gte?: Maybe<Scalars['String']>
  transaction_in?: Maybe<Array<Scalars['String']>>
  transaction_lt?: Maybe<Scalars['String']>
  transaction_lte?: Maybe<Scalars['String']>
  transaction_not?: Maybe<Scalars['String']>
  transaction_not_contains?: Maybe<Scalars['String']>
  transaction_not_ends_with?: Maybe<Scalars['String']>
  transaction_not_in?: Maybe<Array<Scalars['String']>>
  transaction_not_starts_with?: Maybe<Scalars['String']>
  transaction_starts_with?: Maybe<Scalars['String']>
}

export enum V3arbitrum_Collect_OrderBy {
  Amount0 = 'amount0',
  Amount1 = 'amount1',
  AmountUsd = 'amountUSD',
  Id = 'id',
  LogIndex = 'logIndex',
  Owner = 'owner',
  Pool = 'pool',
  TickLower = 'tickLower',
  TickUpper = 'tickUpper',
  Timestamp = 'timestamp',
  Transaction = 'transaction',
}

export type V3arbitrum_Factory = {
  __typename?: 'v3arbitrum_Factory'
  id: Scalars['ID']
  owner: Scalars['ID']
  poolCount: Scalars['v3arbitrum_BigInt']
  totalFeesETH: Scalars['v3arbitrum_BigDecimal']
  totalFeesUSD: Scalars['v3arbitrum_BigDecimal']
  totalValueLockedETH: Scalars['v3arbitrum_BigDecimal']
  totalValueLockedETHUntracked: Scalars['v3arbitrum_BigDecimal']
  totalValueLockedUSD: Scalars['v3arbitrum_BigDecimal']
  totalValueLockedUSDUntracked: Scalars['v3arbitrum_BigDecimal']
  totalVolumeETH: Scalars['v3arbitrum_BigDecimal']
  totalVolumeUSD: Scalars['v3arbitrum_BigDecimal']
  txCount: Scalars['v3arbitrum_BigInt']
  untrackedVolumeUSD: Scalars['v3arbitrum_BigDecimal']
}

export type V3arbitrum_Factory_Filter = {
  id?: Maybe<Scalars['ID']>
  id_gt?: Maybe<Scalars['ID']>
  id_gte?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  id_lt?: Maybe<Scalars['ID']>
  id_lte?: Maybe<Scalars['ID']>
  id_not?: Maybe<Scalars['ID']>
  id_not_in?: Maybe<Array<Scalars['ID']>>
  owner?: Maybe<Scalars['ID']>
  owner_gt?: Maybe<Scalars['ID']>
  owner_gte?: Maybe<Scalars['ID']>
  owner_in?: Maybe<Array<Scalars['ID']>>
  owner_lt?: Maybe<Scalars['ID']>
  owner_lte?: Maybe<Scalars['ID']>
  owner_not?: Maybe<Scalars['ID']>
  owner_not_in?: Maybe<Array<Scalars['ID']>>
  poolCount?: Maybe<Scalars['v3arbitrum_BigInt']>
  poolCount_gt?: Maybe<Scalars['v3arbitrum_BigInt']>
  poolCount_gte?: Maybe<Scalars['v3arbitrum_BigInt']>
  poolCount_in?: Maybe<Array<Scalars['v3arbitrum_BigInt']>>
  poolCount_lt?: Maybe<Scalars['v3arbitrum_BigInt']>
  poolCount_lte?: Maybe<Scalars['v3arbitrum_BigInt']>
  poolCount_not?: Maybe<Scalars['v3arbitrum_BigInt']>
  poolCount_not_in?: Maybe<Array<Scalars['v3arbitrum_BigInt']>>
  totalFeesETH?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  totalFeesETH_gt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  totalFeesETH_gte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  totalFeesETH_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  totalFeesETH_lt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  totalFeesETH_lte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  totalFeesETH_not?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  totalFeesETH_not_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  totalFeesUSD?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  totalFeesUSD_gt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  totalFeesUSD_gte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  totalFeesUSD_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  totalFeesUSD_lt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  totalFeesUSD_lte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  totalFeesUSD_not?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  totalFeesUSD_not_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  totalValueLockedETH?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  totalValueLockedETHUntracked?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  totalValueLockedETHUntracked_gt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  totalValueLockedETHUntracked_gte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  totalValueLockedETHUntracked_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  totalValueLockedETHUntracked_lt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  totalValueLockedETHUntracked_lte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  totalValueLockedETHUntracked_not?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  totalValueLockedETHUntracked_not_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  totalValueLockedETH_gt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  totalValueLockedETH_gte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  totalValueLockedETH_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  totalValueLockedETH_lt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  totalValueLockedETH_lte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  totalValueLockedETH_not?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  totalValueLockedETH_not_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  totalValueLockedUSD?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  totalValueLockedUSDUntracked?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  totalValueLockedUSDUntracked_gt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  totalValueLockedUSDUntracked_gte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  totalValueLockedUSDUntracked_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  totalValueLockedUSDUntracked_lt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  totalValueLockedUSDUntracked_lte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  totalValueLockedUSDUntracked_not?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  totalValueLockedUSDUntracked_not_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  totalValueLockedUSD_gt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  totalValueLockedUSD_gte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  totalValueLockedUSD_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  totalValueLockedUSD_lt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  totalValueLockedUSD_lte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  totalValueLockedUSD_not?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  totalValueLockedUSD_not_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  totalVolumeETH?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  totalVolumeETH_gt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  totalVolumeETH_gte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  totalVolumeETH_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  totalVolumeETH_lt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  totalVolumeETH_lte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  totalVolumeETH_not?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  totalVolumeETH_not_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  totalVolumeUSD?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  totalVolumeUSD_gt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  totalVolumeUSD_gte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  totalVolumeUSD_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  totalVolumeUSD_lt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  totalVolumeUSD_lte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  totalVolumeUSD_not?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  totalVolumeUSD_not_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  txCount?: Maybe<Scalars['v3arbitrum_BigInt']>
  txCount_gt?: Maybe<Scalars['v3arbitrum_BigInt']>
  txCount_gte?: Maybe<Scalars['v3arbitrum_BigInt']>
  txCount_in?: Maybe<Array<Scalars['v3arbitrum_BigInt']>>
  txCount_lt?: Maybe<Scalars['v3arbitrum_BigInt']>
  txCount_lte?: Maybe<Scalars['v3arbitrum_BigInt']>
  txCount_not?: Maybe<Scalars['v3arbitrum_BigInt']>
  txCount_not_in?: Maybe<Array<Scalars['v3arbitrum_BigInt']>>
  untrackedVolumeUSD?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  untrackedVolumeUSD_gt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  untrackedVolumeUSD_gte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  untrackedVolumeUSD_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  untrackedVolumeUSD_lt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  untrackedVolumeUSD_lte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  untrackedVolumeUSD_not?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  untrackedVolumeUSD_not_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
}

export enum V3arbitrum_Factory_OrderBy {
  Id = 'id',
  Owner = 'owner',
  PoolCount = 'poolCount',
  TotalFeesEth = 'totalFeesETH',
  TotalFeesUsd = 'totalFeesUSD',
  TotalValueLockedEth = 'totalValueLockedETH',
  TotalValueLockedEthUntracked = 'totalValueLockedETHUntracked',
  TotalValueLockedUsd = 'totalValueLockedUSD',
  TotalValueLockedUsdUntracked = 'totalValueLockedUSDUntracked',
  TotalVolumeEth = 'totalVolumeETH',
  TotalVolumeUsd = 'totalVolumeUSD',
  TxCount = 'txCount',
  UntrackedVolumeUsd = 'untrackedVolumeUSD',
}

export type V3arbitrum_Flash = {
  __typename?: 'v3arbitrum_Flash'
  amount0: Scalars['v3arbitrum_BigDecimal']
  amount0Paid: Scalars['v3arbitrum_BigDecimal']
  amount1: Scalars['v3arbitrum_BigDecimal']
  amount1Paid: Scalars['v3arbitrum_BigDecimal']
  amountUSD: Scalars['v3arbitrum_BigDecimal']
  id: Scalars['ID']
  logIndex?: Maybe<Scalars['v3arbitrum_BigInt']>
  pool: V3arbitrum_Pool
  recipient: Scalars['v3arbitrum_Bytes']
  sender: Scalars['v3arbitrum_Bytes']
  timestamp: Scalars['v3arbitrum_BigInt']
  transaction: V3arbitrum_Transaction
}

export type V3arbitrum_Flash_Filter = {
  amount0?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  amount0Paid?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  amount0Paid_gt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  amount0Paid_gte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  amount0Paid_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  amount0Paid_lt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  amount0Paid_lte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  amount0Paid_not?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  amount0Paid_not_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  amount0_gt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  amount0_gte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  amount0_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  amount0_lt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  amount0_lte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  amount0_not?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  amount0_not_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  amount1?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  amount1Paid?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  amount1Paid_gt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  amount1Paid_gte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  amount1Paid_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  amount1Paid_lt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  amount1Paid_lte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  amount1Paid_not?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  amount1Paid_not_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  amount1_gt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  amount1_gte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  amount1_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  amount1_lt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  amount1_lte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  amount1_not?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  amount1_not_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  amountUSD?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  amountUSD_gt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  amountUSD_gte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  amountUSD_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  amountUSD_lt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  amountUSD_lte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  amountUSD_not?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  amountUSD_not_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  id?: Maybe<Scalars['ID']>
  id_gt?: Maybe<Scalars['ID']>
  id_gte?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  id_lt?: Maybe<Scalars['ID']>
  id_lte?: Maybe<Scalars['ID']>
  id_not?: Maybe<Scalars['ID']>
  id_not_in?: Maybe<Array<Scalars['ID']>>
  logIndex?: Maybe<Scalars['v3arbitrum_BigInt']>
  logIndex_gt?: Maybe<Scalars['v3arbitrum_BigInt']>
  logIndex_gte?: Maybe<Scalars['v3arbitrum_BigInt']>
  logIndex_in?: Maybe<Array<Scalars['v3arbitrum_BigInt']>>
  logIndex_lt?: Maybe<Scalars['v3arbitrum_BigInt']>
  logIndex_lte?: Maybe<Scalars['v3arbitrum_BigInt']>
  logIndex_not?: Maybe<Scalars['v3arbitrum_BigInt']>
  logIndex_not_in?: Maybe<Array<Scalars['v3arbitrum_BigInt']>>
  pool?: Maybe<Scalars['String']>
  pool_contains?: Maybe<Scalars['String']>
  pool_ends_with?: Maybe<Scalars['String']>
  pool_gt?: Maybe<Scalars['String']>
  pool_gte?: Maybe<Scalars['String']>
  pool_in?: Maybe<Array<Scalars['String']>>
  pool_lt?: Maybe<Scalars['String']>
  pool_lte?: Maybe<Scalars['String']>
  pool_not?: Maybe<Scalars['String']>
  pool_not_contains?: Maybe<Scalars['String']>
  pool_not_ends_with?: Maybe<Scalars['String']>
  pool_not_in?: Maybe<Array<Scalars['String']>>
  pool_not_starts_with?: Maybe<Scalars['String']>
  pool_starts_with?: Maybe<Scalars['String']>
  recipient?: Maybe<Scalars['v3arbitrum_Bytes']>
  recipient_contains?: Maybe<Scalars['v3arbitrum_Bytes']>
  recipient_in?: Maybe<Array<Scalars['v3arbitrum_Bytes']>>
  recipient_not?: Maybe<Scalars['v3arbitrum_Bytes']>
  recipient_not_contains?: Maybe<Scalars['v3arbitrum_Bytes']>
  recipient_not_in?: Maybe<Array<Scalars['v3arbitrum_Bytes']>>
  sender?: Maybe<Scalars['v3arbitrum_Bytes']>
  sender_contains?: Maybe<Scalars['v3arbitrum_Bytes']>
  sender_in?: Maybe<Array<Scalars['v3arbitrum_Bytes']>>
  sender_not?: Maybe<Scalars['v3arbitrum_Bytes']>
  sender_not_contains?: Maybe<Scalars['v3arbitrum_Bytes']>
  sender_not_in?: Maybe<Array<Scalars['v3arbitrum_Bytes']>>
  timestamp?: Maybe<Scalars['v3arbitrum_BigInt']>
  timestamp_gt?: Maybe<Scalars['v3arbitrum_BigInt']>
  timestamp_gte?: Maybe<Scalars['v3arbitrum_BigInt']>
  timestamp_in?: Maybe<Array<Scalars['v3arbitrum_BigInt']>>
  timestamp_lt?: Maybe<Scalars['v3arbitrum_BigInt']>
  timestamp_lte?: Maybe<Scalars['v3arbitrum_BigInt']>
  timestamp_not?: Maybe<Scalars['v3arbitrum_BigInt']>
  timestamp_not_in?: Maybe<Array<Scalars['v3arbitrum_BigInt']>>
  transaction?: Maybe<Scalars['String']>
  transaction_contains?: Maybe<Scalars['String']>
  transaction_ends_with?: Maybe<Scalars['String']>
  transaction_gt?: Maybe<Scalars['String']>
  transaction_gte?: Maybe<Scalars['String']>
  transaction_in?: Maybe<Array<Scalars['String']>>
  transaction_lt?: Maybe<Scalars['String']>
  transaction_lte?: Maybe<Scalars['String']>
  transaction_not?: Maybe<Scalars['String']>
  transaction_not_contains?: Maybe<Scalars['String']>
  transaction_not_ends_with?: Maybe<Scalars['String']>
  transaction_not_in?: Maybe<Array<Scalars['String']>>
  transaction_not_starts_with?: Maybe<Scalars['String']>
  transaction_starts_with?: Maybe<Scalars['String']>
}

export enum V3arbitrum_Flash_OrderBy {
  Amount0 = 'amount0',
  Amount0Paid = 'amount0Paid',
  Amount1 = 'amount1',
  Amount1Paid = 'amount1Paid',
  AmountUsd = 'amountUSD',
  Id = 'id',
  LogIndex = 'logIndex',
  Pool = 'pool',
  Recipient = 'recipient',
  Sender = 'sender',
  Timestamp = 'timestamp',
  Transaction = 'transaction',
}

export type V3arbitrum_Mint = {
  __typename?: 'v3arbitrum_Mint'
  amount: Scalars['v3arbitrum_BigInt']
  amount0: Scalars['v3arbitrum_BigDecimal']
  amount1: Scalars['v3arbitrum_BigDecimal']
  amountUSD?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  id: Scalars['ID']
  logIndex?: Maybe<Scalars['v3arbitrum_BigInt']>
  origin: Scalars['v3arbitrum_Bytes']
  owner: Scalars['v3arbitrum_Bytes']
  pool: V3arbitrum_Pool
  sender?: Maybe<Scalars['v3arbitrum_Bytes']>
  tickLower: Scalars['v3arbitrum_BigInt']
  tickUpper: Scalars['v3arbitrum_BigInt']
  timestamp: Scalars['v3arbitrum_BigInt']
  token0: V3arbitrum_Token
  token1: V3arbitrum_Token
  transaction: V3arbitrum_Transaction
}

export type V3arbitrum_Mint_Filter = {
  amount?: Maybe<Scalars['v3arbitrum_BigInt']>
  amount0?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  amount0_gt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  amount0_gte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  amount0_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  amount0_lt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  amount0_lte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  amount0_not?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  amount0_not_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  amount1?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  amount1_gt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  amount1_gte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  amount1_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  amount1_lt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  amount1_lte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  amount1_not?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  amount1_not_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  amountUSD?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  amountUSD_gt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  amountUSD_gte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  amountUSD_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  amountUSD_lt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  amountUSD_lte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  amountUSD_not?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  amountUSD_not_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  amount_gt?: Maybe<Scalars['v3arbitrum_BigInt']>
  amount_gte?: Maybe<Scalars['v3arbitrum_BigInt']>
  amount_in?: Maybe<Array<Scalars['v3arbitrum_BigInt']>>
  amount_lt?: Maybe<Scalars['v3arbitrum_BigInt']>
  amount_lte?: Maybe<Scalars['v3arbitrum_BigInt']>
  amount_not?: Maybe<Scalars['v3arbitrum_BigInt']>
  amount_not_in?: Maybe<Array<Scalars['v3arbitrum_BigInt']>>
  id?: Maybe<Scalars['ID']>
  id_gt?: Maybe<Scalars['ID']>
  id_gte?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  id_lt?: Maybe<Scalars['ID']>
  id_lte?: Maybe<Scalars['ID']>
  id_not?: Maybe<Scalars['ID']>
  id_not_in?: Maybe<Array<Scalars['ID']>>
  logIndex?: Maybe<Scalars['v3arbitrum_BigInt']>
  logIndex_gt?: Maybe<Scalars['v3arbitrum_BigInt']>
  logIndex_gte?: Maybe<Scalars['v3arbitrum_BigInt']>
  logIndex_in?: Maybe<Array<Scalars['v3arbitrum_BigInt']>>
  logIndex_lt?: Maybe<Scalars['v3arbitrum_BigInt']>
  logIndex_lte?: Maybe<Scalars['v3arbitrum_BigInt']>
  logIndex_not?: Maybe<Scalars['v3arbitrum_BigInt']>
  logIndex_not_in?: Maybe<Array<Scalars['v3arbitrum_BigInt']>>
  origin?: Maybe<Scalars['v3arbitrum_Bytes']>
  origin_contains?: Maybe<Scalars['v3arbitrum_Bytes']>
  origin_in?: Maybe<Array<Scalars['v3arbitrum_Bytes']>>
  origin_not?: Maybe<Scalars['v3arbitrum_Bytes']>
  origin_not_contains?: Maybe<Scalars['v3arbitrum_Bytes']>
  origin_not_in?: Maybe<Array<Scalars['v3arbitrum_Bytes']>>
  owner?: Maybe<Scalars['v3arbitrum_Bytes']>
  owner_contains?: Maybe<Scalars['v3arbitrum_Bytes']>
  owner_in?: Maybe<Array<Scalars['v3arbitrum_Bytes']>>
  owner_not?: Maybe<Scalars['v3arbitrum_Bytes']>
  owner_not_contains?: Maybe<Scalars['v3arbitrum_Bytes']>
  owner_not_in?: Maybe<Array<Scalars['v3arbitrum_Bytes']>>
  pool?: Maybe<Scalars['String']>
  pool_contains?: Maybe<Scalars['String']>
  pool_ends_with?: Maybe<Scalars['String']>
  pool_gt?: Maybe<Scalars['String']>
  pool_gte?: Maybe<Scalars['String']>
  pool_in?: Maybe<Array<Scalars['String']>>
  pool_lt?: Maybe<Scalars['String']>
  pool_lte?: Maybe<Scalars['String']>
  pool_not?: Maybe<Scalars['String']>
  pool_not_contains?: Maybe<Scalars['String']>
  pool_not_ends_with?: Maybe<Scalars['String']>
  pool_not_in?: Maybe<Array<Scalars['String']>>
  pool_not_starts_with?: Maybe<Scalars['String']>
  pool_starts_with?: Maybe<Scalars['String']>
  sender?: Maybe<Scalars['v3arbitrum_Bytes']>
  sender_contains?: Maybe<Scalars['v3arbitrum_Bytes']>
  sender_in?: Maybe<Array<Scalars['v3arbitrum_Bytes']>>
  sender_not?: Maybe<Scalars['v3arbitrum_Bytes']>
  sender_not_contains?: Maybe<Scalars['v3arbitrum_Bytes']>
  sender_not_in?: Maybe<Array<Scalars['v3arbitrum_Bytes']>>
  tickLower?: Maybe<Scalars['v3arbitrum_BigInt']>
  tickLower_gt?: Maybe<Scalars['v3arbitrum_BigInt']>
  tickLower_gte?: Maybe<Scalars['v3arbitrum_BigInt']>
  tickLower_in?: Maybe<Array<Scalars['v3arbitrum_BigInt']>>
  tickLower_lt?: Maybe<Scalars['v3arbitrum_BigInt']>
  tickLower_lte?: Maybe<Scalars['v3arbitrum_BigInt']>
  tickLower_not?: Maybe<Scalars['v3arbitrum_BigInt']>
  tickLower_not_in?: Maybe<Array<Scalars['v3arbitrum_BigInt']>>
  tickUpper?: Maybe<Scalars['v3arbitrum_BigInt']>
  tickUpper_gt?: Maybe<Scalars['v3arbitrum_BigInt']>
  tickUpper_gte?: Maybe<Scalars['v3arbitrum_BigInt']>
  tickUpper_in?: Maybe<Array<Scalars['v3arbitrum_BigInt']>>
  tickUpper_lt?: Maybe<Scalars['v3arbitrum_BigInt']>
  tickUpper_lte?: Maybe<Scalars['v3arbitrum_BigInt']>
  tickUpper_not?: Maybe<Scalars['v3arbitrum_BigInt']>
  tickUpper_not_in?: Maybe<Array<Scalars['v3arbitrum_BigInt']>>
  timestamp?: Maybe<Scalars['v3arbitrum_BigInt']>
  timestamp_gt?: Maybe<Scalars['v3arbitrum_BigInt']>
  timestamp_gte?: Maybe<Scalars['v3arbitrum_BigInt']>
  timestamp_in?: Maybe<Array<Scalars['v3arbitrum_BigInt']>>
  timestamp_lt?: Maybe<Scalars['v3arbitrum_BigInt']>
  timestamp_lte?: Maybe<Scalars['v3arbitrum_BigInt']>
  timestamp_not?: Maybe<Scalars['v3arbitrum_BigInt']>
  timestamp_not_in?: Maybe<Array<Scalars['v3arbitrum_BigInt']>>
  token0?: Maybe<Scalars['String']>
  token0_contains?: Maybe<Scalars['String']>
  token0_ends_with?: Maybe<Scalars['String']>
  token0_gt?: Maybe<Scalars['String']>
  token0_gte?: Maybe<Scalars['String']>
  token0_in?: Maybe<Array<Scalars['String']>>
  token0_lt?: Maybe<Scalars['String']>
  token0_lte?: Maybe<Scalars['String']>
  token0_not?: Maybe<Scalars['String']>
  token0_not_contains?: Maybe<Scalars['String']>
  token0_not_ends_with?: Maybe<Scalars['String']>
  token0_not_in?: Maybe<Array<Scalars['String']>>
  token0_not_starts_with?: Maybe<Scalars['String']>
  token0_starts_with?: Maybe<Scalars['String']>
  token1?: Maybe<Scalars['String']>
  token1_contains?: Maybe<Scalars['String']>
  token1_ends_with?: Maybe<Scalars['String']>
  token1_gt?: Maybe<Scalars['String']>
  token1_gte?: Maybe<Scalars['String']>
  token1_in?: Maybe<Array<Scalars['String']>>
  token1_lt?: Maybe<Scalars['String']>
  token1_lte?: Maybe<Scalars['String']>
  token1_not?: Maybe<Scalars['String']>
  token1_not_contains?: Maybe<Scalars['String']>
  token1_not_ends_with?: Maybe<Scalars['String']>
  token1_not_in?: Maybe<Array<Scalars['String']>>
  token1_not_starts_with?: Maybe<Scalars['String']>
  token1_starts_with?: Maybe<Scalars['String']>
  transaction?: Maybe<Scalars['String']>
  transaction_contains?: Maybe<Scalars['String']>
  transaction_ends_with?: Maybe<Scalars['String']>
  transaction_gt?: Maybe<Scalars['String']>
  transaction_gte?: Maybe<Scalars['String']>
  transaction_in?: Maybe<Array<Scalars['String']>>
  transaction_lt?: Maybe<Scalars['String']>
  transaction_lte?: Maybe<Scalars['String']>
  transaction_not?: Maybe<Scalars['String']>
  transaction_not_contains?: Maybe<Scalars['String']>
  transaction_not_ends_with?: Maybe<Scalars['String']>
  transaction_not_in?: Maybe<Array<Scalars['String']>>
  transaction_not_starts_with?: Maybe<Scalars['String']>
  transaction_starts_with?: Maybe<Scalars['String']>
}

export enum V3arbitrum_Mint_OrderBy {
  Amount = 'amount',
  Amount0 = 'amount0',
  Amount1 = 'amount1',
  AmountUsd = 'amountUSD',
  Id = 'id',
  LogIndex = 'logIndex',
  Origin = 'origin',
  Owner = 'owner',
  Pool = 'pool',
  Sender = 'sender',
  TickLower = 'tickLower',
  TickUpper = 'tickUpper',
  Timestamp = 'timestamp',
  Token0 = 'token0',
  Token1 = 'token1',
  Transaction = 'transaction',
}

export enum V3arbitrum_OrderDirection {
  Asc = 'asc',
  Desc = 'desc',
}

export type V3arbitrum_Pool = {
  __typename?: 'v3arbitrum_Pool'
  burns: Array<V3arbitrum_Burn>
  collectedFeesToken0: Scalars['v3arbitrum_BigDecimal']
  collectedFeesToken1: Scalars['v3arbitrum_BigDecimal']
  collectedFeesUSD: Scalars['v3arbitrum_BigDecimal']
  collects: Array<V3arbitrum_Collect>
  createdAtBlockNumber: Scalars['v3arbitrum_BigInt']
  createdAtTimestamp: Scalars['v3arbitrum_BigInt']
  feeTier: Scalars['v3arbitrum_BigInt']
  feesUSD: Scalars['v3arbitrum_BigDecimal']
  id: Scalars['ID']
  liquidity: Scalars['v3arbitrum_BigInt']
  liquidityProviderCount: Scalars['v3arbitrum_BigInt']
  mints: Array<V3arbitrum_Mint>
  observationIndex: Scalars['v3arbitrum_BigInt']
  poolDayData: Array<V3arbitrum_PoolDayData>
  poolHourData: Array<V3arbitrum_PoolHourData>
  sqrtPrice: Scalars['v3arbitrum_BigInt']
  swaps: Array<V3arbitrum_Swap>
  tick?: Maybe<Scalars['v3arbitrum_BigInt']>
  ticks: Array<V3arbitrum_Tick>
  token0: V3arbitrum_Token
  token0Price: Scalars['v3arbitrum_BigDecimal']
  token1: V3arbitrum_Token
  token1Price: Scalars['v3arbitrum_BigDecimal']
  totalValueLockedETH: Scalars['v3arbitrum_BigDecimal']
  totalValueLockedToken0: Scalars['v3arbitrum_BigDecimal']
  totalValueLockedToken1: Scalars['v3arbitrum_BigDecimal']
  totalValueLockedUSD: Scalars['v3arbitrum_BigDecimal']
  totalValueLockedUSDUntracked: Scalars['v3arbitrum_BigDecimal']
  txCount: Scalars['v3arbitrum_BigInt']
  untrackedVolumeUSD: Scalars['v3arbitrum_BigDecimal']
  volumeToken0: Scalars['v3arbitrum_BigDecimal']
  volumeToken1: Scalars['v3arbitrum_BigDecimal']
  volumeUSD: Scalars['v3arbitrum_BigDecimal']
}

export type V3arbitrum_PoolBurnsArgs = {
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3arbitrum_Burn_OrderBy>
  orderDirection?: Maybe<V3arbitrum_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  where?: Maybe<V3arbitrum_Burn_Filter>
}

export type V3arbitrum_PoolCollectsArgs = {
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3arbitrum_Collect_OrderBy>
  orderDirection?: Maybe<V3arbitrum_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  where?: Maybe<V3arbitrum_Collect_Filter>
}

export type V3arbitrum_PoolMintsArgs = {
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3arbitrum_Mint_OrderBy>
  orderDirection?: Maybe<V3arbitrum_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  where?: Maybe<V3arbitrum_Mint_Filter>
}

export type V3arbitrum_PoolPoolDayDataArgs = {
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3arbitrum_PoolDayData_OrderBy>
  orderDirection?: Maybe<V3arbitrum_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  where?: Maybe<V3arbitrum_PoolDayData_Filter>
}

export type V3arbitrum_PoolPoolHourDataArgs = {
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3arbitrum_PoolHourData_OrderBy>
  orderDirection?: Maybe<V3arbitrum_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  where?: Maybe<V3arbitrum_PoolHourData_Filter>
}

export type V3arbitrum_PoolSwapsArgs = {
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3arbitrum_Swap_OrderBy>
  orderDirection?: Maybe<V3arbitrum_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  where?: Maybe<V3arbitrum_Swap_Filter>
}

export type V3arbitrum_PoolTicksArgs = {
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3arbitrum_Tick_OrderBy>
  orderDirection?: Maybe<V3arbitrum_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  where?: Maybe<V3arbitrum_Tick_Filter>
}

export type V3arbitrum_PoolDayData = {
  __typename?: 'v3arbitrum_PoolDayData'
  close: Scalars['v3arbitrum_BigDecimal']
  date: Scalars['Int']
  feesUSD: Scalars['v3arbitrum_BigDecimal']
  high: Scalars['v3arbitrum_BigDecimal']
  id: Scalars['ID']
  liquidity: Scalars['v3arbitrum_BigInt']
  low: Scalars['v3arbitrum_BigDecimal']
  open: Scalars['v3arbitrum_BigDecimal']
  pool: V3arbitrum_Pool
  sqrtPrice: Scalars['v3arbitrum_BigInt']
  tick?: Maybe<Scalars['v3arbitrum_BigInt']>
  token0Price: Scalars['v3arbitrum_BigDecimal']
  token1Price: Scalars['v3arbitrum_BigDecimal']
  tvlUSD: Scalars['v3arbitrum_BigDecimal']
  txCount: Scalars['v3arbitrum_BigInt']
  volumeToken0: Scalars['v3arbitrum_BigDecimal']
  volumeToken1: Scalars['v3arbitrum_BigDecimal']
  volumeUSD: Scalars['v3arbitrum_BigDecimal']
}

export type V3arbitrum_PoolDayData_Filter = {
  close?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  close_gt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  close_gte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  close_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  close_lt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  close_lte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  close_not?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  close_not_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  date?: Maybe<Scalars['Int']>
  date_gt?: Maybe<Scalars['Int']>
  date_gte?: Maybe<Scalars['Int']>
  date_in?: Maybe<Array<Scalars['Int']>>
  date_lt?: Maybe<Scalars['Int']>
  date_lte?: Maybe<Scalars['Int']>
  date_not?: Maybe<Scalars['Int']>
  date_not_in?: Maybe<Array<Scalars['Int']>>
  feesUSD?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  feesUSD_gt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  feesUSD_gte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  feesUSD_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  feesUSD_lt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  feesUSD_lte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  feesUSD_not?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  feesUSD_not_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  high?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  high_gt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  high_gte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  high_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  high_lt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  high_lte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  high_not?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  high_not_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  id?: Maybe<Scalars['ID']>
  id_gt?: Maybe<Scalars['ID']>
  id_gte?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  id_lt?: Maybe<Scalars['ID']>
  id_lte?: Maybe<Scalars['ID']>
  id_not?: Maybe<Scalars['ID']>
  id_not_in?: Maybe<Array<Scalars['ID']>>
  liquidity?: Maybe<Scalars['v3arbitrum_BigInt']>
  liquidity_gt?: Maybe<Scalars['v3arbitrum_BigInt']>
  liquidity_gte?: Maybe<Scalars['v3arbitrum_BigInt']>
  liquidity_in?: Maybe<Array<Scalars['v3arbitrum_BigInt']>>
  liquidity_lt?: Maybe<Scalars['v3arbitrum_BigInt']>
  liquidity_lte?: Maybe<Scalars['v3arbitrum_BigInt']>
  liquidity_not?: Maybe<Scalars['v3arbitrum_BigInt']>
  liquidity_not_in?: Maybe<Array<Scalars['v3arbitrum_BigInt']>>
  low?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  low_gt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  low_gte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  low_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  low_lt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  low_lte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  low_not?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  low_not_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  open?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  open_gt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  open_gte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  open_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  open_lt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  open_lte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  open_not?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  open_not_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  pool?: Maybe<Scalars['String']>
  pool_contains?: Maybe<Scalars['String']>
  pool_ends_with?: Maybe<Scalars['String']>
  pool_gt?: Maybe<Scalars['String']>
  pool_gte?: Maybe<Scalars['String']>
  pool_in?: Maybe<Array<Scalars['String']>>
  pool_lt?: Maybe<Scalars['String']>
  pool_lte?: Maybe<Scalars['String']>
  pool_not?: Maybe<Scalars['String']>
  pool_not_contains?: Maybe<Scalars['String']>
  pool_not_ends_with?: Maybe<Scalars['String']>
  pool_not_in?: Maybe<Array<Scalars['String']>>
  pool_not_starts_with?: Maybe<Scalars['String']>
  pool_starts_with?: Maybe<Scalars['String']>
  sqrtPrice?: Maybe<Scalars['v3arbitrum_BigInt']>
  sqrtPrice_gt?: Maybe<Scalars['v3arbitrum_BigInt']>
  sqrtPrice_gte?: Maybe<Scalars['v3arbitrum_BigInt']>
  sqrtPrice_in?: Maybe<Array<Scalars['v3arbitrum_BigInt']>>
  sqrtPrice_lt?: Maybe<Scalars['v3arbitrum_BigInt']>
  sqrtPrice_lte?: Maybe<Scalars['v3arbitrum_BigInt']>
  sqrtPrice_not?: Maybe<Scalars['v3arbitrum_BigInt']>
  sqrtPrice_not_in?: Maybe<Array<Scalars['v3arbitrum_BigInt']>>
  tick?: Maybe<Scalars['v3arbitrum_BigInt']>
  tick_gt?: Maybe<Scalars['v3arbitrum_BigInt']>
  tick_gte?: Maybe<Scalars['v3arbitrum_BigInt']>
  tick_in?: Maybe<Array<Scalars['v3arbitrum_BigInt']>>
  tick_lt?: Maybe<Scalars['v3arbitrum_BigInt']>
  tick_lte?: Maybe<Scalars['v3arbitrum_BigInt']>
  tick_not?: Maybe<Scalars['v3arbitrum_BigInt']>
  tick_not_in?: Maybe<Array<Scalars['v3arbitrum_BigInt']>>
  token0Price?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  token0Price_gt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  token0Price_gte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  token0Price_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  token0Price_lt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  token0Price_lte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  token0Price_not?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  token0Price_not_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  token1Price?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  token1Price_gt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  token1Price_gte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  token1Price_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  token1Price_lt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  token1Price_lte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  token1Price_not?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  token1Price_not_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  tvlUSD?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  tvlUSD_gt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  tvlUSD_gte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  tvlUSD_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  tvlUSD_lt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  tvlUSD_lte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  tvlUSD_not?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  tvlUSD_not_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  txCount?: Maybe<Scalars['v3arbitrum_BigInt']>
  txCount_gt?: Maybe<Scalars['v3arbitrum_BigInt']>
  txCount_gte?: Maybe<Scalars['v3arbitrum_BigInt']>
  txCount_in?: Maybe<Array<Scalars['v3arbitrum_BigInt']>>
  txCount_lt?: Maybe<Scalars['v3arbitrum_BigInt']>
  txCount_lte?: Maybe<Scalars['v3arbitrum_BigInt']>
  txCount_not?: Maybe<Scalars['v3arbitrum_BigInt']>
  txCount_not_in?: Maybe<Array<Scalars['v3arbitrum_BigInt']>>
  volumeToken0?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeToken0_gt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeToken0_gte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeToken0_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  volumeToken0_lt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeToken0_lte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeToken0_not?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeToken0_not_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  volumeToken1?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeToken1_gt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeToken1_gte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeToken1_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  volumeToken1_lt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeToken1_lte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeToken1_not?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeToken1_not_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  volumeUSD?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeUSD_gt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeUSD_gte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeUSD_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  volumeUSD_lt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeUSD_lte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeUSD_not?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeUSD_not_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
}

export enum V3arbitrum_PoolDayData_OrderBy {
  Close = 'close',
  Date = 'date',
  FeesUsd = 'feesUSD',
  High = 'high',
  Id = 'id',
  Liquidity = 'liquidity',
  Low = 'low',
  Open = 'open',
  Pool = 'pool',
  SqrtPrice = 'sqrtPrice',
  Tick = 'tick',
  Token0Price = 'token0Price',
  Token1Price = 'token1Price',
  TvlUsd = 'tvlUSD',
  TxCount = 'txCount',
  VolumeToken0 = 'volumeToken0',
  VolumeToken1 = 'volumeToken1',
  VolumeUsd = 'volumeUSD',
}

export type V3arbitrum_PoolHourData = {
  __typename?: 'v3arbitrum_PoolHourData'
  close: Scalars['v3arbitrum_BigDecimal']
  feesUSD: Scalars['v3arbitrum_BigDecimal']
  high: Scalars['v3arbitrum_BigDecimal']
  id: Scalars['ID']
  liquidity: Scalars['v3arbitrum_BigInt']
  low: Scalars['v3arbitrum_BigDecimal']
  open: Scalars['v3arbitrum_BigDecimal']
  periodStartUnix: Scalars['Int']
  pool: V3arbitrum_Pool
  sqrtPrice: Scalars['v3arbitrum_BigInt']
  tick?: Maybe<Scalars['v3arbitrum_BigInt']>
  token0Price: Scalars['v3arbitrum_BigDecimal']
  token1Price: Scalars['v3arbitrum_BigDecimal']
  tvlUSD: Scalars['v3arbitrum_BigDecimal']
  txCount: Scalars['v3arbitrum_BigInt']
  volumeToken0: Scalars['v3arbitrum_BigDecimal']
  volumeToken1: Scalars['v3arbitrum_BigDecimal']
  volumeUSD: Scalars['v3arbitrum_BigDecimal']
}

export type V3arbitrum_PoolHourData_Filter = {
  close?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  close_gt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  close_gte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  close_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  close_lt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  close_lte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  close_not?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  close_not_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  feesUSD?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  feesUSD_gt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  feesUSD_gte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  feesUSD_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  feesUSD_lt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  feesUSD_lte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  feesUSD_not?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  feesUSD_not_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  high?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  high_gt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  high_gte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  high_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  high_lt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  high_lte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  high_not?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  high_not_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  id?: Maybe<Scalars['ID']>
  id_gt?: Maybe<Scalars['ID']>
  id_gte?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  id_lt?: Maybe<Scalars['ID']>
  id_lte?: Maybe<Scalars['ID']>
  id_not?: Maybe<Scalars['ID']>
  id_not_in?: Maybe<Array<Scalars['ID']>>
  liquidity?: Maybe<Scalars['v3arbitrum_BigInt']>
  liquidity_gt?: Maybe<Scalars['v3arbitrum_BigInt']>
  liquidity_gte?: Maybe<Scalars['v3arbitrum_BigInt']>
  liquidity_in?: Maybe<Array<Scalars['v3arbitrum_BigInt']>>
  liquidity_lt?: Maybe<Scalars['v3arbitrum_BigInt']>
  liquidity_lte?: Maybe<Scalars['v3arbitrum_BigInt']>
  liquidity_not?: Maybe<Scalars['v3arbitrum_BigInt']>
  liquidity_not_in?: Maybe<Array<Scalars['v3arbitrum_BigInt']>>
  low?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  low_gt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  low_gte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  low_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  low_lt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  low_lte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  low_not?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  low_not_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  open?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  open_gt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  open_gte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  open_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  open_lt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  open_lte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  open_not?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  open_not_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  periodStartUnix?: Maybe<Scalars['Int']>
  periodStartUnix_gt?: Maybe<Scalars['Int']>
  periodStartUnix_gte?: Maybe<Scalars['Int']>
  periodStartUnix_in?: Maybe<Array<Scalars['Int']>>
  periodStartUnix_lt?: Maybe<Scalars['Int']>
  periodStartUnix_lte?: Maybe<Scalars['Int']>
  periodStartUnix_not?: Maybe<Scalars['Int']>
  periodStartUnix_not_in?: Maybe<Array<Scalars['Int']>>
  pool?: Maybe<Scalars['String']>
  pool_contains?: Maybe<Scalars['String']>
  pool_ends_with?: Maybe<Scalars['String']>
  pool_gt?: Maybe<Scalars['String']>
  pool_gte?: Maybe<Scalars['String']>
  pool_in?: Maybe<Array<Scalars['String']>>
  pool_lt?: Maybe<Scalars['String']>
  pool_lte?: Maybe<Scalars['String']>
  pool_not?: Maybe<Scalars['String']>
  pool_not_contains?: Maybe<Scalars['String']>
  pool_not_ends_with?: Maybe<Scalars['String']>
  pool_not_in?: Maybe<Array<Scalars['String']>>
  pool_not_starts_with?: Maybe<Scalars['String']>
  pool_starts_with?: Maybe<Scalars['String']>
  sqrtPrice?: Maybe<Scalars['v3arbitrum_BigInt']>
  sqrtPrice_gt?: Maybe<Scalars['v3arbitrum_BigInt']>
  sqrtPrice_gte?: Maybe<Scalars['v3arbitrum_BigInt']>
  sqrtPrice_in?: Maybe<Array<Scalars['v3arbitrum_BigInt']>>
  sqrtPrice_lt?: Maybe<Scalars['v3arbitrum_BigInt']>
  sqrtPrice_lte?: Maybe<Scalars['v3arbitrum_BigInt']>
  sqrtPrice_not?: Maybe<Scalars['v3arbitrum_BigInt']>
  sqrtPrice_not_in?: Maybe<Array<Scalars['v3arbitrum_BigInt']>>
  tick?: Maybe<Scalars['v3arbitrum_BigInt']>
  tick_gt?: Maybe<Scalars['v3arbitrum_BigInt']>
  tick_gte?: Maybe<Scalars['v3arbitrum_BigInt']>
  tick_in?: Maybe<Array<Scalars['v3arbitrum_BigInt']>>
  tick_lt?: Maybe<Scalars['v3arbitrum_BigInt']>
  tick_lte?: Maybe<Scalars['v3arbitrum_BigInt']>
  tick_not?: Maybe<Scalars['v3arbitrum_BigInt']>
  tick_not_in?: Maybe<Array<Scalars['v3arbitrum_BigInt']>>
  token0Price?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  token0Price_gt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  token0Price_gte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  token0Price_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  token0Price_lt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  token0Price_lte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  token0Price_not?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  token0Price_not_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  token1Price?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  token1Price_gt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  token1Price_gte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  token1Price_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  token1Price_lt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  token1Price_lte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  token1Price_not?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  token1Price_not_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  tvlUSD?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  tvlUSD_gt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  tvlUSD_gte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  tvlUSD_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  tvlUSD_lt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  tvlUSD_lte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  tvlUSD_not?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  tvlUSD_not_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  txCount?: Maybe<Scalars['v3arbitrum_BigInt']>
  txCount_gt?: Maybe<Scalars['v3arbitrum_BigInt']>
  txCount_gte?: Maybe<Scalars['v3arbitrum_BigInt']>
  txCount_in?: Maybe<Array<Scalars['v3arbitrum_BigInt']>>
  txCount_lt?: Maybe<Scalars['v3arbitrum_BigInt']>
  txCount_lte?: Maybe<Scalars['v3arbitrum_BigInt']>
  txCount_not?: Maybe<Scalars['v3arbitrum_BigInt']>
  txCount_not_in?: Maybe<Array<Scalars['v3arbitrum_BigInt']>>
  volumeToken0?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeToken0_gt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeToken0_gte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeToken0_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  volumeToken0_lt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeToken0_lte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeToken0_not?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeToken0_not_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  volumeToken1?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeToken1_gt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeToken1_gte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeToken1_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  volumeToken1_lt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeToken1_lte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeToken1_not?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeToken1_not_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  volumeUSD?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeUSD_gt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeUSD_gte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeUSD_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  volumeUSD_lt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeUSD_lte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeUSD_not?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeUSD_not_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
}

export enum V3arbitrum_PoolHourData_OrderBy {
  Close = 'close',
  FeesUsd = 'feesUSD',
  High = 'high',
  Id = 'id',
  Liquidity = 'liquidity',
  Low = 'low',
  Open = 'open',
  PeriodStartUnix = 'periodStartUnix',
  Pool = 'pool',
  SqrtPrice = 'sqrtPrice',
  Tick = 'tick',
  Token0Price = 'token0Price',
  Token1Price = 'token1Price',
  TvlUsd = 'tvlUSD',
  TxCount = 'txCount',
  VolumeToken0 = 'volumeToken0',
  VolumeToken1 = 'volumeToken1',
  VolumeUsd = 'volumeUSD',
}

export type V3arbitrum_Pool_Filter = {
  collectedFeesToken0?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  collectedFeesToken0_gt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  collectedFeesToken0_gte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  collectedFeesToken0_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  collectedFeesToken0_lt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  collectedFeesToken0_lte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  collectedFeesToken0_not?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  collectedFeesToken0_not_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  collectedFeesToken1?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  collectedFeesToken1_gt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  collectedFeesToken1_gte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  collectedFeesToken1_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  collectedFeesToken1_lt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  collectedFeesToken1_lte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  collectedFeesToken1_not?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  collectedFeesToken1_not_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  collectedFeesUSD?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  collectedFeesUSD_gt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  collectedFeesUSD_gte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  collectedFeesUSD_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  collectedFeesUSD_lt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  collectedFeesUSD_lte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  collectedFeesUSD_not?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  collectedFeesUSD_not_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  createdAtBlockNumber?: Maybe<Scalars['v3arbitrum_BigInt']>
  createdAtBlockNumber_gt?: Maybe<Scalars['v3arbitrum_BigInt']>
  createdAtBlockNumber_gte?: Maybe<Scalars['v3arbitrum_BigInt']>
  createdAtBlockNumber_in?: Maybe<Array<Scalars['v3arbitrum_BigInt']>>
  createdAtBlockNumber_lt?: Maybe<Scalars['v3arbitrum_BigInt']>
  createdAtBlockNumber_lte?: Maybe<Scalars['v3arbitrum_BigInt']>
  createdAtBlockNumber_not?: Maybe<Scalars['v3arbitrum_BigInt']>
  createdAtBlockNumber_not_in?: Maybe<Array<Scalars['v3arbitrum_BigInt']>>
  createdAtTimestamp?: Maybe<Scalars['v3arbitrum_BigInt']>
  createdAtTimestamp_gt?: Maybe<Scalars['v3arbitrum_BigInt']>
  createdAtTimestamp_gte?: Maybe<Scalars['v3arbitrum_BigInt']>
  createdAtTimestamp_in?: Maybe<Array<Scalars['v3arbitrum_BigInt']>>
  createdAtTimestamp_lt?: Maybe<Scalars['v3arbitrum_BigInt']>
  createdAtTimestamp_lte?: Maybe<Scalars['v3arbitrum_BigInt']>
  createdAtTimestamp_not?: Maybe<Scalars['v3arbitrum_BigInt']>
  createdAtTimestamp_not_in?: Maybe<Array<Scalars['v3arbitrum_BigInt']>>
  feeTier?: Maybe<Scalars['v3arbitrum_BigInt']>
  feeTier_gt?: Maybe<Scalars['v3arbitrum_BigInt']>
  feeTier_gte?: Maybe<Scalars['v3arbitrum_BigInt']>
  feeTier_in?: Maybe<Array<Scalars['v3arbitrum_BigInt']>>
  feeTier_lt?: Maybe<Scalars['v3arbitrum_BigInt']>
  feeTier_lte?: Maybe<Scalars['v3arbitrum_BigInt']>
  feeTier_not?: Maybe<Scalars['v3arbitrum_BigInt']>
  feeTier_not_in?: Maybe<Array<Scalars['v3arbitrum_BigInt']>>
  feesUSD?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  feesUSD_gt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  feesUSD_gte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  feesUSD_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  feesUSD_lt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  feesUSD_lte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  feesUSD_not?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  feesUSD_not_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  id?: Maybe<Scalars['ID']>
  id_gt?: Maybe<Scalars['ID']>
  id_gte?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  id_lt?: Maybe<Scalars['ID']>
  id_lte?: Maybe<Scalars['ID']>
  id_not?: Maybe<Scalars['ID']>
  id_not_in?: Maybe<Array<Scalars['ID']>>
  liquidity?: Maybe<Scalars['v3arbitrum_BigInt']>
  liquidityProviderCount?: Maybe<Scalars['v3arbitrum_BigInt']>
  liquidityProviderCount_gt?: Maybe<Scalars['v3arbitrum_BigInt']>
  liquidityProviderCount_gte?: Maybe<Scalars['v3arbitrum_BigInt']>
  liquidityProviderCount_in?: Maybe<Array<Scalars['v3arbitrum_BigInt']>>
  liquidityProviderCount_lt?: Maybe<Scalars['v3arbitrum_BigInt']>
  liquidityProviderCount_lte?: Maybe<Scalars['v3arbitrum_BigInt']>
  liquidityProviderCount_not?: Maybe<Scalars['v3arbitrum_BigInt']>
  liquidityProviderCount_not_in?: Maybe<Array<Scalars['v3arbitrum_BigInt']>>
  liquidity_gt?: Maybe<Scalars['v3arbitrum_BigInt']>
  liquidity_gte?: Maybe<Scalars['v3arbitrum_BigInt']>
  liquidity_in?: Maybe<Array<Scalars['v3arbitrum_BigInt']>>
  liquidity_lt?: Maybe<Scalars['v3arbitrum_BigInt']>
  liquidity_lte?: Maybe<Scalars['v3arbitrum_BigInt']>
  liquidity_not?: Maybe<Scalars['v3arbitrum_BigInt']>
  liquidity_not_in?: Maybe<Array<Scalars['v3arbitrum_BigInt']>>
  observationIndex?: Maybe<Scalars['v3arbitrum_BigInt']>
  observationIndex_gt?: Maybe<Scalars['v3arbitrum_BigInt']>
  observationIndex_gte?: Maybe<Scalars['v3arbitrum_BigInt']>
  observationIndex_in?: Maybe<Array<Scalars['v3arbitrum_BigInt']>>
  observationIndex_lt?: Maybe<Scalars['v3arbitrum_BigInt']>
  observationIndex_lte?: Maybe<Scalars['v3arbitrum_BigInt']>
  observationIndex_not?: Maybe<Scalars['v3arbitrum_BigInt']>
  observationIndex_not_in?: Maybe<Array<Scalars['v3arbitrum_BigInt']>>
  sqrtPrice?: Maybe<Scalars['v3arbitrum_BigInt']>
  sqrtPrice_gt?: Maybe<Scalars['v3arbitrum_BigInt']>
  sqrtPrice_gte?: Maybe<Scalars['v3arbitrum_BigInt']>
  sqrtPrice_in?: Maybe<Array<Scalars['v3arbitrum_BigInt']>>
  sqrtPrice_lt?: Maybe<Scalars['v3arbitrum_BigInt']>
  sqrtPrice_lte?: Maybe<Scalars['v3arbitrum_BigInt']>
  sqrtPrice_not?: Maybe<Scalars['v3arbitrum_BigInt']>
  sqrtPrice_not_in?: Maybe<Array<Scalars['v3arbitrum_BigInt']>>
  tick?: Maybe<Scalars['v3arbitrum_BigInt']>
  tick_gt?: Maybe<Scalars['v3arbitrum_BigInt']>
  tick_gte?: Maybe<Scalars['v3arbitrum_BigInt']>
  tick_in?: Maybe<Array<Scalars['v3arbitrum_BigInt']>>
  tick_lt?: Maybe<Scalars['v3arbitrum_BigInt']>
  tick_lte?: Maybe<Scalars['v3arbitrum_BigInt']>
  tick_not?: Maybe<Scalars['v3arbitrum_BigInt']>
  tick_not_in?: Maybe<Array<Scalars['v3arbitrum_BigInt']>>
  token0?: Maybe<Scalars['String']>
  token0Price?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  token0Price_gt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  token0Price_gte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  token0Price_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  token0Price_lt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  token0Price_lte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  token0Price_not?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  token0Price_not_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  token0_contains?: Maybe<Scalars['String']>
  token0_ends_with?: Maybe<Scalars['String']>
  token0_gt?: Maybe<Scalars['String']>
  token0_gte?: Maybe<Scalars['String']>
  token0_in?: Maybe<Array<Scalars['String']>>
  token0_lt?: Maybe<Scalars['String']>
  token0_lte?: Maybe<Scalars['String']>
  token0_not?: Maybe<Scalars['String']>
  token0_not_contains?: Maybe<Scalars['String']>
  token0_not_ends_with?: Maybe<Scalars['String']>
  token0_not_in?: Maybe<Array<Scalars['String']>>
  token0_not_starts_with?: Maybe<Scalars['String']>
  token0_starts_with?: Maybe<Scalars['String']>
  token1?: Maybe<Scalars['String']>
  token1Price?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  token1Price_gt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  token1Price_gte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  token1Price_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  token1Price_lt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  token1Price_lte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  token1Price_not?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  token1Price_not_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  token1_contains?: Maybe<Scalars['String']>
  token1_ends_with?: Maybe<Scalars['String']>
  token1_gt?: Maybe<Scalars['String']>
  token1_gte?: Maybe<Scalars['String']>
  token1_in?: Maybe<Array<Scalars['String']>>
  token1_lt?: Maybe<Scalars['String']>
  token1_lte?: Maybe<Scalars['String']>
  token1_not?: Maybe<Scalars['String']>
  token1_not_contains?: Maybe<Scalars['String']>
  token1_not_ends_with?: Maybe<Scalars['String']>
  token1_not_in?: Maybe<Array<Scalars['String']>>
  token1_not_starts_with?: Maybe<Scalars['String']>
  token1_starts_with?: Maybe<Scalars['String']>
  totalValueLockedETH?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  totalValueLockedETH_gt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  totalValueLockedETH_gte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  totalValueLockedETH_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  totalValueLockedETH_lt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  totalValueLockedETH_lte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  totalValueLockedETH_not?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  totalValueLockedETH_not_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  totalValueLockedToken0?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  totalValueLockedToken0_gt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  totalValueLockedToken0_gte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  totalValueLockedToken0_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  totalValueLockedToken0_lt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  totalValueLockedToken0_lte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  totalValueLockedToken0_not?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  totalValueLockedToken0_not_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  totalValueLockedToken1?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  totalValueLockedToken1_gt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  totalValueLockedToken1_gte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  totalValueLockedToken1_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  totalValueLockedToken1_lt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  totalValueLockedToken1_lte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  totalValueLockedToken1_not?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  totalValueLockedToken1_not_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  totalValueLockedUSD?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  totalValueLockedUSDUntracked?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  totalValueLockedUSDUntracked_gt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  totalValueLockedUSDUntracked_gte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  totalValueLockedUSDUntracked_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  totalValueLockedUSDUntracked_lt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  totalValueLockedUSDUntracked_lte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  totalValueLockedUSDUntracked_not?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  totalValueLockedUSDUntracked_not_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  totalValueLockedUSD_gt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  totalValueLockedUSD_gte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  totalValueLockedUSD_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  totalValueLockedUSD_lt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  totalValueLockedUSD_lte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  totalValueLockedUSD_not?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  totalValueLockedUSD_not_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  txCount?: Maybe<Scalars['v3arbitrum_BigInt']>
  txCount_gt?: Maybe<Scalars['v3arbitrum_BigInt']>
  txCount_gte?: Maybe<Scalars['v3arbitrum_BigInt']>
  txCount_in?: Maybe<Array<Scalars['v3arbitrum_BigInt']>>
  txCount_lt?: Maybe<Scalars['v3arbitrum_BigInt']>
  txCount_lte?: Maybe<Scalars['v3arbitrum_BigInt']>
  txCount_not?: Maybe<Scalars['v3arbitrum_BigInt']>
  txCount_not_in?: Maybe<Array<Scalars['v3arbitrum_BigInt']>>
  untrackedVolumeUSD?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  untrackedVolumeUSD_gt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  untrackedVolumeUSD_gte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  untrackedVolumeUSD_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  untrackedVolumeUSD_lt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  untrackedVolumeUSD_lte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  untrackedVolumeUSD_not?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  untrackedVolumeUSD_not_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  volumeToken0?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeToken0_gt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeToken0_gte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeToken0_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  volumeToken0_lt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeToken0_lte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeToken0_not?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeToken0_not_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  volumeToken1?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeToken1_gt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeToken1_gte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeToken1_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  volumeToken1_lt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeToken1_lte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeToken1_not?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeToken1_not_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  volumeUSD?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeUSD_gt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeUSD_gte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeUSD_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  volumeUSD_lt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeUSD_lte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeUSD_not?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeUSD_not_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
}

export enum V3arbitrum_Pool_OrderBy {
  Burns = 'burns',
  CollectedFeesToken0 = 'collectedFeesToken0',
  CollectedFeesToken1 = 'collectedFeesToken1',
  CollectedFeesUsd = 'collectedFeesUSD',
  Collects = 'collects',
  CreatedAtBlockNumber = 'createdAtBlockNumber',
  CreatedAtTimestamp = 'createdAtTimestamp',
  FeeTier = 'feeTier',
  FeesUsd = 'feesUSD',
  Id = 'id',
  Liquidity = 'liquidity',
  LiquidityProviderCount = 'liquidityProviderCount',
  Mints = 'mints',
  ObservationIndex = 'observationIndex',
  PoolDayData = 'poolDayData',
  PoolHourData = 'poolHourData',
  SqrtPrice = 'sqrtPrice',
  Swaps = 'swaps',
  Tick = 'tick',
  Ticks = 'ticks',
  Token0 = 'token0',
  Token0Price = 'token0Price',
  Token1 = 'token1',
  Token1Price = 'token1Price',
  TotalValueLockedEth = 'totalValueLockedETH',
  TotalValueLockedToken0 = 'totalValueLockedToken0',
  TotalValueLockedToken1 = 'totalValueLockedToken1',
  TotalValueLockedUsd = 'totalValueLockedUSD',
  TotalValueLockedUsdUntracked = 'totalValueLockedUSDUntracked',
  TxCount = 'txCount',
  UntrackedVolumeUsd = 'untrackedVolumeUSD',
  VolumeToken0 = 'volumeToken0',
  VolumeToken1 = 'volumeToken1',
  VolumeUsd = 'volumeUSD',
}

export type V3arbitrum_Swap = {
  __typename?: 'v3arbitrum_Swap'
  amount0: Scalars['v3arbitrum_BigDecimal']
  amount1: Scalars['v3arbitrum_BigDecimal']
  amountUSD: Scalars['v3arbitrum_BigDecimal']
  id: Scalars['ID']
  logIndex?: Maybe<Scalars['v3arbitrum_BigInt']>
  origin: Scalars['v3arbitrum_Bytes']
  pool: V3arbitrum_Pool
  recipient: Scalars['v3arbitrum_Bytes']
  sender: Scalars['v3arbitrum_Bytes']
  sqrtPriceX96: Scalars['v3arbitrum_BigInt']
  tick: Scalars['v3arbitrum_BigInt']
  timestamp: Scalars['v3arbitrum_BigInt']
  token0: V3arbitrum_Token
  token1: V3arbitrum_Token
  transaction: V3arbitrum_Transaction
}

export type V3arbitrum_Swap_Filter = {
  amount0?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  amount0_gt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  amount0_gte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  amount0_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  amount0_lt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  amount0_lte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  amount0_not?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  amount0_not_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  amount1?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  amount1_gt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  amount1_gte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  amount1_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  amount1_lt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  amount1_lte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  amount1_not?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  amount1_not_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  amountUSD?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  amountUSD_gt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  amountUSD_gte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  amountUSD_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  amountUSD_lt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  amountUSD_lte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  amountUSD_not?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  amountUSD_not_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  id?: Maybe<Scalars['ID']>
  id_gt?: Maybe<Scalars['ID']>
  id_gte?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  id_lt?: Maybe<Scalars['ID']>
  id_lte?: Maybe<Scalars['ID']>
  id_not?: Maybe<Scalars['ID']>
  id_not_in?: Maybe<Array<Scalars['ID']>>
  logIndex?: Maybe<Scalars['v3arbitrum_BigInt']>
  logIndex_gt?: Maybe<Scalars['v3arbitrum_BigInt']>
  logIndex_gte?: Maybe<Scalars['v3arbitrum_BigInt']>
  logIndex_in?: Maybe<Array<Scalars['v3arbitrum_BigInt']>>
  logIndex_lt?: Maybe<Scalars['v3arbitrum_BigInt']>
  logIndex_lte?: Maybe<Scalars['v3arbitrum_BigInt']>
  logIndex_not?: Maybe<Scalars['v3arbitrum_BigInt']>
  logIndex_not_in?: Maybe<Array<Scalars['v3arbitrum_BigInt']>>
  origin?: Maybe<Scalars['v3arbitrum_Bytes']>
  origin_contains?: Maybe<Scalars['v3arbitrum_Bytes']>
  origin_in?: Maybe<Array<Scalars['v3arbitrum_Bytes']>>
  origin_not?: Maybe<Scalars['v3arbitrum_Bytes']>
  origin_not_contains?: Maybe<Scalars['v3arbitrum_Bytes']>
  origin_not_in?: Maybe<Array<Scalars['v3arbitrum_Bytes']>>
  pool?: Maybe<Scalars['String']>
  pool_contains?: Maybe<Scalars['String']>
  pool_ends_with?: Maybe<Scalars['String']>
  pool_gt?: Maybe<Scalars['String']>
  pool_gte?: Maybe<Scalars['String']>
  pool_in?: Maybe<Array<Scalars['String']>>
  pool_lt?: Maybe<Scalars['String']>
  pool_lte?: Maybe<Scalars['String']>
  pool_not?: Maybe<Scalars['String']>
  pool_not_contains?: Maybe<Scalars['String']>
  pool_not_ends_with?: Maybe<Scalars['String']>
  pool_not_in?: Maybe<Array<Scalars['String']>>
  pool_not_starts_with?: Maybe<Scalars['String']>
  pool_starts_with?: Maybe<Scalars['String']>
  recipient?: Maybe<Scalars['v3arbitrum_Bytes']>
  recipient_contains?: Maybe<Scalars['v3arbitrum_Bytes']>
  recipient_in?: Maybe<Array<Scalars['v3arbitrum_Bytes']>>
  recipient_not?: Maybe<Scalars['v3arbitrum_Bytes']>
  recipient_not_contains?: Maybe<Scalars['v3arbitrum_Bytes']>
  recipient_not_in?: Maybe<Array<Scalars['v3arbitrum_Bytes']>>
  sender?: Maybe<Scalars['v3arbitrum_Bytes']>
  sender_contains?: Maybe<Scalars['v3arbitrum_Bytes']>
  sender_in?: Maybe<Array<Scalars['v3arbitrum_Bytes']>>
  sender_not?: Maybe<Scalars['v3arbitrum_Bytes']>
  sender_not_contains?: Maybe<Scalars['v3arbitrum_Bytes']>
  sender_not_in?: Maybe<Array<Scalars['v3arbitrum_Bytes']>>
  sqrtPriceX96?: Maybe<Scalars['v3arbitrum_BigInt']>
  sqrtPriceX96_gt?: Maybe<Scalars['v3arbitrum_BigInt']>
  sqrtPriceX96_gte?: Maybe<Scalars['v3arbitrum_BigInt']>
  sqrtPriceX96_in?: Maybe<Array<Scalars['v3arbitrum_BigInt']>>
  sqrtPriceX96_lt?: Maybe<Scalars['v3arbitrum_BigInt']>
  sqrtPriceX96_lte?: Maybe<Scalars['v3arbitrum_BigInt']>
  sqrtPriceX96_not?: Maybe<Scalars['v3arbitrum_BigInt']>
  sqrtPriceX96_not_in?: Maybe<Array<Scalars['v3arbitrum_BigInt']>>
  tick?: Maybe<Scalars['v3arbitrum_BigInt']>
  tick_gt?: Maybe<Scalars['v3arbitrum_BigInt']>
  tick_gte?: Maybe<Scalars['v3arbitrum_BigInt']>
  tick_in?: Maybe<Array<Scalars['v3arbitrum_BigInt']>>
  tick_lt?: Maybe<Scalars['v3arbitrum_BigInt']>
  tick_lte?: Maybe<Scalars['v3arbitrum_BigInt']>
  tick_not?: Maybe<Scalars['v3arbitrum_BigInt']>
  tick_not_in?: Maybe<Array<Scalars['v3arbitrum_BigInt']>>
  timestamp?: Maybe<Scalars['v3arbitrum_BigInt']>
  timestamp_gt?: Maybe<Scalars['v3arbitrum_BigInt']>
  timestamp_gte?: Maybe<Scalars['v3arbitrum_BigInt']>
  timestamp_in?: Maybe<Array<Scalars['v3arbitrum_BigInt']>>
  timestamp_lt?: Maybe<Scalars['v3arbitrum_BigInt']>
  timestamp_lte?: Maybe<Scalars['v3arbitrum_BigInt']>
  timestamp_not?: Maybe<Scalars['v3arbitrum_BigInt']>
  timestamp_not_in?: Maybe<Array<Scalars['v3arbitrum_BigInt']>>
  token0?: Maybe<Scalars['String']>
  token0_contains?: Maybe<Scalars['String']>
  token0_ends_with?: Maybe<Scalars['String']>
  token0_gt?: Maybe<Scalars['String']>
  token0_gte?: Maybe<Scalars['String']>
  token0_in?: Maybe<Array<Scalars['String']>>
  token0_lt?: Maybe<Scalars['String']>
  token0_lte?: Maybe<Scalars['String']>
  token0_not?: Maybe<Scalars['String']>
  token0_not_contains?: Maybe<Scalars['String']>
  token0_not_ends_with?: Maybe<Scalars['String']>
  token0_not_in?: Maybe<Array<Scalars['String']>>
  token0_not_starts_with?: Maybe<Scalars['String']>
  token0_starts_with?: Maybe<Scalars['String']>
  token1?: Maybe<Scalars['String']>
  token1_contains?: Maybe<Scalars['String']>
  token1_ends_with?: Maybe<Scalars['String']>
  token1_gt?: Maybe<Scalars['String']>
  token1_gte?: Maybe<Scalars['String']>
  token1_in?: Maybe<Array<Scalars['String']>>
  token1_lt?: Maybe<Scalars['String']>
  token1_lte?: Maybe<Scalars['String']>
  token1_not?: Maybe<Scalars['String']>
  token1_not_contains?: Maybe<Scalars['String']>
  token1_not_ends_with?: Maybe<Scalars['String']>
  token1_not_in?: Maybe<Array<Scalars['String']>>
  token1_not_starts_with?: Maybe<Scalars['String']>
  token1_starts_with?: Maybe<Scalars['String']>
  transaction?: Maybe<Scalars['String']>
  transaction_contains?: Maybe<Scalars['String']>
  transaction_ends_with?: Maybe<Scalars['String']>
  transaction_gt?: Maybe<Scalars['String']>
  transaction_gte?: Maybe<Scalars['String']>
  transaction_in?: Maybe<Array<Scalars['String']>>
  transaction_lt?: Maybe<Scalars['String']>
  transaction_lte?: Maybe<Scalars['String']>
  transaction_not?: Maybe<Scalars['String']>
  transaction_not_contains?: Maybe<Scalars['String']>
  transaction_not_ends_with?: Maybe<Scalars['String']>
  transaction_not_in?: Maybe<Array<Scalars['String']>>
  transaction_not_starts_with?: Maybe<Scalars['String']>
  transaction_starts_with?: Maybe<Scalars['String']>
}

export enum V3arbitrum_Swap_OrderBy {
  Amount0 = 'amount0',
  Amount1 = 'amount1',
  AmountUsd = 'amountUSD',
  Id = 'id',
  LogIndex = 'logIndex',
  Origin = 'origin',
  Pool = 'pool',
  Recipient = 'recipient',
  Sender = 'sender',
  SqrtPriceX96 = 'sqrtPriceX96',
  Tick = 'tick',
  Timestamp = 'timestamp',
  Token0 = 'token0',
  Token1 = 'token1',
  Transaction = 'transaction',
}

export type V3arbitrum_Tick = {
  __typename?: 'v3arbitrum_Tick'
  collectedFeesToken0: Scalars['v3arbitrum_BigDecimal']
  collectedFeesToken1: Scalars['v3arbitrum_BigDecimal']
  collectedFeesUSD: Scalars['v3arbitrum_BigDecimal']
  createdAtBlockNumber: Scalars['v3arbitrum_BigInt']
  createdAtTimestamp: Scalars['v3arbitrum_BigInt']
  feesUSD: Scalars['v3arbitrum_BigDecimal']
  id: Scalars['ID']
  liquidityGross: Scalars['v3arbitrum_BigInt']
  liquidityNet: Scalars['v3arbitrum_BigInt']
  liquidityProviderCount: Scalars['v3arbitrum_BigInt']
  pool: V3arbitrum_Pool
  poolAddress?: Maybe<Scalars['String']>
  price0: Scalars['v3arbitrum_BigDecimal']
  price1: Scalars['v3arbitrum_BigDecimal']
  tickIdx: Scalars['v3arbitrum_BigInt']
  untrackedVolumeUSD: Scalars['v3arbitrum_BigDecimal']
  volumeToken0: Scalars['v3arbitrum_BigDecimal']
  volumeToken1: Scalars['v3arbitrum_BigDecimal']
  volumeUSD: Scalars['v3arbitrum_BigDecimal']
}

export type V3arbitrum_TickDayData = {
  __typename?: 'v3arbitrum_TickDayData'
  date: Scalars['Int']
  feesUSD: Scalars['v3arbitrum_BigDecimal']
  id: Scalars['ID']
  liquidityGross: Scalars['v3arbitrum_BigInt']
  liquidityNet: Scalars['v3arbitrum_BigInt']
  pool: V3arbitrum_Pool
  tick: V3arbitrum_Tick
  volumeToken0: Scalars['v3arbitrum_BigDecimal']
  volumeToken1: Scalars['v3arbitrum_BigDecimal']
  volumeUSD: Scalars['v3arbitrum_BigDecimal']
}

export type V3arbitrum_TickDayData_Filter = {
  date?: Maybe<Scalars['Int']>
  date_gt?: Maybe<Scalars['Int']>
  date_gte?: Maybe<Scalars['Int']>
  date_in?: Maybe<Array<Scalars['Int']>>
  date_lt?: Maybe<Scalars['Int']>
  date_lte?: Maybe<Scalars['Int']>
  date_not?: Maybe<Scalars['Int']>
  date_not_in?: Maybe<Array<Scalars['Int']>>
  feesUSD?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  feesUSD_gt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  feesUSD_gte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  feesUSD_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  feesUSD_lt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  feesUSD_lte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  feesUSD_not?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  feesUSD_not_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  id?: Maybe<Scalars['ID']>
  id_gt?: Maybe<Scalars['ID']>
  id_gte?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  id_lt?: Maybe<Scalars['ID']>
  id_lte?: Maybe<Scalars['ID']>
  id_not?: Maybe<Scalars['ID']>
  id_not_in?: Maybe<Array<Scalars['ID']>>
  liquidityGross?: Maybe<Scalars['v3arbitrum_BigInt']>
  liquidityGross_gt?: Maybe<Scalars['v3arbitrum_BigInt']>
  liquidityGross_gte?: Maybe<Scalars['v3arbitrum_BigInt']>
  liquidityGross_in?: Maybe<Array<Scalars['v3arbitrum_BigInt']>>
  liquidityGross_lt?: Maybe<Scalars['v3arbitrum_BigInt']>
  liquidityGross_lte?: Maybe<Scalars['v3arbitrum_BigInt']>
  liquidityGross_not?: Maybe<Scalars['v3arbitrum_BigInt']>
  liquidityGross_not_in?: Maybe<Array<Scalars['v3arbitrum_BigInt']>>
  liquidityNet?: Maybe<Scalars['v3arbitrum_BigInt']>
  liquidityNet_gt?: Maybe<Scalars['v3arbitrum_BigInt']>
  liquidityNet_gte?: Maybe<Scalars['v3arbitrum_BigInt']>
  liquidityNet_in?: Maybe<Array<Scalars['v3arbitrum_BigInt']>>
  liquidityNet_lt?: Maybe<Scalars['v3arbitrum_BigInt']>
  liquidityNet_lte?: Maybe<Scalars['v3arbitrum_BigInt']>
  liquidityNet_not?: Maybe<Scalars['v3arbitrum_BigInt']>
  liquidityNet_not_in?: Maybe<Array<Scalars['v3arbitrum_BigInt']>>
  pool?: Maybe<Scalars['String']>
  pool_contains?: Maybe<Scalars['String']>
  pool_ends_with?: Maybe<Scalars['String']>
  pool_gt?: Maybe<Scalars['String']>
  pool_gte?: Maybe<Scalars['String']>
  pool_in?: Maybe<Array<Scalars['String']>>
  pool_lt?: Maybe<Scalars['String']>
  pool_lte?: Maybe<Scalars['String']>
  pool_not?: Maybe<Scalars['String']>
  pool_not_contains?: Maybe<Scalars['String']>
  pool_not_ends_with?: Maybe<Scalars['String']>
  pool_not_in?: Maybe<Array<Scalars['String']>>
  pool_not_starts_with?: Maybe<Scalars['String']>
  pool_starts_with?: Maybe<Scalars['String']>
  tick?: Maybe<Scalars['String']>
  tick_contains?: Maybe<Scalars['String']>
  tick_ends_with?: Maybe<Scalars['String']>
  tick_gt?: Maybe<Scalars['String']>
  tick_gte?: Maybe<Scalars['String']>
  tick_in?: Maybe<Array<Scalars['String']>>
  tick_lt?: Maybe<Scalars['String']>
  tick_lte?: Maybe<Scalars['String']>
  tick_not?: Maybe<Scalars['String']>
  tick_not_contains?: Maybe<Scalars['String']>
  tick_not_ends_with?: Maybe<Scalars['String']>
  tick_not_in?: Maybe<Array<Scalars['String']>>
  tick_not_starts_with?: Maybe<Scalars['String']>
  tick_starts_with?: Maybe<Scalars['String']>
  volumeToken0?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeToken0_gt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeToken0_gte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeToken0_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  volumeToken0_lt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeToken0_lte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeToken0_not?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeToken0_not_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  volumeToken1?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeToken1_gt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeToken1_gte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeToken1_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  volumeToken1_lt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeToken1_lte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeToken1_not?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeToken1_not_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  volumeUSD?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeUSD_gt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeUSD_gte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeUSD_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  volumeUSD_lt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeUSD_lte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeUSD_not?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeUSD_not_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
}

export enum V3arbitrum_TickDayData_OrderBy {
  Date = 'date',
  FeesUsd = 'feesUSD',
  Id = 'id',
  LiquidityGross = 'liquidityGross',
  LiquidityNet = 'liquidityNet',
  Pool = 'pool',
  Tick = 'tick',
  VolumeToken0 = 'volumeToken0',
  VolumeToken1 = 'volumeToken1',
  VolumeUsd = 'volumeUSD',
}

export type V3arbitrum_TickHourData = {
  __typename?: 'v3arbitrum_TickHourData'
  feesUSD: Scalars['v3arbitrum_BigDecimal']
  id: Scalars['ID']
  liquidityGross: Scalars['v3arbitrum_BigInt']
  liquidityNet: Scalars['v3arbitrum_BigInt']
  periodStartUnix: Scalars['Int']
  pool: V3arbitrum_Pool
  tick: V3arbitrum_Tick
  volumeToken0: Scalars['v3arbitrum_BigDecimal']
  volumeToken1: Scalars['v3arbitrum_BigDecimal']
  volumeUSD: Scalars['v3arbitrum_BigDecimal']
}

export type V3arbitrum_TickHourData_Filter = {
  feesUSD?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  feesUSD_gt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  feesUSD_gte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  feesUSD_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  feesUSD_lt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  feesUSD_lte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  feesUSD_not?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  feesUSD_not_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  id?: Maybe<Scalars['ID']>
  id_gt?: Maybe<Scalars['ID']>
  id_gte?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  id_lt?: Maybe<Scalars['ID']>
  id_lte?: Maybe<Scalars['ID']>
  id_not?: Maybe<Scalars['ID']>
  id_not_in?: Maybe<Array<Scalars['ID']>>
  liquidityGross?: Maybe<Scalars['v3arbitrum_BigInt']>
  liquidityGross_gt?: Maybe<Scalars['v3arbitrum_BigInt']>
  liquidityGross_gte?: Maybe<Scalars['v3arbitrum_BigInt']>
  liquidityGross_in?: Maybe<Array<Scalars['v3arbitrum_BigInt']>>
  liquidityGross_lt?: Maybe<Scalars['v3arbitrum_BigInt']>
  liquidityGross_lte?: Maybe<Scalars['v3arbitrum_BigInt']>
  liquidityGross_not?: Maybe<Scalars['v3arbitrum_BigInt']>
  liquidityGross_not_in?: Maybe<Array<Scalars['v3arbitrum_BigInt']>>
  liquidityNet?: Maybe<Scalars['v3arbitrum_BigInt']>
  liquidityNet_gt?: Maybe<Scalars['v3arbitrum_BigInt']>
  liquidityNet_gte?: Maybe<Scalars['v3arbitrum_BigInt']>
  liquidityNet_in?: Maybe<Array<Scalars['v3arbitrum_BigInt']>>
  liquidityNet_lt?: Maybe<Scalars['v3arbitrum_BigInt']>
  liquidityNet_lte?: Maybe<Scalars['v3arbitrum_BigInt']>
  liquidityNet_not?: Maybe<Scalars['v3arbitrum_BigInt']>
  liquidityNet_not_in?: Maybe<Array<Scalars['v3arbitrum_BigInt']>>
  periodStartUnix?: Maybe<Scalars['Int']>
  periodStartUnix_gt?: Maybe<Scalars['Int']>
  periodStartUnix_gte?: Maybe<Scalars['Int']>
  periodStartUnix_in?: Maybe<Array<Scalars['Int']>>
  periodStartUnix_lt?: Maybe<Scalars['Int']>
  periodStartUnix_lte?: Maybe<Scalars['Int']>
  periodStartUnix_not?: Maybe<Scalars['Int']>
  periodStartUnix_not_in?: Maybe<Array<Scalars['Int']>>
  pool?: Maybe<Scalars['String']>
  pool_contains?: Maybe<Scalars['String']>
  pool_ends_with?: Maybe<Scalars['String']>
  pool_gt?: Maybe<Scalars['String']>
  pool_gte?: Maybe<Scalars['String']>
  pool_in?: Maybe<Array<Scalars['String']>>
  pool_lt?: Maybe<Scalars['String']>
  pool_lte?: Maybe<Scalars['String']>
  pool_not?: Maybe<Scalars['String']>
  pool_not_contains?: Maybe<Scalars['String']>
  pool_not_ends_with?: Maybe<Scalars['String']>
  pool_not_in?: Maybe<Array<Scalars['String']>>
  pool_not_starts_with?: Maybe<Scalars['String']>
  pool_starts_with?: Maybe<Scalars['String']>
  tick?: Maybe<Scalars['String']>
  tick_contains?: Maybe<Scalars['String']>
  tick_ends_with?: Maybe<Scalars['String']>
  tick_gt?: Maybe<Scalars['String']>
  tick_gte?: Maybe<Scalars['String']>
  tick_in?: Maybe<Array<Scalars['String']>>
  tick_lt?: Maybe<Scalars['String']>
  tick_lte?: Maybe<Scalars['String']>
  tick_not?: Maybe<Scalars['String']>
  tick_not_contains?: Maybe<Scalars['String']>
  tick_not_ends_with?: Maybe<Scalars['String']>
  tick_not_in?: Maybe<Array<Scalars['String']>>
  tick_not_starts_with?: Maybe<Scalars['String']>
  tick_starts_with?: Maybe<Scalars['String']>
  volumeToken0?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeToken0_gt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeToken0_gte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeToken0_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  volumeToken0_lt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeToken0_lte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeToken0_not?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeToken0_not_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  volumeToken1?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeToken1_gt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeToken1_gte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeToken1_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  volumeToken1_lt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeToken1_lte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeToken1_not?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeToken1_not_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  volumeUSD?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeUSD_gt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeUSD_gte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeUSD_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  volumeUSD_lt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeUSD_lte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeUSD_not?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeUSD_not_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
}

export enum V3arbitrum_TickHourData_OrderBy {
  FeesUsd = 'feesUSD',
  Id = 'id',
  LiquidityGross = 'liquidityGross',
  LiquidityNet = 'liquidityNet',
  PeriodStartUnix = 'periodStartUnix',
  Pool = 'pool',
  Tick = 'tick',
  VolumeToken0 = 'volumeToken0',
  VolumeToken1 = 'volumeToken1',
  VolumeUsd = 'volumeUSD',
}

export type V3arbitrum_Tick_Filter = {
  collectedFeesToken0?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  collectedFeesToken0_gt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  collectedFeesToken0_gte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  collectedFeesToken0_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  collectedFeesToken0_lt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  collectedFeesToken0_lte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  collectedFeesToken0_not?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  collectedFeesToken0_not_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  collectedFeesToken1?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  collectedFeesToken1_gt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  collectedFeesToken1_gte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  collectedFeesToken1_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  collectedFeesToken1_lt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  collectedFeesToken1_lte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  collectedFeesToken1_not?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  collectedFeesToken1_not_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  collectedFeesUSD?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  collectedFeesUSD_gt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  collectedFeesUSD_gte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  collectedFeesUSD_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  collectedFeesUSD_lt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  collectedFeesUSD_lte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  collectedFeesUSD_not?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  collectedFeesUSD_not_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  createdAtBlockNumber?: Maybe<Scalars['v3arbitrum_BigInt']>
  createdAtBlockNumber_gt?: Maybe<Scalars['v3arbitrum_BigInt']>
  createdAtBlockNumber_gte?: Maybe<Scalars['v3arbitrum_BigInt']>
  createdAtBlockNumber_in?: Maybe<Array<Scalars['v3arbitrum_BigInt']>>
  createdAtBlockNumber_lt?: Maybe<Scalars['v3arbitrum_BigInt']>
  createdAtBlockNumber_lte?: Maybe<Scalars['v3arbitrum_BigInt']>
  createdAtBlockNumber_not?: Maybe<Scalars['v3arbitrum_BigInt']>
  createdAtBlockNumber_not_in?: Maybe<Array<Scalars['v3arbitrum_BigInt']>>
  createdAtTimestamp?: Maybe<Scalars['v3arbitrum_BigInt']>
  createdAtTimestamp_gt?: Maybe<Scalars['v3arbitrum_BigInt']>
  createdAtTimestamp_gte?: Maybe<Scalars['v3arbitrum_BigInt']>
  createdAtTimestamp_in?: Maybe<Array<Scalars['v3arbitrum_BigInt']>>
  createdAtTimestamp_lt?: Maybe<Scalars['v3arbitrum_BigInt']>
  createdAtTimestamp_lte?: Maybe<Scalars['v3arbitrum_BigInt']>
  createdAtTimestamp_not?: Maybe<Scalars['v3arbitrum_BigInt']>
  createdAtTimestamp_not_in?: Maybe<Array<Scalars['v3arbitrum_BigInt']>>
  feesUSD?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  feesUSD_gt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  feesUSD_gte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  feesUSD_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  feesUSD_lt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  feesUSD_lte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  feesUSD_not?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  feesUSD_not_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  id?: Maybe<Scalars['ID']>
  id_gt?: Maybe<Scalars['ID']>
  id_gte?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  id_lt?: Maybe<Scalars['ID']>
  id_lte?: Maybe<Scalars['ID']>
  id_not?: Maybe<Scalars['ID']>
  id_not_in?: Maybe<Array<Scalars['ID']>>
  liquidityGross?: Maybe<Scalars['v3arbitrum_BigInt']>
  liquidityGross_gt?: Maybe<Scalars['v3arbitrum_BigInt']>
  liquidityGross_gte?: Maybe<Scalars['v3arbitrum_BigInt']>
  liquidityGross_in?: Maybe<Array<Scalars['v3arbitrum_BigInt']>>
  liquidityGross_lt?: Maybe<Scalars['v3arbitrum_BigInt']>
  liquidityGross_lte?: Maybe<Scalars['v3arbitrum_BigInt']>
  liquidityGross_not?: Maybe<Scalars['v3arbitrum_BigInt']>
  liquidityGross_not_in?: Maybe<Array<Scalars['v3arbitrum_BigInt']>>
  liquidityNet?: Maybe<Scalars['v3arbitrum_BigInt']>
  liquidityNet_gt?: Maybe<Scalars['v3arbitrum_BigInt']>
  liquidityNet_gte?: Maybe<Scalars['v3arbitrum_BigInt']>
  liquidityNet_in?: Maybe<Array<Scalars['v3arbitrum_BigInt']>>
  liquidityNet_lt?: Maybe<Scalars['v3arbitrum_BigInt']>
  liquidityNet_lte?: Maybe<Scalars['v3arbitrum_BigInt']>
  liquidityNet_not?: Maybe<Scalars['v3arbitrum_BigInt']>
  liquidityNet_not_in?: Maybe<Array<Scalars['v3arbitrum_BigInt']>>
  liquidityProviderCount?: Maybe<Scalars['v3arbitrum_BigInt']>
  liquidityProviderCount_gt?: Maybe<Scalars['v3arbitrum_BigInt']>
  liquidityProviderCount_gte?: Maybe<Scalars['v3arbitrum_BigInt']>
  liquidityProviderCount_in?: Maybe<Array<Scalars['v3arbitrum_BigInt']>>
  liquidityProviderCount_lt?: Maybe<Scalars['v3arbitrum_BigInt']>
  liquidityProviderCount_lte?: Maybe<Scalars['v3arbitrum_BigInt']>
  liquidityProviderCount_not?: Maybe<Scalars['v3arbitrum_BigInt']>
  liquidityProviderCount_not_in?: Maybe<Array<Scalars['v3arbitrum_BigInt']>>
  pool?: Maybe<Scalars['String']>
  poolAddress?: Maybe<Scalars['String']>
  poolAddress_contains?: Maybe<Scalars['String']>
  poolAddress_ends_with?: Maybe<Scalars['String']>
  poolAddress_gt?: Maybe<Scalars['String']>
  poolAddress_gte?: Maybe<Scalars['String']>
  poolAddress_in?: Maybe<Array<Scalars['String']>>
  poolAddress_lt?: Maybe<Scalars['String']>
  poolAddress_lte?: Maybe<Scalars['String']>
  poolAddress_not?: Maybe<Scalars['String']>
  poolAddress_not_contains?: Maybe<Scalars['String']>
  poolAddress_not_ends_with?: Maybe<Scalars['String']>
  poolAddress_not_in?: Maybe<Array<Scalars['String']>>
  poolAddress_not_starts_with?: Maybe<Scalars['String']>
  poolAddress_starts_with?: Maybe<Scalars['String']>
  pool_contains?: Maybe<Scalars['String']>
  pool_ends_with?: Maybe<Scalars['String']>
  pool_gt?: Maybe<Scalars['String']>
  pool_gte?: Maybe<Scalars['String']>
  pool_in?: Maybe<Array<Scalars['String']>>
  pool_lt?: Maybe<Scalars['String']>
  pool_lte?: Maybe<Scalars['String']>
  pool_not?: Maybe<Scalars['String']>
  pool_not_contains?: Maybe<Scalars['String']>
  pool_not_ends_with?: Maybe<Scalars['String']>
  pool_not_in?: Maybe<Array<Scalars['String']>>
  pool_not_starts_with?: Maybe<Scalars['String']>
  pool_starts_with?: Maybe<Scalars['String']>
  price0?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  price0_gt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  price0_gte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  price0_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  price0_lt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  price0_lte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  price0_not?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  price0_not_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  price1?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  price1_gt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  price1_gte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  price1_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  price1_lt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  price1_lte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  price1_not?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  price1_not_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  tickIdx?: Maybe<Scalars['v3arbitrum_BigInt']>
  tickIdx_gt?: Maybe<Scalars['v3arbitrum_BigInt']>
  tickIdx_gte?: Maybe<Scalars['v3arbitrum_BigInt']>
  tickIdx_in?: Maybe<Array<Scalars['v3arbitrum_BigInt']>>
  tickIdx_lt?: Maybe<Scalars['v3arbitrum_BigInt']>
  tickIdx_lte?: Maybe<Scalars['v3arbitrum_BigInt']>
  tickIdx_not?: Maybe<Scalars['v3arbitrum_BigInt']>
  tickIdx_not_in?: Maybe<Array<Scalars['v3arbitrum_BigInt']>>
  untrackedVolumeUSD?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  untrackedVolumeUSD_gt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  untrackedVolumeUSD_gte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  untrackedVolumeUSD_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  untrackedVolumeUSD_lt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  untrackedVolumeUSD_lte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  untrackedVolumeUSD_not?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  untrackedVolumeUSD_not_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  volumeToken0?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeToken0_gt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeToken0_gte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeToken0_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  volumeToken0_lt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeToken0_lte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeToken0_not?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeToken0_not_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  volumeToken1?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeToken1_gt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeToken1_gte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeToken1_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  volumeToken1_lt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeToken1_lte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeToken1_not?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeToken1_not_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  volumeUSD?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeUSD_gt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeUSD_gte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeUSD_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  volumeUSD_lt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeUSD_lte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeUSD_not?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeUSD_not_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
}

export enum V3arbitrum_Tick_OrderBy {
  CollectedFeesToken0 = 'collectedFeesToken0',
  CollectedFeesToken1 = 'collectedFeesToken1',
  CollectedFeesUsd = 'collectedFeesUSD',
  CreatedAtBlockNumber = 'createdAtBlockNumber',
  CreatedAtTimestamp = 'createdAtTimestamp',
  FeesUsd = 'feesUSD',
  Id = 'id',
  LiquidityGross = 'liquidityGross',
  LiquidityNet = 'liquidityNet',
  LiquidityProviderCount = 'liquidityProviderCount',
  Pool = 'pool',
  PoolAddress = 'poolAddress',
  Price0 = 'price0',
  Price1 = 'price1',
  TickIdx = 'tickIdx',
  UntrackedVolumeUsd = 'untrackedVolumeUSD',
  VolumeToken0 = 'volumeToken0',
  VolumeToken1 = 'volumeToken1',
  VolumeUsd = 'volumeUSD',
}

export type V3arbitrum_Token = {
  __typename?: 'v3arbitrum_Token'
  decimals: Scalars['v3arbitrum_BigInt']
  derivedETH: Scalars['v3arbitrum_BigDecimal']
  feesUSD: Scalars['v3arbitrum_BigDecimal']
  id: Scalars['ID']
  name: Scalars['String']
  poolCount: Scalars['v3arbitrum_BigInt']
  symbol: Scalars['String']
  tokenDayData: Array<V3arbitrum_TokenDayData>
  totalSupply: Scalars['v3arbitrum_BigInt']
  totalValueLocked: Scalars['v3arbitrum_BigDecimal']
  totalValueLockedUSD: Scalars['v3arbitrum_BigDecimal']
  totalValueLockedUSDUntracked: Scalars['v3arbitrum_BigDecimal']
  txCount: Scalars['v3arbitrum_BigInt']
  untrackedVolumeUSD: Scalars['v3arbitrum_BigDecimal']
  volume: Scalars['v3arbitrum_BigDecimal']
  volumeUSD: Scalars['v3arbitrum_BigDecimal']
  whitelistPools: Array<V3arbitrum_Pool>
}

export type V3arbitrum_TokenTokenDayDataArgs = {
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3arbitrum_TokenDayData_OrderBy>
  orderDirection?: Maybe<V3arbitrum_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  where?: Maybe<V3arbitrum_TokenDayData_Filter>
}

export type V3arbitrum_TokenWhitelistPoolsArgs = {
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3arbitrum_Pool_OrderBy>
  orderDirection?: Maybe<V3arbitrum_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  where?: Maybe<V3arbitrum_Pool_Filter>
}

export type V3arbitrum_TokenDayData = {
  __typename?: 'v3arbitrum_TokenDayData'
  close: Scalars['v3arbitrum_BigDecimal']
  date: Scalars['Int']
  feesUSD: Scalars['v3arbitrum_BigDecimal']
  high: Scalars['v3arbitrum_BigDecimal']
  id: Scalars['ID']
  low: Scalars['v3arbitrum_BigDecimal']
  open: Scalars['v3arbitrum_BigDecimal']
  priceUSD: Scalars['v3arbitrum_BigDecimal']
  token: V3arbitrum_Token
  totalValueLocked: Scalars['v3arbitrum_BigDecimal']
  totalValueLockedUSD: Scalars['v3arbitrum_BigDecimal']
  untrackedVolumeUSD: Scalars['v3arbitrum_BigDecimal']
  volume: Scalars['v3arbitrum_BigDecimal']
  volumeUSD: Scalars['v3arbitrum_BigDecimal']
}

export type V3arbitrum_TokenDayData_Filter = {
  close?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  close_gt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  close_gte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  close_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  close_lt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  close_lte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  close_not?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  close_not_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  date?: Maybe<Scalars['Int']>
  date_gt?: Maybe<Scalars['Int']>
  date_gte?: Maybe<Scalars['Int']>
  date_in?: Maybe<Array<Scalars['Int']>>
  date_lt?: Maybe<Scalars['Int']>
  date_lte?: Maybe<Scalars['Int']>
  date_not?: Maybe<Scalars['Int']>
  date_not_in?: Maybe<Array<Scalars['Int']>>
  feesUSD?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  feesUSD_gt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  feesUSD_gte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  feesUSD_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  feesUSD_lt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  feesUSD_lte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  feesUSD_not?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  feesUSD_not_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  high?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  high_gt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  high_gte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  high_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  high_lt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  high_lte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  high_not?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  high_not_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  id?: Maybe<Scalars['ID']>
  id_gt?: Maybe<Scalars['ID']>
  id_gte?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  id_lt?: Maybe<Scalars['ID']>
  id_lte?: Maybe<Scalars['ID']>
  id_not?: Maybe<Scalars['ID']>
  id_not_in?: Maybe<Array<Scalars['ID']>>
  low?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  low_gt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  low_gte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  low_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  low_lt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  low_lte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  low_not?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  low_not_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  open?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  open_gt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  open_gte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  open_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  open_lt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  open_lte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  open_not?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  open_not_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  priceUSD?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  priceUSD_gt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  priceUSD_gte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  priceUSD_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  priceUSD_lt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  priceUSD_lte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  priceUSD_not?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  priceUSD_not_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  token?: Maybe<Scalars['String']>
  token_contains?: Maybe<Scalars['String']>
  token_ends_with?: Maybe<Scalars['String']>
  token_gt?: Maybe<Scalars['String']>
  token_gte?: Maybe<Scalars['String']>
  token_in?: Maybe<Array<Scalars['String']>>
  token_lt?: Maybe<Scalars['String']>
  token_lte?: Maybe<Scalars['String']>
  token_not?: Maybe<Scalars['String']>
  token_not_contains?: Maybe<Scalars['String']>
  token_not_ends_with?: Maybe<Scalars['String']>
  token_not_in?: Maybe<Array<Scalars['String']>>
  token_not_starts_with?: Maybe<Scalars['String']>
  token_starts_with?: Maybe<Scalars['String']>
  totalValueLocked?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  totalValueLockedUSD?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  totalValueLockedUSD_gt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  totalValueLockedUSD_gte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  totalValueLockedUSD_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  totalValueLockedUSD_lt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  totalValueLockedUSD_lte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  totalValueLockedUSD_not?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  totalValueLockedUSD_not_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  totalValueLocked_gt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  totalValueLocked_gte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  totalValueLocked_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  totalValueLocked_lt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  totalValueLocked_lte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  totalValueLocked_not?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  totalValueLocked_not_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  untrackedVolumeUSD?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  untrackedVolumeUSD_gt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  untrackedVolumeUSD_gte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  untrackedVolumeUSD_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  untrackedVolumeUSD_lt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  untrackedVolumeUSD_lte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  untrackedVolumeUSD_not?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  untrackedVolumeUSD_not_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  volume?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeUSD?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeUSD_gt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeUSD_gte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeUSD_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  volumeUSD_lt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeUSD_lte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeUSD_not?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeUSD_not_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  volume_gt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volume_gte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volume_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  volume_lt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volume_lte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volume_not?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volume_not_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
}

export enum V3arbitrum_TokenDayData_OrderBy {
  Close = 'close',
  Date = 'date',
  FeesUsd = 'feesUSD',
  High = 'high',
  Id = 'id',
  Low = 'low',
  Open = 'open',
  PriceUsd = 'priceUSD',
  Token = 'token',
  TotalValueLocked = 'totalValueLocked',
  TotalValueLockedUsd = 'totalValueLockedUSD',
  UntrackedVolumeUsd = 'untrackedVolumeUSD',
  Volume = 'volume',
  VolumeUsd = 'volumeUSD',
}

export type V3arbitrum_TokenHourData = {
  __typename?: 'v3arbitrum_TokenHourData'
  close: Scalars['v3arbitrum_BigDecimal']
  feesUSD: Scalars['v3arbitrum_BigDecimal']
  high: Scalars['v3arbitrum_BigDecimal']
  id: Scalars['ID']
  low: Scalars['v3arbitrum_BigDecimal']
  open: Scalars['v3arbitrum_BigDecimal']
  periodStartUnix: Scalars['Int']
  priceUSD: Scalars['v3arbitrum_BigDecimal']
  token: V3arbitrum_Token
  totalValueLocked: Scalars['v3arbitrum_BigDecimal']
  totalValueLockedUSD: Scalars['v3arbitrum_BigDecimal']
  untrackedVolumeUSD: Scalars['v3arbitrum_BigDecimal']
  volume: Scalars['v3arbitrum_BigDecimal']
  volumeUSD: Scalars['v3arbitrum_BigDecimal']
}

export type V3arbitrum_TokenHourData_Filter = {
  close?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  close_gt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  close_gte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  close_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  close_lt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  close_lte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  close_not?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  close_not_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  feesUSD?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  feesUSD_gt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  feesUSD_gte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  feesUSD_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  feesUSD_lt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  feesUSD_lte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  feesUSD_not?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  feesUSD_not_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  high?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  high_gt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  high_gte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  high_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  high_lt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  high_lte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  high_not?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  high_not_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  id?: Maybe<Scalars['ID']>
  id_gt?: Maybe<Scalars['ID']>
  id_gte?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  id_lt?: Maybe<Scalars['ID']>
  id_lte?: Maybe<Scalars['ID']>
  id_not?: Maybe<Scalars['ID']>
  id_not_in?: Maybe<Array<Scalars['ID']>>
  low?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  low_gt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  low_gte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  low_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  low_lt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  low_lte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  low_not?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  low_not_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  open?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  open_gt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  open_gte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  open_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  open_lt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  open_lte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  open_not?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  open_not_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  periodStartUnix?: Maybe<Scalars['Int']>
  periodStartUnix_gt?: Maybe<Scalars['Int']>
  periodStartUnix_gte?: Maybe<Scalars['Int']>
  periodStartUnix_in?: Maybe<Array<Scalars['Int']>>
  periodStartUnix_lt?: Maybe<Scalars['Int']>
  periodStartUnix_lte?: Maybe<Scalars['Int']>
  periodStartUnix_not?: Maybe<Scalars['Int']>
  periodStartUnix_not_in?: Maybe<Array<Scalars['Int']>>
  priceUSD?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  priceUSD_gt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  priceUSD_gte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  priceUSD_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  priceUSD_lt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  priceUSD_lte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  priceUSD_not?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  priceUSD_not_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  token?: Maybe<Scalars['String']>
  token_contains?: Maybe<Scalars['String']>
  token_ends_with?: Maybe<Scalars['String']>
  token_gt?: Maybe<Scalars['String']>
  token_gte?: Maybe<Scalars['String']>
  token_in?: Maybe<Array<Scalars['String']>>
  token_lt?: Maybe<Scalars['String']>
  token_lte?: Maybe<Scalars['String']>
  token_not?: Maybe<Scalars['String']>
  token_not_contains?: Maybe<Scalars['String']>
  token_not_ends_with?: Maybe<Scalars['String']>
  token_not_in?: Maybe<Array<Scalars['String']>>
  token_not_starts_with?: Maybe<Scalars['String']>
  token_starts_with?: Maybe<Scalars['String']>
  totalValueLocked?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  totalValueLockedUSD?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  totalValueLockedUSD_gt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  totalValueLockedUSD_gte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  totalValueLockedUSD_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  totalValueLockedUSD_lt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  totalValueLockedUSD_lte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  totalValueLockedUSD_not?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  totalValueLockedUSD_not_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  totalValueLocked_gt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  totalValueLocked_gte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  totalValueLocked_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  totalValueLocked_lt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  totalValueLocked_lte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  totalValueLocked_not?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  totalValueLocked_not_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  untrackedVolumeUSD?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  untrackedVolumeUSD_gt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  untrackedVolumeUSD_gte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  untrackedVolumeUSD_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  untrackedVolumeUSD_lt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  untrackedVolumeUSD_lte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  untrackedVolumeUSD_not?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  untrackedVolumeUSD_not_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  volume?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeUSD?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeUSD_gt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeUSD_gte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeUSD_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  volumeUSD_lt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeUSD_lte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeUSD_not?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeUSD_not_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  volume_gt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volume_gte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volume_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  volume_lt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volume_lte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volume_not?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volume_not_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
}

export enum V3arbitrum_TokenHourData_OrderBy {
  Close = 'close',
  FeesUsd = 'feesUSD',
  High = 'high',
  Id = 'id',
  Low = 'low',
  Open = 'open',
  PeriodStartUnix = 'periodStartUnix',
  PriceUsd = 'priceUSD',
  Token = 'token',
  TotalValueLocked = 'totalValueLocked',
  TotalValueLockedUsd = 'totalValueLockedUSD',
  UntrackedVolumeUsd = 'untrackedVolumeUSD',
  Volume = 'volume',
  VolumeUsd = 'volumeUSD',
}

export type V3arbitrum_Token_Filter = {
  decimals?: Maybe<Scalars['v3arbitrum_BigInt']>
  decimals_gt?: Maybe<Scalars['v3arbitrum_BigInt']>
  decimals_gte?: Maybe<Scalars['v3arbitrum_BigInt']>
  decimals_in?: Maybe<Array<Scalars['v3arbitrum_BigInt']>>
  decimals_lt?: Maybe<Scalars['v3arbitrum_BigInt']>
  decimals_lte?: Maybe<Scalars['v3arbitrum_BigInt']>
  decimals_not?: Maybe<Scalars['v3arbitrum_BigInt']>
  decimals_not_in?: Maybe<Array<Scalars['v3arbitrum_BigInt']>>
  derivedETH?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  derivedETH_gt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  derivedETH_gte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  derivedETH_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  derivedETH_lt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  derivedETH_lte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  derivedETH_not?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  derivedETH_not_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  feesUSD?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  feesUSD_gt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  feesUSD_gte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  feesUSD_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  feesUSD_lt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  feesUSD_lte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  feesUSD_not?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  feesUSD_not_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  id?: Maybe<Scalars['ID']>
  id_gt?: Maybe<Scalars['ID']>
  id_gte?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  id_lt?: Maybe<Scalars['ID']>
  id_lte?: Maybe<Scalars['ID']>
  id_not?: Maybe<Scalars['ID']>
  id_not_in?: Maybe<Array<Scalars['ID']>>
  name?: Maybe<Scalars['String']>
  name_contains?: Maybe<Scalars['String']>
  name_ends_with?: Maybe<Scalars['String']>
  name_gt?: Maybe<Scalars['String']>
  name_gte?: Maybe<Scalars['String']>
  name_in?: Maybe<Array<Scalars['String']>>
  name_lt?: Maybe<Scalars['String']>
  name_lte?: Maybe<Scalars['String']>
  name_not?: Maybe<Scalars['String']>
  name_not_contains?: Maybe<Scalars['String']>
  name_not_ends_with?: Maybe<Scalars['String']>
  name_not_in?: Maybe<Array<Scalars['String']>>
  name_not_starts_with?: Maybe<Scalars['String']>
  name_starts_with?: Maybe<Scalars['String']>
  poolCount?: Maybe<Scalars['v3arbitrum_BigInt']>
  poolCount_gt?: Maybe<Scalars['v3arbitrum_BigInt']>
  poolCount_gte?: Maybe<Scalars['v3arbitrum_BigInt']>
  poolCount_in?: Maybe<Array<Scalars['v3arbitrum_BigInt']>>
  poolCount_lt?: Maybe<Scalars['v3arbitrum_BigInt']>
  poolCount_lte?: Maybe<Scalars['v3arbitrum_BigInt']>
  poolCount_not?: Maybe<Scalars['v3arbitrum_BigInt']>
  poolCount_not_in?: Maybe<Array<Scalars['v3arbitrum_BigInt']>>
  symbol?: Maybe<Scalars['String']>
  symbol_contains?: Maybe<Scalars['String']>
  symbol_ends_with?: Maybe<Scalars['String']>
  symbol_gt?: Maybe<Scalars['String']>
  symbol_gte?: Maybe<Scalars['String']>
  symbol_in?: Maybe<Array<Scalars['String']>>
  symbol_lt?: Maybe<Scalars['String']>
  symbol_lte?: Maybe<Scalars['String']>
  symbol_not?: Maybe<Scalars['String']>
  symbol_not_contains?: Maybe<Scalars['String']>
  symbol_not_ends_with?: Maybe<Scalars['String']>
  symbol_not_in?: Maybe<Array<Scalars['String']>>
  symbol_not_starts_with?: Maybe<Scalars['String']>
  symbol_starts_with?: Maybe<Scalars['String']>
  totalSupply?: Maybe<Scalars['v3arbitrum_BigInt']>
  totalSupply_gt?: Maybe<Scalars['v3arbitrum_BigInt']>
  totalSupply_gte?: Maybe<Scalars['v3arbitrum_BigInt']>
  totalSupply_in?: Maybe<Array<Scalars['v3arbitrum_BigInt']>>
  totalSupply_lt?: Maybe<Scalars['v3arbitrum_BigInt']>
  totalSupply_lte?: Maybe<Scalars['v3arbitrum_BigInt']>
  totalSupply_not?: Maybe<Scalars['v3arbitrum_BigInt']>
  totalSupply_not_in?: Maybe<Array<Scalars['v3arbitrum_BigInt']>>
  totalValueLocked?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  totalValueLockedUSD?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  totalValueLockedUSDUntracked?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  totalValueLockedUSDUntracked_gt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  totalValueLockedUSDUntracked_gte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  totalValueLockedUSDUntracked_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  totalValueLockedUSDUntracked_lt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  totalValueLockedUSDUntracked_lte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  totalValueLockedUSDUntracked_not?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  totalValueLockedUSDUntracked_not_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  totalValueLockedUSD_gt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  totalValueLockedUSD_gte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  totalValueLockedUSD_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  totalValueLockedUSD_lt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  totalValueLockedUSD_lte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  totalValueLockedUSD_not?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  totalValueLockedUSD_not_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  totalValueLocked_gt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  totalValueLocked_gte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  totalValueLocked_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  totalValueLocked_lt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  totalValueLocked_lte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  totalValueLocked_not?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  totalValueLocked_not_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  txCount?: Maybe<Scalars['v3arbitrum_BigInt']>
  txCount_gt?: Maybe<Scalars['v3arbitrum_BigInt']>
  txCount_gte?: Maybe<Scalars['v3arbitrum_BigInt']>
  txCount_in?: Maybe<Array<Scalars['v3arbitrum_BigInt']>>
  txCount_lt?: Maybe<Scalars['v3arbitrum_BigInt']>
  txCount_lte?: Maybe<Scalars['v3arbitrum_BigInt']>
  txCount_not?: Maybe<Scalars['v3arbitrum_BigInt']>
  txCount_not_in?: Maybe<Array<Scalars['v3arbitrum_BigInt']>>
  untrackedVolumeUSD?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  untrackedVolumeUSD_gt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  untrackedVolumeUSD_gte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  untrackedVolumeUSD_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  untrackedVolumeUSD_lt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  untrackedVolumeUSD_lte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  untrackedVolumeUSD_not?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  untrackedVolumeUSD_not_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  volume?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeUSD?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeUSD_gt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeUSD_gte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeUSD_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  volumeUSD_lt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeUSD_lte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeUSD_not?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeUSD_not_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  volume_gt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volume_gte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volume_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  volume_lt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volume_lte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volume_not?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volume_not_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  whitelistPools?: Maybe<Array<Scalars['String']>>
  whitelistPools_contains?: Maybe<Array<Scalars['String']>>
  whitelistPools_not?: Maybe<Array<Scalars['String']>>
  whitelistPools_not_contains?: Maybe<Array<Scalars['String']>>
}

export enum V3arbitrum_Token_OrderBy {
  Decimals = 'decimals',
  DerivedEth = 'derivedETH',
  FeesUsd = 'feesUSD',
  Id = 'id',
  Name = 'name',
  PoolCount = 'poolCount',
  Symbol = 'symbol',
  TokenDayData = 'tokenDayData',
  TotalSupply = 'totalSupply',
  TotalValueLocked = 'totalValueLocked',
  TotalValueLockedUsd = 'totalValueLockedUSD',
  TotalValueLockedUsdUntracked = 'totalValueLockedUSDUntracked',
  TxCount = 'txCount',
  UntrackedVolumeUsd = 'untrackedVolumeUSD',
  Volume = 'volume',
  VolumeUsd = 'volumeUSD',
  WhitelistPools = 'whitelistPools',
}

export type V3arbitrum_Transaction = {
  __typename?: 'v3arbitrum_Transaction'
  blockNumber: Scalars['v3arbitrum_BigInt']
  burns: Array<Maybe<V3arbitrum_Burn>>
  collects: Array<Maybe<V3arbitrum_Collect>>
  flashed: Array<Maybe<V3arbitrum_Flash>>
  gasPrice: Scalars['v3arbitrum_BigInt']
  gasUsed: Scalars['v3arbitrum_BigInt']
  id: Scalars['ID']
  mints: Array<Maybe<V3arbitrum_Mint>>
  swaps: Array<Maybe<V3arbitrum_Swap>>
  timestamp: Scalars['v3arbitrum_BigInt']
}

export type V3arbitrum_TransactionBurnsArgs = {
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3arbitrum_Burn_OrderBy>
  orderDirection?: Maybe<V3arbitrum_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  where?: Maybe<V3arbitrum_Burn_Filter>
}

export type V3arbitrum_TransactionCollectsArgs = {
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3arbitrum_Collect_OrderBy>
  orderDirection?: Maybe<V3arbitrum_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  where?: Maybe<V3arbitrum_Collect_Filter>
}

export type V3arbitrum_TransactionFlashedArgs = {
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3arbitrum_Flash_OrderBy>
  orderDirection?: Maybe<V3arbitrum_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  where?: Maybe<V3arbitrum_Flash_Filter>
}

export type V3arbitrum_TransactionMintsArgs = {
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3arbitrum_Mint_OrderBy>
  orderDirection?: Maybe<V3arbitrum_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  where?: Maybe<V3arbitrum_Mint_Filter>
}

export type V3arbitrum_TransactionSwapsArgs = {
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3arbitrum_Swap_OrderBy>
  orderDirection?: Maybe<V3arbitrum_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  where?: Maybe<V3arbitrum_Swap_Filter>
}

export type V3arbitrum_Transaction_Filter = {
  blockNumber?: Maybe<Scalars['v3arbitrum_BigInt']>
  blockNumber_gt?: Maybe<Scalars['v3arbitrum_BigInt']>
  blockNumber_gte?: Maybe<Scalars['v3arbitrum_BigInt']>
  blockNumber_in?: Maybe<Array<Scalars['v3arbitrum_BigInt']>>
  blockNumber_lt?: Maybe<Scalars['v3arbitrum_BigInt']>
  blockNumber_lte?: Maybe<Scalars['v3arbitrum_BigInt']>
  blockNumber_not?: Maybe<Scalars['v3arbitrum_BigInt']>
  blockNumber_not_in?: Maybe<Array<Scalars['v3arbitrum_BigInt']>>
  gasPrice?: Maybe<Scalars['v3arbitrum_BigInt']>
  gasPrice_gt?: Maybe<Scalars['v3arbitrum_BigInt']>
  gasPrice_gte?: Maybe<Scalars['v3arbitrum_BigInt']>
  gasPrice_in?: Maybe<Array<Scalars['v3arbitrum_BigInt']>>
  gasPrice_lt?: Maybe<Scalars['v3arbitrum_BigInt']>
  gasPrice_lte?: Maybe<Scalars['v3arbitrum_BigInt']>
  gasPrice_not?: Maybe<Scalars['v3arbitrum_BigInt']>
  gasPrice_not_in?: Maybe<Array<Scalars['v3arbitrum_BigInt']>>
  gasUsed?: Maybe<Scalars['v3arbitrum_BigInt']>
  gasUsed_gt?: Maybe<Scalars['v3arbitrum_BigInt']>
  gasUsed_gte?: Maybe<Scalars['v3arbitrum_BigInt']>
  gasUsed_in?: Maybe<Array<Scalars['v3arbitrum_BigInt']>>
  gasUsed_lt?: Maybe<Scalars['v3arbitrum_BigInt']>
  gasUsed_lte?: Maybe<Scalars['v3arbitrum_BigInt']>
  gasUsed_not?: Maybe<Scalars['v3arbitrum_BigInt']>
  gasUsed_not_in?: Maybe<Array<Scalars['v3arbitrum_BigInt']>>
  id?: Maybe<Scalars['ID']>
  id_gt?: Maybe<Scalars['ID']>
  id_gte?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  id_lt?: Maybe<Scalars['ID']>
  id_lte?: Maybe<Scalars['ID']>
  id_not?: Maybe<Scalars['ID']>
  id_not_in?: Maybe<Array<Scalars['ID']>>
  timestamp?: Maybe<Scalars['v3arbitrum_BigInt']>
  timestamp_gt?: Maybe<Scalars['v3arbitrum_BigInt']>
  timestamp_gte?: Maybe<Scalars['v3arbitrum_BigInt']>
  timestamp_in?: Maybe<Array<Scalars['v3arbitrum_BigInt']>>
  timestamp_lt?: Maybe<Scalars['v3arbitrum_BigInt']>
  timestamp_lte?: Maybe<Scalars['v3arbitrum_BigInt']>
  timestamp_not?: Maybe<Scalars['v3arbitrum_BigInt']>
  timestamp_not_in?: Maybe<Array<Scalars['v3arbitrum_BigInt']>>
}

export enum V3arbitrum_Transaction_OrderBy {
  BlockNumber = 'blockNumber',
  Burns = 'burns',
  Collects = 'collects',
  Flashed = 'flashed',
  GasPrice = 'gasPrice',
  GasUsed = 'gasUsed',
  Id = 'id',
  Mints = 'mints',
  Swaps = 'swaps',
  Timestamp = 'timestamp',
}

export type V3arbitrum_UniswapDayData = {
  __typename?: 'v3arbitrum_UniswapDayData'
  date: Scalars['Int']
  feesUSD: Scalars['v3arbitrum_BigDecimal']
  id: Scalars['ID']
  tvlUSD: Scalars['v3arbitrum_BigDecimal']
  txCount: Scalars['v3arbitrum_BigInt']
  volumeETH: Scalars['v3arbitrum_BigDecimal']
  volumeUSD: Scalars['v3arbitrum_BigDecimal']
  volumeUSDUntracked: Scalars['v3arbitrum_BigDecimal']
}

export type V3arbitrum_UniswapDayData_Filter = {
  date?: Maybe<Scalars['Int']>
  date_gt?: Maybe<Scalars['Int']>
  date_gte?: Maybe<Scalars['Int']>
  date_in?: Maybe<Array<Scalars['Int']>>
  date_lt?: Maybe<Scalars['Int']>
  date_lte?: Maybe<Scalars['Int']>
  date_not?: Maybe<Scalars['Int']>
  date_not_in?: Maybe<Array<Scalars['Int']>>
  feesUSD?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  feesUSD_gt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  feesUSD_gte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  feesUSD_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  feesUSD_lt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  feesUSD_lte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  feesUSD_not?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  feesUSD_not_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  id?: Maybe<Scalars['ID']>
  id_gt?: Maybe<Scalars['ID']>
  id_gte?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  id_lt?: Maybe<Scalars['ID']>
  id_lte?: Maybe<Scalars['ID']>
  id_not?: Maybe<Scalars['ID']>
  id_not_in?: Maybe<Array<Scalars['ID']>>
  tvlUSD?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  tvlUSD_gt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  tvlUSD_gte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  tvlUSD_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  tvlUSD_lt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  tvlUSD_lte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  tvlUSD_not?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  tvlUSD_not_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  txCount?: Maybe<Scalars['v3arbitrum_BigInt']>
  txCount_gt?: Maybe<Scalars['v3arbitrum_BigInt']>
  txCount_gte?: Maybe<Scalars['v3arbitrum_BigInt']>
  txCount_in?: Maybe<Array<Scalars['v3arbitrum_BigInt']>>
  txCount_lt?: Maybe<Scalars['v3arbitrum_BigInt']>
  txCount_lte?: Maybe<Scalars['v3arbitrum_BigInt']>
  txCount_not?: Maybe<Scalars['v3arbitrum_BigInt']>
  txCount_not_in?: Maybe<Array<Scalars['v3arbitrum_BigInt']>>
  volumeETH?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeETH_gt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeETH_gte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeETH_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  volumeETH_lt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeETH_lte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeETH_not?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeETH_not_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  volumeUSD?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeUSDUntracked?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeUSDUntracked_gt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeUSDUntracked_gte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeUSDUntracked_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  volumeUSDUntracked_lt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeUSDUntracked_lte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeUSDUntracked_not?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeUSDUntracked_not_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  volumeUSD_gt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeUSD_gte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeUSD_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
  volumeUSD_lt?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeUSD_lte?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeUSD_not?: Maybe<Scalars['v3arbitrum_BigDecimal']>
  volumeUSD_not_in?: Maybe<Array<Scalars['v3arbitrum_BigDecimal']>>
}

export enum V3arbitrum_UniswapDayData_OrderBy {
  Date = 'date',
  FeesUsd = 'feesUSD',
  Id = 'id',
  TvlUsd = 'tvlUSD',
  TxCount = 'txCount',
  VolumeEth = 'volumeETH',
  VolumeUsd = 'volumeUSD',
  VolumeUsdUntracked = 'volumeUSDUntracked',
}

export type V3arbitrum__Block_ = {
  __typename?: 'v3arbitrum__Block_'
  /** The hash of the block */
  hash?: Maybe<Scalars['v3arbitrum_Bytes']>
  /** The block number */
  number: Scalars['Int']
}

/** The type for the top-level _meta field */
export type V3arbitrum__Meta_ = {
  __typename?: 'v3arbitrum__Meta_'
  /**
   * Information about a specific subgraph block. The hash of the block
   * will be null if the _meta field has a block constraint that asks for
   * a block number. It will be filled if the _meta field has no block constraint
   * and therefore asks for the latest  block
   *
   */
  block: V3arbitrum__Block_
  /** The deployment ID */
  deployment: Scalars['String']
  /** If `true`, the subgraph encountered indexing errors at some past block */
  hasIndexingErrors: Scalars['Boolean']
}

export enum V3arbitrum__SubgraphErrorPolicy_ {
  /** Data will be returned even if the subgraph has indexing errors */
  Allow = 'allow',
  /** If the subgraph has indexing errors, data will be omitted. The default. */
  Deny = 'deny',
}

export type V3polygon_Block_Height = {
  hash?: Maybe<Scalars['v3polygon_Bytes']>
  number?: Maybe<Scalars['Int']>
  number_gte?: Maybe<Scalars['Int']>
}

export type V3polygon_Bundle = {
  __typename?: 'v3polygon_Bundle'
  ethPriceUSD: Scalars['v3polygon_BigDecimal']
  id: Scalars['ID']
}

export type V3polygon_Bundle_Filter = {
  ethPriceUSD?: Maybe<Scalars['v3polygon_BigDecimal']>
  ethPriceUSD_gt?: Maybe<Scalars['v3polygon_BigDecimal']>
  ethPriceUSD_gte?: Maybe<Scalars['v3polygon_BigDecimal']>
  ethPriceUSD_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  ethPriceUSD_lt?: Maybe<Scalars['v3polygon_BigDecimal']>
  ethPriceUSD_lte?: Maybe<Scalars['v3polygon_BigDecimal']>
  ethPriceUSD_not?: Maybe<Scalars['v3polygon_BigDecimal']>
  ethPriceUSD_not_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  id?: Maybe<Scalars['ID']>
  id_gt?: Maybe<Scalars['ID']>
  id_gte?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  id_lt?: Maybe<Scalars['ID']>
  id_lte?: Maybe<Scalars['ID']>
  id_not?: Maybe<Scalars['ID']>
  id_not_in?: Maybe<Array<Scalars['ID']>>
}

export enum V3polygon_Bundle_OrderBy {
  EthPriceUsd = 'ethPriceUSD',
  Id = 'id',
}

export type V3polygon_Burn = {
  __typename?: 'v3polygon_Burn'
  amount: Scalars['v3polygon_BigInt']
  amount0: Scalars['v3polygon_BigDecimal']
  amount1: Scalars['v3polygon_BigDecimal']
  amountUSD?: Maybe<Scalars['v3polygon_BigDecimal']>
  id: Scalars['ID']
  logIndex?: Maybe<Scalars['v3polygon_BigInt']>
  origin: Scalars['v3polygon_Bytes']
  owner?: Maybe<Scalars['v3polygon_Bytes']>
  pool: V3polygon_Pool
  tickLower: Scalars['v3polygon_BigInt']
  tickUpper: Scalars['v3polygon_BigInt']
  timestamp: Scalars['v3polygon_BigInt']
  token0: V3polygon_Token
  token1: V3polygon_Token
  transaction: V3polygon_Transaction
}

export type V3polygon_Burn_Filter = {
  amount?: Maybe<Scalars['v3polygon_BigInt']>
  amount0?: Maybe<Scalars['v3polygon_BigDecimal']>
  amount0_gt?: Maybe<Scalars['v3polygon_BigDecimal']>
  amount0_gte?: Maybe<Scalars['v3polygon_BigDecimal']>
  amount0_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  amount0_lt?: Maybe<Scalars['v3polygon_BigDecimal']>
  amount0_lte?: Maybe<Scalars['v3polygon_BigDecimal']>
  amount0_not?: Maybe<Scalars['v3polygon_BigDecimal']>
  amount0_not_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  amount1?: Maybe<Scalars['v3polygon_BigDecimal']>
  amount1_gt?: Maybe<Scalars['v3polygon_BigDecimal']>
  amount1_gte?: Maybe<Scalars['v3polygon_BigDecimal']>
  amount1_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  amount1_lt?: Maybe<Scalars['v3polygon_BigDecimal']>
  amount1_lte?: Maybe<Scalars['v3polygon_BigDecimal']>
  amount1_not?: Maybe<Scalars['v3polygon_BigDecimal']>
  amount1_not_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  amountUSD?: Maybe<Scalars['v3polygon_BigDecimal']>
  amountUSD_gt?: Maybe<Scalars['v3polygon_BigDecimal']>
  amountUSD_gte?: Maybe<Scalars['v3polygon_BigDecimal']>
  amountUSD_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  amountUSD_lt?: Maybe<Scalars['v3polygon_BigDecimal']>
  amountUSD_lte?: Maybe<Scalars['v3polygon_BigDecimal']>
  amountUSD_not?: Maybe<Scalars['v3polygon_BigDecimal']>
  amountUSD_not_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  amount_gt?: Maybe<Scalars['v3polygon_BigInt']>
  amount_gte?: Maybe<Scalars['v3polygon_BigInt']>
  amount_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  amount_lt?: Maybe<Scalars['v3polygon_BigInt']>
  amount_lte?: Maybe<Scalars['v3polygon_BigInt']>
  amount_not?: Maybe<Scalars['v3polygon_BigInt']>
  amount_not_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  id?: Maybe<Scalars['ID']>
  id_gt?: Maybe<Scalars['ID']>
  id_gte?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  id_lt?: Maybe<Scalars['ID']>
  id_lte?: Maybe<Scalars['ID']>
  id_not?: Maybe<Scalars['ID']>
  id_not_in?: Maybe<Array<Scalars['ID']>>
  logIndex?: Maybe<Scalars['v3polygon_BigInt']>
  logIndex_gt?: Maybe<Scalars['v3polygon_BigInt']>
  logIndex_gte?: Maybe<Scalars['v3polygon_BigInt']>
  logIndex_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  logIndex_lt?: Maybe<Scalars['v3polygon_BigInt']>
  logIndex_lte?: Maybe<Scalars['v3polygon_BigInt']>
  logIndex_not?: Maybe<Scalars['v3polygon_BigInt']>
  logIndex_not_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  origin?: Maybe<Scalars['v3polygon_Bytes']>
  origin_contains?: Maybe<Scalars['v3polygon_Bytes']>
  origin_in?: Maybe<Array<Scalars['v3polygon_Bytes']>>
  origin_not?: Maybe<Scalars['v3polygon_Bytes']>
  origin_not_contains?: Maybe<Scalars['v3polygon_Bytes']>
  origin_not_in?: Maybe<Array<Scalars['v3polygon_Bytes']>>
  owner?: Maybe<Scalars['v3polygon_Bytes']>
  owner_contains?: Maybe<Scalars['v3polygon_Bytes']>
  owner_in?: Maybe<Array<Scalars['v3polygon_Bytes']>>
  owner_not?: Maybe<Scalars['v3polygon_Bytes']>
  owner_not_contains?: Maybe<Scalars['v3polygon_Bytes']>
  owner_not_in?: Maybe<Array<Scalars['v3polygon_Bytes']>>
  pool?: Maybe<Scalars['String']>
  pool_contains?: Maybe<Scalars['String']>
  pool_ends_with?: Maybe<Scalars['String']>
  pool_gt?: Maybe<Scalars['String']>
  pool_gte?: Maybe<Scalars['String']>
  pool_in?: Maybe<Array<Scalars['String']>>
  pool_lt?: Maybe<Scalars['String']>
  pool_lte?: Maybe<Scalars['String']>
  pool_not?: Maybe<Scalars['String']>
  pool_not_contains?: Maybe<Scalars['String']>
  pool_not_ends_with?: Maybe<Scalars['String']>
  pool_not_in?: Maybe<Array<Scalars['String']>>
  pool_not_starts_with?: Maybe<Scalars['String']>
  pool_starts_with?: Maybe<Scalars['String']>
  tickLower?: Maybe<Scalars['v3polygon_BigInt']>
  tickLower_gt?: Maybe<Scalars['v3polygon_BigInt']>
  tickLower_gte?: Maybe<Scalars['v3polygon_BigInt']>
  tickLower_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  tickLower_lt?: Maybe<Scalars['v3polygon_BigInt']>
  tickLower_lte?: Maybe<Scalars['v3polygon_BigInt']>
  tickLower_not?: Maybe<Scalars['v3polygon_BigInt']>
  tickLower_not_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  tickUpper?: Maybe<Scalars['v3polygon_BigInt']>
  tickUpper_gt?: Maybe<Scalars['v3polygon_BigInt']>
  tickUpper_gte?: Maybe<Scalars['v3polygon_BigInt']>
  tickUpper_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  tickUpper_lt?: Maybe<Scalars['v3polygon_BigInt']>
  tickUpper_lte?: Maybe<Scalars['v3polygon_BigInt']>
  tickUpper_not?: Maybe<Scalars['v3polygon_BigInt']>
  tickUpper_not_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  timestamp?: Maybe<Scalars['v3polygon_BigInt']>
  timestamp_gt?: Maybe<Scalars['v3polygon_BigInt']>
  timestamp_gte?: Maybe<Scalars['v3polygon_BigInt']>
  timestamp_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  timestamp_lt?: Maybe<Scalars['v3polygon_BigInt']>
  timestamp_lte?: Maybe<Scalars['v3polygon_BigInt']>
  timestamp_not?: Maybe<Scalars['v3polygon_BigInt']>
  timestamp_not_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  token0?: Maybe<Scalars['String']>
  token0_contains?: Maybe<Scalars['String']>
  token0_ends_with?: Maybe<Scalars['String']>
  token0_gt?: Maybe<Scalars['String']>
  token0_gte?: Maybe<Scalars['String']>
  token0_in?: Maybe<Array<Scalars['String']>>
  token0_lt?: Maybe<Scalars['String']>
  token0_lte?: Maybe<Scalars['String']>
  token0_not?: Maybe<Scalars['String']>
  token0_not_contains?: Maybe<Scalars['String']>
  token0_not_ends_with?: Maybe<Scalars['String']>
  token0_not_in?: Maybe<Array<Scalars['String']>>
  token0_not_starts_with?: Maybe<Scalars['String']>
  token0_starts_with?: Maybe<Scalars['String']>
  token1?: Maybe<Scalars['String']>
  token1_contains?: Maybe<Scalars['String']>
  token1_ends_with?: Maybe<Scalars['String']>
  token1_gt?: Maybe<Scalars['String']>
  token1_gte?: Maybe<Scalars['String']>
  token1_in?: Maybe<Array<Scalars['String']>>
  token1_lt?: Maybe<Scalars['String']>
  token1_lte?: Maybe<Scalars['String']>
  token1_not?: Maybe<Scalars['String']>
  token1_not_contains?: Maybe<Scalars['String']>
  token1_not_ends_with?: Maybe<Scalars['String']>
  token1_not_in?: Maybe<Array<Scalars['String']>>
  token1_not_starts_with?: Maybe<Scalars['String']>
  token1_starts_with?: Maybe<Scalars['String']>
  transaction?: Maybe<Scalars['String']>
  transaction_contains?: Maybe<Scalars['String']>
  transaction_ends_with?: Maybe<Scalars['String']>
  transaction_gt?: Maybe<Scalars['String']>
  transaction_gte?: Maybe<Scalars['String']>
  transaction_in?: Maybe<Array<Scalars['String']>>
  transaction_lt?: Maybe<Scalars['String']>
  transaction_lte?: Maybe<Scalars['String']>
  transaction_not?: Maybe<Scalars['String']>
  transaction_not_contains?: Maybe<Scalars['String']>
  transaction_not_ends_with?: Maybe<Scalars['String']>
  transaction_not_in?: Maybe<Array<Scalars['String']>>
  transaction_not_starts_with?: Maybe<Scalars['String']>
  transaction_starts_with?: Maybe<Scalars['String']>
}

export enum V3polygon_Burn_OrderBy {
  Amount = 'amount',
  Amount0 = 'amount0',
  Amount1 = 'amount1',
  AmountUsd = 'amountUSD',
  Id = 'id',
  LogIndex = 'logIndex',
  Origin = 'origin',
  Owner = 'owner',
  Pool = 'pool',
  TickLower = 'tickLower',
  TickUpper = 'tickUpper',
  Timestamp = 'timestamp',
  Token0 = 'token0',
  Token1 = 'token1',
  Transaction = 'transaction',
}

export type V3polygon_Collect = {
  __typename?: 'v3polygon_Collect'
  amount0: Scalars['v3polygon_BigDecimal']
  amount1: Scalars['v3polygon_BigDecimal']
  amountUSD?: Maybe<Scalars['v3polygon_BigDecimal']>
  id: Scalars['ID']
  logIndex?: Maybe<Scalars['v3polygon_BigInt']>
  owner?: Maybe<Scalars['v3polygon_Bytes']>
  pool: V3polygon_Pool
  tickLower: Scalars['v3polygon_BigInt']
  tickUpper: Scalars['v3polygon_BigInt']
  timestamp: Scalars['v3polygon_BigInt']
  transaction: V3polygon_Transaction
}

export type V3polygon_Collect_Filter = {
  amount0?: Maybe<Scalars['v3polygon_BigDecimal']>
  amount0_gt?: Maybe<Scalars['v3polygon_BigDecimal']>
  amount0_gte?: Maybe<Scalars['v3polygon_BigDecimal']>
  amount0_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  amount0_lt?: Maybe<Scalars['v3polygon_BigDecimal']>
  amount0_lte?: Maybe<Scalars['v3polygon_BigDecimal']>
  amount0_not?: Maybe<Scalars['v3polygon_BigDecimal']>
  amount0_not_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  amount1?: Maybe<Scalars['v3polygon_BigDecimal']>
  amount1_gt?: Maybe<Scalars['v3polygon_BigDecimal']>
  amount1_gte?: Maybe<Scalars['v3polygon_BigDecimal']>
  amount1_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  amount1_lt?: Maybe<Scalars['v3polygon_BigDecimal']>
  amount1_lte?: Maybe<Scalars['v3polygon_BigDecimal']>
  amount1_not?: Maybe<Scalars['v3polygon_BigDecimal']>
  amount1_not_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  amountUSD?: Maybe<Scalars['v3polygon_BigDecimal']>
  amountUSD_gt?: Maybe<Scalars['v3polygon_BigDecimal']>
  amountUSD_gte?: Maybe<Scalars['v3polygon_BigDecimal']>
  amountUSD_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  amountUSD_lt?: Maybe<Scalars['v3polygon_BigDecimal']>
  amountUSD_lte?: Maybe<Scalars['v3polygon_BigDecimal']>
  amountUSD_not?: Maybe<Scalars['v3polygon_BigDecimal']>
  amountUSD_not_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  id?: Maybe<Scalars['ID']>
  id_gt?: Maybe<Scalars['ID']>
  id_gte?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  id_lt?: Maybe<Scalars['ID']>
  id_lte?: Maybe<Scalars['ID']>
  id_not?: Maybe<Scalars['ID']>
  id_not_in?: Maybe<Array<Scalars['ID']>>
  logIndex?: Maybe<Scalars['v3polygon_BigInt']>
  logIndex_gt?: Maybe<Scalars['v3polygon_BigInt']>
  logIndex_gte?: Maybe<Scalars['v3polygon_BigInt']>
  logIndex_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  logIndex_lt?: Maybe<Scalars['v3polygon_BigInt']>
  logIndex_lte?: Maybe<Scalars['v3polygon_BigInt']>
  logIndex_not?: Maybe<Scalars['v3polygon_BigInt']>
  logIndex_not_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  owner?: Maybe<Scalars['v3polygon_Bytes']>
  owner_contains?: Maybe<Scalars['v3polygon_Bytes']>
  owner_in?: Maybe<Array<Scalars['v3polygon_Bytes']>>
  owner_not?: Maybe<Scalars['v3polygon_Bytes']>
  owner_not_contains?: Maybe<Scalars['v3polygon_Bytes']>
  owner_not_in?: Maybe<Array<Scalars['v3polygon_Bytes']>>
  pool?: Maybe<Scalars['String']>
  pool_contains?: Maybe<Scalars['String']>
  pool_ends_with?: Maybe<Scalars['String']>
  pool_gt?: Maybe<Scalars['String']>
  pool_gte?: Maybe<Scalars['String']>
  pool_in?: Maybe<Array<Scalars['String']>>
  pool_lt?: Maybe<Scalars['String']>
  pool_lte?: Maybe<Scalars['String']>
  pool_not?: Maybe<Scalars['String']>
  pool_not_contains?: Maybe<Scalars['String']>
  pool_not_ends_with?: Maybe<Scalars['String']>
  pool_not_in?: Maybe<Array<Scalars['String']>>
  pool_not_starts_with?: Maybe<Scalars['String']>
  pool_starts_with?: Maybe<Scalars['String']>
  tickLower?: Maybe<Scalars['v3polygon_BigInt']>
  tickLower_gt?: Maybe<Scalars['v3polygon_BigInt']>
  tickLower_gte?: Maybe<Scalars['v3polygon_BigInt']>
  tickLower_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  tickLower_lt?: Maybe<Scalars['v3polygon_BigInt']>
  tickLower_lte?: Maybe<Scalars['v3polygon_BigInt']>
  tickLower_not?: Maybe<Scalars['v3polygon_BigInt']>
  tickLower_not_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  tickUpper?: Maybe<Scalars['v3polygon_BigInt']>
  tickUpper_gt?: Maybe<Scalars['v3polygon_BigInt']>
  tickUpper_gte?: Maybe<Scalars['v3polygon_BigInt']>
  tickUpper_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  tickUpper_lt?: Maybe<Scalars['v3polygon_BigInt']>
  tickUpper_lte?: Maybe<Scalars['v3polygon_BigInt']>
  tickUpper_not?: Maybe<Scalars['v3polygon_BigInt']>
  tickUpper_not_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  timestamp?: Maybe<Scalars['v3polygon_BigInt']>
  timestamp_gt?: Maybe<Scalars['v3polygon_BigInt']>
  timestamp_gte?: Maybe<Scalars['v3polygon_BigInt']>
  timestamp_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  timestamp_lt?: Maybe<Scalars['v3polygon_BigInt']>
  timestamp_lte?: Maybe<Scalars['v3polygon_BigInt']>
  timestamp_not?: Maybe<Scalars['v3polygon_BigInt']>
  timestamp_not_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  transaction?: Maybe<Scalars['String']>
  transaction_contains?: Maybe<Scalars['String']>
  transaction_ends_with?: Maybe<Scalars['String']>
  transaction_gt?: Maybe<Scalars['String']>
  transaction_gte?: Maybe<Scalars['String']>
  transaction_in?: Maybe<Array<Scalars['String']>>
  transaction_lt?: Maybe<Scalars['String']>
  transaction_lte?: Maybe<Scalars['String']>
  transaction_not?: Maybe<Scalars['String']>
  transaction_not_contains?: Maybe<Scalars['String']>
  transaction_not_ends_with?: Maybe<Scalars['String']>
  transaction_not_in?: Maybe<Array<Scalars['String']>>
  transaction_not_starts_with?: Maybe<Scalars['String']>
  transaction_starts_with?: Maybe<Scalars['String']>
}

export enum V3polygon_Collect_OrderBy {
  Amount0 = 'amount0',
  Amount1 = 'amount1',
  AmountUsd = 'amountUSD',
  Id = 'id',
  LogIndex = 'logIndex',
  Owner = 'owner',
  Pool = 'pool',
  TickLower = 'tickLower',
  TickUpper = 'tickUpper',
  Timestamp = 'timestamp',
  Transaction = 'transaction',
}

export type V3polygon_Factory = {
  __typename?: 'v3polygon_Factory'
  id: Scalars['ID']
  owner: Scalars['ID']
  poolCount: Scalars['v3polygon_BigInt']
  totalFeesETH: Scalars['v3polygon_BigDecimal']
  totalFeesUSD: Scalars['v3polygon_BigDecimal']
  totalValueLockedETH: Scalars['v3polygon_BigDecimal']
  totalValueLockedETHUntracked: Scalars['v3polygon_BigDecimal']
  totalValueLockedUSD: Scalars['v3polygon_BigDecimal']
  totalValueLockedUSDUntracked: Scalars['v3polygon_BigDecimal']
  totalVolumeETH: Scalars['v3polygon_BigDecimal']
  totalVolumeUSD: Scalars['v3polygon_BigDecimal']
  txCount: Scalars['v3polygon_BigInt']
  untrackedVolumeUSD: Scalars['v3polygon_BigDecimal']
}

export type V3polygon_Factory_Filter = {
  id?: Maybe<Scalars['ID']>
  id_gt?: Maybe<Scalars['ID']>
  id_gte?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  id_lt?: Maybe<Scalars['ID']>
  id_lte?: Maybe<Scalars['ID']>
  id_not?: Maybe<Scalars['ID']>
  id_not_in?: Maybe<Array<Scalars['ID']>>
  owner?: Maybe<Scalars['ID']>
  owner_gt?: Maybe<Scalars['ID']>
  owner_gte?: Maybe<Scalars['ID']>
  owner_in?: Maybe<Array<Scalars['ID']>>
  owner_lt?: Maybe<Scalars['ID']>
  owner_lte?: Maybe<Scalars['ID']>
  owner_not?: Maybe<Scalars['ID']>
  owner_not_in?: Maybe<Array<Scalars['ID']>>
  poolCount?: Maybe<Scalars['v3polygon_BigInt']>
  poolCount_gt?: Maybe<Scalars['v3polygon_BigInt']>
  poolCount_gte?: Maybe<Scalars['v3polygon_BigInt']>
  poolCount_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  poolCount_lt?: Maybe<Scalars['v3polygon_BigInt']>
  poolCount_lte?: Maybe<Scalars['v3polygon_BigInt']>
  poolCount_not?: Maybe<Scalars['v3polygon_BigInt']>
  poolCount_not_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  totalFeesETH?: Maybe<Scalars['v3polygon_BigDecimal']>
  totalFeesETH_gt?: Maybe<Scalars['v3polygon_BigDecimal']>
  totalFeesETH_gte?: Maybe<Scalars['v3polygon_BigDecimal']>
  totalFeesETH_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  totalFeesETH_lt?: Maybe<Scalars['v3polygon_BigDecimal']>
  totalFeesETH_lte?: Maybe<Scalars['v3polygon_BigDecimal']>
  totalFeesETH_not?: Maybe<Scalars['v3polygon_BigDecimal']>
  totalFeesETH_not_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  totalFeesUSD?: Maybe<Scalars['v3polygon_BigDecimal']>
  totalFeesUSD_gt?: Maybe<Scalars['v3polygon_BigDecimal']>
  totalFeesUSD_gte?: Maybe<Scalars['v3polygon_BigDecimal']>
  totalFeesUSD_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  totalFeesUSD_lt?: Maybe<Scalars['v3polygon_BigDecimal']>
  totalFeesUSD_lte?: Maybe<Scalars['v3polygon_BigDecimal']>
  totalFeesUSD_not?: Maybe<Scalars['v3polygon_BigDecimal']>
  totalFeesUSD_not_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  totalValueLockedETH?: Maybe<Scalars['v3polygon_BigDecimal']>
  totalValueLockedETHUntracked?: Maybe<Scalars['v3polygon_BigDecimal']>
  totalValueLockedETHUntracked_gt?: Maybe<Scalars['v3polygon_BigDecimal']>
  totalValueLockedETHUntracked_gte?: Maybe<Scalars['v3polygon_BigDecimal']>
  totalValueLockedETHUntracked_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  totalValueLockedETHUntracked_lt?: Maybe<Scalars['v3polygon_BigDecimal']>
  totalValueLockedETHUntracked_lte?: Maybe<Scalars['v3polygon_BigDecimal']>
  totalValueLockedETHUntracked_not?: Maybe<Scalars['v3polygon_BigDecimal']>
  totalValueLockedETHUntracked_not_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  totalValueLockedETH_gt?: Maybe<Scalars['v3polygon_BigDecimal']>
  totalValueLockedETH_gte?: Maybe<Scalars['v3polygon_BigDecimal']>
  totalValueLockedETH_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  totalValueLockedETH_lt?: Maybe<Scalars['v3polygon_BigDecimal']>
  totalValueLockedETH_lte?: Maybe<Scalars['v3polygon_BigDecimal']>
  totalValueLockedETH_not?: Maybe<Scalars['v3polygon_BigDecimal']>
  totalValueLockedETH_not_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  totalValueLockedUSD?: Maybe<Scalars['v3polygon_BigDecimal']>
  totalValueLockedUSDUntracked?: Maybe<Scalars['v3polygon_BigDecimal']>
  totalValueLockedUSDUntracked_gt?: Maybe<Scalars['v3polygon_BigDecimal']>
  totalValueLockedUSDUntracked_gte?: Maybe<Scalars['v3polygon_BigDecimal']>
  totalValueLockedUSDUntracked_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  totalValueLockedUSDUntracked_lt?: Maybe<Scalars['v3polygon_BigDecimal']>
  totalValueLockedUSDUntracked_lte?: Maybe<Scalars['v3polygon_BigDecimal']>
  totalValueLockedUSDUntracked_not?: Maybe<Scalars['v3polygon_BigDecimal']>
  totalValueLockedUSDUntracked_not_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  totalValueLockedUSD_gt?: Maybe<Scalars['v3polygon_BigDecimal']>
  totalValueLockedUSD_gte?: Maybe<Scalars['v3polygon_BigDecimal']>
  totalValueLockedUSD_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  totalValueLockedUSD_lt?: Maybe<Scalars['v3polygon_BigDecimal']>
  totalValueLockedUSD_lte?: Maybe<Scalars['v3polygon_BigDecimal']>
  totalValueLockedUSD_not?: Maybe<Scalars['v3polygon_BigDecimal']>
  totalValueLockedUSD_not_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  totalVolumeETH?: Maybe<Scalars['v3polygon_BigDecimal']>
  totalVolumeETH_gt?: Maybe<Scalars['v3polygon_BigDecimal']>
  totalVolumeETH_gte?: Maybe<Scalars['v3polygon_BigDecimal']>
  totalVolumeETH_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  totalVolumeETH_lt?: Maybe<Scalars['v3polygon_BigDecimal']>
  totalVolumeETH_lte?: Maybe<Scalars['v3polygon_BigDecimal']>
  totalVolumeETH_not?: Maybe<Scalars['v3polygon_BigDecimal']>
  totalVolumeETH_not_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  totalVolumeUSD?: Maybe<Scalars['v3polygon_BigDecimal']>
  totalVolumeUSD_gt?: Maybe<Scalars['v3polygon_BigDecimal']>
  totalVolumeUSD_gte?: Maybe<Scalars['v3polygon_BigDecimal']>
  totalVolumeUSD_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  totalVolumeUSD_lt?: Maybe<Scalars['v3polygon_BigDecimal']>
  totalVolumeUSD_lte?: Maybe<Scalars['v3polygon_BigDecimal']>
  totalVolumeUSD_not?: Maybe<Scalars['v3polygon_BigDecimal']>
  totalVolumeUSD_not_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  txCount?: Maybe<Scalars['v3polygon_BigInt']>
  txCount_gt?: Maybe<Scalars['v3polygon_BigInt']>
  txCount_gte?: Maybe<Scalars['v3polygon_BigInt']>
  txCount_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  txCount_lt?: Maybe<Scalars['v3polygon_BigInt']>
  txCount_lte?: Maybe<Scalars['v3polygon_BigInt']>
  txCount_not?: Maybe<Scalars['v3polygon_BigInt']>
  txCount_not_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  untrackedVolumeUSD?: Maybe<Scalars['v3polygon_BigDecimal']>
  untrackedVolumeUSD_gt?: Maybe<Scalars['v3polygon_BigDecimal']>
  untrackedVolumeUSD_gte?: Maybe<Scalars['v3polygon_BigDecimal']>
  untrackedVolumeUSD_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  untrackedVolumeUSD_lt?: Maybe<Scalars['v3polygon_BigDecimal']>
  untrackedVolumeUSD_lte?: Maybe<Scalars['v3polygon_BigDecimal']>
  untrackedVolumeUSD_not?: Maybe<Scalars['v3polygon_BigDecimal']>
  untrackedVolumeUSD_not_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
}

export enum V3polygon_Factory_OrderBy {
  Id = 'id',
  Owner = 'owner',
  PoolCount = 'poolCount',
  TotalFeesEth = 'totalFeesETH',
  TotalFeesUsd = 'totalFeesUSD',
  TotalValueLockedEth = 'totalValueLockedETH',
  TotalValueLockedEthUntracked = 'totalValueLockedETHUntracked',
  TotalValueLockedUsd = 'totalValueLockedUSD',
  TotalValueLockedUsdUntracked = 'totalValueLockedUSDUntracked',
  TotalVolumeEth = 'totalVolumeETH',
  TotalVolumeUsd = 'totalVolumeUSD',
  TxCount = 'txCount',
  UntrackedVolumeUsd = 'untrackedVolumeUSD',
}

export type V3polygon_Flash = {
  __typename?: 'v3polygon_Flash'
  amount0: Scalars['v3polygon_BigDecimal']
  amount0Paid: Scalars['v3polygon_BigDecimal']
  amount1: Scalars['v3polygon_BigDecimal']
  amount1Paid: Scalars['v3polygon_BigDecimal']
  amountUSD: Scalars['v3polygon_BigDecimal']
  id: Scalars['ID']
  logIndex?: Maybe<Scalars['v3polygon_BigInt']>
  pool: V3polygon_Pool
  recipient: Scalars['v3polygon_Bytes']
  sender: Scalars['v3polygon_Bytes']
  timestamp: Scalars['v3polygon_BigInt']
  transaction: V3polygon_Transaction
}

export type V3polygon_Flash_Filter = {
  amount0?: Maybe<Scalars['v3polygon_BigDecimal']>
  amount0Paid?: Maybe<Scalars['v3polygon_BigDecimal']>
  amount0Paid_gt?: Maybe<Scalars['v3polygon_BigDecimal']>
  amount0Paid_gte?: Maybe<Scalars['v3polygon_BigDecimal']>
  amount0Paid_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  amount0Paid_lt?: Maybe<Scalars['v3polygon_BigDecimal']>
  amount0Paid_lte?: Maybe<Scalars['v3polygon_BigDecimal']>
  amount0Paid_not?: Maybe<Scalars['v3polygon_BigDecimal']>
  amount0Paid_not_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  amount0_gt?: Maybe<Scalars['v3polygon_BigDecimal']>
  amount0_gte?: Maybe<Scalars['v3polygon_BigDecimal']>
  amount0_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  amount0_lt?: Maybe<Scalars['v3polygon_BigDecimal']>
  amount0_lte?: Maybe<Scalars['v3polygon_BigDecimal']>
  amount0_not?: Maybe<Scalars['v3polygon_BigDecimal']>
  amount0_not_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  amount1?: Maybe<Scalars['v3polygon_BigDecimal']>
  amount1Paid?: Maybe<Scalars['v3polygon_BigDecimal']>
  amount1Paid_gt?: Maybe<Scalars['v3polygon_BigDecimal']>
  amount1Paid_gte?: Maybe<Scalars['v3polygon_BigDecimal']>
  amount1Paid_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  amount1Paid_lt?: Maybe<Scalars['v3polygon_BigDecimal']>
  amount1Paid_lte?: Maybe<Scalars['v3polygon_BigDecimal']>
  amount1Paid_not?: Maybe<Scalars['v3polygon_BigDecimal']>
  amount1Paid_not_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  amount1_gt?: Maybe<Scalars['v3polygon_BigDecimal']>
  amount1_gte?: Maybe<Scalars['v3polygon_BigDecimal']>
  amount1_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  amount1_lt?: Maybe<Scalars['v3polygon_BigDecimal']>
  amount1_lte?: Maybe<Scalars['v3polygon_BigDecimal']>
  amount1_not?: Maybe<Scalars['v3polygon_BigDecimal']>
  amount1_not_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  amountUSD?: Maybe<Scalars['v3polygon_BigDecimal']>
  amountUSD_gt?: Maybe<Scalars['v3polygon_BigDecimal']>
  amountUSD_gte?: Maybe<Scalars['v3polygon_BigDecimal']>
  amountUSD_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  amountUSD_lt?: Maybe<Scalars['v3polygon_BigDecimal']>
  amountUSD_lte?: Maybe<Scalars['v3polygon_BigDecimal']>
  amountUSD_not?: Maybe<Scalars['v3polygon_BigDecimal']>
  amountUSD_not_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  id?: Maybe<Scalars['ID']>
  id_gt?: Maybe<Scalars['ID']>
  id_gte?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  id_lt?: Maybe<Scalars['ID']>
  id_lte?: Maybe<Scalars['ID']>
  id_not?: Maybe<Scalars['ID']>
  id_not_in?: Maybe<Array<Scalars['ID']>>
  logIndex?: Maybe<Scalars['v3polygon_BigInt']>
  logIndex_gt?: Maybe<Scalars['v3polygon_BigInt']>
  logIndex_gte?: Maybe<Scalars['v3polygon_BigInt']>
  logIndex_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  logIndex_lt?: Maybe<Scalars['v3polygon_BigInt']>
  logIndex_lte?: Maybe<Scalars['v3polygon_BigInt']>
  logIndex_not?: Maybe<Scalars['v3polygon_BigInt']>
  logIndex_not_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  pool?: Maybe<Scalars['String']>
  pool_contains?: Maybe<Scalars['String']>
  pool_ends_with?: Maybe<Scalars['String']>
  pool_gt?: Maybe<Scalars['String']>
  pool_gte?: Maybe<Scalars['String']>
  pool_in?: Maybe<Array<Scalars['String']>>
  pool_lt?: Maybe<Scalars['String']>
  pool_lte?: Maybe<Scalars['String']>
  pool_not?: Maybe<Scalars['String']>
  pool_not_contains?: Maybe<Scalars['String']>
  pool_not_ends_with?: Maybe<Scalars['String']>
  pool_not_in?: Maybe<Array<Scalars['String']>>
  pool_not_starts_with?: Maybe<Scalars['String']>
  pool_starts_with?: Maybe<Scalars['String']>
  recipient?: Maybe<Scalars['v3polygon_Bytes']>
  recipient_contains?: Maybe<Scalars['v3polygon_Bytes']>
  recipient_in?: Maybe<Array<Scalars['v3polygon_Bytes']>>
  recipient_not?: Maybe<Scalars['v3polygon_Bytes']>
  recipient_not_contains?: Maybe<Scalars['v3polygon_Bytes']>
  recipient_not_in?: Maybe<Array<Scalars['v3polygon_Bytes']>>
  sender?: Maybe<Scalars['v3polygon_Bytes']>
  sender_contains?: Maybe<Scalars['v3polygon_Bytes']>
  sender_in?: Maybe<Array<Scalars['v3polygon_Bytes']>>
  sender_not?: Maybe<Scalars['v3polygon_Bytes']>
  sender_not_contains?: Maybe<Scalars['v3polygon_Bytes']>
  sender_not_in?: Maybe<Array<Scalars['v3polygon_Bytes']>>
  timestamp?: Maybe<Scalars['v3polygon_BigInt']>
  timestamp_gt?: Maybe<Scalars['v3polygon_BigInt']>
  timestamp_gte?: Maybe<Scalars['v3polygon_BigInt']>
  timestamp_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  timestamp_lt?: Maybe<Scalars['v3polygon_BigInt']>
  timestamp_lte?: Maybe<Scalars['v3polygon_BigInt']>
  timestamp_not?: Maybe<Scalars['v3polygon_BigInt']>
  timestamp_not_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  transaction?: Maybe<Scalars['String']>
  transaction_contains?: Maybe<Scalars['String']>
  transaction_ends_with?: Maybe<Scalars['String']>
  transaction_gt?: Maybe<Scalars['String']>
  transaction_gte?: Maybe<Scalars['String']>
  transaction_in?: Maybe<Array<Scalars['String']>>
  transaction_lt?: Maybe<Scalars['String']>
  transaction_lte?: Maybe<Scalars['String']>
  transaction_not?: Maybe<Scalars['String']>
  transaction_not_contains?: Maybe<Scalars['String']>
  transaction_not_ends_with?: Maybe<Scalars['String']>
  transaction_not_in?: Maybe<Array<Scalars['String']>>
  transaction_not_starts_with?: Maybe<Scalars['String']>
  transaction_starts_with?: Maybe<Scalars['String']>
}

export enum V3polygon_Flash_OrderBy {
  Amount0 = 'amount0',
  Amount0Paid = 'amount0Paid',
  Amount1 = 'amount1',
  Amount1Paid = 'amount1Paid',
  AmountUsd = 'amountUSD',
  Id = 'id',
  LogIndex = 'logIndex',
  Pool = 'pool',
  Recipient = 'recipient',
  Sender = 'sender',
  Timestamp = 'timestamp',
  Transaction = 'transaction',
}

export type V3polygon_Mint = {
  __typename?: 'v3polygon_Mint'
  amount: Scalars['v3polygon_BigInt']
  amount0: Scalars['v3polygon_BigDecimal']
  amount1: Scalars['v3polygon_BigDecimal']
  amountUSD?: Maybe<Scalars['v3polygon_BigDecimal']>
  id: Scalars['ID']
  logIndex?: Maybe<Scalars['v3polygon_BigInt']>
  origin: Scalars['v3polygon_Bytes']
  owner: Scalars['v3polygon_Bytes']
  pool: V3polygon_Pool
  sender?: Maybe<Scalars['v3polygon_Bytes']>
  tickLower: Scalars['v3polygon_BigInt']
  tickUpper: Scalars['v3polygon_BigInt']
  timestamp: Scalars['v3polygon_BigInt']
  token0: V3polygon_Token
  token1: V3polygon_Token
  transaction: V3polygon_Transaction
}

export type V3polygon_Mint_Filter = {
  amount?: Maybe<Scalars['v3polygon_BigInt']>
  amount0?: Maybe<Scalars['v3polygon_BigDecimal']>
  amount0_gt?: Maybe<Scalars['v3polygon_BigDecimal']>
  amount0_gte?: Maybe<Scalars['v3polygon_BigDecimal']>
  amount0_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  amount0_lt?: Maybe<Scalars['v3polygon_BigDecimal']>
  amount0_lte?: Maybe<Scalars['v3polygon_BigDecimal']>
  amount0_not?: Maybe<Scalars['v3polygon_BigDecimal']>
  amount0_not_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  amount1?: Maybe<Scalars['v3polygon_BigDecimal']>
  amount1_gt?: Maybe<Scalars['v3polygon_BigDecimal']>
  amount1_gte?: Maybe<Scalars['v3polygon_BigDecimal']>
  amount1_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  amount1_lt?: Maybe<Scalars['v3polygon_BigDecimal']>
  amount1_lte?: Maybe<Scalars['v3polygon_BigDecimal']>
  amount1_not?: Maybe<Scalars['v3polygon_BigDecimal']>
  amount1_not_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  amountUSD?: Maybe<Scalars['v3polygon_BigDecimal']>
  amountUSD_gt?: Maybe<Scalars['v3polygon_BigDecimal']>
  amountUSD_gte?: Maybe<Scalars['v3polygon_BigDecimal']>
  amountUSD_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  amountUSD_lt?: Maybe<Scalars['v3polygon_BigDecimal']>
  amountUSD_lte?: Maybe<Scalars['v3polygon_BigDecimal']>
  amountUSD_not?: Maybe<Scalars['v3polygon_BigDecimal']>
  amountUSD_not_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  amount_gt?: Maybe<Scalars['v3polygon_BigInt']>
  amount_gte?: Maybe<Scalars['v3polygon_BigInt']>
  amount_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  amount_lt?: Maybe<Scalars['v3polygon_BigInt']>
  amount_lte?: Maybe<Scalars['v3polygon_BigInt']>
  amount_not?: Maybe<Scalars['v3polygon_BigInt']>
  amount_not_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  id?: Maybe<Scalars['ID']>
  id_gt?: Maybe<Scalars['ID']>
  id_gte?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  id_lt?: Maybe<Scalars['ID']>
  id_lte?: Maybe<Scalars['ID']>
  id_not?: Maybe<Scalars['ID']>
  id_not_in?: Maybe<Array<Scalars['ID']>>
  logIndex?: Maybe<Scalars['v3polygon_BigInt']>
  logIndex_gt?: Maybe<Scalars['v3polygon_BigInt']>
  logIndex_gte?: Maybe<Scalars['v3polygon_BigInt']>
  logIndex_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  logIndex_lt?: Maybe<Scalars['v3polygon_BigInt']>
  logIndex_lte?: Maybe<Scalars['v3polygon_BigInt']>
  logIndex_not?: Maybe<Scalars['v3polygon_BigInt']>
  logIndex_not_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  origin?: Maybe<Scalars['v3polygon_Bytes']>
  origin_contains?: Maybe<Scalars['v3polygon_Bytes']>
  origin_in?: Maybe<Array<Scalars['v3polygon_Bytes']>>
  origin_not?: Maybe<Scalars['v3polygon_Bytes']>
  origin_not_contains?: Maybe<Scalars['v3polygon_Bytes']>
  origin_not_in?: Maybe<Array<Scalars['v3polygon_Bytes']>>
  owner?: Maybe<Scalars['v3polygon_Bytes']>
  owner_contains?: Maybe<Scalars['v3polygon_Bytes']>
  owner_in?: Maybe<Array<Scalars['v3polygon_Bytes']>>
  owner_not?: Maybe<Scalars['v3polygon_Bytes']>
  owner_not_contains?: Maybe<Scalars['v3polygon_Bytes']>
  owner_not_in?: Maybe<Array<Scalars['v3polygon_Bytes']>>
  pool?: Maybe<Scalars['String']>
  pool_contains?: Maybe<Scalars['String']>
  pool_ends_with?: Maybe<Scalars['String']>
  pool_gt?: Maybe<Scalars['String']>
  pool_gte?: Maybe<Scalars['String']>
  pool_in?: Maybe<Array<Scalars['String']>>
  pool_lt?: Maybe<Scalars['String']>
  pool_lte?: Maybe<Scalars['String']>
  pool_not?: Maybe<Scalars['String']>
  pool_not_contains?: Maybe<Scalars['String']>
  pool_not_ends_with?: Maybe<Scalars['String']>
  pool_not_in?: Maybe<Array<Scalars['String']>>
  pool_not_starts_with?: Maybe<Scalars['String']>
  pool_starts_with?: Maybe<Scalars['String']>
  sender?: Maybe<Scalars['v3polygon_Bytes']>
  sender_contains?: Maybe<Scalars['v3polygon_Bytes']>
  sender_in?: Maybe<Array<Scalars['v3polygon_Bytes']>>
  sender_not?: Maybe<Scalars['v3polygon_Bytes']>
  sender_not_contains?: Maybe<Scalars['v3polygon_Bytes']>
  sender_not_in?: Maybe<Array<Scalars['v3polygon_Bytes']>>
  tickLower?: Maybe<Scalars['v3polygon_BigInt']>
  tickLower_gt?: Maybe<Scalars['v3polygon_BigInt']>
  tickLower_gte?: Maybe<Scalars['v3polygon_BigInt']>
  tickLower_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  tickLower_lt?: Maybe<Scalars['v3polygon_BigInt']>
  tickLower_lte?: Maybe<Scalars['v3polygon_BigInt']>
  tickLower_not?: Maybe<Scalars['v3polygon_BigInt']>
  tickLower_not_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  tickUpper?: Maybe<Scalars['v3polygon_BigInt']>
  tickUpper_gt?: Maybe<Scalars['v3polygon_BigInt']>
  tickUpper_gte?: Maybe<Scalars['v3polygon_BigInt']>
  tickUpper_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  tickUpper_lt?: Maybe<Scalars['v3polygon_BigInt']>
  tickUpper_lte?: Maybe<Scalars['v3polygon_BigInt']>
  tickUpper_not?: Maybe<Scalars['v3polygon_BigInt']>
  tickUpper_not_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  timestamp?: Maybe<Scalars['v3polygon_BigInt']>
  timestamp_gt?: Maybe<Scalars['v3polygon_BigInt']>
  timestamp_gte?: Maybe<Scalars['v3polygon_BigInt']>
  timestamp_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  timestamp_lt?: Maybe<Scalars['v3polygon_BigInt']>
  timestamp_lte?: Maybe<Scalars['v3polygon_BigInt']>
  timestamp_not?: Maybe<Scalars['v3polygon_BigInt']>
  timestamp_not_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  token0?: Maybe<Scalars['String']>
  token0_contains?: Maybe<Scalars['String']>
  token0_ends_with?: Maybe<Scalars['String']>
  token0_gt?: Maybe<Scalars['String']>
  token0_gte?: Maybe<Scalars['String']>
  token0_in?: Maybe<Array<Scalars['String']>>
  token0_lt?: Maybe<Scalars['String']>
  token0_lte?: Maybe<Scalars['String']>
  token0_not?: Maybe<Scalars['String']>
  token0_not_contains?: Maybe<Scalars['String']>
  token0_not_ends_with?: Maybe<Scalars['String']>
  token0_not_in?: Maybe<Array<Scalars['String']>>
  token0_not_starts_with?: Maybe<Scalars['String']>
  token0_starts_with?: Maybe<Scalars['String']>
  token1?: Maybe<Scalars['String']>
  token1_contains?: Maybe<Scalars['String']>
  token1_ends_with?: Maybe<Scalars['String']>
  token1_gt?: Maybe<Scalars['String']>
  token1_gte?: Maybe<Scalars['String']>
  token1_in?: Maybe<Array<Scalars['String']>>
  token1_lt?: Maybe<Scalars['String']>
  token1_lte?: Maybe<Scalars['String']>
  token1_not?: Maybe<Scalars['String']>
  token1_not_contains?: Maybe<Scalars['String']>
  token1_not_ends_with?: Maybe<Scalars['String']>
  token1_not_in?: Maybe<Array<Scalars['String']>>
  token1_not_starts_with?: Maybe<Scalars['String']>
  token1_starts_with?: Maybe<Scalars['String']>
  transaction?: Maybe<Scalars['String']>
  transaction_contains?: Maybe<Scalars['String']>
  transaction_ends_with?: Maybe<Scalars['String']>
  transaction_gt?: Maybe<Scalars['String']>
  transaction_gte?: Maybe<Scalars['String']>
  transaction_in?: Maybe<Array<Scalars['String']>>
  transaction_lt?: Maybe<Scalars['String']>
  transaction_lte?: Maybe<Scalars['String']>
  transaction_not?: Maybe<Scalars['String']>
  transaction_not_contains?: Maybe<Scalars['String']>
  transaction_not_ends_with?: Maybe<Scalars['String']>
  transaction_not_in?: Maybe<Array<Scalars['String']>>
  transaction_not_starts_with?: Maybe<Scalars['String']>
  transaction_starts_with?: Maybe<Scalars['String']>
}

export enum V3polygon_Mint_OrderBy {
  Amount = 'amount',
  Amount0 = 'amount0',
  Amount1 = 'amount1',
  AmountUsd = 'amountUSD',
  Id = 'id',
  LogIndex = 'logIndex',
  Origin = 'origin',
  Owner = 'owner',
  Pool = 'pool',
  Sender = 'sender',
  TickLower = 'tickLower',
  TickUpper = 'tickUpper',
  Timestamp = 'timestamp',
  Token0 = 'token0',
  Token1 = 'token1',
  Transaction = 'transaction',
}

export enum V3polygon_OrderDirection {
  Asc = 'asc',
  Desc = 'desc',
}

export type V3polygon_Pool = {
  __typename?: 'v3polygon_Pool'
  burns: Array<V3polygon_Burn>
  collectedFeesToken0: Scalars['v3polygon_BigDecimal']
  collectedFeesToken1: Scalars['v3polygon_BigDecimal']
  collectedFeesUSD: Scalars['v3polygon_BigDecimal']
  collects: Array<V3polygon_Collect>
  createdAtBlockNumber: Scalars['v3polygon_BigInt']
  createdAtTimestamp: Scalars['v3polygon_BigInt']
  feeGrowthGlobal0X128: Scalars['v3polygon_BigInt']
  feeGrowthGlobal1X128: Scalars['v3polygon_BigInt']
  feeTier: Scalars['v3polygon_BigInt']
  feesUSD: Scalars['v3polygon_BigDecimal']
  id: Scalars['ID']
  liquidity: Scalars['v3polygon_BigInt']
  liquidityProviderCount: Scalars['v3polygon_BigInt']
  mints: Array<V3polygon_Mint>
  observationIndex: Scalars['v3polygon_BigInt']
  poolDayData: Array<V3polygon_PoolDayData>
  poolHourData: Array<V3polygon_PoolHourData>
  sqrtPrice: Scalars['v3polygon_BigInt']
  swaps: Array<V3polygon_Swap>
  tick?: Maybe<Scalars['v3polygon_BigInt']>
  ticks: Array<V3polygon_Tick>
  token0: V3polygon_Token
  token0Price: Scalars['v3polygon_BigDecimal']
  token1: V3polygon_Token
  token1Price: Scalars['v3polygon_BigDecimal']
  totalValueLockedETH: Scalars['v3polygon_BigDecimal']
  totalValueLockedToken0: Scalars['v3polygon_BigDecimal']
  totalValueLockedToken1: Scalars['v3polygon_BigDecimal']
  totalValueLockedUSD: Scalars['v3polygon_BigDecimal']
  totalValueLockedUSDUntracked: Scalars['v3polygon_BigDecimal']
  txCount: Scalars['v3polygon_BigInt']
  untrackedVolumeUSD: Scalars['v3polygon_BigDecimal']
  volumeToken0: Scalars['v3polygon_BigDecimal']
  volumeToken1: Scalars['v3polygon_BigDecimal']
  volumeUSD: Scalars['v3polygon_BigDecimal']
}

export type V3polygon_PoolBurnsArgs = {
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3polygon_Burn_OrderBy>
  orderDirection?: Maybe<V3polygon_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  where?: Maybe<V3polygon_Burn_Filter>
}

export type V3polygon_PoolCollectsArgs = {
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3polygon_Collect_OrderBy>
  orderDirection?: Maybe<V3polygon_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  where?: Maybe<V3polygon_Collect_Filter>
}

export type V3polygon_PoolMintsArgs = {
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3polygon_Mint_OrderBy>
  orderDirection?: Maybe<V3polygon_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  where?: Maybe<V3polygon_Mint_Filter>
}

export type V3polygon_PoolPoolDayDataArgs = {
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3polygon_PoolDayData_OrderBy>
  orderDirection?: Maybe<V3polygon_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  where?: Maybe<V3polygon_PoolDayData_Filter>
}

export type V3polygon_PoolPoolHourDataArgs = {
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3polygon_PoolHourData_OrderBy>
  orderDirection?: Maybe<V3polygon_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  where?: Maybe<V3polygon_PoolHourData_Filter>
}

export type V3polygon_PoolSwapsArgs = {
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3polygon_Swap_OrderBy>
  orderDirection?: Maybe<V3polygon_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  where?: Maybe<V3polygon_Swap_Filter>
}

export type V3polygon_PoolTicksArgs = {
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3polygon_Tick_OrderBy>
  orderDirection?: Maybe<V3polygon_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  where?: Maybe<V3polygon_Tick_Filter>
}

export type V3polygon_PoolDayData = {
  __typename?: 'v3polygon_PoolDayData'
  close: Scalars['v3polygon_BigDecimal']
  date: Scalars['Int']
  feeGrowthGlobal0X128: Scalars['v3polygon_BigInt']
  feeGrowthGlobal1X128: Scalars['v3polygon_BigInt']
  feesUSD: Scalars['v3polygon_BigDecimal']
  high: Scalars['v3polygon_BigDecimal']
  id: Scalars['ID']
  liquidity: Scalars['v3polygon_BigInt']
  low: Scalars['v3polygon_BigDecimal']
  open: Scalars['v3polygon_BigDecimal']
  pool: V3polygon_Pool
  sqrtPrice: Scalars['v3polygon_BigInt']
  tick?: Maybe<Scalars['v3polygon_BigInt']>
  token0Price: Scalars['v3polygon_BigDecimal']
  token1Price: Scalars['v3polygon_BigDecimal']
  tvlUSD: Scalars['v3polygon_BigDecimal']
  txCount: Scalars['v3polygon_BigInt']
  volumeToken0: Scalars['v3polygon_BigDecimal']
  volumeToken1: Scalars['v3polygon_BigDecimal']
  volumeUSD: Scalars['v3polygon_BigDecimal']
}

export type V3polygon_PoolDayData_Filter = {
  close?: Maybe<Scalars['v3polygon_BigDecimal']>
  close_gt?: Maybe<Scalars['v3polygon_BigDecimal']>
  close_gte?: Maybe<Scalars['v3polygon_BigDecimal']>
  close_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  close_lt?: Maybe<Scalars['v3polygon_BigDecimal']>
  close_lte?: Maybe<Scalars['v3polygon_BigDecimal']>
  close_not?: Maybe<Scalars['v3polygon_BigDecimal']>
  close_not_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  date?: Maybe<Scalars['Int']>
  date_gt?: Maybe<Scalars['Int']>
  date_gte?: Maybe<Scalars['Int']>
  date_in?: Maybe<Array<Scalars['Int']>>
  date_lt?: Maybe<Scalars['Int']>
  date_lte?: Maybe<Scalars['Int']>
  date_not?: Maybe<Scalars['Int']>
  date_not_in?: Maybe<Array<Scalars['Int']>>
  feeGrowthGlobal0X128?: Maybe<Scalars['v3polygon_BigInt']>
  feeGrowthGlobal0X128_gt?: Maybe<Scalars['v3polygon_BigInt']>
  feeGrowthGlobal0X128_gte?: Maybe<Scalars['v3polygon_BigInt']>
  feeGrowthGlobal0X128_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  feeGrowthGlobal0X128_lt?: Maybe<Scalars['v3polygon_BigInt']>
  feeGrowthGlobal0X128_lte?: Maybe<Scalars['v3polygon_BigInt']>
  feeGrowthGlobal0X128_not?: Maybe<Scalars['v3polygon_BigInt']>
  feeGrowthGlobal0X128_not_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  feeGrowthGlobal1X128?: Maybe<Scalars['v3polygon_BigInt']>
  feeGrowthGlobal1X128_gt?: Maybe<Scalars['v3polygon_BigInt']>
  feeGrowthGlobal1X128_gte?: Maybe<Scalars['v3polygon_BigInt']>
  feeGrowthGlobal1X128_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  feeGrowthGlobal1X128_lt?: Maybe<Scalars['v3polygon_BigInt']>
  feeGrowthGlobal1X128_lte?: Maybe<Scalars['v3polygon_BigInt']>
  feeGrowthGlobal1X128_not?: Maybe<Scalars['v3polygon_BigInt']>
  feeGrowthGlobal1X128_not_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  feesUSD?: Maybe<Scalars['v3polygon_BigDecimal']>
  feesUSD_gt?: Maybe<Scalars['v3polygon_BigDecimal']>
  feesUSD_gte?: Maybe<Scalars['v3polygon_BigDecimal']>
  feesUSD_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  feesUSD_lt?: Maybe<Scalars['v3polygon_BigDecimal']>
  feesUSD_lte?: Maybe<Scalars['v3polygon_BigDecimal']>
  feesUSD_not?: Maybe<Scalars['v3polygon_BigDecimal']>
  feesUSD_not_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  high?: Maybe<Scalars['v3polygon_BigDecimal']>
  high_gt?: Maybe<Scalars['v3polygon_BigDecimal']>
  high_gte?: Maybe<Scalars['v3polygon_BigDecimal']>
  high_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  high_lt?: Maybe<Scalars['v3polygon_BigDecimal']>
  high_lte?: Maybe<Scalars['v3polygon_BigDecimal']>
  high_not?: Maybe<Scalars['v3polygon_BigDecimal']>
  high_not_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  id?: Maybe<Scalars['ID']>
  id_gt?: Maybe<Scalars['ID']>
  id_gte?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  id_lt?: Maybe<Scalars['ID']>
  id_lte?: Maybe<Scalars['ID']>
  id_not?: Maybe<Scalars['ID']>
  id_not_in?: Maybe<Array<Scalars['ID']>>
  liquidity?: Maybe<Scalars['v3polygon_BigInt']>
  liquidity_gt?: Maybe<Scalars['v3polygon_BigInt']>
  liquidity_gte?: Maybe<Scalars['v3polygon_BigInt']>
  liquidity_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  liquidity_lt?: Maybe<Scalars['v3polygon_BigInt']>
  liquidity_lte?: Maybe<Scalars['v3polygon_BigInt']>
  liquidity_not?: Maybe<Scalars['v3polygon_BigInt']>
  liquidity_not_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  low?: Maybe<Scalars['v3polygon_BigDecimal']>
  low_gt?: Maybe<Scalars['v3polygon_BigDecimal']>
  low_gte?: Maybe<Scalars['v3polygon_BigDecimal']>
  low_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  low_lt?: Maybe<Scalars['v3polygon_BigDecimal']>
  low_lte?: Maybe<Scalars['v3polygon_BigDecimal']>
  low_not?: Maybe<Scalars['v3polygon_BigDecimal']>
  low_not_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  open?: Maybe<Scalars['v3polygon_BigDecimal']>
  open_gt?: Maybe<Scalars['v3polygon_BigDecimal']>
  open_gte?: Maybe<Scalars['v3polygon_BigDecimal']>
  open_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  open_lt?: Maybe<Scalars['v3polygon_BigDecimal']>
  open_lte?: Maybe<Scalars['v3polygon_BigDecimal']>
  open_not?: Maybe<Scalars['v3polygon_BigDecimal']>
  open_not_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  pool?: Maybe<Scalars['String']>
  pool_contains?: Maybe<Scalars['String']>
  pool_ends_with?: Maybe<Scalars['String']>
  pool_gt?: Maybe<Scalars['String']>
  pool_gte?: Maybe<Scalars['String']>
  pool_in?: Maybe<Array<Scalars['String']>>
  pool_lt?: Maybe<Scalars['String']>
  pool_lte?: Maybe<Scalars['String']>
  pool_not?: Maybe<Scalars['String']>
  pool_not_contains?: Maybe<Scalars['String']>
  pool_not_ends_with?: Maybe<Scalars['String']>
  pool_not_in?: Maybe<Array<Scalars['String']>>
  pool_not_starts_with?: Maybe<Scalars['String']>
  pool_starts_with?: Maybe<Scalars['String']>
  sqrtPrice?: Maybe<Scalars['v3polygon_BigInt']>
  sqrtPrice_gt?: Maybe<Scalars['v3polygon_BigInt']>
  sqrtPrice_gte?: Maybe<Scalars['v3polygon_BigInt']>
  sqrtPrice_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  sqrtPrice_lt?: Maybe<Scalars['v3polygon_BigInt']>
  sqrtPrice_lte?: Maybe<Scalars['v3polygon_BigInt']>
  sqrtPrice_not?: Maybe<Scalars['v3polygon_BigInt']>
  sqrtPrice_not_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  tick?: Maybe<Scalars['v3polygon_BigInt']>
  tick_gt?: Maybe<Scalars['v3polygon_BigInt']>
  tick_gte?: Maybe<Scalars['v3polygon_BigInt']>
  tick_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  tick_lt?: Maybe<Scalars['v3polygon_BigInt']>
  tick_lte?: Maybe<Scalars['v3polygon_BigInt']>
  tick_not?: Maybe<Scalars['v3polygon_BigInt']>
  tick_not_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  token0Price?: Maybe<Scalars['v3polygon_BigDecimal']>
  token0Price_gt?: Maybe<Scalars['v3polygon_BigDecimal']>
  token0Price_gte?: Maybe<Scalars['v3polygon_BigDecimal']>
  token0Price_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  token0Price_lt?: Maybe<Scalars['v3polygon_BigDecimal']>
  token0Price_lte?: Maybe<Scalars['v3polygon_BigDecimal']>
  token0Price_not?: Maybe<Scalars['v3polygon_BigDecimal']>
  token0Price_not_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  token1Price?: Maybe<Scalars['v3polygon_BigDecimal']>
  token1Price_gt?: Maybe<Scalars['v3polygon_BigDecimal']>
  token1Price_gte?: Maybe<Scalars['v3polygon_BigDecimal']>
  token1Price_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  token1Price_lt?: Maybe<Scalars['v3polygon_BigDecimal']>
  token1Price_lte?: Maybe<Scalars['v3polygon_BigDecimal']>
  token1Price_not?: Maybe<Scalars['v3polygon_BigDecimal']>
  token1Price_not_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  tvlUSD?: Maybe<Scalars['v3polygon_BigDecimal']>
  tvlUSD_gt?: Maybe<Scalars['v3polygon_BigDecimal']>
  tvlUSD_gte?: Maybe<Scalars['v3polygon_BigDecimal']>
  tvlUSD_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  tvlUSD_lt?: Maybe<Scalars['v3polygon_BigDecimal']>
  tvlUSD_lte?: Maybe<Scalars['v3polygon_BigDecimal']>
  tvlUSD_not?: Maybe<Scalars['v3polygon_BigDecimal']>
  tvlUSD_not_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  txCount?: Maybe<Scalars['v3polygon_BigInt']>
  txCount_gt?: Maybe<Scalars['v3polygon_BigInt']>
  txCount_gte?: Maybe<Scalars['v3polygon_BigInt']>
  txCount_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  txCount_lt?: Maybe<Scalars['v3polygon_BigInt']>
  txCount_lte?: Maybe<Scalars['v3polygon_BigInt']>
  txCount_not?: Maybe<Scalars['v3polygon_BigInt']>
  txCount_not_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  volumeToken0?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeToken0_gt?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeToken0_gte?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeToken0_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  volumeToken0_lt?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeToken0_lte?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeToken0_not?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeToken0_not_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  volumeToken1?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeToken1_gt?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeToken1_gte?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeToken1_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  volumeToken1_lt?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeToken1_lte?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeToken1_not?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeToken1_not_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  volumeUSD?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeUSD_gt?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeUSD_gte?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeUSD_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  volumeUSD_lt?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeUSD_lte?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeUSD_not?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeUSD_not_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
}

export enum V3polygon_PoolDayData_OrderBy {
  Close = 'close',
  Date = 'date',
  FeeGrowthGlobal0X128 = 'feeGrowthGlobal0X128',
  FeeGrowthGlobal1X128 = 'feeGrowthGlobal1X128',
  FeesUsd = 'feesUSD',
  High = 'high',
  Id = 'id',
  Liquidity = 'liquidity',
  Low = 'low',
  Open = 'open',
  Pool = 'pool',
  SqrtPrice = 'sqrtPrice',
  Tick = 'tick',
  Token0Price = 'token0Price',
  Token1Price = 'token1Price',
  TvlUsd = 'tvlUSD',
  TxCount = 'txCount',
  VolumeToken0 = 'volumeToken0',
  VolumeToken1 = 'volumeToken1',
  VolumeUsd = 'volumeUSD',
}

export type V3polygon_PoolHourData = {
  __typename?: 'v3polygon_PoolHourData'
  close: Scalars['v3polygon_BigDecimal']
  feeGrowthGlobal0X128: Scalars['v3polygon_BigInt']
  feeGrowthGlobal1X128: Scalars['v3polygon_BigInt']
  feesUSD: Scalars['v3polygon_BigDecimal']
  high: Scalars['v3polygon_BigDecimal']
  id: Scalars['ID']
  liquidity: Scalars['v3polygon_BigInt']
  low: Scalars['v3polygon_BigDecimal']
  open: Scalars['v3polygon_BigDecimal']
  periodStartUnix: Scalars['Int']
  pool: V3polygon_Pool
  sqrtPrice: Scalars['v3polygon_BigInt']
  tick?: Maybe<Scalars['v3polygon_BigInt']>
  token0Price: Scalars['v3polygon_BigDecimal']
  token1Price: Scalars['v3polygon_BigDecimal']
  tvlUSD: Scalars['v3polygon_BigDecimal']
  txCount: Scalars['v3polygon_BigInt']
  volumeToken0: Scalars['v3polygon_BigDecimal']
  volumeToken1: Scalars['v3polygon_BigDecimal']
  volumeUSD: Scalars['v3polygon_BigDecimal']
}

export type V3polygon_PoolHourData_Filter = {
  close?: Maybe<Scalars['v3polygon_BigDecimal']>
  close_gt?: Maybe<Scalars['v3polygon_BigDecimal']>
  close_gte?: Maybe<Scalars['v3polygon_BigDecimal']>
  close_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  close_lt?: Maybe<Scalars['v3polygon_BigDecimal']>
  close_lte?: Maybe<Scalars['v3polygon_BigDecimal']>
  close_not?: Maybe<Scalars['v3polygon_BigDecimal']>
  close_not_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  feeGrowthGlobal0X128?: Maybe<Scalars['v3polygon_BigInt']>
  feeGrowthGlobal0X128_gt?: Maybe<Scalars['v3polygon_BigInt']>
  feeGrowthGlobal0X128_gte?: Maybe<Scalars['v3polygon_BigInt']>
  feeGrowthGlobal0X128_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  feeGrowthGlobal0X128_lt?: Maybe<Scalars['v3polygon_BigInt']>
  feeGrowthGlobal0X128_lte?: Maybe<Scalars['v3polygon_BigInt']>
  feeGrowthGlobal0X128_not?: Maybe<Scalars['v3polygon_BigInt']>
  feeGrowthGlobal0X128_not_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  feeGrowthGlobal1X128?: Maybe<Scalars['v3polygon_BigInt']>
  feeGrowthGlobal1X128_gt?: Maybe<Scalars['v3polygon_BigInt']>
  feeGrowthGlobal1X128_gte?: Maybe<Scalars['v3polygon_BigInt']>
  feeGrowthGlobal1X128_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  feeGrowthGlobal1X128_lt?: Maybe<Scalars['v3polygon_BigInt']>
  feeGrowthGlobal1X128_lte?: Maybe<Scalars['v3polygon_BigInt']>
  feeGrowthGlobal1X128_not?: Maybe<Scalars['v3polygon_BigInt']>
  feeGrowthGlobal1X128_not_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  feesUSD?: Maybe<Scalars['v3polygon_BigDecimal']>
  feesUSD_gt?: Maybe<Scalars['v3polygon_BigDecimal']>
  feesUSD_gte?: Maybe<Scalars['v3polygon_BigDecimal']>
  feesUSD_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  feesUSD_lt?: Maybe<Scalars['v3polygon_BigDecimal']>
  feesUSD_lte?: Maybe<Scalars['v3polygon_BigDecimal']>
  feesUSD_not?: Maybe<Scalars['v3polygon_BigDecimal']>
  feesUSD_not_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  high?: Maybe<Scalars['v3polygon_BigDecimal']>
  high_gt?: Maybe<Scalars['v3polygon_BigDecimal']>
  high_gte?: Maybe<Scalars['v3polygon_BigDecimal']>
  high_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  high_lt?: Maybe<Scalars['v3polygon_BigDecimal']>
  high_lte?: Maybe<Scalars['v3polygon_BigDecimal']>
  high_not?: Maybe<Scalars['v3polygon_BigDecimal']>
  high_not_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  id?: Maybe<Scalars['ID']>
  id_gt?: Maybe<Scalars['ID']>
  id_gte?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  id_lt?: Maybe<Scalars['ID']>
  id_lte?: Maybe<Scalars['ID']>
  id_not?: Maybe<Scalars['ID']>
  id_not_in?: Maybe<Array<Scalars['ID']>>
  liquidity?: Maybe<Scalars['v3polygon_BigInt']>
  liquidity_gt?: Maybe<Scalars['v3polygon_BigInt']>
  liquidity_gte?: Maybe<Scalars['v3polygon_BigInt']>
  liquidity_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  liquidity_lt?: Maybe<Scalars['v3polygon_BigInt']>
  liquidity_lte?: Maybe<Scalars['v3polygon_BigInt']>
  liquidity_not?: Maybe<Scalars['v3polygon_BigInt']>
  liquidity_not_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  low?: Maybe<Scalars['v3polygon_BigDecimal']>
  low_gt?: Maybe<Scalars['v3polygon_BigDecimal']>
  low_gte?: Maybe<Scalars['v3polygon_BigDecimal']>
  low_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  low_lt?: Maybe<Scalars['v3polygon_BigDecimal']>
  low_lte?: Maybe<Scalars['v3polygon_BigDecimal']>
  low_not?: Maybe<Scalars['v3polygon_BigDecimal']>
  low_not_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  open?: Maybe<Scalars['v3polygon_BigDecimal']>
  open_gt?: Maybe<Scalars['v3polygon_BigDecimal']>
  open_gte?: Maybe<Scalars['v3polygon_BigDecimal']>
  open_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  open_lt?: Maybe<Scalars['v3polygon_BigDecimal']>
  open_lte?: Maybe<Scalars['v3polygon_BigDecimal']>
  open_not?: Maybe<Scalars['v3polygon_BigDecimal']>
  open_not_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  periodStartUnix?: Maybe<Scalars['Int']>
  periodStartUnix_gt?: Maybe<Scalars['Int']>
  periodStartUnix_gte?: Maybe<Scalars['Int']>
  periodStartUnix_in?: Maybe<Array<Scalars['Int']>>
  periodStartUnix_lt?: Maybe<Scalars['Int']>
  periodStartUnix_lte?: Maybe<Scalars['Int']>
  periodStartUnix_not?: Maybe<Scalars['Int']>
  periodStartUnix_not_in?: Maybe<Array<Scalars['Int']>>
  pool?: Maybe<Scalars['String']>
  pool_contains?: Maybe<Scalars['String']>
  pool_ends_with?: Maybe<Scalars['String']>
  pool_gt?: Maybe<Scalars['String']>
  pool_gte?: Maybe<Scalars['String']>
  pool_in?: Maybe<Array<Scalars['String']>>
  pool_lt?: Maybe<Scalars['String']>
  pool_lte?: Maybe<Scalars['String']>
  pool_not?: Maybe<Scalars['String']>
  pool_not_contains?: Maybe<Scalars['String']>
  pool_not_ends_with?: Maybe<Scalars['String']>
  pool_not_in?: Maybe<Array<Scalars['String']>>
  pool_not_starts_with?: Maybe<Scalars['String']>
  pool_starts_with?: Maybe<Scalars['String']>
  sqrtPrice?: Maybe<Scalars['v3polygon_BigInt']>
  sqrtPrice_gt?: Maybe<Scalars['v3polygon_BigInt']>
  sqrtPrice_gte?: Maybe<Scalars['v3polygon_BigInt']>
  sqrtPrice_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  sqrtPrice_lt?: Maybe<Scalars['v3polygon_BigInt']>
  sqrtPrice_lte?: Maybe<Scalars['v3polygon_BigInt']>
  sqrtPrice_not?: Maybe<Scalars['v3polygon_BigInt']>
  sqrtPrice_not_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  tick?: Maybe<Scalars['v3polygon_BigInt']>
  tick_gt?: Maybe<Scalars['v3polygon_BigInt']>
  tick_gte?: Maybe<Scalars['v3polygon_BigInt']>
  tick_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  tick_lt?: Maybe<Scalars['v3polygon_BigInt']>
  tick_lte?: Maybe<Scalars['v3polygon_BigInt']>
  tick_not?: Maybe<Scalars['v3polygon_BigInt']>
  tick_not_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  token0Price?: Maybe<Scalars['v3polygon_BigDecimal']>
  token0Price_gt?: Maybe<Scalars['v3polygon_BigDecimal']>
  token0Price_gte?: Maybe<Scalars['v3polygon_BigDecimal']>
  token0Price_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  token0Price_lt?: Maybe<Scalars['v3polygon_BigDecimal']>
  token0Price_lte?: Maybe<Scalars['v3polygon_BigDecimal']>
  token0Price_not?: Maybe<Scalars['v3polygon_BigDecimal']>
  token0Price_not_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  token1Price?: Maybe<Scalars['v3polygon_BigDecimal']>
  token1Price_gt?: Maybe<Scalars['v3polygon_BigDecimal']>
  token1Price_gte?: Maybe<Scalars['v3polygon_BigDecimal']>
  token1Price_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  token1Price_lt?: Maybe<Scalars['v3polygon_BigDecimal']>
  token1Price_lte?: Maybe<Scalars['v3polygon_BigDecimal']>
  token1Price_not?: Maybe<Scalars['v3polygon_BigDecimal']>
  token1Price_not_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  tvlUSD?: Maybe<Scalars['v3polygon_BigDecimal']>
  tvlUSD_gt?: Maybe<Scalars['v3polygon_BigDecimal']>
  tvlUSD_gte?: Maybe<Scalars['v3polygon_BigDecimal']>
  tvlUSD_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  tvlUSD_lt?: Maybe<Scalars['v3polygon_BigDecimal']>
  tvlUSD_lte?: Maybe<Scalars['v3polygon_BigDecimal']>
  tvlUSD_not?: Maybe<Scalars['v3polygon_BigDecimal']>
  tvlUSD_not_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  txCount?: Maybe<Scalars['v3polygon_BigInt']>
  txCount_gt?: Maybe<Scalars['v3polygon_BigInt']>
  txCount_gte?: Maybe<Scalars['v3polygon_BigInt']>
  txCount_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  txCount_lt?: Maybe<Scalars['v3polygon_BigInt']>
  txCount_lte?: Maybe<Scalars['v3polygon_BigInt']>
  txCount_not?: Maybe<Scalars['v3polygon_BigInt']>
  txCount_not_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  volumeToken0?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeToken0_gt?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeToken0_gte?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeToken0_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  volumeToken0_lt?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeToken0_lte?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeToken0_not?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeToken0_not_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  volumeToken1?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeToken1_gt?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeToken1_gte?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeToken1_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  volumeToken1_lt?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeToken1_lte?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeToken1_not?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeToken1_not_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  volumeUSD?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeUSD_gt?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeUSD_gte?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeUSD_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  volumeUSD_lt?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeUSD_lte?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeUSD_not?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeUSD_not_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
}

export enum V3polygon_PoolHourData_OrderBy {
  Close = 'close',
  FeeGrowthGlobal0X128 = 'feeGrowthGlobal0X128',
  FeeGrowthGlobal1X128 = 'feeGrowthGlobal1X128',
  FeesUsd = 'feesUSD',
  High = 'high',
  Id = 'id',
  Liquidity = 'liquidity',
  Low = 'low',
  Open = 'open',
  PeriodStartUnix = 'periodStartUnix',
  Pool = 'pool',
  SqrtPrice = 'sqrtPrice',
  Tick = 'tick',
  Token0Price = 'token0Price',
  Token1Price = 'token1Price',
  TvlUsd = 'tvlUSD',
  TxCount = 'txCount',
  VolumeToken0 = 'volumeToken0',
  VolumeToken1 = 'volumeToken1',
  VolumeUsd = 'volumeUSD',
}

export type V3polygon_Pool_Filter = {
  collectedFeesToken0?: Maybe<Scalars['v3polygon_BigDecimal']>
  collectedFeesToken0_gt?: Maybe<Scalars['v3polygon_BigDecimal']>
  collectedFeesToken0_gte?: Maybe<Scalars['v3polygon_BigDecimal']>
  collectedFeesToken0_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  collectedFeesToken0_lt?: Maybe<Scalars['v3polygon_BigDecimal']>
  collectedFeesToken0_lte?: Maybe<Scalars['v3polygon_BigDecimal']>
  collectedFeesToken0_not?: Maybe<Scalars['v3polygon_BigDecimal']>
  collectedFeesToken0_not_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  collectedFeesToken1?: Maybe<Scalars['v3polygon_BigDecimal']>
  collectedFeesToken1_gt?: Maybe<Scalars['v3polygon_BigDecimal']>
  collectedFeesToken1_gte?: Maybe<Scalars['v3polygon_BigDecimal']>
  collectedFeesToken1_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  collectedFeesToken1_lt?: Maybe<Scalars['v3polygon_BigDecimal']>
  collectedFeesToken1_lte?: Maybe<Scalars['v3polygon_BigDecimal']>
  collectedFeesToken1_not?: Maybe<Scalars['v3polygon_BigDecimal']>
  collectedFeesToken1_not_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  collectedFeesUSD?: Maybe<Scalars['v3polygon_BigDecimal']>
  collectedFeesUSD_gt?: Maybe<Scalars['v3polygon_BigDecimal']>
  collectedFeesUSD_gte?: Maybe<Scalars['v3polygon_BigDecimal']>
  collectedFeesUSD_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  collectedFeesUSD_lt?: Maybe<Scalars['v3polygon_BigDecimal']>
  collectedFeesUSD_lte?: Maybe<Scalars['v3polygon_BigDecimal']>
  collectedFeesUSD_not?: Maybe<Scalars['v3polygon_BigDecimal']>
  collectedFeesUSD_not_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  createdAtBlockNumber?: Maybe<Scalars['v3polygon_BigInt']>
  createdAtBlockNumber_gt?: Maybe<Scalars['v3polygon_BigInt']>
  createdAtBlockNumber_gte?: Maybe<Scalars['v3polygon_BigInt']>
  createdAtBlockNumber_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  createdAtBlockNumber_lt?: Maybe<Scalars['v3polygon_BigInt']>
  createdAtBlockNumber_lte?: Maybe<Scalars['v3polygon_BigInt']>
  createdAtBlockNumber_not?: Maybe<Scalars['v3polygon_BigInt']>
  createdAtBlockNumber_not_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  createdAtTimestamp?: Maybe<Scalars['v3polygon_BigInt']>
  createdAtTimestamp_gt?: Maybe<Scalars['v3polygon_BigInt']>
  createdAtTimestamp_gte?: Maybe<Scalars['v3polygon_BigInt']>
  createdAtTimestamp_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  createdAtTimestamp_lt?: Maybe<Scalars['v3polygon_BigInt']>
  createdAtTimestamp_lte?: Maybe<Scalars['v3polygon_BigInt']>
  createdAtTimestamp_not?: Maybe<Scalars['v3polygon_BigInt']>
  createdAtTimestamp_not_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  feeGrowthGlobal0X128?: Maybe<Scalars['v3polygon_BigInt']>
  feeGrowthGlobal0X128_gt?: Maybe<Scalars['v3polygon_BigInt']>
  feeGrowthGlobal0X128_gte?: Maybe<Scalars['v3polygon_BigInt']>
  feeGrowthGlobal0X128_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  feeGrowthGlobal0X128_lt?: Maybe<Scalars['v3polygon_BigInt']>
  feeGrowthGlobal0X128_lte?: Maybe<Scalars['v3polygon_BigInt']>
  feeGrowthGlobal0X128_not?: Maybe<Scalars['v3polygon_BigInt']>
  feeGrowthGlobal0X128_not_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  feeGrowthGlobal1X128?: Maybe<Scalars['v3polygon_BigInt']>
  feeGrowthGlobal1X128_gt?: Maybe<Scalars['v3polygon_BigInt']>
  feeGrowthGlobal1X128_gte?: Maybe<Scalars['v3polygon_BigInt']>
  feeGrowthGlobal1X128_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  feeGrowthGlobal1X128_lt?: Maybe<Scalars['v3polygon_BigInt']>
  feeGrowthGlobal1X128_lte?: Maybe<Scalars['v3polygon_BigInt']>
  feeGrowthGlobal1X128_not?: Maybe<Scalars['v3polygon_BigInt']>
  feeGrowthGlobal1X128_not_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  feeTier?: Maybe<Scalars['v3polygon_BigInt']>
  feeTier_gt?: Maybe<Scalars['v3polygon_BigInt']>
  feeTier_gte?: Maybe<Scalars['v3polygon_BigInt']>
  feeTier_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  feeTier_lt?: Maybe<Scalars['v3polygon_BigInt']>
  feeTier_lte?: Maybe<Scalars['v3polygon_BigInt']>
  feeTier_not?: Maybe<Scalars['v3polygon_BigInt']>
  feeTier_not_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  feesUSD?: Maybe<Scalars['v3polygon_BigDecimal']>
  feesUSD_gt?: Maybe<Scalars['v3polygon_BigDecimal']>
  feesUSD_gte?: Maybe<Scalars['v3polygon_BigDecimal']>
  feesUSD_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  feesUSD_lt?: Maybe<Scalars['v3polygon_BigDecimal']>
  feesUSD_lte?: Maybe<Scalars['v3polygon_BigDecimal']>
  feesUSD_not?: Maybe<Scalars['v3polygon_BigDecimal']>
  feesUSD_not_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  id?: Maybe<Scalars['ID']>
  id_gt?: Maybe<Scalars['ID']>
  id_gte?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  id_lt?: Maybe<Scalars['ID']>
  id_lte?: Maybe<Scalars['ID']>
  id_not?: Maybe<Scalars['ID']>
  id_not_in?: Maybe<Array<Scalars['ID']>>
  liquidity?: Maybe<Scalars['v3polygon_BigInt']>
  liquidityProviderCount?: Maybe<Scalars['v3polygon_BigInt']>
  liquidityProviderCount_gt?: Maybe<Scalars['v3polygon_BigInt']>
  liquidityProviderCount_gte?: Maybe<Scalars['v3polygon_BigInt']>
  liquidityProviderCount_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  liquidityProviderCount_lt?: Maybe<Scalars['v3polygon_BigInt']>
  liquidityProviderCount_lte?: Maybe<Scalars['v3polygon_BigInt']>
  liquidityProviderCount_not?: Maybe<Scalars['v3polygon_BigInt']>
  liquidityProviderCount_not_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  liquidity_gt?: Maybe<Scalars['v3polygon_BigInt']>
  liquidity_gte?: Maybe<Scalars['v3polygon_BigInt']>
  liquidity_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  liquidity_lt?: Maybe<Scalars['v3polygon_BigInt']>
  liquidity_lte?: Maybe<Scalars['v3polygon_BigInt']>
  liquidity_not?: Maybe<Scalars['v3polygon_BigInt']>
  liquidity_not_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  observationIndex?: Maybe<Scalars['v3polygon_BigInt']>
  observationIndex_gt?: Maybe<Scalars['v3polygon_BigInt']>
  observationIndex_gte?: Maybe<Scalars['v3polygon_BigInt']>
  observationIndex_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  observationIndex_lt?: Maybe<Scalars['v3polygon_BigInt']>
  observationIndex_lte?: Maybe<Scalars['v3polygon_BigInt']>
  observationIndex_not?: Maybe<Scalars['v3polygon_BigInt']>
  observationIndex_not_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  sqrtPrice?: Maybe<Scalars['v3polygon_BigInt']>
  sqrtPrice_gt?: Maybe<Scalars['v3polygon_BigInt']>
  sqrtPrice_gte?: Maybe<Scalars['v3polygon_BigInt']>
  sqrtPrice_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  sqrtPrice_lt?: Maybe<Scalars['v3polygon_BigInt']>
  sqrtPrice_lte?: Maybe<Scalars['v3polygon_BigInt']>
  sqrtPrice_not?: Maybe<Scalars['v3polygon_BigInt']>
  sqrtPrice_not_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  tick?: Maybe<Scalars['v3polygon_BigInt']>
  tick_gt?: Maybe<Scalars['v3polygon_BigInt']>
  tick_gte?: Maybe<Scalars['v3polygon_BigInt']>
  tick_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  tick_lt?: Maybe<Scalars['v3polygon_BigInt']>
  tick_lte?: Maybe<Scalars['v3polygon_BigInt']>
  tick_not?: Maybe<Scalars['v3polygon_BigInt']>
  tick_not_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  token0?: Maybe<Scalars['String']>
  token0Price?: Maybe<Scalars['v3polygon_BigDecimal']>
  token0Price_gt?: Maybe<Scalars['v3polygon_BigDecimal']>
  token0Price_gte?: Maybe<Scalars['v3polygon_BigDecimal']>
  token0Price_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  token0Price_lt?: Maybe<Scalars['v3polygon_BigDecimal']>
  token0Price_lte?: Maybe<Scalars['v3polygon_BigDecimal']>
  token0Price_not?: Maybe<Scalars['v3polygon_BigDecimal']>
  token0Price_not_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  token0_contains?: Maybe<Scalars['String']>
  token0_ends_with?: Maybe<Scalars['String']>
  token0_gt?: Maybe<Scalars['String']>
  token0_gte?: Maybe<Scalars['String']>
  token0_in?: Maybe<Array<Scalars['String']>>
  token0_lt?: Maybe<Scalars['String']>
  token0_lte?: Maybe<Scalars['String']>
  token0_not?: Maybe<Scalars['String']>
  token0_not_contains?: Maybe<Scalars['String']>
  token0_not_ends_with?: Maybe<Scalars['String']>
  token0_not_in?: Maybe<Array<Scalars['String']>>
  token0_not_starts_with?: Maybe<Scalars['String']>
  token0_starts_with?: Maybe<Scalars['String']>
  token1?: Maybe<Scalars['String']>
  token1Price?: Maybe<Scalars['v3polygon_BigDecimal']>
  token1Price_gt?: Maybe<Scalars['v3polygon_BigDecimal']>
  token1Price_gte?: Maybe<Scalars['v3polygon_BigDecimal']>
  token1Price_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  token1Price_lt?: Maybe<Scalars['v3polygon_BigDecimal']>
  token1Price_lte?: Maybe<Scalars['v3polygon_BigDecimal']>
  token1Price_not?: Maybe<Scalars['v3polygon_BigDecimal']>
  token1Price_not_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  token1_contains?: Maybe<Scalars['String']>
  token1_ends_with?: Maybe<Scalars['String']>
  token1_gt?: Maybe<Scalars['String']>
  token1_gte?: Maybe<Scalars['String']>
  token1_in?: Maybe<Array<Scalars['String']>>
  token1_lt?: Maybe<Scalars['String']>
  token1_lte?: Maybe<Scalars['String']>
  token1_not?: Maybe<Scalars['String']>
  token1_not_contains?: Maybe<Scalars['String']>
  token1_not_ends_with?: Maybe<Scalars['String']>
  token1_not_in?: Maybe<Array<Scalars['String']>>
  token1_not_starts_with?: Maybe<Scalars['String']>
  token1_starts_with?: Maybe<Scalars['String']>
  totalValueLockedETH?: Maybe<Scalars['v3polygon_BigDecimal']>
  totalValueLockedETH_gt?: Maybe<Scalars['v3polygon_BigDecimal']>
  totalValueLockedETH_gte?: Maybe<Scalars['v3polygon_BigDecimal']>
  totalValueLockedETH_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  totalValueLockedETH_lt?: Maybe<Scalars['v3polygon_BigDecimal']>
  totalValueLockedETH_lte?: Maybe<Scalars['v3polygon_BigDecimal']>
  totalValueLockedETH_not?: Maybe<Scalars['v3polygon_BigDecimal']>
  totalValueLockedETH_not_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  totalValueLockedToken0?: Maybe<Scalars['v3polygon_BigDecimal']>
  totalValueLockedToken0_gt?: Maybe<Scalars['v3polygon_BigDecimal']>
  totalValueLockedToken0_gte?: Maybe<Scalars['v3polygon_BigDecimal']>
  totalValueLockedToken0_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  totalValueLockedToken0_lt?: Maybe<Scalars['v3polygon_BigDecimal']>
  totalValueLockedToken0_lte?: Maybe<Scalars['v3polygon_BigDecimal']>
  totalValueLockedToken0_not?: Maybe<Scalars['v3polygon_BigDecimal']>
  totalValueLockedToken0_not_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  totalValueLockedToken1?: Maybe<Scalars['v3polygon_BigDecimal']>
  totalValueLockedToken1_gt?: Maybe<Scalars['v3polygon_BigDecimal']>
  totalValueLockedToken1_gte?: Maybe<Scalars['v3polygon_BigDecimal']>
  totalValueLockedToken1_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  totalValueLockedToken1_lt?: Maybe<Scalars['v3polygon_BigDecimal']>
  totalValueLockedToken1_lte?: Maybe<Scalars['v3polygon_BigDecimal']>
  totalValueLockedToken1_not?: Maybe<Scalars['v3polygon_BigDecimal']>
  totalValueLockedToken1_not_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  totalValueLockedUSD?: Maybe<Scalars['v3polygon_BigDecimal']>
  totalValueLockedUSDUntracked?: Maybe<Scalars['v3polygon_BigDecimal']>
  totalValueLockedUSDUntracked_gt?: Maybe<Scalars['v3polygon_BigDecimal']>
  totalValueLockedUSDUntracked_gte?: Maybe<Scalars['v3polygon_BigDecimal']>
  totalValueLockedUSDUntracked_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  totalValueLockedUSDUntracked_lt?: Maybe<Scalars['v3polygon_BigDecimal']>
  totalValueLockedUSDUntracked_lte?: Maybe<Scalars['v3polygon_BigDecimal']>
  totalValueLockedUSDUntracked_not?: Maybe<Scalars['v3polygon_BigDecimal']>
  totalValueLockedUSDUntracked_not_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  totalValueLockedUSD_gt?: Maybe<Scalars['v3polygon_BigDecimal']>
  totalValueLockedUSD_gte?: Maybe<Scalars['v3polygon_BigDecimal']>
  totalValueLockedUSD_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  totalValueLockedUSD_lt?: Maybe<Scalars['v3polygon_BigDecimal']>
  totalValueLockedUSD_lte?: Maybe<Scalars['v3polygon_BigDecimal']>
  totalValueLockedUSD_not?: Maybe<Scalars['v3polygon_BigDecimal']>
  totalValueLockedUSD_not_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  txCount?: Maybe<Scalars['v3polygon_BigInt']>
  txCount_gt?: Maybe<Scalars['v3polygon_BigInt']>
  txCount_gte?: Maybe<Scalars['v3polygon_BigInt']>
  txCount_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  txCount_lt?: Maybe<Scalars['v3polygon_BigInt']>
  txCount_lte?: Maybe<Scalars['v3polygon_BigInt']>
  txCount_not?: Maybe<Scalars['v3polygon_BigInt']>
  txCount_not_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  untrackedVolumeUSD?: Maybe<Scalars['v3polygon_BigDecimal']>
  untrackedVolumeUSD_gt?: Maybe<Scalars['v3polygon_BigDecimal']>
  untrackedVolumeUSD_gte?: Maybe<Scalars['v3polygon_BigDecimal']>
  untrackedVolumeUSD_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  untrackedVolumeUSD_lt?: Maybe<Scalars['v3polygon_BigDecimal']>
  untrackedVolumeUSD_lte?: Maybe<Scalars['v3polygon_BigDecimal']>
  untrackedVolumeUSD_not?: Maybe<Scalars['v3polygon_BigDecimal']>
  untrackedVolumeUSD_not_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  volumeToken0?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeToken0_gt?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeToken0_gte?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeToken0_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  volumeToken0_lt?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeToken0_lte?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeToken0_not?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeToken0_not_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  volumeToken1?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeToken1_gt?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeToken1_gte?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeToken1_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  volumeToken1_lt?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeToken1_lte?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeToken1_not?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeToken1_not_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  volumeUSD?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeUSD_gt?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeUSD_gte?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeUSD_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  volumeUSD_lt?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeUSD_lte?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeUSD_not?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeUSD_not_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
}

export enum V3polygon_Pool_OrderBy {
  Burns = 'burns',
  CollectedFeesToken0 = 'collectedFeesToken0',
  CollectedFeesToken1 = 'collectedFeesToken1',
  CollectedFeesUsd = 'collectedFeesUSD',
  Collects = 'collects',
  CreatedAtBlockNumber = 'createdAtBlockNumber',
  CreatedAtTimestamp = 'createdAtTimestamp',
  FeeGrowthGlobal0X128 = 'feeGrowthGlobal0X128',
  FeeGrowthGlobal1X128 = 'feeGrowthGlobal1X128',
  FeeTier = 'feeTier',
  FeesUsd = 'feesUSD',
  Id = 'id',
  Liquidity = 'liquidity',
  LiquidityProviderCount = 'liquidityProviderCount',
  Mints = 'mints',
  ObservationIndex = 'observationIndex',
  PoolDayData = 'poolDayData',
  PoolHourData = 'poolHourData',
  SqrtPrice = 'sqrtPrice',
  Swaps = 'swaps',
  Tick = 'tick',
  Ticks = 'ticks',
  Token0 = 'token0',
  Token0Price = 'token0Price',
  Token1 = 'token1',
  Token1Price = 'token1Price',
  TotalValueLockedEth = 'totalValueLockedETH',
  TotalValueLockedToken0 = 'totalValueLockedToken0',
  TotalValueLockedToken1 = 'totalValueLockedToken1',
  TotalValueLockedUsd = 'totalValueLockedUSD',
  TotalValueLockedUsdUntracked = 'totalValueLockedUSDUntracked',
  TxCount = 'txCount',
  UntrackedVolumeUsd = 'untrackedVolumeUSD',
  VolumeToken0 = 'volumeToken0',
  VolumeToken1 = 'volumeToken1',
  VolumeUsd = 'volumeUSD',
}

export type V3polygon_Position = {
  __typename?: 'v3polygon_Position'
  amountCollectedUSD: Scalars['v3polygon_BigDecimal']
  amountDepositedUSD: Scalars['v3polygon_BigDecimal']
  amountWithdrawnUSD: Scalars['v3polygon_BigDecimal']
  collectedFeesToken0: Scalars['v3polygon_BigDecimal']
  collectedFeesToken1: Scalars['v3polygon_BigDecimal']
  collectedToken0: Scalars['v3polygon_BigDecimal']
  collectedToken1: Scalars['v3polygon_BigDecimal']
  depositedToken0: Scalars['v3polygon_BigDecimal']
  depositedToken1: Scalars['v3polygon_BigDecimal']
  feeGrowthInside0LastX128: Scalars['v3polygon_BigInt']
  feeGrowthInside1LastX128: Scalars['v3polygon_BigInt']
  id: Scalars['ID']
  liquidity: Scalars['v3polygon_BigInt']
  owner: Scalars['v3polygon_Bytes']
  pool: V3polygon_Pool
  tickLower: V3polygon_Tick
  tickUpper: V3polygon_Tick
  token0: V3polygon_Token
  token1: V3polygon_Token
  transaction: V3polygon_Transaction
  withdrawnToken0: Scalars['v3polygon_BigDecimal']
  withdrawnToken1: Scalars['v3polygon_BigDecimal']
}

export type V3polygon_PositionSnapshot = {
  __typename?: 'v3polygon_PositionSnapshot'
  blockNumber: Scalars['v3polygon_BigInt']
  collectedFeesToken0: Scalars['v3polygon_BigDecimal']
  collectedFeesToken1: Scalars['v3polygon_BigDecimal']
  depositedToken0: Scalars['v3polygon_BigDecimal']
  depositedToken1: Scalars['v3polygon_BigDecimal']
  feeGrowthInside0LastX128: Scalars['v3polygon_BigInt']
  feeGrowthInside1LastX128: Scalars['v3polygon_BigInt']
  id: Scalars['ID']
  liquidity: Scalars['v3polygon_BigInt']
  owner: Scalars['v3polygon_Bytes']
  pool: V3polygon_Pool
  position: V3polygon_Position
  timestamp: Scalars['v3polygon_BigInt']
  transaction: V3polygon_Transaction
  withdrawnToken0: Scalars['v3polygon_BigDecimal']
  withdrawnToken1: Scalars['v3polygon_BigDecimal']
}

export type V3polygon_PositionSnapshot_Filter = {
  blockNumber?: Maybe<Scalars['v3polygon_BigInt']>
  blockNumber_gt?: Maybe<Scalars['v3polygon_BigInt']>
  blockNumber_gte?: Maybe<Scalars['v3polygon_BigInt']>
  blockNumber_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  blockNumber_lt?: Maybe<Scalars['v3polygon_BigInt']>
  blockNumber_lte?: Maybe<Scalars['v3polygon_BigInt']>
  blockNumber_not?: Maybe<Scalars['v3polygon_BigInt']>
  blockNumber_not_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  collectedFeesToken0?: Maybe<Scalars['v3polygon_BigDecimal']>
  collectedFeesToken0_gt?: Maybe<Scalars['v3polygon_BigDecimal']>
  collectedFeesToken0_gte?: Maybe<Scalars['v3polygon_BigDecimal']>
  collectedFeesToken0_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  collectedFeesToken0_lt?: Maybe<Scalars['v3polygon_BigDecimal']>
  collectedFeesToken0_lte?: Maybe<Scalars['v3polygon_BigDecimal']>
  collectedFeesToken0_not?: Maybe<Scalars['v3polygon_BigDecimal']>
  collectedFeesToken0_not_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  collectedFeesToken1?: Maybe<Scalars['v3polygon_BigDecimal']>
  collectedFeesToken1_gt?: Maybe<Scalars['v3polygon_BigDecimal']>
  collectedFeesToken1_gte?: Maybe<Scalars['v3polygon_BigDecimal']>
  collectedFeesToken1_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  collectedFeesToken1_lt?: Maybe<Scalars['v3polygon_BigDecimal']>
  collectedFeesToken1_lte?: Maybe<Scalars['v3polygon_BigDecimal']>
  collectedFeesToken1_not?: Maybe<Scalars['v3polygon_BigDecimal']>
  collectedFeesToken1_not_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  depositedToken0?: Maybe<Scalars['v3polygon_BigDecimal']>
  depositedToken0_gt?: Maybe<Scalars['v3polygon_BigDecimal']>
  depositedToken0_gte?: Maybe<Scalars['v3polygon_BigDecimal']>
  depositedToken0_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  depositedToken0_lt?: Maybe<Scalars['v3polygon_BigDecimal']>
  depositedToken0_lte?: Maybe<Scalars['v3polygon_BigDecimal']>
  depositedToken0_not?: Maybe<Scalars['v3polygon_BigDecimal']>
  depositedToken0_not_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  depositedToken1?: Maybe<Scalars['v3polygon_BigDecimal']>
  depositedToken1_gt?: Maybe<Scalars['v3polygon_BigDecimal']>
  depositedToken1_gte?: Maybe<Scalars['v3polygon_BigDecimal']>
  depositedToken1_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  depositedToken1_lt?: Maybe<Scalars['v3polygon_BigDecimal']>
  depositedToken1_lte?: Maybe<Scalars['v3polygon_BigDecimal']>
  depositedToken1_not?: Maybe<Scalars['v3polygon_BigDecimal']>
  depositedToken1_not_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  feeGrowthInside0LastX128?: Maybe<Scalars['v3polygon_BigInt']>
  feeGrowthInside0LastX128_gt?: Maybe<Scalars['v3polygon_BigInt']>
  feeGrowthInside0LastX128_gte?: Maybe<Scalars['v3polygon_BigInt']>
  feeGrowthInside0LastX128_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  feeGrowthInside0LastX128_lt?: Maybe<Scalars['v3polygon_BigInt']>
  feeGrowthInside0LastX128_lte?: Maybe<Scalars['v3polygon_BigInt']>
  feeGrowthInside0LastX128_not?: Maybe<Scalars['v3polygon_BigInt']>
  feeGrowthInside0LastX128_not_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  feeGrowthInside1LastX128?: Maybe<Scalars['v3polygon_BigInt']>
  feeGrowthInside1LastX128_gt?: Maybe<Scalars['v3polygon_BigInt']>
  feeGrowthInside1LastX128_gte?: Maybe<Scalars['v3polygon_BigInt']>
  feeGrowthInside1LastX128_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  feeGrowthInside1LastX128_lt?: Maybe<Scalars['v3polygon_BigInt']>
  feeGrowthInside1LastX128_lte?: Maybe<Scalars['v3polygon_BigInt']>
  feeGrowthInside1LastX128_not?: Maybe<Scalars['v3polygon_BigInt']>
  feeGrowthInside1LastX128_not_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  id?: Maybe<Scalars['ID']>
  id_gt?: Maybe<Scalars['ID']>
  id_gte?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  id_lt?: Maybe<Scalars['ID']>
  id_lte?: Maybe<Scalars['ID']>
  id_not?: Maybe<Scalars['ID']>
  id_not_in?: Maybe<Array<Scalars['ID']>>
  liquidity?: Maybe<Scalars['v3polygon_BigInt']>
  liquidity_gt?: Maybe<Scalars['v3polygon_BigInt']>
  liquidity_gte?: Maybe<Scalars['v3polygon_BigInt']>
  liquidity_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  liquidity_lt?: Maybe<Scalars['v3polygon_BigInt']>
  liquidity_lte?: Maybe<Scalars['v3polygon_BigInt']>
  liquidity_not?: Maybe<Scalars['v3polygon_BigInt']>
  liquidity_not_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  owner?: Maybe<Scalars['v3polygon_Bytes']>
  owner_contains?: Maybe<Scalars['v3polygon_Bytes']>
  owner_in?: Maybe<Array<Scalars['v3polygon_Bytes']>>
  owner_not?: Maybe<Scalars['v3polygon_Bytes']>
  owner_not_contains?: Maybe<Scalars['v3polygon_Bytes']>
  owner_not_in?: Maybe<Array<Scalars['v3polygon_Bytes']>>
  pool?: Maybe<Scalars['String']>
  pool_contains?: Maybe<Scalars['String']>
  pool_ends_with?: Maybe<Scalars['String']>
  pool_gt?: Maybe<Scalars['String']>
  pool_gte?: Maybe<Scalars['String']>
  pool_in?: Maybe<Array<Scalars['String']>>
  pool_lt?: Maybe<Scalars['String']>
  pool_lte?: Maybe<Scalars['String']>
  pool_not?: Maybe<Scalars['String']>
  pool_not_contains?: Maybe<Scalars['String']>
  pool_not_ends_with?: Maybe<Scalars['String']>
  pool_not_in?: Maybe<Array<Scalars['String']>>
  pool_not_starts_with?: Maybe<Scalars['String']>
  pool_starts_with?: Maybe<Scalars['String']>
  position?: Maybe<Scalars['String']>
  position_contains?: Maybe<Scalars['String']>
  position_ends_with?: Maybe<Scalars['String']>
  position_gt?: Maybe<Scalars['String']>
  position_gte?: Maybe<Scalars['String']>
  position_in?: Maybe<Array<Scalars['String']>>
  position_lt?: Maybe<Scalars['String']>
  position_lte?: Maybe<Scalars['String']>
  position_not?: Maybe<Scalars['String']>
  position_not_contains?: Maybe<Scalars['String']>
  position_not_ends_with?: Maybe<Scalars['String']>
  position_not_in?: Maybe<Array<Scalars['String']>>
  position_not_starts_with?: Maybe<Scalars['String']>
  position_starts_with?: Maybe<Scalars['String']>
  timestamp?: Maybe<Scalars['v3polygon_BigInt']>
  timestamp_gt?: Maybe<Scalars['v3polygon_BigInt']>
  timestamp_gte?: Maybe<Scalars['v3polygon_BigInt']>
  timestamp_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  timestamp_lt?: Maybe<Scalars['v3polygon_BigInt']>
  timestamp_lte?: Maybe<Scalars['v3polygon_BigInt']>
  timestamp_not?: Maybe<Scalars['v3polygon_BigInt']>
  timestamp_not_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  transaction?: Maybe<Scalars['String']>
  transaction_contains?: Maybe<Scalars['String']>
  transaction_ends_with?: Maybe<Scalars['String']>
  transaction_gt?: Maybe<Scalars['String']>
  transaction_gte?: Maybe<Scalars['String']>
  transaction_in?: Maybe<Array<Scalars['String']>>
  transaction_lt?: Maybe<Scalars['String']>
  transaction_lte?: Maybe<Scalars['String']>
  transaction_not?: Maybe<Scalars['String']>
  transaction_not_contains?: Maybe<Scalars['String']>
  transaction_not_ends_with?: Maybe<Scalars['String']>
  transaction_not_in?: Maybe<Array<Scalars['String']>>
  transaction_not_starts_with?: Maybe<Scalars['String']>
  transaction_starts_with?: Maybe<Scalars['String']>
  withdrawnToken0?: Maybe<Scalars['v3polygon_BigDecimal']>
  withdrawnToken0_gt?: Maybe<Scalars['v3polygon_BigDecimal']>
  withdrawnToken0_gte?: Maybe<Scalars['v3polygon_BigDecimal']>
  withdrawnToken0_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  withdrawnToken0_lt?: Maybe<Scalars['v3polygon_BigDecimal']>
  withdrawnToken0_lte?: Maybe<Scalars['v3polygon_BigDecimal']>
  withdrawnToken0_not?: Maybe<Scalars['v3polygon_BigDecimal']>
  withdrawnToken0_not_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  withdrawnToken1?: Maybe<Scalars['v3polygon_BigDecimal']>
  withdrawnToken1_gt?: Maybe<Scalars['v3polygon_BigDecimal']>
  withdrawnToken1_gte?: Maybe<Scalars['v3polygon_BigDecimal']>
  withdrawnToken1_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  withdrawnToken1_lt?: Maybe<Scalars['v3polygon_BigDecimal']>
  withdrawnToken1_lte?: Maybe<Scalars['v3polygon_BigDecimal']>
  withdrawnToken1_not?: Maybe<Scalars['v3polygon_BigDecimal']>
  withdrawnToken1_not_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
}

export enum V3polygon_PositionSnapshot_OrderBy {
  BlockNumber = 'blockNumber',
  CollectedFeesToken0 = 'collectedFeesToken0',
  CollectedFeesToken1 = 'collectedFeesToken1',
  DepositedToken0 = 'depositedToken0',
  DepositedToken1 = 'depositedToken1',
  FeeGrowthInside0LastX128 = 'feeGrowthInside0LastX128',
  FeeGrowthInside1LastX128 = 'feeGrowthInside1LastX128',
  Id = 'id',
  Liquidity = 'liquidity',
  Owner = 'owner',
  Pool = 'pool',
  Position = 'position',
  Timestamp = 'timestamp',
  Transaction = 'transaction',
  WithdrawnToken0 = 'withdrawnToken0',
  WithdrawnToken1 = 'withdrawnToken1',
}

export type V3polygon_Position_Filter = {
  amountCollectedUSD?: Maybe<Scalars['v3polygon_BigDecimal']>
  amountCollectedUSD_gt?: Maybe<Scalars['v3polygon_BigDecimal']>
  amountCollectedUSD_gte?: Maybe<Scalars['v3polygon_BigDecimal']>
  amountCollectedUSD_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  amountCollectedUSD_lt?: Maybe<Scalars['v3polygon_BigDecimal']>
  amountCollectedUSD_lte?: Maybe<Scalars['v3polygon_BigDecimal']>
  amountCollectedUSD_not?: Maybe<Scalars['v3polygon_BigDecimal']>
  amountCollectedUSD_not_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  amountDepositedUSD?: Maybe<Scalars['v3polygon_BigDecimal']>
  amountDepositedUSD_gt?: Maybe<Scalars['v3polygon_BigDecimal']>
  amountDepositedUSD_gte?: Maybe<Scalars['v3polygon_BigDecimal']>
  amountDepositedUSD_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  amountDepositedUSD_lt?: Maybe<Scalars['v3polygon_BigDecimal']>
  amountDepositedUSD_lte?: Maybe<Scalars['v3polygon_BigDecimal']>
  amountDepositedUSD_not?: Maybe<Scalars['v3polygon_BigDecimal']>
  amountDepositedUSD_not_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  amountWithdrawnUSD?: Maybe<Scalars['v3polygon_BigDecimal']>
  amountWithdrawnUSD_gt?: Maybe<Scalars['v3polygon_BigDecimal']>
  amountWithdrawnUSD_gte?: Maybe<Scalars['v3polygon_BigDecimal']>
  amountWithdrawnUSD_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  amountWithdrawnUSD_lt?: Maybe<Scalars['v3polygon_BigDecimal']>
  amountWithdrawnUSD_lte?: Maybe<Scalars['v3polygon_BigDecimal']>
  amountWithdrawnUSD_not?: Maybe<Scalars['v3polygon_BigDecimal']>
  amountWithdrawnUSD_not_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  collectedFeesToken0?: Maybe<Scalars['v3polygon_BigDecimal']>
  collectedFeesToken0_gt?: Maybe<Scalars['v3polygon_BigDecimal']>
  collectedFeesToken0_gte?: Maybe<Scalars['v3polygon_BigDecimal']>
  collectedFeesToken0_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  collectedFeesToken0_lt?: Maybe<Scalars['v3polygon_BigDecimal']>
  collectedFeesToken0_lte?: Maybe<Scalars['v3polygon_BigDecimal']>
  collectedFeesToken0_not?: Maybe<Scalars['v3polygon_BigDecimal']>
  collectedFeesToken0_not_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  collectedFeesToken1?: Maybe<Scalars['v3polygon_BigDecimal']>
  collectedFeesToken1_gt?: Maybe<Scalars['v3polygon_BigDecimal']>
  collectedFeesToken1_gte?: Maybe<Scalars['v3polygon_BigDecimal']>
  collectedFeesToken1_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  collectedFeesToken1_lt?: Maybe<Scalars['v3polygon_BigDecimal']>
  collectedFeesToken1_lte?: Maybe<Scalars['v3polygon_BigDecimal']>
  collectedFeesToken1_not?: Maybe<Scalars['v3polygon_BigDecimal']>
  collectedFeesToken1_not_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  collectedToken0?: Maybe<Scalars['v3polygon_BigDecimal']>
  collectedToken0_gt?: Maybe<Scalars['v3polygon_BigDecimal']>
  collectedToken0_gte?: Maybe<Scalars['v3polygon_BigDecimal']>
  collectedToken0_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  collectedToken0_lt?: Maybe<Scalars['v3polygon_BigDecimal']>
  collectedToken0_lte?: Maybe<Scalars['v3polygon_BigDecimal']>
  collectedToken0_not?: Maybe<Scalars['v3polygon_BigDecimal']>
  collectedToken0_not_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  collectedToken1?: Maybe<Scalars['v3polygon_BigDecimal']>
  collectedToken1_gt?: Maybe<Scalars['v3polygon_BigDecimal']>
  collectedToken1_gte?: Maybe<Scalars['v3polygon_BigDecimal']>
  collectedToken1_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  collectedToken1_lt?: Maybe<Scalars['v3polygon_BigDecimal']>
  collectedToken1_lte?: Maybe<Scalars['v3polygon_BigDecimal']>
  collectedToken1_not?: Maybe<Scalars['v3polygon_BigDecimal']>
  collectedToken1_not_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  depositedToken0?: Maybe<Scalars['v3polygon_BigDecimal']>
  depositedToken0_gt?: Maybe<Scalars['v3polygon_BigDecimal']>
  depositedToken0_gte?: Maybe<Scalars['v3polygon_BigDecimal']>
  depositedToken0_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  depositedToken0_lt?: Maybe<Scalars['v3polygon_BigDecimal']>
  depositedToken0_lte?: Maybe<Scalars['v3polygon_BigDecimal']>
  depositedToken0_not?: Maybe<Scalars['v3polygon_BigDecimal']>
  depositedToken0_not_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  depositedToken1?: Maybe<Scalars['v3polygon_BigDecimal']>
  depositedToken1_gt?: Maybe<Scalars['v3polygon_BigDecimal']>
  depositedToken1_gte?: Maybe<Scalars['v3polygon_BigDecimal']>
  depositedToken1_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  depositedToken1_lt?: Maybe<Scalars['v3polygon_BigDecimal']>
  depositedToken1_lte?: Maybe<Scalars['v3polygon_BigDecimal']>
  depositedToken1_not?: Maybe<Scalars['v3polygon_BigDecimal']>
  depositedToken1_not_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  feeGrowthInside0LastX128?: Maybe<Scalars['v3polygon_BigInt']>
  feeGrowthInside0LastX128_gt?: Maybe<Scalars['v3polygon_BigInt']>
  feeGrowthInside0LastX128_gte?: Maybe<Scalars['v3polygon_BigInt']>
  feeGrowthInside0LastX128_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  feeGrowthInside0LastX128_lt?: Maybe<Scalars['v3polygon_BigInt']>
  feeGrowthInside0LastX128_lte?: Maybe<Scalars['v3polygon_BigInt']>
  feeGrowthInside0LastX128_not?: Maybe<Scalars['v3polygon_BigInt']>
  feeGrowthInside0LastX128_not_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  feeGrowthInside1LastX128?: Maybe<Scalars['v3polygon_BigInt']>
  feeGrowthInside1LastX128_gt?: Maybe<Scalars['v3polygon_BigInt']>
  feeGrowthInside1LastX128_gte?: Maybe<Scalars['v3polygon_BigInt']>
  feeGrowthInside1LastX128_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  feeGrowthInside1LastX128_lt?: Maybe<Scalars['v3polygon_BigInt']>
  feeGrowthInside1LastX128_lte?: Maybe<Scalars['v3polygon_BigInt']>
  feeGrowthInside1LastX128_not?: Maybe<Scalars['v3polygon_BigInt']>
  feeGrowthInside1LastX128_not_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  id?: Maybe<Scalars['ID']>
  id_gt?: Maybe<Scalars['ID']>
  id_gte?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  id_lt?: Maybe<Scalars['ID']>
  id_lte?: Maybe<Scalars['ID']>
  id_not?: Maybe<Scalars['ID']>
  id_not_in?: Maybe<Array<Scalars['ID']>>
  liquidity?: Maybe<Scalars['v3polygon_BigInt']>
  liquidity_gt?: Maybe<Scalars['v3polygon_BigInt']>
  liquidity_gte?: Maybe<Scalars['v3polygon_BigInt']>
  liquidity_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  liquidity_lt?: Maybe<Scalars['v3polygon_BigInt']>
  liquidity_lte?: Maybe<Scalars['v3polygon_BigInt']>
  liquidity_not?: Maybe<Scalars['v3polygon_BigInt']>
  liquidity_not_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  owner?: Maybe<Scalars['v3polygon_Bytes']>
  owner_contains?: Maybe<Scalars['v3polygon_Bytes']>
  owner_in?: Maybe<Array<Scalars['v3polygon_Bytes']>>
  owner_not?: Maybe<Scalars['v3polygon_Bytes']>
  owner_not_contains?: Maybe<Scalars['v3polygon_Bytes']>
  owner_not_in?: Maybe<Array<Scalars['v3polygon_Bytes']>>
  pool?: Maybe<Scalars['String']>
  pool_contains?: Maybe<Scalars['String']>
  pool_ends_with?: Maybe<Scalars['String']>
  pool_gt?: Maybe<Scalars['String']>
  pool_gte?: Maybe<Scalars['String']>
  pool_in?: Maybe<Array<Scalars['String']>>
  pool_lt?: Maybe<Scalars['String']>
  pool_lte?: Maybe<Scalars['String']>
  pool_not?: Maybe<Scalars['String']>
  pool_not_contains?: Maybe<Scalars['String']>
  pool_not_ends_with?: Maybe<Scalars['String']>
  pool_not_in?: Maybe<Array<Scalars['String']>>
  pool_not_starts_with?: Maybe<Scalars['String']>
  pool_starts_with?: Maybe<Scalars['String']>
  tickLower?: Maybe<Scalars['String']>
  tickLower_contains?: Maybe<Scalars['String']>
  tickLower_ends_with?: Maybe<Scalars['String']>
  tickLower_gt?: Maybe<Scalars['String']>
  tickLower_gte?: Maybe<Scalars['String']>
  tickLower_in?: Maybe<Array<Scalars['String']>>
  tickLower_lt?: Maybe<Scalars['String']>
  tickLower_lte?: Maybe<Scalars['String']>
  tickLower_not?: Maybe<Scalars['String']>
  tickLower_not_contains?: Maybe<Scalars['String']>
  tickLower_not_ends_with?: Maybe<Scalars['String']>
  tickLower_not_in?: Maybe<Array<Scalars['String']>>
  tickLower_not_starts_with?: Maybe<Scalars['String']>
  tickLower_starts_with?: Maybe<Scalars['String']>
  tickUpper?: Maybe<Scalars['String']>
  tickUpper_contains?: Maybe<Scalars['String']>
  tickUpper_ends_with?: Maybe<Scalars['String']>
  tickUpper_gt?: Maybe<Scalars['String']>
  tickUpper_gte?: Maybe<Scalars['String']>
  tickUpper_in?: Maybe<Array<Scalars['String']>>
  tickUpper_lt?: Maybe<Scalars['String']>
  tickUpper_lte?: Maybe<Scalars['String']>
  tickUpper_not?: Maybe<Scalars['String']>
  tickUpper_not_contains?: Maybe<Scalars['String']>
  tickUpper_not_ends_with?: Maybe<Scalars['String']>
  tickUpper_not_in?: Maybe<Array<Scalars['String']>>
  tickUpper_not_starts_with?: Maybe<Scalars['String']>
  tickUpper_starts_with?: Maybe<Scalars['String']>
  token0?: Maybe<Scalars['String']>
  token0_contains?: Maybe<Scalars['String']>
  token0_ends_with?: Maybe<Scalars['String']>
  token0_gt?: Maybe<Scalars['String']>
  token0_gte?: Maybe<Scalars['String']>
  token0_in?: Maybe<Array<Scalars['String']>>
  token0_lt?: Maybe<Scalars['String']>
  token0_lte?: Maybe<Scalars['String']>
  token0_not?: Maybe<Scalars['String']>
  token0_not_contains?: Maybe<Scalars['String']>
  token0_not_ends_with?: Maybe<Scalars['String']>
  token0_not_in?: Maybe<Array<Scalars['String']>>
  token0_not_starts_with?: Maybe<Scalars['String']>
  token0_starts_with?: Maybe<Scalars['String']>
  token1?: Maybe<Scalars['String']>
  token1_contains?: Maybe<Scalars['String']>
  token1_ends_with?: Maybe<Scalars['String']>
  token1_gt?: Maybe<Scalars['String']>
  token1_gte?: Maybe<Scalars['String']>
  token1_in?: Maybe<Array<Scalars['String']>>
  token1_lt?: Maybe<Scalars['String']>
  token1_lte?: Maybe<Scalars['String']>
  token1_not?: Maybe<Scalars['String']>
  token1_not_contains?: Maybe<Scalars['String']>
  token1_not_ends_with?: Maybe<Scalars['String']>
  token1_not_in?: Maybe<Array<Scalars['String']>>
  token1_not_starts_with?: Maybe<Scalars['String']>
  token1_starts_with?: Maybe<Scalars['String']>
  transaction?: Maybe<Scalars['String']>
  transaction_contains?: Maybe<Scalars['String']>
  transaction_ends_with?: Maybe<Scalars['String']>
  transaction_gt?: Maybe<Scalars['String']>
  transaction_gte?: Maybe<Scalars['String']>
  transaction_in?: Maybe<Array<Scalars['String']>>
  transaction_lt?: Maybe<Scalars['String']>
  transaction_lte?: Maybe<Scalars['String']>
  transaction_not?: Maybe<Scalars['String']>
  transaction_not_contains?: Maybe<Scalars['String']>
  transaction_not_ends_with?: Maybe<Scalars['String']>
  transaction_not_in?: Maybe<Array<Scalars['String']>>
  transaction_not_starts_with?: Maybe<Scalars['String']>
  transaction_starts_with?: Maybe<Scalars['String']>
  withdrawnToken0?: Maybe<Scalars['v3polygon_BigDecimal']>
  withdrawnToken0_gt?: Maybe<Scalars['v3polygon_BigDecimal']>
  withdrawnToken0_gte?: Maybe<Scalars['v3polygon_BigDecimal']>
  withdrawnToken0_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  withdrawnToken0_lt?: Maybe<Scalars['v3polygon_BigDecimal']>
  withdrawnToken0_lte?: Maybe<Scalars['v3polygon_BigDecimal']>
  withdrawnToken0_not?: Maybe<Scalars['v3polygon_BigDecimal']>
  withdrawnToken0_not_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  withdrawnToken1?: Maybe<Scalars['v3polygon_BigDecimal']>
  withdrawnToken1_gt?: Maybe<Scalars['v3polygon_BigDecimal']>
  withdrawnToken1_gte?: Maybe<Scalars['v3polygon_BigDecimal']>
  withdrawnToken1_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  withdrawnToken1_lt?: Maybe<Scalars['v3polygon_BigDecimal']>
  withdrawnToken1_lte?: Maybe<Scalars['v3polygon_BigDecimal']>
  withdrawnToken1_not?: Maybe<Scalars['v3polygon_BigDecimal']>
  withdrawnToken1_not_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
}

export enum V3polygon_Position_OrderBy {
  AmountCollectedUsd = 'amountCollectedUSD',
  AmountDepositedUsd = 'amountDepositedUSD',
  AmountWithdrawnUsd = 'amountWithdrawnUSD',
  CollectedFeesToken0 = 'collectedFeesToken0',
  CollectedFeesToken1 = 'collectedFeesToken1',
  CollectedToken0 = 'collectedToken0',
  CollectedToken1 = 'collectedToken1',
  DepositedToken0 = 'depositedToken0',
  DepositedToken1 = 'depositedToken1',
  FeeGrowthInside0LastX128 = 'feeGrowthInside0LastX128',
  FeeGrowthInside1LastX128 = 'feeGrowthInside1LastX128',
  Id = 'id',
  Liquidity = 'liquidity',
  Owner = 'owner',
  Pool = 'pool',
  TickLower = 'tickLower',
  TickUpper = 'tickUpper',
  Token0 = 'token0',
  Token1 = 'token1',
  Transaction = 'transaction',
  WithdrawnToken0 = 'withdrawnToken0',
  WithdrawnToken1 = 'withdrawnToken1',
}

export type V3polygon_Swap = {
  __typename?: 'v3polygon_Swap'
  amount0: Scalars['v3polygon_BigDecimal']
  amount1: Scalars['v3polygon_BigDecimal']
  amountUSD: Scalars['v3polygon_BigDecimal']
  id: Scalars['ID']
  logIndex?: Maybe<Scalars['v3polygon_BigInt']>
  origin: Scalars['v3polygon_Bytes']
  pool: V3polygon_Pool
  recipient: Scalars['v3polygon_Bytes']
  sender: Scalars['v3polygon_Bytes']
  sqrtPriceX96: Scalars['v3polygon_BigInt']
  tick: Scalars['v3polygon_BigInt']
  timestamp: Scalars['v3polygon_BigInt']
  token0: V3polygon_Token
  token1: V3polygon_Token
  transaction: V3polygon_Transaction
}

export type V3polygon_Swap_Filter = {
  amount0?: Maybe<Scalars['v3polygon_BigDecimal']>
  amount0_gt?: Maybe<Scalars['v3polygon_BigDecimal']>
  amount0_gte?: Maybe<Scalars['v3polygon_BigDecimal']>
  amount0_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  amount0_lt?: Maybe<Scalars['v3polygon_BigDecimal']>
  amount0_lte?: Maybe<Scalars['v3polygon_BigDecimal']>
  amount0_not?: Maybe<Scalars['v3polygon_BigDecimal']>
  amount0_not_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  amount1?: Maybe<Scalars['v3polygon_BigDecimal']>
  amount1_gt?: Maybe<Scalars['v3polygon_BigDecimal']>
  amount1_gte?: Maybe<Scalars['v3polygon_BigDecimal']>
  amount1_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  amount1_lt?: Maybe<Scalars['v3polygon_BigDecimal']>
  amount1_lte?: Maybe<Scalars['v3polygon_BigDecimal']>
  amount1_not?: Maybe<Scalars['v3polygon_BigDecimal']>
  amount1_not_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  amountUSD?: Maybe<Scalars['v3polygon_BigDecimal']>
  amountUSD_gt?: Maybe<Scalars['v3polygon_BigDecimal']>
  amountUSD_gte?: Maybe<Scalars['v3polygon_BigDecimal']>
  amountUSD_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  amountUSD_lt?: Maybe<Scalars['v3polygon_BigDecimal']>
  amountUSD_lte?: Maybe<Scalars['v3polygon_BigDecimal']>
  amountUSD_not?: Maybe<Scalars['v3polygon_BigDecimal']>
  amountUSD_not_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  id?: Maybe<Scalars['ID']>
  id_gt?: Maybe<Scalars['ID']>
  id_gte?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  id_lt?: Maybe<Scalars['ID']>
  id_lte?: Maybe<Scalars['ID']>
  id_not?: Maybe<Scalars['ID']>
  id_not_in?: Maybe<Array<Scalars['ID']>>
  logIndex?: Maybe<Scalars['v3polygon_BigInt']>
  logIndex_gt?: Maybe<Scalars['v3polygon_BigInt']>
  logIndex_gte?: Maybe<Scalars['v3polygon_BigInt']>
  logIndex_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  logIndex_lt?: Maybe<Scalars['v3polygon_BigInt']>
  logIndex_lte?: Maybe<Scalars['v3polygon_BigInt']>
  logIndex_not?: Maybe<Scalars['v3polygon_BigInt']>
  logIndex_not_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  origin?: Maybe<Scalars['v3polygon_Bytes']>
  origin_contains?: Maybe<Scalars['v3polygon_Bytes']>
  origin_in?: Maybe<Array<Scalars['v3polygon_Bytes']>>
  origin_not?: Maybe<Scalars['v3polygon_Bytes']>
  origin_not_contains?: Maybe<Scalars['v3polygon_Bytes']>
  origin_not_in?: Maybe<Array<Scalars['v3polygon_Bytes']>>
  pool?: Maybe<Scalars['String']>
  pool_contains?: Maybe<Scalars['String']>
  pool_ends_with?: Maybe<Scalars['String']>
  pool_gt?: Maybe<Scalars['String']>
  pool_gte?: Maybe<Scalars['String']>
  pool_in?: Maybe<Array<Scalars['String']>>
  pool_lt?: Maybe<Scalars['String']>
  pool_lte?: Maybe<Scalars['String']>
  pool_not?: Maybe<Scalars['String']>
  pool_not_contains?: Maybe<Scalars['String']>
  pool_not_ends_with?: Maybe<Scalars['String']>
  pool_not_in?: Maybe<Array<Scalars['String']>>
  pool_not_starts_with?: Maybe<Scalars['String']>
  pool_starts_with?: Maybe<Scalars['String']>
  recipient?: Maybe<Scalars['v3polygon_Bytes']>
  recipient_contains?: Maybe<Scalars['v3polygon_Bytes']>
  recipient_in?: Maybe<Array<Scalars['v3polygon_Bytes']>>
  recipient_not?: Maybe<Scalars['v3polygon_Bytes']>
  recipient_not_contains?: Maybe<Scalars['v3polygon_Bytes']>
  recipient_not_in?: Maybe<Array<Scalars['v3polygon_Bytes']>>
  sender?: Maybe<Scalars['v3polygon_Bytes']>
  sender_contains?: Maybe<Scalars['v3polygon_Bytes']>
  sender_in?: Maybe<Array<Scalars['v3polygon_Bytes']>>
  sender_not?: Maybe<Scalars['v3polygon_Bytes']>
  sender_not_contains?: Maybe<Scalars['v3polygon_Bytes']>
  sender_not_in?: Maybe<Array<Scalars['v3polygon_Bytes']>>
  sqrtPriceX96?: Maybe<Scalars['v3polygon_BigInt']>
  sqrtPriceX96_gt?: Maybe<Scalars['v3polygon_BigInt']>
  sqrtPriceX96_gte?: Maybe<Scalars['v3polygon_BigInt']>
  sqrtPriceX96_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  sqrtPriceX96_lt?: Maybe<Scalars['v3polygon_BigInt']>
  sqrtPriceX96_lte?: Maybe<Scalars['v3polygon_BigInt']>
  sqrtPriceX96_not?: Maybe<Scalars['v3polygon_BigInt']>
  sqrtPriceX96_not_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  tick?: Maybe<Scalars['v3polygon_BigInt']>
  tick_gt?: Maybe<Scalars['v3polygon_BigInt']>
  tick_gte?: Maybe<Scalars['v3polygon_BigInt']>
  tick_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  tick_lt?: Maybe<Scalars['v3polygon_BigInt']>
  tick_lte?: Maybe<Scalars['v3polygon_BigInt']>
  tick_not?: Maybe<Scalars['v3polygon_BigInt']>
  tick_not_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  timestamp?: Maybe<Scalars['v3polygon_BigInt']>
  timestamp_gt?: Maybe<Scalars['v3polygon_BigInt']>
  timestamp_gte?: Maybe<Scalars['v3polygon_BigInt']>
  timestamp_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  timestamp_lt?: Maybe<Scalars['v3polygon_BigInt']>
  timestamp_lte?: Maybe<Scalars['v3polygon_BigInt']>
  timestamp_not?: Maybe<Scalars['v3polygon_BigInt']>
  timestamp_not_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  token0?: Maybe<Scalars['String']>
  token0_contains?: Maybe<Scalars['String']>
  token0_ends_with?: Maybe<Scalars['String']>
  token0_gt?: Maybe<Scalars['String']>
  token0_gte?: Maybe<Scalars['String']>
  token0_in?: Maybe<Array<Scalars['String']>>
  token0_lt?: Maybe<Scalars['String']>
  token0_lte?: Maybe<Scalars['String']>
  token0_not?: Maybe<Scalars['String']>
  token0_not_contains?: Maybe<Scalars['String']>
  token0_not_ends_with?: Maybe<Scalars['String']>
  token0_not_in?: Maybe<Array<Scalars['String']>>
  token0_not_starts_with?: Maybe<Scalars['String']>
  token0_starts_with?: Maybe<Scalars['String']>
  token1?: Maybe<Scalars['String']>
  token1_contains?: Maybe<Scalars['String']>
  token1_ends_with?: Maybe<Scalars['String']>
  token1_gt?: Maybe<Scalars['String']>
  token1_gte?: Maybe<Scalars['String']>
  token1_in?: Maybe<Array<Scalars['String']>>
  token1_lt?: Maybe<Scalars['String']>
  token1_lte?: Maybe<Scalars['String']>
  token1_not?: Maybe<Scalars['String']>
  token1_not_contains?: Maybe<Scalars['String']>
  token1_not_ends_with?: Maybe<Scalars['String']>
  token1_not_in?: Maybe<Array<Scalars['String']>>
  token1_not_starts_with?: Maybe<Scalars['String']>
  token1_starts_with?: Maybe<Scalars['String']>
  transaction?: Maybe<Scalars['String']>
  transaction_contains?: Maybe<Scalars['String']>
  transaction_ends_with?: Maybe<Scalars['String']>
  transaction_gt?: Maybe<Scalars['String']>
  transaction_gte?: Maybe<Scalars['String']>
  transaction_in?: Maybe<Array<Scalars['String']>>
  transaction_lt?: Maybe<Scalars['String']>
  transaction_lte?: Maybe<Scalars['String']>
  transaction_not?: Maybe<Scalars['String']>
  transaction_not_contains?: Maybe<Scalars['String']>
  transaction_not_ends_with?: Maybe<Scalars['String']>
  transaction_not_in?: Maybe<Array<Scalars['String']>>
  transaction_not_starts_with?: Maybe<Scalars['String']>
  transaction_starts_with?: Maybe<Scalars['String']>
}

export enum V3polygon_Swap_OrderBy {
  Amount0 = 'amount0',
  Amount1 = 'amount1',
  AmountUsd = 'amountUSD',
  Id = 'id',
  LogIndex = 'logIndex',
  Origin = 'origin',
  Pool = 'pool',
  Recipient = 'recipient',
  Sender = 'sender',
  SqrtPriceX96 = 'sqrtPriceX96',
  Tick = 'tick',
  Timestamp = 'timestamp',
  Token0 = 'token0',
  Token1 = 'token1',
  Transaction = 'transaction',
}

export type V3polygon_Tick = {
  __typename?: 'v3polygon_Tick'
  collectedFeesToken0: Scalars['v3polygon_BigDecimal']
  collectedFeesToken1: Scalars['v3polygon_BigDecimal']
  collectedFeesUSD: Scalars['v3polygon_BigDecimal']
  createdAtBlockNumber: Scalars['v3polygon_BigInt']
  createdAtTimestamp: Scalars['v3polygon_BigInt']
  feeGrowthOutside0X128: Scalars['v3polygon_BigInt']
  feeGrowthOutside1X128: Scalars['v3polygon_BigInt']
  feesUSD: Scalars['v3polygon_BigDecimal']
  id: Scalars['ID']
  liquidityGross: Scalars['v3polygon_BigInt']
  liquidityNet: Scalars['v3polygon_BigInt']
  liquidityProviderCount: Scalars['v3polygon_BigInt']
  pool: V3polygon_Pool
  poolAddress?: Maybe<Scalars['String']>
  price0: Scalars['v3polygon_BigDecimal']
  price1: Scalars['v3polygon_BigDecimal']
  tickIdx: Scalars['v3polygon_BigInt']
  untrackedVolumeUSD: Scalars['v3polygon_BigDecimal']
  volumeToken0: Scalars['v3polygon_BigDecimal']
  volumeToken1: Scalars['v3polygon_BigDecimal']
  volumeUSD: Scalars['v3polygon_BigDecimal']
}

export type V3polygon_TickDayData = {
  __typename?: 'v3polygon_TickDayData'
  date: Scalars['Int']
  feeGrowthOutside0X128: Scalars['v3polygon_BigInt']
  feeGrowthOutside1X128: Scalars['v3polygon_BigInt']
  feesUSD: Scalars['v3polygon_BigDecimal']
  id: Scalars['ID']
  liquidityGross: Scalars['v3polygon_BigInt']
  liquidityNet: Scalars['v3polygon_BigInt']
  pool: V3polygon_Pool
  tick: V3polygon_Tick
  volumeToken0: Scalars['v3polygon_BigDecimal']
  volumeToken1: Scalars['v3polygon_BigDecimal']
  volumeUSD: Scalars['v3polygon_BigDecimal']
}

export type V3polygon_TickDayData_Filter = {
  date?: Maybe<Scalars['Int']>
  date_gt?: Maybe<Scalars['Int']>
  date_gte?: Maybe<Scalars['Int']>
  date_in?: Maybe<Array<Scalars['Int']>>
  date_lt?: Maybe<Scalars['Int']>
  date_lte?: Maybe<Scalars['Int']>
  date_not?: Maybe<Scalars['Int']>
  date_not_in?: Maybe<Array<Scalars['Int']>>
  feeGrowthOutside0X128?: Maybe<Scalars['v3polygon_BigInt']>
  feeGrowthOutside0X128_gt?: Maybe<Scalars['v3polygon_BigInt']>
  feeGrowthOutside0X128_gte?: Maybe<Scalars['v3polygon_BigInt']>
  feeGrowthOutside0X128_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  feeGrowthOutside0X128_lt?: Maybe<Scalars['v3polygon_BigInt']>
  feeGrowthOutside0X128_lte?: Maybe<Scalars['v3polygon_BigInt']>
  feeGrowthOutside0X128_not?: Maybe<Scalars['v3polygon_BigInt']>
  feeGrowthOutside0X128_not_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  feeGrowthOutside1X128?: Maybe<Scalars['v3polygon_BigInt']>
  feeGrowthOutside1X128_gt?: Maybe<Scalars['v3polygon_BigInt']>
  feeGrowthOutside1X128_gte?: Maybe<Scalars['v3polygon_BigInt']>
  feeGrowthOutside1X128_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  feeGrowthOutside1X128_lt?: Maybe<Scalars['v3polygon_BigInt']>
  feeGrowthOutside1X128_lte?: Maybe<Scalars['v3polygon_BigInt']>
  feeGrowthOutside1X128_not?: Maybe<Scalars['v3polygon_BigInt']>
  feeGrowthOutside1X128_not_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  feesUSD?: Maybe<Scalars['v3polygon_BigDecimal']>
  feesUSD_gt?: Maybe<Scalars['v3polygon_BigDecimal']>
  feesUSD_gte?: Maybe<Scalars['v3polygon_BigDecimal']>
  feesUSD_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  feesUSD_lt?: Maybe<Scalars['v3polygon_BigDecimal']>
  feesUSD_lte?: Maybe<Scalars['v3polygon_BigDecimal']>
  feesUSD_not?: Maybe<Scalars['v3polygon_BigDecimal']>
  feesUSD_not_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  id?: Maybe<Scalars['ID']>
  id_gt?: Maybe<Scalars['ID']>
  id_gte?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  id_lt?: Maybe<Scalars['ID']>
  id_lte?: Maybe<Scalars['ID']>
  id_not?: Maybe<Scalars['ID']>
  id_not_in?: Maybe<Array<Scalars['ID']>>
  liquidityGross?: Maybe<Scalars['v3polygon_BigInt']>
  liquidityGross_gt?: Maybe<Scalars['v3polygon_BigInt']>
  liquidityGross_gte?: Maybe<Scalars['v3polygon_BigInt']>
  liquidityGross_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  liquidityGross_lt?: Maybe<Scalars['v3polygon_BigInt']>
  liquidityGross_lte?: Maybe<Scalars['v3polygon_BigInt']>
  liquidityGross_not?: Maybe<Scalars['v3polygon_BigInt']>
  liquidityGross_not_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  liquidityNet?: Maybe<Scalars['v3polygon_BigInt']>
  liquidityNet_gt?: Maybe<Scalars['v3polygon_BigInt']>
  liquidityNet_gte?: Maybe<Scalars['v3polygon_BigInt']>
  liquidityNet_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  liquidityNet_lt?: Maybe<Scalars['v3polygon_BigInt']>
  liquidityNet_lte?: Maybe<Scalars['v3polygon_BigInt']>
  liquidityNet_not?: Maybe<Scalars['v3polygon_BigInt']>
  liquidityNet_not_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  pool?: Maybe<Scalars['String']>
  pool_contains?: Maybe<Scalars['String']>
  pool_ends_with?: Maybe<Scalars['String']>
  pool_gt?: Maybe<Scalars['String']>
  pool_gte?: Maybe<Scalars['String']>
  pool_in?: Maybe<Array<Scalars['String']>>
  pool_lt?: Maybe<Scalars['String']>
  pool_lte?: Maybe<Scalars['String']>
  pool_not?: Maybe<Scalars['String']>
  pool_not_contains?: Maybe<Scalars['String']>
  pool_not_ends_with?: Maybe<Scalars['String']>
  pool_not_in?: Maybe<Array<Scalars['String']>>
  pool_not_starts_with?: Maybe<Scalars['String']>
  pool_starts_with?: Maybe<Scalars['String']>
  tick?: Maybe<Scalars['String']>
  tick_contains?: Maybe<Scalars['String']>
  tick_ends_with?: Maybe<Scalars['String']>
  tick_gt?: Maybe<Scalars['String']>
  tick_gte?: Maybe<Scalars['String']>
  tick_in?: Maybe<Array<Scalars['String']>>
  tick_lt?: Maybe<Scalars['String']>
  tick_lte?: Maybe<Scalars['String']>
  tick_not?: Maybe<Scalars['String']>
  tick_not_contains?: Maybe<Scalars['String']>
  tick_not_ends_with?: Maybe<Scalars['String']>
  tick_not_in?: Maybe<Array<Scalars['String']>>
  tick_not_starts_with?: Maybe<Scalars['String']>
  tick_starts_with?: Maybe<Scalars['String']>
  volumeToken0?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeToken0_gt?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeToken0_gte?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeToken0_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  volumeToken0_lt?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeToken0_lte?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeToken0_not?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeToken0_not_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  volumeToken1?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeToken1_gt?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeToken1_gte?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeToken1_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  volumeToken1_lt?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeToken1_lte?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeToken1_not?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeToken1_not_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  volumeUSD?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeUSD_gt?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeUSD_gte?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeUSD_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  volumeUSD_lt?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeUSD_lte?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeUSD_not?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeUSD_not_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
}

export enum V3polygon_TickDayData_OrderBy {
  Date = 'date',
  FeeGrowthOutside0X128 = 'feeGrowthOutside0X128',
  FeeGrowthOutside1X128 = 'feeGrowthOutside1X128',
  FeesUsd = 'feesUSD',
  Id = 'id',
  LiquidityGross = 'liquidityGross',
  LiquidityNet = 'liquidityNet',
  Pool = 'pool',
  Tick = 'tick',
  VolumeToken0 = 'volumeToken0',
  VolumeToken1 = 'volumeToken1',
  VolumeUsd = 'volumeUSD',
}

export type V3polygon_TickHourData = {
  __typename?: 'v3polygon_TickHourData'
  feesUSD: Scalars['v3polygon_BigDecimal']
  id: Scalars['ID']
  liquidityGross: Scalars['v3polygon_BigInt']
  liquidityNet: Scalars['v3polygon_BigInt']
  periodStartUnix: Scalars['Int']
  pool: V3polygon_Pool
  tick: V3polygon_Tick
  volumeToken0: Scalars['v3polygon_BigDecimal']
  volumeToken1: Scalars['v3polygon_BigDecimal']
  volumeUSD: Scalars['v3polygon_BigDecimal']
}

export type V3polygon_TickHourData_Filter = {
  feesUSD?: Maybe<Scalars['v3polygon_BigDecimal']>
  feesUSD_gt?: Maybe<Scalars['v3polygon_BigDecimal']>
  feesUSD_gte?: Maybe<Scalars['v3polygon_BigDecimal']>
  feesUSD_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  feesUSD_lt?: Maybe<Scalars['v3polygon_BigDecimal']>
  feesUSD_lte?: Maybe<Scalars['v3polygon_BigDecimal']>
  feesUSD_not?: Maybe<Scalars['v3polygon_BigDecimal']>
  feesUSD_not_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  id?: Maybe<Scalars['ID']>
  id_gt?: Maybe<Scalars['ID']>
  id_gte?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  id_lt?: Maybe<Scalars['ID']>
  id_lte?: Maybe<Scalars['ID']>
  id_not?: Maybe<Scalars['ID']>
  id_not_in?: Maybe<Array<Scalars['ID']>>
  liquidityGross?: Maybe<Scalars['v3polygon_BigInt']>
  liquidityGross_gt?: Maybe<Scalars['v3polygon_BigInt']>
  liquidityGross_gte?: Maybe<Scalars['v3polygon_BigInt']>
  liquidityGross_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  liquidityGross_lt?: Maybe<Scalars['v3polygon_BigInt']>
  liquidityGross_lte?: Maybe<Scalars['v3polygon_BigInt']>
  liquidityGross_not?: Maybe<Scalars['v3polygon_BigInt']>
  liquidityGross_not_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  liquidityNet?: Maybe<Scalars['v3polygon_BigInt']>
  liquidityNet_gt?: Maybe<Scalars['v3polygon_BigInt']>
  liquidityNet_gte?: Maybe<Scalars['v3polygon_BigInt']>
  liquidityNet_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  liquidityNet_lt?: Maybe<Scalars['v3polygon_BigInt']>
  liquidityNet_lte?: Maybe<Scalars['v3polygon_BigInt']>
  liquidityNet_not?: Maybe<Scalars['v3polygon_BigInt']>
  liquidityNet_not_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  periodStartUnix?: Maybe<Scalars['Int']>
  periodStartUnix_gt?: Maybe<Scalars['Int']>
  periodStartUnix_gte?: Maybe<Scalars['Int']>
  periodStartUnix_in?: Maybe<Array<Scalars['Int']>>
  periodStartUnix_lt?: Maybe<Scalars['Int']>
  periodStartUnix_lte?: Maybe<Scalars['Int']>
  periodStartUnix_not?: Maybe<Scalars['Int']>
  periodStartUnix_not_in?: Maybe<Array<Scalars['Int']>>
  pool?: Maybe<Scalars['String']>
  pool_contains?: Maybe<Scalars['String']>
  pool_ends_with?: Maybe<Scalars['String']>
  pool_gt?: Maybe<Scalars['String']>
  pool_gte?: Maybe<Scalars['String']>
  pool_in?: Maybe<Array<Scalars['String']>>
  pool_lt?: Maybe<Scalars['String']>
  pool_lte?: Maybe<Scalars['String']>
  pool_not?: Maybe<Scalars['String']>
  pool_not_contains?: Maybe<Scalars['String']>
  pool_not_ends_with?: Maybe<Scalars['String']>
  pool_not_in?: Maybe<Array<Scalars['String']>>
  pool_not_starts_with?: Maybe<Scalars['String']>
  pool_starts_with?: Maybe<Scalars['String']>
  tick?: Maybe<Scalars['String']>
  tick_contains?: Maybe<Scalars['String']>
  tick_ends_with?: Maybe<Scalars['String']>
  tick_gt?: Maybe<Scalars['String']>
  tick_gte?: Maybe<Scalars['String']>
  tick_in?: Maybe<Array<Scalars['String']>>
  tick_lt?: Maybe<Scalars['String']>
  tick_lte?: Maybe<Scalars['String']>
  tick_not?: Maybe<Scalars['String']>
  tick_not_contains?: Maybe<Scalars['String']>
  tick_not_ends_with?: Maybe<Scalars['String']>
  tick_not_in?: Maybe<Array<Scalars['String']>>
  tick_not_starts_with?: Maybe<Scalars['String']>
  tick_starts_with?: Maybe<Scalars['String']>
  volumeToken0?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeToken0_gt?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeToken0_gte?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeToken0_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  volumeToken0_lt?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeToken0_lte?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeToken0_not?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeToken0_not_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  volumeToken1?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeToken1_gt?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeToken1_gte?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeToken1_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  volumeToken1_lt?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeToken1_lte?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeToken1_not?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeToken1_not_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  volumeUSD?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeUSD_gt?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeUSD_gte?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeUSD_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  volumeUSD_lt?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeUSD_lte?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeUSD_not?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeUSD_not_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
}

export enum V3polygon_TickHourData_OrderBy {
  FeesUsd = 'feesUSD',
  Id = 'id',
  LiquidityGross = 'liquidityGross',
  LiquidityNet = 'liquidityNet',
  PeriodStartUnix = 'periodStartUnix',
  Pool = 'pool',
  Tick = 'tick',
  VolumeToken0 = 'volumeToken0',
  VolumeToken1 = 'volumeToken1',
  VolumeUsd = 'volumeUSD',
}

export type V3polygon_Tick_Filter = {
  collectedFeesToken0?: Maybe<Scalars['v3polygon_BigDecimal']>
  collectedFeesToken0_gt?: Maybe<Scalars['v3polygon_BigDecimal']>
  collectedFeesToken0_gte?: Maybe<Scalars['v3polygon_BigDecimal']>
  collectedFeesToken0_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  collectedFeesToken0_lt?: Maybe<Scalars['v3polygon_BigDecimal']>
  collectedFeesToken0_lte?: Maybe<Scalars['v3polygon_BigDecimal']>
  collectedFeesToken0_not?: Maybe<Scalars['v3polygon_BigDecimal']>
  collectedFeesToken0_not_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  collectedFeesToken1?: Maybe<Scalars['v3polygon_BigDecimal']>
  collectedFeesToken1_gt?: Maybe<Scalars['v3polygon_BigDecimal']>
  collectedFeesToken1_gte?: Maybe<Scalars['v3polygon_BigDecimal']>
  collectedFeesToken1_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  collectedFeesToken1_lt?: Maybe<Scalars['v3polygon_BigDecimal']>
  collectedFeesToken1_lte?: Maybe<Scalars['v3polygon_BigDecimal']>
  collectedFeesToken1_not?: Maybe<Scalars['v3polygon_BigDecimal']>
  collectedFeesToken1_not_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  collectedFeesUSD?: Maybe<Scalars['v3polygon_BigDecimal']>
  collectedFeesUSD_gt?: Maybe<Scalars['v3polygon_BigDecimal']>
  collectedFeesUSD_gte?: Maybe<Scalars['v3polygon_BigDecimal']>
  collectedFeesUSD_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  collectedFeesUSD_lt?: Maybe<Scalars['v3polygon_BigDecimal']>
  collectedFeesUSD_lte?: Maybe<Scalars['v3polygon_BigDecimal']>
  collectedFeesUSD_not?: Maybe<Scalars['v3polygon_BigDecimal']>
  collectedFeesUSD_not_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  createdAtBlockNumber?: Maybe<Scalars['v3polygon_BigInt']>
  createdAtBlockNumber_gt?: Maybe<Scalars['v3polygon_BigInt']>
  createdAtBlockNumber_gte?: Maybe<Scalars['v3polygon_BigInt']>
  createdAtBlockNumber_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  createdAtBlockNumber_lt?: Maybe<Scalars['v3polygon_BigInt']>
  createdAtBlockNumber_lte?: Maybe<Scalars['v3polygon_BigInt']>
  createdAtBlockNumber_not?: Maybe<Scalars['v3polygon_BigInt']>
  createdAtBlockNumber_not_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  createdAtTimestamp?: Maybe<Scalars['v3polygon_BigInt']>
  createdAtTimestamp_gt?: Maybe<Scalars['v3polygon_BigInt']>
  createdAtTimestamp_gte?: Maybe<Scalars['v3polygon_BigInt']>
  createdAtTimestamp_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  createdAtTimestamp_lt?: Maybe<Scalars['v3polygon_BigInt']>
  createdAtTimestamp_lte?: Maybe<Scalars['v3polygon_BigInt']>
  createdAtTimestamp_not?: Maybe<Scalars['v3polygon_BigInt']>
  createdAtTimestamp_not_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  feeGrowthOutside0X128?: Maybe<Scalars['v3polygon_BigInt']>
  feeGrowthOutside0X128_gt?: Maybe<Scalars['v3polygon_BigInt']>
  feeGrowthOutside0X128_gte?: Maybe<Scalars['v3polygon_BigInt']>
  feeGrowthOutside0X128_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  feeGrowthOutside0X128_lt?: Maybe<Scalars['v3polygon_BigInt']>
  feeGrowthOutside0X128_lte?: Maybe<Scalars['v3polygon_BigInt']>
  feeGrowthOutside0X128_not?: Maybe<Scalars['v3polygon_BigInt']>
  feeGrowthOutside0X128_not_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  feeGrowthOutside1X128?: Maybe<Scalars['v3polygon_BigInt']>
  feeGrowthOutside1X128_gt?: Maybe<Scalars['v3polygon_BigInt']>
  feeGrowthOutside1X128_gte?: Maybe<Scalars['v3polygon_BigInt']>
  feeGrowthOutside1X128_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  feeGrowthOutside1X128_lt?: Maybe<Scalars['v3polygon_BigInt']>
  feeGrowthOutside1X128_lte?: Maybe<Scalars['v3polygon_BigInt']>
  feeGrowthOutside1X128_not?: Maybe<Scalars['v3polygon_BigInt']>
  feeGrowthOutside1X128_not_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  feesUSD?: Maybe<Scalars['v3polygon_BigDecimal']>
  feesUSD_gt?: Maybe<Scalars['v3polygon_BigDecimal']>
  feesUSD_gte?: Maybe<Scalars['v3polygon_BigDecimal']>
  feesUSD_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  feesUSD_lt?: Maybe<Scalars['v3polygon_BigDecimal']>
  feesUSD_lte?: Maybe<Scalars['v3polygon_BigDecimal']>
  feesUSD_not?: Maybe<Scalars['v3polygon_BigDecimal']>
  feesUSD_not_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  id?: Maybe<Scalars['ID']>
  id_gt?: Maybe<Scalars['ID']>
  id_gte?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  id_lt?: Maybe<Scalars['ID']>
  id_lte?: Maybe<Scalars['ID']>
  id_not?: Maybe<Scalars['ID']>
  id_not_in?: Maybe<Array<Scalars['ID']>>
  liquidityGross?: Maybe<Scalars['v3polygon_BigInt']>
  liquidityGross_gt?: Maybe<Scalars['v3polygon_BigInt']>
  liquidityGross_gte?: Maybe<Scalars['v3polygon_BigInt']>
  liquidityGross_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  liquidityGross_lt?: Maybe<Scalars['v3polygon_BigInt']>
  liquidityGross_lte?: Maybe<Scalars['v3polygon_BigInt']>
  liquidityGross_not?: Maybe<Scalars['v3polygon_BigInt']>
  liquidityGross_not_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  liquidityNet?: Maybe<Scalars['v3polygon_BigInt']>
  liquidityNet_gt?: Maybe<Scalars['v3polygon_BigInt']>
  liquidityNet_gte?: Maybe<Scalars['v3polygon_BigInt']>
  liquidityNet_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  liquidityNet_lt?: Maybe<Scalars['v3polygon_BigInt']>
  liquidityNet_lte?: Maybe<Scalars['v3polygon_BigInt']>
  liquidityNet_not?: Maybe<Scalars['v3polygon_BigInt']>
  liquidityNet_not_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  liquidityProviderCount?: Maybe<Scalars['v3polygon_BigInt']>
  liquidityProviderCount_gt?: Maybe<Scalars['v3polygon_BigInt']>
  liquidityProviderCount_gte?: Maybe<Scalars['v3polygon_BigInt']>
  liquidityProviderCount_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  liquidityProviderCount_lt?: Maybe<Scalars['v3polygon_BigInt']>
  liquidityProviderCount_lte?: Maybe<Scalars['v3polygon_BigInt']>
  liquidityProviderCount_not?: Maybe<Scalars['v3polygon_BigInt']>
  liquidityProviderCount_not_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  pool?: Maybe<Scalars['String']>
  poolAddress?: Maybe<Scalars['String']>
  poolAddress_contains?: Maybe<Scalars['String']>
  poolAddress_ends_with?: Maybe<Scalars['String']>
  poolAddress_gt?: Maybe<Scalars['String']>
  poolAddress_gte?: Maybe<Scalars['String']>
  poolAddress_in?: Maybe<Array<Scalars['String']>>
  poolAddress_lt?: Maybe<Scalars['String']>
  poolAddress_lte?: Maybe<Scalars['String']>
  poolAddress_not?: Maybe<Scalars['String']>
  poolAddress_not_contains?: Maybe<Scalars['String']>
  poolAddress_not_ends_with?: Maybe<Scalars['String']>
  poolAddress_not_in?: Maybe<Array<Scalars['String']>>
  poolAddress_not_starts_with?: Maybe<Scalars['String']>
  poolAddress_starts_with?: Maybe<Scalars['String']>
  pool_contains?: Maybe<Scalars['String']>
  pool_ends_with?: Maybe<Scalars['String']>
  pool_gt?: Maybe<Scalars['String']>
  pool_gte?: Maybe<Scalars['String']>
  pool_in?: Maybe<Array<Scalars['String']>>
  pool_lt?: Maybe<Scalars['String']>
  pool_lte?: Maybe<Scalars['String']>
  pool_not?: Maybe<Scalars['String']>
  pool_not_contains?: Maybe<Scalars['String']>
  pool_not_ends_with?: Maybe<Scalars['String']>
  pool_not_in?: Maybe<Array<Scalars['String']>>
  pool_not_starts_with?: Maybe<Scalars['String']>
  pool_starts_with?: Maybe<Scalars['String']>
  price0?: Maybe<Scalars['v3polygon_BigDecimal']>
  price0_gt?: Maybe<Scalars['v3polygon_BigDecimal']>
  price0_gte?: Maybe<Scalars['v3polygon_BigDecimal']>
  price0_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  price0_lt?: Maybe<Scalars['v3polygon_BigDecimal']>
  price0_lte?: Maybe<Scalars['v3polygon_BigDecimal']>
  price0_not?: Maybe<Scalars['v3polygon_BigDecimal']>
  price0_not_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  price1?: Maybe<Scalars['v3polygon_BigDecimal']>
  price1_gt?: Maybe<Scalars['v3polygon_BigDecimal']>
  price1_gte?: Maybe<Scalars['v3polygon_BigDecimal']>
  price1_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  price1_lt?: Maybe<Scalars['v3polygon_BigDecimal']>
  price1_lte?: Maybe<Scalars['v3polygon_BigDecimal']>
  price1_not?: Maybe<Scalars['v3polygon_BigDecimal']>
  price1_not_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  tickIdx?: Maybe<Scalars['v3polygon_BigInt']>
  tickIdx_gt?: Maybe<Scalars['v3polygon_BigInt']>
  tickIdx_gte?: Maybe<Scalars['v3polygon_BigInt']>
  tickIdx_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  tickIdx_lt?: Maybe<Scalars['v3polygon_BigInt']>
  tickIdx_lte?: Maybe<Scalars['v3polygon_BigInt']>
  tickIdx_not?: Maybe<Scalars['v3polygon_BigInt']>
  tickIdx_not_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  untrackedVolumeUSD?: Maybe<Scalars['v3polygon_BigDecimal']>
  untrackedVolumeUSD_gt?: Maybe<Scalars['v3polygon_BigDecimal']>
  untrackedVolumeUSD_gte?: Maybe<Scalars['v3polygon_BigDecimal']>
  untrackedVolumeUSD_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  untrackedVolumeUSD_lt?: Maybe<Scalars['v3polygon_BigDecimal']>
  untrackedVolumeUSD_lte?: Maybe<Scalars['v3polygon_BigDecimal']>
  untrackedVolumeUSD_not?: Maybe<Scalars['v3polygon_BigDecimal']>
  untrackedVolumeUSD_not_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  volumeToken0?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeToken0_gt?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeToken0_gte?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeToken0_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  volumeToken0_lt?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeToken0_lte?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeToken0_not?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeToken0_not_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  volumeToken1?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeToken1_gt?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeToken1_gte?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeToken1_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  volumeToken1_lt?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeToken1_lte?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeToken1_not?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeToken1_not_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  volumeUSD?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeUSD_gt?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeUSD_gte?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeUSD_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  volumeUSD_lt?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeUSD_lte?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeUSD_not?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeUSD_not_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
}

export enum V3polygon_Tick_OrderBy {
  CollectedFeesToken0 = 'collectedFeesToken0',
  CollectedFeesToken1 = 'collectedFeesToken1',
  CollectedFeesUsd = 'collectedFeesUSD',
  CreatedAtBlockNumber = 'createdAtBlockNumber',
  CreatedAtTimestamp = 'createdAtTimestamp',
  FeeGrowthOutside0X128 = 'feeGrowthOutside0X128',
  FeeGrowthOutside1X128 = 'feeGrowthOutside1X128',
  FeesUsd = 'feesUSD',
  Id = 'id',
  LiquidityGross = 'liquidityGross',
  LiquidityNet = 'liquidityNet',
  LiquidityProviderCount = 'liquidityProviderCount',
  Pool = 'pool',
  PoolAddress = 'poolAddress',
  Price0 = 'price0',
  Price1 = 'price1',
  TickIdx = 'tickIdx',
  UntrackedVolumeUsd = 'untrackedVolumeUSD',
  VolumeToken0 = 'volumeToken0',
  VolumeToken1 = 'volumeToken1',
  VolumeUsd = 'volumeUSD',
}

export type V3polygon_Token = {
  __typename?: 'v3polygon_Token'
  decimals: Scalars['v3polygon_BigInt']
  derivedETH: Scalars['v3polygon_BigDecimal']
  feesUSD: Scalars['v3polygon_BigDecimal']
  id: Scalars['ID']
  name: Scalars['String']
  poolCount: Scalars['v3polygon_BigInt']
  symbol: Scalars['String']
  tokenDayData: Array<V3polygon_TokenDayData>
  totalSupply: Scalars['v3polygon_BigInt']
  totalValueLocked: Scalars['v3polygon_BigDecimal']
  totalValueLockedUSD: Scalars['v3polygon_BigDecimal']
  totalValueLockedUSDUntracked: Scalars['v3polygon_BigDecimal']
  txCount: Scalars['v3polygon_BigInt']
  untrackedVolumeUSD: Scalars['v3polygon_BigDecimal']
  volume: Scalars['v3polygon_BigDecimal']
  volumeUSD: Scalars['v3polygon_BigDecimal']
  whitelistPools: Array<V3polygon_Pool>
}

export type V3polygon_TokenTokenDayDataArgs = {
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3polygon_TokenDayData_OrderBy>
  orderDirection?: Maybe<V3polygon_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  where?: Maybe<V3polygon_TokenDayData_Filter>
}

export type V3polygon_TokenWhitelistPoolsArgs = {
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3polygon_Pool_OrderBy>
  orderDirection?: Maybe<V3polygon_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  where?: Maybe<V3polygon_Pool_Filter>
}

export type V3polygon_TokenDayData = {
  __typename?: 'v3polygon_TokenDayData'
  close: Scalars['v3polygon_BigDecimal']
  date: Scalars['Int']
  feesUSD: Scalars['v3polygon_BigDecimal']
  high: Scalars['v3polygon_BigDecimal']
  id: Scalars['ID']
  low: Scalars['v3polygon_BigDecimal']
  open: Scalars['v3polygon_BigDecimal']
  priceUSD: Scalars['v3polygon_BigDecimal']
  token: V3polygon_Token
  totalValueLocked: Scalars['v3polygon_BigDecimal']
  totalValueLockedUSD: Scalars['v3polygon_BigDecimal']
  untrackedVolumeUSD: Scalars['v3polygon_BigDecimal']
  volume: Scalars['v3polygon_BigDecimal']
  volumeUSD: Scalars['v3polygon_BigDecimal']
}

export type V3polygon_TokenDayData_Filter = {
  close?: Maybe<Scalars['v3polygon_BigDecimal']>
  close_gt?: Maybe<Scalars['v3polygon_BigDecimal']>
  close_gte?: Maybe<Scalars['v3polygon_BigDecimal']>
  close_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  close_lt?: Maybe<Scalars['v3polygon_BigDecimal']>
  close_lte?: Maybe<Scalars['v3polygon_BigDecimal']>
  close_not?: Maybe<Scalars['v3polygon_BigDecimal']>
  close_not_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  date?: Maybe<Scalars['Int']>
  date_gt?: Maybe<Scalars['Int']>
  date_gte?: Maybe<Scalars['Int']>
  date_in?: Maybe<Array<Scalars['Int']>>
  date_lt?: Maybe<Scalars['Int']>
  date_lte?: Maybe<Scalars['Int']>
  date_not?: Maybe<Scalars['Int']>
  date_not_in?: Maybe<Array<Scalars['Int']>>
  feesUSD?: Maybe<Scalars['v3polygon_BigDecimal']>
  feesUSD_gt?: Maybe<Scalars['v3polygon_BigDecimal']>
  feesUSD_gte?: Maybe<Scalars['v3polygon_BigDecimal']>
  feesUSD_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  feesUSD_lt?: Maybe<Scalars['v3polygon_BigDecimal']>
  feesUSD_lte?: Maybe<Scalars['v3polygon_BigDecimal']>
  feesUSD_not?: Maybe<Scalars['v3polygon_BigDecimal']>
  feesUSD_not_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  high?: Maybe<Scalars['v3polygon_BigDecimal']>
  high_gt?: Maybe<Scalars['v3polygon_BigDecimal']>
  high_gte?: Maybe<Scalars['v3polygon_BigDecimal']>
  high_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  high_lt?: Maybe<Scalars['v3polygon_BigDecimal']>
  high_lte?: Maybe<Scalars['v3polygon_BigDecimal']>
  high_not?: Maybe<Scalars['v3polygon_BigDecimal']>
  high_not_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  id?: Maybe<Scalars['ID']>
  id_gt?: Maybe<Scalars['ID']>
  id_gte?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  id_lt?: Maybe<Scalars['ID']>
  id_lte?: Maybe<Scalars['ID']>
  id_not?: Maybe<Scalars['ID']>
  id_not_in?: Maybe<Array<Scalars['ID']>>
  low?: Maybe<Scalars['v3polygon_BigDecimal']>
  low_gt?: Maybe<Scalars['v3polygon_BigDecimal']>
  low_gte?: Maybe<Scalars['v3polygon_BigDecimal']>
  low_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  low_lt?: Maybe<Scalars['v3polygon_BigDecimal']>
  low_lte?: Maybe<Scalars['v3polygon_BigDecimal']>
  low_not?: Maybe<Scalars['v3polygon_BigDecimal']>
  low_not_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  open?: Maybe<Scalars['v3polygon_BigDecimal']>
  open_gt?: Maybe<Scalars['v3polygon_BigDecimal']>
  open_gte?: Maybe<Scalars['v3polygon_BigDecimal']>
  open_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  open_lt?: Maybe<Scalars['v3polygon_BigDecimal']>
  open_lte?: Maybe<Scalars['v3polygon_BigDecimal']>
  open_not?: Maybe<Scalars['v3polygon_BigDecimal']>
  open_not_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  priceUSD?: Maybe<Scalars['v3polygon_BigDecimal']>
  priceUSD_gt?: Maybe<Scalars['v3polygon_BigDecimal']>
  priceUSD_gte?: Maybe<Scalars['v3polygon_BigDecimal']>
  priceUSD_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  priceUSD_lt?: Maybe<Scalars['v3polygon_BigDecimal']>
  priceUSD_lte?: Maybe<Scalars['v3polygon_BigDecimal']>
  priceUSD_not?: Maybe<Scalars['v3polygon_BigDecimal']>
  priceUSD_not_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  token?: Maybe<Scalars['String']>
  token_contains?: Maybe<Scalars['String']>
  token_ends_with?: Maybe<Scalars['String']>
  token_gt?: Maybe<Scalars['String']>
  token_gte?: Maybe<Scalars['String']>
  token_in?: Maybe<Array<Scalars['String']>>
  token_lt?: Maybe<Scalars['String']>
  token_lte?: Maybe<Scalars['String']>
  token_not?: Maybe<Scalars['String']>
  token_not_contains?: Maybe<Scalars['String']>
  token_not_ends_with?: Maybe<Scalars['String']>
  token_not_in?: Maybe<Array<Scalars['String']>>
  token_not_starts_with?: Maybe<Scalars['String']>
  token_starts_with?: Maybe<Scalars['String']>
  totalValueLocked?: Maybe<Scalars['v3polygon_BigDecimal']>
  totalValueLockedUSD?: Maybe<Scalars['v3polygon_BigDecimal']>
  totalValueLockedUSD_gt?: Maybe<Scalars['v3polygon_BigDecimal']>
  totalValueLockedUSD_gte?: Maybe<Scalars['v3polygon_BigDecimal']>
  totalValueLockedUSD_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  totalValueLockedUSD_lt?: Maybe<Scalars['v3polygon_BigDecimal']>
  totalValueLockedUSD_lte?: Maybe<Scalars['v3polygon_BigDecimal']>
  totalValueLockedUSD_not?: Maybe<Scalars['v3polygon_BigDecimal']>
  totalValueLockedUSD_not_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  totalValueLocked_gt?: Maybe<Scalars['v3polygon_BigDecimal']>
  totalValueLocked_gte?: Maybe<Scalars['v3polygon_BigDecimal']>
  totalValueLocked_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  totalValueLocked_lt?: Maybe<Scalars['v3polygon_BigDecimal']>
  totalValueLocked_lte?: Maybe<Scalars['v3polygon_BigDecimal']>
  totalValueLocked_not?: Maybe<Scalars['v3polygon_BigDecimal']>
  totalValueLocked_not_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  untrackedVolumeUSD?: Maybe<Scalars['v3polygon_BigDecimal']>
  untrackedVolumeUSD_gt?: Maybe<Scalars['v3polygon_BigDecimal']>
  untrackedVolumeUSD_gte?: Maybe<Scalars['v3polygon_BigDecimal']>
  untrackedVolumeUSD_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  untrackedVolumeUSD_lt?: Maybe<Scalars['v3polygon_BigDecimal']>
  untrackedVolumeUSD_lte?: Maybe<Scalars['v3polygon_BigDecimal']>
  untrackedVolumeUSD_not?: Maybe<Scalars['v3polygon_BigDecimal']>
  untrackedVolumeUSD_not_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  volume?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeUSD?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeUSD_gt?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeUSD_gte?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeUSD_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  volumeUSD_lt?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeUSD_lte?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeUSD_not?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeUSD_not_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  volume_gt?: Maybe<Scalars['v3polygon_BigDecimal']>
  volume_gte?: Maybe<Scalars['v3polygon_BigDecimal']>
  volume_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  volume_lt?: Maybe<Scalars['v3polygon_BigDecimal']>
  volume_lte?: Maybe<Scalars['v3polygon_BigDecimal']>
  volume_not?: Maybe<Scalars['v3polygon_BigDecimal']>
  volume_not_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
}

export enum V3polygon_TokenDayData_OrderBy {
  Close = 'close',
  Date = 'date',
  FeesUsd = 'feesUSD',
  High = 'high',
  Id = 'id',
  Low = 'low',
  Open = 'open',
  PriceUsd = 'priceUSD',
  Token = 'token',
  TotalValueLocked = 'totalValueLocked',
  TotalValueLockedUsd = 'totalValueLockedUSD',
  UntrackedVolumeUsd = 'untrackedVolumeUSD',
  Volume = 'volume',
  VolumeUsd = 'volumeUSD',
}

export type V3polygon_TokenHourData = {
  __typename?: 'v3polygon_TokenHourData'
  close: Scalars['v3polygon_BigDecimal']
  feesUSD: Scalars['v3polygon_BigDecimal']
  high: Scalars['v3polygon_BigDecimal']
  id: Scalars['ID']
  low: Scalars['v3polygon_BigDecimal']
  open: Scalars['v3polygon_BigDecimal']
  periodStartUnix: Scalars['Int']
  priceUSD: Scalars['v3polygon_BigDecimal']
  token: V3polygon_Token
  totalValueLocked: Scalars['v3polygon_BigDecimal']
  totalValueLockedUSD: Scalars['v3polygon_BigDecimal']
  untrackedVolumeUSD: Scalars['v3polygon_BigDecimal']
  volume: Scalars['v3polygon_BigDecimal']
  volumeUSD: Scalars['v3polygon_BigDecimal']
}

export type V3polygon_TokenHourData_Filter = {
  close?: Maybe<Scalars['v3polygon_BigDecimal']>
  close_gt?: Maybe<Scalars['v3polygon_BigDecimal']>
  close_gte?: Maybe<Scalars['v3polygon_BigDecimal']>
  close_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  close_lt?: Maybe<Scalars['v3polygon_BigDecimal']>
  close_lte?: Maybe<Scalars['v3polygon_BigDecimal']>
  close_not?: Maybe<Scalars['v3polygon_BigDecimal']>
  close_not_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  feesUSD?: Maybe<Scalars['v3polygon_BigDecimal']>
  feesUSD_gt?: Maybe<Scalars['v3polygon_BigDecimal']>
  feesUSD_gte?: Maybe<Scalars['v3polygon_BigDecimal']>
  feesUSD_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  feesUSD_lt?: Maybe<Scalars['v3polygon_BigDecimal']>
  feesUSD_lte?: Maybe<Scalars['v3polygon_BigDecimal']>
  feesUSD_not?: Maybe<Scalars['v3polygon_BigDecimal']>
  feesUSD_not_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  high?: Maybe<Scalars['v3polygon_BigDecimal']>
  high_gt?: Maybe<Scalars['v3polygon_BigDecimal']>
  high_gte?: Maybe<Scalars['v3polygon_BigDecimal']>
  high_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  high_lt?: Maybe<Scalars['v3polygon_BigDecimal']>
  high_lte?: Maybe<Scalars['v3polygon_BigDecimal']>
  high_not?: Maybe<Scalars['v3polygon_BigDecimal']>
  high_not_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  id?: Maybe<Scalars['ID']>
  id_gt?: Maybe<Scalars['ID']>
  id_gte?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  id_lt?: Maybe<Scalars['ID']>
  id_lte?: Maybe<Scalars['ID']>
  id_not?: Maybe<Scalars['ID']>
  id_not_in?: Maybe<Array<Scalars['ID']>>
  low?: Maybe<Scalars['v3polygon_BigDecimal']>
  low_gt?: Maybe<Scalars['v3polygon_BigDecimal']>
  low_gte?: Maybe<Scalars['v3polygon_BigDecimal']>
  low_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  low_lt?: Maybe<Scalars['v3polygon_BigDecimal']>
  low_lte?: Maybe<Scalars['v3polygon_BigDecimal']>
  low_not?: Maybe<Scalars['v3polygon_BigDecimal']>
  low_not_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  open?: Maybe<Scalars['v3polygon_BigDecimal']>
  open_gt?: Maybe<Scalars['v3polygon_BigDecimal']>
  open_gte?: Maybe<Scalars['v3polygon_BigDecimal']>
  open_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  open_lt?: Maybe<Scalars['v3polygon_BigDecimal']>
  open_lte?: Maybe<Scalars['v3polygon_BigDecimal']>
  open_not?: Maybe<Scalars['v3polygon_BigDecimal']>
  open_not_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  periodStartUnix?: Maybe<Scalars['Int']>
  periodStartUnix_gt?: Maybe<Scalars['Int']>
  periodStartUnix_gte?: Maybe<Scalars['Int']>
  periodStartUnix_in?: Maybe<Array<Scalars['Int']>>
  periodStartUnix_lt?: Maybe<Scalars['Int']>
  periodStartUnix_lte?: Maybe<Scalars['Int']>
  periodStartUnix_not?: Maybe<Scalars['Int']>
  periodStartUnix_not_in?: Maybe<Array<Scalars['Int']>>
  priceUSD?: Maybe<Scalars['v3polygon_BigDecimal']>
  priceUSD_gt?: Maybe<Scalars['v3polygon_BigDecimal']>
  priceUSD_gte?: Maybe<Scalars['v3polygon_BigDecimal']>
  priceUSD_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  priceUSD_lt?: Maybe<Scalars['v3polygon_BigDecimal']>
  priceUSD_lte?: Maybe<Scalars['v3polygon_BigDecimal']>
  priceUSD_not?: Maybe<Scalars['v3polygon_BigDecimal']>
  priceUSD_not_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  token?: Maybe<Scalars['String']>
  token_contains?: Maybe<Scalars['String']>
  token_ends_with?: Maybe<Scalars['String']>
  token_gt?: Maybe<Scalars['String']>
  token_gte?: Maybe<Scalars['String']>
  token_in?: Maybe<Array<Scalars['String']>>
  token_lt?: Maybe<Scalars['String']>
  token_lte?: Maybe<Scalars['String']>
  token_not?: Maybe<Scalars['String']>
  token_not_contains?: Maybe<Scalars['String']>
  token_not_ends_with?: Maybe<Scalars['String']>
  token_not_in?: Maybe<Array<Scalars['String']>>
  token_not_starts_with?: Maybe<Scalars['String']>
  token_starts_with?: Maybe<Scalars['String']>
  totalValueLocked?: Maybe<Scalars['v3polygon_BigDecimal']>
  totalValueLockedUSD?: Maybe<Scalars['v3polygon_BigDecimal']>
  totalValueLockedUSD_gt?: Maybe<Scalars['v3polygon_BigDecimal']>
  totalValueLockedUSD_gte?: Maybe<Scalars['v3polygon_BigDecimal']>
  totalValueLockedUSD_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  totalValueLockedUSD_lt?: Maybe<Scalars['v3polygon_BigDecimal']>
  totalValueLockedUSD_lte?: Maybe<Scalars['v3polygon_BigDecimal']>
  totalValueLockedUSD_not?: Maybe<Scalars['v3polygon_BigDecimal']>
  totalValueLockedUSD_not_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  totalValueLocked_gt?: Maybe<Scalars['v3polygon_BigDecimal']>
  totalValueLocked_gte?: Maybe<Scalars['v3polygon_BigDecimal']>
  totalValueLocked_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  totalValueLocked_lt?: Maybe<Scalars['v3polygon_BigDecimal']>
  totalValueLocked_lte?: Maybe<Scalars['v3polygon_BigDecimal']>
  totalValueLocked_not?: Maybe<Scalars['v3polygon_BigDecimal']>
  totalValueLocked_not_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  untrackedVolumeUSD?: Maybe<Scalars['v3polygon_BigDecimal']>
  untrackedVolumeUSD_gt?: Maybe<Scalars['v3polygon_BigDecimal']>
  untrackedVolumeUSD_gte?: Maybe<Scalars['v3polygon_BigDecimal']>
  untrackedVolumeUSD_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  untrackedVolumeUSD_lt?: Maybe<Scalars['v3polygon_BigDecimal']>
  untrackedVolumeUSD_lte?: Maybe<Scalars['v3polygon_BigDecimal']>
  untrackedVolumeUSD_not?: Maybe<Scalars['v3polygon_BigDecimal']>
  untrackedVolumeUSD_not_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  volume?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeUSD?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeUSD_gt?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeUSD_gte?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeUSD_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  volumeUSD_lt?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeUSD_lte?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeUSD_not?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeUSD_not_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  volume_gt?: Maybe<Scalars['v3polygon_BigDecimal']>
  volume_gte?: Maybe<Scalars['v3polygon_BigDecimal']>
  volume_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  volume_lt?: Maybe<Scalars['v3polygon_BigDecimal']>
  volume_lte?: Maybe<Scalars['v3polygon_BigDecimal']>
  volume_not?: Maybe<Scalars['v3polygon_BigDecimal']>
  volume_not_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
}

export enum V3polygon_TokenHourData_OrderBy {
  Close = 'close',
  FeesUsd = 'feesUSD',
  High = 'high',
  Id = 'id',
  Low = 'low',
  Open = 'open',
  PeriodStartUnix = 'periodStartUnix',
  PriceUsd = 'priceUSD',
  Token = 'token',
  TotalValueLocked = 'totalValueLocked',
  TotalValueLockedUsd = 'totalValueLockedUSD',
  UntrackedVolumeUsd = 'untrackedVolumeUSD',
  Volume = 'volume',
  VolumeUsd = 'volumeUSD',
}

export type V3polygon_Token_Filter = {
  decimals?: Maybe<Scalars['v3polygon_BigInt']>
  decimals_gt?: Maybe<Scalars['v3polygon_BigInt']>
  decimals_gte?: Maybe<Scalars['v3polygon_BigInt']>
  decimals_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  decimals_lt?: Maybe<Scalars['v3polygon_BigInt']>
  decimals_lte?: Maybe<Scalars['v3polygon_BigInt']>
  decimals_not?: Maybe<Scalars['v3polygon_BigInt']>
  decimals_not_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  derivedETH?: Maybe<Scalars['v3polygon_BigDecimal']>
  derivedETH_gt?: Maybe<Scalars['v3polygon_BigDecimal']>
  derivedETH_gte?: Maybe<Scalars['v3polygon_BigDecimal']>
  derivedETH_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  derivedETH_lt?: Maybe<Scalars['v3polygon_BigDecimal']>
  derivedETH_lte?: Maybe<Scalars['v3polygon_BigDecimal']>
  derivedETH_not?: Maybe<Scalars['v3polygon_BigDecimal']>
  derivedETH_not_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  feesUSD?: Maybe<Scalars['v3polygon_BigDecimal']>
  feesUSD_gt?: Maybe<Scalars['v3polygon_BigDecimal']>
  feesUSD_gte?: Maybe<Scalars['v3polygon_BigDecimal']>
  feesUSD_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  feesUSD_lt?: Maybe<Scalars['v3polygon_BigDecimal']>
  feesUSD_lte?: Maybe<Scalars['v3polygon_BigDecimal']>
  feesUSD_not?: Maybe<Scalars['v3polygon_BigDecimal']>
  feesUSD_not_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  id?: Maybe<Scalars['ID']>
  id_gt?: Maybe<Scalars['ID']>
  id_gte?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  id_lt?: Maybe<Scalars['ID']>
  id_lte?: Maybe<Scalars['ID']>
  id_not?: Maybe<Scalars['ID']>
  id_not_in?: Maybe<Array<Scalars['ID']>>
  name?: Maybe<Scalars['String']>
  name_contains?: Maybe<Scalars['String']>
  name_ends_with?: Maybe<Scalars['String']>
  name_gt?: Maybe<Scalars['String']>
  name_gte?: Maybe<Scalars['String']>
  name_in?: Maybe<Array<Scalars['String']>>
  name_lt?: Maybe<Scalars['String']>
  name_lte?: Maybe<Scalars['String']>
  name_not?: Maybe<Scalars['String']>
  name_not_contains?: Maybe<Scalars['String']>
  name_not_ends_with?: Maybe<Scalars['String']>
  name_not_in?: Maybe<Array<Scalars['String']>>
  name_not_starts_with?: Maybe<Scalars['String']>
  name_starts_with?: Maybe<Scalars['String']>
  poolCount?: Maybe<Scalars['v3polygon_BigInt']>
  poolCount_gt?: Maybe<Scalars['v3polygon_BigInt']>
  poolCount_gte?: Maybe<Scalars['v3polygon_BigInt']>
  poolCount_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  poolCount_lt?: Maybe<Scalars['v3polygon_BigInt']>
  poolCount_lte?: Maybe<Scalars['v3polygon_BigInt']>
  poolCount_not?: Maybe<Scalars['v3polygon_BigInt']>
  poolCount_not_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  symbol?: Maybe<Scalars['String']>
  symbol_contains?: Maybe<Scalars['String']>
  symbol_ends_with?: Maybe<Scalars['String']>
  symbol_gt?: Maybe<Scalars['String']>
  symbol_gte?: Maybe<Scalars['String']>
  symbol_in?: Maybe<Array<Scalars['String']>>
  symbol_lt?: Maybe<Scalars['String']>
  symbol_lte?: Maybe<Scalars['String']>
  symbol_not?: Maybe<Scalars['String']>
  symbol_not_contains?: Maybe<Scalars['String']>
  symbol_not_ends_with?: Maybe<Scalars['String']>
  symbol_not_in?: Maybe<Array<Scalars['String']>>
  symbol_not_starts_with?: Maybe<Scalars['String']>
  symbol_starts_with?: Maybe<Scalars['String']>
  totalSupply?: Maybe<Scalars['v3polygon_BigInt']>
  totalSupply_gt?: Maybe<Scalars['v3polygon_BigInt']>
  totalSupply_gte?: Maybe<Scalars['v3polygon_BigInt']>
  totalSupply_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  totalSupply_lt?: Maybe<Scalars['v3polygon_BigInt']>
  totalSupply_lte?: Maybe<Scalars['v3polygon_BigInt']>
  totalSupply_not?: Maybe<Scalars['v3polygon_BigInt']>
  totalSupply_not_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  totalValueLocked?: Maybe<Scalars['v3polygon_BigDecimal']>
  totalValueLockedUSD?: Maybe<Scalars['v3polygon_BigDecimal']>
  totalValueLockedUSDUntracked?: Maybe<Scalars['v3polygon_BigDecimal']>
  totalValueLockedUSDUntracked_gt?: Maybe<Scalars['v3polygon_BigDecimal']>
  totalValueLockedUSDUntracked_gte?: Maybe<Scalars['v3polygon_BigDecimal']>
  totalValueLockedUSDUntracked_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  totalValueLockedUSDUntracked_lt?: Maybe<Scalars['v3polygon_BigDecimal']>
  totalValueLockedUSDUntracked_lte?: Maybe<Scalars['v3polygon_BigDecimal']>
  totalValueLockedUSDUntracked_not?: Maybe<Scalars['v3polygon_BigDecimal']>
  totalValueLockedUSDUntracked_not_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  totalValueLockedUSD_gt?: Maybe<Scalars['v3polygon_BigDecimal']>
  totalValueLockedUSD_gte?: Maybe<Scalars['v3polygon_BigDecimal']>
  totalValueLockedUSD_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  totalValueLockedUSD_lt?: Maybe<Scalars['v3polygon_BigDecimal']>
  totalValueLockedUSD_lte?: Maybe<Scalars['v3polygon_BigDecimal']>
  totalValueLockedUSD_not?: Maybe<Scalars['v3polygon_BigDecimal']>
  totalValueLockedUSD_not_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  totalValueLocked_gt?: Maybe<Scalars['v3polygon_BigDecimal']>
  totalValueLocked_gte?: Maybe<Scalars['v3polygon_BigDecimal']>
  totalValueLocked_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  totalValueLocked_lt?: Maybe<Scalars['v3polygon_BigDecimal']>
  totalValueLocked_lte?: Maybe<Scalars['v3polygon_BigDecimal']>
  totalValueLocked_not?: Maybe<Scalars['v3polygon_BigDecimal']>
  totalValueLocked_not_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  txCount?: Maybe<Scalars['v3polygon_BigInt']>
  txCount_gt?: Maybe<Scalars['v3polygon_BigInt']>
  txCount_gte?: Maybe<Scalars['v3polygon_BigInt']>
  txCount_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  txCount_lt?: Maybe<Scalars['v3polygon_BigInt']>
  txCount_lte?: Maybe<Scalars['v3polygon_BigInt']>
  txCount_not?: Maybe<Scalars['v3polygon_BigInt']>
  txCount_not_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  untrackedVolumeUSD?: Maybe<Scalars['v3polygon_BigDecimal']>
  untrackedVolumeUSD_gt?: Maybe<Scalars['v3polygon_BigDecimal']>
  untrackedVolumeUSD_gte?: Maybe<Scalars['v3polygon_BigDecimal']>
  untrackedVolumeUSD_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  untrackedVolumeUSD_lt?: Maybe<Scalars['v3polygon_BigDecimal']>
  untrackedVolumeUSD_lte?: Maybe<Scalars['v3polygon_BigDecimal']>
  untrackedVolumeUSD_not?: Maybe<Scalars['v3polygon_BigDecimal']>
  untrackedVolumeUSD_not_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  volume?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeUSD?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeUSD_gt?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeUSD_gte?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeUSD_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  volumeUSD_lt?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeUSD_lte?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeUSD_not?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeUSD_not_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  volume_gt?: Maybe<Scalars['v3polygon_BigDecimal']>
  volume_gte?: Maybe<Scalars['v3polygon_BigDecimal']>
  volume_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  volume_lt?: Maybe<Scalars['v3polygon_BigDecimal']>
  volume_lte?: Maybe<Scalars['v3polygon_BigDecimal']>
  volume_not?: Maybe<Scalars['v3polygon_BigDecimal']>
  volume_not_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  whitelistPools?: Maybe<Array<Scalars['String']>>
  whitelistPools_contains?: Maybe<Array<Scalars['String']>>
  whitelistPools_not?: Maybe<Array<Scalars['String']>>
  whitelistPools_not_contains?: Maybe<Array<Scalars['String']>>
}

export enum V3polygon_Token_OrderBy {
  Decimals = 'decimals',
  DerivedEth = 'derivedETH',
  FeesUsd = 'feesUSD',
  Id = 'id',
  Name = 'name',
  PoolCount = 'poolCount',
  Symbol = 'symbol',
  TokenDayData = 'tokenDayData',
  TotalSupply = 'totalSupply',
  TotalValueLocked = 'totalValueLocked',
  TotalValueLockedUsd = 'totalValueLockedUSD',
  TotalValueLockedUsdUntracked = 'totalValueLockedUSDUntracked',
  TxCount = 'txCount',
  UntrackedVolumeUsd = 'untrackedVolumeUSD',
  Volume = 'volume',
  VolumeUsd = 'volumeUSD',
  WhitelistPools = 'whitelistPools',
}

export type V3polygon_Transaction = {
  __typename?: 'v3polygon_Transaction'
  blockNumber: Scalars['v3polygon_BigInt']
  burns: Array<Maybe<V3polygon_Burn>>
  collects: Array<Maybe<V3polygon_Collect>>
  flashed: Array<Maybe<V3polygon_Flash>>
  gasPrice: Scalars['v3polygon_BigInt']
  gasUsed: Scalars['v3polygon_BigInt']
  id: Scalars['ID']
  mints: Array<Maybe<V3polygon_Mint>>
  swaps: Array<Maybe<V3polygon_Swap>>
  timestamp: Scalars['v3polygon_BigInt']
}

export type V3polygon_TransactionBurnsArgs = {
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3polygon_Burn_OrderBy>
  orderDirection?: Maybe<V3polygon_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  where?: Maybe<V3polygon_Burn_Filter>
}

export type V3polygon_TransactionCollectsArgs = {
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3polygon_Collect_OrderBy>
  orderDirection?: Maybe<V3polygon_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  where?: Maybe<V3polygon_Collect_Filter>
}

export type V3polygon_TransactionFlashedArgs = {
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3polygon_Flash_OrderBy>
  orderDirection?: Maybe<V3polygon_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  where?: Maybe<V3polygon_Flash_Filter>
}

export type V3polygon_TransactionMintsArgs = {
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3polygon_Mint_OrderBy>
  orderDirection?: Maybe<V3polygon_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  where?: Maybe<V3polygon_Mint_Filter>
}

export type V3polygon_TransactionSwapsArgs = {
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3polygon_Swap_OrderBy>
  orderDirection?: Maybe<V3polygon_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  where?: Maybe<V3polygon_Swap_Filter>
}

export type V3polygon_Transaction_Filter = {
  blockNumber?: Maybe<Scalars['v3polygon_BigInt']>
  blockNumber_gt?: Maybe<Scalars['v3polygon_BigInt']>
  blockNumber_gte?: Maybe<Scalars['v3polygon_BigInt']>
  blockNumber_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  blockNumber_lt?: Maybe<Scalars['v3polygon_BigInt']>
  blockNumber_lte?: Maybe<Scalars['v3polygon_BigInt']>
  blockNumber_not?: Maybe<Scalars['v3polygon_BigInt']>
  blockNumber_not_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  gasPrice?: Maybe<Scalars['v3polygon_BigInt']>
  gasPrice_gt?: Maybe<Scalars['v3polygon_BigInt']>
  gasPrice_gte?: Maybe<Scalars['v3polygon_BigInt']>
  gasPrice_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  gasPrice_lt?: Maybe<Scalars['v3polygon_BigInt']>
  gasPrice_lte?: Maybe<Scalars['v3polygon_BigInt']>
  gasPrice_not?: Maybe<Scalars['v3polygon_BigInt']>
  gasPrice_not_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  gasUsed?: Maybe<Scalars['v3polygon_BigInt']>
  gasUsed_gt?: Maybe<Scalars['v3polygon_BigInt']>
  gasUsed_gte?: Maybe<Scalars['v3polygon_BigInt']>
  gasUsed_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  gasUsed_lt?: Maybe<Scalars['v3polygon_BigInt']>
  gasUsed_lte?: Maybe<Scalars['v3polygon_BigInt']>
  gasUsed_not?: Maybe<Scalars['v3polygon_BigInt']>
  gasUsed_not_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  id?: Maybe<Scalars['ID']>
  id_gt?: Maybe<Scalars['ID']>
  id_gte?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  id_lt?: Maybe<Scalars['ID']>
  id_lte?: Maybe<Scalars['ID']>
  id_not?: Maybe<Scalars['ID']>
  id_not_in?: Maybe<Array<Scalars['ID']>>
  timestamp?: Maybe<Scalars['v3polygon_BigInt']>
  timestamp_gt?: Maybe<Scalars['v3polygon_BigInt']>
  timestamp_gte?: Maybe<Scalars['v3polygon_BigInt']>
  timestamp_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  timestamp_lt?: Maybe<Scalars['v3polygon_BigInt']>
  timestamp_lte?: Maybe<Scalars['v3polygon_BigInt']>
  timestamp_not?: Maybe<Scalars['v3polygon_BigInt']>
  timestamp_not_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
}

export enum V3polygon_Transaction_OrderBy {
  BlockNumber = 'blockNumber',
  Burns = 'burns',
  Collects = 'collects',
  Flashed = 'flashed',
  GasPrice = 'gasPrice',
  GasUsed = 'gasUsed',
  Id = 'id',
  Mints = 'mints',
  Swaps = 'swaps',
  Timestamp = 'timestamp',
}

export type V3polygon_UniswapDayData = {
  __typename?: 'v3polygon_UniswapDayData'
  date: Scalars['Int']
  feesUSD: Scalars['v3polygon_BigDecimal']
  id: Scalars['ID']
  tvlUSD: Scalars['v3polygon_BigDecimal']
  txCount: Scalars['v3polygon_BigInt']
  volumeETH: Scalars['v3polygon_BigDecimal']
  volumeUSD: Scalars['v3polygon_BigDecimal']
  volumeUSDUntracked: Scalars['v3polygon_BigDecimal']
}

export type V3polygon_UniswapDayData_Filter = {
  date?: Maybe<Scalars['Int']>
  date_gt?: Maybe<Scalars['Int']>
  date_gte?: Maybe<Scalars['Int']>
  date_in?: Maybe<Array<Scalars['Int']>>
  date_lt?: Maybe<Scalars['Int']>
  date_lte?: Maybe<Scalars['Int']>
  date_not?: Maybe<Scalars['Int']>
  date_not_in?: Maybe<Array<Scalars['Int']>>
  feesUSD?: Maybe<Scalars['v3polygon_BigDecimal']>
  feesUSD_gt?: Maybe<Scalars['v3polygon_BigDecimal']>
  feesUSD_gte?: Maybe<Scalars['v3polygon_BigDecimal']>
  feesUSD_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  feesUSD_lt?: Maybe<Scalars['v3polygon_BigDecimal']>
  feesUSD_lte?: Maybe<Scalars['v3polygon_BigDecimal']>
  feesUSD_not?: Maybe<Scalars['v3polygon_BigDecimal']>
  feesUSD_not_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  id?: Maybe<Scalars['ID']>
  id_gt?: Maybe<Scalars['ID']>
  id_gte?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  id_lt?: Maybe<Scalars['ID']>
  id_lte?: Maybe<Scalars['ID']>
  id_not?: Maybe<Scalars['ID']>
  id_not_in?: Maybe<Array<Scalars['ID']>>
  tvlUSD?: Maybe<Scalars['v3polygon_BigDecimal']>
  tvlUSD_gt?: Maybe<Scalars['v3polygon_BigDecimal']>
  tvlUSD_gte?: Maybe<Scalars['v3polygon_BigDecimal']>
  tvlUSD_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  tvlUSD_lt?: Maybe<Scalars['v3polygon_BigDecimal']>
  tvlUSD_lte?: Maybe<Scalars['v3polygon_BigDecimal']>
  tvlUSD_not?: Maybe<Scalars['v3polygon_BigDecimal']>
  tvlUSD_not_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  txCount?: Maybe<Scalars['v3polygon_BigInt']>
  txCount_gt?: Maybe<Scalars['v3polygon_BigInt']>
  txCount_gte?: Maybe<Scalars['v3polygon_BigInt']>
  txCount_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  txCount_lt?: Maybe<Scalars['v3polygon_BigInt']>
  txCount_lte?: Maybe<Scalars['v3polygon_BigInt']>
  txCount_not?: Maybe<Scalars['v3polygon_BigInt']>
  txCount_not_in?: Maybe<Array<Scalars['v3polygon_BigInt']>>
  volumeETH?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeETH_gt?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeETH_gte?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeETH_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  volumeETH_lt?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeETH_lte?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeETH_not?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeETH_not_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  volumeUSD?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeUSDUntracked?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeUSDUntracked_gt?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeUSDUntracked_gte?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeUSDUntracked_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  volumeUSDUntracked_lt?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeUSDUntracked_lte?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeUSDUntracked_not?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeUSDUntracked_not_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  volumeUSD_gt?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeUSD_gte?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeUSD_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
  volumeUSD_lt?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeUSD_lte?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeUSD_not?: Maybe<Scalars['v3polygon_BigDecimal']>
  volumeUSD_not_in?: Maybe<Array<Scalars['v3polygon_BigDecimal']>>
}

export enum V3polygon_UniswapDayData_OrderBy {
  Date = 'date',
  FeesUsd = 'feesUSD',
  Id = 'id',
  TvlUsd = 'tvlUSD',
  TxCount = 'txCount',
  VolumeEth = 'volumeETH',
  VolumeUsd = 'volumeUSD',
  VolumeUsdUntracked = 'volumeUSDUntracked',
}

export type V3polygon__Block_ = {
  __typename?: 'v3polygon__Block_'
  /** The hash of the block */
  hash?: Maybe<Scalars['v3polygon_Bytes']>
  /** The block number */
  number: Scalars['Int']
}

/** The type for the top-level _meta field */
export type V3polygon__Meta_ = {
  __typename?: 'v3polygon__Meta_'
  /**
   * Information about a specific subgraph block. The hash of the block
   * will be null if the _meta field has a block constraint that asks for
   * a block number. It will be filled if the _meta field has no block constraint
   * and therefore asks for the latest  block
   *
   */
  block: V3polygon__Block_
  /** The deployment ID */
  deployment: Scalars['String']
  /** If `true`, the subgraph encountered indexing errors at some past block */
  hasIndexingErrors: Scalars['Boolean']
}

export enum V3polygon__SubgraphErrorPolicy_ {
  /** Data will be returned even if the subgraph has indexing errors */
  Allow = 'allow',
  /** If the subgraph has indexing errors, data will be omitted. The default. */
  Deny = 'deny',
}

export type V3rinkeby_Block_Height = {
  hash?: Maybe<Scalars['v3rinkeby_Bytes']>
  number?: Maybe<Scalars['Int']>
  number_gte?: Maybe<Scalars['Int']>
}

export type V3rinkeby_Bundle = {
  __typename?: 'v3rinkeby_Bundle'
  ethPriceUSD: Scalars['v3rinkeby_BigDecimal']
  id: Scalars['ID']
}

export type V3rinkeby_Bundle_Filter = {
  ethPriceUSD?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  ethPriceUSD_gt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  ethPriceUSD_gte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  ethPriceUSD_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  ethPriceUSD_lt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  ethPriceUSD_lte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  ethPriceUSD_not?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  ethPriceUSD_not_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  id?: Maybe<Scalars['ID']>
  id_gt?: Maybe<Scalars['ID']>
  id_gte?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  id_lt?: Maybe<Scalars['ID']>
  id_lte?: Maybe<Scalars['ID']>
  id_not?: Maybe<Scalars['ID']>
  id_not_in?: Maybe<Array<Scalars['ID']>>
}

export enum V3rinkeby_Bundle_OrderBy {
  EthPriceUsd = 'ethPriceUSD',
  Id = 'id',
}

export type V3rinkeby_Burn = {
  __typename?: 'v3rinkeby_Burn'
  amount: Scalars['v3rinkeby_BigInt']
  amount0: Scalars['v3rinkeby_BigDecimal']
  amount1: Scalars['v3rinkeby_BigDecimal']
  amountUSD?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  id: Scalars['ID']
  logIndex?: Maybe<Scalars['v3rinkeby_BigInt']>
  origin: Scalars['v3rinkeby_Bytes']
  owner?: Maybe<Scalars['v3rinkeby_Bytes']>
  pool: V3rinkeby_Pool
  tickLower: Scalars['v3rinkeby_BigInt']
  tickUpper: Scalars['v3rinkeby_BigInt']
  timestamp: Scalars['v3rinkeby_BigInt']
  token0: V3rinkeby_Token
  token1: V3rinkeby_Token
  transaction: V3rinkeby_Transaction
}

export type V3rinkeby_Burn_Filter = {
  amount?: Maybe<Scalars['v3rinkeby_BigInt']>
  amount0?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  amount0_gt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  amount0_gte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  amount0_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  amount0_lt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  amount0_lte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  amount0_not?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  amount0_not_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  amount1?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  amount1_gt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  amount1_gte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  amount1_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  amount1_lt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  amount1_lte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  amount1_not?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  amount1_not_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  amountUSD?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  amountUSD_gt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  amountUSD_gte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  amountUSD_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  amountUSD_lt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  amountUSD_lte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  amountUSD_not?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  amountUSD_not_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  amount_gt?: Maybe<Scalars['v3rinkeby_BigInt']>
  amount_gte?: Maybe<Scalars['v3rinkeby_BigInt']>
  amount_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  amount_lt?: Maybe<Scalars['v3rinkeby_BigInt']>
  amount_lte?: Maybe<Scalars['v3rinkeby_BigInt']>
  amount_not?: Maybe<Scalars['v3rinkeby_BigInt']>
  amount_not_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  id?: Maybe<Scalars['ID']>
  id_gt?: Maybe<Scalars['ID']>
  id_gte?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  id_lt?: Maybe<Scalars['ID']>
  id_lte?: Maybe<Scalars['ID']>
  id_not?: Maybe<Scalars['ID']>
  id_not_in?: Maybe<Array<Scalars['ID']>>
  logIndex?: Maybe<Scalars['v3rinkeby_BigInt']>
  logIndex_gt?: Maybe<Scalars['v3rinkeby_BigInt']>
  logIndex_gte?: Maybe<Scalars['v3rinkeby_BigInt']>
  logIndex_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  logIndex_lt?: Maybe<Scalars['v3rinkeby_BigInt']>
  logIndex_lte?: Maybe<Scalars['v3rinkeby_BigInt']>
  logIndex_not?: Maybe<Scalars['v3rinkeby_BigInt']>
  logIndex_not_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  origin?: Maybe<Scalars['v3rinkeby_Bytes']>
  origin_contains?: Maybe<Scalars['v3rinkeby_Bytes']>
  origin_in?: Maybe<Array<Scalars['v3rinkeby_Bytes']>>
  origin_not?: Maybe<Scalars['v3rinkeby_Bytes']>
  origin_not_contains?: Maybe<Scalars['v3rinkeby_Bytes']>
  origin_not_in?: Maybe<Array<Scalars['v3rinkeby_Bytes']>>
  owner?: Maybe<Scalars['v3rinkeby_Bytes']>
  owner_contains?: Maybe<Scalars['v3rinkeby_Bytes']>
  owner_in?: Maybe<Array<Scalars['v3rinkeby_Bytes']>>
  owner_not?: Maybe<Scalars['v3rinkeby_Bytes']>
  owner_not_contains?: Maybe<Scalars['v3rinkeby_Bytes']>
  owner_not_in?: Maybe<Array<Scalars['v3rinkeby_Bytes']>>
  pool?: Maybe<Scalars['String']>
  pool_contains?: Maybe<Scalars['String']>
  pool_ends_with?: Maybe<Scalars['String']>
  pool_gt?: Maybe<Scalars['String']>
  pool_gte?: Maybe<Scalars['String']>
  pool_in?: Maybe<Array<Scalars['String']>>
  pool_lt?: Maybe<Scalars['String']>
  pool_lte?: Maybe<Scalars['String']>
  pool_not?: Maybe<Scalars['String']>
  pool_not_contains?: Maybe<Scalars['String']>
  pool_not_ends_with?: Maybe<Scalars['String']>
  pool_not_in?: Maybe<Array<Scalars['String']>>
  pool_not_starts_with?: Maybe<Scalars['String']>
  pool_starts_with?: Maybe<Scalars['String']>
  tickLower?: Maybe<Scalars['v3rinkeby_BigInt']>
  tickLower_gt?: Maybe<Scalars['v3rinkeby_BigInt']>
  tickLower_gte?: Maybe<Scalars['v3rinkeby_BigInt']>
  tickLower_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  tickLower_lt?: Maybe<Scalars['v3rinkeby_BigInt']>
  tickLower_lte?: Maybe<Scalars['v3rinkeby_BigInt']>
  tickLower_not?: Maybe<Scalars['v3rinkeby_BigInt']>
  tickLower_not_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  tickUpper?: Maybe<Scalars['v3rinkeby_BigInt']>
  tickUpper_gt?: Maybe<Scalars['v3rinkeby_BigInt']>
  tickUpper_gte?: Maybe<Scalars['v3rinkeby_BigInt']>
  tickUpper_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  tickUpper_lt?: Maybe<Scalars['v3rinkeby_BigInt']>
  tickUpper_lte?: Maybe<Scalars['v3rinkeby_BigInt']>
  tickUpper_not?: Maybe<Scalars['v3rinkeby_BigInt']>
  tickUpper_not_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  timestamp?: Maybe<Scalars['v3rinkeby_BigInt']>
  timestamp_gt?: Maybe<Scalars['v3rinkeby_BigInt']>
  timestamp_gte?: Maybe<Scalars['v3rinkeby_BigInt']>
  timestamp_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  timestamp_lt?: Maybe<Scalars['v3rinkeby_BigInt']>
  timestamp_lte?: Maybe<Scalars['v3rinkeby_BigInt']>
  timestamp_not?: Maybe<Scalars['v3rinkeby_BigInt']>
  timestamp_not_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  token0?: Maybe<Scalars['String']>
  token0_contains?: Maybe<Scalars['String']>
  token0_ends_with?: Maybe<Scalars['String']>
  token0_gt?: Maybe<Scalars['String']>
  token0_gte?: Maybe<Scalars['String']>
  token0_in?: Maybe<Array<Scalars['String']>>
  token0_lt?: Maybe<Scalars['String']>
  token0_lte?: Maybe<Scalars['String']>
  token0_not?: Maybe<Scalars['String']>
  token0_not_contains?: Maybe<Scalars['String']>
  token0_not_ends_with?: Maybe<Scalars['String']>
  token0_not_in?: Maybe<Array<Scalars['String']>>
  token0_not_starts_with?: Maybe<Scalars['String']>
  token0_starts_with?: Maybe<Scalars['String']>
  token1?: Maybe<Scalars['String']>
  token1_contains?: Maybe<Scalars['String']>
  token1_ends_with?: Maybe<Scalars['String']>
  token1_gt?: Maybe<Scalars['String']>
  token1_gte?: Maybe<Scalars['String']>
  token1_in?: Maybe<Array<Scalars['String']>>
  token1_lt?: Maybe<Scalars['String']>
  token1_lte?: Maybe<Scalars['String']>
  token1_not?: Maybe<Scalars['String']>
  token1_not_contains?: Maybe<Scalars['String']>
  token1_not_ends_with?: Maybe<Scalars['String']>
  token1_not_in?: Maybe<Array<Scalars['String']>>
  token1_not_starts_with?: Maybe<Scalars['String']>
  token1_starts_with?: Maybe<Scalars['String']>
  transaction?: Maybe<Scalars['String']>
  transaction_contains?: Maybe<Scalars['String']>
  transaction_ends_with?: Maybe<Scalars['String']>
  transaction_gt?: Maybe<Scalars['String']>
  transaction_gte?: Maybe<Scalars['String']>
  transaction_in?: Maybe<Array<Scalars['String']>>
  transaction_lt?: Maybe<Scalars['String']>
  transaction_lte?: Maybe<Scalars['String']>
  transaction_not?: Maybe<Scalars['String']>
  transaction_not_contains?: Maybe<Scalars['String']>
  transaction_not_ends_with?: Maybe<Scalars['String']>
  transaction_not_in?: Maybe<Array<Scalars['String']>>
  transaction_not_starts_with?: Maybe<Scalars['String']>
  transaction_starts_with?: Maybe<Scalars['String']>
}

export enum V3rinkeby_Burn_OrderBy {
  Amount = 'amount',
  Amount0 = 'amount0',
  Amount1 = 'amount1',
  AmountUsd = 'amountUSD',
  Id = 'id',
  LogIndex = 'logIndex',
  Origin = 'origin',
  Owner = 'owner',
  Pool = 'pool',
  TickLower = 'tickLower',
  TickUpper = 'tickUpper',
  Timestamp = 'timestamp',
  Token0 = 'token0',
  Token1 = 'token1',
  Transaction = 'transaction',
}

export type V3rinkeby_Collect = {
  __typename?: 'v3rinkeby_Collect'
  amount0: Scalars['v3rinkeby_BigDecimal']
  amount1: Scalars['v3rinkeby_BigDecimal']
  amountUSD?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  id: Scalars['ID']
  logIndex?: Maybe<Scalars['v3rinkeby_BigInt']>
  owner?: Maybe<Scalars['v3rinkeby_Bytes']>
  pool: V3rinkeby_Pool
  tickLower: Scalars['v3rinkeby_BigInt']
  tickUpper: Scalars['v3rinkeby_BigInt']
  timestamp: Scalars['v3rinkeby_BigInt']
  transaction: V3rinkeby_Transaction
}

export type V3rinkeby_Collect_Filter = {
  amount0?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  amount0_gt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  amount0_gte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  amount0_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  amount0_lt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  amount0_lte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  amount0_not?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  amount0_not_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  amount1?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  amount1_gt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  amount1_gte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  amount1_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  amount1_lt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  amount1_lte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  amount1_not?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  amount1_not_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  amountUSD?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  amountUSD_gt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  amountUSD_gte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  amountUSD_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  amountUSD_lt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  amountUSD_lte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  amountUSD_not?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  amountUSD_not_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  id?: Maybe<Scalars['ID']>
  id_gt?: Maybe<Scalars['ID']>
  id_gte?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  id_lt?: Maybe<Scalars['ID']>
  id_lte?: Maybe<Scalars['ID']>
  id_not?: Maybe<Scalars['ID']>
  id_not_in?: Maybe<Array<Scalars['ID']>>
  logIndex?: Maybe<Scalars['v3rinkeby_BigInt']>
  logIndex_gt?: Maybe<Scalars['v3rinkeby_BigInt']>
  logIndex_gte?: Maybe<Scalars['v3rinkeby_BigInt']>
  logIndex_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  logIndex_lt?: Maybe<Scalars['v3rinkeby_BigInt']>
  logIndex_lte?: Maybe<Scalars['v3rinkeby_BigInt']>
  logIndex_not?: Maybe<Scalars['v3rinkeby_BigInt']>
  logIndex_not_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  owner?: Maybe<Scalars['v3rinkeby_Bytes']>
  owner_contains?: Maybe<Scalars['v3rinkeby_Bytes']>
  owner_in?: Maybe<Array<Scalars['v3rinkeby_Bytes']>>
  owner_not?: Maybe<Scalars['v3rinkeby_Bytes']>
  owner_not_contains?: Maybe<Scalars['v3rinkeby_Bytes']>
  owner_not_in?: Maybe<Array<Scalars['v3rinkeby_Bytes']>>
  pool?: Maybe<Scalars['String']>
  pool_contains?: Maybe<Scalars['String']>
  pool_ends_with?: Maybe<Scalars['String']>
  pool_gt?: Maybe<Scalars['String']>
  pool_gte?: Maybe<Scalars['String']>
  pool_in?: Maybe<Array<Scalars['String']>>
  pool_lt?: Maybe<Scalars['String']>
  pool_lte?: Maybe<Scalars['String']>
  pool_not?: Maybe<Scalars['String']>
  pool_not_contains?: Maybe<Scalars['String']>
  pool_not_ends_with?: Maybe<Scalars['String']>
  pool_not_in?: Maybe<Array<Scalars['String']>>
  pool_not_starts_with?: Maybe<Scalars['String']>
  pool_starts_with?: Maybe<Scalars['String']>
  tickLower?: Maybe<Scalars['v3rinkeby_BigInt']>
  tickLower_gt?: Maybe<Scalars['v3rinkeby_BigInt']>
  tickLower_gte?: Maybe<Scalars['v3rinkeby_BigInt']>
  tickLower_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  tickLower_lt?: Maybe<Scalars['v3rinkeby_BigInt']>
  tickLower_lte?: Maybe<Scalars['v3rinkeby_BigInt']>
  tickLower_not?: Maybe<Scalars['v3rinkeby_BigInt']>
  tickLower_not_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  tickUpper?: Maybe<Scalars['v3rinkeby_BigInt']>
  tickUpper_gt?: Maybe<Scalars['v3rinkeby_BigInt']>
  tickUpper_gte?: Maybe<Scalars['v3rinkeby_BigInt']>
  tickUpper_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  tickUpper_lt?: Maybe<Scalars['v3rinkeby_BigInt']>
  tickUpper_lte?: Maybe<Scalars['v3rinkeby_BigInt']>
  tickUpper_not?: Maybe<Scalars['v3rinkeby_BigInt']>
  tickUpper_not_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  timestamp?: Maybe<Scalars['v3rinkeby_BigInt']>
  timestamp_gt?: Maybe<Scalars['v3rinkeby_BigInt']>
  timestamp_gte?: Maybe<Scalars['v3rinkeby_BigInt']>
  timestamp_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  timestamp_lt?: Maybe<Scalars['v3rinkeby_BigInt']>
  timestamp_lte?: Maybe<Scalars['v3rinkeby_BigInt']>
  timestamp_not?: Maybe<Scalars['v3rinkeby_BigInt']>
  timestamp_not_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  transaction?: Maybe<Scalars['String']>
  transaction_contains?: Maybe<Scalars['String']>
  transaction_ends_with?: Maybe<Scalars['String']>
  transaction_gt?: Maybe<Scalars['String']>
  transaction_gte?: Maybe<Scalars['String']>
  transaction_in?: Maybe<Array<Scalars['String']>>
  transaction_lt?: Maybe<Scalars['String']>
  transaction_lte?: Maybe<Scalars['String']>
  transaction_not?: Maybe<Scalars['String']>
  transaction_not_contains?: Maybe<Scalars['String']>
  transaction_not_ends_with?: Maybe<Scalars['String']>
  transaction_not_in?: Maybe<Array<Scalars['String']>>
  transaction_not_starts_with?: Maybe<Scalars['String']>
  transaction_starts_with?: Maybe<Scalars['String']>
}

export enum V3rinkeby_Collect_OrderBy {
  Amount0 = 'amount0',
  Amount1 = 'amount1',
  AmountUsd = 'amountUSD',
  Id = 'id',
  LogIndex = 'logIndex',
  Owner = 'owner',
  Pool = 'pool',
  TickLower = 'tickLower',
  TickUpper = 'tickUpper',
  Timestamp = 'timestamp',
  Transaction = 'transaction',
}

export type V3rinkeby_Factory = {
  __typename?: 'v3rinkeby_Factory'
  id: Scalars['ID']
  owner: Scalars['ID']
  poolCount: Scalars['v3rinkeby_BigInt']
  totalFeesETH: Scalars['v3rinkeby_BigDecimal']
  totalFeesUSD: Scalars['v3rinkeby_BigDecimal']
  totalValueLockedETH: Scalars['v3rinkeby_BigDecimal']
  totalValueLockedETHUntracked: Scalars['v3rinkeby_BigDecimal']
  totalValueLockedUSD: Scalars['v3rinkeby_BigDecimal']
  totalValueLockedUSDUntracked: Scalars['v3rinkeby_BigDecimal']
  totalVolumeETH: Scalars['v3rinkeby_BigDecimal']
  totalVolumeUSD: Scalars['v3rinkeby_BigDecimal']
  txCount: Scalars['v3rinkeby_BigInt']
  untrackedVolumeUSD: Scalars['v3rinkeby_BigDecimal']
}

export type V3rinkeby_Factory_Filter = {
  id?: Maybe<Scalars['ID']>
  id_gt?: Maybe<Scalars['ID']>
  id_gte?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  id_lt?: Maybe<Scalars['ID']>
  id_lte?: Maybe<Scalars['ID']>
  id_not?: Maybe<Scalars['ID']>
  id_not_in?: Maybe<Array<Scalars['ID']>>
  owner?: Maybe<Scalars['ID']>
  owner_gt?: Maybe<Scalars['ID']>
  owner_gte?: Maybe<Scalars['ID']>
  owner_in?: Maybe<Array<Scalars['ID']>>
  owner_lt?: Maybe<Scalars['ID']>
  owner_lte?: Maybe<Scalars['ID']>
  owner_not?: Maybe<Scalars['ID']>
  owner_not_in?: Maybe<Array<Scalars['ID']>>
  poolCount?: Maybe<Scalars['v3rinkeby_BigInt']>
  poolCount_gt?: Maybe<Scalars['v3rinkeby_BigInt']>
  poolCount_gte?: Maybe<Scalars['v3rinkeby_BigInt']>
  poolCount_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  poolCount_lt?: Maybe<Scalars['v3rinkeby_BigInt']>
  poolCount_lte?: Maybe<Scalars['v3rinkeby_BigInt']>
  poolCount_not?: Maybe<Scalars['v3rinkeby_BigInt']>
  poolCount_not_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  totalFeesETH?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  totalFeesETH_gt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  totalFeesETH_gte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  totalFeesETH_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  totalFeesETH_lt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  totalFeesETH_lte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  totalFeesETH_not?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  totalFeesETH_not_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  totalFeesUSD?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  totalFeesUSD_gt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  totalFeesUSD_gte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  totalFeesUSD_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  totalFeesUSD_lt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  totalFeesUSD_lte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  totalFeesUSD_not?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  totalFeesUSD_not_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  totalValueLockedETH?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  totalValueLockedETHUntracked?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  totalValueLockedETHUntracked_gt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  totalValueLockedETHUntracked_gte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  totalValueLockedETHUntracked_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  totalValueLockedETHUntracked_lt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  totalValueLockedETHUntracked_lte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  totalValueLockedETHUntracked_not?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  totalValueLockedETHUntracked_not_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  totalValueLockedETH_gt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  totalValueLockedETH_gte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  totalValueLockedETH_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  totalValueLockedETH_lt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  totalValueLockedETH_lte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  totalValueLockedETH_not?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  totalValueLockedETH_not_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  totalValueLockedUSD?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  totalValueLockedUSDUntracked?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  totalValueLockedUSDUntracked_gt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  totalValueLockedUSDUntracked_gte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  totalValueLockedUSDUntracked_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  totalValueLockedUSDUntracked_lt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  totalValueLockedUSDUntracked_lte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  totalValueLockedUSDUntracked_not?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  totalValueLockedUSDUntracked_not_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  totalValueLockedUSD_gt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  totalValueLockedUSD_gte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  totalValueLockedUSD_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  totalValueLockedUSD_lt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  totalValueLockedUSD_lte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  totalValueLockedUSD_not?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  totalValueLockedUSD_not_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  totalVolumeETH?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  totalVolumeETH_gt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  totalVolumeETH_gte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  totalVolumeETH_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  totalVolumeETH_lt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  totalVolumeETH_lte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  totalVolumeETH_not?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  totalVolumeETH_not_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  totalVolumeUSD?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  totalVolumeUSD_gt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  totalVolumeUSD_gte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  totalVolumeUSD_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  totalVolumeUSD_lt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  totalVolumeUSD_lte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  totalVolumeUSD_not?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  totalVolumeUSD_not_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  txCount?: Maybe<Scalars['v3rinkeby_BigInt']>
  txCount_gt?: Maybe<Scalars['v3rinkeby_BigInt']>
  txCount_gte?: Maybe<Scalars['v3rinkeby_BigInt']>
  txCount_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  txCount_lt?: Maybe<Scalars['v3rinkeby_BigInt']>
  txCount_lte?: Maybe<Scalars['v3rinkeby_BigInt']>
  txCount_not?: Maybe<Scalars['v3rinkeby_BigInt']>
  txCount_not_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  untrackedVolumeUSD?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  untrackedVolumeUSD_gt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  untrackedVolumeUSD_gte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  untrackedVolumeUSD_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  untrackedVolumeUSD_lt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  untrackedVolumeUSD_lte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  untrackedVolumeUSD_not?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  untrackedVolumeUSD_not_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
}

export enum V3rinkeby_Factory_OrderBy {
  Id = 'id',
  Owner = 'owner',
  PoolCount = 'poolCount',
  TotalFeesEth = 'totalFeesETH',
  TotalFeesUsd = 'totalFeesUSD',
  TotalValueLockedEth = 'totalValueLockedETH',
  TotalValueLockedEthUntracked = 'totalValueLockedETHUntracked',
  TotalValueLockedUsd = 'totalValueLockedUSD',
  TotalValueLockedUsdUntracked = 'totalValueLockedUSDUntracked',
  TotalVolumeEth = 'totalVolumeETH',
  TotalVolumeUsd = 'totalVolumeUSD',
  TxCount = 'txCount',
  UntrackedVolumeUsd = 'untrackedVolumeUSD',
}

export type V3rinkeby_Flash = {
  __typename?: 'v3rinkeby_Flash'
  amount0: Scalars['v3rinkeby_BigDecimal']
  amount0Paid: Scalars['v3rinkeby_BigDecimal']
  amount1: Scalars['v3rinkeby_BigDecimal']
  amount1Paid: Scalars['v3rinkeby_BigDecimal']
  amountUSD: Scalars['v3rinkeby_BigDecimal']
  id: Scalars['ID']
  logIndex?: Maybe<Scalars['v3rinkeby_BigInt']>
  pool: V3rinkeby_Pool
  recipient: Scalars['v3rinkeby_Bytes']
  sender: Scalars['v3rinkeby_Bytes']
  timestamp: Scalars['v3rinkeby_BigInt']
  transaction: V3rinkeby_Transaction
}

export type V3rinkeby_Flash_Filter = {
  amount0?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  amount0Paid?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  amount0Paid_gt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  amount0Paid_gte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  amount0Paid_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  amount0Paid_lt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  amount0Paid_lte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  amount0Paid_not?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  amount0Paid_not_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  amount0_gt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  amount0_gte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  amount0_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  amount0_lt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  amount0_lte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  amount0_not?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  amount0_not_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  amount1?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  amount1Paid?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  amount1Paid_gt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  amount1Paid_gte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  amount1Paid_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  amount1Paid_lt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  amount1Paid_lte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  amount1Paid_not?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  amount1Paid_not_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  amount1_gt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  amount1_gte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  amount1_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  amount1_lt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  amount1_lte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  amount1_not?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  amount1_not_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  amountUSD?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  amountUSD_gt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  amountUSD_gte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  amountUSD_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  amountUSD_lt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  amountUSD_lte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  amountUSD_not?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  amountUSD_not_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  id?: Maybe<Scalars['ID']>
  id_gt?: Maybe<Scalars['ID']>
  id_gte?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  id_lt?: Maybe<Scalars['ID']>
  id_lte?: Maybe<Scalars['ID']>
  id_not?: Maybe<Scalars['ID']>
  id_not_in?: Maybe<Array<Scalars['ID']>>
  logIndex?: Maybe<Scalars['v3rinkeby_BigInt']>
  logIndex_gt?: Maybe<Scalars['v3rinkeby_BigInt']>
  logIndex_gte?: Maybe<Scalars['v3rinkeby_BigInt']>
  logIndex_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  logIndex_lt?: Maybe<Scalars['v3rinkeby_BigInt']>
  logIndex_lte?: Maybe<Scalars['v3rinkeby_BigInt']>
  logIndex_not?: Maybe<Scalars['v3rinkeby_BigInt']>
  logIndex_not_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  pool?: Maybe<Scalars['String']>
  pool_contains?: Maybe<Scalars['String']>
  pool_ends_with?: Maybe<Scalars['String']>
  pool_gt?: Maybe<Scalars['String']>
  pool_gte?: Maybe<Scalars['String']>
  pool_in?: Maybe<Array<Scalars['String']>>
  pool_lt?: Maybe<Scalars['String']>
  pool_lte?: Maybe<Scalars['String']>
  pool_not?: Maybe<Scalars['String']>
  pool_not_contains?: Maybe<Scalars['String']>
  pool_not_ends_with?: Maybe<Scalars['String']>
  pool_not_in?: Maybe<Array<Scalars['String']>>
  pool_not_starts_with?: Maybe<Scalars['String']>
  pool_starts_with?: Maybe<Scalars['String']>
  recipient?: Maybe<Scalars['v3rinkeby_Bytes']>
  recipient_contains?: Maybe<Scalars['v3rinkeby_Bytes']>
  recipient_in?: Maybe<Array<Scalars['v3rinkeby_Bytes']>>
  recipient_not?: Maybe<Scalars['v3rinkeby_Bytes']>
  recipient_not_contains?: Maybe<Scalars['v3rinkeby_Bytes']>
  recipient_not_in?: Maybe<Array<Scalars['v3rinkeby_Bytes']>>
  sender?: Maybe<Scalars['v3rinkeby_Bytes']>
  sender_contains?: Maybe<Scalars['v3rinkeby_Bytes']>
  sender_in?: Maybe<Array<Scalars['v3rinkeby_Bytes']>>
  sender_not?: Maybe<Scalars['v3rinkeby_Bytes']>
  sender_not_contains?: Maybe<Scalars['v3rinkeby_Bytes']>
  sender_not_in?: Maybe<Array<Scalars['v3rinkeby_Bytes']>>
  timestamp?: Maybe<Scalars['v3rinkeby_BigInt']>
  timestamp_gt?: Maybe<Scalars['v3rinkeby_BigInt']>
  timestamp_gte?: Maybe<Scalars['v3rinkeby_BigInt']>
  timestamp_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  timestamp_lt?: Maybe<Scalars['v3rinkeby_BigInt']>
  timestamp_lte?: Maybe<Scalars['v3rinkeby_BigInt']>
  timestamp_not?: Maybe<Scalars['v3rinkeby_BigInt']>
  timestamp_not_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  transaction?: Maybe<Scalars['String']>
  transaction_contains?: Maybe<Scalars['String']>
  transaction_ends_with?: Maybe<Scalars['String']>
  transaction_gt?: Maybe<Scalars['String']>
  transaction_gte?: Maybe<Scalars['String']>
  transaction_in?: Maybe<Array<Scalars['String']>>
  transaction_lt?: Maybe<Scalars['String']>
  transaction_lte?: Maybe<Scalars['String']>
  transaction_not?: Maybe<Scalars['String']>
  transaction_not_contains?: Maybe<Scalars['String']>
  transaction_not_ends_with?: Maybe<Scalars['String']>
  transaction_not_in?: Maybe<Array<Scalars['String']>>
  transaction_not_starts_with?: Maybe<Scalars['String']>
  transaction_starts_with?: Maybe<Scalars['String']>
}

export enum V3rinkeby_Flash_OrderBy {
  Amount0 = 'amount0',
  Amount0Paid = 'amount0Paid',
  Amount1 = 'amount1',
  Amount1Paid = 'amount1Paid',
  AmountUsd = 'amountUSD',
  Id = 'id',
  LogIndex = 'logIndex',
  Pool = 'pool',
  Recipient = 'recipient',
  Sender = 'sender',
  Timestamp = 'timestamp',
  Transaction = 'transaction',
}

export type V3rinkeby_Mint = {
  __typename?: 'v3rinkeby_Mint'
  amount: Scalars['v3rinkeby_BigInt']
  amount0: Scalars['v3rinkeby_BigDecimal']
  amount1: Scalars['v3rinkeby_BigDecimal']
  amountUSD?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  id: Scalars['ID']
  logIndex?: Maybe<Scalars['v3rinkeby_BigInt']>
  origin: Scalars['v3rinkeby_Bytes']
  owner: Scalars['v3rinkeby_Bytes']
  pool: V3rinkeby_Pool
  sender?: Maybe<Scalars['v3rinkeby_Bytes']>
  tickLower: Scalars['v3rinkeby_BigInt']
  tickUpper: Scalars['v3rinkeby_BigInt']
  timestamp: Scalars['v3rinkeby_BigInt']
  token0: V3rinkeby_Token
  token1: V3rinkeby_Token
  transaction: V3rinkeby_Transaction
}

export type V3rinkeby_Mint_Filter = {
  amount?: Maybe<Scalars['v3rinkeby_BigInt']>
  amount0?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  amount0_gt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  amount0_gte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  amount0_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  amount0_lt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  amount0_lte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  amount0_not?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  amount0_not_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  amount1?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  amount1_gt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  amount1_gte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  amount1_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  amount1_lt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  amount1_lte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  amount1_not?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  amount1_not_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  amountUSD?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  amountUSD_gt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  amountUSD_gte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  amountUSD_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  amountUSD_lt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  amountUSD_lte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  amountUSD_not?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  amountUSD_not_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  amount_gt?: Maybe<Scalars['v3rinkeby_BigInt']>
  amount_gte?: Maybe<Scalars['v3rinkeby_BigInt']>
  amount_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  amount_lt?: Maybe<Scalars['v3rinkeby_BigInt']>
  amount_lte?: Maybe<Scalars['v3rinkeby_BigInt']>
  amount_not?: Maybe<Scalars['v3rinkeby_BigInt']>
  amount_not_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  id?: Maybe<Scalars['ID']>
  id_gt?: Maybe<Scalars['ID']>
  id_gte?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  id_lt?: Maybe<Scalars['ID']>
  id_lte?: Maybe<Scalars['ID']>
  id_not?: Maybe<Scalars['ID']>
  id_not_in?: Maybe<Array<Scalars['ID']>>
  logIndex?: Maybe<Scalars['v3rinkeby_BigInt']>
  logIndex_gt?: Maybe<Scalars['v3rinkeby_BigInt']>
  logIndex_gte?: Maybe<Scalars['v3rinkeby_BigInt']>
  logIndex_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  logIndex_lt?: Maybe<Scalars['v3rinkeby_BigInt']>
  logIndex_lte?: Maybe<Scalars['v3rinkeby_BigInt']>
  logIndex_not?: Maybe<Scalars['v3rinkeby_BigInt']>
  logIndex_not_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  origin?: Maybe<Scalars['v3rinkeby_Bytes']>
  origin_contains?: Maybe<Scalars['v3rinkeby_Bytes']>
  origin_in?: Maybe<Array<Scalars['v3rinkeby_Bytes']>>
  origin_not?: Maybe<Scalars['v3rinkeby_Bytes']>
  origin_not_contains?: Maybe<Scalars['v3rinkeby_Bytes']>
  origin_not_in?: Maybe<Array<Scalars['v3rinkeby_Bytes']>>
  owner?: Maybe<Scalars['v3rinkeby_Bytes']>
  owner_contains?: Maybe<Scalars['v3rinkeby_Bytes']>
  owner_in?: Maybe<Array<Scalars['v3rinkeby_Bytes']>>
  owner_not?: Maybe<Scalars['v3rinkeby_Bytes']>
  owner_not_contains?: Maybe<Scalars['v3rinkeby_Bytes']>
  owner_not_in?: Maybe<Array<Scalars['v3rinkeby_Bytes']>>
  pool?: Maybe<Scalars['String']>
  pool_contains?: Maybe<Scalars['String']>
  pool_ends_with?: Maybe<Scalars['String']>
  pool_gt?: Maybe<Scalars['String']>
  pool_gte?: Maybe<Scalars['String']>
  pool_in?: Maybe<Array<Scalars['String']>>
  pool_lt?: Maybe<Scalars['String']>
  pool_lte?: Maybe<Scalars['String']>
  pool_not?: Maybe<Scalars['String']>
  pool_not_contains?: Maybe<Scalars['String']>
  pool_not_ends_with?: Maybe<Scalars['String']>
  pool_not_in?: Maybe<Array<Scalars['String']>>
  pool_not_starts_with?: Maybe<Scalars['String']>
  pool_starts_with?: Maybe<Scalars['String']>
  sender?: Maybe<Scalars['v3rinkeby_Bytes']>
  sender_contains?: Maybe<Scalars['v3rinkeby_Bytes']>
  sender_in?: Maybe<Array<Scalars['v3rinkeby_Bytes']>>
  sender_not?: Maybe<Scalars['v3rinkeby_Bytes']>
  sender_not_contains?: Maybe<Scalars['v3rinkeby_Bytes']>
  sender_not_in?: Maybe<Array<Scalars['v3rinkeby_Bytes']>>
  tickLower?: Maybe<Scalars['v3rinkeby_BigInt']>
  tickLower_gt?: Maybe<Scalars['v3rinkeby_BigInt']>
  tickLower_gte?: Maybe<Scalars['v3rinkeby_BigInt']>
  tickLower_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  tickLower_lt?: Maybe<Scalars['v3rinkeby_BigInt']>
  tickLower_lte?: Maybe<Scalars['v3rinkeby_BigInt']>
  tickLower_not?: Maybe<Scalars['v3rinkeby_BigInt']>
  tickLower_not_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  tickUpper?: Maybe<Scalars['v3rinkeby_BigInt']>
  tickUpper_gt?: Maybe<Scalars['v3rinkeby_BigInt']>
  tickUpper_gte?: Maybe<Scalars['v3rinkeby_BigInt']>
  tickUpper_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  tickUpper_lt?: Maybe<Scalars['v3rinkeby_BigInt']>
  tickUpper_lte?: Maybe<Scalars['v3rinkeby_BigInt']>
  tickUpper_not?: Maybe<Scalars['v3rinkeby_BigInt']>
  tickUpper_not_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  timestamp?: Maybe<Scalars['v3rinkeby_BigInt']>
  timestamp_gt?: Maybe<Scalars['v3rinkeby_BigInt']>
  timestamp_gte?: Maybe<Scalars['v3rinkeby_BigInt']>
  timestamp_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  timestamp_lt?: Maybe<Scalars['v3rinkeby_BigInt']>
  timestamp_lte?: Maybe<Scalars['v3rinkeby_BigInt']>
  timestamp_not?: Maybe<Scalars['v3rinkeby_BigInt']>
  timestamp_not_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  token0?: Maybe<Scalars['String']>
  token0_contains?: Maybe<Scalars['String']>
  token0_ends_with?: Maybe<Scalars['String']>
  token0_gt?: Maybe<Scalars['String']>
  token0_gte?: Maybe<Scalars['String']>
  token0_in?: Maybe<Array<Scalars['String']>>
  token0_lt?: Maybe<Scalars['String']>
  token0_lte?: Maybe<Scalars['String']>
  token0_not?: Maybe<Scalars['String']>
  token0_not_contains?: Maybe<Scalars['String']>
  token0_not_ends_with?: Maybe<Scalars['String']>
  token0_not_in?: Maybe<Array<Scalars['String']>>
  token0_not_starts_with?: Maybe<Scalars['String']>
  token0_starts_with?: Maybe<Scalars['String']>
  token1?: Maybe<Scalars['String']>
  token1_contains?: Maybe<Scalars['String']>
  token1_ends_with?: Maybe<Scalars['String']>
  token1_gt?: Maybe<Scalars['String']>
  token1_gte?: Maybe<Scalars['String']>
  token1_in?: Maybe<Array<Scalars['String']>>
  token1_lt?: Maybe<Scalars['String']>
  token1_lte?: Maybe<Scalars['String']>
  token1_not?: Maybe<Scalars['String']>
  token1_not_contains?: Maybe<Scalars['String']>
  token1_not_ends_with?: Maybe<Scalars['String']>
  token1_not_in?: Maybe<Array<Scalars['String']>>
  token1_not_starts_with?: Maybe<Scalars['String']>
  token1_starts_with?: Maybe<Scalars['String']>
  transaction?: Maybe<Scalars['String']>
  transaction_contains?: Maybe<Scalars['String']>
  transaction_ends_with?: Maybe<Scalars['String']>
  transaction_gt?: Maybe<Scalars['String']>
  transaction_gte?: Maybe<Scalars['String']>
  transaction_in?: Maybe<Array<Scalars['String']>>
  transaction_lt?: Maybe<Scalars['String']>
  transaction_lte?: Maybe<Scalars['String']>
  transaction_not?: Maybe<Scalars['String']>
  transaction_not_contains?: Maybe<Scalars['String']>
  transaction_not_ends_with?: Maybe<Scalars['String']>
  transaction_not_in?: Maybe<Array<Scalars['String']>>
  transaction_not_starts_with?: Maybe<Scalars['String']>
  transaction_starts_with?: Maybe<Scalars['String']>
}

export enum V3rinkeby_Mint_OrderBy {
  Amount = 'amount',
  Amount0 = 'amount0',
  Amount1 = 'amount1',
  AmountUsd = 'amountUSD',
  Id = 'id',
  LogIndex = 'logIndex',
  Origin = 'origin',
  Owner = 'owner',
  Pool = 'pool',
  Sender = 'sender',
  TickLower = 'tickLower',
  TickUpper = 'tickUpper',
  Timestamp = 'timestamp',
  Token0 = 'token0',
  Token1 = 'token1',
  Transaction = 'transaction',
}

export enum V3rinkeby_OrderDirection {
  Asc = 'asc',
  Desc = 'desc',
}

export type V3rinkeby_Pool = {
  __typename?: 'v3rinkeby_Pool'
  burns: Array<V3rinkeby_Burn>
  collectedFeesToken0: Scalars['v3rinkeby_BigDecimal']
  collectedFeesToken1: Scalars['v3rinkeby_BigDecimal']
  collectedFeesUSD: Scalars['v3rinkeby_BigDecimal']
  collects: Array<V3rinkeby_Collect>
  createdAtBlockNumber: Scalars['v3rinkeby_BigInt']
  createdAtTimestamp: Scalars['v3rinkeby_BigInt']
  feeGrowthGlobal0X128: Scalars['v3rinkeby_BigInt']
  feeGrowthGlobal1X128: Scalars['v3rinkeby_BigInt']
  feeTier: Scalars['v3rinkeby_BigInt']
  feesUSD: Scalars['v3rinkeby_BigDecimal']
  id: Scalars['ID']
  liquidity: Scalars['v3rinkeby_BigInt']
  liquidityProviderCount: Scalars['v3rinkeby_BigInt']
  mints: Array<V3rinkeby_Mint>
  observationIndex: Scalars['v3rinkeby_BigInt']
  poolDayData: Array<V3rinkeby_PoolDayData>
  poolHourData: Array<V3rinkeby_PoolHourData>
  sqrtPrice: Scalars['v3rinkeby_BigInt']
  swaps: Array<V3rinkeby_Swap>
  tick?: Maybe<Scalars['v3rinkeby_BigInt']>
  ticks: Array<V3rinkeby_Tick>
  token0: V3rinkeby_Token
  token0Price: Scalars['v3rinkeby_BigDecimal']
  token1: V3rinkeby_Token
  token1Price: Scalars['v3rinkeby_BigDecimal']
  totalValueLockedETH: Scalars['v3rinkeby_BigDecimal']
  totalValueLockedToken0: Scalars['v3rinkeby_BigDecimal']
  totalValueLockedToken1: Scalars['v3rinkeby_BigDecimal']
  totalValueLockedUSD: Scalars['v3rinkeby_BigDecimal']
  totalValueLockedUSDUntracked: Scalars['v3rinkeby_BigDecimal']
  txCount: Scalars['v3rinkeby_BigInt']
  untrackedVolumeUSD: Scalars['v3rinkeby_BigDecimal']
  volumeToken0: Scalars['v3rinkeby_BigDecimal']
  volumeToken1: Scalars['v3rinkeby_BigDecimal']
  volumeUSD: Scalars['v3rinkeby_BigDecimal']
}

export type V3rinkeby_PoolBurnsArgs = {
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3rinkeby_Burn_OrderBy>
  orderDirection?: Maybe<V3rinkeby_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  where?: Maybe<V3rinkeby_Burn_Filter>
}

export type V3rinkeby_PoolCollectsArgs = {
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3rinkeby_Collect_OrderBy>
  orderDirection?: Maybe<V3rinkeby_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  where?: Maybe<V3rinkeby_Collect_Filter>
}

export type V3rinkeby_PoolMintsArgs = {
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3rinkeby_Mint_OrderBy>
  orderDirection?: Maybe<V3rinkeby_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  where?: Maybe<V3rinkeby_Mint_Filter>
}

export type V3rinkeby_PoolPoolDayDataArgs = {
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3rinkeby_PoolDayData_OrderBy>
  orderDirection?: Maybe<V3rinkeby_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  where?: Maybe<V3rinkeby_PoolDayData_Filter>
}

export type V3rinkeby_PoolPoolHourDataArgs = {
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3rinkeby_PoolHourData_OrderBy>
  orderDirection?: Maybe<V3rinkeby_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  where?: Maybe<V3rinkeby_PoolHourData_Filter>
}

export type V3rinkeby_PoolSwapsArgs = {
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3rinkeby_Swap_OrderBy>
  orderDirection?: Maybe<V3rinkeby_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  where?: Maybe<V3rinkeby_Swap_Filter>
}

export type V3rinkeby_PoolTicksArgs = {
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3rinkeby_Tick_OrderBy>
  orderDirection?: Maybe<V3rinkeby_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  where?: Maybe<V3rinkeby_Tick_Filter>
}

export type V3rinkeby_PoolDayData = {
  __typename?: 'v3rinkeby_PoolDayData'
  close: Scalars['v3rinkeby_BigDecimal']
  date: Scalars['Int']
  feeGrowthGlobal0X128: Scalars['v3rinkeby_BigInt']
  feeGrowthGlobal1X128: Scalars['v3rinkeby_BigInt']
  feesUSD: Scalars['v3rinkeby_BigDecimal']
  high: Scalars['v3rinkeby_BigDecimal']
  id: Scalars['ID']
  liquidity: Scalars['v3rinkeby_BigInt']
  low: Scalars['v3rinkeby_BigDecimal']
  open: Scalars['v3rinkeby_BigDecimal']
  pool: V3rinkeby_Pool
  sqrtPrice: Scalars['v3rinkeby_BigInt']
  tick?: Maybe<Scalars['v3rinkeby_BigInt']>
  token0Price: Scalars['v3rinkeby_BigDecimal']
  token1Price: Scalars['v3rinkeby_BigDecimal']
  tvlUSD: Scalars['v3rinkeby_BigDecimal']
  txCount: Scalars['v3rinkeby_BigInt']
  volumeToken0: Scalars['v3rinkeby_BigDecimal']
  volumeToken1: Scalars['v3rinkeby_BigDecimal']
  volumeUSD: Scalars['v3rinkeby_BigDecimal']
}

export type V3rinkeby_PoolDayData_Filter = {
  close?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  close_gt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  close_gte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  close_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  close_lt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  close_lte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  close_not?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  close_not_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  date?: Maybe<Scalars['Int']>
  date_gt?: Maybe<Scalars['Int']>
  date_gte?: Maybe<Scalars['Int']>
  date_in?: Maybe<Array<Scalars['Int']>>
  date_lt?: Maybe<Scalars['Int']>
  date_lte?: Maybe<Scalars['Int']>
  date_not?: Maybe<Scalars['Int']>
  date_not_in?: Maybe<Array<Scalars['Int']>>
  feeGrowthGlobal0X128?: Maybe<Scalars['v3rinkeby_BigInt']>
  feeGrowthGlobal0X128_gt?: Maybe<Scalars['v3rinkeby_BigInt']>
  feeGrowthGlobal0X128_gte?: Maybe<Scalars['v3rinkeby_BigInt']>
  feeGrowthGlobal0X128_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  feeGrowthGlobal0X128_lt?: Maybe<Scalars['v3rinkeby_BigInt']>
  feeGrowthGlobal0X128_lte?: Maybe<Scalars['v3rinkeby_BigInt']>
  feeGrowthGlobal0X128_not?: Maybe<Scalars['v3rinkeby_BigInt']>
  feeGrowthGlobal0X128_not_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  feeGrowthGlobal1X128?: Maybe<Scalars['v3rinkeby_BigInt']>
  feeGrowthGlobal1X128_gt?: Maybe<Scalars['v3rinkeby_BigInt']>
  feeGrowthGlobal1X128_gte?: Maybe<Scalars['v3rinkeby_BigInt']>
  feeGrowthGlobal1X128_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  feeGrowthGlobal1X128_lt?: Maybe<Scalars['v3rinkeby_BigInt']>
  feeGrowthGlobal1X128_lte?: Maybe<Scalars['v3rinkeby_BigInt']>
  feeGrowthGlobal1X128_not?: Maybe<Scalars['v3rinkeby_BigInt']>
  feeGrowthGlobal1X128_not_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  feesUSD?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  feesUSD_gt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  feesUSD_gte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  feesUSD_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  feesUSD_lt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  feesUSD_lte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  feesUSD_not?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  feesUSD_not_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  high?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  high_gt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  high_gte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  high_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  high_lt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  high_lte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  high_not?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  high_not_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  id?: Maybe<Scalars['ID']>
  id_gt?: Maybe<Scalars['ID']>
  id_gte?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  id_lt?: Maybe<Scalars['ID']>
  id_lte?: Maybe<Scalars['ID']>
  id_not?: Maybe<Scalars['ID']>
  id_not_in?: Maybe<Array<Scalars['ID']>>
  liquidity?: Maybe<Scalars['v3rinkeby_BigInt']>
  liquidity_gt?: Maybe<Scalars['v3rinkeby_BigInt']>
  liquidity_gte?: Maybe<Scalars['v3rinkeby_BigInt']>
  liquidity_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  liquidity_lt?: Maybe<Scalars['v3rinkeby_BigInt']>
  liquidity_lte?: Maybe<Scalars['v3rinkeby_BigInt']>
  liquidity_not?: Maybe<Scalars['v3rinkeby_BigInt']>
  liquidity_not_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  low?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  low_gt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  low_gte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  low_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  low_lt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  low_lte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  low_not?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  low_not_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  open?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  open_gt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  open_gte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  open_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  open_lt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  open_lte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  open_not?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  open_not_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  pool?: Maybe<Scalars['String']>
  pool_contains?: Maybe<Scalars['String']>
  pool_ends_with?: Maybe<Scalars['String']>
  pool_gt?: Maybe<Scalars['String']>
  pool_gte?: Maybe<Scalars['String']>
  pool_in?: Maybe<Array<Scalars['String']>>
  pool_lt?: Maybe<Scalars['String']>
  pool_lte?: Maybe<Scalars['String']>
  pool_not?: Maybe<Scalars['String']>
  pool_not_contains?: Maybe<Scalars['String']>
  pool_not_ends_with?: Maybe<Scalars['String']>
  pool_not_in?: Maybe<Array<Scalars['String']>>
  pool_not_starts_with?: Maybe<Scalars['String']>
  pool_starts_with?: Maybe<Scalars['String']>
  sqrtPrice?: Maybe<Scalars['v3rinkeby_BigInt']>
  sqrtPrice_gt?: Maybe<Scalars['v3rinkeby_BigInt']>
  sqrtPrice_gte?: Maybe<Scalars['v3rinkeby_BigInt']>
  sqrtPrice_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  sqrtPrice_lt?: Maybe<Scalars['v3rinkeby_BigInt']>
  sqrtPrice_lte?: Maybe<Scalars['v3rinkeby_BigInt']>
  sqrtPrice_not?: Maybe<Scalars['v3rinkeby_BigInt']>
  sqrtPrice_not_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  tick?: Maybe<Scalars['v3rinkeby_BigInt']>
  tick_gt?: Maybe<Scalars['v3rinkeby_BigInt']>
  tick_gte?: Maybe<Scalars['v3rinkeby_BigInt']>
  tick_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  tick_lt?: Maybe<Scalars['v3rinkeby_BigInt']>
  tick_lte?: Maybe<Scalars['v3rinkeby_BigInt']>
  tick_not?: Maybe<Scalars['v3rinkeby_BigInt']>
  tick_not_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  token0Price?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  token0Price_gt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  token0Price_gte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  token0Price_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  token0Price_lt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  token0Price_lte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  token0Price_not?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  token0Price_not_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  token1Price?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  token1Price_gt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  token1Price_gte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  token1Price_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  token1Price_lt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  token1Price_lte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  token1Price_not?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  token1Price_not_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  tvlUSD?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  tvlUSD_gt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  tvlUSD_gte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  tvlUSD_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  tvlUSD_lt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  tvlUSD_lte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  tvlUSD_not?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  tvlUSD_not_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  txCount?: Maybe<Scalars['v3rinkeby_BigInt']>
  txCount_gt?: Maybe<Scalars['v3rinkeby_BigInt']>
  txCount_gte?: Maybe<Scalars['v3rinkeby_BigInt']>
  txCount_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  txCount_lt?: Maybe<Scalars['v3rinkeby_BigInt']>
  txCount_lte?: Maybe<Scalars['v3rinkeby_BigInt']>
  txCount_not?: Maybe<Scalars['v3rinkeby_BigInt']>
  txCount_not_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  volumeToken0?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeToken0_gt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeToken0_gte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeToken0_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  volumeToken0_lt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeToken0_lte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeToken0_not?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeToken0_not_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  volumeToken1?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeToken1_gt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeToken1_gte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeToken1_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  volumeToken1_lt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeToken1_lte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeToken1_not?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeToken1_not_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  volumeUSD?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeUSD_gt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeUSD_gte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeUSD_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  volumeUSD_lt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeUSD_lte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeUSD_not?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeUSD_not_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
}

export enum V3rinkeby_PoolDayData_OrderBy {
  Close = 'close',
  Date = 'date',
  FeeGrowthGlobal0X128 = 'feeGrowthGlobal0X128',
  FeeGrowthGlobal1X128 = 'feeGrowthGlobal1X128',
  FeesUsd = 'feesUSD',
  High = 'high',
  Id = 'id',
  Liquidity = 'liquidity',
  Low = 'low',
  Open = 'open',
  Pool = 'pool',
  SqrtPrice = 'sqrtPrice',
  Tick = 'tick',
  Token0Price = 'token0Price',
  Token1Price = 'token1Price',
  TvlUsd = 'tvlUSD',
  TxCount = 'txCount',
  VolumeToken0 = 'volumeToken0',
  VolumeToken1 = 'volumeToken1',
  VolumeUsd = 'volumeUSD',
}

export type V3rinkeby_PoolHourData = {
  __typename?: 'v3rinkeby_PoolHourData'
  close: Scalars['v3rinkeby_BigDecimal']
  feeGrowthGlobal0X128: Scalars['v3rinkeby_BigInt']
  feeGrowthGlobal1X128: Scalars['v3rinkeby_BigInt']
  feesUSD: Scalars['v3rinkeby_BigDecimal']
  high: Scalars['v3rinkeby_BigDecimal']
  id: Scalars['ID']
  liquidity: Scalars['v3rinkeby_BigInt']
  low: Scalars['v3rinkeby_BigDecimal']
  open: Scalars['v3rinkeby_BigDecimal']
  periodStartUnix: Scalars['Int']
  pool: V3rinkeby_Pool
  sqrtPrice: Scalars['v3rinkeby_BigInt']
  tick?: Maybe<Scalars['v3rinkeby_BigInt']>
  token0Price: Scalars['v3rinkeby_BigDecimal']
  token1Price: Scalars['v3rinkeby_BigDecimal']
  tvlUSD: Scalars['v3rinkeby_BigDecimal']
  txCount: Scalars['v3rinkeby_BigInt']
  volumeToken0: Scalars['v3rinkeby_BigDecimal']
  volumeToken1: Scalars['v3rinkeby_BigDecimal']
  volumeUSD: Scalars['v3rinkeby_BigDecimal']
}

export type V3rinkeby_PoolHourData_Filter = {
  close?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  close_gt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  close_gte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  close_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  close_lt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  close_lte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  close_not?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  close_not_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  feeGrowthGlobal0X128?: Maybe<Scalars['v3rinkeby_BigInt']>
  feeGrowthGlobal0X128_gt?: Maybe<Scalars['v3rinkeby_BigInt']>
  feeGrowthGlobal0X128_gte?: Maybe<Scalars['v3rinkeby_BigInt']>
  feeGrowthGlobal0X128_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  feeGrowthGlobal0X128_lt?: Maybe<Scalars['v3rinkeby_BigInt']>
  feeGrowthGlobal0X128_lte?: Maybe<Scalars['v3rinkeby_BigInt']>
  feeGrowthGlobal0X128_not?: Maybe<Scalars['v3rinkeby_BigInt']>
  feeGrowthGlobal0X128_not_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  feeGrowthGlobal1X128?: Maybe<Scalars['v3rinkeby_BigInt']>
  feeGrowthGlobal1X128_gt?: Maybe<Scalars['v3rinkeby_BigInt']>
  feeGrowthGlobal1X128_gte?: Maybe<Scalars['v3rinkeby_BigInt']>
  feeGrowthGlobal1X128_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  feeGrowthGlobal1X128_lt?: Maybe<Scalars['v3rinkeby_BigInt']>
  feeGrowthGlobal1X128_lte?: Maybe<Scalars['v3rinkeby_BigInt']>
  feeGrowthGlobal1X128_not?: Maybe<Scalars['v3rinkeby_BigInt']>
  feeGrowthGlobal1X128_not_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  feesUSD?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  feesUSD_gt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  feesUSD_gte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  feesUSD_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  feesUSD_lt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  feesUSD_lte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  feesUSD_not?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  feesUSD_not_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  high?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  high_gt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  high_gte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  high_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  high_lt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  high_lte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  high_not?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  high_not_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  id?: Maybe<Scalars['ID']>
  id_gt?: Maybe<Scalars['ID']>
  id_gte?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  id_lt?: Maybe<Scalars['ID']>
  id_lte?: Maybe<Scalars['ID']>
  id_not?: Maybe<Scalars['ID']>
  id_not_in?: Maybe<Array<Scalars['ID']>>
  liquidity?: Maybe<Scalars['v3rinkeby_BigInt']>
  liquidity_gt?: Maybe<Scalars['v3rinkeby_BigInt']>
  liquidity_gte?: Maybe<Scalars['v3rinkeby_BigInt']>
  liquidity_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  liquidity_lt?: Maybe<Scalars['v3rinkeby_BigInt']>
  liquidity_lte?: Maybe<Scalars['v3rinkeby_BigInt']>
  liquidity_not?: Maybe<Scalars['v3rinkeby_BigInt']>
  liquidity_not_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  low?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  low_gt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  low_gte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  low_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  low_lt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  low_lte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  low_not?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  low_not_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  open?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  open_gt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  open_gte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  open_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  open_lt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  open_lte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  open_not?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  open_not_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  periodStartUnix?: Maybe<Scalars['Int']>
  periodStartUnix_gt?: Maybe<Scalars['Int']>
  periodStartUnix_gte?: Maybe<Scalars['Int']>
  periodStartUnix_in?: Maybe<Array<Scalars['Int']>>
  periodStartUnix_lt?: Maybe<Scalars['Int']>
  periodStartUnix_lte?: Maybe<Scalars['Int']>
  periodStartUnix_not?: Maybe<Scalars['Int']>
  periodStartUnix_not_in?: Maybe<Array<Scalars['Int']>>
  pool?: Maybe<Scalars['String']>
  pool_contains?: Maybe<Scalars['String']>
  pool_ends_with?: Maybe<Scalars['String']>
  pool_gt?: Maybe<Scalars['String']>
  pool_gte?: Maybe<Scalars['String']>
  pool_in?: Maybe<Array<Scalars['String']>>
  pool_lt?: Maybe<Scalars['String']>
  pool_lte?: Maybe<Scalars['String']>
  pool_not?: Maybe<Scalars['String']>
  pool_not_contains?: Maybe<Scalars['String']>
  pool_not_ends_with?: Maybe<Scalars['String']>
  pool_not_in?: Maybe<Array<Scalars['String']>>
  pool_not_starts_with?: Maybe<Scalars['String']>
  pool_starts_with?: Maybe<Scalars['String']>
  sqrtPrice?: Maybe<Scalars['v3rinkeby_BigInt']>
  sqrtPrice_gt?: Maybe<Scalars['v3rinkeby_BigInt']>
  sqrtPrice_gte?: Maybe<Scalars['v3rinkeby_BigInt']>
  sqrtPrice_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  sqrtPrice_lt?: Maybe<Scalars['v3rinkeby_BigInt']>
  sqrtPrice_lte?: Maybe<Scalars['v3rinkeby_BigInt']>
  sqrtPrice_not?: Maybe<Scalars['v3rinkeby_BigInt']>
  sqrtPrice_not_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  tick?: Maybe<Scalars['v3rinkeby_BigInt']>
  tick_gt?: Maybe<Scalars['v3rinkeby_BigInt']>
  tick_gte?: Maybe<Scalars['v3rinkeby_BigInt']>
  tick_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  tick_lt?: Maybe<Scalars['v3rinkeby_BigInt']>
  tick_lte?: Maybe<Scalars['v3rinkeby_BigInt']>
  tick_not?: Maybe<Scalars['v3rinkeby_BigInt']>
  tick_not_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  token0Price?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  token0Price_gt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  token0Price_gte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  token0Price_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  token0Price_lt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  token0Price_lte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  token0Price_not?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  token0Price_not_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  token1Price?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  token1Price_gt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  token1Price_gte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  token1Price_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  token1Price_lt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  token1Price_lte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  token1Price_not?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  token1Price_not_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  tvlUSD?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  tvlUSD_gt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  tvlUSD_gte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  tvlUSD_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  tvlUSD_lt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  tvlUSD_lte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  tvlUSD_not?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  tvlUSD_not_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  txCount?: Maybe<Scalars['v3rinkeby_BigInt']>
  txCount_gt?: Maybe<Scalars['v3rinkeby_BigInt']>
  txCount_gte?: Maybe<Scalars['v3rinkeby_BigInt']>
  txCount_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  txCount_lt?: Maybe<Scalars['v3rinkeby_BigInt']>
  txCount_lte?: Maybe<Scalars['v3rinkeby_BigInt']>
  txCount_not?: Maybe<Scalars['v3rinkeby_BigInt']>
  txCount_not_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  volumeToken0?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeToken0_gt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeToken0_gte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeToken0_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  volumeToken0_lt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeToken0_lte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeToken0_not?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeToken0_not_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  volumeToken1?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeToken1_gt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeToken1_gte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeToken1_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  volumeToken1_lt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeToken1_lte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeToken1_not?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeToken1_not_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  volumeUSD?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeUSD_gt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeUSD_gte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeUSD_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  volumeUSD_lt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeUSD_lte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeUSD_not?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeUSD_not_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
}

export enum V3rinkeby_PoolHourData_OrderBy {
  Close = 'close',
  FeeGrowthGlobal0X128 = 'feeGrowthGlobal0X128',
  FeeGrowthGlobal1X128 = 'feeGrowthGlobal1X128',
  FeesUsd = 'feesUSD',
  High = 'high',
  Id = 'id',
  Liquidity = 'liquidity',
  Low = 'low',
  Open = 'open',
  PeriodStartUnix = 'periodStartUnix',
  Pool = 'pool',
  SqrtPrice = 'sqrtPrice',
  Tick = 'tick',
  Token0Price = 'token0Price',
  Token1Price = 'token1Price',
  TvlUsd = 'tvlUSD',
  TxCount = 'txCount',
  VolumeToken0 = 'volumeToken0',
  VolumeToken1 = 'volumeToken1',
  VolumeUsd = 'volumeUSD',
}

export type V3rinkeby_Pool_Filter = {
  collectedFeesToken0?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  collectedFeesToken0_gt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  collectedFeesToken0_gte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  collectedFeesToken0_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  collectedFeesToken0_lt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  collectedFeesToken0_lte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  collectedFeesToken0_not?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  collectedFeesToken0_not_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  collectedFeesToken1?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  collectedFeesToken1_gt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  collectedFeesToken1_gte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  collectedFeesToken1_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  collectedFeesToken1_lt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  collectedFeesToken1_lte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  collectedFeesToken1_not?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  collectedFeesToken1_not_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  collectedFeesUSD?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  collectedFeesUSD_gt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  collectedFeesUSD_gte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  collectedFeesUSD_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  collectedFeesUSD_lt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  collectedFeesUSD_lte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  collectedFeesUSD_not?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  collectedFeesUSD_not_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  createdAtBlockNumber?: Maybe<Scalars['v3rinkeby_BigInt']>
  createdAtBlockNumber_gt?: Maybe<Scalars['v3rinkeby_BigInt']>
  createdAtBlockNumber_gte?: Maybe<Scalars['v3rinkeby_BigInt']>
  createdAtBlockNumber_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  createdAtBlockNumber_lt?: Maybe<Scalars['v3rinkeby_BigInt']>
  createdAtBlockNumber_lte?: Maybe<Scalars['v3rinkeby_BigInt']>
  createdAtBlockNumber_not?: Maybe<Scalars['v3rinkeby_BigInt']>
  createdAtBlockNumber_not_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  createdAtTimestamp?: Maybe<Scalars['v3rinkeby_BigInt']>
  createdAtTimestamp_gt?: Maybe<Scalars['v3rinkeby_BigInt']>
  createdAtTimestamp_gte?: Maybe<Scalars['v3rinkeby_BigInt']>
  createdAtTimestamp_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  createdAtTimestamp_lt?: Maybe<Scalars['v3rinkeby_BigInt']>
  createdAtTimestamp_lte?: Maybe<Scalars['v3rinkeby_BigInt']>
  createdAtTimestamp_not?: Maybe<Scalars['v3rinkeby_BigInt']>
  createdAtTimestamp_not_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  feeGrowthGlobal0X128?: Maybe<Scalars['v3rinkeby_BigInt']>
  feeGrowthGlobal0X128_gt?: Maybe<Scalars['v3rinkeby_BigInt']>
  feeGrowthGlobal0X128_gte?: Maybe<Scalars['v3rinkeby_BigInt']>
  feeGrowthGlobal0X128_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  feeGrowthGlobal0X128_lt?: Maybe<Scalars['v3rinkeby_BigInt']>
  feeGrowthGlobal0X128_lte?: Maybe<Scalars['v3rinkeby_BigInt']>
  feeGrowthGlobal0X128_not?: Maybe<Scalars['v3rinkeby_BigInt']>
  feeGrowthGlobal0X128_not_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  feeGrowthGlobal1X128?: Maybe<Scalars['v3rinkeby_BigInt']>
  feeGrowthGlobal1X128_gt?: Maybe<Scalars['v3rinkeby_BigInt']>
  feeGrowthGlobal1X128_gte?: Maybe<Scalars['v3rinkeby_BigInt']>
  feeGrowthGlobal1X128_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  feeGrowthGlobal1X128_lt?: Maybe<Scalars['v3rinkeby_BigInt']>
  feeGrowthGlobal1X128_lte?: Maybe<Scalars['v3rinkeby_BigInt']>
  feeGrowthGlobal1X128_not?: Maybe<Scalars['v3rinkeby_BigInt']>
  feeGrowthGlobal1X128_not_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  feeTier?: Maybe<Scalars['v3rinkeby_BigInt']>
  feeTier_gt?: Maybe<Scalars['v3rinkeby_BigInt']>
  feeTier_gte?: Maybe<Scalars['v3rinkeby_BigInt']>
  feeTier_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  feeTier_lt?: Maybe<Scalars['v3rinkeby_BigInt']>
  feeTier_lte?: Maybe<Scalars['v3rinkeby_BigInt']>
  feeTier_not?: Maybe<Scalars['v3rinkeby_BigInt']>
  feeTier_not_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  feesUSD?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  feesUSD_gt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  feesUSD_gte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  feesUSD_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  feesUSD_lt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  feesUSD_lte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  feesUSD_not?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  feesUSD_not_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  id?: Maybe<Scalars['ID']>
  id_gt?: Maybe<Scalars['ID']>
  id_gte?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  id_lt?: Maybe<Scalars['ID']>
  id_lte?: Maybe<Scalars['ID']>
  id_not?: Maybe<Scalars['ID']>
  id_not_in?: Maybe<Array<Scalars['ID']>>
  liquidity?: Maybe<Scalars['v3rinkeby_BigInt']>
  liquidityProviderCount?: Maybe<Scalars['v3rinkeby_BigInt']>
  liquidityProviderCount_gt?: Maybe<Scalars['v3rinkeby_BigInt']>
  liquidityProviderCount_gte?: Maybe<Scalars['v3rinkeby_BigInt']>
  liquidityProviderCount_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  liquidityProviderCount_lt?: Maybe<Scalars['v3rinkeby_BigInt']>
  liquidityProviderCount_lte?: Maybe<Scalars['v3rinkeby_BigInt']>
  liquidityProviderCount_not?: Maybe<Scalars['v3rinkeby_BigInt']>
  liquidityProviderCount_not_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  liquidity_gt?: Maybe<Scalars['v3rinkeby_BigInt']>
  liquidity_gte?: Maybe<Scalars['v3rinkeby_BigInt']>
  liquidity_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  liquidity_lt?: Maybe<Scalars['v3rinkeby_BigInt']>
  liquidity_lte?: Maybe<Scalars['v3rinkeby_BigInt']>
  liquidity_not?: Maybe<Scalars['v3rinkeby_BigInt']>
  liquidity_not_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  observationIndex?: Maybe<Scalars['v3rinkeby_BigInt']>
  observationIndex_gt?: Maybe<Scalars['v3rinkeby_BigInt']>
  observationIndex_gte?: Maybe<Scalars['v3rinkeby_BigInt']>
  observationIndex_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  observationIndex_lt?: Maybe<Scalars['v3rinkeby_BigInt']>
  observationIndex_lte?: Maybe<Scalars['v3rinkeby_BigInt']>
  observationIndex_not?: Maybe<Scalars['v3rinkeby_BigInt']>
  observationIndex_not_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  sqrtPrice?: Maybe<Scalars['v3rinkeby_BigInt']>
  sqrtPrice_gt?: Maybe<Scalars['v3rinkeby_BigInt']>
  sqrtPrice_gte?: Maybe<Scalars['v3rinkeby_BigInt']>
  sqrtPrice_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  sqrtPrice_lt?: Maybe<Scalars['v3rinkeby_BigInt']>
  sqrtPrice_lte?: Maybe<Scalars['v3rinkeby_BigInt']>
  sqrtPrice_not?: Maybe<Scalars['v3rinkeby_BigInt']>
  sqrtPrice_not_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  tick?: Maybe<Scalars['v3rinkeby_BigInt']>
  tick_gt?: Maybe<Scalars['v3rinkeby_BigInt']>
  tick_gte?: Maybe<Scalars['v3rinkeby_BigInt']>
  tick_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  tick_lt?: Maybe<Scalars['v3rinkeby_BigInt']>
  tick_lte?: Maybe<Scalars['v3rinkeby_BigInt']>
  tick_not?: Maybe<Scalars['v3rinkeby_BigInt']>
  tick_not_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  token0?: Maybe<Scalars['String']>
  token0Price?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  token0Price_gt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  token0Price_gte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  token0Price_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  token0Price_lt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  token0Price_lte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  token0Price_not?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  token0Price_not_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  token0_contains?: Maybe<Scalars['String']>
  token0_ends_with?: Maybe<Scalars['String']>
  token0_gt?: Maybe<Scalars['String']>
  token0_gte?: Maybe<Scalars['String']>
  token0_in?: Maybe<Array<Scalars['String']>>
  token0_lt?: Maybe<Scalars['String']>
  token0_lte?: Maybe<Scalars['String']>
  token0_not?: Maybe<Scalars['String']>
  token0_not_contains?: Maybe<Scalars['String']>
  token0_not_ends_with?: Maybe<Scalars['String']>
  token0_not_in?: Maybe<Array<Scalars['String']>>
  token0_not_starts_with?: Maybe<Scalars['String']>
  token0_starts_with?: Maybe<Scalars['String']>
  token1?: Maybe<Scalars['String']>
  token1Price?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  token1Price_gt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  token1Price_gte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  token1Price_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  token1Price_lt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  token1Price_lte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  token1Price_not?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  token1Price_not_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  token1_contains?: Maybe<Scalars['String']>
  token1_ends_with?: Maybe<Scalars['String']>
  token1_gt?: Maybe<Scalars['String']>
  token1_gte?: Maybe<Scalars['String']>
  token1_in?: Maybe<Array<Scalars['String']>>
  token1_lt?: Maybe<Scalars['String']>
  token1_lte?: Maybe<Scalars['String']>
  token1_not?: Maybe<Scalars['String']>
  token1_not_contains?: Maybe<Scalars['String']>
  token1_not_ends_with?: Maybe<Scalars['String']>
  token1_not_in?: Maybe<Array<Scalars['String']>>
  token1_not_starts_with?: Maybe<Scalars['String']>
  token1_starts_with?: Maybe<Scalars['String']>
  totalValueLockedETH?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  totalValueLockedETH_gt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  totalValueLockedETH_gte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  totalValueLockedETH_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  totalValueLockedETH_lt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  totalValueLockedETH_lte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  totalValueLockedETH_not?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  totalValueLockedETH_not_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  totalValueLockedToken0?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  totalValueLockedToken0_gt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  totalValueLockedToken0_gte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  totalValueLockedToken0_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  totalValueLockedToken0_lt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  totalValueLockedToken0_lte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  totalValueLockedToken0_not?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  totalValueLockedToken0_not_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  totalValueLockedToken1?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  totalValueLockedToken1_gt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  totalValueLockedToken1_gte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  totalValueLockedToken1_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  totalValueLockedToken1_lt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  totalValueLockedToken1_lte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  totalValueLockedToken1_not?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  totalValueLockedToken1_not_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  totalValueLockedUSD?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  totalValueLockedUSDUntracked?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  totalValueLockedUSDUntracked_gt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  totalValueLockedUSDUntracked_gte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  totalValueLockedUSDUntracked_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  totalValueLockedUSDUntracked_lt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  totalValueLockedUSDUntracked_lte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  totalValueLockedUSDUntracked_not?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  totalValueLockedUSDUntracked_not_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  totalValueLockedUSD_gt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  totalValueLockedUSD_gte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  totalValueLockedUSD_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  totalValueLockedUSD_lt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  totalValueLockedUSD_lte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  totalValueLockedUSD_not?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  totalValueLockedUSD_not_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  txCount?: Maybe<Scalars['v3rinkeby_BigInt']>
  txCount_gt?: Maybe<Scalars['v3rinkeby_BigInt']>
  txCount_gte?: Maybe<Scalars['v3rinkeby_BigInt']>
  txCount_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  txCount_lt?: Maybe<Scalars['v3rinkeby_BigInt']>
  txCount_lte?: Maybe<Scalars['v3rinkeby_BigInt']>
  txCount_not?: Maybe<Scalars['v3rinkeby_BigInt']>
  txCount_not_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  untrackedVolumeUSD?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  untrackedVolumeUSD_gt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  untrackedVolumeUSD_gte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  untrackedVolumeUSD_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  untrackedVolumeUSD_lt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  untrackedVolumeUSD_lte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  untrackedVolumeUSD_not?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  untrackedVolumeUSD_not_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  volumeToken0?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeToken0_gt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeToken0_gte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeToken0_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  volumeToken0_lt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeToken0_lte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeToken0_not?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeToken0_not_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  volumeToken1?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeToken1_gt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeToken1_gte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeToken1_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  volumeToken1_lt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeToken1_lte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeToken1_not?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeToken1_not_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  volumeUSD?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeUSD_gt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeUSD_gte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeUSD_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  volumeUSD_lt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeUSD_lte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeUSD_not?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeUSD_not_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
}

export enum V3rinkeby_Pool_OrderBy {
  Burns = 'burns',
  CollectedFeesToken0 = 'collectedFeesToken0',
  CollectedFeesToken1 = 'collectedFeesToken1',
  CollectedFeesUsd = 'collectedFeesUSD',
  Collects = 'collects',
  CreatedAtBlockNumber = 'createdAtBlockNumber',
  CreatedAtTimestamp = 'createdAtTimestamp',
  FeeGrowthGlobal0X128 = 'feeGrowthGlobal0X128',
  FeeGrowthGlobal1X128 = 'feeGrowthGlobal1X128',
  FeeTier = 'feeTier',
  FeesUsd = 'feesUSD',
  Id = 'id',
  Liquidity = 'liquidity',
  LiquidityProviderCount = 'liquidityProviderCount',
  Mints = 'mints',
  ObservationIndex = 'observationIndex',
  PoolDayData = 'poolDayData',
  PoolHourData = 'poolHourData',
  SqrtPrice = 'sqrtPrice',
  Swaps = 'swaps',
  Tick = 'tick',
  Ticks = 'ticks',
  Token0 = 'token0',
  Token0Price = 'token0Price',
  Token1 = 'token1',
  Token1Price = 'token1Price',
  TotalValueLockedEth = 'totalValueLockedETH',
  TotalValueLockedToken0 = 'totalValueLockedToken0',
  TotalValueLockedToken1 = 'totalValueLockedToken1',
  TotalValueLockedUsd = 'totalValueLockedUSD',
  TotalValueLockedUsdUntracked = 'totalValueLockedUSDUntracked',
  TxCount = 'txCount',
  UntrackedVolumeUsd = 'untrackedVolumeUSD',
  VolumeToken0 = 'volumeToken0',
  VolumeToken1 = 'volumeToken1',
  VolumeUsd = 'volumeUSD',
}

export type V3rinkeby_Position = {
  __typename?: 'v3rinkeby_Position'
  collectedFeesToken0: Scalars['v3rinkeby_BigDecimal']
  collectedFeesToken1: Scalars['v3rinkeby_BigDecimal']
  collectedToken0: Scalars['v3rinkeby_BigDecimal']
  collectedToken1: Scalars['v3rinkeby_BigDecimal']
  depositedToken0: Scalars['v3rinkeby_BigDecimal']
  depositedToken1: Scalars['v3rinkeby_BigDecimal']
  feeGrowthInside0LastX128: Scalars['v3rinkeby_BigInt']
  feeGrowthInside1LastX128: Scalars['v3rinkeby_BigInt']
  id: Scalars['ID']
  liquidity: Scalars['v3rinkeby_BigInt']
  owner: Scalars['v3rinkeby_Bytes']
  pool: V3rinkeby_Pool
  tickLower: V3rinkeby_Tick
  tickUpper: V3rinkeby_Tick
  token0: V3rinkeby_Token
  token1: V3rinkeby_Token
  transaction: V3rinkeby_Transaction
  withdrawnToken0: Scalars['v3rinkeby_BigDecimal']
  withdrawnToken1: Scalars['v3rinkeby_BigDecimal']
}

export type V3rinkeby_PositionSnapshot = {
  __typename?: 'v3rinkeby_PositionSnapshot'
  blockNumber: Scalars['v3rinkeby_BigInt']
  collectedFeesToken0: Scalars['v3rinkeby_BigDecimal']
  collectedFeesToken1: Scalars['v3rinkeby_BigDecimal']
  depositedToken0: Scalars['v3rinkeby_BigDecimal']
  depositedToken1: Scalars['v3rinkeby_BigDecimal']
  feeGrowthInside0LastX128: Scalars['v3rinkeby_BigInt']
  feeGrowthInside1LastX128: Scalars['v3rinkeby_BigInt']
  id: Scalars['ID']
  liquidity: Scalars['v3rinkeby_BigInt']
  owner: Scalars['v3rinkeby_Bytes']
  pool: V3rinkeby_Pool
  position: V3rinkeby_Position
  timestamp: Scalars['v3rinkeby_BigInt']
  transaction: V3rinkeby_Transaction
  withdrawnToken0: Scalars['v3rinkeby_BigDecimal']
  withdrawnToken1: Scalars['v3rinkeby_BigDecimal']
}

export type V3rinkeby_PositionSnapshot_Filter = {
  blockNumber?: Maybe<Scalars['v3rinkeby_BigInt']>
  blockNumber_gt?: Maybe<Scalars['v3rinkeby_BigInt']>
  blockNumber_gte?: Maybe<Scalars['v3rinkeby_BigInt']>
  blockNumber_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  blockNumber_lt?: Maybe<Scalars['v3rinkeby_BigInt']>
  blockNumber_lte?: Maybe<Scalars['v3rinkeby_BigInt']>
  blockNumber_not?: Maybe<Scalars['v3rinkeby_BigInt']>
  blockNumber_not_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  collectedFeesToken0?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  collectedFeesToken0_gt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  collectedFeesToken0_gte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  collectedFeesToken0_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  collectedFeesToken0_lt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  collectedFeesToken0_lte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  collectedFeesToken0_not?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  collectedFeesToken0_not_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  collectedFeesToken1?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  collectedFeesToken1_gt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  collectedFeesToken1_gte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  collectedFeesToken1_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  collectedFeesToken1_lt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  collectedFeesToken1_lte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  collectedFeesToken1_not?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  collectedFeesToken1_not_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  depositedToken0?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  depositedToken0_gt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  depositedToken0_gte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  depositedToken0_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  depositedToken0_lt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  depositedToken0_lte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  depositedToken0_not?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  depositedToken0_not_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  depositedToken1?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  depositedToken1_gt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  depositedToken1_gte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  depositedToken1_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  depositedToken1_lt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  depositedToken1_lte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  depositedToken1_not?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  depositedToken1_not_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  feeGrowthInside0LastX128?: Maybe<Scalars['v3rinkeby_BigInt']>
  feeGrowthInside0LastX128_gt?: Maybe<Scalars['v3rinkeby_BigInt']>
  feeGrowthInside0LastX128_gte?: Maybe<Scalars['v3rinkeby_BigInt']>
  feeGrowthInside0LastX128_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  feeGrowthInside0LastX128_lt?: Maybe<Scalars['v3rinkeby_BigInt']>
  feeGrowthInside0LastX128_lte?: Maybe<Scalars['v3rinkeby_BigInt']>
  feeGrowthInside0LastX128_not?: Maybe<Scalars['v3rinkeby_BigInt']>
  feeGrowthInside0LastX128_not_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  feeGrowthInside1LastX128?: Maybe<Scalars['v3rinkeby_BigInt']>
  feeGrowthInside1LastX128_gt?: Maybe<Scalars['v3rinkeby_BigInt']>
  feeGrowthInside1LastX128_gte?: Maybe<Scalars['v3rinkeby_BigInt']>
  feeGrowthInside1LastX128_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  feeGrowthInside1LastX128_lt?: Maybe<Scalars['v3rinkeby_BigInt']>
  feeGrowthInside1LastX128_lte?: Maybe<Scalars['v3rinkeby_BigInt']>
  feeGrowthInside1LastX128_not?: Maybe<Scalars['v3rinkeby_BigInt']>
  feeGrowthInside1LastX128_not_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  id?: Maybe<Scalars['ID']>
  id_gt?: Maybe<Scalars['ID']>
  id_gte?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  id_lt?: Maybe<Scalars['ID']>
  id_lte?: Maybe<Scalars['ID']>
  id_not?: Maybe<Scalars['ID']>
  id_not_in?: Maybe<Array<Scalars['ID']>>
  liquidity?: Maybe<Scalars['v3rinkeby_BigInt']>
  liquidity_gt?: Maybe<Scalars['v3rinkeby_BigInt']>
  liquidity_gte?: Maybe<Scalars['v3rinkeby_BigInt']>
  liquidity_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  liquidity_lt?: Maybe<Scalars['v3rinkeby_BigInt']>
  liquidity_lte?: Maybe<Scalars['v3rinkeby_BigInt']>
  liquidity_not?: Maybe<Scalars['v3rinkeby_BigInt']>
  liquidity_not_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  owner?: Maybe<Scalars['v3rinkeby_Bytes']>
  owner_contains?: Maybe<Scalars['v3rinkeby_Bytes']>
  owner_in?: Maybe<Array<Scalars['v3rinkeby_Bytes']>>
  owner_not?: Maybe<Scalars['v3rinkeby_Bytes']>
  owner_not_contains?: Maybe<Scalars['v3rinkeby_Bytes']>
  owner_not_in?: Maybe<Array<Scalars['v3rinkeby_Bytes']>>
  pool?: Maybe<Scalars['String']>
  pool_contains?: Maybe<Scalars['String']>
  pool_ends_with?: Maybe<Scalars['String']>
  pool_gt?: Maybe<Scalars['String']>
  pool_gte?: Maybe<Scalars['String']>
  pool_in?: Maybe<Array<Scalars['String']>>
  pool_lt?: Maybe<Scalars['String']>
  pool_lte?: Maybe<Scalars['String']>
  pool_not?: Maybe<Scalars['String']>
  pool_not_contains?: Maybe<Scalars['String']>
  pool_not_ends_with?: Maybe<Scalars['String']>
  pool_not_in?: Maybe<Array<Scalars['String']>>
  pool_not_starts_with?: Maybe<Scalars['String']>
  pool_starts_with?: Maybe<Scalars['String']>
  position?: Maybe<Scalars['String']>
  position_contains?: Maybe<Scalars['String']>
  position_ends_with?: Maybe<Scalars['String']>
  position_gt?: Maybe<Scalars['String']>
  position_gte?: Maybe<Scalars['String']>
  position_in?: Maybe<Array<Scalars['String']>>
  position_lt?: Maybe<Scalars['String']>
  position_lte?: Maybe<Scalars['String']>
  position_not?: Maybe<Scalars['String']>
  position_not_contains?: Maybe<Scalars['String']>
  position_not_ends_with?: Maybe<Scalars['String']>
  position_not_in?: Maybe<Array<Scalars['String']>>
  position_not_starts_with?: Maybe<Scalars['String']>
  position_starts_with?: Maybe<Scalars['String']>
  timestamp?: Maybe<Scalars['v3rinkeby_BigInt']>
  timestamp_gt?: Maybe<Scalars['v3rinkeby_BigInt']>
  timestamp_gte?: Maybe<Scalars['v3rinkeby_BigInt']>
  timestamp_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  timestamp_lt?: Maybe<Scalars['v3rinkeby_BigInt']>
  timestamp_lte?: Maybe<Scalars['v3rinkeby_BigInt']>
  timestamp_not?: Maybe<Scalars['v3rinkeby_BigInt']>
  timestamp_not_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  transaction?: Maybe<Scalars['String']>
  transaction_contains?: Maybe<Scalars['String']>
  transaction_ends_with?: Maybe<Scalars['String']>
  transaction_gt?: Maybe<Scalars['String']>
  transaction_gte?: Maybe<Scalars['String']>
  transaction_in?: Maybe<Array<Scalars['String']>>
  transaction_lt?: Maybe<Scalars['String']>
  transaction_lte?: Maybe<Scalars['String']>
  transaction_not?: Maybe<Scalars['String']>
  transaction_not_contains?: Maybe<Scalars['String']>
  transaction_not_ends_with?: Maybe<Scalars['String']>
  transaction_not_in?: Maybe<Array<Scalars['String']>>
  transaction_not_starts_with?: Maybe<Scalars['String']>
  transaction_starts_with?: Maybe<Scalars['String']>
  withdrawnToken0?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  withdrawnToken0_gt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  withdrawnToken0_gte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  withdrawnToken0_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  withdrawnToken0_lt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  withdrawnToken0_lte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  withdrawnToken0_not?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  withdrawnToken0_not_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  withdrawnToken1?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  withdrawnToken1_gt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  withdrawnToken1_gte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  withdrawnToken1_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  withdrawnToken1_lt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  withdrawnToken1_lte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  withdrawnToken1_not?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  withdrawnToken1_not_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
}

export enum V3rinkeby_PositionSnapshot_OrderBy {
  BlockNumber = 'blockNumber',
  CollectedFeesToken0 = 'collectedFeesToken0',
  CollectedFeesToken1 = 'collectedFeesToken1',
  DepositedToken0 = 'depositedToken0',
  DepositedToken1 = 'depositedToken1',
  FeeGrowthInside0LastX128 = 'feeGrowthInside0LastX128',
  FeeGrowthInside1LastX128 = 'feeGrowthInside1LastX128',
  Id = 'id',
  Liquidity = 'liquidity',
  Owner = 'owner',
  Pool = 'pool',
  Position = 'position',
  Timestamp = 'timestamp',
  Transaction = 'transaction',
  WithdrawnToken0 = 'withdrawnToken0',
  WithdrawnToken1 = 'withdrawnToken1',
}

export type V3rinkeby_Position_Filter = {
  collectedFeesToken0?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  collectedFeesToken0_gt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  collectedFeesToken0_gte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  collectedFeesToken0_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  collectedFeesToken0_lt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  collectedFeesToken0_lte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  collectedFeesToken0_not?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  collectedFeesToken0_not_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  collectedFeesToken1?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  collectedFeesToken1_gt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  collectedFeesToken1_gte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  collectedFeesToken1_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  collectedFeesToken1_lt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  collectedFeesToken1_lte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  collectedFeesToken1_not?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  collectedFeesToken1_not_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  collectedToken0?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  collectedToken0_gt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  collectedToken0_gte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  collectedToken0_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  collectedToken0_lt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  collectedToken0_lte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  collectedToken0_not?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  collectedToken0_not_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  collectedToken1?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  collectedToken1_gt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  collectedToken1_gte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  collectedToken1_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  collectedToken1_lt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  collectedToken1_lte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  collectedToken1_not?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  collectedToken1_not_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  depositedToken0?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  depositedToken0_gt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  depositedToken0_gte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  depositedToken0_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  depositedToken0_lt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  depositedToken0_lte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  depositedToken0_not?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  depositedToken0_not_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  depositedToken1?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  depositedToken1_gt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  depositedToken1_gte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  depositedToken1_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  depositedToken1_lt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  depositedToken1_lte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  depositedToken1_not?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  depositedToken1_not_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  feeGrowthInside0LastX128?: Maybe<Scalars['v3rinkeby_BigInt']>
  feeGrowthInside0LastX128_gt?: Maybe<Scalars['v3rinkeby_BigInt']>
  feeGrowthInside0LastX128_gte?: Maybe<Scalars['v3rinkeby_BigInt']>
  feeGrowthInside0LastX128_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  feeGrowthInside0LastX128_lt?: Maybe<Scalars['v3rinkeby_BigInt']>
  feeGrowthInside0LastX128_lte?: Maybe<Scalars['v3rinkeby_BigInt']>
  feeGrowthInside0LastX128_not?: Maybe<Scalars['v3rinkeby_BigInt']>
  feeGrowthInside0LastX128_not_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  feeGrowthInside1LastX128?: Maybe<Scalars['v3rinkeby_BigInt']>
  feeGrowthInside1LastX128_gt?: Maybe<Scalars['v3rinkeby_BigInt']>
  feeGrowthInside1LastX128_gte?: Maybe<Scalars['v3rinkeby_BigInt']>
  feeGrowthInside1LastX128_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  feeGrowthInside1LastX128_lt?: Maybe<Scalars['v3rinkeby_BigInt']>
  feeGrowthInside1LastX128_lte?: Maybe<Scalars['v3rinkeby_BigInt']>
  feeGrowthInside1LastX128_not?: Maybe<Scalars['v3rinkeby_BigInt']>
  feeGrowthInside1LastX128_not_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  id?: Maybe<Scalars['ID']>
  id_gt?: Maybe<Scalars['ID']>
  id_gte?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  id_lt?: Maybe<Scalars['ID']>
  id_lte?: Maybe<Scalars['ID']>
  id_not?: Maybe<Scalars['ID']>
  id_not_in?: Maybe<Array<Scalars['ID']>>
  liquidity?: Maybe<Scalars['v3rinkeby_BigInt']>
  liquidity_gt?: Maybe<Scalars['v3rinkeby_BigInt']>
  liquidity_gte?: Maybe<Scalars['v3rinkeby_BigInt']>
  liquidity_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  liquidity_lt?: Maybe<Scalars['v3rinkeby_BigInt']>
  liquidity_lte?: Maybe<Scalars['v3rinkeby_BigInt']>
  liquidity_not?: Maybe<Scalars['v3rinkeby_BigInt']>
  liquidity_not_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  owner?: Maybe<Scalars['v3rinkeby_Bytes']>
  owner_contains?: Maybe<Scalars['v3rinkeby_Bytes']>
  owner_in?: Maybe<Array<Scalars['v3rinkeby_Bytes']>>
  owner_not?: Maybe<Scalars['v3rinkeby_Bytes']>
  owner_not_contains?: Maybe<Scalars['v3rinkeby_Bytes']>
  owner_not_in?: Maybe<Array<Scalars['v3rinkeby_Bytes']>>
  pool?: Maybe<Scalars['String']>
  pool_contains?: Maybe<Scalars['String']>
  pool_ends_with?: Maybe<Scalars['String']>
  pool_gt?: Maybe<Scalars['String']>
  pool_gte?: Maybe<Scalars['String']>
  pool_in?: Maybe<Array<Scalars['String']>>
  pool_lt?: Maybe<Scalars['String']>
  pool_lte?: Maybe<Scalars['String']>
  pool_not?: Maybe<Scalars['String']>
  pool_not_contains?: Maybe<Scalars['String']>
  pool_not_ends_with?: Maybe<Scalars['String']>
  pool_not_in?: Maybe<Array<Scalars['String']>>
  pool_not_starts_with?: Maybe<Scalars['String']>
  pool_starts_with?: Maybe<Scalars['String']>
  tickLower?: Maybe<Scalars['String']>
  tickLower_contains?: Maybe<Scalars['String']>
  tickLower_ends_with?: Maybe<Scalars['String']>
  tickLower_gt?: Maybe<Scalars['String']>
  tickLower_gte?: Maybe<Scalars['String']>
  tickLower_in?: Maybe<Array<Scalars['String']>>
  tickLower_lt?: Maybe<Scalars['String']>
  tickLower_lte?: Maybe<Scalars['String']>
  tickLower_not?: Maybe<Scalars['String']>
  tickLower_not_contains?: Maybe<Scalars['String']>
  tickLower_not_ends_with?: Maybe<Scalars['String']>
  tickLower_not_in?: Maybe<Array<Scalars['String']>>
  tickLower_not_starts_with?: Maybe<Scalars['String']>
  tickLower_starts_with?: Maybe<Scalars['String']>
  tickUpper?: Maybe<Scalars['String']>
  tickUpper_contains?: Maybe<Scalars['String']>
  tickUpper_ends_with?: Maybe<Scalars['String']>
  tickUpper_gt?: Maybe<Scalars['String']>
  tickUpper_gte?: Maybe<Scalars['String']>
  tickUpper_in?: Maybe<Array<Scalars['String']>>
  tickUpper_lt?: Maybe<Scalars['String']>
  tickUpper_lte?: Maybe<Scalars['String']>
  tickUpper_not?: Maybe<Scalars['String']>
  tickUpper_not_contains?: Maybe<Scalars['String']>
  tickUpper_not_ends_with?: Maybe<Scalars['String']>
  tickUpper_not_in?: Maybe<Array<Scalars['String']>>
  tickUpper_not_starts_with?: Maybe<Scalars['String']>
  tickUpper_starts_with?: Maybe<Scalars['String']>
  token0?: Maybe<Scalars['String']>
  token0_contains?: Maybe<Scalars['String']>
  token0_ends_with?: Maybe<Scalars['String']>
  token0_gt?: Maybe<Scalars['String']>
  token0_gte?: Maybe<Scalars['String']>
  token0_in?: Maybe<Array<Scalars['String']>>
  token0_lt?: Maybe<Scalars['String']>
  token0_lte?: Maybe<Scalars['String']>
  token0_not?: Maybe<Scalars['String']>
  token0_not_contains?: Maybe<Scalars['String']>
  token0_not_ends_with?: Maybe<Scalars['String']>
  token0_not_in?: Maybe<Array<Scalars['String']>>
  token0_not_starts_with?: Maybe<Scalars['String']>
  token0_starts_with?: Maybe<Scalars['String']>
  token1?: Maybe<Scalars['String']>
  token1_contains?: Maybe<Scalars['String']>
  token1_ends_with?: Maybe<Scalars['String']>
  token1_gt?: Maybe<Scalars['String']>
  token1_gte?: Maybe<Scalars['String']>
  token1_in?: Maybe<Array<Scalars['String']>>
  token1_lt?: Maybe<Scalars['String']>
  token1_lte?: Maybe<Scalars['String']>
  token1_not?: Maybe<Scalars['String']>
  token1_not_contains?: Maybe<Scalars['String']>
  token1_not_ends_with?: Maybe<Scalars['String']>
  token1_not_in?: Maybe<Array<Scalars['String']>>
  token1_not_starts_with?: Maybe<Scalars['String']>
  token1_starts_with?: Maybe<Scalars['String']>
  transaction?: Maybe<Scalars['String']>
  transaction_contains?: Maybe<Scalars['String']>
  transaction_ends_with?: Maybe<Scalars['String']>
  transaction_gt?: Maybe<Scalars['String']>
  transaction_gte?: Maybe<Scalars['String']>
  transaction_in?: Maybe<Array<Scalars['String']>>
  transaction_lt?: Maybe<Scalars['String']>
  transaction_lte?: Maybe<Scalars['String']>
  transaction_not?: Maybe<Scalars['String']>
  transaction_not_contains?: Maybe<Scalars['String']>
  transaction_not_ends_with?: Maybe<Scalars['String']>
  transaction_not_in?: Maybe<Array<Scalars['String']>>
  transaction_not_starts_with?: Maybe<Scalars['String']>
  transaction_starts_with?: Maybe<Scalars['String']>
  withdrawnToken0?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  withdrawnToken0_gt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  withdrawnToken0_gte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  withdrawnToken0_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  withdrawnToken0_lt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  withdrawnToken0_lte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  withdrawnToken0_not?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  withdrawnToken0_not_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  withdrawnToken1?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  withdrawnToken1_gt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  withdrawnToken1_gte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  withdrawnToken1_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  withdrawnToken1_lt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  withdrawnToken1_lte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  withdrawnToken1_not?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  withdrawnToken1_not_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
}

export enum V3rinkeby_Position_OrderBy {
  CollectedFeesToken0 = 'collectedFeesToken0',
  CollectedFeesToken1 = 'collectedFeesToken1',
  CollectedToken0 = 'collectedToken0',
  CollectedToken1 = 'collectedToken1',
  DepositedToken0 = 'depositedToken0',
  DepositedToken1 = 'depositedToken1',
  FeeGrowthInside0LastX128 = 'feeGrowthInside0LastX128',
  FeeGrowthInside1LastX128 = 'feeGrowthInside1LastX128',
  Id = 'id',
  Liquidity = 'liquidity',
  Owner = 'owner',
  Pool = 'pool',
  TickLower = 'tickLower',
  TickUpper = 'tickUpper',
  Token0 = 'token0',
  Token1 = 'token1',
  Transaction = 'transaction',
  WithdrawnToken0 = 'withdrawnToken0',
  WithdrawnToken1 = 'withdrawnToken1',
}

export type V3rinkeby_Swap = {
  __typename?: 'v3rinkeby_Swap'
  amount0: Scalars['v3rinkeby_BigDecimal']
  amount1: Scalars['v3rinkeby_BigDecimal']
  amountUSD: Scalars['v3rinkeby_BigDecimal']
  id: Scalars['ID']
  logIndex?: Maybe<Scalars['v3rinkeby_BigInt']>
  origin: Scalars['v3rinkeby_Bytes']
  pool: V3rinkeby_Pool
  recipient: Scalars['v3rinkeby_Bytes']
  sender: Scalars['v3rinkeby_Bytes']
  sqrtPriceX96: Scalars['v3rinkeby_BigInt']
  tick: Scalars['v3rinkeby_BigInt']
  timestamp: Scalars['v3rinkeby_BigInt']
  token0: V3rinkeby_Token
  token1: V3rinkeby_Token
  transaction: V3rinkeby_Transaction
}

export type V3rinkeby_Swap_Filter = {
  amount0?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  amount0_gt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  amount0_gte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  amount0_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  amount0_lt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  amount0_lte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  amount0_not?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  amount0_not_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  amount1?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  amount1_gt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  amount1_gte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  amount1_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  amount1_lt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  amount1_lte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  amount1_not?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  amount1_not_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  amountUSD?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  amountUSD_gt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  amountUSD_gte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  amountUSD_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  amountUSD_lt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  amountUSD_lte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  amountUSD_not?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  amountUSD_not_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  id?: Maybe<Scalars['ID']>
  id_gt?: Maybe<Scalars['ID']>
  id_gte?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  id_lt?: Maybe<Scalars['ID']>
  id_lte?: Maybe<Scalars['ID']>
  id_not?: Maybe<Scalars['ID']>
  id_not_in?: Maybe<Array<Scalars['ID']>>
  logIndex?: Maybe<Scalars['v3rinkeby_BigInt']>
  logIndex_gt?: Maybe<Scalars['v3rinkeby_BigInt']>
  logIndex_gte?: Maybe<Scalars['v3rinkeby_BigInt']>
  logIndex_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  logIndex_lt?: Maybe<Scalars['v3rinkeby_BigInt']>
  logIndex_lte?: Maybe<Scalars['v3rinkeby_BigInt']>
  logIndex_not?: Maybe<Scalars['v3rinkeby_BigInt']>
  logIndex_not_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  origin?: Maybe<Scalars['v3rinkeby_Bytes']>
  origin_contains?: Maybe<Scalars['v3rinkeby_Bytes']>
  origin_in?: Maybe<Array<Scalars['v3rinkeby_Bytes']>>
  origin_not?: Maybe<Scalars['v3rinkeby_Bytes']>
  origin_not_contains?: Maybe<Scalars['v3rinkeby_Bytes']>
  origin_not_in?: Maybe<Array<Scalars['v3rinkeby_Bytes']>>
  pool?: Maybe<Scalars['String']>
  pool_contains?: Maybe<Scalars['String']>
  pool_ends_with?: Maybe<Scalars['String']>
  pool_gt?: Maybe<Scalars['String']>
  pool_gte?: Maybe<Scalars['String']>
  pool_in?: Maybe<Array<Scalars['String']>>
  pool_lt?: Maybe<Scalars['String']>
  pool_lte?: Maybe<Scalars['String']>
  pool_not?: Maybe<Scalars['String']>
  pool_not_contains?: Maybe<Scalars['String']>
  pool_not_ends_with?: Maybe<Scalars['String']>
  pool_not_in?: Maybe<Array<Scalars['String']>>
  pool_not_starts_with?: Maybe<Scalars['String']>
  pool_starts_with?: Maybe<Scalars['String']>
  recipient?: Maybe<Scalars['v3rinkeby_Bytes']>
  recipient_contains?: Maybe<Scalars['v3rinkeby_Bytes']>
  recipient_in?: Maybe<Array<Scalars['v3rinkeby_Bytes']>>
  recipient_not?: Maybe<Scalars['v3rinkeby_Bytes']>
  recipient_not_contains?: Maybe<Scalars['v3rinkeby_Bytes']>
  recipient_not_in?: Maybe<Array<Scalars['v3rinkeby_Bytes']>>
  sender?: Maybe<Scalars['v3rinkeby_Bytes']>
  sender_contains?: Maybe<Scalars['v3rinkeby_Bytes']>
  sender_in?: Maybe<Array<Scalars['v3rinkeby_Bytes']>>
  sender_not?: Maybe<Scalars['v3rinkeby_Bytes']>
  sender_not_contains?: Maybe<Scalars['v3rinkeby_Bytes']>
  sender_not_in?: Maybe<Array<Scalars['v3rinkeby_Bytes']>>
  sqrtPriceX96?: Maybe<Scalars['v3rinkeby_BigInt']>
  sqrtPriceX96_gt?: Maybe<Scalars['v3rinkeby_BigInt']>
  sqrtPriceX96_gte?: Maybe<Scalars['v3rinkeby_BigInt']>
  sqrtPriceX96_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  sqrtPriceX96_lt?: Maybe<Scalars['v3rinkeby_BigInt']>
  sqrtPriceX96_lte?: Maybe<Scalars['v3rinkeby_BigInt']>
  sqrtPriceX96_not?: Maybe<Scalars['v3rinkeby_BigInt']>
  sqrtPriceX96_not_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  tick?: Maybe<Scalars['v3rinkeby_BigInt']>
  tick_gt?: Maybe<Scalars['v3rinkeby_BigInt']>
  tick_gte?: Maybe<Scalars['v3rinkeby_BigInt']>
  tick_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  tick_lt?: Maybe<Scalars['v3rinkeby_BigInt']>
  tick_lte?: Maybe<Scalars['v3rinkeby_BigInt']>
  tick_not?: Maybe<Scalars['v3rinkeby_BigInt']>
  tick_not_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  timestamp?: Maybe<Scalars['v3rinkeby_BigInt']>
  timestamp_gt?: Maybe<Scalars['v3rinkeby_BigInt']>
  timestamp_gte?: Maybe<Scalars['v3rinkeby_BigInt']>
  timestamp_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  timestamp_lt?: Maybe<Scalars['v3rinkeby_BigInt']>
  timestamp_lte?: Maybe<Scalars['v3rinkeby_BigInt']>
  timestamp_not?: Maybe<Scalars['v3rinkeby_BigInt']>
  timestamp_not_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  token0?: Maybe<Scalars['String']>
  token0_contains?: Maybe<Scalars['String']>
  token0_ends_with?: Maybe<Scalars['String']>
  token0_gt?: Maybe<Scalars['String']>
  token0_gte?: Maybe<Scalars['String']>
  token0_in?: Maybe<Array<Scalars['String']>>
  token0_lt?: Maybe<Scalars['String']>
  token0_lte?: Maybe<Scalars['String']>
  token0_not?: Maybe<Scalars['String']>
  token0_not_contains?: Maybe<Scalars['String']>
  token0_not_ends_with?: Maybe<Scalars['String']>
  token0_not_in?: Maybe<Array<Scalars['String']>>
  token0_not_starts_with?: Maybe<Scalars['String']>
  token0_starts_with?: Maybe<Scalars['String']>
  token1?: Maybe<Scalars['String']>
  token1_contains?: Maybe<Scalars['String']>
  token1_ends_with?: Maybe<Scalars['String']>
  token1_gt?: Maybe<Scalars['String']>
  token1_gte?: Maybe<Scalars['String']>
  token1_in?: Maybe<Array<Scalars['String']>>
  token1_lt?: Maybe<Scalars['String']>
  token1_lte?: Maybe<Scalars['String']>
  token1_not?: Maybe<Scalars['String']>
  token1_not_contains?: Maybe<Scalars['String']>
  token1_not_ends_with?: Maybe<Scalars['String']>
  token1_not_in?: Maybe<Array<Scalars['String']>>
  token1_not_starts_with?: Maybe<Scalars['String']>
  token1_starts_with?: Maybe<Scalars['String']>
  transaction?: Maybe<Scalars['String']>
  transaction_contains?: Maybe<Scalars['String']>
  transaction_ends_with?: Maybe<Scalars['String']>
  transaction_gt?: Maybe<Scalars['String']>
  transaction_gte?: Maybe<Scalars['String']>
  transaction_in?: Maybe<Array<Scalars['String']>>
  transaction_lt?: Maybe<Scalars['String']>
  transaction_lte?: Maybe<Scalars['String']>
  transaction_not?: Maybe<Scalars['String']>
  transaction_not_contains?: Maybe<Scalars['String']>
  transaction_not_ends_with?: Maybe<Scalars['String']>
  transaction_not_in?: Maybe<Array<Scalars['String']>>
  transaction_not_starts_with?: Maybe<Scalars['String']>
  transaction_starts_with?: Maybe<Scalars['String']>
}

export enum V3rinkeby_Swap_OrderBy {
  Amount0 = 'amount0',
  Amount1 = 'amount1',
  AmountUsd = 'amountUSD',
  Id = 'id',
  LogIndex = 'logIndex',
  Origin = 'origin',
  Pool = 'pool',
  Recipient = 'recipient',
  Sender = 'sender',
  SqrtPriceX96 = 'sqrtPriceX96',
  Tick = 'tick',
  Timestamp = 'timestamp',
  Token0 = 'token0',
  Token1 = 'token1',
  Transaction = 'transaction',
}

export type V3rinkeby_Tick = {
  __typename?: 'v3rinkeby_Tick'
  collectedFeesToken0: Scalars['v3rinkeby_BigDecimal']
  collectedFeesToken1: Scalars['v3rinkeby_BigDecimal']
  collectedFeesUSD: Scalars['v3rinkeby_BigDecimal']
  createdAtBlockNumber: Scalars['v3rinkeby_BigInt']
  createdAtTimestamp: Scalars['v3rinkeby_BigInt']
  feeGrowthOutside0X128: Scalars['v3rinkeby_BigInt']
  feeGrowthOutside1X128: Scalars['v3rinkeby_BigInt']
  feesUSD: Scalars['v3rinkeby_BigDecimal']
  id: Scalars['ID']
  liquidityGross: Scalars['v3rinkeby_BigInt']
  liquidityNet: Scalars['v3rinkeby_BigInt']
  liquidityProviderCount: Scalars['v3rinkeby_BigInt']
  pool: V3rinkeby_Pool
  poolAddress?: Maybe<Scalars['String']>
  price0: Scalars['v3rinkeby_BigDecimal']
  price1: Scalars['v3rinkeby_BigDecimal']
  tickIdx: Scalars['v3rinkeby_BigInt']
  untrackedVolumeUSD: Scalars['v3rinkeby_BigDecimal']
  volumeToken0: Scalars['v3rinkeby_BigDecimal']
  volumeToken1: Scalars['v3rinkeby_BigDecimal']
  volumeUSD: Scalars['v3rinkeby_BigDecimal']
}

export type V3rinkeby_TickDayData = {
  __typename?: 'v3rinkeby_TickDayData'
  date: Scalars['Int']
  feeGrowthOutside0X128: Scalars['v3rinkeby_BigInt']
  feeGrowthOutside1X128: Scalars['v3rinkeby_BigInt']
  feesUSD: Scalars['v3rinkeby_BigDecimal']
  id: Scalars['ID']
  liquidityGross: Scalars['v3rinkeby_BigInt']
  liquidityNet: Scalars['v3rinkeby_BigInt']
  pool: V3rinkeby_Pool
  tick: V3rinkeby_Tick
  volumeToken0: Scalars['v3rinkeby_BigDecimal']
  volumeToken1: Scalars['v3rinkeby_BigDecimal']
  volumeUSD: Scalars['v3rinkeby_BigDecimal']
}

export type V3rinkeby_TickDayData_Filter = {
  date?: Maybe<Scalars['Int']>
  date_gt?: Maybe<Scalars['Int']>
  date_gte?: Maybe<Scalars['Int']>
  date_in?: Maybe<Array<Scalars['Int']>>
  date_lt?: Maybe<Scalars['Int']>
  date_lte?: Maybe<Scalars['Int']>
  date_not?: Maybe<Scalars['Int']>
  date_not_in?: Maybe<Array<Scalars['Int']>>
  feeGrowthOutside0X128?: Maybe<Scalars['v3rinkeby_BigInt']>
  feeGrowthOutside0X128_gt?: Maybe<Scalars['v3rinkeby_BigInt']>
  feeGrowthOutside0X128_gte?: Maybe<Scalars['v3rinkeby_BigInt']>
  feeGrowthOutside0X128_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  feeGrowthOutside0X128_lt?: Maybe<Scalars['v3rinkeby_BigInt']>
  feeGrowthOutside0X128_lte?: Maybe<Scalars['v3rinkeby_BigInt']>
  feeGrowthOutside0X128_not?: Maybe<Scalars['v3rinkeby_BigInt']>
  feeGrowthOutside0X128_not_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  feeGrowthOutside1X128?: Maybe<Scalars['v3rinkeby_BigInt']>
  feeGrowthOutside1X128_gt?: Maybe<Scalars['v3rinkeby_BigInt']>
  feeGrowthOutside1X128_gte?: Maybe<Scalars['v3rinkeby_BigInt']>
  feeGrowthOutside1X128_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  feeGrowthOutside1X128_lt?: Maybe<Scalars['v3rinkeby_BigInt']>
  feeGrowthOutside1X128_lte?: Maybe<Scalars['v3rinkeby_BigInt']>
  feeGrowthOutside1X128_not?: Maybe<Scalars['v3rinkeby_BigInt']>
  feeGrowthOutside1X128_not_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  feesUSD?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  feesUSD_gt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  feesUSD_gte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  feesUSD_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  feesUSD_lt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  feesUSD_lte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  feesUSD_not?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  feesUSD_not_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  id?: Maybe<Scalars['ID']>
  id_gt?: Maybe<Scalars['ID']>
  id_gte?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  id_lt?: Maybe<Scalars['ID']>
  id_lte?: Maybe<Scalars['ID']>
  id_not?: Maybe<Scalars['ID']>
  id_not_in?: Maybe<Array<Scalars['ID']>>
  liquidityGross?: Maybe<Scalars['v3rinkeby_BigInt']>
  liquidityGross_gt?: Maybe<Scalars['v3rinkeby_BigInt']>
  liquidityGross_gte?: Maybe<Scalars['v3rinkeby_BigInt']>
  liquidityGross_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  liquidityGross_lt?: Maybe<Scalars['v3rinkeby_BigInt']>
  liquidityGross_lte?: Maybe<Scalars['v3rinkeby_BigInt']>
  liquidityGross_not?: Maybe<Scalars['v3rinkeby_BigInt']>
  liquidityGross_not_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  liquidityNet?: Maybe<Scalars['v3rinkeby_BigInt']>
  liquidityNet_gt?: Maybe<Scalars['v3rinkeby_BigInt']>
  liquidityNet_gte?: Maybe<Scalars['v3rinkeby_BigInt']>
  liquidityNet_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  liquidityNet_lt?: Maybe<Scalars['v3rinkeby_BigInt']>
  liquidityNet_lte?: Maybe<Scalars['v3rinkeby_BigInt']>
  liquidityNet_not?: Maybe<Scalars['v3rinkeby_BigInt']>
  liquidityNet_not_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  pool?: Maybe<Scalars['String']>
  pool_contains?: Maybe<Scalars['String']>
  pool_ends_with?: Maybe<Scalars['String']>
  pool_gt?: Maybe<Scalars['String']>
  pool_gte?: Maybe<Scalars['String']>
  pool_in?: Maybe<Array<Scalars['String']>>
  pool_lt?: Maybe<Scalars['String']>
  pool_lte?: Maybe<Scalars['String']>
  pool_not?: Maybe<Scalars['String']>
  pool_not_contains?: Maybe<Scalars['String']>
  pool_not_ends_with?: Maybe<Scalars['String']>
  pool_not_in?: Maybe<Array<Scalars['String']>>
  pool_not_starts_with?: Maybe<Scalars['String']>
  pool_starts_with?: Maybe<Scalars['String']>
  tick?: Maybe<Scalars['String']>
  tick_contains?: Maybe<Scalars['String']>
  tick_ends_with?: Maybe<Scalars['String']>
  tick_gt?: Maybe<Scalars['String']>
  tick_gte?: Maybe<Scalars['String']>
  tick_in?: Maybe<Array<Scalars['String']>>
  tick_lt?: Maybe<Scalars['String']>
  tick_lte?: Maybe<Scalars['String']>
  tick_not?: Maybe<Scalars['String']>
  tick_not_contains?: Maybe<Scalars['String']>
  tick_not_ends_with?: Maybe<Scalars['String']>
  tick_not_in?: Maybe<Array<Scalars['String']>>
  tick_not_starts_with?: Maybe<Scalars['String']>
  tick_starts_with?: Maybe<Scalars['String']>
  volumeToken0?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeToken0_gt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeToken0_gte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeToken0_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  volumeToken0_lt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeToken0_lte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeToken0_not?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeToken0_not_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  volumeToken1?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeToken1_gt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeToken1_gte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeToken1_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  volumeToken1_lt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeToken1_lte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeToken1_not?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeToken1_not_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  volumeUSD?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeUSD_gt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeUSD_gte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeUSD_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  volumeUSD_lt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeUSD_lte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeUSD_not?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeUSD_not_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
}

export enum V3rinkeby_TickDayData_OrderBy {
  Date = 'date',
  FeeGrowthOutside0X128 = 'feeGrowthOutside0X128',
  FeeGrowthOutside1X128 = 'feeGrowthOutside1X128',
  FeesUsd = 'feesUSD',
  Id = 'id',
  LiquidityGross = 'liquidityGross',
  LiquidityNet = 'liquidityNet',
  Pool = 'pool',
  Tick = 'tick',
  VolumeToken0 = 'volumeToken0',
  VolumeToken1 = 'volumeToken1',
  VolumeUsd = 'volumeUSD',
}

export type V3rinkeby_TickHourData = {
  __typename?: 'v3rinkeby_TickHourData'
  feesUSD: Scalars['v3rinkeby_BigDecimal']
  id: Scalars['ID']
  liquidityGross: Scalars['v3rinkeby_BigInt']
  liquidityNet: Scalars['v3rinkeby_BigInt']
  periodStartUnix: Scalars['Int']
  pool: V3rinkeby_Pool
  tick: V3rinkeby_Tick
  volumeToken0: Scalars['v3rinkeby_BigDecimal']
  volumeToken1: Scalars['v3rinkeby_BigDecimal']
  volumeUSD: Scalars['v3rinkeby_BigDecimal']
}

export type V3rinkeby_TickHourData_Filter = {
  feesUSD?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  feesUSD_gt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  feesUSD_gte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  feesUSD_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  feesUSD_lt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  feesUSD_lte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  feesUSD_not?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  feesUSD_not_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  id?: Maybe<Scalars['ID']>
  id_gt?: Maybe<Scalars['ID']>
  id_gte?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  id_lt?: Maybe<Scalars['ID']>
  id_lte?: Maybe<Scalars['ID']>
  id_not?: Maybe<Scalars['ID']>
  id_not_in?: Maybe<Array<Scalars['ID']>>
  liquidityGross?: Maybe<Scalars['v3rinkeby_BigInt']>
  liquidityGross_gt?: Maybe<Scalars['v3rinkeby_BigInt']>
  liquidityGross_gte?: Maybe<Scalars['v3rinkeby_BigInt']>
  liquidityGross_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  liquidityGross_lt?: Maybe<Scalars['v3rinkeby_BigInt']>
  liquidityGross_lte?: Maybe<Scalars['v3rinkeby_BigInt']>
  liquidityGross_not?: Maybe<Scalars['v3rinkeby_BigInt']>
  liquidityGross_not_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  liquidityNet?: Maybe<Scalars['v3rinkeby_BigInt']>
  liquidityNet_gt?: Maybe<Scalars['v3rinkeby_BigInt']>
  liquidityNet_gte?: Maybe<Scalars['v3rinkeby_BigInt']>
  liquidityNet_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  liquidityNet_lt?: Maybe<Scalars['v3rinkeby_BigInt']>
  liquidityNet_lte?: Maybe<Scalars['v3rinkeby_BigInt']>
  liquidityNet_not?: Maybe<Scalars['v3rinkeby_BigInt']>
  liquidityNet_not_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  periodStartUnix?: Maybe<Scalars['Int']>
  periodStartUnix_gt?: Maybe<Scalars['Int']>
  periodStartUnix_gte?: Maybe<Scalars['Int']>
  periodStartUnix_in?: Maybe<Array<Scalars['Int']>>
  periodStartUnix_lt?: Maybe<Scalars['Int']>
  periodStartUnix_lte?: Maybe<Scalars['Int']>
  periodStartUnix_not?: Maybe<Scalars['Int']>
  periodStartUnix_not_in?: Maybe<Array<Scalars['Int']>>
  pool?: Maybe<Scalars['String']>
  pool_contains?: Maybe<Scalars['String']>
  pool_ends_with?: Maybe<Scalars['String']>
  pool_gt?: Maybe<Scalars['String']>
  pool_gte?: Maybe<Scalars['String']>
  pool_in?: Maybe<Array<Scalars['String']>>
  pool_lt?: Maybe<Scalars['String']>
  pool_lte?: Maybe<Scalars['String']>
  pool_not?: Maybe<Scalars['String']>
  pool_not_contains?: Maybe<Scalars['String']>
  pool_not_ends_with?: Maybe<Scalars['String']>
  pool_not_in?: Maybe<Array<Scalars['String']>>
  pool_not_starts_with?: Maybe<Scalars['String']>
  pool_starts_with?: Maybe<Scalars['String']>
  tick?: Maybe<Scalars['String']>
  tick_contains?: Maybe<Scalars['String']>
  tick_ends_with?: Maybe<Scalars['String']>
  tick_gt?: Maybe<Scalars['String']>
  tick_gte?: Maybe<Scalars['String']>
  tick_in?: Maybe<Array<Scalars['String']>>
  tick_lt?: Maybe<Scalars['String']>
  tick_lte?: Maybe<Scalars['String']>
  tick_not?: Maybe<Scalars['String']>
  tick_not_contains?: Maybe<Scalars['String']>
  tick_not_ends_with?: Maybe<Scalars['String']>
  tick_not_in?: Maybe<Array<Scalars['String']>>
  tick_not_starts_with?: Maybe<Scalars['String']>
  tick_starts_with?: Maybe<Scalars['String']>
  volumeToken0?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeToken0_gt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeToken0_gte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeToken0_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  volumeToken0_lt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeToken0_lte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeToken0_not?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeToken0_not_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  volumeToken1?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeToken1_gt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeToken1_gte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeToken1_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  volumeToken1_lt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeToken1_lte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeToken1_not?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeToken1_not_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  volumeUSD?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeUSD_gt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeUSD_gte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeUSD_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  volumeUSD_lt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeUSD_lte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeUSD_not?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeUSD_not_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
}

export enum V3rinkeby_TickHourData_OrderBy {
  FeesUsd = 'feesUSD',
  Id = 'id',
  LiquidityGross = 'liquidityGross',
  LiquidityNet = 'liquidityNet',
  PeriodStartUnix = 'periodStartUnix',
  Pool = 'pool',
  Tick = 'tick',
  VolumeToken0 = 'volumeToken0',
  VolumeToken1 = 'volumeToken1',
  VolumeUsd = 'volumeUSD',
}

export type V3rinkeby_Tick_Filter = {
  collectedFeesToken0?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  collectedFeesToken0_gt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  collectedFeesToken0_gte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  collectedFeesToken0_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  collectedFeesToken0_lt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  collectedFeesToken0_lte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  collectedFeesToken0_not?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  collectedFeesToken0_not_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  collectedFeesToken1?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  collectedFeesToken1_gt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  collectedFeesToken1_gte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  collectedFeesToken1_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  collectedFeesToken1_lt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  collectedFeesToken1_lte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  collectedFeesToken1_not?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  collectedFeesToken1_not_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  collectedFeesUSD?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  collectedFeesUSD_gt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  collectedFeesUSD_gte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  collectedFeesUSD_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  collectedFeesUSD_lt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  collectedFeesUSD_lte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  collectedFeesUSD_not?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  collectedFeesUSD_not_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  createdAtBlockNumber?: Maybe<Scalars['v3rinkeby_BigInt']>
  createdAtBlockNumber_gt?: Maybe<Scalars['v3rinkeby_BigInt']>
  createdAtBlockNumber_gte?: Maybe<Scalars['v3rinkeby_BigInt']>
  createdAtBlockNumber_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  createdAtBlockNumber_lt?: Maybe<Scalars['v3rinkeby_BigInt']>
  createdAtBlockNumber_lte?: Maybe<Scalars['v3rinkeby_BigInt']>
  createdAtBlockNumber_not?: Maybe<Scalars['v3rinkeby_BigInt']>
  createdAtBlockNumber_not_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  createdAtTimestamp?: Maybe<Scalars['v3rinkeby_BigInt']>
  createdAtTimestamp_gt?: Maybe<Scalars['v3rinkeby_BigInt']>
  createdAtTimestamp_gte?: Maybe<Scalars['v3rinkeby_BigInt']>
  createdAtTimestamp_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  createdAtTimestamp_lt?: Maybe<Scalars['v3rinkeby_BigInt']>
  createdAtTimestamp_lte?: Maybe<Scalars['v3rinkeby_BigInt']>
  createdAtTimestamp_not?: Maybe<Scalars['v3rinkeby_BigInt']>
  createdAtTimestamp_not_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  feeGrowthOutside0X128?: Maybe<Scalars['v3rinkeby_BigInt']>
  feeGrowthOutside0X128_gt?: Maybe<Scalars['v3rinkeby_BigInt']>
  feeGrowthOutside0X128_gte?: Maybe<Scalars['v3rinkeby_BigInt']>
  feeGrowthOutside0X128_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  feeGrowthOutside0X128_lt?: Maybe<Scalars['v3rinkeby_BigInt']>
  feeGrowthOutside0X128_lte?: Maybe<Scalars['v3rinkeby_BigInt']>
  feeGrowthOutside0X128_not?: Maybe<Scalars['v3rinkeby_BigInt']>
  feeGrowthOutside0X128_not_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  feeGrowthOutside1X128?: Maybe<Scalars['v3rinkeby_BigInt']>
  feeGrowthOutside1X128_gt?: Maybe<Scalars['v3rinkeby_BigInt']>
  feeGrowthOutside1X128_gte?: Maybe<Scalars['v3rinkeby_BigInt']>
  feeGrowthOutside1X128_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  feeGrowthOutside1X128_lt?: Maybe<Scalars['v3rinkeby_BigInt']>
  feeGrowthOutside1X128_lte?: Maybe<Scalars['v3rinkeby_BigInt']>
  feeGrowthOutside1X128_not?: Maybe<Scalars['v3rinkeby_BigInt']>
  feeGrowthOutside1X128_not_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  feesUSD?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  feesUSD_gt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  feesUSD_gte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  feesUSD_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  feesUSD_lt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  feesUSD_lte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  feesUSD_not?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  feesUSD_not_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  id?: Maybe<Scalars['ID']>
  id_gt?: Maybe<Scalars['ID']>
  id_gte?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  id_lt?: Maybe<Scalars['ID']>
  id_lte?: Maybe<Scalars['ID']>
  id_not?: Maybe<Scalars['ID']>
  id_not_in?: Maybe<Array<Scalars['ID']>>
  liquidityGross?: Maybe<Scalars['v3rinkeby_BigInt']>
  liquidityGross_gt?: Maybe<Scalars['v3rinkeby_BigInt']>
  liquidityGross_gte?: Maybe<Scalars['v3rinkeby_BigInt']>
  liquidityGross_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  liquidityGross_lt?: Maybe<Scalars['v3rinkeby_BigInt']>
  liquidityGross_lte?: Maybe<Scalars['v3rinkeby_BigInt']>
  liquidityGross_not?: Maybe<Scalars['v3rinkeby_BigInt']>
  liquidityGross_not_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  liquidityNet?: Maybe<Scalars['v3rinkeby_BigInt']>
  liquidityNet_gt?: Maybe<Scalars['v3rinkeby_BigInt']>
  liquidityNet_gte?: Maybe<Scalars['v3rinkeby_BigInt']>
  liquidityNet_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  liquidityNet_lt?: Maybe<Scalars['v3rinkeby_BigInt']>
  liquidityNet_lte?: Maybe<Scalars['v3rinkeby_BigInt']>
  liquidityNet_not?: Maybe<Scalars['v3rinkeby_BigInt']>
  liquidityNet_not_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  liquidityProviderCount?: Maybe<Scalars['v3rinkeby_BigInt']>
  liquidityProviderCount_gt?: Maybe<Scalars['v3rinkeby_BigInt']>
  liquidityProviderCount_gte?: Maybe<Scalars['v3rinkeby_BigInt']>
  liquidityProviderCount_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  liquidityProviderCount_lt?: Maybe<Scalars['v3rinkeby_BigInt']>
  liquidityProviderCount_lte?: Maybe<Scalars['v3rinkeby_BigInt']>
  liquidityProviderCount_not?: Maybe<Scalars['v3rinkeby_BigInt']>
  liquidityProviderCount_not_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  pool?: Maybe<Scalars['String']>
  poolAddress?: Maybe<Scalars['String']>
  poolAddress_contains?: Maybe<Scalars['String']>
  poolAddress_ends_with?: Maybe<Scalars['String']>
  poolAddress_gt?: Maybe<Scalars['String']>
  poolAddress_gte?: Maybe<Scalars['String']>
  poolAddress_in?: Maybe<Array<Scalars['String']>>
  poolAddress_lt?: Maybe<Scalars['String']>
  poolAddress_lte?: Maybe<Scalars['String']>
  poolAddress_not?: Maybe<Scalars['String']>
  poolAddress_not_contains?: Maybe<Scalars['String']>
  poolAddress_not_ends_with?: Maybe<Scalars['String']>
  poolAddress_not_in?: Maybe<Array<Scalars['String']>>
  poolAddress_not_starts_with?: Maybe<Scalars['String']>
  poolAddress_starts_with?: Maybe<Scalars['String']>
  pool_contains?: Maybe<Scalars['String']>
  pool_ends_with?: Maybe<Scalars['String']>
  pool_gt?: Maybe<Scalars['String']>
  pool_gte?: Maybe<Scalars['String']>
  pool_in?: Maybe<Array<Scalars['String']>>
  pool_lt?: Maybe<Scalars['String']>
  pool_lte?: Maybe<Scalars['String']>
  pool_not?: Maybe<Scalars['String']>
  pool_not_contains?: Maybe<Scalars['String']>
  pool_not_ends_with?: Maybe<Scalars['String']>
  pool_not_in?: Maybe<Array<Scalars['String']>>
  pool_not_starts_with?: Maybe<Scalars['String']>
  pool_starts_with?: Maybe<Scalars['String']>
  price0?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  price0_gt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  price0_gte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  price0_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  price0_lt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  price0_lte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  price0_not?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  price0_not_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  price1?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  price1_gt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  price1_gte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  price1_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  price1_lt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  price1_lte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  price1_not?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  price1_not_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  tickIdx?: Maybe<Scalars['v3rinkeby_BigInt']>
  tickIdx_gt?: Maybe<Scalars['v3rinkeby_BigInt']>
  tickIdx_gte?: Maybe<Scalars['v3rinkeby_BigInt']>
  tickIdx_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  tickIdx_lt?: Maybe<Scalars['v3rinkeby_BigInt']>
  tickIdx_lte?: Maybe<Scalars['v3rinkeby_BigInt']>
  tickIdx_not?: Maybe<Scalars['v3rinkeby_BigInt']>
  tickIdx_not_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  untrackedVolumeUSD?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  untrackedVolumeUSD_gt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  untrackedVolumeUSD_gte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  untrackedVolumeUSD_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  untrackedVolumeUSD_lt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  untrackedVolumeUSD_lte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  untrackedVolumeUSD_not?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  untrackedVolumeUSD_not_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  volumeToken0?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeToken0_gt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeToken0_gte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeToken0_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  volumeToken0_lt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeToken0_lte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeToken0_not?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeToken0_not_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  volumeToken1?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeToken1_gt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeToken1_gte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeToken1_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  volumeToken1_lt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeToken1_lte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeToken1_not?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeToken1_not_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  volumeUSD?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeUSD_gt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeUSD_gte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeUSD_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  volumeUSD_lt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeUSD_lte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeUSD_not?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeUSD_not_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
}

export enum V3rinkeby_Tick_OrderBy {
  CollectedFeesToken0 = 'collectedFeesToken0',
  CollectedFeesToken1 = 'collectedFeesToken1',
  CollectedFeesUsd = 'collectedFeesUSD',
  CreatedAtBlockNumber = 'createdAtBlockNumber',
  CreatedAtTimestamp = 'createdAtTimestamp',
  FeeGrowthOutside0X128 = 'feeGrowthOutside0X128',
  FeeGrowthOutside1X128 = 'feeGrowthOutside1X128',
  FeesUsd = 'feesUSD',
  Id = 'id',
  LiquidityGross = 'liquidityGross',
  LiquidityNet = 'liquidityNet',
  LiquidityProviderCount = 'liquidityProviderCount',
  Pool = 'pool',
  PoolAddress = 'poolAddress',
  Price0 = 'price0',
  Price1 = 'price1',
  TickIdx = 'tickIdx',
  UntrackedVolumeUsd = 'untrackedVolumeUSD',
  VolumeToken0 = 'volumeToken0',
  VolumeToken1 = 'volumeToken1',
  VolumeUsd = 'volumeUSD',
}

export type V3rinkeby_Token = {
  __typename?: 'v3rinkeby_Token'
  decimals: Scalars['v3rinkeby_BigInt']
  derivedETH: Scalars['v3rinkeby_BigDecimal']
  feesUSD: Scalars['v3rinkeby_BigDecimal']
  id: Scalars['ID']
  name: Scalars['String']
  poolCount: Scalars['v3rinkeby_BigInt']
  symbol: Scalars['String']
  tokenDayData: Array<V3rinkeby_TokenDayData>
  totalSupply: Scalars['v3rinkeby_BigInt']
  totalValueLocked: Scalars['v3rinkeby_BigDecimal']
  totalValueLockedUSD: Scalars['v3rinkeby_BigDecimal']
  totalValueLockedUSDUntracked: Scalars['v3rinkeby_BigDecimal']
  txCount: Scalars['v3rinkeby_BigInt']
  untrackedVolumeUSD: Scalars['v3rinkeby_BigDecimal']
  volume: Scalars['v3rinkeby_BigDecimal']
  volumeUSD: Scalars['v3rinkeby_BigDecimal']
  whitelistPools: Array<V3rinkeby_Pool>
}

export type V3rinkeby_TokenTokenDayDataArgs = {
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3rinkeby_TokenDayData_OrderBy>
  orderDirection?: Maybe<V3rinkeby_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  where?: Maybe<V3rinkeby_TokenDayData_Filter>
}

export type V3rinkeby_TokenWhitelistPoolsArgs = {
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3rinkeby_Pool_OrderBy>
  orderDirection?: Maybe<V3rinkeby_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  where?: Maybe<V3rinkeby_Pool_Filter>
}

export type V3rinkeby_TokenDayData = {
  __typename?: 'v3rinkeby_TokenDayData'
  close: Scalars['v3rinkeby_BigDecimal']
  date: Scalars['Int']
  feesUSD: Scalars['v3rinkeby_BigDecimal']
  high: Scalars['v3rinkeby_BigDecimal']
  id: Scalars['ID']
  low: Scalars['v3rinkeby_BigDecimal']
  open: Scalars['v3rinkeby_BigDecimal']
  priceUSD: Scalars['v3rinkeby_BigDecimal']
  token: V3rinkeby_Token
  totalValueLocked: Scalars['v3rinkeby_BigDecimal']
  totalValueLockedUSD: Scalars['v3rinkeby_BigDecimal']
  untrackedVolumeUSD: Scalars['v3rinkeby_BigDecimal']
  volume: Scalars['v3rinkeby_BigDecimal']
  volumeUSD: Scalars['v3rinkeby_BigDecimal']
}

export type V3rinkeby_TokenDayData_Filter = {
  close?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  close_gt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  close_gte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  close_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  close_lt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  close_lte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  close_not?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  close_not_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  date?: Maybe<Scalars['Int']>
  date_gt?: Maybe<Scalars['Int']>
  date_gte?: Maybe<Scalars['Int']>
  date_in?: Maybe<Array<Scalars['Int']>>
  date_lt?: Maybe<Scalars['Int']>
  date_lte?: Maybe<Scalars['Int']>
  date_not?: Maybe<Scalars['Int']>
  date_not_in?: Maybe<Array<Scalars['Int']>>
  feesUSD?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  feesUSD_gt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  feesUSD_gte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  feesUSD_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  feesUSD_lt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  feesUSD_lte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  feesUSD_not?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  feesUSD_not_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  high?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  high_gt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  high_gte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  high_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  high_lt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  high_lte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  high_not?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  high_not_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  id?: Maybe<Scalars['ID']>
  id_gt?: Maybe<Scalars['ID']>
  id_gte?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  id_lt?: Maybe<Scalars['ID']>
  id_lte?: Maybe<Scalars['ID']>
  id_not?: Maybe<Scalars['ID']>
  id_not_in?: Maybe<Array<Scalars['ID']>>
  low?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  low_gt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  low_gte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  low_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  low_lt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  low_lte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  low_not?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  low_not_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  open?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  open_gt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  open_gte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  open_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  open_lt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  open_lte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  open_not?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  open_not_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  priceUSD?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  priceUSD_gt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  priceUSD_gte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  priceUSD_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  priceUSD_lt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  priceUSD_lte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  priceUSD_not?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  priceUSD_not_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  token?: Maybe<Scalars['String']>
  token_contains?: Maybe<Scalars['String']>
  token_ends_with?: Maybe<Scalars['String']>
  token_gt?: Maybe<Scalars['String']>
  token_gte?: Maybe<Scalars['String']>
  token_in?: Maybe<Array<Scalars['String']>>
  token_lt?: Maybe<Scalars['String']>
  token_lte?: Maybe<Scalars['String']>
  token_not?: Maybe<Scalars['String']>
  token_not_contains?: Maybe<Scalars['String']>
  token_not_ends_with?: Maybe<Scalars['String']>
  token_not_in?: Maybe<Array<Scalars['String']>>
  token_not_starts_with?: Maybe<Scalars['String']>
  token_starts_with?: Maybe<Scalars['String']>
  totalValueLocked?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  totalValueLockedUSD?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  totalValueLockedUSD_gt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  totalValueLockedUSD_gte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  totalValueLockedUSD_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  totalValueLockedUSD_lt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  totalValueLockedUSD_lte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  totalValueLockedUSD_not?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  totalValueLockedUSD_not_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  totalValueLocked_gt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  totalValueLocked_gte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  totalValueLocked_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  totalValueLocked_lt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  totalValueLocked_lte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  totalValueLocked_not?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  totalValueLocked_not_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  untrackedVolumeUSD?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  untrackedVolumeUSD_gt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  untrackedVolumeUSD_gte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  untrackedVolumeUSD_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  untrackedVolumeUSD_lt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  untrackedVolumeUSD_lte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  untrackedVolumeUSD_not?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  untrackedVolumeUSD_not_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  volume?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeUSD?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeUSD_gt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeUSD_gte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeUSD_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  volumeUSD_lt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeUSD_lte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeUSD_not?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeUSD_not_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  volume_gt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volume_gte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volume_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  volume_lt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volume_lte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volume_not?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volume_not_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
}

export enum V3rinkeby_TokenDayData_OrderBy {
  Close = 'close',
  Date = 'date',
  FeesUsd = 'feesUSD',
  High = 'high',
  Id = 'id',
  Low = 'low',
  Open = 'open',
  PriceUsd = 'priceUSD',
  Token = 'token',
  TotalValueLocked = 'totalValueLocked',
  TotalValueLockedUsd = 'totalValueLockedUSD',
  UntrackedVolumeUsd = 'untrackedVolumeUSD',
  Volume = 'volume',
  VolumeUsd = 'volumeUSD',
}

export type V3rinkeby_TokenHourData = {
  __typename?: 'v3rinkeby_TokenHourData'
  close: Scalars['v3rinkeby_BigDecimal']
  feesUSD: Scalars['v3rinkeby_BigDecimal']
  high: Scalars['v3rinkeby_BigDecimal']
  id: Scalars['ID']
  low: Scalars['v3rinkeby_BigDecimal']
  open: Scalars['v3rinkeby_BigDecimal']
  periodStartUnix: Scalars['Int']
  priceUSD: Scalars['v3rinkeby_BigDecimal']
  token: V3rinkeby_Token
  totalValueLocked: Scalars['v3rinkeby_BigDecimal']
  totalValueLockedUSD: Scalars['v3rinkeby_BigDecimal']
  untrackedVolumeUSD: Scalars['v3rinkeby_BigDecimal']
  volume: Scalars['v3rinkeby_BigDecimal']
  volumeUSD: Scalars['v3rinkeby_BigDecimal']
}

export type V3rinkeby_TokenHourData_Filter = {
  close?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  close_gt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  close_gte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  close_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  close_lt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  close_lte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  close_not?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  close_not_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  feesUSD?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  feesUSD_gt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  feesUSD_gte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  feesUSD_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  feesUSD_lt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  feesUSD_lte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  feesUSD_not?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  feesUSD_not_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  high?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  high_gt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  high_gte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  high_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  high_lt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  high_lte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  high_not?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  high_not_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  id?: Maybe<Scalars['ID']>
  id_gt?: Maybe<Scalars['ID']>
  id_gte?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  id_lt?: Maybe<Scalars['ID']>
  id_lte?: Maybe<Scalars['ID']>
  id_not?: Maybe<Scalars['ID']>
  id_not_in?: Maybe<Array<Scalars['ID']>>
  low?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  low_gt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  low_gte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  low_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  low_lt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  low_lte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  low_not?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  low_not_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  open?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  open_gt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  open_gte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  open_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  open_lt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  open_lte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  open_not?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  open_not_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  periodStartUnix?: Maybe<Scalars['Int']>
  periodStartUnix_gt?: Maybe<Scalars['Int']>
  periodStartUnix_gte?: Maybe<Scalars['Int']>
  periodStartUnix_in?: Maybe<Array<Scalars['Int']>>
  periodStartUnix_lt?: Maybe<Scalars['Int']>
  periodStartUnix_lte?: Maybe<Scalars['Int']>
  periodStartUnix_not?: Maybe<Scalars['Int']>
  periodStartUnix_not_in?: Maybe<Array<Scalars['Int']>>
  priceUSD?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  priceUSD_gt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  priceUSD_gte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  priceUSD_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  priceUSD_lt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  priceUSD_lte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  priceUSD_not?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  priceUSD_not_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  token?: Maybe<Scalars['String']>
  token_contains?: Maybe<Scalars['String']>
  token_ends_with?: Maybe<Scalars['String']>
  token_gt?: Maybe<Scalars['String']>
  token_gte?: Maybe<Scalars['String']>
  token_in?: Maybe<Array<Scalars['String']>>
  token_lt?: Maybe<Scalars['String']>
  token_lte?: Maybe<Scalars['String']>
  token_not?: Maybe<Scalars['String']>
  token_not_contains?: Maybe<Scalars['String']>
  token_not_ends_with?: Maybe<Scalars['String']>
  token_not_in?: Maybe<Array<Scalars['String']>>
  token_not_starts_with?: Maybe<Scalars['String']>
  token_starts_with?: Maybe<Scalars['String']>
  totalValueLocked?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  totalValueLockedUSD?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  totalValueLockedUSD_gt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  totalValueLockedUSD_gte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  totalValueLockedUSD_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  totalValueLockedUSD_lt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  totalValueLockedUSD_lte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  totalValueLockedUSD_not?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  totalValueLockedUSD_not_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  totalValueLocked_gt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  totalValueLocked_gte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  totalValueLocked_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  totalValueLocked_lt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  totalValueLocked_lte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  totalValueLocked_not?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  totalValueLocked_not_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  untrackedVolumeUSD?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  untrackedVolumeUSD_gt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  untrackedVolumeUSD_gte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  untrackedVolumeUSD_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  untrackedVolumeUSD_lt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  untrackedVolumeUSD_lte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  untrackedVolumeUSD_not?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  untrackedVolumeUSD_not_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  volume?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeUSD?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeUSD_gt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeUSD_gte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeUSD_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  volumeUSD_lt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeUSD_lte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeUSD_not?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeUSD_not_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  volume_gt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volume_gte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volume_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  volume_lt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volume_lte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volume_not?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volume_not_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
}

export enum V3rinkeby_TokenHourData_OrderBy {
  Close = 'close',
  FeesUsd = 'feesUSD',
  High = 'high',
  Id = 'id',
  Low = 'low',
  Open = 'open',
  PeriodStartUnix = 'periodStartUnix',
  PriceUsd = 'priceUSD',
  Token = 'token',
  TotalValueLocked = 'totalValueLocked',
  TotalValueLockedUsd = 'totalValueLockedUSD',
  UntrackedVolumeUsd = 'untrackedVolumeUSD',
  Volume = 'volume',
  VolumeUsd = 'volumeUSD',
}

export type V3rinkeby_Token_Filter = {
  decimals?: Maybe<Scalars['v3rinkeby_BigInt']>
  decimals_gt?: Maybe<Scalars['v3rinkeby_BigInt']>
  decimals_gte?: Maybe<Scalars['v3rinkeby_BigInt']>
  decimals_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  decimals_lt?: Maybe<Scalars['v3rinkeby_BigInt']>
  decimals_lte?: Maybe<Scalars['v3rinkeby_BigInt']>
  decimals_not?: Maybe<Scalars['v3rinkeby_BigInt']>
  decimals_not_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  derivedETH?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  derivedETH_gt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  derivedETH_gte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  derivedETH_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  derivedETH_lt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  derivedETH_lte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  derivedETH_not?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  derivedETH_not_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  feesUSD?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  feesUSD_gt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  feesUSD_gte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  feesUSD_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  feesUSD_lt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  feesUSD_lte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  feesUSD_not?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  feesUSD_not_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  id?: Maybe<Scalars['ID']>
  id_gt?: Maybe<Scalars['ID']>
  id_gte?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  id_lt?: Maybe<Scalars['ID']>
  id_lte?: Maybe<Scalars['ID']>
  id_not?: Maybe<Scalars['ID']>
  id_not_in?: Maybe<Array<Scalars['ID']>>
  name?: Maybe<Scalars['String']>
  name_contains?: Maybe<Scalars['String']>
  name_ends_with?: Maybe<Scalars['String']>
  name_gt?: Maybe<Scalars['String']>
  name_gte?: Maybe<Scalars['String']>
  name_in?: Maybe<Array<Scalars['String']>>
  name_lt?: Maybe<Scalars['String']>
  name_lte?: Maybe<Scalars['String']>
  name_not?: Maybe<Scalars['String']>
  name_not_contains?: Maybe<Scalars['String']>
  name_not_ends_with?: Maybe<Scalars['String']>
  name_not_in?: Maybe<Array<Scalars['String']>>
  name_not_starts_with?: Maybe<Scalars['String']>
  name_starts_with?: Maybe<Scalars['String']>
  poolCount?: Maybe<Scalars['v3rinkeby_BigInt']>
  poolCount_gt?: Maybe<Scalars['v3rinkeby_BigInt']>
  poolCount_gte?: Maybe<Scalars['v3rinkeby_BigInt']>
  poolCount_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  poolCount_lt?: Maybe<Scalars['v3rinkeby_BigInt']>
  poolCount_lte?: Maybe<Scalars['v3rinkeby_BigInt']>
  poolCount_not?: Maybe<Scalars['v3rinkeby_BigInt']>
  poolCount_not_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  symbol?: Maybe<Scalars['String']>
  symbol_contains?: Maybe<Scalars['String']>
  symbol_ends_with?: Maybe<Scalars['String']>
  symbol_gt?: Maybe<Scalars['String']>
  symbol_gte?: Maybe<Scalars['String']>
  symbol_in?: Maybe<Array<Scalars['String']>>
  symbol_lt?: Maybe<Scalars['String']>
  symbol_lte?: Maybe<Scalars['String']>
  symbol_not?: Maybe<Scalars['String']>
  symbol_not_contains?: Maybe<Scalars['String']>
  symbol_not_ends_with?: Maybe<Scalars['String']>
  symbol_not_in?: Maybe<Array<Scalars['String']>>
  symbol_not_starts_with?: Maybe<Scalars['String']>
  symbol_starts_with?: Maybe<Scalars['String']>
  totalSupply?: Maybe<Scalars['v3rinkeby_BigInt']>
  totalSupply_gt?: Maybe<Scalars['v3rinkeby_BigInt']>
  totalSupply_gte?: Maybe<Scalars['v3rinkeby_BigInt']>
  totalSupply_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  totalSupply_lt?: Maybe<Scalars['v3rinkeby_BigInt']>
  totalSupply_lte?: Maybe<Scalars['v3rinkeby_BigInt']>
  totalSupply_not?: Maybe<Scalars['v3rinkeby_BigInt']>
  totalSupply_not_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  totalValueLocked?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  totalValueLockedUSD?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  totalValueLockedUSDUntracked?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  totalValueLockedUSDUntracked_gt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  totalValueLockedUSDUntracked_gte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  totalValueLockedUSDUntracked_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  totalValueLockedUSDUntracked_lt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  totalValueLockedUSDUntracked_lte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  totalValueLockedUSDUntracked_not?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  totalValueLockedUSDUntracked_not_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  totalValueLockedUSD_gt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  totalValueLockedUSD_gte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  totalValueLockedUSD_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  totalValueLockedUSD_lt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  totalValueLockedUSD_lte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  totalValueLockedUSD_not?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  totalValueLockedUSD_not_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  totalValueLocked_gt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  totalValueLocked_gte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  totalValueLocked_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  totalValueLocked_lt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  totalValueLocked_lte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  totalValueLocked_not?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  totalValueLocked_not_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  txCount?: Maybe<Scalars['v3rinkeby_BigInt']>
  txCount_gt?: Maybe<Scalars['v3rinkeby_BigInt']>
  txCount_gte?: Maybe<Scalars['v3rinkeby_BigInt']>
  txCount_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  txCount_lt?: Maybe<Scalars['v3rinkeby_BigInt']>
  txCount_lte?: Maybe<Scalars['v3rinkeby_BigInt']>
  txCount_not?: Maybe<Scalars['v3rinkeby_BigInt']>
  txCount_not_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  untrackedVolumeUSD?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  untrackedVolumeUSD_gt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  untrackedVolumeUSD_gte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  untrackedVolumeUSD_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  untrackedVolumeUSD_lt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  untrackedVolumeUSD_lte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  untrackedVolumeUSD_not?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  untrackedVolumeUSD_not_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  volume?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeUSD?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeUSD_gt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeUSD_gte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeUSD_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  volumeUSD_lt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeUSD_lte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeUSD_not?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeUSD_not_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  volume_gt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volume_gte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volume_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  volume_lt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volume_lte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volume_not?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volume_not_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  whitelistPools?: Maybe<Array<Scalars['String']>>
  whitelistPools_contains?: Maybe<Array<Scalars['String']>>
  whitelistPools_not?: Maybe<Array<Scalars['String']>>
  whitelistPools_not_contains?: Maybe<Array<Scalars['String']>>
}

export enum V3rinkeby_Token_OrderBy {
  Decimals = 'decimals',
  DerivedEth = 'derivedETH',
  FeesUsd = 'feesUSD',
  Id = 'id',
  Name = 'name',
  PoolCount = 'poolCount',
  Symbol = 'symbol',
  TokenDayData = 'tokenDayData',
  TotalSupply = 'totalSupply',
  TotalValueLocked = 'totalValueLocked',
  TotalValueLockedUsd = 'totalValueLockedUSD',
  TotalValueLockedUsdUntracked = 'totalValueLockedUSDUntracked',
  TxCount = 'txCount',
  UntrackedVolumeUsd = 'untrackedVolumeUSD',
  Volume = 'volume',
  VolumeUsd = 'volumeUSD',
  WhitelistPools = 'whitelistPools',
}

export type V3rinkeby_Transaction = {
  __typename?: 'v3rinkeby_Transaction'
  blockNumber: Scalars['v3rinkeby_BigInt']
  burns: Array<Maybe<V3rinkeby_Burn>>
  collects: Array<Maybe<V3rinkeby_Collect>>
  flashed: Array<Maybe<V3rinkeby_Flash>>
  gasPrice: Scalars['v3rinkeby_BigInt']
  gasUsed: Scalars['v3rinkeby_BigInt']
  id: Scalars['ID']
  mints: Array<Maybe<V3rinkeby_Mint>>
  swaps: Array<Maybe<V3rinkeby_Swap>>
  timestamp: Scalars['v3rinkeby_BigInt']
}

export type V3rinkeby_TransactionBurnsArgs = {
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3rinkeby_Burn_OrderBy>
  orderDirection?: Maybe<V3rinkeby_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  where?: Maybe<V3rinkeby_Burn_Filter>
}

export type V3rinkeby_TransactionCollectsArgs = {
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3rinkeby_Collect_OrderBy>
  orderDirection?: Maybe<V3rinkeby_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  where?: Maybe<V3rinkeby_Collect_Filter>
}

export type V3rinkeby_TransactionFlashedArgs = {
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3rinkeby_Flash_OrderBy>
  orderDirection?: Maybe<V3rinkeby_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  where?: Maybe<V3rinkeby_Flash_Filter>
}

export type V3rinkeby_TransactionMintsArgs = {
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3rinkeby_Mint_OrderBy>
  orderDirection?: Maybe<V3rinkeby_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  where?: Maybe<V3rinkeby_Mint_Filter>
}

export type V3rinkeby_TransactionSwapsArgs = {
  first?: Maybe<Scalars['Int']>
  orderBy?: Maybe<V3rinkeby_Swap_OrderBy>
  orderDirection?: Maybe<V3rinkeby_OrderDirection>
  skip?: Maybe<Scalars['Int']>
  where?: Maybe<V3rinkeby_Swap_Filter>
}

export type V3rinkeby_Transaction_Filter = {
  blockNumber?: Maybe<Scalars['v3rinkeby_BigInt']>
  blockNumber_gt?: Maybe<Scalars['v3rinkeby_BigInt']>
  blockNumber_gte?: Maybe<Scalars['v3rinkeby_BigInt']>
  blockNumber_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  blockNumber_lt?: Maybe<Scalars['v3rinkeby_BigInt']>
  blockNumber_lte?: Maybe<Scalars['v3rinkeby_BigInt']>
  blockNumber_not?: Maybe<Scalars['v3rinkeby_BigInt']>
  blockNumber_not_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  gasPrice?: Maybe<Scalars['v3rinkeby_BigInt']>
  gasPrice_gt?: Maybe<Scalars['v3rinkeby_BigInt']>
  gasPrice_gte?: Maybe<Scalars['v3rinkeby_BigInt']>
  gasPrice_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  gasPrice_lt?: Maybe<Scalars['v3rinkeby_BigInt']>
  gasPrice_lte?: Maybe<Scalars['v3rinkeby_BigInt']>
  gasPrice_not?: Maybe<Scalars['v3rinkeby_BigInt']>
  gasPrice_not_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  gasUsed?: Maybe<Scalars['v3rinkeby_BigInt']>
  gasUsed_gt?: Maybe<Scalars['v3rinkeby_BigInt']>
  gasUsed_gte?: Maybe<Scalars['v3rinkeby_BigInt']>
  gasUsed_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  gasUsed_lt?: Maybe<Scalars['v3rinkeby_BigInt']>
  gasUsed_lte?: Maybe<Scalars['v3rinkeby_BigInt']>
  gasUsed_not?: Maybe<Scalars['v3rinkeby_BigInt']>
  gasUsed_not_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  id?: Maybe<Scalars['ID']>
  id_gt?: Maybe<Scalars['ID']>
  id_gte?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  id_lt?: Maybe<Scalars['ID']>
  id_lte?: Maybe<Scalars['ID']>
  id_not?: Maybe<Scalars['ID']>
  id_not_in?: Maybe<Array<Scalars['ID']>>
  timestamp?: Maybe<Scalars['v3rinkeby_BigInt']>
  timestamp_gt?: Maybe<Scalars['v3rinkeby_BigInt']>
  timestamp_gte?: Maybe<Scalars['v3rinkeby_BigInt']>
  timestamp_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  timestamp_lt?: Maybe<Scalars['v3rinkeby_BigInt']>
  timestamp_lte?: Maybe<Scalars['v3rinkeby_BigInt']>
  timestamp_not?: Maybe<Scalars['v3rinkeby_BigInt']>
  timestamp_not_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
}

export enum V3rinkeby_Transaction_OrderBy {
  BlockNumber = 'blockNumber',
  Burns = 'burns',
  Collects = 'collects',
  Flashed = 'flashed',
  GasPrice = 'gasPrice',
  GasUsed = 'gasUsed',
  Id = 'id',
  Mints = 'mints',
  Swaps = 'swaps',
  Timestamp = 'timestamp',
}

export type V3rinkeby_UniswapDayData = {
  __typename?: 'v3rinkeby_UniswapDayData'
  date: Scalars['Int']
  feesUSD: Scalars['v3rinkeby_BigDecimal']
  id: Scalars['ID']
  tvlUSD: Scalars['v3rinkeby_BigDecimal']
  txCount: Scalars['v3rinkeby_BigInt']
  volumeETH: Scalars['v3rinkeby_BigDecimal']
  volumeUSD: Scalars['v3rinkeby_BigDecimal']
  volumeUSDUntracked: Scalars['v3rinkeby_BigDecimal']
}

export type V3rinkeby_UniswapDayData_Filter = {
  date?: Maybe<Scalars['Int']>
  date_gt?: Maybe<Scalars['Int']>
  date_gte?: Maybe<Scalars['Int']>
  date_in?: Maybe<Array<Scalars['Int']>>
  date_lt?: Maybe<Scalars['Int']>
  date_lte?: Maybe<Scalars['Int']>
  date_not?: Maybe<Scalars['Int']>
  date_not_in?: Maybe<Array<Scalars['Int']>>
  feesUSD?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  feesUSD_gt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  feesUSD_gte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  feesUSD_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  feesUSD_lt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  feesUSD_lte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  feesUSD_not?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  feesUSD_not_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  id?: Maybe<Scalars['ID']>
  id_gt?: Maybe<Scalars['ID']>
  id_gte?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  id_lt?: Maybe<Scalars['ID']>
  id_lte?: Maybe<Scalars['ID']>
  id_not?: Maybe<Scalars['ID']>
  id_not_in?: Maybe<Array<Scalars['ID']>>
  tvlUSD?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  tvlUSD_gt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  tvlUSD_gte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  tvlUSD_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  tvlUSD_lt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  tvlUSD_lte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  tvlUSD_not?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  tvlUSD_not_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  txCount?: Maybe<Scalars['v3rinkeby_BigInt']>
  txCount_gt?: Maybe<Scalars['v3rinkeby_BigInt']>
  txCount_gte?: Maybe<Scalars['v3rinkeby_BigInt']>
  txCount_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  txCount_lt?: Maybe<Scalars['v3rinkeby_BigInt']>
  txCount_lte?: Maybe<Scalars['v3rinkeby_BigInt']>
  txCount_not?: Maybe<Scalars['v3rinkeby_BigInt']>
  txCount_not_in?: Maybe<Array<Scalars['v3rinkeby_BigInt']>>
  volumeETH?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeETH_gt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeETH_gte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeETH_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  volumeETH_lt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeETH_lte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeETH_not?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeETH_not_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  volumeUSD?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeUSDUntracked?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeUSDUntracked_gt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeUSDUntracked_gte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeUSDUntracked_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  volumeUSDUntracked_lt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeUSDUntracked_lte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeUSDUntracked_not?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeUSDUntracked_not_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  volumeUSD_gt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeUSD_gte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeUSD_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
  volumeUSD_lt?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeUSD_lte?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeUSD_not?: Maybe<Scalars['v3rinkeby_BigDecimal']>
  volumeUSD_not_in?: Maybe<Array<Scalars['v3rinkeby_BigDecimal']>>
}

export enum V3rinkeby_UniswapDayData_OrderBy {
  Date = 'date',
  FeesUsd = 'feesUSD',
  Id = 'id',
  TvlUsd = 'tvlUSD',
  TxCount = 'txCount',
  VolumeEth = 'volumeETH',
  VolumeUsd = 'volumeUSD',
  VolumeUsdUntracked = 'volumeUSDUntracked',
}

export type V3rinkeby__Block_ = {
  __typename?: 'v3rinkeby__Block_'
  /** The hash of the block */
  hash?: Maybe<Scalars['v3rinkeby_Bytes']>
  /** The block number */
  number: Scalars['Int']
}

/** The type for the top-level _meta field */
export type V3rinkeby__Meta_ = {
  __typename?: 'v3rinkeby__Meta_'
  /**
   * Information about a specific subgraph block. The hash of the block
   * will be null if the _meta field has a block constraint that asks for
   * a block number. It will be filled if the _meta field has no block constraint
   * and therefore asks for the latest  block
   *
   */
  block: V3rinkeby__Block_
  /** The deployment ID */
  deployment: Scalars['String']
  /** If `true`, the subgraph encountered indexing errors at some past block */
  hasIndexingErrors: Scalars['Boolean']
}

export enum V3rinkeby__SubgraphErrorPolicy_ {
  /** Data will be returned even if the subgraph has indexing errors */
  Allow = 'allow',
  /** If the subgraph has indexing errors, data will be omitted. The default. */
  Deny = 'deny',
}

export type EthPricesQueryVariables = Exact<{
  chainId: Scalars['Int']
}>

export type EthPricesQuery = {
  __typename?: 'Query'
  current: Array<{ __typename?: 'v3_Bundle'; ethPriceUSD: any }>
}

export type HourlyTokenPricesQueryVariables = Exact<{
  address?: Maybe<Scalars['String']>
  chainId: Scalars['Int']
  periodStartUnix?: Maybe<Scalars['Int']>
}>

export type HourlyTokenPricesQuery = {
  __typename?: 'Query'
  tokenHourDatas: Array<{
    __typename?: 'v3_TokenHourData'
    high: any
    low: any
    open: any
    close: any
    timestamp: number
  }>
}

export type DailyTokenPricesQueryVariables = Exact<{
  address?: Maybe<Scalars['String']>
  chainId: Scalars['Int']
}>

export type DailyTokenPricesQuery = {
  __typename?: 'Query'
  tokenDayDatas: Array<{
    __typename?: 'v3_TokenDayData'
    high: any
    low: any
    open: any
    close: any
    timestamp: number
  }>
}

export type TokensQueryVariables = Exact<{
  chainId: Scalars['Int']
  tokenList: Array<Scalars['ID']> | Scalars['ID']
}>

export type TokensQuery = {
  __typename?: 'Query'
  tokens: Array<{ __typename?: 'v3_Token'; id: string; derivedETH: any }>
}

export const EthPricesDocument = `
    query ethPrices($chainId: Int!) {
  current: bundles(chainId: $chainId, first: 1, subgraphError: allow) {
    ethPriceUSD
  }
}
    `
export const useEthPricesQuery = <TData = EthPricesQuery, TError = unknown>(
  client: GraphQLClient,
  variables: EthPricesQueryVariables,
  options?: UseQueryOptions<EthPricesQuery, TError, TData>,
  headers?: RequestInit['headers']
) =>
  useQuery<EthPricesQuery, TError, TData>(
    ['ethPrices', variables],
    fetcher<EthPricesQuery, EthPricesQueryVariables>(client, EthPricesDocument, variables, headers),
    options
  )
export const HourlyTokenPricesDocument = `
    query hourlyTokenPrices($address: String, $chainId: Int!, $periodStartUnix: Int) {
  tokenHourDatas(
    chainId: $chainId
    first: 1000
    where: {token: $address, periodStartUnix_gt: $periodStartUnix}
    orderBy: periodStartUnix
    orderDirection: desc
  ) {
    timestamp: periodStartUnix
    high
    low
    open
    close
  }
}
    `
export const useHourlyTokenPricesQuery = <TData = HourlyTokenPricesQuery, TError = unknown>(
  client: GraphQLClient,
  variables: HourlyTokenPricesQueryVariables,
  options?: UseQueryOptions<HourlyTokenPricesQuery, TError, TData>,
  headers?: RequestInit['headers']
) =>
  useQuery<HourlyTokenPricesQuery, TError, TData>(
    ['hourlyTokenPrices', variables],
    fetcher<HourlyTokenPricesQuery, HourlyTokenPricesQueryVariables>(
      client,
      HourlyTokenPricesDocument,
      variables,
      headers
    ),
    options
  )
export const DailyTokenPricesDocument = `
    query dailyTokenPrices($address: String, $chainId: Int!) {
  tokenDayDatas(
    chainId: $chainId
    first: 1000
    where: {token: $address}
    orderBy: date
    orderDirection: desc
  ) {
    timestamp: date
    high
    low
    open
    close
  }
}
    `
export const useDailyTokenPricesQuery = <TData = DailyTokenPricesQuery, TError = unknown>(
  client: GraphQLClient,
  variables: DailyTokenPricesQueryVariables,
  options?: UseQueryOptions<DailyTokenPricesQuery, TError, TData>,
  headers?: RequestInit['headers']
) =>
  useQuery<DailyTokenPricesQuery, TError, TData>(
    ['dailyTokenPrices', variables],
    fetcher<DailyTokenPricesQuery, DailyTokenPricesQueryVariables>(
      client,
      DailyTokenPricesDocument,
      variables,
      headers
    ),
    options
  )
export const TokensDocument = `
    query tokens($chainId: Int!, $tokenList: [ID!]!) {
  tokens(
    chainId: $chainId
    where: {id_in: $tokenList}
    orderBy: totalValueLockedUSD
    orderDirection: desc
    subgraphError: allow
  ) {
    id
    derivedETH
  }
}
    `
export const useTokensQuery = <TData = TokensQuery, TError = unknown>(
  client: GraphQLClient,
  variables: TokensQueryVariables,
  options?: UseQueryOptions<TokensQuery, TError, TData>,
  headers?: RequestInit['headers']
) =>
  useQuery<TokensQuery, TError, TData>(
    ['tokens', variables],
    fetcher<TokensQuery, TokensQueryVariables>(client, TokensDocument, variables, headers),
    options
  )
