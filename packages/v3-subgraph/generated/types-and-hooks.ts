import { GraphQLResolveInfo, GraphQLScalarType, GraphQLScalarTypeConfig } from 'graphql';
import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
export type Maybe<T> = T | undefined;
export type InputMaybe<T> = T | undefined;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type RequireFields<T, K extends keyof T> = Omit<T, K> & { [P in K]-?: NonNullable<T[P]> };
const defaultOptions = {} as const;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  BigDecimal: any;
  BigInt: any;
  Bytes: any;
  /** 8 bytes signed integer */
  Int8: any;
  /** A string representation of microseconds UNIX timestamp (16 digits) */
  Timestamp: any;
};

export enum Aggregation_Interval {
  Day = 'day',
  Hour = 'hour'
}

export type BlockChangedFilter = {
  number_gte: Scalars['Int'];
};

export type Block_Height = {
  hash?: InputMaybe<Scalars['Bytes']>;
  number?: InputMaybe<Scalars['Int']>;
  number_gte?: InputMaybe<Scalars['Int']>;
};

export type Bundle = {
  __typename?: 'Bundle';
  ethPriceUSD: Scalars['BigDecimal'];
  id: Scalars['ID'];
};

export type Bundle_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<Bundle_Filter>>>;
  ethPriceUSD?: InputMaybe<Scalars['BigDecimal']>;
  ethPriceUSD_gt?: InputMaybe<Scalars['BigDecimal']>;
  ethPriceUSD_gte?: InputMaybe<Scalars['BigDecimal']>;
  ethPriceUSD_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  ethPriceUSD_lt?: InputMaybe<Scalars['BigDecimal']>;
  ethPriceUSD_lte?: InputMaybe<Scalars['BigDecimal']>;
  ethPriceUSD_not?: InputMaybe<Scalars['BigDecimal']>;
  ethPriceUSD_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  id?: InputMaybe<Scalars['ID']>;
  id_gt?: InputMaybe<Scalars['ID']>;
  id_gte?: InputMaybe<Scalars['ID']>;
  id_in?: InputMaybe<Array<Scalars['ID']>>;
  id_lt?: InputMaybe<Scalars['ID']>;
  id_lte?: InputMaybe<Scalars['ID']>;
  id_not?: InputMaybe<Scalars['ID']>;
  id_not_in?: InputMaybe<Array<Scalars['ID']>>;
  or?: InputMaybe<Array<InputMaybe<Bundle_Filter>>>;
};

export enum Bundle_OrderBy {
  EthPriceUsd = 'ethPriceUSD',
  Id = 'id'
}

export type Burn = {
  __typename?: 'Burn';
  amount: Scalars['BigInt'];
  amount0: Scalars['BigDecimal'];
  amount1: Scalars['BigDecimal'];
  amountUSD?: Maybe<Scalars['BigDecimal']>;
  id: Scalars['ID'];
  logIndex?: Maybe<Scalars['BigInt']>;
  origin: Scalars['Bytes'];
  owner?: Maybe<Scalars['Bytes']>;
  pool: Pool;
  tickLower: Scalars['BigInt'];
  tickUpper: Scalars['BigInt'];
  timestamp: Scalars['BigInt'];
  token0: Token;
  token1: Token;
  transaction: Transaction;
};

export type Burn_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  amount?: InputMaybe<Scalars['BigInt']>;
  amount0?: InputMaybe<Scalars['BigDecimal']>;
  amount0_gt?: InputMaybe<Scalars['BigDecimal']>;
  amount0_gte?: InputMaybe<Scalars['BigDecimal']>;
  amount0_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  amount0_lt?: InputMaybe<Scalars['BigDecimal']>;
  amount0_lte?: InputMaybe<Scalars['BigDecimal']>;
  amount0_not?: InputMaybe<Scalars['BigDecimal']>;
  amount0_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  amount1?: InputMaybe<Scalars['BigDecimal']>;
  amount1_gt?: InputMaybe<Scalars['BigDecimal']>;
  amount1_gte?: InputMaybe<Scalars['BigDecimal']>;
  amount1_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  amount1_lt?: InputMaybe<Scalars['BigDecimal']>;
  amount1_lte?: InputMaybe<Scalars['BigDecimal']>;
  amount1_not?: InputMaybe<Scalars['BigDecimal']>;
  amount1_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  amountUSD?: InputMaybe<Scalars['BigDecimal']>;
  amountUSD_gt?: InputMaybe<Scalars['BigDecimal']>;
  amountUSD_gte?: InputMaybe<Scalars['BigDecimal']>;
  amountUSD_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  amountUSD_lt?: InputMaybe<Scalars['BigDecimal']>;
  amountUSD_lte?: InputMaybe<Scalars['BigDecimal']>;
  amountUSD_not?: InputMaybe<Scalars['BigDecimal']>;
  amountUSD_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  amount_gt?: InputMaybe<Scalars['BigInt']>;
  amount_gte?: InputMaybe<Scalars['BigInt']>;
  amount_in?: InputMaybe<Array<Scalars['BigInt']>>;
  amount_lt?: InputMaybe<Scalars['BigInt']>;
  amount_lte?: InputMaybe<Scalars['BigInt']>;
  amount_not?: InputMaybe<Scalars['BigInt']>;
  amount_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
  and?: InputMaybe<Array<InputMaybe<Burn_Filter>>>;
  id?: InputMaybe<Scalars['ID']>;
  id_gt?: InputMaybe<Scalars['ID']>;
  id_gte?: InputMaybe<Scalars['ID']>;
  id_in?: InputMaybe<Array<Scalars['ID']>>;
  id_lt?: InputMaybe<Scalars['ID']>;
  id_lte?: InputMaybe<Scalars['ID']>;
  id_not?: InputMaybe<Scalars['ID']>;
  id_not_in?: InputMaybe<Array<Scalars['ID']>>;
  logIndex?: InputMaybe<Scalars['BigInt']>;
  logIndex_gt?: InputMaybe<Scalars['BigInt']>;
  logIndex_gte?: InputMaybe<Scalars['BigInt']>;
  logIndex_in?: InputMaybe<Array<Scalars['BigInt']>>;
  logIndex_lt?: InputMaybe<Scalars['BigInt']>;
  logIndex_lte?: InputMaybe<Scalars['BigInt']>;
  logIndex_not?: InputMaybe<Scalars['BigInt']>;
  logIndex_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
  or?: InputMaybe<Array<InputMaybe<Burn_Filter>>>;
  origin?: InputMaybe<Scalars['Bytes']>;
  origin_contains?: InputMaybe<Scalars['Bytes']>;
  origin_gt?: InputMaybe<Scalars['Bytes']>;
  origin_gte?: InputMaybe<Scalars['Bytes']>;
  origin_in?: InputMaybe<Array<Scalars['Bytes']>>;
  origin_lt?: InputMaybe<Scalars['Bytes']>;
  origin_lte?: InputMaybe<Scalars['Bytes']>;
  origin_not?: InputMaybe<Scalars['Bytes']>;
  origin_not_contains?: InputMaybe<Scalars['Bytes']>;
  origin_not_in?: InputMaybe<Array<Scalars['Bytes']>>;
  owner?: InputMaybe<Scalars['Bytes']>;
  owner_contains?: InputMaybe<Scalars['Bytes']>;
  owner_gt?: InputMaybe<Scalars['Bytes']>;
  owner_gte?: InputMaybe<Scalars['Bytes']>;
  owner_in?: InputMaybe<Array<Scalars['Bytes']>>;
  owner_lt?: InputMaybe<Scalars['Bytes']>;
  owner_lte?: InputMaybe<Scalars['Bytes']>;
  owner_not?: InputMaybe<Scalars['Bytes']>;
  owner_not_contains?: InputMaybe<Scalars['Bytes']>;
  owner_not_in?: InputMaybe<Array<Scalars['Bytes']>>;
  pool?: InputMaybe<Scalars['String']>;
  pool_?: InputMaybe<Pool_Filter>;
  pool_contains?: InputMaybe<Scalars['String']>;
  pool_contains_nocase?: InputMaybe<Scalars['String']>;
  pool_ends_with?: InputMaybe<Scalars['String']>;
  pool_ends_with_nocase?: InputMaybe<Scalars['String']>;
  pool_gt?: InputMaybe<Scalars['String']>;
  pool_gte?: InputMaybe<Scalars['String']>;
  pool_in?: InputMaybe<Array<Scalars['String']>>;
  pool_lt?: InputMaybe<Scalars['String']>;
  pool_lte?: InputMaybe<Scalars['String']>;
  pool_not?: InputMaybe<Scalars['String']>;
  pool_not_contains?: InputMaybe<Scalars['String']>;
  pool_not_contains_nocase?: InputMaybe<Scalars['String']>;
  pool_not_ends_with?: InputMaybe<Scalars['String']>;
  pool_not_ends_with_nocase?: InputMaybe<Scalars['String']>;
  pool_not_in?: InputMaybe<Array<Scalars['String']>>;
  pool_not_starts_with?: InputMaybe<Scalars['String']>;
  pool_not_starts_with_nocase?: InputMaybe<Scalars['String']>;
  pool_starts_with?: InputMaybe<Scalars['String']>;
  pool_starts_with_nocase?: InputMaybe<Scalars['String']>;
  tickLower?: InputMaybe<Scalars['BigInt']>;
  tickLower_gt?: InputMaybe<Scalars['BigInt']>;
  tickLower_gte?: InputMaybe<Scalars['BigInt']>;
  tickLower_in?: InputMaybe<Array<Scalars['BigInt']>>;
  tickLower_lt?: InputMaybe<Scalars['BigInt']>;
  tickLower_lte?: InputMaybe<Scalars['BigInt']>;
  tickLower_not?: InputMaybe<Scalars['BigInt']>;
  tickLower_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
  tickUpper?: InputMaybe<Scalars['BigInt']>;
  tickUpper_gt?: InputMaybe<Scalars['BigInt']>;
  tickUpper_gte?: InputMaybe<Scalars['BigInt']>;
  tickUpper_in?: InputMaybe<Array<Scalars['BigInt']>>;
  tickUpper_lt?: InputMaybe<Scalars['BigInt']>;
  tickUpper_lte?: InputMaybe<Scalars['BigInt']>;
  tickUpper_not?: InputMaybe<Scalars['BigInt']>;
  tickUpper_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
  timestamp?: InputMaybe<Scalars['BigInt']>;
  timestamp_gt?: InputMaybe<Scalars['BigInt']>;
  timestamp_gte?: InputMaybe<Scalars['BigInt']>;
  timestamp_in?: InputMaybe<Array<Scalars['BigInt']>>;
  timestamp_lt?: InputMaybe<Scalars['BigInt']>;
  timestamp_lte?: InputMaybe<Scalars['BigInt']>;
  timestamp_not?: InputMaybe<Scalars['BigInt']>;
  timestamp_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
  token0?: InputMaybe<Scalars['String']>;
  token0_?: InputMaybe<Token_Filter>;
  token0_contains?: InputMaybe<Scalars['String']>;
  token0_contains_nocase?: InputMaybe<Scalars['String']>;
  token0_ends_with?: InputMaybe<Scalars['String']>;
  token0_ends_with_nocase?: InputMaybe<Scalars['String']>;
  token0_gt?: InputMaybe<Scalars['String']>;
  token0_gte?: InputMaybe<Scalars['String']>;
  token0_in?: InputMaybe<Array<Scalars['String']>>;
  token0_lt?: InputMaybe<Scalars['String']>;
  token0_lte?: InputMaybe<Scalars['String']>;
  token0_not?: InputMaybe<Scalars['String']>;
  token0_not_contains?: InputMaybe<Scalars['String']>;
  token0_not_contains_nocase?: InputMaybe<Scalars['String']>;
  token0_not_ends_with?: InputMaybe<Scalars['String']>;
  token0_not_ends_with_nocase?: InputMaybe<Scalars['String']>;
  token0_not_in?: InputMaybe<Array<Scalars['String']>>;
  token0_not_starts_with?: InputMaybe<Scalars['String']>;
  token0_not_starts_with_nocase?: InputMaybe<Scalars['String']>;
  token0_starts_with?: InputMaybe<Scalars['String']>;
  token0_starts_with_nocase?: InputMaybe<Scalars['String']>;
  token1?: InputMaybe<Scalars['String']>;
  token1_?: InputMaybe<Token_Filter>;
  token1_contains?: InputMaybe<Scalars['String']>;
  token1_contains_nocase?: InputMaybe<Scalars['String']>;
  token1_ends_with?: InputMaybe<Scalars['String']>;
  token1_ends_with_nocase?: InputMaybe<Scalars['String']>;
  token1_gt?: InputMaybe<Scalars['String']>;
  token1_gte?: InputMaybe<Scalars['String']>;
  token1_in?: InputMaybe<Array<Scalars['String']>>;
  token1_lt?: InputMaybe<Scalars['String']>;
  token1_lte?: InputMaybe<Scalars['String']>;
  token1_not?: InputMaybe<Scalars['String']>;
  token1_not_contains?: InputMaybe<Scalars['String']>;
  token1_not_contains_nocase?: InputMaybe<Scalars['String']>;
  token1_not_ends_with?: InputMaybe<Scalars['String']>;
  token1_not_ends_with_nocase?: InputMaybe<Scalars['String']>;
  token1_not_in?: InputMaybe<Array<Scalars['String']>>;
  token1_not_starts_with?: InputMaybe<Scalars['String']>;
  token1_not_starts_with_nocase?: InputMaybe<Scalars['String']>;
  token1_starts_with?: InputMaybe<Scalars['String']>;
  token1_starts_with_nocase?: InputMaybe<Scalars['String']>;
  transaction?: InputMaybe<Scalars['String']>;
  transaction_?: InputMaybe<Transaction_Filter>;
  transaction_contains?: InputMaybe<Scalars['String']>;
  transaction_contains_nocase?: InputMaybe<Scalars['String']>;
  transaction_ends_with?: InputMaybe<Scalars['String']>;
  transaction_ends_with_nocase?: InputMaybe<Scalars['String']>;
  transaction_gt?: InputMaybe<Scalars['String']>;
  transaction_gte?: InputMaybe<Scalars['String']>;
  transaction_in?: InputMaybe<Array<Scalars['String']>>;
  transaction_lt?: InputMaybe<Scalars['String']>;
  transaction_lte?: InputMaybe<Scalars['String']>;
  transaction_not?: InputMaybe<Scalars['String']>;
  transaction_not_contains?: InputMaybe<Scalars['String']>;
  transaction_not_contains_nocase?: InputMaybe<Scalars['String']>;
  transaction_not_ends_with?: InputMaybe<Scalars['String']>;
  transaction_not_ends_with_nocase?: InputMaybe<Scalars['String']>;
  transaction_not_in?: InputMaybe<Array<Scalars['String']>>;
  transaction_not_starts_with?: InputMaybe<Scalars['String']>;
  transaction_not_starts_with_nocase?: InputMaybe<Scalars['String']>;
  transaction_starts_with?: InputMaybe<Scalars['String']>;
  transaction_starts_with_nocase?: InputMaybe<Scalars['String']>;
};

export enum Burn_OrderBy {
  Amount = 'amount',
  Amount0 = 'amount0',
  Amount1 = 'amount1',
  AmountUsd = 'amountUSD',
  Id = 'id',
  LogIndex = 'logIndex',
  Origin = 'origin',
  Owner = 'owner',
  Pool = 'pool',
  PoolCollectedFeesToken0 = 'pool__collectedFeesToken0',
  PoolCollectedFeesToken1 = 'pool__collectedFeesToken1',
  PoolCollectedFeesUsd = 'pool__collectedFeesUSD',
  PoolCreatedAtBlockNumber = 'pool__createdAtBlockNumber',
  PoolCreatedAtTimestamp = 'pool__createdAtTimestamp',
  PoolFeeTier = 'pool__feeTier',
  PoolFeesUsd = 'pool__feesUSD',
  PoolId = 'pool__id',
  PoolLiquidity = 'pool__liquidity',
  PoolLiquidityProviderCount = 'pool__liquidityProviderCount',
  PoolObservationIndex = 'pool__observationIndex',
  PoolSqrtPrice = 'pool__sqrtPrice',
  PoolTick = 'pool__tick',
  PoolToken0Price = 'pool__token0Price',
  PoolToken1Price = 'pool__token1Price',
  PoolTotalValueLockedEth = 'pool__totalValueLockedETH',
  PoolTotalValueLockedToken0 = 'pool__totalValueLockedToken0',
  PoolTotalValueLockedToken1 = 'pool__totalValueLockedToken1',
  PoolTotalValueLockedUsd = 'pool__totalValueLockedUSD',
  PoolTotalValueLockedUsdUntracked = 'pool__totalValueLockedUSDUntracked',
  PoolTxCount = 'pool__txCount',
  PoolUntrackedVolumeUsd = 'pool__untrackedVolumeUSD',
  PoolVolumeToken0 = 'pool__volumeToken0',
  PoolVolumeToken1 = 'pool__volumeToken1',
  PoolVolumeUsd = 'pool__volumeUSD',
  TickLower = 'tickLower',
  TickUpper = 'tickUpper',
  Timestamp = 'timestamp',
  Token0 = 'token0',
  Token0Decimals = 'token0__decimals',
  Token0DerivedEth = 'token0__derivedETH',
  Token0FeesUsd = 'token0__feesUSD',
  Token0Id = 'token0__id',
  Token0Name = 'token0__name',
  Token0PoolCount = 'token0__poolCount',
  Token0Symbol = 'token0__symbol',
  Token0TotalSupply = 'token0__totalSupply',
  Token0TotalValueLocked = 'token0__totalValueLocked',
  Token0TotalValueLockedUsd = 'token0__totalValueLockedUSD',
  Token0TotalValueLockedUsdUntracked = 'token0__totalValueLockedUSDUntracked',
  Token0TxCount = 'token0__txCount',
  Token0UntrackedVolumeUsd = 'token0__untrackedVolumeUSD',
  Token0Volume = 'token0__volume',
  Token0VolumeUsd = 'token0__volumeUSD',
  Token1 = 'token1',
  Token1Decimals = 'token1__decimals',
  Token1DerivedEth = 'token1__derivedETH',
  Token1FeesUsd = 'token1__feesUSD',
  Token1Id = 'token1__id',
  Token1Name = 'token1__name',
  Token1PoolCount = 'token1__poolCount',
  Token1Symbol = 'token1__symbol',
  Token1TotalSupply = 'token1__totalSupply',
  Token1TotalValueLocked = 'token1__totalValueLocked',
  Token1TotalValueLockedUsd = 'token1__totalValueLockedUSD',
  Token1TotalValueLockedUsdUntracked = 'token1__totalValueLockedUSDUntracked',
  Token1TxCount = 'token1__txCount',
  Token1UntrackedVolumeUsd = 'token1__untrackedVolumeUSD',
  Token1Volume = 'token1__volume',
  Token1VolumeUsd = 'token1__volumeUSD',
  Transaction = 'transaction',
  TransactionBlockNumber = 'transaction__blockNumber',
  TransactionGasPrice = 'transaction__gasPrice',
  TransactionGasUsed = 'transaction__gasUsed',
  TransactionId = 'transaction__id',
  TransactionTimestamp = 'transaction__timestamp'
}

export type Collect = {
  __typename?: 'Collect';
  amount0: Scalars['BigDecimal'];
  amount1: Scalars['BigDecimal'];
  amountUSD?: Maybe<Scalars['BigDecimal']>;
  id: Scalars['ID'];
  logIndex?: Maybe<Scalars['BigInt']>;
  owner?: Maybe<Scalars['Bytes']>;
  pool: Pool;
  tickLower: Scalars['BigInt'];
  tickUpper: Scalars['BigInt'];
  timestamp: Scalars['BigInt'];
  transaction: Transaction;
};

export type Collect_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  amount0?: InputMaybe<Scalars['BigDecimal']>;
  amount0_gt?: InputMaybe<Scalars['BigDecimal']>;
  amount0_gte?: InputMaybe<Scalars['BigDecimal']>;
  amount0_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  amount0_lt?: InputMaybe<Scalars['BigDecimal']>;
  amount0_lte?: InputMaybe<Scalars['BigDecimal']>;
  amount0_not?: InputMaybe<Scalars['BigDecimal']>;
  amount0_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  amount1?: InputMaybe<Scalars['BigDecimal']>;
  amount1_gt?: InputMaybe<Scalars['BigDecimal']>;
  amount1_gte?: InputMaybe<Scalars['BigDecimal']>;
  amount1_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  amount1_lt?: InputMaybe<Scalars['BigDecimal']>;
  amount1_lte?: InputMaybe<Scalars['BigDecimal']>;
  amount1_not?: InputMaybe<Scalars['BigDecimal']>;
  amount1_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  amountUSD?: InputMaybe<Scalars['BigDecimal']>;
  amountUSD_gt?: InputMaybe<Scalars['BigDecimal']>;
  amountUSD_gte?: InputMaybe<Scalars['BigDecimal']>;
  amountUSD_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  amountUSD_lt?: InputMaybe<Scalars['BigDecimal']>;
  amountUSD_lte?: InputMaybe<Scalars['BigDecimal']>;
  amountUSD_not?: InputMaybe<Scalars['BigDecimal']>;
  amountUSD_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  and?: InputMaybe<Array<InputMaybe<Collect_Filter>>>;
  id?: InputMaybe<Scalars['ID']>;
  id_gt?: InputMaybe<Scalars['ID']>;
  id_gte?: InputMaybe<Scalars['ID']>;
  id_in?: InputMaybe<Array<Scalars['ID']>>;
  id_lt?: InputMaybe<Scalars['ID']>;
  id_lte?: InputMaybe<Scalars['ID']>;
  id_not?: InputMaybe<Scalars['ID']>;
  id_not_in?: InputMaybe<Array<Scalars['ID']>>;
  logIndex?: InputMaybe<Scalars['BigInt']>;
  logIndex_gt?: InputMaybe<Scalars['BigInt']>;
  logIndex_gte?: InputMaybe<Scalars['BigInt']>;
  logIndex_in?: InputMaybe<Array<Scalars['BigInt']>>;
  logIndex_lt?: InputMaybe<Scalars['BigInt']>;
  logIndex_lte?: InputMaybe<Scalars['BigInt']>;
  logIndex_not?: InputMaybe<Scalars['BigInt']>;
  logIndex_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
  or?: InputMaybe<Array<InputMaybe<Collect_Filter>>>;
  owner?: InputMaybe<Scalars['Bytes']>;
  owner_contains?: InputMaybe<Scalars['Bytes']>;
  owner_gt?: InputMaybe<Scalars['Bytes']>;
  owner_gte?: InputMaybe<Scalars['Bytes']>;
  owner_in?: InputMaybe<Array<Scalars['Bytes']>>;
  owner_lt?: InputMaybe<Scalars['Bytes']>;
  owner_lte?: InputMaybe<Scalars['Bytes']>;
  owner_not?: InputMaybe<Scalars['Bytes']>;
  owner_not_contains?: InputMaybe<Scalars['Bytes']>;
  owner_not_in?: InputMaybe<Array<Scalars['Bytes']>>;
  pool?: InputMaybe<Scalars['String']>;
  pool_?: InputMaybe<Pool_Filter>;
  pool_contains?: InputMaybe<Scalars['String']>;
  pool_contains_nocase?: InputMaybe<Scalars['String']>;
  pool_ends_with?: InputMaybe<Scalars['String']>;
  pool_ends_with_nocase?: InputMaybe<Scalars['String']>;
  pool_gt?: InputMaybe<Scalars['String']>;
  pool_gte?: InputMaybe<Scalars['String']>;
  pool_in?: InputMaybe<Array<Scalars['String']>>;
  pool_lt?: InputMaybe<Scalars['String']>;
  pool_lte?: InputMaybe<Scalars['String']>;
  pool_not?: InputMaybe<Scalars['String']>;
  pool_not_contains?: InputMaybe<Scalars['String']>;
  pool_not_contains_nocase?: InputMaybe<Scalars['String']>;
  pool_not_ends_with?: InputMaybe<Scalars['String']>;
  pool_not_ends_with_nocase?: InputMaybe<Scalars['String']>;
  pool_not_in?: InputMaybe<Array<Scalars['String']>>;
  pool_not_starts_with?: InputMaybe<Scalars['String']>;
  pool_not_starts_with_nocase?: InputMaybe<Scalars['String']>;
  pool_starts_with?: InputMaybe<Scalars['String']>;
  pool_starts_with_nocase?: InputMaybe<Scalars['String']>;
  tickLower?: InputMaybe<Scalars['BigInt']>;
  tickLower_gt?: InputMaybe<Scalars['BigInt']>;
  tickLower_gte?: InputMaybe<Scalars['BigInt']>;
  tickLower_in?: InputMaybe<Array<Scalars['BigInt']>>;
  tickLower_lt?: InputMaybe<Scalars['BigInt']>;
  tickLower_lte?: InputMaybe<Scalars['BigInt']>;
  tickLower_not?: InputMaybe<Scalars['BigInt']>;
  tickLower_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
  tickUpper?: InputMaybe<Scalars['BigInt']>;
  tickUpper_gt?: InputMaybe<Scalars['BigInt']>;
  tickUpper_gte?: InputMaybe<Scalars['BigInt']>;
  tickUpper_in?: InputMaybe<Array<Scalars['BigInt']>>;
  tickUpper_lt?: InputMaybe<Scalars['BigInt']>;
  tickUpper_lte?: InputMaybe<Scalars['BigInt']>;
  tickUpper_not?: InputMaybe<Scalars['BigInt']>;
  tickUpper_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
  timestamp?: InputMaybe<Scalars['BigInt']>;
  timestamp_gt?: InputMaybe<Scalars['BigInt']>;
  timestamp_gte?: InputMaybe<Scalars['BigInt']>;
  timestamp_in?: InputMaybe<Array<Scalars['BigInt']>>;
  timestamp_lt?: InputMaybe<Scalars['BigInt']>;
  timestamp_lte?: InputMaybe<Scalars['BigInt']>;
  timestamp_not?: InputMaybe<Scalars['BigInt']>;
  timestamp_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
  transaction?: InputMaybe<Scalars['String']>;
  transaction_?: InputMaybe<Transaction_Filter>;
  transaction_contains?: InputMaybe<Scalars['String']>;
  transaction_contains_nocase?: InputMaybe<Scalars['String']>;
  transaction_ends_with?: InputMaybe<Scalars['String']>;
  transaction_ends_with_nocase?: InputMaybe<Scalars['String']>;
  transaction_gt?: InputMaybe<Scalars['String']>;
  transaction_gte?: InputMaybe<Scalars['String']>;
  transaction_in?: InputMaybe<Array<Scalars['String']>>;
  transaction_lt?: InputMaybe<Scalars['String']>;
  transaction_lte?: InputMaybe<Scalars['String']>;
  transaction_not?: InputMaybe<Scalars['String']>;
  transaction_not_contains?: InputMaybe<Scalars['String']>;
  transaction_not_contains_nocase?: InputMaybe<Scalars['String']>;
  transaction_not_ends_with?: InputMaybe<Scalars['String']>;
  transaction_not_ends_with_nocase?: InputMaybe<Scalars['String']>;
  transaction_not_in?: InputMaybe<Array<Scalars['String']>>;
  transaction_not_starts_with?: InputMaybe<Scalars['String']>;
  transaction_not_starts_with_nocase?: InputMaybe<Scalars['String']>;
  transaction_starts_with?: InputMaybe<Scalars['String']>;
  transaction_starts_with_nocase?: InputMaybe<Scalars['String']>;
};

export enum Collect_OrderBy {
  Amount0 = 'amount0',
  Amount1 = 'amount1',
  AmountUsd = 'amountUSD',
  Id = 'id',
  LogIndex = 'logIndex',
  Owner = 'owner',
  Pool = 'pool',
  PoolCollectedFeesToken0 = 'pool__collectedFeesToken0',
  PoolCollectedFeesToken1 = 'pool__collectedFeesToken1',
  PoolCollectedFeesUsd = 'pool__collectedFeesUSD',
  PoolCreatedAtBlockNumber = 'pool__createdAtBlockNumber',
  PoolCreatedAtTimestamp = 'pool__createdAtTimestamp',
  PoolFeeTier = 'pool__feeTier',
  PoolFeesUsd = 'pool__feesUSD',
  PoolId = 'pool__id',
  PoolLiquidity = 'pool__liquidity',
  PoolLiquidityProviderCount = 'pool__liquidityProviderCount',
  PoolObservationIndex = 'pool__observationIndex',
  PoolSqrtPrice = 'pool__sqrtPrice',
  PoolTick = 'pool__tick',
  PoolToken0Price = 'pool__token0Price',
  PoolToken1Price = 'pool__token1Price',
  PoolTotalValueLockedEth = 'pool__totalValueLockedETH',
  PoolTotalValueLockedToken0 = 'pool__totalValueLockedToken0',
  PoolTotalValueLockedToken1 = 'pool__totalValueLockedToken1',
  PoolTotalValueLockedUsd = 'pool__totalValueLockedUSD',
  PoolTotalValueLockedUsdUntracked = 'pool__totalValueLockedUSDUntracked',
  PoolTxCount = 'pool__txCount',
  PoolUntrackedVolumeUsd = 'pool__untrackedVolumeUSD',
  PoolVolumeToken0 = 'pool__volumeToken0',
  PoolVolumeToken1 = 'pool__volumeToken1',
  PoolVolumeUsd = 'pool__volumeUSD',
  TickLower = 'tickLower',
  TickUpper = 'tickUpper',
  Timestamp = 'timestamp',
  Transaction = 'transaction',
  TransactionBlockNumber = 'transaction__blockNumber',
  TransactionGasPrice = 'transaction__gasPrice',
  TransactionGasUsed = 'transaction__gasUsed',
  TransactionId = 'transaction__id',
  TransactionTimestamp = 'transaction__timestamp'
}

export type Factory = {
  __typename?: 'Factory';
  id: Scalars['ID'];
  owner: Scalars['ID'];
  poolCount: Scalars['BigInt'];
  totalFeesETH: Scalars['BigDecimal'];
  totalFeesUSD: Scalars['BigDecimal'];
  totalValueLockedETH: Scalars['BigDecimal'];
  totalValueLockedETHUntracked: Scalars['BigDecimal'];
  totalValueLockedUSD: Scalars['BigDecimal'];
  totalValueLockedUSDUntracked: Scalars['BigDecimal'];
  totalVolumeETH: Scalars['BigDecimal'];
  totalVolumeUSD: Scalars['BigDecimal'];
  txCount: Scalars['BigInt'];
  untrackedVolumeUSD: Scalars['BigDecimal'];
};

export type Factory_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<Factory_Filter>>>;
  id?: InputMaybe<Scalars['ID']>;
  id_gt?: InputMaybe<Scalars['ID']>;
  id_gte?: InputMaybe<Scalars['ID']>;
  id_in?: InputMaybe<Array<Scalars['ID']>>;
  id_lt?: InputMaybe<Scalars['ID']>;
  id_lte?: InputMaybe<Scalars['ID']>;
  id_not?: InputMaybe<Scalars['ID']>;
  id_not_in?: InputMaybe<Array<Scalars['ID']>>;
  or?: InputMaybe<Array<InputMaybe<Factory_Filter>>>;
  owner?: InputMaybe<Scalars['ID']>;
  owner_gt?: InputMaybe<Scalars['ID']>;
  owner_gte?: InputMaybe<Scalars['ID']>;
  owner_in?: InputMaybe<Array<Scalars['ID']>>;
  owner_lt?: InputMaybe<Scalars['ID']>;
  owner_lte?: InputMaybe<Scalars['ID']>;
  owner_not?: InputMaybe<Scalars['ID']>;
  owner_not_in?: InputMaybe<Array<Scalars['ID']>>;
  poolCount?: InputMaybe<Scalars['BigInt']>;
  poolCount_gt?: InputMaybe<Scalars['BigInt']>;
  poolCount_gte?: InputMaybe<Scalars['BigInt']>;
  poolCount_in?: InputMaybe<Array<Scalars['BigInt']>>;
  poolCount_lt?: InputMaybe<Scalars['BigInt']>;
  poolCount_lte?: InputMaybe<Scalars['BigInt']>;
  poolCount_not?: InputMaybe<Scalars['BigInt']>;
  poolCount_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
  totalFeesETH?: InputMaybe<Scalars['BigDecimal']>;
  totalFeesETH_gt?: InputMaybe<Scalars['BigDecimal']>;
  totalFeesETH_gte?: InputMaybe<Scalars['BigDecimal']>;
  totalFeesETH_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  totalFeesETH_lt?: InputMaybe<Scalars['BigDecimal']>;
  totalFeesETH_lte?: InputMaybe<Scalars['BigDecimal']>;
  totalFeesETH_not?: InputMaybe<Scalars['BigDecimal']>;
  totalFeesETH_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  totalFeesUSD?: InputMaybe<Scalars['BigDecimal']>;
  totalFeesUSD_gt?: InputMaybe<Scalars['BigDecimal']>;
  totalFeesUSD_gte?: InputMaybe<Scalars['BigDecimal']>;
  totalFeesUSD_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  totalFeesUSD_lt?: InputMaybe<Scalars['BigDecimal']>;
  totalFeesUSD_lte?: InputMaybe<Scalars['BigDecimal']>;
  totalFeesUSD_not?: InputMaybe<Scalars['BigDecimal']>;
  totalFeesUSD_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  totalValueLockedETH?: InputMaybe<Scalars['BigDecimal']>;
  totalValueLockedETHUntracked?: InputMaybe<Scalars['BigDecimal']>;
  totalValueLockedETHUntracked_gt?: InputMaybe<Scalars['BigDecimal']>;
  totalValueLockedETHUntracked_gte?: InputMaybe<Scalars['BigDecimal']>;
  totalValueLockedETHUntracked_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  totalValueLockedETHUntracked_lt?: InputMaybe<Scalars['BigDecimal']>;
  totalValueLockedETHUntracked_lte?: InputMaybe<Scalars['BigDecimal']>;
  totalValueLockedETHUntracked_not?: InputMaybe<Scalars['BigDecimal']>;
  totalValueLockedETHUntracked_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  totalValueLockedETH_gt?: InputMaybe<Scalars['BigDecimal']>;
  totalValueLockedETH_gte?: InputMaybe<Scalars['BigDecimal']>;
  totalValueLockedETH_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  totalValueLockedETH_lt?: InputMaybe<Scalars['BigDecimal']>;
  totalValueLockedETH_lte?: InputMaybe<Scalars['BigDecimal']>;
  totalValueLockedETH_not?: InputMaybe<Scalars['BigDecimal']>;
  totalValueLockedETH_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  totalValueLockedUSD?: InputMaybe<Scalars['BigDecimal']>;
  totalValueLockedUSDUntracked?: InputMaybe<Scalars['BigDecimal']>;
  totalValueLockedUSDUntracked_gt?: InputMaybe<Scalars['BigDecimal']>;
  totalValueLockedUSDUntracked_gte?: InputMaybe<Scalars['BigDecimal']>;
  totalValueLockedUSDUntracked_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  totalValueLockedUSDUntracked_lt?: InputMaybe<Scalars['BigDecimal']>;
  totalValueLockedUSDUntracked_lte?: InputMaybe<Scalars['BigDecimal']>;
  totalValueLockedUSDUntracked_not?: InputMaybe<Scalars['BigDecimal']>;
  totalValueLockedUSDUntracked_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  totalValueLockedUSD_gt?: InputMaybe<Scalars['BigDecimal']>;
  totalValueLockedUSD_gte?: InputMaybe<Scalars['BigDecimal']>;
  totalValueLockedUSD_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  totalValueLockedUSD_lt?: InputMaybe<Scalars['BigDecimal']>;
  totalValueLockedUSD_lte?: InputMaybe<Scalars['BigDecimal']>;
  totalValueLockedUSD_not?: InputMaybe<Scalars['BigDecimal']>;
  totalValueLockedUSD_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  totalVolumeETH?: InputMaybe<Scalars['BigDecimal']>;
  totalVolumeETH_gt?: InputMaybe<Scalars['BigDecimal']>;
  totalVolumeETH_gte?: InputMaybe<Scalars['BigDecimal']>;
  totalVolumeETH_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  totalVolumeETH_lt?: InputMaybe<Scalars['BigDecimal']>;
  totalVolumeETH_lte?: InputMaybe<Scalars['BigDecimal']>;
  totalVolumeETH_not?: InputMaybe<Scalars['BigDecimal']>;
  totalVolumeETH_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  totalVolumeUSD?: InputMaybe<Scalars['BigDecimal']>;
  totalVolumeUSD_gt?: InputMaybe<Scalars['BigDecimal']>;
  totalVolumeUSD_gte?: InputMaybe<Scalars['BigDecimal']>;
  totalVolumeUSD_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  totalVolumeUSD_lt?: InputMaybe<Scalars['BigDecimal']>;
  totalVolumeUSD_lte?: InputMaybe<Scalars['BigDecimal']>;
  totalVolumeUSD_not?: InputMaybe<Scalars['BigDecimal']>;
  totalVolumeUSD_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  txCount?: InputMaybe<Scalars['BigInt']>;
  txCount_gt?: InputMaybe<Scalars['BigInt']>;
  txCount_gte?: InputMaybe<Scalars['BigInt']>;
  txCount_in?: InputMaybe<Array<Scalars['BigInt']>>;
  txCount_lt?: InputMaybe<Scalars['BigInt']>;
  txCount_lte?: InputMaybe<Scalars['BigInt']>;
  txCount_not?: InputMaybe<Scalars['BigInt']>;
  txCount_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
  untrackedVolumeUSD?: InputMaybe<Scalars['BigDecimal']>;
  untrackedVolumeUSD_gt?: InputMaybe<Scalars['BigDecimal']>;
  untrackedVolumeUSD_gte?: InputMaybe<Scalars['BigDecimal']>;
  untrackedVolumeUSD_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  untrackedVolumeUSD_lt?: InputMaybe<Scalars['BigDecimal']>;
  untrackedVolumeUSD_lte?: InputMaybe<Scalars['BigDecimal']>;
  untrackedVolumeUSD_not?: InputMaybe<Scalars['BigDecimal']>;
  untrackedVolumeUSD_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
};

export enum Factory_OrderBy {
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
  UntrackedVolumeUsd = 'untrackedVolumeUSD'
}

export type Flash = {
  __typename?: 'Flash';
  amount0: Scalars['BigDecimal'];
  amount0Paid: Scalars['BigDecimal'];
  amount1: Scalars['BigDecimal'];
  amount1Paid: Scalars['BigDecimal'];
  amountUSD: Scalars['BigDecimal'];
  id: Scalars['ID'];
  logIndex?: Maybe<Scalars['BigInt']>;
  pool: Pool;
  recipient: Scalars['Bytes'];
  sender: Scalars['Bytes'];
  timestamp: Scalars['BigInt'];
  transaction: Transaction;
};

export type Flash_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  amount0?: InputMaybe<Scalars['BigDecimal']>;
  amount0Paid?: InputMaybe<Scalars['BigDecimal']>;
  amount0Paid_gt?: InputMaybe<Scalars['BigDecimal']>;
  amount0Paid_gte?: InputMaybe<Scalars['BigDecimal']>;
  amount0Paid_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  amount0Paid_lt?: InputMaybe<Scalars['BigDecimal']>;
  amount0Paid_lte?: InputMaybe<Scalars['BigDecimal']>;
  amount0Paid_not?: InputMaybe<Scalars['BigDecimal']>;
  amount0Paid_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  amount0_gt?: InputMaybe<Scalars['BigDecimal']>;
  amount0_gte?: InputMaybe<Scalars['BigDecimal']>;
  amount0_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  amount0_lt?: InputMaybe<Scalars['BigDecimal']>;
  amount0_lte?: InputMaybe<Scalars['BigDecimal']>;
  amount0_not?: InputMaybe<Scalars['BigDecimal']>;
  amount0_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  amount1?: InputMaybe<Scalars['BigDecimal']>;
  amount1Paid?: InputMaybe<Scalars['BigDecimal']>;
  amount1Paid_gt?: InputMaybe<Scalars['BigDecimal']>;
  amount1Paid_gte?: InputMaybe<Scalars['BigDecimal']>;
  amount1Paid_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  amount1Paid_lt?: InputMaybe<Scalars['BigDecimal']>;
  amount1Paid_lte?: InputMaybe<Scalars['BigDecimal']>;
  amount1Paid_not?: InputMaybe<Scalars['BigDecimal']>;
  amount1Paid_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  amount1_gt?: InputMaybe<Scalars['BigDecimal']>;
  amount1_gte?: InputMaybe<Scalars['BigDecimal']>;
  amount1_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  amount1_lt?: InputMaybe<Scalars['BigDecimal']>;
  amount1_lte?: InputMaybe<Scalars['BigDecimal']>;
  amount1_not?: InputMaybe<Scalars['BigDecimal']>;
  amount1_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  amountUSD?: InputMaybe<Scalars['BigDecimal']>;
  amountUSD_gt?: InputMaybe<Scalars['BigDecimal']>;
  amountUSD_gte?: InputMaybe<Scalars['BigDecimal']>;
  amountUSD_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  amountUSD_lt?: InputMaybe<Scalars['BigDecimal']>;
  amountUSD_lte?: InputMaybe<Scalars['BigDecimal']>;
  amountUSD_not?: InputMaybe<Scalars['BigDecimal']>;
  amountUSD_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  and?: InputMaybe<Array<InputMaybe<Flash_Filter>>>;
  id?: InputMaybe<Scalars['ID']>;
  id_gt?: InputMaybe<Scalars['ID']>;
  id_gte?: InputMaybe<Scalars['ID']>;
  id_in?: InputMaybe<Array<Scalars['ID']>>;
  id_lt?: InputMaybe<Scalars['ID']>;
  id_lte?: InputMaybe<Scalars['ID']>;
  id_not?: InputMaybe<Scalars['ID']>;
  id_not_in?: InputMaybe<Array<Scalars['ID']>>;
  logIndex?: InputMaybe<Scalars['BigInt']>;
  logIndex_gt?: InputMaybe<Scalars['BigInt']>;
  logIndex_gte?: InputMaybe<Scalars['BigInt']>;
  logIndex_in?: InputMaybe<Array<Scalars['BigInt']>>;
  logIndex_lt?: InputMaybe<Scalars['BigInt']>;
  logIndex_lte?: InputMaybe<Scalars['BigInt']>;
  logIndex_not?: InputMaybe<Scalars['BigInt']>;
  logIndex_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
  or?: InputMaybe<Array<InputMaybe<Flash_Filter>>>;
  pool?: InputMaybe<Scalars['String']>;
  pool_?: InputMaybe<Pool_Filter>;
  pool_contains?: InputMaybe<Scalars['String']>;
  pool_contains_nocase?: InputMaybe<Scalars['String']>;
  pool_ends_with?: InputMaybe<Scalars['String']>;
  pool_ends_with_nocase?: InputMaybe<Scalars['String']>;
  pool_gt?: InputMaybe<Scalars['String']>;
  pool_gte?: InputMaybe<Scalars['String']>;
  pool_in?: InputMaybe<Array<Scalars['String']>>;
  pool_lt?: InputMaybe<Scalars['String']>;
  pool_lte?: InputMaybe<Scalars['String']>;
  pool_not?: InputMaybe<Scalars['String']>;
  pool_not_contains?: InputMaybe<Scalars['String']>;
  pool_not_contains_nocase?: InputMaybe<Scalars['String']>;
  pool_not_ends_with?: InputMaybe<Scalars['String']>;
  pool_not_ends_with_nocase?: InputMaybe<Scalars['String']>;
  pool_not_in?: InputMaybe<Array<Scalars['String']>>;
  pool_not_starts_with?: InputMaybe<Scalars['String']>;
  pool_not_starts_with_nocase?: InputMaybe<Scalars['String']>;
  pool_starts_with?: InputMaybe<Scalars['String']>;
  pool_starts_with_nocase?: InputMaybe<Scalars['String']>;
  recipient?: InputMaybe<Scalars['Bytes']>;
  recipient_contains?: InputMaybe<Scalars['Bytes']>;
  recipient_gt?: InputMaybe<Scalars['Bytes']>;
  recipient_gte?: InputMaybe<Scalars['Bytes']>;
  recipient_in?: InputMaybe<Array<Scalars['Bytes']>>;
  recipient_lt?: InputMaybe<Scalars['Bytes']>;
  recipient_lte?: InputMaybe<Scalars['Bytes']>;
  recipient_not?: InputMaybe<Scalars['Bytes']>;
  recipient_not_contains?: InputMaybe<Scalars['Bytes']>;
  recipient_not_in?: InputMaybe<Array<Scalars['Bytes']>>;
  sender?: InputMaybe<Scalars['Bytes']>;
  sender_contains?: InputMaybe<Scalars['Bytes']>;
  sender_gt?: InputMaybe<Scalars['Bytes']>;
  sender_gte?: InputMaybe<Scalars['Bytes']>;
  sender_in?: InputMaybe<Array<Scalars['Bytes']>>;
  sender_lt?: InputMaybe<Scalars['Bytes']>;
  sender_lte?: InputMaybe<Scalars['Bytes']>;
  sender_not?: InputMaybe<Scalars['Bytes']>;
  sender_not_contains?: InputMaybe<Scalars['Bytes']>;
  sender_not_in?: InputMaybe<Array<Scalars['Bytes']>>;
  timestamp?: InputMaybe<Scalars['BigInt']>;
  timestamp_gt?: InputMaybe<Scalars['BigInt']>;
  timestamp_gte?: InputMaybe<Scalars['BigInt']>;
  timestamp_in?: InputMaybe<Array<Scalars['BigInt']>>;
  timestamp_lt?: InputMaybe<Scalars['BigInt']>;
  timestamp_lte?: InputMaybe<Scalars['BigInt']>;
  timestamp_not?: InputMaybe<Scalars['BigInt']>;
  timestamp_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
  transaction?: InputMaybe<Scalars['String']>;
  transaction_?: InputMaybe<Transaction_Filter>;
  transaction_contains?: InputMaybe<Scalars['String']>;
  transaction_contains_nocase?: InputMaybe<Scalars['String']>;
  transaction_ends_with?: InputMaybe<Scalars['String']>;
  transaction_ends_with_nocase?: InputMaybe<Scalars['String']>;
  transaction_gt?: InputMaybe<Scalars['String']>;
  transaction_gte?: InputMaybe<Scalars['String']>;
  transaction_in?: InputMaybe<Array<Scalars['String']>>;
  transaction_lt?: InputMaybe<Scalars['String']>;
  transaction_lte?: InputMaybe<Scalars['String']>;
  transaction_not?: InputMaybe<Scalars['String']>;
  transaction_not_contains?: InputMaybe<Scalars['String']>;
  transaction_not_contains_nocase?: InputMaybe<Scalars['String']>;
  transaction_not_ends_with?: InputMaybe<Scalars['String']>;
  transaction_not_ends_with_nocase?: InputMaybe<Scalars['String']>;
  transaction_not_in?: InputMaybe<Array<Scalars['String']>>;
  transaction_not_starts_with?: InputMaybe<Scalars['String']>;
  transaction_not_starts_with_nocase?: InputMaybe<Scalars['String']>;
  transaction_starts_with?: InputMaybe<Scalars['String']>;
  transaction_starts_with_nocase?: InputMaybe<Scalars['String']>;
};

export enum Flash_OrderBy {
  Amount0 = 'amount0',
  Amount0Paid = 'amount0Paid',
  Amount1 = 'amount1',
  Amount1Paid = 'amount1Paid',
  AmountUsd = 'amountUSD',
  Id = 'id',
  LogIndex = 'logIndex',
  Pool = 'pool',
  PoolCollectedFeesToken0 = 'pool__collectedFeesToken0',
  PoolCollectedFeesToken1 = 'pool__collectedFeesToken1',
  PoolCollectedFeesUsd = 'pool__collectedFeesUSD',
  PoolCreatedAtBlockNumber = 'pool__createdAtBlockNumber',
  PoolCreatedAtTimestamp = 'pool__createdAtTimestamp',
  PoolFeeTier = 'pool__feeTier',
  PoolFeesUsd = 'pool__feesUSD',
  PoolId = 'pool__id',
  PoolLiquidity = 'pool__liquidity',
  PoolLiquidityProviderCount = 'pool__liquidityProviderCount',
  PoolObservationIndex = 'pool__observationIndex',
  PoolSqrtPrice = 'pool__sqrtPrice',
  PoolTick = 'pool__tick',
  PoolToken0Price = 'pool__token0Price',
  PoolToken1Price = 'pool__token1Price',
  PoolTotalValueLockedEth = 'pool__totalValueLockedETH',
  PoolTotalValueLockedToken0 = 'pool__totalValueLockedToken0',
  PoolTotalValueLockedToken1 = 'pool__totalValueLockedToken1',
  PoolTotalValueLockedUsd = 'pool__totalValueLockedUSD',
  PoolTotalValueLockedUsdUntracked = 'pool__totalValueLockedUSDUntracked',
  PoolTxCount = 'pool__txCount',
  PoolUntrackedVolumeUsd = 'pool__untrackedVolumeUSD',
  PoolVolumeToken0 = 'pool__volumeToken0',
  PoolVolumeToken1 = 'pool__volumeToken1',
  PoolVolumeUsd = 'pool__volumeUSD',
  Recipient = 'recipient',
  Sender = 'sender',
  Timestamp = 'timestamp',
  Transaction = 'transaction',
  TransactionBlockNumber = 'transaction__blockNumber',
  TransactionGasPrice = 'transaction__gasPrice',
  TransactionGasUsed = 'transaction__gasUsed',
  TransactionId = 'transaction__id',
  TransactionTimestamp = 'transaction__timestamp'
}

export type Mint = {
  __typename?: 'Mint';
  amount: Scalars['BigInt'];
  amount0: Scalars['BigDecimal'];
  amount1: Scalars['BigDecimal'];
  amountUSD?: Maybe<Scalars['BigDecimal']>;
  id: Scalars['ID'];
  logIndex?: Maybe<Scalars['BigInt']>;
  origin: Scalars['Bytes'];
  owner: Scalars['Bytes'];
  pool: Pool;
  sender?: Maybe<Scalars['Bytes']>;
  tickLower: Scalars['BigInt'];
  tickUpper: Scalars['BigInt'];
  timestamp: Scalars['BigInt'];
  token0: Token;
  token1: Token;
  transaction: Transaction;
};

export type Mint_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  amount?: InputMaybe<Scalars['BigInt']>;
  amount0?: InputMaybe<Scalars['BigDecimal']>;
  amount0_gt?: InputMaybe<Scalars['BigDecimal']>;
  amount0_gte?: InputMaybe<Scalars['BigDecimal']>;
  amount0_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  amount0_lt?: InputMaybe<Scalars['BigDecimal']>;
  amount0_lte?: InputMaybe<Scalars['BigDecimal']>;
  amount0_not?: InputMaybe<Scalars['BigDecimal']>;
  amount0_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  amount1?: InputMaybe<Scalars['BigDecimal']>;
  amount1_gt?: InputMaybe<Scalars['BigDecimal']>;
  amount1_gte?: InputMaybe<Scalars['BigDecimal']>;
  amount1_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  amount1_lt?: InputMaybe<Scalars['BigDecimal']>;
  amount1_lte?: InputMaybe<Scalars['BigDecimal']>;
  amount1_not?: InputMaybe<Scalars['BigDecimal']>;
  amount1_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  amountUSD?: InputMaybe<Scalars['BigDecimal']>;
  amountUSD_gt?: InputMaybe<Scalars['BigDecimal']>;
  amountUSD_gte?: InputMaybe<Scalars['BigDecimal']>;
  amountUSD_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  amountUSD_lt?: InputMaybe<Scalars['BigDecimal']>;
  amountUSD_lte?: InputMaybe<Scalars['BigDecimal']>;
  amountUSD_not?: InputMaybe<Scalars['BigDecimal']>;
  amountUSD_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  amount_gt?: InputMaybe<Scalars['BigInt']>;
  amount_gte?: InputMaybe<Scalars['BigInt']>;
  amount_in?: InputMaybe<Array<Scalars['BigInt']>>;
  amount_lt?: InputMaybe<Scalars['BigInt']>;
  amount_lte?: InputMaybe<Scalars['BigInt']>;
  amount_not?: InputMaybe<Scalars['BigInt']>;
  amount_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
  and?: InputMaybe<Array<InputMaybe<Mint_Filter>>>;
  id?: InputMaybe<Scalars['ID']>;
  id_gt?: InputMaybe<Scalars['ID']>;
  id_gte?: InputMaybe<Scalars['ID']>;
  id_in?: InputMaybe<Array<Scalars['ID']>>;
  id_lt?: InputMaybe<Scalars['ID']>;
  id_lte?: InputMaybe<Scalars['ID']>;
  id_not?: InputMaybe<Scalars['ID']>;
  id_not_in?: InputMaybe<Array<Scalars['ID']>>;
  logIndex?: InputMaybe<Scalars['BigInt']>;
  logIndex_gt?: InputMaybe<Scalars['BigInt']>;
  logIndex_gte?: InputMaybe<Scalars['BigInt']>;
  logIndex_in?: InputMaybe<Array<Scalars['BigInt']>>;
  logIndex_lt?: InputMaybe<Scalars['BigInt']>;
  logIndex_lte?: InputMaybe<Scalars['BigInt']>;
  logIndex_not?: InputMaybe<Scalars['BigInt']>;
  logIndex_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
  or?: InputMaybe<Array<InputMaybe<Mint_Filter>>>;
  origin?: InputMaybe<Scalars['Bytes']>;
  origin_contains?: InputMaybe<Scalars['Bytes']>;
  origin_gt?: InputMaybe<Scalars['Bytes']>;
  origin_gte?: InputMaybe<Scalars['Bytes']>;
  origin_in?: InputMaybe<Array<Scalars['Bytes']>>;
  origin_lt?: InputMaybe<Scalars['Bytes']>;
  origin_lte?: InputMaybe<Scalars['Bytes']>;
  origin_not?: InputMaybe<Scalars['Bytes']>;
  origin_not_contains?: InputMaybe<Scalars['Bytes']>;
  origin_not_in?: InputMaybe<Array<Scalars['Bytes']>>;
  owner?: InputMaybe<Scalars['Bytes']>;
  owner_contains?: InputMaybe<Scalars['Bytes']>;
  owner_gt?: InputMaybe<Scalars['Bytes']>;
  owner_gte?: InputMaybe<Scalars['Bytes']>;
  owner_in?: InputMaybe<Array<Scalars['Bytes']>>;
  owner_lt?: InputMaybe<Scalars['Bytes']>;
  owner_lte?: InputMaybe<Scalars['Bytes']>;
  owner_not?: InputMaybe<Scalars['Bytes']>;
  owner_not_contains?: InputMaybe<Scalars['Bytes']>;
  owner_not_in?: InputMaybe<Array<Scalars['Bytes']>>;
  pool?: InputMaybe<Scalars['String']>;
  pool_?: InputMaybe<Pool_Filter>;
  pool_contains?: InputMaybe<Scalars['String']>;
  pool_contains_nocase?: InputMaybe<Scalars['String']>;
  pool_ends_with?: InputMaybe<Scalars['String']>;
  pool_ends_with_nocase?: InputMaybe<Scalars['String']>;
  pool_gt?: InputMaybe<Scalars['String']>;
  pool_gte?: InputMaybe<Scalars['String']>;
  pool_in?: InputMaybe<Array<Scalars['String']>>;
  pool_lt?: InputMaybe<Scalars['String']>;
  pool_lte?: InputMaybe<Scalars['String']>;
  pool_not?: InputMaybe<Scalars['String']>;
  pool_not_contains?: InputMaybe<Scalars['String']>;
  pool_not_contains_nocase?: InputMaybe<Scalars['String']>;
  pool_not_ends_with?: InputMaybe<Scalars['String']>;
  pool_not_ends_with_nocase?: InputMaybe<Scalars['String']>;
  pool_not_in?: InputMaybe<Array<Scalars['String']>>;
  pool_not_starts_with?: InputMaybe<Scalars['String']>;
  pool_not_starts_with_nocase?: InputMaybe<Scalars['String']>;
  pool_starts_with?: InputMaybe<Scalars['String']>;
  pool_starts_with_nocase?: InputMaybe<Scalars['String']>;
  sender?: InputMaybe<Scalars['Bytes']>;
  sender_contains?: InputMaybe<Scalars['Bytes']>;
  sender_gt?: InputMaybe<Scalars['Bytes']>;
  sender_gte?: InputMaybe<Scalars['Bytes']>;
  sender_in?: InputMaybe<Array<Scalars['Bytes']>>;
  sender_lt?: InputMaybe<Scalars['Bytes']>;
  sender_lte?: InputMaybe<Scalars['Bytes']>;
  sender_not?: InputMaybe<Scalars['Bytes']>;
  sender_not_contains?: InputMaybe<Scalars['Bytes']>;
  sender_not_in?: InputMaybe<Array<Scalars['Bytes']>>;
  tickLower?: InputMaybe<Scalars['BigInt']>;
  tickLower_gt?: InputMaybe<Scalars['BigInt']>;
  tickLower_gte?: InputMaybe<Scalars['BigInt']>;
  tickLower_in?: InputMaybe<Array<Scalars['BigInt']>>;
  tickLower_lt?: InputMaybe<Scalars['BigInt']>;
  tickLower_lte?: InputMaybe<Scalars['BigInt']>;
  tickLower_not?: InputMaybe<Scalars['BigInt']>;
  tickLower_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
  tickUpper?: InputMaybe<Scalars['BigInt']>;
  tickUpper_gt?: InputMaybe<Scalars['BigInt']>;
  tickUpper_gte?: InputMaybe<Scalars['BigInt']>;
  tickUpper_in?: InputMaybe<Array<Scalars['BigInt']>>;
  tickUpper_lt?: InputMaybe<Scalars['BigInt']>;
  tickUpper_lte?: InputMaybe<Scalars['BigInt']>;
  tickUpper_not?: InputMaybe<Scalars['BigInt']>;
  tickUpper_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
  timestamp?: InputMaybe<Scalars['BigInt']>;
  timestamp_gt?: InputMaybe<Scalars['BigInt']>;
  timestamp_gte?: InputMaybe<Scalars['BigInt']>;
  timestamp_in?: InputMaybe<Array<Scalars['BigInt']>>;
  timestamp_lt?: InputMaybe<Scalars['BigInt']>;
  timestamp_lte?: InputMaybe<Scalars['BigInt']>;
  timestamp_not?: InputMaybe<Scalars['BigInt']>;
  timestamp_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
  token0?: InputMaybe<Scalars['String']>;
  token0_?: InputMaybe<Token_Filter>;
  token0_contains?: InputMaybe<Scalars['String']>;
  token0_contains_nocase?: InputMaybe<Scalars['String']>;
  token0_ends_with?: InputMaybe<Scalars['String']>;
  token0_ends_with_nocase?: InputMaybe<Scalars['String']>;
  token0_gt?: InputMaybe<Scalars['String']>;
  token0_gte?: InputMaybe<Scalars['String']>;
  token0_in?: InputMaybe<Array<Scalars['String']>>;
  token0_lt?: InputMaybe<Scalars['String']>;
  token0_lte?: InputMaybe<Scalars['String']>;
  token0_not?: InputMaybe<Scalars['String']>;
  token0_not_contains?: InputMaybe<Scalars['String']>;
  token0_not_contains_nocase?: InputMaybe<Scalars['String']>;
  token0_not_ends_with?: InputMaybe<Scalars['String']>;
  token0_not_ends_with_nocase?: InputMaybe<Scalars['String']>;
  token0_not_in?: InputMaybe<Array<Scalars['String']>>;
  token0_not_starts_with?: InputMaybe<Scalars['String']>;
  token0_not_starts_with_nocase?: InputMaybe<Scalars['String']>;
  token0_starts_with?: InputMaybe<Scalars['String']>;
  token0_starts_with_nocase?: InputMaybe<Scalars['String']>;
  token1?: InputMaybe<Scalars['String']>;
  token1_?: InputMaybe<Token_Filter>;
  token1_contains?: InputMaybe<Scalars['String']>;
  token1_contains_nocase?: InputMaybe<Scalars['String']>;
  token1_ends_with?: InputMaybe<Scalars['String']>;
  token1_ends_with_nocase?: InputMaybe<Scalars['String']>;
  token1_gt?: InputMaybe<Scalars['String']>;
  token1_gte?: InputMaybe<Scalars['String']>;
  token1_in?: InputMaybe<Array<Scalars['String']>>;
  token1_lt?: InputMaybe<Scalars['String']>;
  token1_lte?: InputMaybe<Scalars['String']>;
  token1_not?: InputMaybe<Scalars['String']>;
  token1_not_contains?: InputMaybe<Scalars['String']>;
  token1_not_contains_nocase?: InputMaybe<Scalars['String']>;
  token1_not_ends_with?: InputMaybe<Scalars['String']>;
  token1_not_ends_with_nocase?: InputMaybe<Scalars['String']>;
  token1_not_in?: InputMaybe<Array<Scalars['String']>>;
  token1_not_starts_with?: InputMaybe<Scalars['String']>;
  token1_not_starts_with_nocase?: InputMaybe<Scalars['String']>;
  token1_starts_with?: InputMaybe<Scalars['String']>;
  token1_starts_with_nocase?: InputMaybe<Scalars['String']>;
  transaction?: InputMaybe<Scalars['String']>;
  transaction_?: InputMaybe<Transaction_Filter>;
  transaction_contains?: InputMaybe<Scalars['String']>;
  transaction_contains_nocase?: InputMaybe<Scalars['String']>;
  transaction_ends_with?: InputMaybe<Scalars['String']>;
  transaction_ends_with_nocase?: InputMaybe<Scalars['String']>;
  transaction_gt?: InputMaybe<Scalars['String']>;
  transaction_gte?: InputMaybe<Scalars['String']>;
  transaction_in?: InputMaybe<Array<Scalars['String']>>;
  transaction_lt?: InputMaybe<Scalars['String']>;
  transaction_lte?: InputMaybe<Scalars['String']>;
  transaction_not?: InputMaybe<Scalars['String']>;
  transaction_not_contains?: InputMaybe<Scalars['String']>;
  transaction_not_contains_nocase?: InputMaybe<Scalars['String']>;
  transaction_not_ends_with?: InputMaybe<Scalars['String']>;
  transaction_not_ends_with_nocase?: InputMaybe<Scalars['String']>;
  transaction_not_in?: InputMaybe<Array<Scalars['String']>>;
  transaction_not_starts_with?: InputMaybe<Scalars['String']>;
  transaction_not_starts_with_nocase?: InputMaybe<Scalars['String']>;
  transaction_starts_with?: InputMaybe<Scalars['String']>;
  transaction_starts_with_nocase?: InputMaybe<Scalars['String']>;
};

export enum Mint_OrderBy {
  Amount = 'amount',
  Amount0 = 'amount0',
  Amount1 = 'amount1',
  AmountUsd = 'amountUSD',
  Id = 'id',
  LogIndex = 'logIndex',
  Origin = 'origin',
  Owner = 'owner',
  Pool = 'pool',
  PoolCollectedFeesToken0 = 'pool__collectedFeesToken0',
  PoolCollectedFeesToken1 = 'pool__collectedFeesToken1',
  PoolCollectedFeesUsd = 'pool__collectedFeesUSD',
  PoolCreatedAtBlockNumber = 'pool__createdAtBlockNumber',
  PoolCreatedAtTimestamp = 'pool__createdAtTimestamp',
  PoolFeeTier = 'pool__feeTier',
  PoolFeesUsd = 'pool__feesUSD',
  PoolId = 'pool__id',
  PoolLiquidity = 'pool__liquidity',
  PoolLiquidityProviderCount = 'pool__liquidityProviderCount',
  PoolObservationIndex = 'pool__observationIndex',
  PoolSqrtPrice = 'pool__sqrtPrice',
  PoolTick = 'pool__tick',
  PoolToken0Price = 'pool__token0Price',
  PoolToken1Price = 'pool__token1Price',
  PoolTotalValueLockedEth = 'pool__totalValueLockedETH',
  PoolTotalValueLockedToken0 = 'pool__totalValueLockedToken0',
  PoolTotalValueLockedToken1 = 'pool__totalValueLockedToken1',
  PoolTotalValueLockedUsd = 'pool__totalValueLockedUSD',
  PoolTotalValueLockedUsdUntracked = 'pool__totalValueLockedUSDUntracked',
  PoolTxCount = 'pool__txCount',
  PoolUntrackedVolumeUsd = 'pool__untrackedVolumeUSD',
  PoolVolumeToken0 = 'pool__volumeToken0',
  PoolVolumeToken1 = 'pool__volumeToken1',
  PoolVolumeUsd = 'pool__volumeUSD',
  Sender = 'sender',
  TickLower = 'tickLower',
  TickUpper = 'tickUpper',
  Timestamp = 'timestamp',
  Token0 = 'token0',
  Token0Decimals = 'token0__decimals',
  Token0DerivedEth = 'token0__derivedETH',
  Token0FeesUsd = 'token0__feesUSD',
  Token0Id = 'token0__id',
  Token0Name = 'token0__name',
  Token0PoolCount = 'token0__poolCount',
  Token0Symbol = 'token0__symbol',
  Token0TotalSupply = 'token0__totalSupply',
  Token0TotalValueLocked = 'token0__totalValueLocked',
  Token0TotalValueLockedUsd = 'token0__totalValueLockedUSD',
  Token0TotalValueLockedUsdUntracked = 'token0__totalValueLockedUSDUntracked',
  Token0TxCount = 'token0__txCount',
  Token0UntrackedVolumeUsd = 'token0__untrackedVolumeUSD',
  Token0Volume = 'token0__volume',
  Token0VolumeUsd = 'token0__volumeUSD',
  Token1 = 'token1',
  Token1Decimals = 'token1__decimals',
  Token1DerivedEth = 'token1__derivedETH',
  Token1FeesUsd = 'token1__feesUSD',
  Token1Id = 'token1__id',
  Token1Name = 'token1__name',
  Token1PoolCount = 'token1__poolCount',
  Token1Symbol = 'token1__symbol',
  Token1TotalSupply = 'token1__totalSupply',
  Token1TotalValueLocked = 'token1__totalValueLocked',
  Token1TotalValueLockedUsd = 'token1__totalValueLockedUSD',
  Token1TotalValueLockedUsdUntracked = 'token1__totalValueLockedUSDUntracked',
  Token1TxCount = 'token1__txCount',
  Token1UntrackedVolumeUsd = 'token1__untrackedVolumeUSD',
  Token1Volume = 'token1__volume',
  Token1VolumeUsd = 'token1__volumeUSD',
  Transaction = 'transaction',
  TransactionBlockNumber = 'transaction__blockNumber',
  TransactionGasPrice = 'transaction__gasPrice',
  TransactionGasUsed = 'transaction__gasUsed',
  TransactionId = 'transaction__id',
  TransactionTimestamp = 'transaction__timestamp'
}

/** Defines the order direction, either ascending or descending */
export enum OrderDirection {
  Asc = 'asc',
  Desc = 'desc'
}

export type Pool = {
  __typename?: 'Pool';
  burns: Array<Burn>;
  collectedFeesToken0: Scalars['BigDecimal'];
  collectedFeesToken1: Scalars['BigDecimal'];
  collectedFeesUSD: Scalars['BigDecimal'];
  collects: Array<Collect>;
  createdAtBlockNumber: Scalars['BigInt'];
  createdAtTimestamp: Scalars['BigInt'];
  feeTier: Scalars['BigInt'];
  feesUSD: Scalars['BigDecimal'];
  id: Scalars['Bytes'];
  liquidity: Scalars['BigInt'];
  liquidityProviderCount: Scalars['BigInt'];
  mints: Array<Mint>;
  observationIndex: Scalars['BigInt'];
  poolDayData: Array<PoolDayData>;
  poolHourData: Array<PoolHourData>;
  sqrtPrice: Scalars['BigInt'];
  swaps: Array<Swap>;
  tick?: Maybe<Scalars['BigInt']>;
  ticks: Array<Tick>;
  token0: Token;
  token0Price: Scalars['BigDecimal'];
  token1: Token;
  token1Price: Scalars['BigDecimal'];
  totalValueLockedETH: Scalars['BigDecimal'];
  totalValueLockedToken0: Scalars['BigDecimal'];
  totalValueLockedToken1: Scalars['BigDecimal'];
  totalValueLockedUSD: Scalars['BigDecimal'];
  totalValueLockedUSDUntracked: Scalars['BigDecimal'];
  txCount: Scalars['BigInt'];
  untrackedVolumeUSD: Scalars['BigDecimal'];
  volumeToken0: Scalars['BigDecimal'];
  volumeToken1: Scalars['BigDecimal'];
  volumeUSD: Scalars['BigDecimal'];
};


export type PoolBurnsArgs = {
  first?: InputMaybe<Scalars['Int']>;
  orderBy?: InputMaybe<Burn_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']>;
  where?: InputMaybe<Burn_Filter>;
};


export type PoolCollectsArgs = {
  first?: InputMaybe<Scalars['Int']>;
  orderBy?: InputMaybe<Collect_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']>;
  where?: InputMaybe<Collect_Filter>;
};


export type PoolMintsArgs = {
  first?: InputMaybe<Scalars['Int']>;
  orderBy?: InputMaybe<Mint_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']>;
  where?: InputMaybe<Mint_Filter>;
};


export type PoolPoolDayDataArgs = {
  first?: InputMaybe<Scalars['Int']>;
  orderBy?: InputMaybe<PoolDayData_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']>;
  where?: InputMaybe<PoolDayData_Filter>;
};


export type PoolPoolHourDataArgs = {
  first?: InputMaybe<Scalars['Int']>;
  orderBy?: InputMaybe<PoolHourData_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']>;
  where?: InputMaybe<PoolHourData_Filter>;
};


export type PoolSwapsArgs = {
  first?: InputMaybe<Scalars['Int']>;
  orderBy?: InputMaybe<Swap_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']>;
  where?: InputMaybe<Swap_Filter>;
};


export type PoolTicksArgs = {
  first?: InputMaybe<Scalars['Int']>;
  orderBy?: InputMaybe<Tick_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']>;
  where?: InputMaybe<Tick_Filter>;
};

export type PoolDayData = {
  __typename?: 'PoolDayData';
  close: Scalars['BigDecimal'];
  date: Scalars['Int'];
  feesUSD: Scalars['BigDecimal'];
  high: Scalars['BigDecimal'];
  id: Scalars['ID'];
  liquidity: Scalars['BigInt'];
  low: Scalars['BigDecimal'];
  open: Scalars['BigDecimal'];
  pool: Pool;
  sqrtPrice: Scalars['BigInt'];
  tick?: Maybe<Scalars['BigInt']>;
  token0Price: Scalars['BigDecimal'];
  token1Price: Scalars['BigDecimal'];
  tvlUSD: Scalars['BigDecimal'];
  txCount: Scalars['BigInt'];
  volumeToken0: Scalars['BigDecimal'];
  volumeToken1: Scalars['BigDecimal'];
  volumeUSD: Scalars['BigDecimal'];
};

export type PoolDayData_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<PoolDayData_Filter>>>;
  close?: InputMaybe<Scalars['BigDecimal']>;
  close_gt?: InputMaybe<Scalars['BigDecimal']>;
  close_gte?: InputMaybe<Scalars['BigDecimal']>;
  close_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  close_lt?: InputMaybe<Scalars['BigDecimal']>;
  close_lte?: InputMaybe<Scalars['BigDecimal']>;
  close_not?: InputMaybe<Scalars['BigDecimal']>;
  close_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  date?: InputMaybe<Scalars['Int']>;
  date_gt?: InputMaybe<Scalars['Int']>;
  date_gte?: InputMaybe<Scalars['Int']>;
  date_in?: InputMaybe<Array<Scalars['Int']>>;
  date_lt?: InputMaybe<Scalars['Int']>;
  date_lte?: InputMaybe<Scalars['Int']>;
  date_not?: InputMaybe<Scalars['Int']>;
  date_not_in?: InputMaybe<Array<Scalars['Int']>>;
  feesUSD?: InputMaybe<Scalars['BigDecimal']>;
  feesUSD_gt?: InputMaybe<Scalars['BigDecimal']>;
  feesUSD_gte?: InputMaybe<Scalars['BigDecimal']>;
  feesUSD_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  feesUSD_lt?: InputMaybe<Scalars['BigDecimal']>;
  feesUSD_lte?: InputMaybe<Scalars['BigDecimal']>;
  feesUSD_not?: InputMaybe<Scalars['BigDecimal']>;
  feesUSD_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  high?: InputMaybe<Scalars['BigDecimal']>;
  high_gt?: InputMaybe<Scalars['BigDecimal']>;
  high_gte?: InputMaybe<Scalars['BigDecimal']>;
  high_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  high_lt?: InputMaybe<Scalars['BigDecimal']>;
  high_lte?: InputMaybe<Scalars['BigDecimal']>;
  high_not?: InputMaybe<Scalars['BigDecimal']>;
  high_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  id?: InputMaybe<Scalars['ID']>;
  id_gt?: InputMaybe<Scalars['ID']>;
  id_gte?: InputMaybe<Scalars['ID']>;
  id_in?: InputMaybe<Array<Scalars['ID']>>;
  id_lt?: InputMaybe<Scalars['ID']>;
  id_lte?: InputMaybe<Scalars['ID']>;
  id_not?: InputMaybe<Scalars['ID']>;
  id_not_in?: InputMaybe<Array<Scalars['ID']>>;
  liquidity?: InputMaybe<Scalars['BigInt']>;
  liquidity_gt?: InputMaybe<Scalars['BigInt']>;
  liquidity_gte?: InputMaybe<Scalars['BigInt']>;
  liquidity_in?: InputMaybe<Array<Scalars['BigInt']>>;
  liquidity_lt?: InputMaybe<Scalars['BigInt']>;
  liquidity_lte?: InputMaybe<Scalars['BigInt']>;
  liquidity_not?: InputMaybe<Scalars['BigInt']>;
  liquidity_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
  low?: InputMaybe<Scalars['BigDecimal']>;
  low_gt?: InputMaybe<Scalars['BigDecimal']>;
  low_gte?: InputMaybe<Scalars['BigDecimal']>;
  low_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  low_lt?: InputMaybe<Scalars['BigDecimal']>;
  low_lte?: InputMaybe<Scalars['BigDecimal']>;
  low_not?: InputMaybe<Scalars['BigDecimal']>;
  low_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  open?: InputMaybe<Scalars['BigDecimal']>;
  open_gt?: InputMaybe<Scalars['BigDecimal']>;
  open_gte?: InputMaybe<Scalars['BigDecimal']>;
  open_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  open_lt?: InputMaybe<Scalars['BigDecimal']>;
  open_lte?: InputMaybe<Scalars['BigDecimal']>;
  open_not?: InputMaybe<Scalars['BigDecimal']>;
  open_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  or?: InputMaybe<Array<InputMaybe<PoolDayData_Filter>>>;
  pool?: InputMaybe<Scalars['String']>;
  pool_?: InputMaybe<Pool_Filter>;
  pool_contains?: InputMaybe<Scalars['String']>;
  pool_contains_nocase?: InputMaybe<Scalars['String']>;
  pool_ends_with?: InputMaybe<Scalars['String']>;
  pool_ends_with_nocase?: InputMaybe<Scalars['String']>;
  pool_gt?: InputMaybe<Scalars['String']>;
  pool_gte?: InputMaybe<Scalars['String']>;
  pool_in?: InputMaybe<Array<Scalars['String']>>;
  pool_lt?: InputMaybe<Scalars['String']>;
  pool_lte?: InputMaybe<Scalars['String']>;
  pool_not?: InputMaybe<Scalars['String']>;
  pool_not_contains?: InputMaybe<Scalars['String']>;
  pool_not_contains_nocase?: InputMaybe<Scalars['String']>;
  pool_not_ends_with?: InputMaybe<Scalars['String']>;
  pool_not_ends_with_nocase?: InputMaybe<Scalars['String']>;
  pool_not_in?: InputMaybe<Array<Scalars['String']>>;
  pool_not_starts_with?: InputMaybe<Scalars['String']>;
  pool_not_starts_with_nocase?: InputMaybe<Scalars['String']>;
  pool_starts_with?: InputMaybe<Scalars['String']>;
  pool_starts_with_nocase?: InputMaybe<Scalars['String']>;
  sqrtPrice?: InputMaybe<Scalars['BigInt']>;
  sqrtPrice_gt?: InputMaybe<Scalars['BigInt']>;
  sqrtPrice_gte?: InputMaybe<Scalars['BigInt']>;
  sqrtPrice_in?: InputMaybe<Array<Scalars['BigInt']>>;
  sqrtPrice_lt?: InputMaybe<Scalars['BigInt']>;
  sqrtPrice_lte?: InputMaybe<Scalars['BigInt']>;
  sqrtPrice_not?: InputMaybe<Scalars['BigInt']>;
  sqrtPrice_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
  tick?: InputMaybe<Scalars['BigInt']>;
  tick_gt?: InputMaybe<Scalars['BigInt']>;
  tick_gte?: InputMaybe<Scalars['BigInt']>;
  tick_in?: InputMaybe<Array<Scalars['BigInt']>>;
  tick_lt?: InputMaybe<Scalars['BigInt']>;
  tick_lte?: InputMaybe<Scalars['BigInt']>;
  tick_not?: InputMaybe<Scalars['BigInt']>;
  tick_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
  token0Price?: InputMaybe<Scalars['BigDecimal']>;
  token0Price_gt?: InputMaybe<Scalars['BigDecimal']>;
  token0Price_gte?: InputMaybe<Scalars['BigDecimal']>;
  token0Price_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  token0Price_lt?: InputMaybe<Scalars['BigDecimal']>;
  token0Price_lte?: InputMaybe<Scalars['BigDecimal']>;
  token0Price_not?: InputMaybe<Scalars['BigDecimal']>;
  token0Price_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  token1Price?: InputMaybe<Scalars['BigDecimal']>;
  token1Price_gt?: InputMaybe<Scalars['BigDecimal']>;
  token1Price_gte?: InputMaybe<Scalars['BigDecimal']>;
  token1Price_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  token1Price_lt?: InputMaybe<Scalars['BigDecimal']>;
  token1Price_lte?: InputMaybe<Scalars['BigDecimal']>;
  token1Price_not?: InputMaybe<Scalars['BigDecimal']>;
  token1Price_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  tvlUSD?: InputMaybe<Scalars['BigDecimal']>;
  tvlUSD_gt?: InputMaybe<Scalars['BigDecimal']>;
  tvlUSD_gte?: InputMaybe<Scalars['BigDecimal']>;
  tvlUSD_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  tvlUSD_lt?: InputMaybe<Scalars['BigDecimal']>;
  tvlUSD_lte?: InputMaybe<Scalars['BigDecimal']>;
  tvlUSD_not?: InputMaybe<Scalars['BigDecimal']>;
  tvlUSD_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  txCount?: InputMaybe<Scalars['BigInt']>;
  txCount_gt?: InputMaybe<Scalars['BigInt']>;
  txCount_gte?: InputMaybe<Scalars['BigInt']>;
  txCount_in?: InputMaybe<Array<Scalars['BigInt']>>;
  txCount_lt?: InputMaybe<Scalars['BigInt']>;
  txCount_lte?: InputMaybe<Scalars['BigInt']>;
  txCount_not?: InputMaybe<Scalars['BigInt']>;
  txCount_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
  volumeToken0?: InputMaybe<Scalars['BigDecimal']>;
  volumeToken0_gt?: InputMaybe<Scalars['BigDecimal']>;
  volumeToken0_gte?: InputMaybe<Scalars['BigDecimal']>;
  volumeToken0_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  volumeToken0_lt?: InputMaybe<Scalars['BigDecimal']>;
  volumeToken0_lte?: InputMaybe<Scalars['BigDecimal']>;
  volumeToken0_not?: InputMaybe<Scalars['BigDecimal']>;
  volumeToken0_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  volumeToken1?: InputMaybe<Scalars['BigDecimal']>;
  volumeToken1_gt?: InputMaybe<Scalars['BigDecimal']>;
  volumeToken1_gte?: InputMaybe<Scalars['BigDecimal']>;
  volumeToken1_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  volumeToken1_lt?: InputMaybe<Scalars['BigDecimal']>;
  volumeToken1_lte?: InputMaybe<Scalars['BigDecimal']>;
  volumeToken1_not?: InputMaybe<Scalars['BigDecimal']>;
  volumeToken1_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  volumeUSD?: InputMaybe<Scalars['BigDecimal']>;
  volumeUSD_gt?: InputMaybe<Scalars['BigDecimal']>;
  volumeUSD_gte?: InputMaybe<Scalars['BigDecimal']>;
  volumeUSD_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  volumeUSD_lt?: InputMaybe<Scalars['BigDecimal']>;
  volumeUSD_lte?: InputMaybe<Scalars['BigDecimal']>;
  volumeUSD_not?: InputMaybe<Scalars['BigDecimal']>;
  volumeUSD_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
};

export enum PoolDayData_OrderBy {
  Close = 'close',
  Date = 'date',
  FeesUsd = 'feesUSD',
  High = 'high',
  Id = 'id',
  Liquidity = 'liquidity',
  Low = 'low',
  Open = 'open',
  Pool = 'pool',
  PoolCollectedFeesToken0 = 'pool__collectedFeesToken0',
  PoolCollectedFeesToken1 = 'pool__collectedFeesToken1',
  PoolCollectedFeesUsd = 'pool__collectedFeesUSD',
  PoolCreatedAtBlockNumber = 'pool__createdAtBlockNumber',
  PoolCreatedAtTimestamp = 'pool__createdAtTimestamp',
  PoolFeeTier = 'pool__feeTier',
  PoolFeesUsd = 'pool__feesUSD',
  PoolId = 'pool__id',
  PoolLiquidity = 'pool__liquidity',
  PoolLiquidityProviderCount = 'pool__liquidityProviderCount',
  PoolObservationIndex = 'pool__observationIndex',
  PoolSqrtPrice = 'pool__sqrtPrice',
  PoolTick = 'pool__tick',
  PoolToken0Price = 'pool__token0Price',
  PoolToken1Price = 'pool__token1Price',
  PoolTotalValueLockedEth = 'pool__totalValueLockedETH',
  PoolTotalValueLockedToken0 = 'pool__totalValueLockedToken0',
  PoolTotalValueLockedToken1 = 'pool__totalValueLockedToken1',
  PoolTotalValueLockedUsd = 'pool__totalValueLockedUSD',
  PoolTotalValueLockedUsdUntracked = 'pool__totalValueLockedUSDUntracked',
  PoolTxCount = 'pool__txCount',
  PoolUntrackedVolumeUsd = 'pool__untrackedVolumeUSD',
  PoolVolumeToken0 = 'pool__volumeToken0',
  PoolVolumeToken1 = 'pool__volumeToken1',
  PoolVolumeUsd = 'pool__volumeUSD',
  SqrtPrice = 'sqrtPrice',
  Tick = 'tick',
  Token0Price = 'token0Price',
  Token1Price = 'token1Price',
  TvlUsd = 'tvlUSD',
  TxCount = 'txCount',
  VolumeToken0 = 'volumeToken0',
  VolumeToken1 = 'volumeToken1',
  VolumeUsd = 'volumeUSD'
}

export type PoolHourData = {
  __typename?: 'PoolHourData';
  close: Scalars['BigDecimal'];
  feesUSD: Scalars['BigDecimal'];
  high: Scalars['BigDecimal'];
  id: Scalars['ID'];
  liquidity: Scalars['BigInt'];
  low: Scalars['BigDecimal'];
  open: Scalars['BigDecimal'];
  periodStartUnix: Scalars['Int'];
  pool: Pool;
  sqrtPrice: Scalars['BigInt'];
  tick?: Maybe<Scalars['BigInt']>;
  token0Price: Scalars['BigDecimal'];
  token1Price: Scalars['BigDecimal'];
  tvlUSD: Scalars['BigDecimal'];
  txCount: Scalars['BigInt'];
  volumeToken0: Scalars['BigDecimal'];
  volumeToken1: Scalars['BigDecimal'];
  volumeUSD: Scalars['BigDecimal'];
};

export type PoolHourData_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<PoolHourData_Filter>>>;
  close?: InputMaybe<Scalars['BigDecimal']>;
  close_gt?: InputMaybe<Scalars['BigDecimal']>;
  close_gte?: InputMaybe<Scalars['BigDecimal']>;
  close_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  close_lt?: InputMaybe<Scalars['BigDecimal']>;
  close_lte?: InputMaybe<Scalars['BigDecimal']>;
  close_not?: InputMaybe<Scalars['BigDecimal']>;
  close_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  feesUSD?: InputMaybe<Scalars['BigDecimal']>;
  feesUSD_gt?: InputMaybe<Scalars['BigDecimal']>;
  feesUSD_gte?: InputMaybe<Scalars['BigDecimal']>;
  feesUSD_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  feesUSD_lt?: InputMaybe<Scalars['BigDecimal']>;
  feesUSD_lte?: InputMaybe<Scalars['BigDecimal']>;
  feesUSD_not?: InputMaybe<Scalars['BigDecimal']>;
  feesUSD_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  high?: InputMaybe<Scalars['BigDecimal']>;
  high_gt?: InputMaybe<Scalars['BigDecimal']>;
  high_gte?: InputMaybe<Scalars['BigDecimal']>;
  high_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  high_lt?: InputMaybe<Scalars['BigDecimal']>;
  high_lte?: InputMaybe<Scalars['BigDecimal']>;
  high_not?: InputMaybe<Scalars['BigDecimal']>;
  high_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  id?: InputMaybe<Scalars['ID']>;
  id_gt?: InputMaybe<Scalars['ID']>;
  id_gte?: InputMaybe<Scalars['ID']>;
  id_in?: InputMaybe<Array<Scalars['ID']>>;
  id_lt?: InputMaybe<Scalars['ID']>;
  id_lte?: InputMaybe<Scalars['ID']>;
  id_not?: InputMaybe<Scalars['ID']>;
  id_not_in?: InputMaybe<Array<Scalars['ID']>>;
  liquidity?: InputMaybe<Scalars['BigInt']>;
  liquidity_gt?: InputMaybe<Scalars['BigInt']>;
  liquidity_gte?: InputMaybe<Scalars['BigInt']>;
  liquidity_in?: InputMaybe<Array<Scalars['BigInt']>>;
  liquidity_lt?: InputMaybe<Scalars['BigInt']>;
  liquidity_lte?: InputMaybe<Scalars['BigInt']>;
  liquidity_not?: InputMaybe<Scalars['BigInt']>;
  liquidity_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
  low?: InputMaybe<Scalars['BigDecimal']>;
  low_gt?: InputMaybe<Scalars['BigDecimal']>;
  low_gte?: InputMaybe<Scalars['BigDecimal']>;
  low_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  low_lt?: InputMaybe<Scalars['BigDecimal']>;
  low_lte?: InputMaybe<Scalars['BigDecimal']>;
  low_not?: InputMaybe<Scalars['BigDecimal']>;
  low_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  open?: InputMaybe<Scalars['BigDecimal']>;
  open_gt?: InputMaybe<Scalars['BigDecimal']>;
  open_gte?: InputMaybe<Scalars['BigDecimal']>;
  open_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  open_lt?: InputMaybe<Scalars['BigDecimal']>;
  open_lte?: InputMaybe<Scalars['BigDecimal']>;
  open_not?: InputMaybe<Scalars['BigDecimal']>;
  open_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  or?: InputMaybe<Array<InputMaybe<PoolHourData_Filter>>>;
  periodStartUnix?: InputMaybe<Scalars['Int']>;
  periodStartUnix_gt?: InputMaybe<Scalars['Int']>;
  periodStartUnix_gte?: InputMaybe<Scalars['Int']>;
  periodStartUnix_in?: InputMaybe<Array<Scalars['Int']>>;
  periodStartUnix_lt?: InputMaybe<Scalars['Int']>;
  periodStartUnix_lte?: InputMaybe<Scalars['Int']>;
  periodStartUnix_not?: InputMaybe<Scalars['Int']>;
  periodStartUnix_not_in?: InputMaybe<Array<Scalars['Int']>>;
  pool?: InputMaybe<Scalars['String']>;
  pool_?: InputMaybe<Pool_Filter>;
  pool_contains?: InputMaybe<Scalars['String']>;
  pool_contains_nocase?: InputMaybe<Scalars['String']>;
  pool_ends_with?: InputMaybe<Scalars['String']>;
  pool_ends_with_nocase?: InputMaybe<Scalars['String']>;
  pool_gt?: InputMaybe<Scalars['String']>;
  pool_gte?: InputMaybe<Scalars['String']>;
  pool_in?: InputMaybe<Array<Scalars['String']>>;
  pool_lt?: InputMaybe<Scalars['String']>;
  pool_lte?: InputMaybe<Scalars['String']>;
  pool_not?: InputMaybe<Scalars['String']>;
  pool_not_contains?: InputMaybe<Scalars['String']>;
  pool_not_contains_nocase?: InputMaybe<Scalars['String']>;
  pool_not_ends_with?: InputMaybe<Scalars['String']>;
  pool_not_ends_with_nocase?: InputMaybe<Scalars['String']>;
  pool_not_in?: InputMaybe<Array<Scalars['String']>>;
  pool_not_starts_with?: InputMaybe<Scalars['String']>;
  pool_not_starts_with_nocase?: InputMaybe<Scalars['String']>;
  pool_starts_with?: InputMaybe<Scalars['String']>;
  pool_starts_with_nocase?: InputMaybe<Scalars['String']>;
  sqrtPrice?: InputMaybe<Scalars['BigInt']>;
  sqrtPrice_gt?: InputMaybe<Scalars['BigInt']>;
  sqrtPrice_gte?: InputMaybe<Scalars['BigInt']>;
  sqrtPrice_in?: InputMaybe<Array<Scalars['BigInt']>>;
  sqrtPrice_lt?: InputMaybe<Scalars['BigInt']>;
  sqrtPrice_lte?: InputMaybe<Scalars['BigInt']>;
  sqrtPrice_not?: InputMaybe<Scalars['BigInt']>;
  sqrtPrice_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
  tick?: InputMaybe<Scalars['BigInt']>;
  tick_gt?: InputMaybe<Scalars['BigInt']>;
  tick_gte?: InputMaybe<Scalars['BigInt']>;
  tick_in?: InputMaybe<Array<Scalars['BigInt']>>;
  tick_lt?: InputMaybe<Scalars['BigInt']>;
  tick_lte?: InputMaybe<Scalars['BigInt']>;
  tick_not?: InputMaybe<Scalars['BigInt']>;
  tick_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
  token0Price?: InputMaybe<Scalars['BigDecimal']>;
  token0Price_gt?: InputMaybe<Scalars['BigDecimal']>;
  token0Price_gte?: InputMaybe<Scalars['BigDecimal']>;
  token0Price_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  token0Price_lt?: InputMaybe<Scalars['BigDecimal']>;
  token0Price_lte?: InputMaybe<Scalars['BigDecimal']>;
  token0Price_not?: InputMaybe<Scalars['BigDecimal']>;
  token0Price_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  token1Price?: InputMaybe<Scalars['BigDecimal']>;
  token1Price_gt?: InputMaybe<Scalars['BigDecimal']>;
  token1Price_gte?: InputMaybe<Scalars['BigDecimal']>;
  token1Price_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  token1Price_lt?: InputMaybe<Scalars['BigDecimal']>;
  token1Price_lte?: InputMaybe<Scalars['BigDecimal']>;
  token1Price_not?: InputMaybe<Scalars['BigDecimal']>;
  token1Price_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  tvlUSD?: InputMaybe<Scalars['BigDecimal']>;
  tvlUSD_gt?: InputMaybe<Scalars['BigDecimal']>;
  tvlUSD_gte?: InputMaybe<Scalars['BigDecimal']>;
  tvlUSD_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  tvlUSD_lt?: InputMaybe<Scalars['BigDecimal']>;
  tvlUSD_lte?: InputMaybe<Scalars['BigDecimal']>;
  tvlUSD_not?: InputMaybe<Scalars['BigDecimal']>;
  tvlUSD_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  txCount?: InputMaybe<Scalars['BigInt']>;
  txCount_gt?: InputMaybe<Scalars['BigInt']>;
  txCount_gte?: InputMaybe<Scalars['BigInt']>;
  txCount_in?: InputMaybe<Array<Scalars['BigInt']>>;
  txCount_lt?: InputMaybe<Scalars['BigInt']>;
  txCount_lte?: InputMaybe<Scalars['BigInt']>;
  txCount_not?: InputMaybe<Scalars['BigInt']>;
  txCount_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
  volumeToken0?: InputMaybe<Scalars['BigDecimal']>;
  volumeToken0_gt?: InputMaybe<Scalars['BigDecimal']>;
  volumeToken0_gte?: InputMaybe<Scalars['BigDecimal']>;
  volumeToken0_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  volumeToken0_lt?: InputMaybe<Scalars['BigDecimal']>;
  volumeToken0_lte?: InputMaybe<Scalars['BigDecimal']>;
  volumeToken0_not?: InputMaybe<Scalars['BigDecimal']>;
  volumeToken0_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  volumeToken1?: InputMaybe<Scalars['BigDecimal']>;
  volumeToken1_gt?: InputMaybe<Scalars['BigDecimal']>;
  volumeToken1_gte?: InputMaybe<Scalars['BigDecimal']>;
  volumeToken1_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  volumeToken1_lt?: InputMaybe<Scalars['BigDecimal']>;
  volumeToken1_lte?: InputMaybe<Scalars['BigDecimal']>;
  volumeToken1_not?: InputMaybe<Scalars['BigDecimal']>;
  volumeToken1_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  volumeUSD?: InputMaybe<Scalars['BigDecimal']>;
  volumeUSD_gt?: InputMaybe<Scalars['BigDecimal']>;
  volumeUSD_gte?: InputMaybe<Scalars['BigDecimal']>;
  volumeUSD_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  volumeUSD_lt?: InputMaybe<Scalars['BigDecimal']>;
  volumeUSD_lte?: InputMaybe<Scalars['BigDecimal']>;
  volumeUSD_not?: InputMaybe<Scalars['BigDecimal']>;
  volumeUSD_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
};

export enum PoolHourData_OrderBy {
  Close = 'close',
  FeesUsd = 'feesUSD',
  High = 'high',
  Id = 'id',
  Liquidity = 'liquidity',
  Low = 'low',
  Open = 'open',
  PeriodStartUnix = 'periodStartUnix',
  Pool = 'pool',
  PoolCollectedFeesToken0 = 'pool__collectedFeesToken0',
  PoolCollectedFeesToken1 = 'pool__collectedFeesToken1',
  PoolCollectedFeesUsd = 'pool__collectedFeesUSD',
  PoolCreatedAtBlockNumber = 'pool__createdAtBlockNumber',
  PoolCreatedAtTimestamp = 'pool__createdAtTimestamp',
  PoolFeeTier = 'pool__feeTier',
  PoolFeesUsd = 'pool__feesUSD',
  PoolId = 'pool__id',
  PoolLiquidity = 'pool__liquidity',
  PoolLiquidityProviderCount = 'pool__liquidityProviderCount',
  PoolObservationIndex = 'pool__observationIndex',
  PoolSqrtPrice = 'pool__sqrtPrice',
  PoolTick = 'pool__tick',
  PoolToken0Price = 'pool__token0Price',
  PoolToken1Price = 'pool__token1Price',
  PoolTotalValueLockedEth = 'pool__totalValueLockedETH',
  PoolTotalValueLockedToken0 = 'pool__totalValueLockedToken0',
  PoolTotalValueLockedToken1 = 'pool__totalValueLockedToken1',
  PoolTotalValueLockedUsd = 'pool__totalValueLockedUSD',
  PoolTotalValueLockedUsdUntracked = 'pool__totalValueLockedUSDUntracked',
  PoolTxCount = 'pool__txCount',
  PoolUntrackedVolumeUsd = 'pool__untrackedVolumeUSD',
  PoolVolumeToken0 = 'pool__volumeToken0',
  PoolVolumeToken1 = 'pool__volumeToken1',
  PoolVolumeUsd = 'pool__volumeUSD',
  SqrtPrice = 'sqrtPrice',
  Tick = 'tick',
  Token0Price = 'token0Price',
  Token1Price = 'token1Price',
  TvlUsd = 'tvlUSD',
  TxCount = 'txCount',
  VolumeToken0 = 'volumeToken0',
  VolumeToken1 = 'volumeToken1',
  VolumeUsd = 'volumeUSD'
}

export type Pool_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<Pool_Filter>>>;
  burns_?: InputMaybe<Burn_Filter>;
  collectedFeesToken0?: InputMaybe<Scalars['BigDecimal']>;
  collectedFeesToken0_gt?: InputMaybe<Scalars['BigDecimal']>;
  collectedFeesToken0_gte?: InputMaybe<Scalars['BigDecimal']>;
  collectedFeesToken0_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  collectedFeesToken0_lt?: InputMaybe<Scalars['BigDecimal']>;
  collectedFeesToken0_lte?: InputMaybe<Scalars['BigDecimal']>;
  collectedFeesToken0_not?: InputMaybe<Scalars['BigDecimal']>;
  collectedFeesToken0_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  collectedFeesToken1?: InputMaybe<Scalars['BigDecimal']>;
  collectedFeesToken1_gt?: InputMaybe<Scalars['BigDecimal']>;
  collectedFeesToken1_gte?: InputMaybe<Scalars['BigDecimal']>;
  collectedFeesToken1_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  collectedFeesToken1_lt?: InputMaybe<Scalars['BigDecimal']>;
  collectedFeesToken1_lte?: InputMaybe<Scalars['BigDecimal']>;
  collectedFeesToken1_not?: InputMaybe<Scalars['BigDecimal']>;
  collectedFeesToken1_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  collectedFeesUSD?: InputMaybe<Scalars['BigDecimal']>;
  collectedFeesUSD_gt?: InputMaybe<Scalars['BigDecimal']>;
  collectedFeesUSD_gte?: InputMaybe<Scalars['BigDecimal']>;
  collectedFeesUSD_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  collectedFeesUSD_lt?: InputMaybe<Scalars['BigDecimal']>;
  collectedFeesUSD_lte?: InputMaybe<Scalars['BigDecimal']>;
  collectedFeesUSD_not?: InputMaybe<Scalars['BigDecimal']>;
  collectedFeesUSD_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  collects_?: InputMaybe<Collect_Filter>;
  createdAtBlockNumber?: InputMaybe<Scalars['BigInt']>;
  createdAtBlockNumber_gt?: InputMaybe<Scalars['BigInt']>;
  createdAtBlockNumber_gte?: InputMaybe<Scalars['BigInt']>;
  createdAtBlockNumber_in?: InputMaybe<Array<Scalars['BigInt']>>;
  createdAtBlockNumber_lt?: InputMaybe<Scalars['BigInt']>;
  createdAtBlockNumber_lte?: InputMaybe<Scalars['BigInt']>;
  createdAtBlockNumber_not?: InputMaybe<Scalars['BigInt']>;
  createdAtBlockNumber_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
  createdAtTimestamp?: InputMaybe<Scalars['BigInt']>;
  createdAtTimestamp_gt?: InputMaybe<Scalars['BigInt']>;
  createdAtTimestamp_gte?: InputMaybe<Scalars['BigInt']>;
  createdAtTimestamp_in?: InputMaybe<Array<Scalars['BigInt']>>;
  createdAtTimestamp_lt?: InputMaybe<Scalars['BigInt']>;
  createdAtTimestamp_lte?: InputMaybe<Scalars['BigInt']>;
  createdAtTimestamp_not?: InputMaybe<Scalars['BigInt']>;
  createdAtTimestamp_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
  feeTier?: InputMaybe<Scalars['BigInt']>;
  feeTier_gt?: InputMaybe<Scalars['BigInt']>;
  feeTier_gte?: InputMaybe<Scalars['BigInt']>;
  feeTier_in?: InputMaybe<Array<Scalars['BigInt']>>;
  feeTier_lt?: InputMaybe<Scalars['BigInt']>;
  feeTier_lte?: InputMaybe<Scalars['BigInt']>;
  feeTier_not?: InputMaybe<Scalars['BigInt']>;
  feeTier_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
  feesUSD?: InputMaybe<Scalars['BigDecimal']>;
  feesUSD_gt?: InputMaybe<Scalars['BigDecimal']>;
  feesUSD_gte?: InputMaybe<Scalars['BigDecimal']>;
  feesUSD_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  feesUSD_lt?: InputMaybe<Scalars['BigDecimal']>;
  feesUSD_lte?: InputMaybe<Scalars['BigDecimal']>;
  feesUSD_not?: InputMaybe<Scalars['BigDecimal']>;
  feesUSD_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  id?: InputMaybe<Scalars['Bytes']>;
  id_contains?: InputMaybe<Scalars['Bytes']>;
  id_gt?: InputMaybe<Scalars['Bytes']>;
  id_gte?: InputMaybe<Scalars['Bytes']>;
  id_in?: InputMaybe<Array<Scalars['Bytes']>>;
  id_lt?: InputMaybe<Scalars['Bytes']>;
  id_lte?: InputMaybe<Scalars['Bytes']>;
  id_not?: InputMaybe<Scalars['Bytes']>;
  id_not_contains?: InputMaybe<Scalars['Bytes']>;
  id_not_in?: InputMaybe<Array<Scalars['Bytes']>>;
  liquidity?: InputMaybe<Scalars['BigInt']>;
  liquidityProviderCount?: InputMaybe<Scalars['BigInt']>;
  liquidityProviderCount_gt?: InputMaybe<Scalars['BigInt']>;
  liquidityProviderCount_gte?: InputMaybe<Scalars['BigInt']>;
  liquidityProviderCount_in?: InputMaybe<Array<Scalars['BigInt']>>;
  liquidityProviderCount_lt?: InputMaybe<Scalars['BigInt']>;
  liquidityProviderCount_lte?: InputMaybe<Scalars['BigInt']>;
  liquidityProviderCount_not?: InputMaybe<Scalars['BigInt']>;
  liquidityProviderCount_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
  liquidity_gt?: InputMaybe<Scalars['BigInt']>;
  liquidity_gte?: InputMaybe<Scalars['BigInt']>;
  liquidity_in?: InputMaybe<Array<Scalars['BigInt']>>;
  liquidity_lt?: InputMaybe<Scalars['BigInt']>;
  liquidity_lte?: InputMaybe<Scalars['BigInt']>;
  liquidity_not?: InputMaybe<Scalars['BigInt']>;
  liquidity_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
  mints_?: InputMaybe<Mint_Filter>;
  observationIndex?: InputMaybe<Scalars['BigInt']>;
  observationIndex_gt?: InputMaybe<Scalars['BigInt']>;
  observationIndex_gte?: InputMaybe<Scalars['BigInt']>;
  observationIndex_in?: InputMaybe<Array<Scalars['BigInt']>>;
  observationIndex_lt?: InputMaybe<Scalars['BigInt']>;
  observationIndex_lte?: InputMaybe<Scalars['BigInt']>;
  observationIndex_not?: InputMaybe<Scalars['BigInt']>;
  observationIndex_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
  or?: InputMaybe<Array<InputMaybe<Pool_Filter>>>;
  poolDayData_?: InputMaybe<PoolDayData_Filter>;
  poolHourData_?: InputMaybe<PoolHourData_Filter>;
  sqrtPrice?: InputMaybe<Scalars['BigInt']>;
  sqrtPrice_gt?: InputMaybe<Scalars['BigInt']>;
  sqrtPrice_gte?: InputMaybe<Scalars['BigInt']>;
  sqrtPrice_in?: InputMaybe<Array<Scalars['BigInt']>>;
  sqrtPrice_lt?: InputMaybe<Scalars['BigInt']>;
  sqrtPrice_lte?: InputMaybe<Scalars['BigInt']>;
  sqrtPrice_not?: InputMaybe<Scalars['BigInt']>;
  sqrtPrice_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
  swaps_?: InputMaybe<Swap_Filter>;
  tick?: InputMaybe<Scalars['BigInt']>;
  tick_gt?: InputMaybe<Scalars['BigInt']>;
  tick_gte?: InputMaybe<Scalars['BigInt']>;
  tick_in?: InputMaybe<Array<Scalars['BigInt']>>;
  tick_lt?: InputMaybe<Scalars['BigInt']>;
  tick_lte?: InputMaybe<Scalars['BigInt']>;
  tick_not?: InputMaybe<Scalars['BigInt']>;
  tick_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
  ticks_?: InputMaybe<Tick_Filter>;
  token0?: InputMaybe<Scalars['String']>;
  token0Price?: InputMaybe<Scalars['BigDecimal']>;
  token0Price_gt?: InputMaybe<Scalars['BigDecimal']>;
  token0Price_gte?: InputMaybe<Scalars['BigDecimal']>;
  token0Price_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  token0Price_lt?: InputMaybe<Scalars['BigDecimal']>;
  token0Price_lte?: InputMaybe<Scalars['BigDecimal']>;
  token0Price_not?: InputMaybe<Scalars['BigDecimal']>;
  token0Price_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  token0_?: InputMaybe<Token_Filter>;
  token0_contains?: InputMaybe<Scalars['String']>;
  token0_contains_nocase?: InputMaybe<Scalars['String']>;
  token0_ends_with?: InputMaybe<Scalars['String']>;
  token0_ends_with_nocase?: InputMaybe<Scalars['String']>;
  token0_gt?: InputMaybe<Scalars['String']>;
  token0_gte?: InputMaybe<Scalars['String']>;
  token0_in?: InputMaybe<Array<Scalars['String']>>;
  token0_lt?: InputMaybe<Scalars['String']>;
  token0_lte?: InputMaybe<Scalars['String']>;
  token0_not?: InputMaybe<Scalars['String']>;
  token0_not_contains?: InputMaybe<Scalars['String']>;
  token0_not_contains_nocase?: InputMaybe<Scalars['String']>;
  token0_not_ends_with?: InputMaybe<Scalars['String']>;
  token0_not_ends_with_nocase?: InputMaybe<Scalars['String']>;
  token0_not_in?: InputMaybe<Array<Scalars['String']>>;
  token0_not_starts_with?: InputMaybe<Scalars['String']>;
  token0_not_starts_with_nocase?: InputMaybe<Scalars['String']>;
  token0_starts_with?: InputMaybe<Scalars['String']>;
  token0_starts_with_nocase?: InputMaybe<Scalars['String']>;
  token1?: InputMaybe<Scalars['String']>;
  token1Price?: InputMaybe<Scalars['BigDecimal']>;
  token1Price_gt?: InputMaybe<Scalars['BigDecimal']>;
  token1Price_gte?: InputMaybe<Scalars['BigDecimal']>;
  token1Price_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  token1Price_lt?: InputMaybe<Scalars['BigDecimal']>;
  token1Price_lte?: InputMaybe<Scalars['BigDecimal']>;
  token1Price_not?: InputMaybe<Scalars['BigDecimal']>;
  token1Price_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  token1_?: InputMaybe<Token_Filter>;
  token1_contains?: InputMaybe<Scalars['String']>;
  token1_contains_nocase?: InputMaybe<Scalars['String']>;
  token1_ends_with?: InputMaybe<Scalars['String']>;
  token1_ends_with_nocase?: InputMaybe<Scalars['String']>;
  token1_gt?: InputMaybe<Scalars['String']>;
  token1_gte?: InputMaybe<Scalars['String']>;
  token1_in?: InputMaybe<Array<Scalars['String']>>;
  token1_lt?: InputMaybe<Scalars['String']>;
  token1_lte?: InputMaybe<Scalars['String']>;
  token1_not?: InputMaybe<Scalars['String']>;
  token1_not_contains?: InputMaybe<Scalars['String']>;
  token1_not_contains_nocase?: InputMaybe<Scalars['String']>;
  token1_not_ends_with?: InputMaybe<Scalars['String']>;
  token1_not_ends_with_nocase?: InputMaybe<Scalars['String']>;
  token1_not_in?: InputMaybe<Array<Scalars['String']>>;
  token1_not_starts_with?: InputMaybe<Scalars['String']>;
  token1_not_starts_with_nocase?: InputMaybe<Scalars['String']>;
  token1_starts_with?: InputMaybe<Scalars['String']>;
  token1_starts_with_nocase?: InputMaybe<Scalars['String']>;
  totalValueLockedETH?: InputMaybe<Scalars['BigDecimal']>;
  totalValueLockedETH_gt?: InputMaybe<Scalars['BigDecimal']>;
  totalValueLockedETH_gte?: InputMaybe<Scalars['BigDecimal']>;
  totalValueLockedETH_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  totalValueLockedETH_lt?: InputMaybe<Scalars['BigDecimal']>;
  totalValueLockedETH_lte?: InputMaybe<Scalars['BigDecimal']>;
  totalValueLockedETH_not?: InputMaybe<Scalars['BigDecimal']>;
  totalValueLockedETH_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  totalValueLockedToken0?: InputMaybe<Scalars['BigDecimal']>;
  totalValueLockedToken0_gt?: InputMaybe<Scalars['BigDecimal']>;
  totalValueLockedToken0_gte?: InputMaybe<Scalars['BigDecimal']>;
  totalValueLockedToken0_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  totalValueLockedToken0_lt?: InputMaybe<Scalars['BigDecimal']>;
  totalValueLockedToken0_lte?: InputMaybe<Scalars['BigDecimal']>;
  totalValueLockedToken0_not?: InputMaybe<Scalars['BigDecimal']>;
  totalValueLockedToken0_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  totalValueLockedToken1?: InputMaybe<Scalars['BigDecimal']>;
  totalValueLockedToken1_gt?: InputMaybe<Scalars['BigDecimal']>;
  totalValueLockedToken1_gte?: InputMaybe<Scalars['BigDecimal']>;
  totalValueLockedToken1_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  totalValueLockedToken1_lt?: InputMaybe<Scalars['BigDecimal']>;
  totalValueLockedToken1_lte?: InputMaybe<Scalars['BigDecimal']>;
  totalValueLockedToken1_not?: InputMaybe<Scalars['BigDecimal']>;
  totalValueLockedToken1_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  totalValueLockedUSD?: InputMaybe<Scalars['BigDecimal']>;
  totalValueLockedUSDUntracked?: InputMaybe<Scalars['BigDecimal']>;
  totalValueLockedUSDUntracked_gt?: InputMaybe<Scalars['BigDecimal']>;
  totalValueLockedUSDUntracked_gte?: InputMaybe<Scalars['BigDecimal']>;
  totalValueLockedUSDUntracked_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  totalValueLockedUSDUntracked_lt?: InputMaybe<Scalars['BigDecimal']>;
  totalValueLockedUSDUntracked_lte?: InputMaybe<Scalars['BigDecimal']>;
  totalValueLockedUSDUntracked_not?: InputMaybe<Scalars['BigDecimal']>;
  totalValueLockedUSDUntracked_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  totalValueLockedUSD_gt?: InputMaybe<Scalars['BigDecimal']>;
  totalValueLockedUSD_gte?: InputMaybe<Scalars['BigDecimal']>;
  totalValueLockedUSD_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  totalValueLockedUSD_lt?: InputMaybe<Scalars['BigDecimal']>;
  totalValueLockedUSD_lte?: InputMaybe<Scalars['BigDecimal']>;
  totalValueLockedUSD_not?: InputMaybe<Scalars['BigDecimal']>;
  totalValueLockedUSD_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  txCount?: InputMaybe<Scalars['BigInt']>;
  txCount_gt?: InputMaybe<Scalars['BigInt']>;
  txCount_gte?: InputMaybe<Scalars['BigInt']>;
  txCount_in?: InputMaybe<Array<Scalars['BigInt']>>;
  txCount_lt?: InputMaybe<Scalars['BigInt']>;
  txCount_lte?: InputMaybe<Scalars['BigInt']>;
  txCount_not?: InputMaybe<Scalars['BigInt']>;
  txCount_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
  untrackedVolumeUSD?: InputMaybe<Scalars['BigDecimal']>;
  untrackedVolumeUSD_gt?: InputMaybe<Scalars['BigDecimal']>;
  untrackedVolumeUSD_gte?: InputMaybe<Scalars['BigDecimal']>;
  untrackedVolumeUSD_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  untrackedVolumeUSD_lt?: InputMaybe<Scalars['BigDecimal']>;
  untrackedVolumeUSD_lte?: InputMaybe<Scalars['BigDecimal']>;
  untrackedVolumeUSD_not?: InputMaybe<Scalars['BigDecimal']>;
  untrackedVolumeUSD_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  volumeToken0?: InputMaybe<Scalars['BigDecimal']>;
  volumeToken0_gt?: InputMaybe<Scalars['BigDecimal']>;
  volumeToken0_gte?: InputMaybe<Scalars['BigDecimal']>;
  volumeToken0_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  volumeToken0_lt?: InputMaybe<Scalars['BigDecimal']>;
  volumeToken0_lte?: InputMaybe<Scalars['BigDecimal']>;
  volumeToken0_not?: InputMaybe<Scalars['BigDecimal']>;
  volumeToken0_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  volumeToken1?: InputMaybe<Scalars['BigDecimal']>;
  volumeToken1_gt?: InputMaybe<Scalars['BigDecimal']>;
  volumeToken1_gte?: InputMaybe<Scalars['BigDecimal']>;
  volumeToken1_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  volumeToken1_lt?: InputMaybe<Scalars['BigDecimal']>;
  volumeToken1_lte?: InputMaybe<Scalars['BigDecimal']>;
  volumeToken1_not?: InputMaybe<Scalars['BigDecimal']>;
  volumeToken1_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  volumeUSD?: InputMaybe<Scalars['BigDecimal']>;
  volumeUSD_gt?: InputMaybe<Scalars['BigDecimal']>;
  volumeUSD_gte?: InputMaybe<Scalars['BigDecimal']>;
  volumeUSD_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  volumeUSD_lt?: InputMaybe<Scalars['BigDecimal']>;
  volumeUSD_lte?: InputMaybe<Scalars['BigDecimal']>;
  volumeUSD_not?: InputMaybe<Scalars['BigDecimal']>;
  volumeUSD_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
};

export enum Pool_OrderBy {
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
  Token0Decimals = 'token0__decimals',
  Token0DerivedEth = 'token0__derivedETH',
  Token0FeesUsd = 'token0__feesUSD',
  Token0Id = 'token0__id',
  Token0Name = 'token0__name',
  Token0PoolCount = 'token0__poolCount',
  Token0Symbol = 'token0__symbol',
  Token0TotalSupply = 'token0__totalSupply',
  Token0TotalValueLocked = 'token0__totalValueLocked',
  Token0TotalValueLockedUsd = 'token0__totalValueLockedUSD',
  Token0TotalValueLockedUsdUntracked = 'token0__totalValueLockedUSDUntracked',
  Token0TxCount = 'token0__txCount',
  Token0UntrackedVolumeUsd = 'token0__untrackedVolumeUSD',
  Token0Volume = 'token0__volume',
  Token0VolumeUsd = 'token0__volumeUSD',
  Token1 = 'token1',
  Token1Price = 'token1Price',
  Token1Decimals = 'token1__decimals',
  Token1DerivedEth = 'token1__derivedETH',
  Token1FeesUsd = 'token1__feesUSD',
  Token1Id = 'token1__id',
  Token1Name = 'token1__name',
  Token1PoolCount = 'token1__poolCount',
  Token1Symbol = 'token1__symbol',
  Token1TotalSupply = 'token1__totalSupply',
  Token1TotalValueLocked = 'token1__totalValueLocked',
  Token1TotalValueLockedUsd = 'token1__totalValueLockedUSD',
  Token1TotalValueLockedUsdUntracked = 'token1__totalValueLockedUSDUntracked',
  Token1TxCount = 'token1__txCount',
  Token1UntrackedVolumeUsd = 'token1__untrackedVolumeUSD',
  Token1Volume = 'token1__volume',
  Token1VolumeUsd = 'token1__volumeUSD',
  TotalValueLockedEth = 'totalValueLockedETH',
  TotalValueLockedToken0 = 'totalValueLockedToken0',
  TotalValueLockedToken1 = 'totalValueLockedToken1',
  TotalValueLockedUsd = 'totalValueLockedUSD',
  TotalValueLockedUsdUntracked = 'totalValueLockedUSDUntracked',
  TxCount = 'txCount',
  UntrackedVolumeUsd = 'untrackedVolumeUSD',
  VolumeToken0 = 'volumeToken0',
  VolumeToken1 = 'volumeToken1',
  VolumeUsd = 'volumeUSD'
}

export type Position = {
  __typename?: 'Position';
  closed: Scalars['Boolean'];
  collectedFeesToken0: Scalars['BigDecimal'];
  collectedFeesToken1: Scalars['BigDecimal'];
  createdAtBlockNumber: Scalars['BigInt'];
  createdAtTimestamp: Scalars['BigInt'];
  depositedToken0: Scalars['BigDecimal'];
  depositedToken1: Scalars['BigDecimal'];
  id: Scalars['ID'];
  liquidity: Scalars['BigInt'];
  owner: Scalars['Bytes'];
  pool: Pool;
  tickLower: Scalars['BigInt'];
  tickUpper: Scalars['BigInt'];
  token0: Token;
  token1: Token;
  transaction: Transaction;
  updatedAtBlockNumber: Scalars['BigInt'];
  updatedAtTimestamp: Scalars['BigInt'];
  withdrawnToken0: Scalars['BigDecimal'];
  withdrawnToken1: Scalars['BigDecimal'];
};

export type PositionSnapshot = {
  __typename?: 'PositionSnapshot';
  blockNumber: Scalars['BigInt'];
  collectedFeesToken0: Scalars['BigDecimal'];
  collectedFeesToken1: Scalars['BigDecimal'];
  depositedToken0: Scalars['BigDecimal'];
  depositedToken1: Scalars['BigDecimal'];
  id: Scalars['ID'];
  liquidity: Scalars['BigInt'];
  owner: Scalars['Bytes'];
  pool: Pool;
  position: Position;
  timestamp: Scalars['BigInt'];
  transaction: Transaction;
  withdrawnToken0: Scalars['BigDecimal'];
  withdrawnToken1: Scalars['BigDecimal'];
};

export type PositionSnapshot_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<PositionSnapshot_Filter>>>;
  blockNumber?: InputMaybe<Scalars['BigInt']>;
  blockNumber_gt?: InputMaybe<Scalars['BigInt']>;
  blockNumber_gte?: InputMaybe<Scalars['BigInt']>;
  blockNumber_in?: InputMaybe<Array<Scalars['BigInt']>>;
  blockNumber_lt?: InputMaybe<Scalars['BigInt']>;
  blockNumber_lte?: InputMaybe<Scalars['BigInt']>;
  blockNumber_not?: InputMaybe<Scalars['BigInt']>;
  blockNumber_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
  collectedFeesToken0?: InputMaybe<Scalars['BigDecimal']>;
  collectedFeesToken0_gt?: InputMaybe<Scalars['BigDecimal']>;
  collectedFeesToken0_gte?: InputMaybe<Scalars['BigDecimal']>;
  collectedFeesToken0_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  collectedFeesToken0_lt?: InputMaybe<Scalars['BigDecimal']>;
  collectedFeesToken0_lte?: InputMaybe<Scalars['BigDecimal']>;
  collectedFeesToken0_not?: InputMaybe<Scalars['BigDecimal']>;
  collectedFeesToken0_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  collectedFeesToken1?: InputMaybe<Scalars['BigDecimal']>;
  collectedFeesToken1_gt?: InputMaybe<Scalars['BigDecimal']>;
  collectedFeesToken1_gte?: InputMaybe<Scalars['BigDecimal']>;
  collectedFeesToken1_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  collectedFeesToken1_lt?: InputMaybe<Scalars['BigDecimal']>;
  collectedFeesToken1_lte?: InputMaybe<Scalars['BigDecimal']>;
  collectedFeesToken1_not?: InputMaybe<Scalars['BigDecimal']>;
  collectedFeesToken1_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  depositedToken0?: InputMaybe<Scalars['BigDecimal']>;
  depositedToken0_gt?: InputMaybe<Scalars['BigDecimal']>;
  depositedToken0_gte?: InputMaybe<Scalars['BigDecimal']>;
  depositedToken0_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  depositedToken0_lt?: InputMaybe<Scalars['BigDecimal']>;
  depositedToken0_lte?: InputMaybe<Scalars['BigDecimal']>;
  depositedToken0_not?: InputMaybe<Scalars['BigDecimal']>;
  depositedToken0_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  depositedToken1?: InputMaybe<Scalars['BigDecimal']>;
  depositedToken1_gt?: InputMaybe<Scalars['BigDecimal']>;
  depositedToken1_gte?: InputMaybe<Scalars['BigDecimal']>;
  depositedToken1_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  depositedToken1_lt?: InputMaybe<Scalars['BigDecimal']>;
  depositedToken1_lte?: InputMaybe<Scalars['BigDecimal']>;
  depositedToken1_not?: InputMaybe<Scalars['BigDecimal']>;
  depositedToken1_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  id?: InputMaybe<Scalars['ID']>;
  id_gt?: InputMaybe<Scalars['ID']>;
  id_gte?: InputMaybe<Scalars['ID']>;
  id_in?: InputMaybe<Array<Scalars['ID']>>;
  id_lt?: InputMaybe<Scalars['ID']>;
  id_lte?: InputMaybe<Scalars['ID']>;
  id_not?: InputMaybe<Scalars['ID']>;
  id_not_in?: InputMaybe<Array<Scalars['ID']>>;
  liquidity?: InputMaybe<Scalars['BigInt']>;
  liquidity_gt?: InputMaybe<Scalars['BigInt']>;
  liquidity_gte?: InputMaybe<Scalars['BigInt']>;
  liquidity_in?: InputMaybe<Array<Scalars['BigInt']>>;
  liquidity_lt?: InputMaybe<Scalars['BigInt']>;
  liquidity_lte?: InputMaybe<Scalars['BigInt']>;
  liquidity_not?: InputMaybe<Scalars['BigInt']>;
  liquidity_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
  or?: InputMaybe<Array<InputMaybe<PositionSnapshot_Filter>>>;
  owner?: InputMaybe<Scalars['Bytes']>;
  owner_contains?: InputMaybe<Scalars['Bytes']>;
  owner_gt?: InputMaybe<Scalars['Bytes']>;
  owner_gte?: InputMaybe<Scalars['Bytes']>;
  owner_in?: InputMaybe<Array<Scalars['Bytes']>>;
  owner_lt?: InputMaybe<Scalars['Bytes']>;
  owner_lte?: InputMaybe<Scalars['Bytes']>;
  owner_not?: InputMaybe<Scalars['Bytes']>;
  owner_not_contains?: InputMaybe<Scalars['Bytes']>;
  owner_not_in?: InputMaybe<Array<Scalars['Bytes']>>;
  pool?: InputMaybe<Scalars['String']>;
  pool_?: InputMaybe<Pool_Filter>;
  pool_contains?: InputMaybe<Scalars['String']>;
  pool_contains_nocase?: InputMaybe<Scalars['String']>;
  pool_ends_with?: InputMaybe<Scalars['String']>;
  pool_ends_with_nocase?: InputMaybe<Scalars['String']>;
  pool_gt?: InputMaybe<Scalars['String']>;
  pool_gte?: InputMaybe<Scalars['String']>;
  pool_in?: InputMaybe<Array<Scalars['String']>>;
  pool_lt?: InputMaybe<Scalars['String']>;
  pool_lte?: InputMaybe<Scalars['String']>;
  pool_not?: InputMaybe<Scalars['String']>;
  pool_not_contains?: InputMaybe<Scalars['String']>;
  pool_not_contains_nocase?: InputMaybe<Scalars['String']>;
  pool_not_ends_with?: InputMaybe<Scalars['String']>;
  pool_not_ends_with_nocase?: InputMaybe<Scalars['String']>;
  pool_not_in?: InputMaybe<Array<Scalars['String']>>;
  pool_not_starts_with?: InputMaybe<Scalars['String']>;
  pool_not_starts_with_nocase?: InputMaybe<Scalars['String']>;
  pool_starts_with?: InputMaybe<Scalars['String']>;
  pool_starts_with_nocase?: InputMaybe<Scalars['String']>;
  position?: InputMaybe<Scalars['String']>;
  position_?: InputMaybe<Position_Filter>;
  position_contains?: InputMaybe<Scalars['String']>;
  position_contains_nocase?: InputMaybe<Scalars['String']>;
  position_ends_with?: InputMaybe<Scalars['String']>;
  position_ends_with_nocase?: InputMaybe<Scalars['String']>;
  position_gt?: InputMaybe<Scalars['String']>;
  position_gte?: InputMaybe<Scalars['String']>;
  position_in?: InputMaybe<Array<Scalars['String']>>;
  position_lt?: InputMaybe<Scalars['String']>;
  position_lte?: InputMaybe<Scalars['String']>;
  position_not?: InputMaybe<Scalars['String']>;
  position_not_contains?: InputMaybe<Scalars['String']>;
  position_not_contains_nocase?: InputMaybe<Scalars['String']>;
  position_not_ends_with?: InputMaybe<Scalars['String']>;
  position_not_ends_with_nocase?: InputMaybe<Scalars['String']>;
  position_not_in?: InputMaybe<Array<Scalars['String']>>;
  position_not_starts_with?: InputMaybe<Scalars['String']>;
  position_not_starts_with_nocase?: InputMaybe<Scalars['String']>;
  position_starts_with?: InputMaybe<Scalars['String']>;
  position_starts_with_nocase?: InputMaybe<Scalars['String']>;
  timestamp?: InputMaybe<Scalars['BigInt']>;
  timestamp_gt?: InputMaybe<Scalars['BigInt']>;
  timestamp_gte?: InputMaybe<Scalars['BigInt']>;
  timestamp_in?: InputMaybe<Array<Scalars['BigInt']>>;
  timestamp_lt?: InputMaybe<Scalars['BigInt']>;
  timestamp_lte?: InputMaybe<Scalars['BigInt']>;
  timestamp_not?: InputMaybe<Scalars['BigInt']>;
  timestamp_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
  transaction?: InputMaybe<Scalars['String']>;
  transaction_?: InputMaybe<Transaction_Filter>;
  transaction_contains?: InputMaybe<Scalars['String']>;
  transaction_contains_nocase?: InputMaybe<Scalars['String']>;
  transaction_ends_with?: InputMaybe<Scalars['String']>;
  transaction_ends_with_nocase?: InputMaybe<Scalars['String']>;
  transaction_gt?: InputMaybe<Scalars['String']>;
  transaction_gte?: InputMaybe<Scalars['String']>;
  transaction_in?: InputMaybe<Array<Scalars['String']>>;
  transaction_lt?: InputMaybe<Scalars['String']>;
  transaction_lte?: InputMaybe<Scalars['String']>;
  transaction_not?: InputMaybe<Scalars['String']>;
  transaction_not_contains?: InputMaybe<Scalars['String']>;
  transaction_not_contains_nocase?: InputMaybe<Scalars['String']>;
  transaction_not_ends_with?: InputMaybe<Scalars['String']>;
  transaction_not_ends_with_nocase?: InputMaybe<Scalars['String']>;
  transaction_not_in?: InputMaybe<Array<Scalars['String']>>;
  transaction_not_starts_with?: InputMaybe<Scalars['String']>;
  transaction_not_starts_with_nocase?: InputMaybe<Scalars['String']>;
  transaction_starts_with?: InputMaybe<Scalars['String']>;
  transaction_starts_with_nocase?: InputMaybe<Scalars['String']>;
  withdrawnToken0?: InputMaybe<Scalars['BigDecimal']>;
  withdrawnToken0_gt?: InputMaybe<Scalars['BigDecimal']>;
  withdrawnToken0_gte?: InputMaybe<Scalars['BigDecimal']>;
  withdrawnToken0_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  withdrawnToken0_lt?: InputMaybe<Scalars['BigDecimal']>;
  withdrawnToken0_lte?: InputMaybe<Scalars['BigDecimal']>;
  withdrawnToken0_not?: InputMaybe<Scalars['BigDecimal']>;
  withdrawnToken0_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  withdrawnToken1?: InputMaybe<Scalars['BigDecimal']>;
  withdrawnToken1_gt?: InputMaybe<Scalars['BigDecimal']>;
  withdrawnToken1_gte?: InputMaybe<Scalars['BigDecimal']>;
  withdrawnToken1_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  withdrawnToken1_lt?: InputMaybe<Scalars['BigDecimal']>;
  withdrawnToken1_lte?: InputMaybe<Scalars['BigDecimal']>;
  withdrawnToken1_not?: InputMaybe<Scalars['BigDecimal']>;
  withdrawnToken1_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
};

export enum PositionSnapshot_OrderBy {
  BlockNumber = 'blockNumber',
  CollectedFeesToken0 = 'collectedFeesToken0',
  CollectedFeesToken1 = 'collectedFeesToken1',
  DepositedToken0 = 'depositedToken0',
  DepositedToken1 = 'depositedToken1',
  Id = 'id',
  Liquidity = 'liquidity',
  Owner = 'owner',
  Pool = 'pool',
  PoolCollectedFeesToken0 = 'pool__collectedFeesToken0',
  PoolCollectedFeesToken1 = 'pool__collectedFeesToken1',
  PoolCollectedFeesUsd = 'pool__collectedFeesUSD',
  PoolCreatedAtBlockNumber = 'pool__createdAtBlockNumber',
  PoolCreatedAtTimestamp = 'pool__createdAtTimestamp',
  PoolFeeTier = 'pool__feeTier',
  PoolFeesUsd = 'pool__feesUSD',
  PoolId = 'pool__id',
  PoolLiquidity = 'pool__liquidity',
  PoolLiquidityProviderCount = 'pool__liquidityProviderCount',
  PoolObservationIndex = 'pool__observationIndex',
  PoolSqrtPrice = 'pool__sqrtPrice',
  PoolTick = 'pool__tick',
  PoolToken0Price = 'pool__token0Price',
  PoolToken1Price = 'pool__token1Price',
  PoolTotalValueLockedEth = 'pool__totalValueLockedETH',
  PoolTotalValueLockedToken0 = 'pool__totalValueLockedToken0',
  PoolTotalValueLockedToken1 = 'pool__totalValueLockedToken1',
  PoolTotalValueLockedUsd = 'pool__totalValueLockedUSD',
  PoolTotalValueLockedUsdUntracked = 'pool__totalValueLockedUSDUntracked',
  PoolTxCount = 'pool__txCount',
  PoolUntrackedVolumeUsd = 'pool__untrackedVolumeUSD',
  PoolVolumeToken0 = 'pool__volumeToken0',
  PoolVolumeToken1 = 'pool__volumeToken1',
  PoolVolumeUsd = 'pool__volumeUSD',
  Position = 'position',
  PositionClosed = 'position__closed',
  PositionCollectedFeesToken0 = 'position__collectedFeesToken0',
  PositionCollectedFeesToken1 = 'position__collectedFeesToken1',
  PositionCreatedAtBlockNumber = 'position__createdAtBlockNumber',
  PositionCreatedAtTimestamp = 'position__createdAtTimestamp',
  PositionDepositedToken0 = 'position__depositedToken0',
  PositionDepositedToken1 = 'position__depositedToken1',
  PositionId = 'position__id',
  PositionLiquidity = 'position__liquidity',
  PositionOwner = 'position__owner',
  PositionTickLower = 'position__tickLower',
  PositionTickUpper = 'position__tickUpper',
  PositionUpdatedAtBlockNumber = 'position__updatedAtBlockNumber',
  PositionUpdatedAtTimestamp = 'position__updatedAtTimestamp',
  PositionWithdrawnToken0 = 'position__withdrawnToken0',
  PositionWithdrawnToken1 = 'position__withdrawnToken1',
  Timestamp = 'timestamp',
  Transaction = 'transaction',
  TransactionBlockNumber = 'transaction__blockNumber',
  TransactionGasPrice = 'transaction__gasPrice',
  TransactionGasUsed = 'transaction__gasUsed',
  TransactionId = 'transaction__id',
  TransactionTimestamp = 'transaction__timestamp',
  WithdrawnToken0 = 'withdrawnToken0',
  WithdrawnToken1 = 'withdrawnToken1'
}

export type Position_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<Position_Filter>>>;
  closed?: InputMaybe<Scalars['Boolean']>;
  closed_in?: InputMaybe<Array<Scalars['Boolean']>>;
  closed_not?: InputMaybe<Scalars['Boolean']>;
  closed_not_in?: InputMaybe<Array<Scalars['Boolean']>>;
  collectedFeesToken0?: InputMaybe<Scalars['BigDecimal']>;
  collectedFeesToken0_gt?: InputMaybe<Scalars['BigDecimal']>;
  collectedFeesToken0_gte?: InputMaybe<Scalars['BigDecimal']>;
  collectedFeesToken0_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  collectedFeesToken0_lt?: InputMaybe<Scalars['BigDecimal']>;
  collectedFeesToken0_lte?: InputMaybe<Scalars['BigDecimal']>;
  collectedFeesToken0_not?: InputMaybe<Scalars['BigDecimal']>;
  collectedFeesToken0_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  collectedFeesToken1?: InputMaybe<Scalars['BigDecimal']>;
  collectedFeesToken1_gt?: InputMaybe<Scalars['BigDecimal']>;
  collectedFeesToken1_gte?: InputMaybe<Scalars['BigDecimal']>;
  collectedFeesToken1_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  collectedFeesToken1_lt?: InputMaybe<Scalars['BigDecimal']>;
  collectedFeesToken1_lte?: InputMaybe<Scalars['BigDecimal']>;
  collectedFeesToken1_not?: InputMaybe<Scalars['BigDecimal']>;
  collectedFeesToken1_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  createdAtBlockNumber?: InputMaybe<Scalars['BigInt']>;
  createdAtBlockNumber_gt?: InputMaybe<Scalars['BigInt']>;
  createdAtBlockNumber_gte?: InputMaybe<Scalars['BigInt']>;
  createdAtBlockNumber_in?: InputMaybe<Array<Scalars['BigInt']>>;
  createdAtBlockNumber_lt?: InputMaybe<Scalars['BigInt']>;
  createdAtBlockNumber_lte?: InputMaybe<Scalars['BigInt']>;
  createdAtBlockNumber_not?: InputMaybe<Scalars['BigInt']>;
  createdAtBlockNumber_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
  createdAtTimestamp?: InputMaybe<Scalars['BigInt']>;
  createdAtTimestamp_gt?: InputMaybe<Scalars['BigInt']>;
  createdAtTimestamp_gte?: InputMaybe<Scalars['BigInt']>;
  createdAtTimestamp_in?: InputMaybe<Array<Scalars['BigInt']>>;
  createdAtTimestamp_lt?: InputMaybe<Scalars['BigInt']>;
  createdAtTimestamp_lte?: InputMaybe<Scalars['BigInt']>;
  createdAtTimestamp_not?: InputMaybe<Scalars['BigInt']>;
  createdAtTimestamp_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
  depositedToken0?: InputMaybe<Scalars['BigDecimal']>;
  depositedToken0_gt?: InputMaybe<Scalars['BigDecimal']>;
  depositedToken0_gte?: InputMaybe<Scalars['BigDecimal']>;
  depositedToken0_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  depositedToken0_lt?: InputMaybe<Scalars['BigDecimal']>;
  depositedToken0_lte?: InputMaybe<Scalars['BigDecimal']>;
  depositedToken0_not?: InputMaybe<Scalars['BigDecimal']>;
  depositedToken0_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  depositedToken1?: InputMaybe<Scalars['BigDecimal']>;
  depositedToken1_gt?: InputMaybe<Scalars['BigDecimal']>;
  depositedToken1_gte?: InputMaybe<Scalars['BigDecimal']>;
  depositedToken1_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  depositedToken1_lt?: InputMaybe<Scalars['BigDecimal']>;
  depositedToken1_lte?: InputMaybe<Scalars['BigDecimal']>;
  depositedToken1_not?: InputMaybe<Scalars['BigDecimal']>;
  depositedToken1_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  id?: InputMaybe<Scalars['ID']>;
  id_gt?: InputMaybe<Scalars['ID']>;
  id_gte?: InputMaybe<Scalars['ID']>;
  id_in?: InputMaybe<Array<Scalars['ID']>>;
  id_lt?: InputMaybe<Scalars['ID']>;
  id_lte?: InputMaybe<Scalars['ID']>;
  id_not?: InputMaybe<Scalars['ID']>;
  id_not_in?: InputMaybe<Array<Scalars['ID']>>;
  liquidity?: InputMaybe<Scalars['BigInt']>;
  liquidity_gt?: InputMaybe<Scalars['BigInt']>;
  liquidity_gte?: InputMaybe<Scalars['BigInt']>;
  liquidity_in?: InputMaybe<Array<Scalars['BigInt']>>;
  liquidity_lt?: InputMaybe<Scalars['BigInt']>;
  liquidity_lte?: InputMaybe<Scalars['BigInt']>;
  liquidity_not?: InputMaybe<Scalars['BigInt']>;
  liquidity_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
  or?: InputMaybe<Array<InputMaybe<Position_Filter>>>;
  owner?: InputMaybe<Scalars['Bytes']>;
  owner_contains?: InputMaybe<Scalars['Bytes']>;
  owner_gt?: InputMaybe<Scalars['Bytes']>;
  owner_gte?: InputMaybe<Scalars['Bytes']>;
  owner_in?: InputMaybe<Array<Scalars['Bytes']>>;
  owner_lt?: InputMaybe<Scalars['Bytes']>;
  owner_lte?: InputMaybe<Scalars['Bytes']>;
  owner_not?: InputMaybe<Scalars['Bytes']>;
  owner_not_contains?: InputMaybe<Scalars['Bytes']>;
  owner_not_in?: InputMaybe<Array<Scalars['Bytes']>>;
  pool?: InputMaybe<Scalars['String']>;
  pool_?: InputMaybe<Pool_Filter>;
  pool_contains?: InputMaybe<Scalars['String']>;
  pool_contains_nocase?: InputMaybe<Scalars['String']>;
  pool_ends_with?: InputMaybe<Scalars['String']>;
  pool_ends_with_nocase?: InputMaybe<Scalars['String']>;
  pool_gt?: InputMaybe<Scalars['String']>;
  pool_gte?: InputMaybe<Scalars['String']>;
  pool_in?: InputMaybe<Array<Scalars['String']>>;
  pool_lt?: InputMaybe<Scalars['String']>;
  pool_lte?: InputMaybe<Scalars['String']>;
  pool_not?: InputMaybe<Scalars['String']>;
  pool_not_contains?: InputMaybe<Scalars['String']>;
  pool_not_contains_nocase?: InputMaybe<Scalars['String']>;
  pool_not_ends_with?: InputMaybe<Scalars['String']>;
  pool_not_ends_with_nocase?: InputMaybe<Scalars['String']>;
  pool_not_in?: InputMaybe<Array<Scalars['String']>>;
  pool_not_starts_with?: InputMaybe<Scalars['String']>;
  pool_not_starts_with_nocase?: InputMaybe<Scalars['String']>;
  pool_starts_with?: InputMaybe<Scalars['String']>;
  pool_starts_with_nocase?: InputMaybe<Scalars['String']>;
  tickLower?: InputMaybe<Scalars['BigInt']>;
  tickLower_gt?: InputMaybe<Scalars['BigInt']>;
  tickLower_gte?: InputMaybe<Scalars['BigInt']>;
  tickLower_in?: InputMaybe<Array<Scalars['BigInt']>>;
  tickLower_lt?: InputMaybe<Scalars['BigInt']>;
  tickLower_lte?: InputMaybe<Scalars['BigInt']>;
  tickLower_not?: InputMaybe<Scalars['BigInt']>;
  tickLower_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
  tickUpper?: InputMaybe<Scalars['BigInt']>;
  tickUpper_gt?: InputMaybe<Scalars['BigInt']>;
  tickUpper_gte?: InputMaybe<Scalars['BigInt']>;
  tickUpper_in?: InputMaybe<Array<Scalars['BigInt']>>;
  tickUpper_lt?: InputMaybe<Scalars['BigInt']>;
  tickUpper_lte?: InputMaybe<Scalars['BigInt']>;
  tickUpper_not?: InputMaybe<Scalars['BigInt']>;
  tickUpper_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
  token0?: InputMaybe<Scalars['String']>;
  token0_?: InputMaybe<Token_Filter>;
  token0_contains?: InputMaybe<Scalars['String']>;
  token0_contains_nocase?: InputMaybe<Scalars['String']>;
  token0_ends_with?: InputMaybe<Scalars['String']>;
  token0_ends_with_nocase?: InputMaybe<Scalars['String']>;
  token0_gt?: InputMaybe<Scalars['String']>;
  token0_gte?: InputMaybe<Scalars['String']>;
  token0_in?: InputMaybe<Array<Scalars['String']>>;
  token0_lt?: InputMaybe<Scalars['String']>;
  token0_lte?: InputMaybe<Scalars['String']>;
  token0_not?: InputMaybe<Scalars['String']>;
  token0_not_contains?: InputMaybe<Scalars['String']>;
  token0_not_contains_nocase?: InputMaybe<Scalars['String']>;
  token0_not_ends_with?: InputMaybe<Scalars['String']>;
  token0_not_ends_with_nocase?: InputMaybe<Scalars['String']>;
  token0_not_in?: InputMaybe<Array<Scalars['String']>>;
  token0_not_starts_with?: InputMaybe<Scalars['String']>;
  token0_not_starts_with_nocase?: InputMaybe<Scalars['String']>;
  token0_starts_with?: InputMaybe<Scalars['String']>;
  token0_starts_with_nocase?: InputMaybe<Scalars['String']>;
  token1?: InputMaybe<Scalars['String']>;
  token1_?: InputMaybe<Token_Filter>;
  token1_contains?: InputMaybe<Scalars['String']>;
  token1_contains_nocase?: InputMaybe<Scalars['String']>;
  token1_ends_with?: InputMaybe<Scalars['String']>;
  token1_ends_with_nocase?: InputMaybe<Scalars['String']>;
  token1_gt?: InputMaybe<Scalars['String']>;
  token1_gte?: InputMaybe<Scalars['String']>;
  token1_in?: InputMaybe<Array<Scalars['String']>>;
  token1_lt?: InputMaybe<Scalars['String']>;
  token1_lte?: InputMaybe<Scalars['String']>;
  token1_not?: InputMaybe<Scalars['String']>;
  token1_not_contains?: InputMaybe<Scalars['String']>;
  token1_not_contains_nocase?: InputMaybe<Scalars['String']>;
  token1_not_ends_with?: InputMaybe<Scalars['String']>;
  token1_not_ends_with_nocase?: InputMaybe<Scalars['String']>;
  token1_not_in?: InputMaybe<Array<Scalars['String']>>;
  token1_not_starts_with?: InputMaybe<Scalars['String']>;
  token1_not_starts_with_nocase?: InputMaybe<Scalars['String']>;
  token1_starts_with?: InputMaybe<Scalars['String']>;
  token1_starts_with_nocase?: InputMaybe<Scalars['String']>;
  transaction?: InputMaybe<Scalars['String']>;
  transaction_?: InputMaybe<Transaction_Filter>;
  transaction_contains?: InputMaybe<Scalars['String']>;
  transaction_contains_nocase?: InputMaybe<Scalars['String']>;
  transaction_ends_with?: InputMaybe<Scalars['String']>;
  transaction_ends_with_nocase?: InputMaybe<Scalars['String']>;
  transaction_gt?: InputMaybe<Scalars['String']>;
  transaction_gte?: InputMaybe<Scalars['String']>;
  transaction_in?: InputMaybe<Array<Scalars['String']>>;
  transaction_lt?: InputMaybe<Scalars['String']>;
  transaction_lte?: InputMaybe<Scalars['String']>;
  transaction_not?: InputMaybe<Scalars['String']>;
  transaction_not_contains?: InputMaybe<Scalars['String']>;
  transaction_not_contains_nocase?: InputMaybe<Scalars['String']>;
  transaction_not_ends_with?: InputMaybe<Scalars['String']>;
  transaction_not_ends_with_nocase?: InputMaybe<Scalars['String']>;
  transaction_not_in?: InputMaybe<Array<Scalars['String']>>;
  transaction_not_starts_with?: InputMaybe<Scalars['String']>;
  transaction_not_starts_with_nocase?: InputMaybe<Scalars['String']>;
  transaction_starts_with?: InputMaybe<Scalars['String']>;
  transaction_starts_with_nocase?: InputMaybe<Scalars['String']>;
  updatedAtBlockNumber?: InputMaybe<Scalars['BigInt']>;
  updatedAtBlockNumber_gt?: InputMaybe<Scalars['BigInt']>;
  updatedAtBlockNumber_gte?: InputMaybe<Scalars['BigInt']>;
  updatedAtBlockNumber_in?: InputMaybe<Array<Scalars['BigInt']>>;
  updatedAtBlockNumber_lt?: InputMaybe<Scalars['BigInt']>;
  updatedAtBlockNumber_lte?: InputMaybe<Scalars['BigInt']>;
  updatedAtBlockNumber_not?: InputMaybe<Scalars['BigInt']>;
  updatedAtBlockNumber_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
  updatedAtTimestamp?: InputMaybe<Scalars['BigInt']>;
  updatedAtTimestamp_gt?: InputMaybe<Scalars['BigInt']>;
  updatedAtTimestamp_gte?: InputMaybe<Scalars['BigInt']>;
  updatedAtTimestamp_in?: InputMaybe<Array<Scalars['BigInt']>>;
  updatedAtTimestamp_lt?: InputMaybe<Scalars['BigInt']>;
  updatedAtTimestamp_lte?: InputMaybe<Scalars['BigInt']>;
  updatedAtTimestamp_not?: InputMaybe<Scalars['BigInt']>;
  updatedAtTimestamp_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
  withdrawnToken0?: InputMaybe<Scalars['BigDecimal']>;
  withdrawnToken0_gt?: InputMaybe<Scalars['BigDecimal']>;
  withdrawnToken0_gte?: InputMaybe<Scalars['BigDecimal']>;
  withdrawnToken0_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  withdrawnToken0_lt?: InputMaybe<Scalars['BigDecimal']>;
  withdrawnToken0_lte?: InputMaybe<Scalars['BigDecimal']>;
  withdrawnToken0_not?: InputMaybe<Scalars['BigDecimal']>;
  withdrawnToken0_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  withdrawnToken1?: InputMaybe<Scalars['BigDecimal']>;
  withdrawnToken1_gt?: InputMaybe<Scalars['BigDecimal']>;
  withdrawnToken1_gte?: InputMaybe<Scalars['BigDecimal']>;
  withdrawnToken1_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  withdrawnToken1_lt?: InputMaybe<Scalars['BigDecimal']>;
  withdrawnToken1_lte?: InputMaybe<Scalars['BigDecimal']>;
  withdrawnToken1_not?: InputMaybe<Scalars['BigDecimal']>;
  withdrawnToken1_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
};

export enum Position_OrderBy {
  Closed = 'closed',
  CollectedFeesToken0 = 'collectedFeesToken0',
  CollectedFeesToken1 = 'collectedFeesToken1',
  CreatedAtBlockNumber = 'createdAtBlockNumber',
  CreatedAtTimestamp = 'createdAtTimestamp',
  DepositedToken0 = 'depositedToken0',
  DepositedToken1 = 'depositedToken1',
  Id = 'id',
  Liquidity = 'liquidity',
  Owner = 'owner',
  Pool = 'pool',
  PoolCollectedFeesToken0 = 'pool__collectedFeesToken0',
  PoolCollectedFeesToken1 = 'pool__collectedFeesToken1',
  PoolCollectedFeesUsd = 'pool__collectedFeesUSD',
  PoolCreatedAtBlockNumber = 'pool__createdAtBlockNumber',
  PoolCreatedAtTimestamp = 'pool__createdAtTimestamp',
  PoolFeeTier = 'pool__feeTier',
  PoolFeesUsd = 'pool__feesUSD',
  PoolId = 'pool__id',
  PoolLiquidity = 'pool__liquidity',
  PoolLiquidityProviderCount = 'pool__liquidityProviderCount',
  PoolObservationIndex = 'pool__observationIndex',
  PoolSqrtPrice = 'pool__sqrtPrice',
  PoolTick = 'pool__tick',
  PoolToken0Price = 'pool__token0Price',
  PoolToken1Price = 'pool__token1Price',
  PoolTotalValueLockedEth = 'pool__totalValueLockedETH',
  PoolTotalValueLockedToken0 = 'pool__totalValueLockedToken0',
  PoolTotalValueLockedToken1 = 'pool__totalValueLockedToken1',
  PoolTotalValueLockedUsd = 'pool__totalValueLockedUSD',
  PoolTotalValueLockedUsdUntracked = 'pool__totalValueLockedUSDUntracked',
  PoolTxCount = 'pool__txCount',
  PoolUntrackedVolumeUsd = 'pool__untrackedVolumeUSD',
  PoolVolumeToken0 = 'pool__volumeToken0',
  PoolVolumeToken1 = 'pool__volumeToken1',
  PoolVolumeUsd = 'pool__volumeUSD',
  TickLower = 'tickLower',
  TickUpper = 'tickUpper',
  Token0 = 'token0',
  Token0Decimals = 'token0__decimals',
  Token0DerivedEth = 'token0__derivedETH',
  Token0FeesUsd = 'token0__feesUSD',
  Token0Id = 'token0__id',
  Token0Name = 'token0__name',
  Token0PoolCount = 'token0__poolCount',
  Token0Symbol = 'token0__symbol',
  Token0TotalSupply = 'token0__totalSupply',
  Token0TotalValueLocked = 'token0__totalValueLocked',
  Token0TotalValueLockedUsd = 'token0__totalValueLockedUSD',
  Token0TotalValueLockedUsdUntracked = 'token0__totalValueLockedUSDUntracked',
  Token0TxCount = 'token0__txCount',
  Token0UntrackedVolumeUsd = 'token0__untrackedVolumeUSD',
  Token0Volume = 'token0__volume',
  Token0VolumeUsd = 'token0__volumeUSD',
  Token1 = 'token1',
  Token1Decimals = 'token1__decimals',
  Token1DerivedEth = 'token1__derivedETH',
  Token1FeesUsd = 'token1__feesUSD',
  Token1Id = 'token1__id',
  Token1Name = 'token1__name',
  Token1PoolCount = 'token1__poolCount',
  Token1Symbol = 'token1__symbol',
  Token1TotalSupply = 'token1__totalSupply',
  Token1TotalValueLocked = 'token1__totalValueLocked',
  Token1TotalValueLockedUsd = 'token1__totalValueLockedUSD',
  Token1TotalValueLockedUsdUntracked = 'token1__totalValueLockedUSDUntracked',
  Token1TxCount = 'token1__txCount',
  Token1UntrackedVolumeUsd = 'token1__untrackedVolumeUSD',
  Token1Volume = 'token1__volume',
  Token1VolumeUsd = 'token1__volumeUSD',
  Transaction = 'transaction',
  TransactionBlockNumber = 'transaction__blockNumber',
  TransactionGasPrice = 'transaction__gasPrice',
  TransactionGasUsed = 'transaction__gasUsed',
  TransactionId = 'transaction__id',
  TransactionTimestamp = 'transaction__timestamp',
  UpdatedAtBlockNumber = 'updatedAtBlockNumber',
  UpdatedAtTimestamp = 'updatedAtTimestamp',
  WithdrawnToken0 = 'withdrawnToken0',
  WithdrawnToken1 = 'withdrawnToken1'
}

export type Query = {
  __typename?: 'Query';
  /** Access to subgraph metadata */
  _meta?: Maybe<_Meta_>;
  bundle?: Maybe<Bundle>;
  bundles: Array<Bundle>;
  burn?: Maybe<Burn>;
  burns: Array<Burn>;
  collect?: Maybe<Collect>;
  collects: Array<Collect>;
  factories: Array<Factory>;
  factory?: Maybe<Factory>;
  flash?: Maybe<Flash>;
  flashes: Array<Flash>;
  mint?: Maybe<Mint>;
  mints: Array<Mint>;
  pool?: Maybe<Pool>;
  poolDayData?: Maybe<PoolDayData>;
  poolDayDatas: Array<PoolDayData>;
  poolHourData?: Maybe<PoolHourData>;
  poolHourDatas: Array<PoolHourData>;
  pools: Array<Pool>;
  position?: Maybe<Position>;
  positionSnapshot?: Maybe<PositionSnapshot>;
  positionSnapshots: Array<PositionSnapshot>;
  positions: Array<Position>;
  swap?: Maybe<Swap>;
  swaps: Array<Swap>;
  tick?: Maybe<Tick>;
  ticks: Array<Tick>;
  token?: Maybe<Token>;
  tokenDayData?: Maybe<TokenDayData>;
  tokenDayDatas: Array<TokenDayData>;
  tokenHourData?: Maybe<TokenHourData>;
  tokenHourDatas: Array<TokenHourData>;
  tokens: Array<Token>;
  transaction?: Maybe<Transaction>;
  transactions: Array<Transaction>;
  uniswapDayData?: Maybe<UniswapDayData>;
  uniswapDayDatas: Array<UniswapDayData>;
};


export type Query_MetaArgs = {
  block?: InputMaybe<Block_Height>;
};


export type QueryBundleArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryBundlesArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']>;
  orderBy?: InputMaybe<Bundle_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<Bundle_Filter>;
};


export type QueryBurnArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryBurnsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']>;
  orderBy?: InputMaybe<Burn_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<Burn_Filter>;
};


export type QueryCollectArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryCollectsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']>;
  orderBy?: InputMaybe<Collect_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<Collect_Filter>;
};


export type QueryFactoriesArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']>;
  orderBy?: InputMaybe<Factory_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<Factory_Filter>;
};


export type QueryFactoryArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryFlashArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryFlashesArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']>;
  orderBy?: InputMaybe<Flash_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<Flash_Filter>;
};


export type QueryMintArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryMintsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']>;
  orderBy?: InputMaybe<Mint_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<Mint_Filter>;
};


export type QueryPoolArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryPoolDayDataArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryPoolDayDatasArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']>;
  orderBy?: InputMaybe<PoolDayData_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<PoolDayData_Filter>;
};


export type QueryPoolHourDataArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryPoolHourDatasArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']>;
  orderBy?: InputMaybe<PoolHourData_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<PoolHourData_Filter>;
};


export type QueryPoolsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']>;
  orderBy?: InputMaybe<Pool_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<Pool_Filter>;
};


export type QueryPositionArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryPositionSnapshotArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryPositionSnapshotsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']>;
  orderBy?: InputMaybe<PositionSnapshot_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<PositionSnapshot_Filter>;
};


export type QueryPositionsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']>;
  orderBy?: InputMaybe<Position_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<Position_Filter>;
};


export type QuerySwapArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QuerySwapsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']>;
  orderBy?: InputMaybe<Swap_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<Swap_Filter>;
};


export type QueryTickArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryTicksArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']>;
  orderBy?: InputMaybe<Tick_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<Tick_Filter>;
};


export type QueryTokenArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryTokenDayDataArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryTokenDayDatasArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']>;
  orderBy?: InputMaybe<TokenDayData_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<TokenDayData_Filter>;
};


export type QueryTokenHourDataArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryTokenHourDatasArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']>;
  orderBy?: InputMaybe<TokenHourData_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<TokenHourData_Filter>;
};


export type QueryTokensArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']>;
  orderBy?: InputMaybe<Token_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<Token_Filter>;
};


export type QueryTransactionArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryTransactionsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']>;
  orderBy?: InputMaybe<Transaction_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<Transaction_Filter>;
};


export type QueryUniswapDayDataArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryUniswapDayDatasArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']>;
  orderBy?: InputMaybe<UniswapDayData_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<UniswapDayData_Filter>;
};

export type Swap = {
  __typename?: 'Swap';
  amount0: Scalars['BigDecimal'];
  amount1: Scalars['BigDecimal'];
  amountUSD: Scalars['BigDecimal'];
  id: Scalars['ID'];
  logIndex?: Maybe<Scalars['BigInt']>;
  origin: Scalars['Bytes'];
  pool: Pool;
  recipient: Scalars['Bytes'];
  sender: Scalars['Bytes'];
  sqrtPriceX96: Scalars['BigInt'];
  tick: Scalars['BigInt'];
  timestamp: Scalars['BigInt'];
  token0: Token;
  token1: Token;
  transaction: Transaction;
};

export type Swap_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  amount0?: InputMaybe<Scalars['BigDecimal']>;
  amount0_gt?: InputMaybe<Scalars['BigDecimal']>;
  amount0_gte?: InputMaybe<Scalars['BigDecimal']>;
  amount0_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  amount0_lt?: InputMaybe<Scalars['BigDecimal']>;
  amount0_lte?: InputMaybe<Scalars['BigDecimal']>;
  amount0_not?: InputMaybe<Scalars['BigDecimal']>;
  amount0_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  amount1?: InputMaybe<Scalars['BigDecimal']>;
  amount1_gt?: InputMaybe<Scalars['BigDecimal']>;
  amount1_gte?: InputMaybe<Scalars['BigDecimal']>;
  amount1_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  amount1_lt?: InputMaybe<Scalars['BigDecimal']>;
  amount1_lte?: InputMaybe<Scalars['BigDecimal']>;
  amount1_not?: InputMaybe<Scalars['BigDecimal']>;
  amount1_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  amountUSD?: InputMaybe<Scalars['BigDecimal']>;
  amountUSD_gt?: InputMaybe<Scalars['BigDecimal']>;
  amountUSD_gte?: InputMaybe<Scalars['BigDecimal']>;
  amountUSD_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  amountUSD_lt?: InputMaybe<Scalars['BigDecimal']>;
  amountUSD_lte?: InputMaybe<Scalars['BigDecimal']>;
  amountUSD_not?: InputMaybe<Scalars['BigDecimal']>;
  amountUSD_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  and?: InputMaybe<Array<InputMaybe<Swap_Filter>>>;
  id?: InputMaybe<Scalars['ID']>;
  id_gt?: InputMaybe<Scalars['ID']>;
  id_gte?: InputMaybe<Scalars['ID']>;
  id_in?: InputMaybe<Array<Scalars['ID']>>;
  id_lt?: InputMaybe<Scalars['ID']>;
  id_lte?: InputMaybe<Scalars['ID']>;
  id_not?: InputMaybe<Scalars['ID']>;
  id_not_in?: InputMaybe<Array<Scalars['ID']>>;
  logIndex?: InputMaybe<Scalars['BigInt']>;
  logIndex_gt?: InputMaybe<Scalars['BigInt']>;
  logIndex_gte?: InputMaybe<Scalars['BigInt']>;
  logIndex_in?: InputMaybe<Array<Scalars['BigInt']>>;
  logIndex_lt?: InputMaybe<Scalars['BigInt']>;
  logIndex_lte?: InputMaybe<Scalars['BigInt']>;
  logIndex_not?: InputMaybe<Scalars['BigInt']>;
  logIndex_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
  or?: InputMaybe<Array<InputMaybe<Swap_Filter>>>;
  origin?: InputMaybe<Scalars['Bytes']>;
  origin_contains?: InputMaybe<Scalars['Bytes']>;
  origin_gt?: InputMaybe<Scalars['Bytes']>;
  origin_gte?: InputMaybe<Scalars['Bytes']>;
  origin_in?: InputMaybe<Array<Scalars['Bytes']>>;
  origin_lt?: InputMaybe<Scalars['Bytes']>;
  origin_lte?: InputMaybe<Scalars['Bytes']>;
  origin_not?: InputMaybe<Scalars['Bytes']>;
  origin_not_contains?: InputMaybe<Scalars['Bytes']>;
  origin_not_in?: InputMaybe<Array<Scalars['Bytes']>>;
  pool?: InputMaybe<Scalars['String']>;
  pool_?: InputMaybe<Pool_Filter>;
  pool_contains?: InputMaybe<Scalars['String']>;
  pool_contains_nocase?: InputMaybe<Scalars['String']>;
  pool_ends_with?: InputMaybe<Scalars['String']>;
  pool_ends_with_nocase?: InputMaybe<Scalars['String']>;
  pool_gt?: InputMaybe<Scalars['String']>;
  pool_gte?: InputMaybe<Scalars['String']>;
  pool_in?: InputMaybe<Array<Scalars['String']>>;
  pool_lt?: InputMaybe<Scalars['String']>;
  pool_lte?: InputMaybe<Scalars['String']>;
  pool_not?: InputMaybe<Scalars['String']>;
  pool_not_contains?: InputMaybe<Scalars['String']>;
  pool_not_contains_nocase?: InputMaybe<Scalars['String']>;
  pool_not_ends_with?: InputMaybe<Scalars['String']>;
  pool_not_ends_with_nocase?: InputMaybe<Scalars['String']>;
  pool_not_in?: InputMaybe<Array<Scalars['String']>>;
  pool_not_starts_with?: InputMaybe<Scalars['String']>;
  pool_not_starts_with_nocase?: InputMaybe<Scalars['String']>;
  pool_starts_with?: InputMaybe<Scalars['String']>;
  pool_starts_with_nocase?: InputMaybe<Scalars['String']>;
  recipient?: InputMaybe<Scalars['Bytes']>;
  recipient_contains?: InputMaybe<Scalars['Bytes']>;
  recipient_gt?: InputMaybe<Scalars['Bytes']>;
  recipient_gte?: InputMaybe<Scalars['Bytes']>;
  recipient_in?: InputMaybe<Array<Scalars['Bytes']>>;
  recipient_lt?: InputMaybe<Scalars['Bytes']>;
  recipient_lte?: InputMaybe<Scalars['Bytes']>;
  recipient_not?: InputMaybe<Scalars['Bytes']>;
  recipient_not_contains?: InputMaybe<Scalars['Bytes']>;
  recipient_not_in?: InputMaybe<Array<Scalars['Bytes']>>;
  sender?: InputMaybe<Scalars['Bytes']>;
  sender_contains?: InputMaybe<Scalars['Bytes']>;
  sender_gt?: InputMaybe<Scalars['Bytes']>;
  sender_gte?: InputMaybe<Scalars['Bytes']>;
  sender_in?: InputMaybe<Array<Scalars['Bytes']>>;
  sender_lt?: InputMaybe<Scalars['Bytes']>;
  sender_lte?: InputMaybe<Scalars['Bytes']>;
  sender_not?: InputMaybe<Scalars['Bytes']>;
  sender_not_contains?: InputMaybe<Scalars['Bytes']>;
  sender_not_in?: InputMaybe<Array<Scalars['Bytes']>>;
  sqrtPriceX96?: InputMaybe<Scalars['BigInt']>;
  sqrtPriceX96_gt?: InputMaybe<Scalars['BigInt']>;
  sqrtPriceX96_gte?: InputMaybe<Scalars['BigInt']>;
  sqrtPriceX96_in?: InputMaybe<Array<Scalars['BigInt']>>;
  sqrtPriceX96_lt?: InputMaybe<Scalars['BigInt']>;
  sqrtPriceX96_lte?: InputMaybe<Scalars['BigInt']>;
  sqrtPriceX96_not?: InputMaybe<Scalars['BigInt']>;
  sqrtPriceX96_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
  tick?: InputMaybe<Scalars['BigInt']>;
  tick_gt?: InputMaybe<Scalars['BigInt']>;
  tick_gte?: InputMaybe<Scalars['BigInt']>;
  tick_in?: InputMaybe<Array<Scalars['BigInt']>>;
  tick_lt?: InputMaybe<Scalars['BigInt']>;
  tick_lte?: InputMaybe<Scalars['BigInt']>;
  tick_not?: InputMaybe<Scalars['BigInt']>;
  tick_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
  timestamp?: InputMaybe<Scalars['BigInt']>;
  timestamp_gt?: InputMaybe<Scalars['BigInt']>;
  timestamp_gte?: InputMaybe<Scalars['BigInt']>;
  timestamp_in?: InputMaybe<Array<Scalars['BigInt']>>;
  timestamp_lt?: InputMaybe<Scalars['BigInt']>;
  timestamp_lte?: InputMaybe<Scalars['BigInt']>;
  timestamp_not?: InputMaybe<Scalars['BigInt']>;
  timestamp_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
  token0?: InputMaybe<Scalars['String']>;
  token0_?: InputMaybe<Token_Filter>;
  token0_contains?: InputMaybe<Scalars['String']>;
  token0_contains_nocase?: InputMaybe<Scalars['String']>;
  token0_ends_with?: InputMaybe<Scalars['String']>;
  token0_ends_with_nocase?: InputMaybe<Scalars['String']>;
  token0_gt?: InputMaybe<Scalars['String']>;
  token0_gte?: InputMaybe<Scalars['String']>;
  token0_in?: InputMaybe<Array<Scalars['String']>>;
  token0_lt?: InputMaybe<Scalars['String']>;
  token0_lte?: InputMaybe<Scalars['String']>;
  token0_not?: InputMaybe<Scalars['String']>;
  token0_not_contains?: InputMaybe<Scalars['String']>;
  token0_not_contains_nocase?: InputMaybe<Scalars['String']>;
  token0_not_ends_with?: InputMaybe<Scalars['String']>;
  token0_not_ends_with_nocase?: InputMaybe<Scalars['String']>;
  token0_not_in?: InputMaybe<Array<Scalars['String']>>;
  token0_not_starts_with?: InputMaybe<Scalars['String']>;
  token0_not_starts_with_nocase?: InputMaybe<Scalars['String']>;
  token0_starts_with?: InputMaybe<Scalars['String']>;
  token0_starts_with_nocase?: InputMaybe<Scalars['String']>;
  token1?: InputMaybe<Scalars['String']>;
  token1_?: InputMaybe<Token_Filter>;
  token1_contains?: InputMaybe<Scalars['String']>;
  token1_contains_nocase?: InputMaybe<Scalars['String']>;
  token1_ends_with?: InputMaybe<Scalars['String']>;
  token1_ends_with_nocase?: InputMaybe<Scalars['String']>;
  token1_gt?: InputMaybe<Scalars['String']>;
  token1_gte?: InputMaybe<Scalars['String']>;
  token1_in?: InputMaybe<Array<Scalars['String']>>;
  token1_lt?: InputMaybe<Scalars['String']>;
  token1_lte?: InputMaybe<Scalars['String']>;
  token1_not?: InputMaybe<Scalars['String']>;
  token1_not_contains?: InputMaybe<Scalars['String']>;
  token1_not_contains_nocase?: InputMaybe<Scalars['String']>;
  token1_not_ends_with?: InputMaybe<Scalars['String']>;
  token1_not_ends_with_nocase?: InputMaybe<Scalars['String']>;
  token1_not_in?: InputMaybe<Array<Scalars['String']>>;
  token1_not_starts_with?: InputMaybe<Scalars['String']>;
  token1_not_starts_with_nocase?: InputMaybe<Scalars['String']>;
  token1_starts_with?: InputMaybe<Scalars['String']>;
  token1_starts_with_nocase?: InputMaybe<Scalars['String']>;
  transaction?: InputMaybe<Scalars['String']>;
  transaction_?: InputMaybe<Transaction_Filter>;
  transaction_contains?: InputMaybe<Scalars['String']>;
  transaction_contains_nocase?: InputMaybe<Scalars['String']>;
  transaction_ends_with?: InputMaybe<Scalars['String']>;
  transaction_ends_with_nocase?: InputMaybe<Scalars['String']>;
  transaction_gt?: InputMaybe<Scalars['String']>;
  transaction_gte?: InputMaybe<Scalars['String']>;
  transaction_in?: InputMaybe<Array<Scalars['String']>>;
  transaction_lt?: InputMaybe<Scalars['String']>;
  transaction_lte?: InputMaybe<Scalars['String']>;
  transaction_not?: InputMaybe<Scalars['String']>;
  transaction_not_contains?: InputMaybe<Scalars['String']>;
  transaction_not_contains_nocase?: InputMaybe<Scalars['String']>;
  transaction_not_ends_with?: InputMaybe<Scalars['String']>;
  transaction_not_ends_with_nocase?: InputMaybe<Scalars['String']>;
  transaction_not_in?: InputMaybe<Array<Scalars['String']>>;
  transaction_not_starts_with?: InputMaybe<Scalars['String']>;
  transaction_not_starts_with_nocase?: InputMaybe<Scalars['String']>;
  transaction_starts_with?: InputMaybe<Scalars['String']>;
  transaction_starts_with_nocase?: InputMaybe<Scalars['String']>;
};

export enum Swap_OrderBy {
  Amount0 = 'amount0',
  Amount1 = 'amount1',
  AmountUsd = 'amountUSD',
  Id = 'id',
  LogIndex = 'logIndex',
  Origin = 'origin',
  Pool = 'pool',
  PoolCollectedFeesToken0 = 'pool__collectedFeesToken0',
  PoolCollectedFeesToken1 = 'pool__collectedFeesToken1',
  PoolCollectedFeesUsd = 'pool__collectedFeesUSD',
  PoolCreatedAtBlockNumber = 'pool__createdAtBlockNumber',
  PoolCreatedAtTimestamp = 'pool__createdAtTimestamp',
  PoolFeeTier = 'pool__feeTier',
  PoolFeesUsd = 'pool__feesUSD',
  PoolId = 'pool__id',
  PoolLiquidity = 'pool__liquidity',
  PoolLiquidityProviderCount = 'pool__liquidityProviderCount',
  PoolObservationIndex = 'pool__observationIndex',
  PoolSqrtPrice = 'pool__sqrtPrice',
  PoolTick = 'pool__tick',
  PoolToken0Price = 'pool__token0Price',
  PoolToken1Price = 'pool__token1Price',
  PoolTotalValueLockedEth = 'pool__totalValueLockedETH',
  PoolTotalValueLockedToken0 = 'pool__totalValueLockedToken0',
  PoolTotalValueLockedToken1 = 'pool__totalValueLockedToken1',
  PoolTotalValueLockedUsd = 'pool__totalValueLockedUSD',
  PoolTotalValueLockedUsdUntracked = 'pool__totalValueLockedUSDUntracked',
  PoolTxCount = 'pool__txCount',
  PoolUntrackedVolumeUsd = 'pool__untrackedVolumeUSD',
  PoolVolumeToken0 = 'pool__volumeToken0',
  PoolVolumeToken1 = 'pool__volumeToken1',
  PoolVolumeUsd = 'pool__volumeUSD',
  Recipient = 'recipient',
  Sender = 'sender',
  SqrtPriceX96 = 'sqrtPriceX96',
  Tick = 'tick',
  Timestamp = 'timestamp',
  Token0 = 'token0',
  Token0Decimals = 'token0__decimals',
  Token0DerivedEth = 'token0__derivedETH',
  Token0FeesUsd = 'token0__feesUSD',
  Token0Id = 'token0__id',
  Token0Name = 'token0__name',
  Token0PoolCount = 'token0__poolCount',
  Token0Symbol = 'token0__symbol',
  Token0TotalSupply = 'token0__totalSupply',
  Token0TotalValueLocked = 'token0__totalValueLocked',
  Token0TotalValueLockedUsd = 'token0__totalValueLockedUSD',
  Token0TotalValueLockedUsdUntracked = 'token0__totalValueLockedUSDUntracked',
  Token0TxCount = 'token0__txCount',
  Token0UntrackedVolumeUsd = 'token0__untrackedVolumeUSD',
  Token0Volume = 'token0__volume',
  Token0VolumeUsd = 'token0__volumeUSD',
  Token1 = 'token1',
  Token1Decimals = 'token1__decimals',
  Token1DerivedEth = 'token1__derivedETH',
  Token1FeesUsd = 'token1__feesUSD',
  Token1Id = 'token1__id',
  Token1Name = 'token1__name',
  Token1PoolCount = 'token1__poolCount',
  Token1Symbol = 'token1__symbol',
  Token1TotalSupply = 'token1__totalSupply',
  Token1TotalValueLocked = 'token1__totalValueLocked',
  Token1TotalValueLockedUsd = 'token1__totalValueLockedUSD',
  Token1TotalValueLockedUsdUntracked = 'token1__totalValueLockedUSDUntracked',
  Token1TxCount = 'token1__txCount',
  Token1UntrackedVolumeUsd = 'token1__untrackedVolumeUSD',
  Token1Volume = 'token1__volume',
  Token1VolumeUsd = 'token1__volumeUSD',
  Transaction = 'transaction',
  TransactionBlockNumber = 'transaction__blockNumber',
  TransactionGasPrice = 'transaction__gasPrice',
  TransactionGasUsed = 'transaction__gasUsed',
  TransactionId = 'transaction__id',
  TransactionTimestamp = 'transaction__timestamp'
}

export type Tick = {
  __typename?: 'Tick';
  createdAtBlockNumber: Scalars['BigInt'];
  createdAtTimestamp: Scalars['BigInt'];
  id: Scalars['ID'];
  liquidityGross: Scalars['BigInt'];
  liquidityNet: Scalars['BigInt'];
  pool: Pool;
  poolAddress: Scalars['Bytes'];
  price0: Scalars['BigDecimal'];
  price1: Scalars['BigDecimal'];
  tickIdx: Scalars['BigInt'];
};

export type Tick_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<Tick_Filter>>>;
  createdAtBlockNumber?: InputMaybe<Scalars['BigInt']>;
  createdAtBlockNumber_gt?: InputMaybe<Scalars['BigInt']>;
  createdAtBlockNumber_gte?: InputMaybe<Scalars['BigInt']>;
  createdAtBlockNumber_in?: InputMaybe<Array<Scalars['BigInt']>>;
  createdAtBlockNumber_lt?: InputMaybe<Scalars['BigInt']>;
  createdAtBlockNumber_lte?: InputMaybe<Scalars['BigInt']>;
  createdAtBlockNumber_not?: InputMaybe<Scalars['BigInt']>;
  createdAtBlockNumber_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
  createdAtTimestamp?: InputMaybe<Scalars['BigInt']>;
  createdAtTimestamp_gt?: InputMaybe<Scalars['BigInt']>;
  createdAtTimestamp_gte?: InputMaybe<Scalars['BigInt']>;
  createdAtTimestamp_in?: InputMaybe<Array<Scalars['BigInt']>>;
  createdAtTimestamp_lt?: InputMaybe<Scalars['BigInt']>;
  createdAtTimestamp_lte?: InputMaybe<Scalars['BigInt']>;
  createdAtTimestamp_not?: InputMaybe<Scalars['BigInt']>;
  createdAtTimestamp_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
  id?: InputMaybe<Scalars['ID']>;
  id_gt?: InputMaybe<Scalars['ID']>;
  id_gte?: InputMaybe<Scalars['ID']>;
  id_in?: InputMaybe<Array<Scalars['ID']>>;
  id_lt?: InputMaybe<Scalars['ID']>;
  id_lte?: InputMaybe<Scalars['ID']>;
  id_not?: InputMaybe<Scalars['ID']>;
  id_not_in?: InputMaybe<Array<Scalars['ID']>>;
  liquidityGross?: InputMaybe<Scalars['BigInt']>;
  liquidityGross_gt?: InputMaybe<Scalars['BigInt']>;
  liquidityGross_gte?: InputMaybe<Scalars['BigInt']>;
  liquidityGross_in?: InputMaybe<Array<Scalars['BigInt']>>;
  liquidityGross_lt?: InputMaybe<Scalars['BigInt']>;
  liquidityGross_lte?: InputMaybe<Scalars['BigInt']>;
  liquidityGross_not?: InputMaybe<Scalars['BigInt']>;
  liquidityGross_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
  liquidityNet?: InputMaybe<Scalars['BigInt']>;
  liquidityNet_gt?: InputMaybe<Scalars['BigInt']>;
  liquidityNet_gte?: InputMaybe<Scalars['BigInt']>;
  liquidityNet_in?: InputMaybe<Array<Scalars['BigInt']>>;
  liquidityNet_lt?: InputMaybe<Scalars['BigInt']>;
  liquidityNet_lte?: InputMaybe<Scalars['BigInt']>;
  liquidityNet_not?: InputMaybe<Scalars['BigInt']>;
  liquidityNet_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
  or?: InputMaybe<Array<InputMaybe<Tick_Filter>>>;
  pool?: InputMaybe<Scalars['String']>;
  poolAddress?: InputMaybe<Scalars['Bytes']>;
  poolAddress_contains?: InputMaybe<Scalars['Bytes']>;
  poolAddress_gt?: InputMaybe<Scalars['Bytes']>;
  poolAddress_gte?: InputMaybe<Scalars['Bytes']>;
  poolAddress_in?: InputMaybe<Array<Scalars['Bytes']>>;
  poolAddress_lt?: InputMaybe<Scalars['Bytes']>;
  poolAddress_lte?: InputMaybe<Scalars['Bytes']>;
  poolAddress_not?: InputMaybe<Scalars['Bytes']>;
  poolAddress_not_contains?: InputMaybe<Scalars['Bytes']>;
  poolAddress_not_in?: InputMaybe<Array<Scalars['Bytes']>>;
  pool_?: InputMaybe<Pool_Filter>;
  pool_contains?: InputMaybe<Scalars['String']>;
  pool_contains_nocase?: InputMaybe<Scalars['String']>;
  pool_ends_with?: InputMaybe<Scalars['String']>;
  pool_ends_with_nocase?: InputMaybe<Scalars['String']>;
  pool_gt?: InputMaybe<Scalars['String']>;
  pool_gte?: InputMaybe<Scalars['String']>;
  pool_in?: InputMaybe<Array<Scalars['String']>>;
  pool_lt?: InputMaybe<Scalars['String']>;
  pool_lte?: InputMaybe<Scalars['String']>;
  pool_not?: InputMaybe<Scalars['String']>;
  pool_not_contains?: InputMaybe<Scalars['String']>;
  pool_not_contains_nocase?: InputMaybe<Scalars['String']>;
  pool_not_ends_with?: InputMaybe<Scalars['String']>;
  pool_not_ends_with_nocase?: InputMaybe<Scalars['String']>;
  pool_not_in?: InputMaybe<Array<Scalars['String']>>;
  pool_not_starts_with?: InputMaybe<Scalars['String']>;
  pool_not_starts_with_nocase?: InputMaybe<Scalars['String']>;
  pool_starts_with?: InputMaybe<Scalars['String']>;
  pool_starts_with_nocase?: InputMaybe<Scalars['String']>;
  price0?: InputMaybe<Scalars['BigDecimal']>;
  price0_gt?: InputMaybe<Scalars['BigDecimal']>;
  price0_gte?: InputMaybe<Scalars['BigDecimal']>;
  price0_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  price0_lt?: InputMaybe<Scalars['BigDecimal']>;
  price0_lte?: InputMaybe<Scalars['BigDecimal']>;
  price0_not?: InputMaybe<Scalars['BigDecimal']>;
  price0_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  price1?: InputMaybe<Scalars['BigDecimal']>;
  price1_gt?: InputMaybe<Scalars['BigDecimal']>;
  price1_gte?: InputMaybe<Scalars['BigDecimal']>;
  price1_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  price1_lt?: InputMaybe<Scalars['BigDecimal']>;
  price1_lte?: InputMaybe<Scalars['BigDecimal']>;
  price1_not?: InputMaybe<Scalars['BigDecimal']>;
  price1_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  tickIdx?: InputMaybe<Scalars['BigInt']>;
  tickIdx_gt?: InputMaybe<Scalars['BigInt']>;
  tickIdx_gte?: InputMaybe<Scalars['BigInt']>;
  tickIdx_in?: InputMaybe<Array<Scalars['BigInt']>>;
  tickIdx_lt?: InputMaybe<Scalars['BigInt']>;
  tickIdx_lte?: InputMaybe<Scalars['BigInt']>;
  tickIdx_not?: InputMaybe<Scalars['BigInt']>;
  tickIdx_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
};

export enum Tick_OrderBy {
  CreatedAtBlockNumber = 'createdAtBlockNumber',
  CreatedAtTimestamp = 'createdAtTimestamp',
  Id = 'id',
  LiquidityGross = 'liquidityGross',
  LiquidityNet = 'liquidityNet',
  Pool = 'pool',
  PoolAddress = 'poolAddress',
  PoolCollectedFeesToken0 = 'pool__collectedFeesToken0',
  PoolCollectedFeesToken1 = 'pool__collectedFeesToken1',
  PoolCollectedFeesUsd = 'pool__collectedFeesUSD',
  PoolCreatedAtBlockNumber = 'pool__createdAtBlockNumber',
  PoolCreatedAtTimestamp = 'pool__createdAtTimestamp',
  PoolFeeTier = 'pool__feeTier',
  PoolFeesUsd = 'pool__feesUSD',
  PoolId = 'pool__id',
  PoolLiquidity = 'pool__liquidity',
  PoolLiquidityProviderCount = 'pool__liquidityProviderCount',
  PoolObservationIndex = 'pool__observationIndex',
  PoolSqrtPrice = 'pool__sqrtPrice',
  PoolTick = 'pool__tick',
  PoolToken0Price = 'pool__token0Price',
  PoolToken1Price = 'pool__token1Price',
  PoolTotalValueLockedEth = 'pool__totalValueLockedETH',
  PoolTotalValueLockedToken0 = 'pool__totalValueLockedToken0',
  PoolTotalValueLockedToken1 = 'pool__totalValueLockedToken1',
  PoolTotalValueLockedUsd = 'pool__totalValueLockedUSD',
  PoolTotalValueLockedUsdUntracked = 'pool__totalValueLockedUSDUntracked',
  PoolTxCount = 'pool__txCount',
  PoolUntrackedVolumeUsd = 'pool__untrackedVolumeUSD',
  PoolVolumeToken0 = 'pool__volumeToken0',
  PoolVolumeToken1 = 'pool__volumeToken1',
  PoolVolumeUsd = 'pool__volumeUSD',
  Price0 = 'price0',
  Price1 = 'price1',
  TickIdx = 'tickIdx'
}

export type Token = {
  __typename?: 'Token';
  decimals: Scalars['BigInt'];
  derivedETH: Scalars['BigDecimal'];
  feesUSD: Scalars['BigDecimal'];
  id: Scalars['Bytes'];
  name: Scalars['String'];
  poolCount: Scalars['BigInt'];
  symbol: Scalars['String'];
  tokenDayData: Array<TokenDayData>;
  totalSupply: Scalars['BigInt'];
  totalValueLocked: Scalars['BigDecimal'];
  totalValueLockedUSD: Scalars['BigDecimal'];
  totalValueLockedUSDUntracked: Scalars['BigDecimal'];
  txCount: Scalars['BigInt'];
  untrackedVolumeUSD: Scalars['BigDecimal'];
  volume: Scalars['BigDecimal'];
  volumeUSD: Scalars['BigDecimal'];
  whitelistPools: Array<Pool>;
};


export type TokenTokenDayDataArgs = {
  first?: InputMaybe<Scalars['Int']>;
  orderBy?: InputMaybe<TokenDayData_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']>;
  where?: InputMaybe<TokenDayData_Filter>;
};


export type TokenWhitelistPoolsArgs = {
  first?: InputMaybe<Scalars['Int']>;
  orderBy?: InputMaybe<Pool_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']>;
  where?: InputMaybe<Pool_Filter>;
};

export type TokenDayData = {
  __typename?: 'TokenDayData';
  close: Scalars['BigDecimal'];
  date: Scalars['Int'];
  feesUSD: Scalars['BigDecimal'];
  high: Scalars['BigDecimal'];
  id: Scalars['ID'];
  low: Scalars['BigDecimal'];
  open: Scalars['BigDecimal'];
  priceUSD: Scalars['BigDecimal'];
  token: Token;
  totalValueLocked: Scalars['BigDecimal'];
  totalValueLockedUSD: Scalars['BigDecimal'];
  untrackedVolumeUSD: Scalars['BigDecimal'];
  volume: Scalars['BigDecimal'];
  volumeUSD: Scalars['BigDecimal'];
};

export type TokenDayData_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<TokenDayData_Filter>>>;
  close?: InputMaybe<Scalars['BigDecimal']>;
  close_gt?: InputMaybe<Scalars['BigDecimal']>;
  close_gte?: InputMaybe<Scalars['BigDecimal']>;
  close_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  close_lt?: InputMaybe<Scalars['BigDecimal']>;
  close_lte?: InputMaybe<Scalars['BigDecimal']>;
  close_not?: InputMaybe<Scalars['BigDecimal']>;
  close_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  date?: InputMaybe<Scalars['Int']>;
  date_gt?: InputMaybe<Scalars['Int']>;
  date_gte?: InputMaybe<Scalars['Int']>;
  date_in?: InputMaybe<Array<Scalars['Int']>>;
  date_lt?: InputMaybe<Scalars['Int']>;
  date_lte?: InputMaybe<Scalars['Int']>;
  date_not?: InputMaybe<Scalars['Int']>;
  date_not_in?: InputMaybe<Array<Scalars['Int']>>;
  feesUSD?: InputMaybe<Scalars['BigDecimal']>;
  feesUSD_gt?: InputMaybe<Scalars['BigDecimal']>;
  feesUSD_gte?: InputMaybe<Scalars['BigDecimal']>;
  feesUSD_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  feesUSD_lt?: InputMaybe<Scalars['BigDecimal']>;
  feesUSD_lte?: InputMaybe<Scalars['BigDecimal']>;
  feesUSD_not?: InputMaybe<Scalars['BigDecimal']>;
  feesUSD_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  high?: InputMaybe<Scalars['BigDecimal']>;
  high_gt?: InputMaybe<Scalars['BigDecimal']>;
  high_gte?: InputMaybe<Scalars['BigDecimal']>;
  high_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  high_lt?: InputMaybe<Scalars['BigDecimal']>;
  high_lte?: InputMaybe<Scalars['BigDecimal']>;
  high_not?: InputMaybe<Scalars['BigDecimal']>;
  high_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  id?: InputMaybe<Scalars['ID']>;
  id_gt?: InputMaybe<Scalars['ID']>;
  id_gte?: InputMaybe<Scalars['ID']>;
  id_in?: InputMaybe<Array<Scalars['ID']>>;
  id_lt?: InputMaybe<Scalars['ID']>;
  id_lte?: InputMaybe<Scalars['ID']>;
  id_not?: InputMaybe<Scalars['ID']>;
  id_not_in?: InputMaybe<Array<Scalars['ID']>>;
  low?: InputMaybe<Scalars['BigDecimal']>;
  low_gt?: InputMaybe<Scalars['BigDecimal']>;
  low_gte?: InputMaybe<Scalars['BigDecimal']>;
  low_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  low_lt?: InputMaybe<Scalars['BigDecimal']>;
  low_lte?: InputMaybe<Scalars['BigDecimal']>;
  low_not?: InputMaybe<Scalars['BigDecimal']>;
  low_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  open?: InputMaybe<Scalars['BigDecimal']>;
  open_gt?: InputMaybe<Scalars['BigDecimal']>;
  open_gte?: InputMaybe<Scalars['BigDecimal']>;
  open_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  open_lt?: InputMaybe<Scalars['BigDecimal']>;
  open_lte?: InputMaybe<Scalars['BigDecimal']>;
  open_not?: InputMaybe<Scalars['BigDecimal']>;
  open_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  or?: InputMaybe<Array<InputMaybe<TokenDayData_Filter>>>;
  priceUSD?: InputMaybe<Scalars['BigDecimal']>;
  priceUSD_gt?: InputMaybe<Scalars['BigDecimal']>;
  priceUSD_gte?: InputMaybe<Scalars['BigDecimal']>;
  priceUSD_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  priceUSD_lt?: InputMaybe<Scalars['BigDecimal']>;
  priceUSD_lte?: InputMaybe<Scalars['BigDecimal']>;
  priceUSD_not?: InputMaybe<Scalars['BigDecimal']>;
  priceUSD_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  token?: InputMaybe<Scalars['String']>;
  token_?: InputMaybe<Token_Filter>;
  token_contains?: InputMaybe<Scalars['String']>;
  token_contains_nocase?: InputMaybe<Scalars['String']>;
  token_ends_with?: InputMaybe<Scalars['String']>;
  token_ends_with_nocase?: InputMaybe<Scalars['String']>;
  token_gt?: InputMaybe<Scalars['String']>;
  token_gte?: InputMaybe<Scalars['String']>;
  token_in?: InputMaybe<Array<Scalars['String']>>;
  token_lt?: InputMaybe<Scalars['String']>;
  token_lte?: InputMaybe<Scalars['String']>;
  token_not?: InputMaybe<Scalars['String']>;
  token_not_contains?: InputMaybe<Scalars['String']>;
  token_not_contains_nocase?: InputMaybe<Scalars['String']>;
  token_not_ends_with?: InputMaybe<Scalars['String']>;
  token_not_ends_with_nocase?: InputMaybe<Scalars['String']>;
  token_not_in?: InputMaybe<Array<Scalars['String']>>;
  token_not_starts_with?: InputMaybe<Scalars['String']>;
  token_not_starts_with_nocase?: InputMaybe<Scalars['String']>;
  token_starts_with?: InputMaybe<Scalars['String']>;
  token_starts_with_nocase?: InputMaybe<Scalars['String']>;
  totalValueLocked?: InputMaybe<Scalars['BigDecimal']>;
  totalValueLockedUSD?: InputMaybe<Scalars['BigDecimal']>;
  totalValueLockedUSD_gt?: InputMaybe<Scalars['BigDecimal']>;
  totalValueLockedUSD_gte?: InputMaybe<Scalars['BigDecimal']>;
  totalValueLockedUSD_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  totalValueLockedUSD_lt?: InputMaybe<Scalars['BigDecimal']>;
  totalValueLockedUSD_lte?: InputMaybe<Scalars['BigDecimal']>;
  totalValueLockedUSD_not?: InputMaybe<Scalars['BigDecimal']>;
  totalValueLockedUSD_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  totalValueLocked_gt?: InputMaybe<Scalars['BigDecimal']>;
  totalValueLocked_gte?: InputMaybe<Scalars['BigDecimal']>;
  totalValueLocked_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  totalValueLocked_lt?: InputMaybe<Scalars['BigDecimal']>;
  totalValueLocked_lte?: InputMaybe<Scalars['BigDecimal']>;
  totalValueLocked_not?: InputMaybe<Scalars['BigDecimal']>;
  totalValueLocked_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  untrackedVolumeUSD?: InputMaybe<Scalars['BigDecimal']>;
  untrackedVolumeUSD_gt?: InputMaybe<Scalars['BigDecimal']>;
  untrackedVolumeUSD_gte?: InputMaybe<Scalars['BigDecimal']>;
  untrackedVolumeUSD_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  untrackedVolumeUSD_lt?: InputMaybe<Scalars['BigDecimal']>;
  untrackedVolumeUSD_lte?: InputMaybe<Scalars['BigDecimal']>;
  untrackedVolumeUSD_not?: InputMaybe<Scalars['BigDecimal']>;
  untrackedVolumeUSD_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  volume?: InputMaybe<Scalars['BigDecimal']>;
  volumeUSD?: InputMaybe<Scalars['BigDecimal']>;
  volumeUSD_gt?: InputMaybe<Scalars['BigDecimal']>;
  volumeUSD_gte?: InputMaybe<Scalars['BigDecimal']>;
  volumeUSD_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  volumeUSD_lt?: InputMaybe<Scalars['BigDecimal']>;
  volumeUSD_lte?: InputMaybe<Scalars['BigDecimal']>;
  volumeUSD_not?: InputMaybe<Scalars['BigDecimal']>;
  volumeUSD_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  volume_gt?: InputMaybe<Scalars['BigDecimal']>;
  volume_gte?: InputMaybe<Scalars['BigDecimal']>;
  volume_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  volume_lt?: InputMaybe<Scalars['BigDecimal']>;
  volume_lte?: InputMaybe<Scalars['BigDecimal']>;
  volume_not?: InputMaybe<Scalars['BigDecimal']>;
  volume_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
};

export enum TokenDayData_OrderBy {
  Close = 'close',
  Date = 'date',
  FeesUsd = 'feesUSD',
  High = 'high',
  Id = 'id',
  Low = 'low',
  Open = 'open',
  PriceUsd = 'priceUSD',
  Token = 'token',
  TokenDecimals = 'token__decimals',
  TokenDerivedEth = 'token__derivedETH',
  TokenFeesUsd = 'token__feesUSD',
  TokenId = 'token__id',
  TokenName = 'token__name',
  TokenPoolCount = 'token__poolCount',
  TokenSymbol = 'token__symbol',
  TokenTotalSupply = 'token__totalSupply',
  TokenTotalValueLocked = 'token__totalValueLocked',
  TokenTotalValueLockedUsd = 'token__totalValueLockedUSD',
  TokenTotalValueLockedUsdUntracked = 'token__totalValueLockedUSDUntracked',
  TokenTxCount = 'token__txCount',
  TokenUntrackedVolumeUsd = 'token__untrackedVolumeUSD',
  TokenVolume = 'token__volume',
  TokenVolumeUsd = 'token__volumeUSD',
  TotalValueLocked = 'totalValueLocked',
  TotalValueLockedUsd = 'totalValueLockedUSD',
  UntrackedVolumeUsd = 'untrackedVolumeUSD',
  Volume = 'volume',
  VolumeUsd = 'volumeUSD'
}

export type TokenHourData = {
  __typename?: 'TokenHourData';
  close: Scalars['BigDecimal'];
  feesUSD: Scalars['BigDecimal'];
  high: Scalars['BigDecimal'];
  id: Scalars['ID'];
  low: Scalars['BigDecimal'];
  open: Scalars['BigDecimal'];
  periodStartUnix: Scalars['Int'];
  priceUSD: Scalars['BigDecimal'];
  token: Token;
  totalValueLocked: Scalars['BigDecimal'];
  totalValueLockedUSD: Scalars['BigDecimal'];
  untrackedVolumeUSD: Scalars['BigDecimal'];
  volume: Scalars['BigDecimal'];
  volumeUSD: Scalars['BigDecimal'];
};

export type TokenHourData_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<TokenHourData_Filter>>>;
  close?: InputMaybe<Scalars['BigDecimal']>;
  close_gt?: InputMaybe<Scalars['BigDecimal']>;
  close_gte?: InputMaybe<Scalars['BigDecimal']>;
  close_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  close_lt?: InputMaybe<Scalars['BigDecimal']>;
  close_lte?: InputMaybe<Scalars['BigDecimal']>;
  close_not?: InputMaybe<Scalars['BigDecimal']>;
  close_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  feesUSD?: InputMaybe<Scalars['BigDecimal']>;
  feesUSD_gt?: InputMaybe<Scalars['BigDecimal']>;
  feesUSD_gte?: InputMaybe<Scalars['BigDecimal']>;
  feesUSD_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  feesUSD_lt?: InputMaybe<Scalars['BigDecimal']>;
  feesUSD_lte?: InputMaybe<Scalars['BigDecimal']>;
  feesUSD_not?: InputMaybe<Scalars['BigDecimal']>;
  feesUSD_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  high?: InputMaybe<Scalars['BigDecimal']>;
  high_gt?: InputMaybe<Scalars['BigDecimal']>;
  high_gte?: InputMaybe<Scalars['BigDecimal']>;
  high_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  high_lt?: InputMaybe<Scalars['BigDecimal']>;
  high_lte?: InputMaybe<Scalars['BigDecimal']>;
  high_not?: InputMaybe<Scalars['BigDecimal']>;
  high_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  id?: InputMaybe<Scalars['ID']>;
  id_gt?: InputMaybe<Scalars['ID']>;
  id_gte?: InputMaybe<Scalars['ID']>;
  id_in?: InputMaybe<Array<Scalars['ID']>>;
  id_lt?: InputMaybe<Scalars['ID']>;
  id_lte?: InputMaybe<Scalars['ID']>;
  id_not?: InputMaybe<Scalars['ID']>;
  id_not_in?: InputMaybe<Array<Scalars['ID']>>;
  low?: InputMaybe<Scalars['BigDecimal']>;
  low_gt?: InputMaybe<Scalars['BigDecimal']>;
  low_gte?: InputMaybe<Scalars['BigDecimal']>;
  low_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  low_lt?: InputMaybe<Scalars['BigDecimal']>;
  low_lte?: InputMaybe<Scalars['BigDecimal']>;
  low_not?: InputMaybe<Scalars['BigDecimal']>;
  low_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  open?: InputMaybe<Scalars['BigDecimal']>;
  open_gt?: InputMaybe<Scalars['BigDecimal']>;
  open_gte?: InputMaybe<Scalars['BigDecimal']>;
  open_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  open_lt?: InputMaybe<Scalars['BigDecimal']>;
  open_lte?: InputMaybe<Scalars['BigDecimal']>;
  open_not?: InputMaybe<Scalars['BigDecimal']>;
  open_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  or?: InputMaybe<Array<InputMaybe<TokenHourData_Filter>>>;
  periodStartUnix?: InputMaybe<Scalars['Int']>;
  periodStartUnix_gt?: InputMaybe<Scalars['Int']>;
  periodStartUnix_gte?: InputMaybe<Scalars['Int']>;
  periodStartUnix_in?: InputMaybe<Array<Scalars['Int']>>;
  periodStartUnix_lt?: InputMaybe<Scalars['Int']>;
  periodStartUnix_lte?: InputMaybe<Scalars['Int']>;
  periodStartUnix_not?: InputMaybe<Scalars['Int']>;
  periodStartUnix_not_in?: InputMaybe<Array<Scalars['Int']>>;
  priceUSD?: InputMaybe<Scalars['BigDecimal']>;
  priceUSD_gt?: InputMaybe<Scalars['BigDecimal']>;
  priceUSD_gte?: InputMaybe<Scalars['BigDecimal']>;
  priceUSD_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  priceUSD_lt?: InputMaybe<Scalars['BigDecimal']>;
  priceUSD_lte?: InputMaybe<Scalars['BigDecimal']>;
  priceUSD_not?: InputMaybe<Scalars['BigDecimal']>;
  priceUSD_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  token?: InputMaybe<Scalars['String']>;
  token_?: InputMaybe<Token_Filter>;
  token_contains?: InputMaybe<Scalars['String']>;
  token_contains_nocase?: InputMaybe<Scalars['String']>;
  token_ends_with?: InputMaybe<Scalars['String']>;
  token_ends_with_nocase?: InputMaybe<Scalars['String']>;
  token_gt?: InputMaybe<Scalars['String']>;
  token_gte?: InputMaybe<Scalars['String']>;
  token_in?: InputMaybe<Array<Scalars['String']>>;
  token_lt?: InputMaybe<Scalars['String']>;
  token_lte?: InputMaybe<Scalars['String']>;
  token_not?: InputMaybe<Scalars['String']>;
  token_not_contains?: InputMaybe<Scalars['String']>;
  token_not_contains_nocase?: InputMaybe<Scalars['String']>;
  token_not_ends_with?: InputMaybe<Scalars['String']>;
  token_not_ends_with_nocase?: InputMaybe<Scalars['String']>;
  token_not_in?: InputMaybe<Array<Scalars['String']>>;
  token_not_starts_with?: InputMaybe<Scalars['String']>;
  token_not_starts_with_nocase?: InputMaybe<Scalars['String']>;
  token_starts_with?: InputMaybe<Scalars['String']>;
  token_starts_with_nocase?: InputMaybe<Scalars['String']>;
  totalValueLocked?: InputMaybe<Scalars['BigDecimal']>;
  totalValueLockedUSD?: InputMaybe<Scalars['BigDecimal']>;
  totalValueLockedUSD_gt?: InputMaybe<Scalars['BigDecimal']>;
  totalValueLockedUSD_gte?: InputMaybe<Scalars['BigDecimal']>;
  totalValueLockedUSD_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  totalValueLockedUSD_lt?: InputMaybe<Scalars['BigDecimal']>;
  totalValueLockedUSD_lte?: InputMaybe<Scalars['BigDecimal']>;
  totalValueLockedUSD_not?: InputMaybe<Scalars['BigDecimal']>;
  totalValueLockedUSD_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  totalValueLocked_gt?: InputMaybe<Scalars['BigDecimal']>;
  totalValueLocked_gte?: InputMaybe<Scalars['BigDecimal']>;
  totalValueLocked_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  totalValueLocked_lt?: InputMaybe<Scalars['BigDecimal']>;
  totalValueLocked_lte?: InputMaybe<Scalars['BigDecimal']>;
  totalValueLocked_not?: InputMaybe<Scalars['BigDecimal']>;
  totalValueLocked_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  untrackedVolumeUSD?: InputMaybe<Scalars['BigDecimal']>;
  untrackedVolumeUSD_gt?: InputMaybe<Scalars['BigDecimal']>;
  untrackedVolumeUSD_gte?: InputMaybe<Scalars['BigDecimal']>;
  untrackedVolumeUSD_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  untrackedVolumeUSD_lt?: InputMaybe<Scalars['BigDecimal']>;
  untrackedVolumeUSD_lte?: InputMaybe<Scalars['BigDecimal']>;
  untrackedVolumeUSD_not?: InputMaybe<Scalars['BigDecimal']>;
  untrackedVolumeUSD_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  volume?: InputMaybe<Scalars['BigDecimal']>;
  volumeUSD?: InputMaybe<Scalars['BigDecimal']>;
  volumeUSD_gt?: InputMaybe<Scalars['BigDecimal']>;
  volumeUSD_gte?: InputMaybe<Scalars['BigDecimal']>;
  volumeUSD_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  volumeUSD_lt?: InputMaybe<Scalars['BigDecimal']>;
  volumeUSD_lte?: InputMaybe<Scalars['BigDecimal']>;
  volumeUSD_not?: InputMaybe<Scalars['BigDecimal']>;
  volumeUSD_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  volume_gt?: InputMaybe<Scalars['BigDecimal']>;
  volume_gte?: InputMaybe<Scalars['BigDecimal']>;
  volume_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  volume_lt?: InputMaybe<Scalars['BigDecimal']>;
  volume_lte?: InputMaybe<Scalars['BigDecimal']>;
  volume_not?: InputMaybe<Scalars['BigDecimal']>;
  volume_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
};

export enum TokenHourData_OrderBy {
  Close = 'close',
  FeesUsd = 'feesUSD',
  High = 'high',
  Id = 'id',
  Low = 'low',
  Open = 'open',
  PeriodStartUnix = 'periodStartUnix',
  PriceUsd = 'priceUSD',
  Token = 'token',
  TokenDecimals = 'token__decimals',
  TokenDerivedEth = 'token__derivedETH',
  TokenFeesUsd = 'token__feesUSD',
  TokenId = 'token__id',
  TokenName = 'token__name',
  TokenPoolCount = 'token__poolCount',
  TokenSymbol = 'token__symbol',
  TokenTotalSupply = 'token__totalSupply',
  TokenTotalValueLocked = 'token__totalValueLocked',
  TokenTotalValueLockedUsd = 'token__totalValueLockedUSD',
  TokenTotalValueLockedUsdUntracked = 'token__totalValueLockedUSDUntracked',
  TokenTxCount = 'token__txCount',
  TokenUntrackedVolumeUsd = 'token__untrackedVolumeUSD',
  TokenVolume = 'token__volume',
  TokenVolumeUsd = 'token__volumeUSD',
  TotalValueLocked = 'totalValueLocked',
  TotalValueLockedUsd = 'totalValueLockedUSD',
  UntrackedVolumeUsd = 'untrackedVolumeUSD',
  Volume = 'volume',
  VolumeUsd = 'volumeUSD'
}

export type Token_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<Token_Filter>>>;
  decimals?: InputMaybe<Scalars['BigInt']>;
  decimals_gt?: InputMaybe<Scalars['BigInt']>;
  decimals_gte?: InputMaybe<Scalars['BigInt']>;
  decimals_in?: InputMaybe<Array<Scalars['BigInt']>>;
  decimals_lt?: InputMaybe<Scalars['BigInt']>;
  decimals_lte?: InputMaybe<Scalars['BigInt']>;
  decimals_not?: InputMaybe<Scalars['BigInt']>;
  decimals_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
  derivedETH?: InputMaybe<Scalars['BigDecimal']>;
  derivedETH_gt?: InputMaybe<Scalars['BigDecimal']>;
  derivedETH_gte?: InputMaybe<Scalars['BigDecimal']>;
  derivedETH_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  derivedETH_lt?: InputMaybe<Scalars['BigDecimal']>;
  derivedETH_lte?: InputMaybe<Scalars['BigDecimal']>;
  derivedETH_not?: InputMaybe<Scalars['BigDecimal']>;
  derivedETH_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  feesUSD?: InputMaybe<Scalars['BigDecimal']>;
  feesUSD_gt?: InputMaybe<Scalars['BigDecimal']>;
  feesUSD_gte?: InputMaybe<Scalars['BigDecimal']>;
  feesUSD_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  feesUSD_lt?: InputMaybe<Scalars['BigDecimal']>;
  feesUSD_lte?: InputMaybe<Scalars['BigDecimal']>;
  feesUSD_not?: InputMaybe<Scalars['BigDecimal']>;
  feesUSD_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  id?: InputMaybe<Scalars['Bytes']>;
  id_contains?: InputMaybe<Scalars['Bytes']>;
  id_gt?: InputMaybe<Scalars['Bytes']>;
  id_gte?: InputMaybe<Scalars['Bytes']>;
  id_in?: InputMaybe<Array<Scalars['Bytes']>>;
  id_lt?: InputMaybe<Scalars['Bytes']>;
  id_lte?: InputMaybe<Scalars['Bytes']>;
  id_not?: InputMaybe<Scalars['Bytes']>;
  id_not_contains?: InputMaybe<Scalars['Bytes']>;
  id_not_in?: InputMaybe<Array<Scalars['Bytes']>>;
  name?: InputMaybe<Scalars['String']>;
  name_contains?: InputMaybe<Scalars['String']>;
  name_contains_nocase?: InputMaybe<Scalars['String']>;
  name_ends_with?: InputMaybe<Scalars['String']>;
  name_ends_with_nocase?: InputMaybe<Scalars['String']>;
  name_gt?: InputMaybe<Scalars['String']>;
  name_gte?: InputMaybe<Scalars['String']>;
  name_in?: InputMaybe<Array<Scalars['String']>>;
  name_lt?: InputMaybe<Scalars['String']>;
  name_lte?: InputMaybe<Scalars['String']>;
  name_not?: InputMaybe<Scalars['String']>;
  name_not_contains?: InputMaybe<Scalars['String']>;
  name_not_contains_nocase?: InputMaybe<Scalars['String']>;
  name_not_ends_with?: InputMaybe<Scalars['String']>;
  name_not_ends_with_nocase?: InputMaybe<Scalars['String']>;
  name_not_in?: InputMaybe<Array<Scalars['String']>>;
  name_not_starts_with?: InputMaybe<Scalars['String']>;
  name_not_starts_with_nocase?: InputMaybe<Scalars['String']>;
  name_starts_with?: InputMaybe<Scalars['String']>;
  name_starts_with_nocase?: InputMaybe<Scalars['String']>;
  or?: InputMaybe<Array<InputMaybe<Token_Filter>>>;
  poolCount?: InputMaybe<Scalars['BigInt']>;
  poolCount_gt?: InputMaybe<Scalars['BigInt']>;
  poolCount_gte?: InputMaybe<Scalars['BigInt']>;
  poolCount_in?: InputMaybe<Array<Scalars['BigInt']>>;
  poolCount_lt?: InputMaybe<Scalars['BigInt']>;
  poolCount_lte?: InputMaybe<Scalars['BigInt']>;
  poolCount_not?: InputMaybe<Scalars['BigInt']>;
  poolCount_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
  symbol?: InputMaybe<Scalars['String']>;
  symbol_contains?: InputMaybe<Scalars['String']>;
  symbol_contains_nocase?: InputMaybe<Scalars['String']>;
  symbol_ends_with?: InputMaybe<Scalars['String']>;
  symbol_ends_with_nocase?: InputMaybe<Scalars['String']>;
  symbol_gt?: InputMaybe<Scalars['String']>;
  symbol_gte?: InputMaybe<Scalars['String']>;
  symbol_in?: InputMaybe<Array<Scalars['String']>>;
  symbol_lt?: InputMaybe<Scalars['String']>;
  symbol_lte?: InputMaybe<Scalars['String']>;
  symbol_not?: InputMaybe<Scalars['String']>;
  symbol_not_contains?: InputMaybe<Scalars['String']>;
  symbol_not_contains_nocase?: InputMaybe<Scalars['String']>;
  symbol_not_ends_with?: InputMaybe<Scalars['String']>;
  symbol_not_ends_with_nocase?: InputMaybe<Scalars['String']>;
  symbol_not_in?: InputMaybe<Array<Scalars['String']>>;
  symbol_not_starts_with?: InputMaybe<Scalars['String']>;
  symbol_not_starts_with_nocase?: InputMaybe<Scalars['String']>;
  symbol_starts_with?: InputMaybe<Scalars['String']>;
  symbol_starts_with_nocase?: InputMaybe<Scalars['String']>;
  tokenDayData_?: InputMaybe<TokenDayData_Filter>;
  totalSupply?: InputMaybe<Scalars['BigInt']>;
  totalSupply_gt?: InputMaybe<Scalars['BigInt']>;
  totalSupply_gte?: InputMaybe<Scalars['BigInt']>;
  totalSupply_in?: InputMaybe<Array<Scalars['BigInt']>>;
  totalSupply_lt?: InputMaybe<Scalars['BigInt']>;
  totalSupply_lte?: InputMaybe<Scalars['BigInt']>;
  totalSupply_not?: InputMaybe<Scalars['BigInt']>;
  totalSupply_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
  totalValueLocked?: InputMaybe<Scalars['BigDecimal']>;
  totalValueLockedUSD?: InputMaybe<Scalars['BigDecimal']>;
  totalValueLockedUSDUntracked?: InputMaybe<Scalars['BigDecimal']>;
  totalValueLockedUSDUntracked_gt?: InputMaybe<Scalars['BigDecimal']>;
  totalValueLockedUSDUntracked_gte?: InputMaybe<Scalars['BigDecimal']>;
  totalValueLockedUSDUntracked_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  totalValueLockedUSDUntracked_lt?: InputMaybe<Scalars['BigDecimal']>;
  totalValueLockedUSDUntracked_lte?: InputMaybe<Scalars['BigDecimal']>;
  totalValueLockedUSDUntracked_not?: InputMaybe<Scalars['BigDecimal']>;
  totalValueLockedUSDUntracked_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  totalValueLockedUSD_gt?: InputMaybe<Scalars['BigDecimal']>;
  totalValueLockedUSD_gte?: InputMaybe<Scalars['BigDecimal']>;
  totalValueLockedUSD_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  totalValueLockedUSD_lt?: InputMaybe<Scalars['BigDecimal']>;
  totalValueLockedUSD_lte?: InputMaybe<Scalars['BigDecimal']>;
  totalValueLockedUSD_not?: InputMaybe<Scalars['BigDecimal']>;
  totalValueLockedUSD_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  totalValueLocked_gt?: InputMaybe<Scalars['BigDecimal']>;
  totalValueLocked_gte?: InputMaybe<Scalars['BigDecimal']>;
  totalValueLocked_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  totalValueLocked_lt?: InputMaybe<Scalars['BigDecimal']>;
  totalValueLocked_lte?: InputMaybe<Scalars['BigDecimal']>;
  totalValueLocked_not?: InputMaybe<Scalars['BigDecimal']>;
  totalValueLocked_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  txCount?: InputMaybe<Scalars['BigInt']>;
  txCount_gt?: InputMaybe<Scalars['BigInt']>;
  txCount_gte?: InputMaybe<Scalars['BigInt']>;
  txCount_in?: InputMaybe<Array<Scalars['BigInt']>>;
  txCount_lt?: InputMaybe<Scalars['BigInt']>;
  txCount_lte?: InputMaybe<Scalars['BigInt']>;
  txCount_not?: InputMaybe<Scalars['BigInt']>;
  txCount_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
  untrackedVolumeUSD?: InputMaybe<Scalars['BigDecimal']>;
  untrackedVolumeUSD_gt?: InputMaybe<Scalars['BigDecimal']>;
  untrackedVolumeUSD_gte?: InputMaybe<Scalars['BigDecimal']>;
  untrackedVolumeUSD_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  untrackedVolumeUSD_lt?: InputMaybe<Scalars['BigDecimal']>;
  untrackedVolumeUSD_lte?: InputMaybe<Scalars['BigDecimal']>;
  untrackedVolumeUSD_not?: InputMaybe<Scalars['BigDecimal']>;
  untrackedVolumeUSD_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  volume?: InputMaybe<Scalars['BigDecimal']>;
  volumeUSD?: InputMaybe<Scalars['BigDecimal']>;
  volumeUSD_gt?: InputMaybe<Scalars['BigDecimal']>;
  volumeUSD_gte?: InputMaybe<Scalars['BigDecimal']>;
  volumeUSD_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  volumeUSD_lt?: InputMaybe<Scalars['BigDecimal']>;
  volumeUSD_lte?: InputMaybe<Scalars['BigDecimal']>;
  volumeUSD_not?: InputMaybe<Scalars['BigDecimal']>;
  volumeUSD_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  volume_gt?: InputMaybe<Scalars['BigDecimal']>;
  volume_gte?: InputMaybe<Scalars['BigDecimal']>;
  volume_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  volume_lt?: InputMaybe<Scalars['BigDecimal']>;
  volume_lte?: InputMaybe<Scalars['BigDecimal']>;
  volume_not?: InputMaybe<Scalars['BigDecimal']>;
  volume_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  whitelistPools?: InputMaybe<Array<Scalars['String']>>;
  whitelistPools_?: InputMaybe<Pool_Filter>;
  whitelistPools_contains?: InputMaybe<Array<Scalars['String']>>;
  whitelistPools_contains_nocase?: InputMaybe<Array<Scalars['String']>>;
  whitelistPools_not?: InputMaybe<Array<Scalars['String']>>;
  whitelistPools_not_contains?: InputMaybe<Array<Scalars['String']>>;
  whitelistPools_not_contains_nocase?: InputMaybe<Array<Scalars['String']>>;
};

export enum Token_OrderBy {
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
  WhitelistPools = 'whitelistPools'
}

export type Transaction = {
  __typename?: 'Transaction';
  blockNumber: Scalars['BigInt'];
  burns: Array<Maybe<Burn>>;
  collects: Array<Maybe<Collect>>;
  flashed: Array<Maybe<Flash>>;
  gasPrice: Scalars['BigInt'];
  gasUsed: Scalars['BigInt'];
  id: Scalars['ID'];
  mints: Array<Maybe<Mint>>;
  swaps: Array<Maybe<Swap>>;
  timestamp: Scalars['BigInt'];
};


export type TransactionBurnsArgs = {
  first?: InputMaybe<Scalars['Int']>;
  orderBy?: InputMaybe<Burn_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']>;
  where?: InputMaybe<Burn_Filter>;
};


export type TransactionCollectsArgs = {
  first?: InputMaybe<Scalars['Int']>;
  orderBy?: InputMaybe<Collect_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']>;
  where?: InputMaybe<Collect_Filter>;
};


export type TransactionFlashedArgs = {
  first?: InputMaybe<Scalars['Int']>;
  orderBy?: InputMaybe<Flash_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']>;
  where?: InputMaybe<Flash_Filter>;
};


export type TransactionMintsArgs = {
  first?: InputMaybe<Scalars['Int']>;
  orderBy?: InputMaybe<Mint_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']>;
  where?: InputMaybe<Mint_Filter>;
};


export type TransactionSwapsArgs = {
  first?: InputMaybe<Scalars['Int']>;
  orderBy?: InputMaybe<Swap_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']>;
  where?: InputMaybe<Swap_Filter>;
};

export type Transaction_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<Transaction_Filter>>>;
  blockNumber?: InputMaybe<Scalars['BigInt']>;
  blockNumber_gt?: InputMaybe<Scalars['BigInt']>;
  blockNumber_gte?: InputMaybe<Scalars['BigInt']>;
  blockNumber_in?: InputMaybe<Array<Scalars['BigInt']>>;
  blockNumber_lt?: InputMaybe<Scalars['BigInt']>;
  blockNumber_lte?: InputMaybe<Scalars['BigInt']>;
  blockNumber_not?: InputMaybe<Scalars['BigInt']>;
  blockNumber_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
  burns_?: InputMaybe<Burn_Filter>;
  collects_?: InputMaybe<Collect_Filter>;
  flashed_?: InputMaybe<Flash_Filter>;
  gasPrice?: InputMaybe<Scalars['BigInt']>;
  gasPrice_gt?: InputMaybe<Scalars['BigInt']>;
  gasPrice_gte?: InputMaybe<Scalars['BigInt']>;
  gasPrice_in?: InputMaybe<Array<Scalars['BigInt']>>;
  gasPrice_lt?: InputMaybe<Scalars['BigInt']>;
  gasPrice_lte?: InputMaybe<Scalars['BigInt']>;
  gasPrice_not?: InputMaybe<Scalars['BigInt']>;
  gasPrice_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
  gasUsed?: InputMaybe<Scalars['BigInt']>;
  gasUsed_gt?: InputMaybe<Scalars['BigInt']>;
  gasUsed_gte?: InputMaybe<Scalars['BigInt']>;
  gasUsed_in?: InputMaybe<Array<Scalars['BigInt']>>;
  gasUsed_lt?: InputMaybe<Scalars['BigInt']>;
  gasUsed_lte?: InputMaybe<Scalars['BigInt']>;
  gasUsed_not?: InputMaybe<Scalars['BigInt']>;
  gasUsed_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
  id?: InputMaybe<Scalars['ID']>;
  id_gt?: InputMaybe<Scalars['ID']>;
  id_gte?: InputMaybe<Scalars['ID']>;
  id_in?: InputMaybe<Array<Scalars['ID']>>;
  id_lt?: InputMaybe<Scalars['ID']>;
  id_lte?: InputMaybe<Scalars['ID']>;
  id_not?: InputMaybe<Scalars['ID']>;
  id_not_in?: InputMaybe<Array<Scalars['ID']>>;
  mints_?: InputMaybe<Mint_Filter>;
  or?: InputMaybe<Array<InputMaybe<Transaction_Filter>>>;
  swaps_?: InputMaybe<Swap_Filter>;
  timestamp?: InputMaybe<Scalars['BigInt']>;
  timestamp_gt?: InputMaybe<Scalars['BigInt']>;
  timestamp_gte?: InputMaybe<Scalars['BigInt']>;
  timestamp_in?: InputMaybe<Array<Scalars['BigInt']>>;
  timestamp_lt?: InputMaybe<Scalars['BigInt']>;
  timestamp_lte?: InputMaybe<Scalars['BigInt']>;
  timestamp_not?: InputMaybe<Scalars['BigInt']>;
  timestamp_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
};

export enum Transaction_OrderBy {
  BlockNumber = 'blockNumber',
  Burns = 'burns',
  Collects = 'collects',
  Flashed = 'flashed',
  GasPrice = 'gasPrice',
  GasUsed = 'gasUsed',
  Id = 'id',
  Mints = 'mints',
  Swaps = 'swaps',
  Timestamp = 'timestamp'
}

export type UniswapDayData = {
  __typename?: 'UniswapDayData';
  date: Scalars['Int'];
  feesUSD: Scalars['BigDecimal'];
  id: Scalars['ID'];
  tvlUSD: Scalars['BigDecimal'];
  txCount: Scalars['BigInt'];
  volumeETH: Scalars['BigDecimal'];
  volumeUSD: Scalars['BigDecimal'];
  volumeUSDUntracked: Scalars['BigDecimal'];
};

export type UniswapDayData_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<UniswapDayData_Filter>>>;
  date?: InputMaybe<Scalars['Int']>;
  date_gt?: InputMaybe<Scalars['Int']>;
  date_gte?: InputMaybe<Scalars['Int']>;
  date_in?: InputMaybe<Array<Scalars['Int']>>;
  date_lt?: InputMaybe<Scalars['Int']>;
  date_lte?: InputMaybe<Scalars['Int']>;
  date_not?: InputMaybe<Scalars['Int']>;
  date_not_in?: InputMaybe<Array<Scalars['Int']>>;
  feesUSD?: InputMaybe<Scalars['BigDecimal']>;
  feesUSD_gt?: InputMaybe<Scalars['BigDecimal']>;
  feesUSD_gte?: InputMaybe<Scalars['BigDecimal']>;
  feesUSD_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  feesUSD_lt?: InputMaybe<Scalars['BigDecimal']>;
  feesUSD_lte?: InputMaybe<Scalars['BigDecimal']>;
  feesUSD_not?: InputMaybe<Scalars['BigDecimal']>;
  feesUSD_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  id?: InputMaybe<Scalars['ID']>;
  id_gt?: InputMaybe<Scalars['ID']>;
  id_gte?: InputMaybe<Scalars['ID']>;
  id_in?: InputMaybe<Array<Scalars['ID']>>;
  id_lt?: InputMaybe<Scalars['ID']>;
  id_lte?: InputMaybe<Scalars['ID']>;
  id_not?: InputMaybe<Scalars['ID']>;
  id_not_in?: InputMaybe<Array<Scalars['ID']>>;
  or?: InputMaybe<Array<InputMaybe<UniswapDayData_Filter>>>;
  tvlUSD?: InputMaybe<Scalars['BigDecimal']>;
  tvlUSD_gt?: InputMaybe<Scalars['BigDecimal']>;
  tvlUSD_gte?: InputMaybe<Scalars['BigDecimal']>;
  tvlUSD_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  tvlUSD_lt?: InputMaybe<Scalars['BigDecimal']>;
  tvlUSD_lte?: InputMaybe<Scalars['BigDecimal']>;
  tvlUSD_not?: InputMaybe<Scalars['BigDecimal']>;
  tvlUSD_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  txCount?: InputMaybe<Scalars['BigInt']>;
  txCount_gt?: InputMaybe<Scalars['BigInt']>;
  txCount_gte?: InputMaybe<Scalars['BigInt']>;
  txCount_in?: InputMaybe<Array<Scalars['BigInt']>>;
  txCount_lt?: InputMaybe<Scalars['BigInt']>;
  txCount_lte?: InputMaybe<Scalars['BigInt']>;
  txCount_not?: InputMaybe<Scalars['BigInt']>;
  txCount_not_in?: InputMaybe<Array<Scalars['BigInt']>>;
  volumeETH?: InputMaybe<Scalars['BigDecimal']>;
  volumeETH_gt?: InputMaybe<Scalars['BigDecimal']>;
  volumeETH_gte?: InputMaybe<Scalars['BigDecimal']>;
  volumeETH_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  volumeETH_lt?: InputMaybe<Scalars['BigDecimal']>;
  volumeETH_lte?: InputMaybe<Scalars['BigDecimal']>;
  volumeETH_not?: InputMaybe<Scalars['BigDecimal']>;
  volumeETH_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  volumeUSD?: InputMaybe<Scalars['BigDecimal']>;
  volumeUSDUntracked?: InputMaybe<Scalars['BigDecimal']>;
  volumeUSDUntracked_gt?: InputMaybe<Scalars['BigDecimal']>;
  volumeUSDUntracked_gte?: InputMaybe<Scalars['BigDecimal']>;
  volumeUSDUntracked_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  volumeUSDUntracked_lt?: InputMaybe<Scalars['BigDecimal']>;
  volumeUSDUntracked_lte?: InputMaybe<Scalars['BigDecimal']>;
  volumeUSDUntracked_not?: InputMaybe<Scalars['BigDecimal']>;
  volumeUSDUntracked_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  volumeUSD_gt?: InputMaybe<Scalars['BigDecimal']>;
  volumeUSD_gte?: InputMaybe<Scalars['BigDecimal']>;
  volumeUSD_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
  volumeUSD_lt?: InputMaybe<Scalars['BigDecimal']>;
  volumeUSD_lte?: InputMaybe<Scalars['BigDecimal']>;
  volumeUSD_not?: InputMaybe<Scalars['BigDecimal']>;
  volumeUSD_not_in?: InputMaybe<Array<Scalars['BigDecimal']>>;
};

export enum UniswapDayData_OrderBy {
  Date = 'date',
  FeesUsd = 'feesUSD',
  Id = 'id',
  TvlUsd = 'tvlUSD',
  TxCount = 'txCount',
  VolumeEth = 'volumeETH',
  VolumeUsd = 'volumeUSD',
  VolumeUsdUntracked = 'volumeUSDUntracked'
}

export type _Block_ = {
  __typename?: '_Block_';
  /** The hash of the block */
  hash?: Maybe<Scalars['Bytes']>;
  /** The block number */
  number: Scalars['Int'];
  /** The hash of the parent block */
  parentHash?: Maybe<Scalars['Bytes']>;
  /** Integer representation of the timestamp stored in blocks for the chain */
  timestamp?: Maybe<Scalars['Int']>;
};

/** The type for the top-level _meta field */
export type _Meta_ = {
  __typename?: '_Meta_';
  /**
   * Information about a specific subgraph block. The hash of the block
   * will be null if the _meta field has a block constraint that asks for
   * a block number. It will be filled if the _meta field has no block constraint
   * and therefore asks for the latest  block
   */
  block: _Block_;
  /** The deployment ID */
  deployment: Scalars['String'];
  /** If `true`, the subgraph encountered indexing errors at some past block */
  hasIndexingErrors: Scalars['Boolean'];
};

export enum _SubgraphErrorPolicy_ {
  /** Data will be returned even if the subgraph has indexing errors */
  Allow = 'allow',
  /** If the subgraph has indexing errors, data will be omitted. The default. */
  Deny = 'deny'
}

export type GetPositionQueryVariables = Exact<{
  id: Scalars['ID'];
}>;


export type GetPositionQuery = { __typename?: 'Query', position?: { __typename?: 'Position', id: string, owner: any, tickLower: any, tickUpper: any, liquidity: any, depositedToken0: any, depositedToken1: any, withdrawnToken0: any, withdrawnToken1: any, collectedFeesToken0: any, collectedFeesToken1: any, closed: boolean, pool: { __typename?: 'Pool', id: any, feeTier: any, sqrtPrice: any, liquidity: any, tick?: any | undefined, token0Price: any, token1Price: any, volumeUSD: any, feesUSD: any, totalValueLockedUSD: any, token0: { __typename?: 'Token', id: any, decimals: any, symbol: string, name: string }, token1: { __typename?: 'Token', id: any, decimals: any, symbol: string, name: string } } } | undefined };

export type PoolFragment = { __typename?: 'Pool', id: any, feeTier: any, sqrtPrice: any, liquidity: any, tick?: any | undefined, token0Price: any, token1Price: any, volumeUSD: any, feesUSD: any, totalValueLockedUSD: any, token0: { __typename?: 'Token', id: any, decimals: any, symbol: string, name: string }, token1: { __typename?: 'Token', id: any, decimals: any, symbol: string, name: string } };

export type GetPositionsQueryVariables = Exact<{
  skip?: InputMaybe<Scalars['Int']>;
  first?: InputMaybe<Scalars['Int']>;
  where?: InputMaybe<Position_Filter>;
}>;


export type GetPositionsQuery = { __typename?: 'Query', positions: Array<{ __typename?: 'Position', id: string, owner: any, tickLower: any, tickUpper: any, liquidity: any, depositedToken0: any, depositedToken1: any, withdrawnToken0: any, withdrawnToken1: any, collectedFeesToken0: any, collectedFeesToken1: any, closed: boolean, pool: { __typename?: 'Pool', id: any, feeTier: any, sqrtPrice: any, liquidity: any, tick?: any | undefined, token0Price: any, token1Price: any, volumeUSD: any, feesUSD: any, totalValueLockedUSD: any, token0: { __typename?: 'Token', id: any, decimals: any, symbol: string, name: string }, token1: { __typename?: 'Token', id: any, decimals: any, symbol: string, name: string } } }> };

export const PoolFragmentDoc = gql`
    fragment Pool on Pool {
  id
  token0 {
    id
    decimals
    symbol
    name
  }
  token1 {
    id
    decimals
    symbol
    name
  }
  feeTier
  sqrtPrice
  liquidity
  tick
  token0Price
  token1Price
  volumeUSD
  feesUSD
  totalValueLockedUSD
}
    `;
export const GetPositionDocument = gql`
    query GetPosition($id: ID!) {
  position(id: $id) {
    id
    owner
    tickLower
    tickUpper
    liquidity
    depositedToken0
    depositedToken1
    withdrawnToken0
    withdrawnToken1
    collectedFeesToken0
    collectedFeesToken1
    closed
    pool {
      ...Pool
    }
  }
}
    ${PoolFragmentDoc}`;

/**
 * __useGetPositionQuery__
 *
 * To run a query within a React component, call `useGetPositionQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetPositionQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetPositionQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useGetPositionQuery(baseOptions: Apollo.QueryHookOptions<GetPositionQuery, GetPositionQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetPositionQuery, GetPositionQueryVariables>(GetPositionDocument, options);
      }
export function useGetPositionLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetPositionQuery, GetPositionQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetPositionQuery, GetPositionQueryVariables>(GetPositionDocument, options);
        }
export type GetPositionQueryHookResult = ReturnType<typeof useGetPositionQuery>;
export type GetPositionLazyQueryHookResult = ReturnType<typeof useGetPositionLazyQuery>;
export type GetPositionQueryResult = Apollo.QueryResult<GetPositionQuery, GetPositionQueryVariables>;
export const GetPositionsDocument = gql`
    query GetPositions($skip: Int, $first: Int, $where: Position_filter) {
  positions(skip: $skip, first: $first, where: $where) {
    id
    owner
    tickLower
    tickUpper
    liquidity
    depositedToken0
    depositedToken1
    withdrawnToken0
    withdrawnToken1
    collectedFeesToken0
    collectedFeesToken1
    closed
    pool {
      ...Pool
    }
  }
}
    ${PoolFragmentDoc}`;

/**
 * __useGetPositionsQuery__
 *
 * To run a query within a React component, call `useGetPositionsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetPositionsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetPositionsQuery({
 *   variables: {
 *      skip: // value for 'skip'
 *      first: // value for 'first'
 *      where: // value for 'where'
 *   },
 * });
 */
export function useGetPositionsQuery(baseOptions?: Apollo.QueryHookOptions<GetPositionsQuery, GetPositionsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetPositionsQuery, GetPositionsQueryVariables>(GetPositionsDocument, options);
      }
export function useGetPositionsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetPositionsQuery, GetPositionsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetPositionsQuery, GetPositionsQueryVariables>(GetPositionsDocument, options);
        }
export type GetPositionsQueryHookResult = ReturnType<typeof useGetPositionsQuery>;
export type GetPositionsLazyQueryHookResult = ReturnType<typeof useGetPositionsLazyQuery>;
export type GetPositionsQueryResult = Apollo.QueryResult<GetPositionsQuery, GetPositionsQueryVariables>;


export type ResolverTypeWrapper<T> = Promise<T> | T;


export type ResolverWithResolve<TResult, TParent, TContext, TArgs> = {
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};
export type Resolver<TResult, TParent = {}, TContext = {}, TArgs = {}> = ResolverFn<TResult, TParent, TContext, TArgs> | ResolverWithResolve<TResult, TParent, TContext, TArgs>;

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => Promise<TResult> | TResult;

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => AsyncIterable<TResult> | Promise<AsyncIterable<TResult>>;

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

export interface SubscriptionSubscriberObject<TResult, TKey extends string, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<{ [key in TKey]: TResult }, TParent, TContext, TArgs>;
  resolve?: SubscriptionResolveFn<TResult, { [key in TKey]: TResult }, TContext, TArgs>;
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>;
  resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>;
}

export type SubscriptionObject<TResult, TKey extends string, TParent, TContext, TArgs> =
  | SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
  | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>;

export type SubscriptionResolver<TResult, TKey extends string, TParent = {}, TContext = {}, TArgs = {}> =
  | ((...args: any[]) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
  | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>;

export type TypeResolveFn<TTypes, TParent = {}, TContext = {}> = (
  parent: TParent,
  context: TContext,
  info: GraphQLResolveInfo
) => Maybe<TTypes> | Promise<Maybe<TTypes>>;

export type IsTypeOfResolverFn<T = {}, TContext = {}> = (obj: T, context: TContext, info: GraphQLResolveInfo) => boolean | Promise<boolean>;

export type NextResolverFn<T> = () => Promise<T>;

export type DirectiveResolverFn<TResult = {}, TParent = {}, TContext = {}, TArgs = {}> = (
  next: NextResolverFn<TResult>,
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;



/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = {
  Aggregation_interval: Aggregation_Interval;
  BigDecimal: ResolverTypeWrapper<Scalars['BigDecimal']>;
  BigInt: ResolverTypeWrapper<Scalars['BigInt']>;
  BlockChangedFilter: BlockChangedFilter;
  Block_height: Block_Height;
  Boolean: ResolverTypeWrapper<Scalars['Boolean']>;
  Bundle: ResolverTypeWrapper<Bundle>;
  Bundle_filter: Bundle_Filter;
  Bundle_orderBy: Bundle_OrderBy;
  Burn: ResolverTypeWrapper<Burn>;
  Burn_filter: Burn_Filter;
  Burn_orderBy: Burn_OrderBy;
  Bytes: ResolverTypeWrapper<Scalars['Bytes']>;
  Collect: ResolverTypeWrapper<Collect>;
  Collect_filter: Collect_Filter;
  Collect_orderBy: Collect_OrderBy;
  Factory: ResolverTypeWrapper<Factory>;
  Factory_filter: Factory_Filter;
  Factory_orderBy: Factory_OrderBy;
  Flash: ResolverTypeWrapper<Flash>;
  Flash_filter: Flash_Filter;
  Flash_orderBy: Flash_OrderBy;
  ID: ResolverTypeWrapper<Scalars['ID']>;
  Int: ResolverTypeWrapper<Scalars['Int']>;
  Int8: ResolverTypeWrapper<Scalars['Int8']>;
  Mint: ResolverTypeWrapper<Mint>;
  Mint_filter: Mint_Filter;
  Mint_orderBy: Mint_OrderBy;
  OrderDirection: OrderDirection;
  Pool: ResolverTypeWrapper<Pool>;
  PoolDayData: ResolverTypeWrapper<PoolDayData>;
  PoolDayData_filter: PoolDayData_Filter;
  PoolDayData_orderBy: PoolDayData_OrderBy;
  PoolHourData: ResolverTypeWrapper<PoolHourData>;
  PoolHourData_filter: PoolHourData_Filter;
  PoolHourData_orderBy: PoolHourData_OrderBy;
  Pool_filter: Pool_Filter;
  Pool_orderBy: Pool_OrderBy;
  Position: ResolverTypeWrapper<Position>;
  PositionSnapshot: ResolverTypeWrapper<PositionSnapshot>;
  PositionSnapshot_filter: PositionSnapshot_Filter;
  PositionSnapshot_orderBy: PositionSnapshot_OrderBy;
  Position_filter: Position_Filter;
  Position_orderBy: Position_OrderBy;
  Query: ResolverTypeWrapper<{}>;
  String: ResolverTypeWrapper<Scalars['String']>;
  Swap: ResolverTypeWrapper<Swap>;
  Swap_filter: Swap_Filter;
  Swap_orderBy: Swap_OrderBy;
  Tick: ResolverTypeWrapper<Tick>;
  Tick_filter: Tick_Filter;
  Tick_orderBy: Tick_OrderBy;
  Timestamp: ResolverTypeWrapper<Scalars['Timestamp']>;
  Token: ResolverTypeWrapper<Token>;
  TokenDayData: ResolverTypeWrapper<TokenDayData>;
  TokenDayData_filter: TokenDayData_Filter;
  TokenDayData_orderBy: TokenDayData_OrderBy;
  TokenHourData: ResolverTypeWrapper<TokenHourData>;
  TokenHourData_filter: TokenHourData_Filter;
  TokenHourData_orderBy: TokenHourData_OrderBy;
  Token_filter: Token_Filter;
  Token_orderBy: Token_OrderBy;
  Transaction: ResolverTypeWrapper<Transaction>;
  Transaction_filter: Transaction_Filter;
  Transaction_orderBy: Transaction_OrderBy;
  UniswapDayData: ResolverTypeWrapper<UniswapDayData>;
  UniswapDayData_filter: UniswapDayData_Filter;
  UniswapDayData_orderBy: UniswapDayData_OrderBy;
  _Block_: ResolverTypeWrapper<_Block_>;
  _Meta_: ResolverTypeWrapper<_Meta_>;
  _SubgraphErrorPolicy_: _SubgraphErrorPolicy_;
};

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = {
  BigDecimal: Scalars['BigDecimal'];
  BigInt: Scalars['BigInt'];
  BlockChangedFilter: BlockChangedFilter;
  Block_height: Block_Height;
  Boolean: Scalars['Boolean'];
  Bundle: Bundle;
  Bundle_filter: Bundle_Filter;
  Burn: Burn;
  Burn_filter: Burn_Filter;
  Bytes: Scalars['Bytes'];
  Collect: Collect;
  Collect_filter: Collect_Filter;
  Factory: Factory;
  Factory_filter: Factory_Filter;
  Flash: Flash;
  Flash_filter: Flash_Filter;
  ID: Scalars['ID'];
  Int: Scalars['Int'];
  Int8: Scalars['Int8'];
  Mint: Mint;
  Mint_filter: Mint_Filter;
  Pool: Pool;
  PoolDayData: PoolDayData;
  PoolDayData_filter: PoolDayData_Filter;
  PoolHourData: PoolHourData;
  PoolHourData_filter: PoolHourData_Filter;
  Pool_filter: Pool_Filter;
  Position: Position;
  PositionSnapshot: PositionSnapshot;
  PositionSnapshot_filter: PositionSnapshot_Filter;
  Position_filter: Position_Filter;
  Query: {};
  String: Scalars['String'];
  Swap: Swap;
  Swap_filter: Swap_Filter;
  Tick: Tick;
  Tick_filter: Tick_Filter;
  Timestamp: Scalars['Timestamp'];
  Token: Token;
  TokenDayData: TokenDayData;
  TokenDayData_filter: TokenDayData_Filter;
  TokenHourData: TokenHourData;
  TokenHourData_filter: TokenHourData_Filter;
  Token_filter: Token_Filter;
  Transaction: Transaction;
  Transaction_filter: Transaction_Filter;
  UniswapDayData: UniswapDayData;
  UniswapDayData_filter: UniswapDayData_Filter;
  _Block_: _Block_;
  _Meta_: _Meta_;
};

export type DerivedFromDirectiveArgs = {
  field: Scalars['String'];
};

export type DerivedFromDirectiveResolver<Result, Parent, ContextType = any, Args = DerivedFromDirectiveArgs> = DirectiveResolverFn<Result, Parent, ContextType, Args>;

export type EntityDirectiveArgs = { };

export type EntityDirectiveResolver<Result, Parent, ContextType = any, Args = EntityDirectiveArgs> = DirectiveResolverFn<Result, Parent, ContextType, Args>;

export type SubgraphIdDirectiveArgs = {
  id: Scalars['String'];
};

export type SubgraphIdDirectiveResolver<Result, Parent, ContextType = any, Args = SubgraphIdDirectiveArgs> = DirectiveResolverFn<Result, Parent, ContextType, Args>;

export interface BigDecimalScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['BigDecimal'], any> {
  name: 'BigDecimal';
}

export interface BigIntScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['BigInt'], any> {
  name: 'BigInt';
}

export type BundleResolvers<ContextType = any, ParentType extends ResolversParentTypes['Bundle'] = ResolversParentTypes['Bundle']> = {
  ethPriceUSD?: Resolver<ResolversTypes['BigDecimal'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type BurnResolvers<ContextType = any, ParentType extends ResolversParentTypes['Burn'] = ResolversParentTypes['Burn']> = {
  amount?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  amount0?: Resolver<ResolversTypes['BigDecimal'], ParentType, ContextType>;
  amount1?: Resolver<ResolversTypes['BigDecimal'], ParentType, ContextType>;
  amountUSD?: Resolver<Maybe<ResolversTypes['BigDecimal']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  logIndex?: Resolver<Maybe<ResolversTypes['BigInt']>, ParentType, ContextType>;
  origin?: Resolver<ResolversTypes['Bytes'], ParentType, ContextType>;
  owner?: Resolver<Maybe<ResolversTypes['Bytes']>, ParentType, ContextType>;
  pool?: Resolver<ResolversTypes['Pool'], ParentType, ContextType>;
  tickLower?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  tickUpper?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  timestamp?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  token0?: Resolver<ResolversTypes['Token'], ParentType, ContextType>;
  token1?: Resolver<ResolversTypes['Token'], ParentType, ContextType>;
  transaction?: Resolver<ResolversTypes['Transaction'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export interface BytesScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['Bytes'], any> {
  name: 'Bytes';
}

export type CollectResolvers<ContextType = any, ParentType extends ResolversParentTypes['Collect'] = ResolversParentTypes['Collect']> = {
  amount0?: Resolver<ResolversTypes['BigDecimal'], ParentType, ContextType>;
  amount1?: Resolver<ResolversTypes['BigDecimal'], ParentType, ContextType>;
  amountUSD?: Resolver<Maybe<ResolversTypes['BigDecimal']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  logIndex?: Resolver<Maybe<ResolversTypes['BigInt']>, ParentType, ContextType>;
  owner?: Resolver<Maybe<ResolversTypes['Bytes']>, ParentType, ContextType>;
  pool?: Resolver<ResolversTypes['Pool'], ParentType, ContextType>;
  tickLower?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  tickUpper?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  timestamp?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  transaction?: Resolver<ResolversTypes['Transaction'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type FactoryResolvers<ContextType = any, ParentType extends ResolversParentTypes['Factory'] = ResolversParentTypes['Factory']> = {
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  owner?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  poolCount?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  totalFeesETH?: Resolver<ResolversTypes['BigDecimal'], ParentType, ContextType>;
  totalFeesUSD?: Resolver<ResolversTypes['BigDecimal'], ParentType, ContextType>;
  totalValueLockedETH?: Resolver<ResolversTypes['BigDecimal'], ParentType, ContextType>;
  totalValueLockedETHUntracked?: Resolver<ResolversTypes['BigDecimal'], ParentType, ContextType>;
  totalValueLockedUSD?: Resolver<ResolversTypes['BigDecimal'], ParentType, ContextType>;
  totalValueLockedUSDUntracked?: Resolver<ResolversTypes['BigDecimal'], ParentType, ContextType>;
  totalVolumeETH?: Resolver<ResolversTypes['BigDecimal'], ParentType, ContextType>;
  totalVolumeUSD?: Resolver<ResolversTypes['BigDecimal'], ParentType, ContextType>;
  txCount?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  untrackedVolumeUSD?: Resolver<ResolversTypes['BigDecimal'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type FlashResolvers<ContextType = any, ParentType extends ResolversParentTypes['Flash'] = ResolversParentTypes['Flash']> = {
  amount0?: Resolver<ResolversTypes['BigDecimal'], ParentType, ContextType>;
  amount0Paid?: Resolver<ResolversTypes['BigDecimal'], ParentType, ContextType>;
  amount1?: Resolver<ResolversTypes['BigDecimal'], ParentType, ContextType>;
  amount1Paid?: Resolver<ResolversTypes['BigDecimal'], ParentType, ContextType>;
  amountUSD?: Resolver<ResolversTypes['BigDecimal'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  logIndex?: Resolver<Maybe<ResolversTypes['BigInt']>, ParentType, ContextType>;
  pool?: Resolver<ResolversTypes['Pool'], ParentType, ContextType>;
  recipient?: Resolver<ResolversTypes['Bytes'], ParentType, ContextType>;
  sender?: Resolver<ResolversTypes['Bytes'], ParentType, ContextType>;
  timestamp?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  transaction?: Resolver<ResolversTypes['Transaction'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export interface Int8ScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['Int8'], any> {
  name: 'Int8';
}

export type MintResolvers<ContextType = any, ParentType extends ResolversParentTypes['Mint'] = ResolversParentTypes['Mint']> = {
  amount?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  amount0?: Resolver<ResolversTypes['BigDecimal'], ParentType, ContextType>;
  amount1?: Resolver<ResolversTypes['BigDecimal'], ParentType, ContextType>;
  amountUSD?: Resolver<Maybe<ResolversTypes['BigDecimal']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  logIndex?: Resolver<Maybe<ResolversTypes['BigInt']>, ParentType, ContextType>;
  origin?: Resolver<ResolversTypes['Bytes'], ParentType, ContextType>;
  owner?: Resolver<ResolversTypes['Bytes'], ParentType, ContextType>;
  pool?: Resolver<ResolversTypes['Pool'], ParentType, ContextType>;
  sender?: Resolver<Maybe<ResolversTypes['Bytes']>, ParentType, ContextType>;
  tickLower?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  tickUpper?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  timestamp?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  token0?: Resolver<ResolversTypes['Token'], ParentType, ContextType>;
  token1?: Resolver<ResolversTypes['Token'], ParentType, ContextType>;
  transaction?: Resolver<ResolversTypes['Transaction'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type PoolResolvers<ContextType = any, ParentType extends ResolversParentTypes['Pool'] = ResolversParentTypes['Pool']> = {
  burns?: Resolver<Array<ResolversTypes['Burn']>, ParentType, ContextType, RequireFields<PoolBurnsArgs, 'first' | 'skip'>>;
  collectedFeesToken0?: Resolver<ResolversTypes['BigDecimal'], ParentType, ContextType>;
  collectedFeesToken1?: Resolver<ResolversTypes['BigDecimal'], ParentType, ContextType>;
  collectedFeesUSD?: Resolver<ResolversTypes['BigDecimal'], ParentType, ContextType>;
  collects?: Resolver<Array<ResolversTypes['Collect']>, ParentType, ContextType, RequireFields<PoolCollectsArgs, 'first' | 'skip'>>;
  createdAtBlockNumber?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  createdAtTimestamp?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  feeTier?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  feesUSD?: Resolver<ResolversTypes['BigDecimal'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['Bytes'], ParentType, ContextType>;
  liquidity?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  liquidityProviderCount?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  mints?: Resolver<Array<ResolversTypes['Mint']>, ParentType, ContextType, RequireFields<PoolMintsArgs, 'first' | 'skip'>>;
  observationIndex?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  poolDayData?: Resolver<Array<ResolversTypes['PoolDayData']>, ParentType, ContextType, RequireFields<PoolPoolDayDataArgs, 'first' | 'skip'>>;
  poolHourData?: Resolver<Array<ResolversTypes['PoolHourData']>, ParentType, ContextType, RequireFields<PoolPoolHourDataArgs, 'first' | 'skip'>>;
  sqrtPrice?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  swaps?: Resolver<Array<ResolversTypes['Swap']>, ParentType, ContextType, RequireFields<PoolSwapsArgs, 'first' | 'skip'>>;
  tick?: Resolver<Maybe<ResolversTypes['BigInt']>, ParentType, ContextType>;
  ticks?: Resolver<Array<ResolversTypes['Tick']>, ParentType, ContextType, RequireFields<PoolTicksArgs, 'first' | 'skip'>>;
  token0?: Resolver<ResolversTypes['Token'], ParentType, ContextType>;
  token0Price?: Resolver<ResolversTypes['BigDecimal'], ParentType, ContextType>;
  token1?: Resolver<ResolversTypes['Token'], ParentType, ContextType>;
  token1Price?: Resolver<ResolversTypes['BigDecimal'], ParentType, ContextType>;
  totalValueLockedETH?: Resolver<ResolversTypes['BigDecimal'], ParentType, ContextType>;
  totalValueLockedToken0?: Resolver<ResolversTypes['BigDecimal'], ParentType, ContextType>;
  totalValueLockedToken1?: Resolver<ResolversTypes['BigDecimal'], ParentType, ContextType>;
  totalValueLockedUSD?: Resolver<ResolversTypes['BigDecimal'], ParentType, ContextType>;
  totalValueLockedUSDUntracked?: Resolver<ResolversTypes['BigDecimal'], ParentType, ContextType>;
  txCount?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  untrackedVolumeUSD?: Resolver<ResolversTypes['BigDecimal'], ParentType, ContextType>;
  volumeToken0?: Resolver<ResolversTypes['BigDecimal'], ParentType, ContextType>;
  volumeToken1?: Resolver<ResolversTypes['BigDecimal'], ParentType, ContextType>;
  volumeUSD?: Resolver<ResolversTypes['BigDecimal'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type PoolDayDataResolvers<ContextType = any, ParentType extends ResolversParentTypes['PoolDayData'] = ResolversParentTypes['PoolDayData']> = {
  close?: Resolver<ResolversTypes['BigDecimal'], ParentType, ContextType>;
  date?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  feesUSD?: Resolver<ResolversTypes['BigDecimal'], ParentType, ContextType>;
  high?: Resolver<ResolversTypes['BigDecimal'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  liquidity?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  low?: Resolver<ResolversTypes['BigDecimal'], ParentType, ContextType>;
  open?: Resolver<ResolversTypes['BigDecimal'], ParentType, ContextType>;
  pool?: Resolver<ResolversTypes['Pool'], ParentType, ContextType>;
  sqrtPrice?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  tick?: Resolver<Maybe<ResolversTypes['BigInt']>, ParentType, ContextType>;
  token0Price?: Resolver<ResolversTypes['BigDecimal'], ParentType, ContextType>;
  token1Price?: Resolver<ResolversTypes['BigDecimal'], ParentType, ContextType>;
  tvlUSD?: Resolver<ResolversTypes['BigDecimal'], ParentType, ContextType>;
  txCount?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  volumeToken0?: Resolver<ResolversTypes['BigDecimal'], ParentType, ContextType>;
  volumeToken1?: Resolver<ResolversTypes['BigDecimal'], ParentType, ContextType>;
  volumeUSD?: Resolver<ResolversTypes['BigDecimal'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type PoolHourDataResolvers<ContextType = any, ParentType extends ResolversParentTypes['PoolHourData'] = ResolversParentTypes['PoolHourData']> = {
  close?: Resolver<ResolversTypes['BigDecimal'], ParentType, ContextType>;
  feesUSD?: Resolver<ResolversTypes['BigDecimal'], ParentType, ContextType>;
  high?: Resolver<ResolversTypes['BigDecimal'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  liquidity?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  low?: Resolver<ResolversTypes['BigDecimal'], ParentType, ContextType>;
  open?: Resolver<ResolversTypes['BigDecimal'], ParentType, ContextType>;
  periodStartUnix?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  pool?: Resolver<ResolversTypes['Pool'], ParentType, ContextType>;
  sqrtPrice?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  tick?: Resolver<Maybe<ResolversTypes['BigInt']>, ParentType, ContextType>;
  token0Price?: Resolver<ResolversTypes['BigDecimal'], ParentType, ContextType>;
  token1Price?: Resolver<ResolversTypes['BigDecimal'], ParentType, ContextType>;
  tvlUSD?: Resolver<ResolversTypes['BigDecimal'], ParentType, ContextType>;
  txCount?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  volumeToken0?: Resolver<ResolversTypes['BigDecimal'], ParentType, ContextType>;
  volumeToken1?: Resolver<ResolversTypes['BigDecimal'], ParentType, ContextType>;
  volumeUSD?: Resolver<ResolversTypes['BigDecimal'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type PositionResolvers<ContextType = any, ParentType extends ResolversParentTypes['Position'] = ResolversParentTypes['Position']> = {
  closed?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  collectedFeesToken0?: Resolver<ResolversTypes['BigDecimal'], ParentType, ContextType>;
  collectedFeesToken1?: Resolver<ResolversTypes['BigDecimal'], ParentType, ContextType>;
  createdAtBlockNumber?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  createdAtTimestamp?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  depositedToken0?: Resolver<ResolversTypes['BigDecimal'], ParentType, ContextType>;
  depositedToken1?: Resolver<ResolversTypes['BigDecimal'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  liquidity?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  owner?: Resolver<ResolversTypes['Bytes'], ParentType, ContextType>;
  pool?: Resolver<ResolversTypes['Pool'], ParentType, ContextType>;
  tickLower?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  tickUpper?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  token0?: Resolver<ResolversTypes['Token'], ParentType, ContextType>;
  token1?: Resolver<ResolversTypes['Token'], ParentType, ContextType>;
  transaction?: Resolver<ResolversTypes['Transaction'], ParentType, ContextType>;
  updatedAtBlockNumber?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  updatedAtTimestamp?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  withdrawnToken0?: Resolver<ResolversTypes['BigDecimal'], ParentType, ContextType>;
  withdrawnToken1?: Resolver<ResolversTypes['BigDecimal'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type PositionSnapshotResolvers<ContextType = any, ParentType extends ResolversParentTypes['PositionSnapshot'] = ResolversParentTypes['PositionSnapshot']> = {
  blockNumber?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  collectedFeesToken0?: Resolver<ResolversTypes['BigDecimal'], ParentType, ContextType>;
  collectedFeesToken1?: Resolver<ResolversTypes['BigDecimal'], ParentType, ContextType>;
  depositedToken0?: Resolver<ResolversTypes['BigDecimal'], ParentType, ContextType>;
  depositedToken1?: Resolver<ResolversTypes['BigDecimal'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  liquidity?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  owner?: Resolver<ResolversTypes['Bytes'], ParentType, ContextType>;
  pool?: Resolver<ResolversTypes['Pool'], ParentType, ContextType>;
  position?: Resolver<ResolversTypes['Position'], ParentType, ContextType>;
  timestamp?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  transaction?: Resolver<ResolversTypes['Transaction'], ParentType, ContextType>;
  withdrawnToken0?: Resolver<ResolversTypes['BigDecimal'], ParentType, ContextType>;
  withdrawnToken1?: Resolver<ResolversTypes['BigDecimal'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type QueryResolvers<ContextType = any, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = {
  _meta?: Resolver<Maybe<ResolversTypes['_Meta_']>, ParentType, ContextType, Partial<Query_MetaArgs>>;
  bundle?: Resolver<Maybe<ResolversTypes['Bundle']>, ParentType, ContextType, RequireFields<QueryBundleArgs, 'id' | 'subgraphError'>>;
  bundles?: Resolver<Array<ResolversTypes['Bundle']>, ParentType, ContextType, RequireFields<QueryBundlesArgs, 'first' | 'skip' | 'subgraphError'>>;
  burn?: Resolver<Maybe<ResolversTypes['Burn']>, ParentType, ContextType, RequireFields<QueryBurnArgs, 'id' | 'subgraphError'>>;
  burns?: Resolver<Array<ResolversTypes['Burn']>, ParentType, ContextType, RequireFields<QueryBurnsArgs, 'first' | 'skip' | 'subgraphError'>>;
  collect?: Resolver<Maybe<ResolversTypes['Collect']>, ParentType, ContextType, RequireFields<QueryCollectArgs, 'id' | 'subgraphError'>>;
  collects?: Resolver<Array<ResolversTypes['Collect']>, ParentType, ContextType, RequireFields<QueryCollectsArgs, 'first' | 'skip' | 'subgraphError'>>;
  factories?: Resolver<Array<ResolversTypes['Factory']>, ParentType, ContextType, RequireFields<QueryFactoriesArgs, 'first' | 'skip' | 'subgraphError'>>;
  factory?: Resolver<Maybe<ResolversTypes['Factory']>, ParentType, ContextType, RequireFields<QueryFactoryArgs, 'id' | 'subgraphError'>>;
  flash?: Resolver<Maybe<ResolversTypes['Flash']>, ParentType, ContextType, RequireFields<QueryFlashArgs, 'id' | 'subgraphError'>>;
  flashes?: Resolver<Array<ResolversTypes['Flash']>, ParentType, ContextType, RequireFields<QueryFlashesArgs, 'first' | 'skip' | 'subgraphError'>>;
  mint?: Resolver<Maybe<ResolversTypes['Mint']>, ParentType, ContextType, RequireFields<QueryMintArgs, 'id' | 'subgraphError'>>;
  mints?: Resolver<Array<ResolversTypes['Mint']>, ParentType, ContextType, RequireFields<QueryMintsArgs, 'first' | 'skip' | 'subgraphError'>>;
  pool?: Resolver<Maybe<ResolversTypes['Pool']>, ParentType, ContextType, RequireFields<QueryPoolArgs, 'id' | 'subgraphError'>>;
  poolDayData?: Resolver<Maybe<ResolversTypes['PoolDayData']>, ParentType, ContextType, RequireFields<QueryPoolDayDataArgs, 'id' | 'subgraphError'>>;
  poolDayDatas?: Resolver<Array<ResolversTypes['PoolDayData']>, ParentType, ContextType, RequireFields<QueryPoolDayDatasArgs, 'first' | 'skip' | 'subgraphError'>>;
  poolHourData?: Resolver<Maybe<ResolversTypes['PoolHourData']>, ParentType, ContextType, RequireFields<QueryPoolHourDataArgs, 'id' | 'subgraphError'>>;
  poolHourDatas?: Resolver<Array<ResolversTypes['PoolHourData']>, ParentType, ContextType, RequireFields<QueryPoolHourDatasArgs, 'first' | 'skip' | 'subgraphError'>>;
  pools?: Resolver<Array<ResolversTypes['Pool']>, ParentType, ContextType, RequireFields<QueryPoolsArgs, 'first' | 'skip' | 'subgraphError'>>;
  position?: Resolver<Maybe<ResolversTypes['Position']>, ParentType, ContextType, RequireFields<QueryPositionArgs, 'id' | 'subgraphError'>>;
  positionSnapshot?: Resolver<Maybe<ResolversTypes['PositionSnapshot']>, ParentType, ContextType, RequireFields<QueryPositionSnapshotArgs, 'id' | 'subgraphError'>>;
  positionSnapshots?: Resolver<Array<ResolversTypes['PositionSnapshot']>, ParentType, ContextType, RequireFields<QueryPositionSnapshotsArgs, 'first' | 'skip' | 'subgraphError'>>;
  positions?: Resolver<Array<ResolversTypes['Position']>, ParentType, ContextType, RequireFields<QueryPositionsArgs, 'first' | 'skip' | 'subgraphError'>>;
  swap?: Resolver<Maybe<ResolversTypes['Swap']>, ParentType, ContextType, RequireFields<QuerySwapArgs, 'id' | 'subgraphError'>>;
  swaps?: Resolver<Array<ResolversTypes['Swap']>, ParentType, ContextType, RequireFields<QuerySwapsArgs, 'first' | 'skip' | 'subgraphError'>>;
  tick?: Resolver<Maybe<ResolversTypes['Tick']>, ParentType, ContextType, RequireFields<QueryTickArgs, 'id' | 'subgraphError'>>;
  ticks?: Resolver<Array<ResolversTypes['Tick']>, ParentType, ContextType, RequireFields<QueryTicksArgs, 'first' | 'skip' | 'subgraphError'>>;
  token?: Resolver<Maybe<ResolversTypes['Token']>, ParentType, ContextType, RequireFields<QueryTokenArgs, 'id' | 'subgraphError'>>;
  tokenDayData?: Resolver<Maybe<ResolversTypes['TokenDayData']>, ParentType, ContextType, RequireFields<QueryTokenDayDataArgs, 'id' | 'subgraphError'>>;
  tokenDayDatas?: Resolver<Array<ResolversTypes['TokenDayData']>, ParentType, ContextType, RequireFields<QueryTokenDayDatasArgs, 'first' | 'skip' | 'subgraphError'>>;
  tokenHourData?: Resolver<Maybe<ResolversTypes['TokenHourData']>, ParentType, ContextType, RequireFields<QueryTokenHourDataArgs, 'id' | 'subgraphError'>>;
  tokenHourDatas?: Resolver<Array<ResolversTypes['TokenHourData']>, ParentType, ContextType, RequireFields<QueryTokenHourDatasArgs, 'first' | 'skip' | 'subgraphError'>>;
  tokens?: Resolver<Array<ResolversTypes['Token']>, ParentType, ContextType, RequireFields<QueryTokensArgs, 'first' | 'skip' | 'subgraphError'>>;
  transaction?: Resolver<Maybe<ResolversTypes['Transaction']>, ParentType, ContextType, RequireFields<QueryTransactionArgs, 'id' | 'subgraphError'>>;
  transactions?: Resolver<Array<ResolversTypes['Transaction']>, ParentType, ContextType, RequireFields<QueryTransactionsArgs, 'first' | 'skip' | 'subgraphError'>>;
  uniswapDayData?: Resolver<Maybe<ResolversTypes['UniswapDayData']>, ParentType, ContextType, RequireFields<QueryUniswapDayDataArgs, 'id' | 'subgraphError'>>;
  uniswapDayDatas?: Resolver<Array<ResolversTypes['UniswapDayData']>, ParentType, ContextType, RequireFields<QueryUniswapDayDatasArgs, 'first' | 'skip' | 'subgraphError'>>;
};

export type SwapResolvers<ContextType = any, ParentType extends ResolversParentTypes['Swap'] = ResolversParentTypes['Swap']> = {
  amount0?: Resolver<ResolversTypes['BigDecimal'], ParentType, ContextType>;
  amount1?: Resolver<ResolversTypes['BigDecimal'], ParentType, ContextType>;
  amountUSD?: Resolver<ResolversTypes['BigDecimal'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  logIndex?: Resolver<Maybe<ResolversTypes['BigInt']>, ParentType, ContextType>;
  origin?: Resolver<ResolversTypes['Bytes'], ParentType, ContextType>;
  pool?: Resolver<ResolversTypes['Pool'], ParentType, ContextType>;
  recipient?: Resolver<ResolversTypes['Bytes'], ParentType, ContextType>;
  sender?: Resolver<ResolversTypes['Bytes'], ParentType, ContextType>;
  sqrtPriceX96?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  tick?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  timestamp?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  token0?: Resolver<ResolversTypes['Token'], ParentType, ContextType>;
  token1?: Resolver<ResolversTypes['Token'], ParentType, ContextType>;
  transaction?: Resolver<ResolversTypes['Transaction'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type TickResolvers<ContextType = any, ParentType extends ResolversParentTypes['Tick'] = ResolversParentTypes['Tick']> = {
  createdAtBlockNumber?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  createdAtTimestamp?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  liquidityGross?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  liquidityNet?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  pool?: Resolver<ResolversTypes['Pool'], ParentType, ContextType>;
  poolAddress?: Resolver<ResolversTypes['Bytes'], ParentType, ContextType>;
  price0?: Resolver<ResolversTypes['BigDecimal'], ParentType, ContextType>;
  price1?: Resolver<ResolversTypes['BigDecimal'], ParentType, ContextType>;
  tickIdx?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export interface TimestampScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['Timestamp'], any> {
  name: 'Timestamp';
}

export type TokenResolvers<ContextType = any, ParentType extends ResolversParentTypes['Token'] = ResolversParentTypes['Token']> = {
  decimals?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  derivedETH?: Resolver<ResolversTypes['BigDecimal'], ParentType, ContextType>;
  feesUSD?: Resolver<ResolversTypes['BigDecimal'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['Bytes'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  poolCount?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  symbol?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  tokenDayData?: Resolver<Array<ResolversTypes['TokenDayData']>, ParentType, ContextType, RequireFields<TokenTokenDayDataArgs, 'first' | 'skip'>>;
  totalSupply?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  totalValueLocked?: Resolver<ResolversTypes['BigDecimal'], ParentType, ContextType>;
  totalValueLockedUSD?: Resolver<ResolversTypes['BigDecimal'], ParentType, ContextType>;
  totalValueLockedUSDUntracked?: Resolver<ResolversTypes['BigDecimal'], ParentType, ContextType>;
  txCount?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  untrackedVolumeUSD?: Resolver<ResolversTypes['BigDecimal'], ParentType, ContextType>;
  volume?: Resolver<ResolversTypes['BigDecimal'], ParentType, ContextType>;
  volumeUSD?: Resolver<ResolversTypes['BigDecimal'], ParentType, ContextType>;
  whitelistPools?: Resolver<Array<ResolversTypes['Pool']>, ParentType, ContextType, RequireFields<TokenWhitelistPoolsArgs, 'first' | 'skip'>>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type TokenDayDataResolvers<ContextType = any, ParentType extends ResolversParentTypes['TokenDayData'] = ResolversParentTypes['TokenDayData']> = {
  close?: Resolver<ResolversTypes['BigDecimal'], ParentType, ContextType>;
  date?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  feesUSD?: Resolver<ResolversTypes['BigDecimal'], ParentType, ContextType>;
  high?: Resolver<ResolversTypes['BigDecimal'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  low?: Resolver<ResolversTypes['BigDecimal'], ParentType, ContextType>;
  open?: Resolver<ResolversTypes['BigDecimal'], ParentType, ContextType>;
  priceUSD?: Resolver<ResolversTypes['BigDecimal'], ParentType, ContextType>;
  token?: Resolver<ResolversTypes['Token'], ParentType, ContextType>;
  totalValueLocked?: Resolver<ResolversTypes['BigDecimal'], ParentType, ContextType>;
  totalValueLockedUSD?: Resolver<ResolversTypes['BigDecimal'], ParentType, ContextType>;
  untrackedVolumeUSD?: Resolver<ResolversTypes['BigDecimal'], ParentType, ContextType>;
  volume?: Resolver<ResolversTypes['BigDecimal'], ParentType, ContextType>;
  volumeUSD?: Resolver<ResolversTypes['BigDecimal'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type TokenHourDataResolvers<ContextType = any, ParentType extends ResolversParentTypes['TokenHourData'] = ResolversParentTypes['TokenHourData']> = {
  close?: Resolver<ResolversTypes['BigDecimal'], ParentType, ContextType>;
  feesUSD?: Resolver<ResolversTypes['BigDecimal'], ParentType, ContextType>;
  high?: Resolver<ResolversTypes['BigDecimal'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  low?: Resolver<ResolversTypes['BigDecimal'], ParentType, ContextType>;
  open?: Resolver<ResolversTypes['BigDecimal'], ParentType, ContextType>;
  periodStartUnix?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  priceUSD?: Resolver<ResolversTypes['BigDecimal'], ParentType, ContextType>;
  token?: Resolver<ResolversTypes['Token'], ParentType, ContextType>;
  totalValueLocked?: Resolver<ResolversTypes['BigDecimal'], ParentType, ContextType>;
  totalValueLockedUSD?: Resolver<ResolversTypes['BigDecimal'], ParentType, ContextType>;
  untrackedVolumeUSD?: Resolver<ResolversTypes['BigDecimal'], ParentType, ContextType>;
  volume?: Resolver<ResolversTypes['BigDecimal'], ParentType, ContextType>;
  volumeUSD?: Resolver<ResolversTypes['BigDecimal'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type TransactionResolvers<ContextType = any, ParentType extends ResolversParentTypes['Transaction'] = ResolversParentTypes['Transaction']> = {
  blockNumber?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  burns?: Resolver<Array<Maybe<ResolversTypes['Burn']>>, ParentType, ContextType, RequireFields<TransactionBurnsArgs, 'first' | 'skip'>>;
  collects?: Resolver<Array<Maybe<ResolversTypes['Collect']>>, ParentType, ContextType, RequireFields<TransactionCollectsArgs, 'first' | 'skip'>>;
  flashed?: Resolver<Array<Maybe<ResolversTypes['Flash']>>, ParentType, ContextType, RequireFields<TransactionFlashedArgs, 'first' | 'skip'>>;
  gasPrice?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  gasUsed?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  mints?: Resolver<Array<Maybe<ResolversTypes['Mint']>>, ParentType, ContextType, RequireFields<TransactionMintsArgs, 'first' | 'skip'>>;
  swaps?: Resolver<Array<Maybe<ResolversTypes['Swap']>>, ParentType, ContextType, RequireFields<TransactionSwapsArgs, 'first' | 'skip'>>;
  timestamp?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type UniswapDayDataResolvers<ContextType = any, ParentType extends ResolversParentTypes['UniswapDayData'] = ResolversParentTypes['UniswapDayData']> = {
  date?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  feesUSD?: Resolver<ResolversTypes['BigDecimal'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  tvlUSD?: Resolver<ResolversTypes['BigDecimal'], ParentType, ContextType>;
  txCount?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  volumeETH?: Resolver<ResolversTypes['BigDecimal'], ParentType, ContextType>;
  volumeUSD?: Resolver<ResolversTypes['BigDecimal'], ParentType, ContextType>;
  volumeUSDUntracked?: Resolver<ResolversTypes['BigDecimal'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type _Block_Resolvers<ContextType = any, ParentType extends ResolversParentTypes['_Block_'] = ResolversParentTypes['_Block_']> = {
  hash?: Resolver<Maybe<ResolversTypes['Bytes']>, ParentType, ContextType>;
  number?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  parentHash?: Resolver<Maybe<ResolversTypes['Bytes']>, ParentType, ContextType>;
  timestamp?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type _Meta_Resolvers<ContextType = any, ParentType extends ResolversParentTypes['_Meta_'] = ResolversParentTypes['_Meta_']> = {
  block?: Resolver<ResolversTypes['_Block_'], ParentType, ContextType>;
  deployment?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  hasIndexingErrors?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type Resolvers<ContextType = any> = {
  BigDecimal?: GraphQLScalarType;
  BigInt?: GraphQLScalarType;
  Bundle?: BundleResolvers<ContextType>;
  Burn?: BurnResolvers<ContextType>;
  Bytes?: GraphQLScalarType;
  Collect?: CollectResolvers<ContextType>;
  Factory?: FactoryResolvers<ContextType>;
  Flash?: FlashResolvers<ContextType>;
  Int8?: GraphQLScalarType;
  Mint?: MintResolvers<ContextType>;
  Pool?: PoolResolvers<ContextType>;
  PoolDayData?: PoolDayDataResolvers<ContextType>;
  PoolHourData?: PoolHourDataResolvers<ContextType>;
  Position?: PositionResolvers<ContextType>;
  PositionSnapshot?: PositionSnapshotResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
  Swap?: SwapResolvers<ContextType>;
  Tick?: TickResolvers<ContextType>;
  Timestamp?: GraphQLScalarType;
  Token?: TokenResolvers<ContextType>;
  TokenDayData?: TokenDayDataResolvers<ContextType>;
  TokenHourData?: TokenHourDataResolvers<ContextType>;
  Transaction?: TransactionResolvers<ContextType>;
  UniswapDayData?: UniswapDayDataResolvers<ContextType>;
  _Block_?: _Block_Resolvers<ContextType>;
  _Meta_?: _Meta_Resolvers<ContextType>;
};

export type DirectiveResolvers<ContextType = any> = {
  derivedFrom?: DerivedFromDirectiveResolver<any, any, ContextType>;
  entity?: EntityDirectiveResolver<any, any, ContextType>;
  subgraphId?: SubgraphIdDirectiveResolver<any, any, ContextType>;
};
