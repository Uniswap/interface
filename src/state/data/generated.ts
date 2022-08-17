import { api } from './slice';
export type Maybe<T> = T | null;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
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
};






export type BlockChangedFilter = {
  number_gte: Scalars['Int'];
};

export type Block_Height = {
  hash?: Maybe<Scalars['Bytes']>;
  number?: Maybe<Scalars['Int']>;
  number_gte?: Maybe<Scalars['Int']>;
};

export type Bundle = {
  __typename?: 'Bundle';
  id: Scalars['ID'];
  ethPriceUSD: Scalars['BigDecimal'];
};

export type Bundle_Filter = {
  id?: Maybe<Scalars['ID']>;
  id_not?: Maybe<Scalars['ID']>;
  id_gt?: Maybe<Scalars['ID']>;
  id_lt?: Maybe<Scalars['ID']>;
  id_gte?: Maybe<Scalars['ID']>;
  id_lte?: Maybe<Scalars['ID']>;
  id_in?: Maybe<Array<Scalars['ID']>>;
  id_not_in?: Maybe<Array<Scalars['ID']>>;
  ethPriceUSD?: Maybe<Scalars['BigDecimal']>;
  ethPriceUSD_not?: Maybe<Scalars['BigDecimal']>;
  ethPriceUSD_gt?: Maybe<Scalars['BigDecimal']>;
  ethPriceUSD_lt?: Maybe<Scalars['BigDecimal']>;
  ethPriceUSD_gte?: Maybe<Scalars['BigDecimal']>;
  ethPriceUSD_lte?: Maybe<Scalars['BigDecimal']>;
  ethPriceUSD_in?: Maybe<Array<Scalars['BigDecimal']>>;
  ethPriceUSD_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  /** Filter for the block changed event. */
  _change_block?: Maybe<BlockChangedFilter>;
};

export enum Bundle_OrderBy {
  Id = 'id',
  EthPriceUsd = 'ethPriceUSD'
}

export type Burn = {
  __typename?: 'Burn';
  id: Scalars['ID'];
  transaction: Transaction;
  pool: Pool;
  token0: Token;
  token1: Token;
  timestamp: Scalars['BigInt'];
  owner?: Maybe<Scalars['Bytes']>;
  origin: Scalars['Bytes'];
  amount: Scalars['BigInt'];
  amount0: Scalars['BigDecimal'];
  amount1: Scalars['BigDecimal'];
  amountUSD?: Maybe<Scalars['BigDecimal']>;
  tickLower: Scalars['BigInt'];
  tickUpper: Scalars['BigInt'];
  logIndex?: Maybe<Scalars['BigInt']>;
};

export type Burn_Filter = {
  id?: Maybe<Scalars['ID']>;
  id_not?: Maybe<Scalars['ID']>;
  id_gt?: Maybe<Scalars['ID']>;
  id_lt?: Maybe<Scalars['ID']>;
  id_gte?: Maybe<Scalars['ID']>;
  id_lte?: Maybe<Scalars['ID']>;
  id_in?: Maybe<Array<Scalars['ID']>>;
  id_not_in?: Maybe<Array<Scalars['ID']>>;
  transaction?: Maybe<Scalars['String']>;
  transaction_not?: Maybe<Scalars['String']>;
  transaction_gt?: Maybe<Scalars['String']>;
  transaction_lt?: Maybe<Scalars['String']>;
  transaction_gte?: Maybe<Scalars['String']>;
  transaction_lte?: Maybe<Scalars['String']>;
  transaction_in?: Maybe<Array<Scalars['String']>>;
  transaction_not_in?: Maybe<Array<Scalars['String']>>;
  transaction_contains?: Maybe<Scalars['String']>;
  transaction_contains_nocase?: Maybe<Scalars['String']>;
  transaction_not_contains?: Maybe<Scalars['String']>;
  transaction_not_contains_nocase?: Maybe<Scalars['String']>;
  transaction_starts_with?: Maybe<Scalars['String']>;
  transaction_starts_with_nocase?: Maybe<Scalars['String']>;
  transaction_not_starts_with?: Maybe<Scalars['String']>;
  transaction_not_starts_with_nocase?: Maybe<Scalars['String']>;
  transaction_ends_with?: Maybe<Scalars['String']>;
  transaction_ends_with_nocase?: Maybe<Scalars['String']>;
  transaction_not_ends_with?: Maybe<Scalars['String']>;
  transaction_not_ends_with_nocase?: Maybe<Scalars['String']>;
  transaction_?: Maybe<Transaction_Filter>;
  pool?: Maybe<Scalars['String']>;
  pool_not?: Maybe<Scalars['String']>;
  pool_gt?: Maybe<Scalars['String']>;
  pool_lt?: Maybe<Scalars['String']>;
  pool_gte?: Maybe<Scalars['String']>;
  pool_lte?: Maybe<Scalars['String']>;
  pool_in?: Maybe<Array<Scalars['String']>>;
  pool_not_in?: Maybe<Array<Scalars['String']>>;
  pool_contains?: Maybe<Scalars['String']>;
  pool_contains_nocase?: Maybe<Scalars['String']>;
  pool_not_contains?: Maybe<Scalars['String']>;
  pool_not_contains_nocase?: Maybe<Scalars['String']>;
  pool_starts_with?: Maybe<Scalars['String']>;
  pool_starts_with_nocase?: Maybe<Scalars['String']>;
  pool_not_starts_with?: Maybe<Scalars['String']>;
  pool_not_starts_with_nocase?: Maybe<Scalars['String']>;
  pool_ends_with?: Maybe<Scalars['String']>;
  pool_ends_with_nocase?: Maybe<Scalars['String']>;
  pool_not_ends_with?: Maybe<Scalars['String']>;
  pool_not_ends_with_nocase?: Maybe<Scalars['String']>;
  pool_?: Maybe<Pool_Filter>;
  token0?: Maybe<Scalars['String']>;
  token0_not?: Maybe<Scalars['String']>;
  token0_gt?: Maybe<Scalars['String']>;
  token0_lt?: Maybe<Scalars['String']>;
  token0_gte?: Maybe<Scalars['String']>;
  token0_lte?: Maybe<Scalars['String']>;
  token0_in?: Maybe<Array<Scalars['String']>>;
  token0_not_in?: Maybe<Array<Scalars['String']>>;
  token0_contains?: Maybe<Scalars['String']>;
  token0_contains_nocase?: Maybe<Scalars['String']>;
  token0_not_contains?: Maybe<Scalars['String']>;
  token0_not_contains_nocase?: Maybe<Scalars['String']>;
  token0_starts_with?: Maybe<Scalars['String']>;
  token0_starts_with_nocase?: Maybe<Scalars['String']>;
  token0_not_starts_with?: Maybe<Scalars['String']>;
  token0_not_starts_with_nocase?: Maybe<Scalars['String']>;
  token0_ends_with?: Maybe<Scalars['String']>;
  token0_ends_with_nocase?: Maybe<Scalars['String']>;
  token0_not_ends_with?: Maybe<Scalars['String']>;
  token0_not_ends_with_nocase?: Maybe<Scalars['String']>;
  token0_?: Maybe<Token_Filter>;
  token1?: Maybe<Scalars['String']>;
  token1_not?: Maybe<Scalars['String']>;
  token1_gt?: Maybe<Scalars['String']>;
  token1_lt?: Maybe<Scalars['String']>;
  token1_gte?: Maybe<Scalars['String']>;
  token1_lte?: Maybe<Scalars['String']>;
  token1_in?: Maybe<Array<Scalars['String']>>;
  token1_not_in?: Maybe<Array<Scalars['String']>>;
  token1_contains?: Maybe<Scalars['String']>;
  token1_contains_nocase?: Maybe<Scalars['String']>;
  token1_not_contains?: Maybe<Scalars['String']>;
  token1_not_contains_nocase?: Maybe<Scalars['String']>;
  token1_starts_with?: Maybe<Scalars['String']>;
  token1_starts_with_nocase?: Maybe<Scalars['String']>;
  token1_not_starts_with?: Maybe<Scalars['String']>;
  token1_not_starts_with_nocase?: Maybe<Scalars['String']>;
  token1_ends_with?: Maybe<Scalars['String']>;
  token1_ends_with_nocase?: Maybe<Scalars['String']>;
  token1_not_ends_with?: Maybe<Scalars['String']>;
  token1_not_ends_with_nocase?: Maybe<Scalars['String']>;
  token1_?: Maybe<Token_Filter>;
  timestamp?: Maybe<Scalars['BigInt']>;
  timestamp_not?: Maybe<Scalars['BigInt']>;
  timestamp_gt?: Maybe<Scalars['BigInt']>;
  timestamp_lt?: Maybe<Scalars['BigInt']>;
  timestamp_gte?: Maybe<Scalars['BigInt']>;
  timestamp_lte?: Maybe<Scalars['BigInt']>;
  timestamp_in?: Maybe<Array<Scalars['BigInt']>>;
  timestamp_not_in?: Maybe<Array<Scalars['BigInt']>>;
  owner?: Maybe<Scalars['Bytes']>;
  owner_not?: Maybe<Scalars['Bytes']>;
  owner_in?: Maybe<Array<Scalars['Bytes']>>;
  owner_not_in?: Maybe<Array<Scalars['Bytes']>>;
  owner_contains?: Maybe<Scalars['Bytes']>;
  owner_not_contains?: Maybe<Scalars['Bytes']>;
  origin?: Maybe<Scalars['Bytes']>;
  origin_not?: Maybe<Scalars['Bytes']>;
  origin_in?: Maybe<Array<Scalars['Bytes']>>;
  origin_not_in?: Maybe<Array<Scalars['Bytes']>>;
  origin_contains?: Maybe<Scalars['Bytes']>;
  origin_not_contains?: Maybe<Scalars['Bytes']>;
  amount?: Maybe<Scalars['BigInt']>;
  amount_not?: Maybe<Scalars['BigInt']>;
  amount_gt?: Maybe<Scalars['BigInt']>;
  amount_lt?: Maybe<Scalars['BigInt']>;
  amount_gte?: Maybe<Scalars['BigInt']>;
  amount_lte?: Maybe<Scalars['BigInt']>;
  amount_in?: Maybe<Array<Scalars['BigInt']>>;
  amount_not_in?: Maybe<Array<Scalars['BigInt']>>;
  amount0?: Maybe<Scalars['BigDecimal']>;
  amount0_not?: Maybe<Scalars['BigDecimal']>;
  amount0_gt?: Maybe<Scalars['BigDecimal']>;
  amount0_lt?: Maybe<Scalars['BigDecimal']>;
  amount0_gte?: Maybe<Scalars['BigDecimal']>;
  amount0_lte?: Maybe<Scalars['BigDecimal']>;
  amount0_in?: Maybe<Array<Scalars['BigDecimal']>>;
  amount0_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  amount1?: Maybe<Scalars['BigDecimal']>;
  amount1_not?: Maybe<Scalars['BigDecimal']>;
  amount1_gt?: Maybe<Scalars['BigDecimal']>;
  amount1_lt?: Maybe<Scalars['BigDecimal']>;
  amount1_gte?: Maybe<Scalars['BigDecimal']>;
  amount1_lte?: Maybe<Scalars['BigDecimal']>;
  amount1_in?: Maybe<Array<Scalars['BigDecimal']>>;
  amount1_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  amountUSD?: Maybe<Scalars['BigDecimal']>;
  amountUSD_not?: Maybe<Scalars['BigDecimal']>;
  amountUSD_gt?: Maybe<Scalars['BigDecimal']>;
  amountUSD_lt?: Maybe<Scalars['BigDecimal']>;
  amountUSD_gte?: Maybe<Scalars['BigDecimal']>;
  amountUSD_lte?: Maybe<Scalars['BigDecimal']>;
  amountUSD_in?: Maybe<Array<Scalars['BigDecimal']>>;
  amountUSD_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  tickLower?: Maybe<Scalars['BigInt']>;
  tickLower_not?: Maybe<Scalars['BigInt']>;
  tickLower_gt?: Maybe<Scalars['BigInt']>;
  tickLower_lt?: Maybe<Scalars['BigInt']>;
  tickLower_gte?: Maybe<Scalars['BigInt']>;
  tickLower_lte?: Maybe<Scalars['BigInt']>;
  tickLower_in?: Maybe<Array<Scalars['BigInt']>>;
  tickLower_not_in?: Maybe<Array<Scalars['BigInt']>>;
  tickUpper?: Maybe<Scalars['BigInt']>;
  tickUpper_not?: Maybe<Scalars['BigInt']>;
  tickUpper_gt?: Maybe<Scalars['BigInt']>;
  tickUpper_lt?: Maybe<Scalars['BigInt']>;
  tickUpper_gte?: Maybe<Scalars['BigInt']>;
  tickUpper_lte?: Maybe<Scalars['BigInt']>;
  tickUpper_in?: Maybe<Array<Scalars['BigInt']>>;
  tickUpper_not_in?: Maybe<Array<Scalars['BigInt']>>;
  logIndex?: Maybe<Scalars['BigInt']>;
  logIndex_not?: Maybe<Scalars['BigInt']>;
  logIndex_gt?: Maybe<Scalars['BigInt']>;
  logIndex_lt?: Maybe<Scalars['BigInt']>;
  logIndex_gte?: Maybe<Scalars['BigInt']>;
  logIndex_lte?: Maybe<Scalars['BigInt']>;
  logIndex_in?: Maybe<Array<Scalars['BigInt']>>;
  logIndex_not_in?: Maybe<Array<Scalars['BigInt']>>;
  /** Filter for the block changed event. */
  _change_block?: Maybe<BlockChangedFilter>;
};

export enum Burn_OrderBy {
  Id = 'id',
  Transaction = 'transaction',
  Pool = 'pool',
  Token0 = 'token0',
  Token1 = 'token1',
  Timestamp = 'timestamp',
  Owner = 'owner',
  Origin = 'origin',
  Amount = 'amount',
  Amount0 = 'amount0',
  Amount1 = 'amount1',
  AmountUsd = 'amountUSD',
  TickLower = 'tickLower',
  TickUpper = 'tickUpper',
  LogIndex = 'logIndex'
}


export type Collect = {
  __typename?: 'Collect';
  id: Scalars['ID'];
  transaction: Transaction;
  timestamp: Scalars['BigInt'];
  pool: Pool;
  owner?: Maybe<Scalars['Bytes']>;
  amount0: Scalars['BigDecimal'];
  amount1: Scalars['BigDecimal'];
  amountUSD?: Maybe<Scalars['BigDecimal']>;
  tickLower: Scalars['BigInt'];
  tickUpper: Scalars['BigInt'];
  logIndex?: Maybe<Scalars['BigInt']>;
};

export type Collect_Filter = {
  id?: Maybe<Scalars['ID']>;
  id_not?: Maybe<Scalars['ID']>;
  id_gt?: Maybe<Scalars['ID']>;
  id_lt?: Maybe<Scalars['ID']>;
  id_gte?: Maybe<Scalars['ID']>;
  id_lte?: Maybe<Scalars['ID']>;
  id_in?: Maybe<Array<Scalars['ID']>>;
  id_not_in?: Maybe<Array<Scalars['ID']>>;
  transaction?: Maybe<Scalars['String']>;
  transaction_not?: Maybe<Scalars['String']>;
  transaction_gt?: Maybe<Scalars['String']>;
  transaction_lt?: Maybe<Scalars['String']>;
  transaction_gte?: Maybe<Scalars['String']>;
  transaction_lte?: Maybe<Scalars['String']>;
  transaction_in?: Maybe<Array<Scalars['String']>>;
  transaction_not_in?: Maybe<Array<Scalars['String']>>;
  transaction_contains?: Maybe<Scalars['String']>;
  transaction_contains_nocase?: Maybe<Scalars['String']>;
  transaction_not_contains?: Maybe<Scalars['String']>;
  transaction_not_contains_nocase?: Maybe<Scalars['String']>;
  transaction_starts_with?: Maybe<Scalars['String']>;
  transaction_starts_with_nocase?: Maybe<Scalars['String']>;
  transaction_not_starts_with?: Maybe<Scalars['String']>;
  transaction_not_starts_with_nocase?: Maybe<Scalars['String']>;
  transaction_ends_with?: Maybe<Scalars['String']>;
  transaction_ends_with_nocase?: Maybe<Scalars['String']>;
  transaction_not_ends_with?: Maybe<Scalars['String']>;
  transaction_not_ends_with_nocase?: Maybe<Scalars['String']>;
  transaction_?: Maybe<Transaction_Filter>;
  timestamp?: Maybe<Scalars['BigInt']>;
  timestamp_not?: Maybe<Scalars['BigInt']>;
  timestamp_gt?: Maybe<Scalars['BigInt']>;
  timestamp_lt?: Maybe<Scalars['BigInt']>;
  timestamp_gte?: Maybe<Scalars['BigInt']>;
  timestamp_lte?: Maybe<Scalars['BigInt']>;
  timestamp_in?: Maybe<Array<Scalars['BigInt']>>;
  timestamp_not_in?: Maybe<Array<Scalars['BigInt']>>;
  pool?: Maybe<Scalars['String']>;
  pool_not?: Maybe<Scalars['String']>;
  pool_gt?: Maybe<Scalars['String']>;
  pool_lt?: Maybe<Scalars['String']>;
  pool_gte?: Maybe<Scalars['String']>;
  pool_lte?: Maybe<Scalars['String']>;
  pool_in?: Maybe<Array<Scalars['String']>>;
  pool_not_in?: Maybe<Array<Scalars['String']>>;
  pool_contains?: Maybe<Scalars['String']>;
  pool_contains_nocase?: Maybe<Scalars['String']>;
  pool_not_contains?: Maybe<Scalars['String']>;
  pool_not_contains_nocase?: Maybe<Scalars['String']>;
  pool_starts_with?: Maybe<Scalars['String']>;
  pool_starts_with_nocase?: Maybe<Scalars['String']>;
  pool_not_starts_with?: Maybe<Scalars['String']>;
  pool_not_starts_with_nocase?: Maybe<Scalars['String']>;
  pool_ends_with?: Maybe<Scalars['String']>;
  pool_ends_with_nocase?: Maybe<Scalars['String']>;
  pool_not_ends_with?: Maybe<Scalars['String']>;
  pool_not_ends_with_nocase?: Maybe<Scalars['String']>;
  pool_?: Maybe<Pool_Filter>;
  owner?: Maybe<Scalars['Bytes']>;
  owner_not?: Maybe<Scalars['Bytes']>;
  owner_in?: Maybe<Array<Scalars['Bytes']>>;
  owner_not_in?: Maybe<Array<Scalars['Bytes']>>;
  owner_contains?: Maybe<Scalars['Bytes']>;
  owner_not_contains?: Maybe<Scalars['Bytes']>;
  amount0?: Maybe<Scalars['BigDecimal']>;
  amount0_not?: Maybe<Scalars['BigDecimal']>;
  amount0_gt?: Maybe<Scalars['BigDecimal']>;
  amount0_lt?: Maybe<Scalars['BigDecimal']>;
  amount0_gte?: Maybe<Scalars['BigDecimal']>;
  amount0_lte?: Maybe<Scalars['BigDecimal']>;
  amount0_in?: Maybe<Array<Scalars['BigDecimal']>>;
  amount0_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  amount1?: Maybe<Scalars['BigDecimal']>;
  amount1_not?: Maybe<Scalars['BigDecimal']>;
  amount1_gt?: Maybe<Scalars['BigDecimal']>;
  amount1_lt?: Maybe<Scalars['BigDecimal']>;
  amount1_gte?: Maybe<Scalars['BigDecimal']>;
  amount1_lte?: Maybe<Scalars['BigDecimal']>;
  amount1_in?: Maybe<Array<Scalars['BigDecimal']>>;
  amount1_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  amountUSD?: Maybe<Scalars['BigDecimal']>;
  amountUSD_not?: Maybe<Scalars['BigDecimal']>;
  amountUSD_gt?: Maybe<Scalars['BigDecimal']>;
  amountUSD_lt?: Maybe<Scalars['BigDecimal']>;
  amountUSD_gte?: Maybe<Scalars['BigDecimal']>;
  amountUSD_lte?: Maybe<Scalars['BigDecimal']>;
  amountUSD_in?: Maybe<Array<Scalars['BigDecimal']>>;
  amountUSD_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  tickLower?: Maybe<Scalars['BigInt']>;
  tickLower_not?: Maybe<Scalars['BigInt']>;
  tickLower_gt?: Maybe<Scalars['BigInt']>;
  tickLower_lt?: Maybe<Scalars['BigInt']>;
  tickLower_gte?: Maybe<Scalars['BigInt']>;
  tickLower_lte?: Maybe<Scalars['BigInt']>;
  tickLower_in?: Maybe<Array<Scalars['BigInt']>>;
  tickLower_not_in?: Maybe<Array<Scalars['BigInt']>>;
  tickUpper?: Maybe<Scalars['BigInt']>;
  tickUpper_not?: Maybe<Scalars['BigInt']>;
  tickUpper_gt?: Maybe<Scalars['BigInt']>;
  tickUpper_lt?: Maybe<Scalars['BigInt']>;
  tickUpper_gte?: Maybe<Scalars['BigInt']>;
  tickUpper_lte?: Maybe<Scalars['BigInt']>;
  tickUpper_in?: Maybe<Array<Scalars['BigInt']>>;
  tickUpper_not_in?: Maybe<Array<Scalars['BigInt']>>;
  logIndex?: Maybe<Scalars['BigInt']>;
  logIndex_not?: Maybe<Scalars['BigInt']>;
  logIndex_gt?: Maybe<Scalars['BigInt']>;
  logIndex_lt?: Maybe<Scalars['BigInt']>;
  logIndex_gte?: Maybe<Scalars['BigInt']>;
  logIndex_lte?: Maybe<Scalars['BigInt']>;
  logIndex_in?: Maybe<Array<Scalars['BigInt']>>;
  logIndex_not_in?: Maybe<Array<Scalars['BigInt']>>;
  /** Filter for the block changed event. */
  _change_block?: Maybe<BlockChangedFilter>;
};

export enum Collect_OrderBy {
  Id = 'id',
  Transaction = 'transaction',
  Timestamp = 'timestamp',
  Pool = 'pool',
  Owner = 'owner',
  Amount0 = 'amount0',
  Amount1 = 'amount1',
  AmountUsd = 'amountUSD',
  TickLower = 'tickLower',
  TickUpper = 'tickUpper',
  LogIndex = 'logIndex'
}

export type Factory = {
  __typename?: 'Factory';
  id: Scalars['ID'];
  poolCount: Scalars['BigInt'];
  txCount: Scalars['BigInt'];
  totalVolumeUSD: Scalars['BigDecimal'];
  totalVolumeETH: Scalars['BigDecimal'];
  totalFeesUSD: Scalars['BigDecimal'];
  totalFeesETH: Scalars['BigDecimal'];
  untrackedVolumeUSD: Scalars['BigDecimal'];
  totalValueLockedUSD: Scalars['BigDecimal'];
  totalValueLockedETH: Scalars['BigDecimal'];
  totalValueLockedUSDUntracked: Scalars['BigDecimal'];
  totalValueLockedETHUntracked: Scalars['BigDecimal'];
  owner: Scalars['ID'];
};

export type Factory_Filter = {
  id?: Maybe<Scalars['ID']>;
  id_not?: Maybe<Scalars['ID']>;
  id_gt?: Maybe<Scalars['ID']>;
  id_lt?: Maybe<Scalars['ID']>;
  id_gte?: Maybe<Scalars['ID']>;
  id_lte?: Maybe<Scalars['ID']>;
  id_in?: Maybe<Array<Scalars['ID']>>;
  id_not_in?: Maybe<Array<Scalars['ID']>>;
  poolCount?: Maybe<Scalars['BigInt']>;
  poolCount_not?: Maybe<Scalars['BigInt']>;
  poolCount_gt?: Maybe<Scalars['BigInt']>;
  poolCount_lt?: Maybe<Scalars['BigInt']>;
  poolCount_gte?: Maybe<Scalars['BigInt']>;
  poolCount_lte?: Maybe<Scalars['BigInt']>;
  poolCount_in?: Maybe<Array<Scalars['BigInt']>>;
  poolCount_not_in?: Maybe<Array<Scalars['BigInt']>>;
  txCount?: Maybe<Scalars['BigInt']>;
  txCount_not?: Maybe<Scalars['BigInt']>;
  txCount_gt?: Maybe<Scalars['BigInt']>;
  txCount_lt?: Maybe<Scalars['BigInt']>;
  txCount_gte?: Maybe<Scalars['BigInt']>;
  txCount_lte?: Maybe<Scalars['BigInt']>;
  txCount_in?: Maybe<Array<Scalars['BigInt']>>;
  txCount_not_in?: Maybe<Array<Scalars['BigInt']>>;
  totalVolumeUSD?: Maybe<Scalars['BigDecimal']>;
  totalVolumeUSD_not?: Maybe<Scalars['BigDecimal']>;
  totalVolumeUSD_gt?: Maybe<Scalars['BigDecimal']>;
  totalVolumeUSD_lt?: Maybe<Scalars['BigDecimal']>;
  totalVolumeUSD_gte?: Maybe<Scalars['BigDecimal']>;
  totalVolumeUSD_lte?: Maybe<Scalars['BigDecimal']>;
  totalVolumeUSD_in?: Maybe<Array<Scalars['BigDecimal']>>;
  totalVolumeUSD_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  totalVolumeETH?: Maybe<Scalars['BigDecimal']>;
  totalVolumeETH_not?: Maybe<Scalars['BigDecimal']>;
  totalVolumeETH_gt?: Maybe<Scalars['BigDecimal']>;
  totalVolumeETH_lt?: Maybe<Scalars['BigDecimal']>;
  totalVolumeETH_gte?: Maybe<Scalars['BigDecimal']>;
  totalVolumeETH_lte?: Maybe<Scalars['BigDecimal']>;
  totalVolumeETH_in?: Maybe<Array<Scalars['BigDecimal']>>;
  totalVolumeETH_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  totalFeesUSD?: Maybe<Scalars['BigDecimal']>;
  totalFeesUSD_not?: Maybe<Scalars['BigDecimal']>;
  totalFeesUSD_gt?: Maybe<Scalars['BigDecimal']>;
  totalFeesUSD_lt?: Maybe<Scalars['BigDecimal']>;
  totalFeesUSD_gte?: Maybe<Scalars['BigDecimal']>;
  totalFeesUSD_lte?: Maybe<Scalars['BigDecimal']>;
  totalFeesUSD_in?: Maybe<Array<Scalars['BigDecimal']>>;
  totalFeesUSD_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  totalFeesETH?: Maybe<Scalars['BigDecimal']>;
  totalFeesETH_not?: Maybe<Scalars['BigDecimal']>;
  totalFeesETH_gt?: Maybe<Scalars['BigDecimal']>;
  totalFeesETH_lt?: Maybe<Scalars['BigDecimal']>;
  totalFeesETH_gte?: Maybe<Scalars['BigDecimal']>;
  totalFeesETH_lte?: Maybe<Scalars['BigDecimal']>;
  totalFeesETH_in?: Maybe<Array<Scalars['BigDecimal']>>;
  totalFeesETH_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  untrackedVolumeUSD?: Maybe<Scalars['BigDecimal']>;
  untrackedVolumeUSD_not?: Maybe<Scalars['BigDecimal']>;
  untrackedVolumeUSD_gt?: Maybe<Scalars['BigDecimal']>;
  untrackedVolumeUSD_lt?: Maybe<Scalars['BigDecimal']>;
  untrackedVolumeUSD_gte?: Maybe<Scalars['BigDecimal']>;
  untrackedVolumeUSD_lte?: Maybe<Scalars['BigDecimal']>;
  untrackedVolumeUSD_in?: Maybe<Array<Scalars['BigDecimal']>>;
  untrackedVolumeUSD_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  totalValueLockedUSD?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedUSD_not?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedUSD_gt?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedUSD_lt?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedUSD_gte?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedUSD_lte?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedUSD_in?: Maybe<Array<Scalars['BigDecimal']>>;
  totalValueLockedUSD_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  totalValueLockedETH?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedETH_not?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedETH_gt?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedETH_lt?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedETH_gte?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedETH_lte?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedETH_in?: Maybe<Array<Scalars['BigDecimal']>>;
  totalValueLockedETH_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  totalValueLockedUSDUntracked?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedUSDUntracked_not?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedUSDUntracked_gt?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedUSDUntracked_lt?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedUSDUntracked_gte?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedUSDUntracked_lte?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedUSDUntracked_in?: Maybe<Array<Scalars['BigDecimal']>>;
  totalValueLockedUSDUntracked_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  totalValueLockedETHUntracked?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedETHUntracked_not?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedETHUntracked_gt?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedETHUntracked_lt?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedETHUntracked_gte?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedETHUntracked_lte?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedETHUntracked_in?: Maybe<Array<Scalars['BigDecimal']>>;
  totalValueLockedETHUntracked_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  owner?: Maybe<Scalars['ID']>;
  owner_not?: Maybe<Scalars['ID']>;
  owner_gt?: Maybe<Scalars['ID']>;
  owner_lt?: Maybe<Scalars['ID']>;
  owner_gte?: Maybe<Scalars['ID']>;
  owner_lte?: Maybe<Scalars['ID']>;
  owner_in?: Maybe<Array<Scalars['ID']>>;
  owner_not_in?: Maybe<Array<Scalars['ID']>>;
  /** Filter for the block changed event. */
  _change_block?: Maybe<BlockChangedFilter>;
};

export enum Factory_OrderBy {
  Id = 'id',
  PoolCount = 'poolCount',
  TxCount = 'txCount',
  TotalVolumeUsd = 'totalVolumeUSD',
  TotalVolumeEth = 'totalVolumeETH',
  TotalFeesUsd = 'totalFeesUSD',
  TotalFeesEth = 'totalFeesETH',
  UntrackedVolumeUsd = 'untrackedVolumeUSD',
  TotalValueLockedUsd = 'totalValueLockedUSD',
  TotalValueLockedEth = 'totalValueLockedETH',
  TotalValueLockedUsdUntracked = 'totalValueLockedUSDUntracked',
  TotalValueLockedEthUntracked = 'totalValueLockedETHUntracked',
  Owner = 'owner'
}

export type Flash = {
  __typename?: 'Flash';
  id: Scalars['ID'];
  transaction: Transaction;
  timestamp: Scalars['BigInt'];
  pool: Pool;
  sender: Scalars['Bytes'];
  recipient: Scalars['Bytes'];
  amount0: Scalars['BigDecimal'];
  amount1: Scalars['BigDecimal'];
  amountUSD: Scalars['BigDecimal'];
  amount0Paid: Scalars['BigDecimal'];
  amount1Paid: Scalars['BigDecimal'];
  logIndex?: Maybe<Scalars['BigInt']>;
};

export type Flash_Filter = {
  id?: Maybe<Scalars['ID']>;
  id_not?: Maybe<Scalars['ID']>;
  id_gt?: Maybe<Scalars['ID']>;
  id_lt?: Maybe<Scalars['ID']>;
  id_gte?: Maybe<Scalars['ID']>;
  id_lte?: Maybe<Scalars['ID']>;
  id_in?: Maybe<Array<Scalars['ID']>>;
  id_not_in?: Maybe<Array<Scalars['ID']>>;
  transaction?: Maybe<Scalars['String']>;
  transaction_not?: Maybe<Scalars['String']>;
  transaction_gt?: Maybe<Scalars['String']>;
  transaction_lt?: Maybe<Scalars['String']>;
  transaction_gte?: Maybe<Scalars['String']>;
  transaction_lte?: Maybe<Scalars['String']>;
  transaction_in?: Maybe<Array<Scalars['String']>>;
  transaction_not_in?: Maybe<Array<Scalars['String']>>;
  transaction_contains?: Maybe<Scalars['String']>;
  transaction_contains_nocase?: Maybe<Scalars['String']>;
  transaction_not_contains?: Maybe<Scalars['String']>;
  transaction_not_contains_nocase?: Maybe<Scalars['String']>;
  transaction_starts_with?: Maybe<Scalars['String']>;
  transaction_starts_with_nocase?: Maybe<Scalars['String']>;
  transaction_not_starts_with?: Maybe<Scalars['String']>;
  transaction_not_starts_with_nocase?: Maybe<Scalars['String']>;
  transaction_ends_with?: Maybe<Scalars['String']>;
  transaction_ends_with_nocase?: Maybe<Scalars['String']>;
  transaction_not_ends_with?: Maybe<Scalars['String']>;
  transaction_not_ends_with_nocase?: Maybe<Scalars['String']>;
  transaction_?: Maybe<Transaction_Filter>;
  timestamp?: Maybe<Scalars['BigInt']>;
  timestamp_not?: Maybe<Scalars['BigInt']>;
  timestamp_gt?: Maybe<Scalars['BigInt']>;
  timestamp_lt?: Maybe<Scalars['BigInt']>;
  timestamp_gte?: Maybe<Scalars['BigInt']>;
  timestamp_lte?: Maybe<Scalars['BigInt']>;
  timestamp_in?: Maybe<Array<Scalars['BigInt']>>;
  timestamp_not_in?: Maybe<Array<Scalars['BigInt']>>;
  pool?: Maybe<Scalars['String']>;
  pool_not?: Maybe<Scalars['String']>;
  pool_gt?: Maybe<Scalars['String']>;
  pool_lt?: Maybe<Scalars['String']>;
  pool_gte?: Maybe<Scalars['String']>;
  pool_lte?: Maybe<Scalars['String']>;
  pool_in?: Maybe<Array<Scalars['String']>>;
  pool_not_in?: Maybe<Array<Scalars['String']>>;
  pool_contains?: Maybe<Scalars['String']>;
  pool_contains_nocase?: Maybe<Scalars['String']>;
  pool_not_contains?: Maybe<Scalars['String']>;
  pool_not_contains_nocase?: Maybe<Scalars['String']>;
  pool_starts_with?: Maybe<Scalars['String']>;
  pool_starts_with_nocase?: Maybe<Scalars['String']>;
  pool_not_starts_with?: Maybe<Scalars['String']>;
  pool_not_starts_with_nocase?: Maybe<Scalars['String']>;
  pool_ends_with?: Maybe<Scalars['String']>;
  pool_ends_with_nocase?: Maybe<Scalars['String']>;
  pool_not_ends_with?: Maybe<Scalars['String']>;
  pool_not_ends_with_nocase?: Maybe<Scalars['String']>;
  pool_?: Maybe<Pool_Filter>;
  sender?: Maybe<Scalars['Bytes']>;
  sender_not?: Maybe<Scalars['Bytes']>;
  sender_in?: Maybe<Array<Scalars['Bytes']>>;
  sender_not_in?: Maybe<Array<Scalars['Bytes']>>;
  sender_contains?: Maybe<Scalars['Bytes']>;
  sender_not_contains?: Maybe<Scalars['Bytes']>;
  recipient?: Maybe<Scalars['Bytes']>;
  recipient_not?: Maybe<Scalars['Bytes']>;
  recipient_in?: Maybe<Array<Scalars['Bytes']>>;
  recipient_not_in?: Maybe<Array<Scalars['Bytes']>>;
  recipient_contains?: Maybe<Scalars['Bytes']>;
  recipient_not_contains?: Maybe<Scalars['Bytes']>;
  amount0?: Maybe<Scalars['BigDecimal']>;
  amount0_not?: Maybe<Scalars['BigDecimal']>;
  amount0_gt?: Maybe<Scalars['BigDecimal']>;
  amount0_lt?: Maybe<Scalars['BigDecimal']>;
  amount0_gte?: Maybe<Scalars['BigDecimal']>;
  amount0_lte?: Maybe<Scalars['BigDecimal']>;
  amount0_in?: Maybe<Array<Scalars['BigDecimal']>>;
  amount0_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  amount1?: Maybe<Scalars['BigDecimal']>;
  amount1_not?: Maybe<Scalars['BigDecimal']>;
  amount1_gt?: Maybe<Scalars['BigDecimal']>;
  amount1_lt?: Maybe<Scalars['BigDecimal']>;
  amount1_gte?: Maybe<Scalars['BigDecimal']>;
  amount1_lte?: Maybe<Scalars['BigDecimal']>;
  amount1_in?: Maybe<Array<Scalars['BigDecimal']>>;
  amount1_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  amountUSD?: Maybe<Scalars['BigDecimal']>;
  amountUSD_not?: Maybe<Scalars['BigDecimal']>;
  amountUSD_gt?: Maybe<Scalars['BigDecimal']>;
  amountUSD_lt?: Maybe<Scalars['BigDecimal']>;
  amountUSD_gte?: Maybe<Scalars['BigDecimal']>;
  amountUSD_lte?: Maybe<Scalars['BigDecimal']>;
  amountUSD_in?: Maybe<Array<Scalars['BigDecimal']>>;
  amountUSD_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  amount0Paid?: Maybe<Scalars['BigDecimal']>;
  amount0Paid_not?: Maybe<Scalars['BigDecimal']>;
  amount0Paid_gt?: Maybe<Scalars['BigDecimal']>;
  amount0Paid_lt?: Maybe<Scalars['BigDecimal']>;
  amount0Paid_gte?: Maybe<Scalars['BigDecimal']>;
  amount0Paid_lte?: Maybe<Scalars['BigDecimal']>;
  amount0Paid_in?: Maybe<Array<Scalars['BigDecimal']>>;
  amount0Paid_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  amount1Paid?: Maybe<Scalars['BigDecimal']>;
  amount1Paid_not?: Maybe<Scalars['BigDecimal']>;
  amount1Paid_gt?: Maybe<Scalars['BigDecimal']>;
  amount1Paid_lt?: Maybe<Scalars['BigDecimal']>;
  amount1Paid_gte?: Maybe<Scalars['BigDecimal']>;
  amount1Paid_lte?: Maybe<Scalars['BigDecimal']>;
  amount1Paid_in?: Maybe<Array<Scalars['BigDecimal']>>;
  amount1Paid_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  logIndex?: Maybe<Scalars['BigInt']>;
  logIndex_not?: Maybe<Scalars['BigInt']>;
  logIndex_gt?: Maybe<Scalars['BigInt']>;
  logIndex_lt?: Maybe<Scalars['BigInt']>;
  logIndex_gte?: Maybe<Scalars['BigInt']>;
  logIndex_lte?: Maybe<Scalars['BigInt']>;
  logIndex_in?: Maybe<Array<Scalars['BigInt']>>;
  logIndex_not_in?: Maybe<Array<Scalars['BigInt']>>;
  /** Filter for the block changed event. */
  _change_block?: Maybe<BlockChangedFilter>;
};

export enum Flash_OrderBy {
  Id = 'id',
  Transaction = 'transaction',
  Timestamp = 'timestamp',
  Pool = 'pool',
  Sender = 'sender',
  Recipient = 'recipient',
  Amount0 = 'amount0',
  Amount1 = 'amount1',
  AmountUsd = 'amountUSD',
  Amount0Paid = 'amount0Paid',
  Amount1Paid = 'amount1Paid',
  LogIndex = 'logIndex'
}

export type Mint = {
  __typename?: 'Mint';
  id: Scalars['ID'];
  transaction: Transaction;
  timestamp: Scalars['BigInt'];
  pool: Pool;
  token0: Token;
  token1: Token;
  owner: Scalars['Bytes'];
  sender?: Maybe<Scalars['Bytes']>;
  origin: Scalars['Bytes'];
  amount: Scalars['BigInt'];
  amount0: Scalars['BigDecimal'];
  amount1: Scalars['BigDecimal'];
  amountUSD?: Maybe<Scalars['BigDecimal']>;
  tickLower: Scalars['BigInt'];
  tickUpper: Scalars['BigInt'];
  logIndex?: Maybe<Scalars['BigInt']>;
};

export type Mint_Filter = {
  id?: Maybe<Scalars['ID']>;
  id_not?: Maybe<Scalars['ID']>;
  id_gt?: Maybe<Scalars['ID']>;
  id_lt?: Maybe<Scalars['ID']>;
  id_gte?: Maybe<Scalars['ID']>;
  id_lte?: Maybe<Scalars['ID']>;
  id_in?: Maybe<Array<Scalars['ID']>>;
  id_not_in?: Maybe<Array<Scalars['ID']>>;
  transaction?: Maybe<Scalars['String']>;
  transaction_not?: Maybe<Scalars['String']>;
  transaction_gt?: Maybe<Scalars['String']>;
  transaction_lt?: Maybe<Scalars['String']>;
  transaction_gte?: Maybe<Scalars['String']>;
  transaction_lte?: Maybe<Scalars['String']>;
  transaction_in?: Maybe<Array<Scalars['String']>>;
  transaction_not_in?: Maybe<Array<Scalars['String']>>;
  transaction_contains?: Maybe<Scalars['String']>;
  transaction_contains_nocase?: Maybe<Scalars['String']>;
  transaction_not_contains?: Maybe<Scalars['String']>;
  transaction_not_contains_nocase?: Maybe<Scalars['String']>;
  transaction_starts_with?: Maybe<Scalars['String']>;
  transaction_starts_with_nocase?: Maybe<Scalars['String']>;
  transaction_not_starts_with?: Maybe<Scalars['String']>;
  transaction_not_starts_with_nocase?: Maybe<Scalars['String']>;
  transaction_ends_with?: Maybe<Scalars['String']>;
  transaction_ends_with_nocase?: Maybe<Scalars['String']>;
  transaction_not_ends_with?: Maybe<Scalars['String']>;
  transaction_not_ends_with_nocase?: Maybe<Scalars['String']>;
  transaction_?: Maybe<Transaction_Filter>;
  timestamp?: Maybe<Scalars['BigInt']>;
  timestamp_not?: Maybe<Scalars['BigInt']>;
  timestamp_gt?: Maybe<Scalars['BigInt']>;
  timestamp_lt?: Maybe<Scalars['BigInt']>;
  timestamp_gte?: Maybe<Scalars['BigInt']>;
  timestamp_lte?: Maybe<Scalars['BigInt']>;
  timestamp_in?: Maybe<Array<Scalars['BigInt']>>;
  timestamp_not_in?: Maybe<Array<Scalars['BigInt']>>;
  pool?: Maybe<Scalars['String']>;
  pool_not?: Maybe<Scalars['String']>;
  pool_gt?: Maybe<Scalars['String']>;
  pool_lt?: Maybe<Scalars['String']>;
  pool_gte?: Maybe<Scalars['String']>;
  pool_lte?: Maybe<Scalars['String']>;
  pool_in?: Maybe<Array<Scalars['String']>>;
  pool_not_in?: Maybe<Array<Scalars['String']>>;
  pool_contains?: Maybe<Scalars['String']>;
  pool_contains_nocase?: Maybe<Scalars['String']>;
  pool_not_contains?: Maybe<Scalars['String']>;
  pool_not_contains_nocase?: Maybe<Scalars['String']>;
  pool_starts_with?: Maybe<Scalars['String']>;
  pool_starts_with_nocase?: Maybe<Scalars['String']>;
  pool_not_starts_with?: Maybe<Scalars['String']>;
  pool_not_starts_with_nocase?: Maybe<Scalars['String']>;
  pool_ends_with?: Maybe<Scalars['String']>;
  pool_ends_with_nocase?: Maybe<Scalars['String']>;
  pool_not_ends_with?: Maybe<Scalars['String']>;
  pool_not_ends_with_nocase?: Maybe<Scalars['String']>;
  pool_?: Maybe<Pool_Filter>;
  token0?: Maybe<Scalars['String']>;
  token0_not?: Maybe<Scalars['String']>;
  token0_gt?: Maybe<Scalars['String']>;
  token0_lt?: Maybe<Scalars['String']>;
  token0_gte?: Maybe<Scalars['String']>;
  token0_lte?: Maybe<Scalars['String']>;
  token0_in?: Maybe<Array<Scalars['String']>>;
  token0_not_in?: Maybe<Array<Scalars['String']>>;
  token0_contains?: Maybe<Scalars['String']>;
  token0_contains_nocase?: Maybe<Scalars['String']>;
  token0_not_contains?: Maybe<Scalars['String']>;
  token0_not_contains_nocase?: Maybe<Scalars['String']>;
  token0_starts_with?: Maybe<Scalars['String']>;
  token0_starts_with_nocase?: Maybe<Scalars['String']>;
  token0_not_starts_with?: Maybe<Scalars['String']>;
  token0_not_starts_with_nocase?: Maybe<Scalars['String']>;
  token0_ends_with?: Maybe<Scalars['String']>;
  token0_ends_with_nocase?: Maybe<Scalars['String']>;
  token0_not_ends_with?: Maybe<Scalars['String']>;
  token0_not_ends_with_nocase?: Maybe<Scalars['String']>;
  token0_?: Maybe<Token_Filter>;
  token1?: Maybe<Scalars['String']>;
  token1_not?: Maybe<Scalars['String']>;
  token1_gt?: Maybe<Scalars['String']>;
  token1_lt?: Maybe<Scalars['String']>;
  token1_gte?: Maybe<Scalars['String']>;
  token1_lte?: Maybe<Scalars['String']>;
  token1_in?: Maybe<Array<Scalars['String']>>;
  token1_not_in?: Maybe<Array<Scalars['String']>>;
  token1_contains?: Maybe<Scalars['String']>;
  token1_contains_nocase?: Maybe<Scalars['String']>;
  token1_not_contains?: Maybe<Scalars['String']>;
  token1_not_contains_nocase?: Maybe<Scalars['String']>;
  token1_starts_with?: Maybe<Scalars['String']>;
  token1_starts_with_nocase?: Maybe<Scalars['String']>;
  token1_not_starts_with?: Maybe<Scalars['String']>;
  token1_not_starts_with_nocase?: Maybe<Scalars['String']>;
  token1_ends_with?: Maybe<Scalars['String']>;
  token1_ends_with_nocase?: Maybe<Scalars['String']>;
  token1_not_ends_with?: Maybe<Scalars['String']>;
  token1_not_ends_with_nocase?: Maybe<Scalars['String']>;
  token1_?: Maybe<Token_Filter>;
  owner?: Maybe<Scalars['Bytes']>;
  owner_not?: Maybe<Scalars['Bytes']>;
  owner_in?: Maybe<Array<Scalars['Bytes']>>;
  owner_not_in?: Maybe<Array<Scalars['Bytes']>>;
  owner_contains?: Maybe<Scalars['Bytes']>;
  owner_not_contains?: Maybe<Scalars['Bytes']>;
  sender?: Maybe<Scalars['Bytes']>;
  sender_not?: Maybe<Scalars['Bytes']>;
  sender_in?: Maybe<Array<Scalars['Bytes']>>;
  sender_not_in?: Maybe<Array<Scalars['Bytes']>>;
  sender_contains?: Maybe<Scalars['Bytes']>;
  sender_not_contains?: Maybe<Scalars['Bytes']>;
  origin?: Maybe<Scalars['Bytes']>;
  origin_not?: Maybe<Scalars['Bytes']>;
  origin_in?: Maybe<Array<Scalars['Bytes']>>;
  origin_not_in?: Maybe<Array<Scalars['Bytes']>>;
  origin_contains?: Maybe<Scalars['Bytes']>;
  origin_not_contains?: Maybe<Scalars['Bytes']>;
  amount?: Maybe<Scalars['BigInt']>;
  amount_not?: Maybe<Scalars['BigInt']>;
  amount_gt?: Maybe<Scalars['BigInt']>;
  amount_lt?: Maybe<Scalars['BigInt']>;
  amount_gte?: Maybe<Scalars['BigInt']>;
  amount_lte?: Maybe<Scalars['BigInt']>;
  amount_in?: Maybe<Array<Scalars['BigInt']>>;
  amount_not_in?: Maybe<Array<Scalars['BigInt']>>;
  amount0?: Maybe<Scalars['BigDecimal']>;
  amount0_not?: Maybe<Scalars['BigDecimal']>;
  amount0_gt?: Maybe<Scalars['BigDecimal']>;
  amount0_lt?: Maybe<Scalars['BigDecimal']>;
  amount0_gte?: Maybe<Scalars['BigDecimal']>;
  amount0_lte?: Maybe<Scalars['BigDecimal']>;
  amount0_in?: Maybe<Array<Scalars['BigDecimal']>>;
  amount0_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  amount1?: Maybe<Scalars['BigDecimal']>;
  amount1_not?: Maybe<Scalars['BigDecimal']>;
  amount1_gt?: Maybe<Scalars['BigDecimal']>;
  amount1_lt?: Maybe<Scalars['BigDecimal']>;
  amount1_gte?: Maybe<Scalars['BigDecimal']>;
  amount1_lte?: Maybe<Scalars['BigDecimal']>;
  amount1_in?: Maybe<Array<Scalars['BigDecimal']>>;
  amount1_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  amountUSD?: Maybe<Scalars['BigDecimal']>;
  amountUSD_not?: Maybe<Scalars['BigDecimal']>;
  amountUSD_gt?: Maybe<Scalars['BigDecimal']>;
  amountUSD_lt?: Maybe<Scalars['BigDecimal']>;
  amountUSD_gte?: Maybe<Scalars['BigDecimal']>;
  amountUSD_lte?: Maybe<Scalars['BigDecimal']>;
  amountUSD_in?: Maybe<Array<Scalars['BigDecimal']>>;
  amountUSD_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  tickLower?: Maybe<Scalars['BigInt']>;
  tickLower_not?: Maybe<Scalars['BigInt']>;
  tickLower_gt?: Maybe<Scalars['BigInt']>;
  tickLower_lt?: Maybe<Scalars['BigInt']>;
  tickLower_gte?: Maybe<Scalars['BigInt']>;
  tickLower_lte?: Maybe<Scalars['BigInt']>;
  tickLower_in?: Maybe<Array<Scalars['BigInt']>>;
  tickLower_not_in?: Maybe<Array<Scalars['BigInt']>>;
  tickUpper?: Maybe<Scalars['BigInt']>;
  tickUpper_not?: Maybe<Scalars['BigInt']>;
  tickUpper_gt?: Maybe<Scalars['BigInt']>;
  tickUpper_lt?: Maybe<Scalars['BigInt']>;
  tickUpper_gte?: Maybe<Scalars['BigInt']>;
  tickUpper_lte?: Maybe<Scalars['BigInt']>;
  tickUpper_in?: Maybe<Array<Scalars['BigInt']>>;
  tickUpper_not_in?: Maybe<Array<Scalars['BigInt']>>;
  logIndex?: Maybe<Scalars['BigInt']>;
  logIndex_not?: Maybe<Scalars['BigInt']>;
  logIndex_gt?: Maybe<Scalars['BigInt']>;
  logIndex_lt?: Maybe<Scalars['BigInt']>;
  logIndex_gte?: Maybe<Scalars['BigInt']>;
  logIndex_lte?: Maybe<Scalars['BigInt']>;
  logIndex_in?: Maybe<Array<Scalars['BigInt']>>;
  logIndex_not_in?: Maybe<Array<Scalars['BigInt']>>;
  /** Filter for the block changed event. */
  _change_block?: Maybe<BlockChangedFilter>;
};

export enum Mint_OrderBy {
  Id = 'id',
  Transaction = 'transaction',
  Timestamp = 'timestamp',
  Pool = 'pool',
  Token0 = 'token0',
  Token1 = 'token1',
  Owner = 'owner',
  Sender = 'sender',
  Origin = 'origin',
  Amount = 'amount',
  Amount0 = 'amount0',
  Amount1 = 'amount1',
  AmountUsd = 'amountUSD',
  TickLower = 'tickLower',
  TickUpper = 'tickUpper',
  LogIndex = 'logIndex'
}

/** Defines the order direction, either ascending or descending */
export enum OrderDirection {
  Asc = 'asc',
  Desc = 'desc'
}

export type Pool = {
  __typename?: 'Pool';
  id: Scalars['ID'];
  createdAtTimestamp: Scalars['BigInt'];
  createdAtBlockNumber: Scalars['BigInt'];
  token0: Token;
  token1: Token;
  feeTier: Scalars['BigInt'];
  liquidity: Scalars['BigInt'];
  sqrtPrice: Scalars['BigInt'];
  feeGrowthGlobal0X128: Scalars['BigInt'];
  feeGrowthGlobal1X128: Scalars['BigInt'];
  token0Price: Scalars['BigDecimal'];
  token1Price: Scalars['BigDecimal'];
  tick?: Maybe<Scalars['BigInt']>;
  observationIndex: Scalars['BigInt'];
  volumeToken0: Scalars['BigDecimal'];
  volumeToken1: Scalars['BigDecimal'];
  volumeUSD: Scalars['BigDecimal'];
  untrackedVolumeUSD: Scalars['BigDecimal'];
  feesUSD: Scalars['BigDecimal'];
  txCount: Scalars['BigInt'];
  collectedFeesToken0: Scalars['BigDecimal'];
  collectedFeesToken1: Scalars['BigDecimal'];
  collectedFeesUSD: Scalars['BigDecimal'];
  totalValueLockedToken0: Scalars['BigDecimal'];
  totalValueLockedToken1: Scalars['BigDecimal'];
  totalValueLockedETH: Scalars['BigDecimal'];
  totalValueLockedUSD: Scalars['BigDecimal'];
  totalValueLockedUSDUntracked: Scalars['BigDecimal'];
  liquidityProviderCount: Scalars['BigInt'];
  poolHourData: Array<PoolHourData>;
  poolDayData: Array<PoolDayData>;
  mints: Array<Mint>;
  burns: Array<Burn>;
  swaps: Array<Swap>;
  collects: Array<Collect>;
  ticks: Array<Tick>;
};


export type PoolPoolHourDataArgs = {
  skip?: Maybe<Scalars['Int']>;
  first?: Maybe<Scalars['Int']>;
  orderBy?: Maybe<PoolHourData_OrderBy>;
  orderDirection?: Maybe<OrderDirection>;
  where?: Maybe<PoolHourData_Filter>;
};


export type PoolPoolDayDataArgs = {
  skip?: Maybe<Scalars['Int']>;
  first?: Maybe<Scalars['Int']>;
  orderBy?: Maybe<PoolDayData_OrderBy>;
  orderDirection?: Maybe<OrderDirection>;
  where?: Maybe<PoolDayData_Filter>;
};


export type PoolMintsArgs = {
  skip?: Maybe<Scalars['Int']>;
  first?: Maybe<Scalars['Int']>;
  orderBy?: Maybe<Mint_OrderBy>;
  orderDirection?: Maybe<OrderDirection>;
  where?: Maybe<Mint_Filter>;
};


export type PoolBurnsArgs = {
  skip?: Maybe<Scalars['Int']>;
  first?: Maybe<Scalars['Int']>;
  orderBy?: Maybe<Burn_OrderBy>;
  orderDirection?: Maybe<OrderDirection>;
  where?: Maybe<Burn_Filter>;
};


export type PoolSwapsArgs = {
  skip?: Maybe<Scalars['Int']>;
  first?: Maybe<Scalars['Int']>;
  orderBy?: Maybe<Swap_OrderBy>;
  orderDirection?: Maybe<OrderDirection>;
  where?: Maybe<Swap_Filter>;
};


export type PoolCollectsArgs = {
  skip?: Maybe<Scalars['Int']>;
  first?: Maybe<Scalars['Int']>;
  orderBy?: Maybe<Collect_OrderBy>;
  orderDirection?: Maybe<OrderDirection>;
  where?: Maybe<Collect_Filter>;
};


export type PoolTicksArgs = {
  skip?: Maybe<Scalars['Int']>;
  first?: Maybe<Scalars['Int']>;
  orderBy?: Maybe<Tick_OrderBy>;
  orderDirection?: Maybe<OrderDirection>;
  where?: Maybe<Tick_Filter>;
};

export type PoolDayData = {
  __typename?: 'PoolDayData';
  id: Scalars['ID'];
  date: Scalars['Int'];
  pool: Pool;
  liquidity: Scalars['BigInt'];
  sqrtPrice: Scalars['BigInt'];
  token0Price: Scalars['BigDecimal'];
  token1Price: Scalars['BigDecimal'];
  tick?: Maybe<Scalars['BigInt']>;
  feeGrowthGlobal0X128: Scalars['BigInt'];
  feeGrowthGlobal1X128: Scalars['BigInt'];
  tvlUSD: Scalars['BigDecimal'];
  volumeToken0: Scalars['BigDecimal'];
  volumeToken1: Scalars['BigDecimal'];
  volumeUSD: Scalars['BigDecimal'];
  feesUSD: Scalars['BigDecimal'];
  txCount: Scalars['BigInt'];
  open: Scalars['BigDecimal'];
  high: Scalars['BigDecimal'];
  low: Scalars['BigDecimal'];
  close: Scalars['BigDecimal'];
};

export type PoolDayData_Filter = {
  id?: Maybe<Scalars['ID']>;
  id_not?: Maybe<Scalars['ID']>;
  id_gt?: Maybe<Scalars['ID']>;
  id_lt?: Maybe<Scalars['ID']>;
  id_gte?: Maybe<Scalars['ID']>;
  id_lte?: Maybe<Scalars['ID']>;
  id_in?: Maybe<Array<Scalars['ID']>>;
  id_not_in?: Maybe<Array<Scalars['ID']>>;
  date?: Maybe<Scalars['Int']>;
  date_not?: Maybe<Scalars['Int']>;
  date_gt?: Maybe<Scalars['Int']>;
  date_lt?: Maybe<Scalars['Int']>;
  date_gte?: Maybe<Scalars['Int']>;
  date_lte?: Maybe<Scalars['Int']>;
  date_in?: Maybe<Array<Scalars['Int']>>;
  date_not_in?: Maybe<Array<Scalars['Int']>>;
  pool?: Maybe<Scalars['String']>;
  pool_not?: Maybe<Scalars['String']>;
  pool_gt?: Maybe<Scalars['String']>;
  pool_lt?: Maybe<Scalars['String']>;
  pool_gte?: Maybe<Scalars['String']>;
  pool_lte?: Maybe<Scalars['String']>;
  pool_in?: Maybe<Array<Scalars['String']>>;
  pool_not_in?: Maybe<Array<Scalars['String']>>;
  pool_contains?: Maybe<Scalars['String']>;
  pool_contains_nocase?: Maybe<Scalars['String']>;
  pool_not_contains?: Maybe<Scalars['String']>;
  pool_not_contains_nocase?: Maybe<Scalars['String']>;
  pool_starts_with?: Maybe<Scalars['String']>;
  pool_starts_with_nocase?: Maybe<Scalars['String']>;
  pool_not_starts_with?: Maybe<Scalars['String']>;
  pool_not_starts_with_nocase?: Maybe<Scalars['String']>;
  pool_ends_with?: Maybe<Scalars['String']>;
  pool_ends_with_nocase?: Maybe<Scalars['String']>;
  pool_not_ends_with?: Maybe<Scalars['String']>;
  pool_not_ends_with_nocase?: Maybe<Scalars['String']>;
  pool_?: Maybe<Pool_Filter>;
  liquidity?: Maybe<Scalars['BigInt']>;
  liquidity_not?: Maybe<Scalars['BigInt']>;
  liquidity_gt?: Maybe<Scalars['BigInt']>;
  liquidity_lt?: Maybe<Scalars['BigInt']>;
  liquidity_gte?: Maybe<Scalars['BigInt']>;
  liquidity_lte?: Maybe<Scalars['BigInt']>;
  liquidity_in?: Maybe<Array<Scalars['BigInt']>>;
  liquidity_not_in?: Maybe<Array<Scalars['BigInt']>>;
  sqrtPrice?: Maybe<Scalars['BigInt']>;
  sqrtPrice_not?: Maybe<Scalars['BigInt']>;
  sqrtPrice_gt?: Maybe<Scalars['BigInt']>;
  sqrtPrice_lt?: Maybe<Scalars['BigInt']>;
  sqrtPrice_gte?: Maybe<Scalars['BigInt']>;
  sqrtPrice_lte?: Maybe<Scalars['BigInt']>;
  sqrtPrice_in?: Maybe<Array<Scalars['BigInt']>>;
  sqrtPrice_not_in?: Maybe<Array<Scalars['BigInt']>>;
  token0Price?: Maybe<Scalars['BigDecimal']>;
  token0Price_not?: Maybe<Scalars['BigDecimal']>;
  token0Price_gt?: Maybe<Scalars['BigDecimal']>;
  token0Price_lt?: Maybe<Scalars['BigDecimal']>;
  token0Price_gte?: Maybe<Scalars['BigDecimal']>;
  token0Price_lte?: Maybe<Scalars['BigDecimal']>;
  token0Price_in?: Maybe<Array<Scalars['BigDecimal']>>;
  token0Price_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  token1Price?: Maybe<Scalars['BigDecimal']>;
  token1Price_not?: Maybe<Scalars['BigDecimal']>;
  token1Price_gt?: Maybe<Scalars['BigDecimal']>;
  token1Price_lt?: Maybe<Scalars['BigDecimal']>;
  token1Price_gte?: Maybe<Scalars['BigDecimal']>;
  token1Price_lte?: Maybe<Scalars['BigDecimal']>;
  token1Price_in?: Maybe<Array<Scalars['BigDecimal']>>;
  token1Price_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  tick?: Maybe<Scalars['BigInt']>;
  tick_not?: Maybe<Scalars['BigInt']>;
  tick_gt?: Maybe<Scalars['BigInt']>;
  tick_lt?: Maybe<Scalars['BigInt']>;
  tick_gte?: Maybe<Scalars['BigInt']>;
  tick_lte?: Maybe<Scalars['BigInt']>;
  tick_in?: Maybe<Array<Scalars['BigInt']>>;
  tick_not_in?: Maybe<Array<Scalars['BigInt']>>;
  feeGrowthGlobal0X128?: Maybe<Scalars['BigInt']>;
  feeGrowthGlobal0X128_not?: Maybe<Scalars['BigInt']>;
  feeGrowthGlobal0X128_gt?: Maybe<Scalars['BigInt']>;
  feeGrowthGlobal0X128_lt?: Maybe<Scalars['BigInt']>;
  feeGrowthGlobal0X128_gte?: Maybe<Scalars['BigInt']>;
  feeGrowthGlobal0X128_lte?: Maybe<Scalars['BigInt']>;
  feeGrowthGlobal0X128_in?: Maybe<Array<Scalars['BigInt']>>;
  feeGrowthGlobal0X128_not_in?: Maybe<Array<Scalars['BigInt']>>;
  feeGrowthGlobal1X128?: Maybe<Scalars['BigInt']>;
  feeGrowthGlobal1X128_not?: Maybe<Scalars['BigInt']>;
  feeGrowthGlobal1X128_gt?: Maybe<Scalars['BigInt']>;
  feeGrowthGlobal1X128_lt?: Maybe<Scalars['BigInt']>;
  feeGrowthGlobal1X128_gte?: Maybe<Scalars['BigInt']>;
  feeGrowthGlobal1X128_lte?: Maybe<Scalars['BigInt']>;
  feeGrowthGlobal1X128_in?: Maybe<Array<Scalars['BigInt']>>;
  feeGrowthGlobal1X128_not_in?: Maybe<Array<Scalars['BigInt']>>;
  tvlUSD?: Maybe<Scalars['BigDecimal']>;
  tvlUSD_not?: Maybe<Scalars['BigDecimal']>;
  tvlUSD_gt?: Maybe<Scalars['BigDecimal']>;
  tvlUSD_lt?: Maybe<Scalars['BigDecimal']>;
  tvlUSD_gte?: Maybe<Scalars['BigDecimal']>;
  tvlUSD_lte?: Maybe<Scalars['BigDecimal']>;
  tvlUSD_in?: Maybe<Array<Scalars['BigDecimal']>>;
  tvlUSD_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  volumeToken0?: Maybe<Scalars['BigDecimal']>;
  volumeToken0_not?: Maybe<Scalars['BigDecimal']>;
  volumeToken0_gt?: Maybe<Scalars['BigDecimal']>;
  volumeToken0_lt?: Maybe<Scalars['BigDecimal']>;
  volumeToken0_gte?: Maybe<Scalars['BigDecimal']>;
  volumeToken0_lte?: Maybe<Scalars['BigDecimal']>;
  volumeToken0_in?: Maybe<Array<Scalars['BigDecimal']>>;
  volumeToken0_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  volumeToken1?: Maybe<Scalars['BigDecimal']>;
  volumeToken1_not?: Maybe<Scalars['BigDecimal']>;
  volumeToken1_gt?: Maybe<Scalars['BigDecimal']>;
  volumeToken1_lt?: Maybe<Scalars['BigDecimal']>;
  volumeToken1_gte?: Maybe<Scalars['BigDecimal']>;
  volumeToken1_lte?: Maybe<Scalars['BigDecimal']>;
  volumeToken1_in?: Maybe<Array<Scalars['BigDecimal']>>;
  volumeToken1_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  volumeUSD?: Maybe<Scalars['BigDecimal']>;
  volumeUSD_not?: Maybe<Scalars['BigDecimal']>;
  volumeUSD_gt?: Maybe<Scalars['BigDecimal']>;
  volumeUSD_lt?: Maybe<Scalars['BigDecimal']>;
  volumeUSD_gte?: Maybe<Scalars['BigDecimal']>;
  volumeUSD_lte?: Maybe<Scalars['BigDecimal']>;
  volumeUSD_in?: Maybe<Array<Scalars['BigDecimal']>>;
  volumeUSD_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  feesUSD?: Maybe<Scalars['BigDecimal']>;
  feesUSD_not?: Maybe<Scalars['BigDecimal']>;
  feesUSD_gt?: Maybe<Scalars['BigDecimal']>;
  feesUSD_lt?: Maybe<Scalars['BigDecimal']>;
  feesUSD_gte?: Maybe<Scalars['BigDecimal']>;
  feesUSD_lte?: Maybe<Scalars['BigDecimal']>;
  feesUSD_in?: Maybe<Array<Scalars['BigDecimal']>>;
  feesUSD_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  txCount?: Maybe<Scalars['BigInt']>;
  txCount_not?: Maybe<Scalars['BigInt']>;
  txCount_gt?: Maybe<Scalars['BigInt']>;
  txCount_lt?: Maybe<Scalars['BigInt']>;
  txCount_gte?: Maybe<Scalars['BigInt']>;
  txCount_lte?: Maybe<Scalars['BigInt']>;
  txCount_in?: Maybe<Array<Scalars['BigInt']>>;
  txCount_not_in?: Maybe<Array<Scalars['BigInt']>>;
  open?: Maybe<Scalars['BigDecimal']>;
  open_not?: Maybe<Scalars['BigDecimal']>;
  open_gt?: Maybe<Scalars['BigDecimal']>;
  open_lt?: Maybe<Scalars['BigDecimal']>;
  open_gte?: Maybe<Scalars['BigDecimal']>;
  open_lte?: Maybe<Scalars['BigDecimal']>;
  open_in?: Maybe<Array<Scalars['BigDecimal']>>;
  open_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  high?: Maybe<Scalars['BigDecimal']>;
  high_not?: Maybe<Scalars['BigDecimal']>;
  high_gt?: Maybe<Scalars['BigDecimal']>;
  high_lt?: Maybe<Scalars['BigDecimal']>;
  high_gte?: Maybe<Scalars['BigDecimal']>;
  high_lte?: Maybe<Scalars['BigDecimal']>;
  high_in?: Maybe<Array<Scalars['BigDecimal']>>;
  high_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  low?: Maybe<Scalars['BigDecimal']>;
  low_not?: Maybe<Scalars['BigDecimal']>;
  low_gt?: Maybe<Scalars['BigDecimal']>;
  low_lt?: Maybe<Scalars['BigDecimal']>;
  low_gte?: Maybe<Scalars['BigDecimal']>;
  low_lte?: Maybe<Scalars['BigDecimal']>;
  low_in?: Maybe<Array<Scalars['BigDecimal']>>;
  low_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  close?: Maybe<Scalars['BigDecimal']>;
  close_not?: Maybe<Scalars['BigDecimal']>;
  close_gt?: Maybe<Scalars['BigDecimal']>;
  close_lt?: Maybe<Scalars['BigDecimal']>;
  close_gte?: Maybe<Scalars['BigDecimal']>;
  close_lte?: Maybe<Scalars['BigDecimal']>;
  close_in?: Maybe<Array<Scalars['BigDecimal']>>;
  close_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  /** Filter for the block changed event. */
  _change_block?: Maybe<BlockChangedFilter>;
};

export enum PoolDayData_OrderBy {
  Id = 'id',
  Date = 'date',
  Pool = 'pool',
  Liquidity = 'liquidity',
  SqrtPrice = 'sqrtPrice',
  Token0Price = 'token0Price',
  Token1Price = 'token1Price',
  Tick = 'tick',
  FeeGrowthGlobal0X128 = 'feeGrowthGlobal0X128',
  FeeGrowthGlobal1X128 = 'feeGrowthGlobal1X128',
  TvlUsd = 'tvlUSD',
  VolumeToken0 = 'volumeToken0',
  VolumeToken1 = 'volumeToken1',
  VolumeUsd = 'volumeUSD',
  FeesUsd = 'feesUSD',
  TxCount = 'txCount',
  Open = 'open',
  High = 'high',
  Low = 'low',
  Close = 'close'
}

export type PoolHourData = {
  __typename?: 'PoolHourData';
  id: Scalars['ID'];
  periodStartUnix: Scalars['Int'];
  pool: Pool;
  liquidity: Scalars['BigInt'];
  sqrtPrice: Scalars['BigInt'];
  token0Price: Scalars['BigDecimal'];
  token1Price: Scalars['BigDecimal'];
  tick?: Maybe<Scalars['BigInt']>;
  feeGrowthGlobal0X128: Scalars['BigInt'];
  feeGrowthGlobal1X128: Scalars['BigInt'];
  tvlUSD: Scalars['BigDecimal'];
  volumeToken0: Scalars['BigDecimal'];
  volumeToken1: Scalars['BigDecimal'];
  volumeUSD: Scalars['BigDecimal'];
  feesUSD: Scalars['BigDecimal'];
  txCount: Scalars['BigInt'];
  open: Scalars['BigDecimal'];
  high: Scalars['BigDecimal'];
  low: Scalars['BigDecimal'];
  close: Scalars['BigDecimal'];
};

export type PoolHourData_Filter = {
  id?: Maybe<Scalars['ID']>;
  id_not?: Maybe<Scalars['ID']>;
  id_gt?: Maybe<Scalars['ID']>;
  id_lt?: Maybe<Scalars['ID']>;
  id_gte?: Maybe<Scalars['ID']>;
  id_lte?: Maybe<Scalars['ID']>;
  id_in?: Maybe<Array<Scalars['ID']>>;
  id_not_in?: Maybe<Array<Scalars['ID']>>;
  periodStartUnix?: Maybe<Scalars['Int']>;
  periodStartUnix_not?: Maybe<Scalars['Int']>;
  periodStartUnix_gt?: Maybe<Scalars['Int']>;
  periodStartUnix_lt?: Maybe<Scalars['Int']>;
  periodStartUnix_gte?: Maybe<Scalars['Int']>;
  periodStartUnix_lte?: Maybe<Scalars['Int']>;
  periodStartUnix_in?: Maybe<Array<Scalars['Int']>>;
  periodStartUnix_not_in?: Maybe<Array<Scalars['Int']>>;
  pool?: Maybe<Scalars['String']>;
  pool_not?: Maybe<Scalars['String']>;
  pool_gt?: Maybe<Scalars['String']>;
  pool_lt?: Maybe<Scalars['String']>;
  pool_gte?: Maybe<Scalars['String']>;
  pool_lte?: Maybe<Scalars['String']>;
  pool_in?: Maybe<Array<Scalars['String']>>;
  pool_not_in?: Maybe<Array<Scalars['String']>>;
  pool_contains?: Maybe<Scalars['String']>;
  pool_contains_nocase?: Maybe<Scalars['String']>;
  pool_not_contains?: Maybe<Scalars['String']>;
  pool_not_contains_nocase?: Maybe<Scalars['String']>;
  pool_starts_with?: Maybe<Scalars['String']>;
  pool_starts_with_nocase?: Maybe<Scalars['String']>;
  pool_not_starts_with?: Maybe<Scalars['String']>;
  pool_not_starts_with_nocase?: Maybe<Scalars['String']>;
  pool_ends_with?: Maybe<Scalars['String']>;
  pool_ends_with_nocase?: Maybe<Scalars['String']>;
  pool_not_ends_with?: Maybe<Scalars['String']>;
  pool_not_ends_with_nocase?: Maybe<Scalars['String']>;
  pool_?: Maybe<Pool_Filter>;
  liquidity?: Maybe<Scalars['BigInt']>;
  liquidity_not?: Maybe<Scalars['BigInt']>;
  liquidity_gt?: Maybe<Scalars['BigInt']>;
  liquidity_lt?: Maybe<Scalars['BigInt']>;
  liquidity_gte?: Maybe<Scalars['BigInt']>;
  liquidity_lte?: Maybe<Scalars['BigInt']>;
  liquidity_in?: Maybe<Array<Scalars['BigInt']>>;
  liquidity_not_in?: Maybe<Array<Scalars['BigInt']>>;
  sqrtPrice?: Maybe<Scalars['BigInt']>;
  sqrtPrice_not?: Maybe<Scalars['BigInt']>;
  sqrtPrice_gt?: Maybe<Scalars['BigInt']>;
  sqrtPrice_lt?: Maybe<Scalars['BigInt']>;
  sqrtPrice_gte?: Maybe<Scalars['BigInt']>;
  sqrtPrice_lte?: Maybe<Scalars['BigInt']>;
  sqrtPrice_in?: Maybe<Array<Scalars['BigInt']>>;
  sqrtPrice_not_in?: Maybe<Array<Scalars['BigInt']>>;
  token0Price?: Maybe<Scalars['BigDecimal']>;
  token0Price_not?: Maybe<Scalars['BigDecimal']>;
  token0Price_gt?: Maybe<Scalars['BigDecimal']>;
  token0Price_lt?: Maybe<Scalars['BigDecimal']>;
  token0Price_gte?: Maybe<Scalars['BigDecimal']>;
  token0Price_lte?: Maybe<Scalars['BigDecimal']>;
  token0Price_in?: Maybe<Array<Scalars['BigDecimal']>>;
  token0Price_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  token1Price?: Maybe<Scalars['BigDecimal']>;
  token1Price_not?: Maybe<Scalars['BigDecimal']>;
  token1Price_gt?: Maybe<Scalars['BigDecimal']>;
  token1Price_lt?: Maybe<Scalars['BigDecimal']>;
  token1Price_gte?: Maybe<Scalars['BigDecimal']>;
  token1Price_lte?: Maybe<Scalars['BigDecimal']>;
  token1Price_in?: Maybe<Array<Scalars['BigDecimal']>>;
  token1Price_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  tick?: Maybe<Scalars['BigInt']>;
  tick_not?: Maybe<Scalars['BigInt']>;
  tick_gt?: Maybe<Scalars['BigInt']>;
  tick_lt?: Maybe<Scalars['BigInt']>;
  tick_gte?: Maybe<Scalars['BigInt']>;
  tick_lte?: Maybe<Scalars['BigInt']>;
  tick_in?: Maybe<Array<Scalars['BigInt']>>;
  tick_not_in?: Maybe<Array<Scalars['BigInt']>>;
  feeGrowthGlobal0X128?: Maybe<Scalars['BigInt']>;
  feeGrowthGlobal0X128_not?: Maybe<Scalars['BigInt']>;
  feeGrowthGlobal0X128_gt?: Maybe<Scalars['BigInt']>;
  feeGrowthGlobal0X128_lt?: Maybe<Scalars['BigInt']>;
  feeGrowthGlobal0X128_gte?: Maybe<Scalars['BigInt']>;
  feeGrowthGlobal0X128_lte?: Maybe<Scalars['BigInt']>;
  feeGrowthGlobal0X128_in?: Maybe<Array<Scalars['BigInt']>>;
  feeGrowthGlobal0X128_not_in?: Maybe<Array<Scalars['BigInt']>>;
  feeGrowthGlobal1X128?: Maybe<Scalars['BigInt']>;
  feeGrowthGlobal1X128_not?: Maybe<Scalars['BigInt']>;
  feeGrowthGlobal1X128_gt?: Maybe<Scalars['BigInt']>;
  feeGrowthGlobal1X128_lt?: Maybe<Scalars['BigInt']>;
  feeGrowthGlobal1X128_gte?: Maybe<Scalars['BigInt']>;
  feeGrowthGlobal1X128_lte?: Maybe<Scalars['BigInt']>;
  feeGrowthGlobal1X128_in?: Maybe<Array<Scalars['BigInt']>>;
  feeGrowthGlobal1X128_not_in?: Maybe<Array<Scalars['BigInt']>>;
  tvlUSD?: Maybe<Scalars['BigDecimal']>;
  tvlUSD_not?: Maybe<Scalars['BigDecimal']>;
  tvlUSD_gt?: Maybe<Scalars['BigDecimal']>;
  tvlUSD_lt?: Maybe<Scalars['BigDecimal']>;
  tvlUSD_gte?: Maybe<Scalars['BigDecimal']>;
  tvlUSD_lte?: Maybe<Scalars['BigDecimal']>;
  tvlUSD_in?: Maybe<Array<Scalars['BigDecimal']>>;
  tvlUSD_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  volumeToken0?: Maybe<Scalars['BigDecimal']>;
  volumeToken0_not?: Maybe<Scalars['BigDecimal']>;
  volumeToken0_gt?: Maybe<Scalars['BigDecimal']>;
  volumeToken0_lt?: Maybe<Scalars['BigDecimal']>;
  volumeToken0_gte?: Maybe<Scalars['BigDecimal']>;
  volumeToken0_lte?: Maybe<Scalars['BigDecimal']>;
  volumeToken0_in?: Maybe<Array<Scalars['BigDecimal']>>;
  volumeToken0_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  volumeToken1?: Maybe<Scalars['BigDecimal']>;
  volumeToken1_not?: Maybe<Scalars['BigDecimal']>;
  volumeToken1_gt?: Maybe<Scalars['BigDecimal']>;
  volumeToken1_lt?: Maybe<Scalars['BigDecimal']>;
  volumeToken1_gte?: Maybe<Scalars['BigDecimal']>;
  volumeToken1_lte?: Maybe<Scalars['BigDecimal']>;
  volumeToken1_in?: Maybe<Array<Scalars['BigDecimal']>>;
  volumeToken1_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  volumeUSD?: Maybe<Scalars['BigDecimal']>;
  volumeUSD_not?: Maybe<Scalars['BigDecimal']>;
  volumeUSD_gt?: Maybe<Scalars['BigDecimal']>;
  volumeUSD_lt?: Maybe<Scalars['BigDecimal']>;
  volumeUSD_gte?: Maybe<Scalars['BigDecimal']>;
  volumeUSD_lte?: Maybe<Scalars['BigDecimal']>;
  volumeUSD_in?: Maybe<Array<Scalars['BigDecimal']>>;
  volumeUSD_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  feesUSD?: Maybe<Scalars['BigDecimal']>;
  feesUSD_not?: Maybe<Scalars['BigDecimal']>;
  feesUSD_gt?: Maybe<Scalars['BigDecimal']>;
  feesUSD_lt?: Maybe<Scalars['BigDecimal']>;
  feesUSD_gte?: Maybe<Scalars['BigDecimal']>;
  feesUSD_lte?: Maybe<Scalars['BigDecimal']>;
  feesUSD_in?: Maybe<Array<Scalars['BigDecimal']>>;
  feesUSD_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  txCount?: Maybe<Scalars['BigInt']>;
  txCount_not?: Maybe<Scalars['BigInt']>;
  txCount_gt?: Maybe<Scalars['BigInt']>;
  txCount_lt?: Maybe<Scalars['BigInt']>;
  txCount_gte?: Maybe<Scalars['BigInt']>;
  txCount_lte?: Maybe<Scalars['BigInt']>;
  txCount_in?: Maybe<Array<Scalars['BigInt']>>;
  txCount_not_in?: Maybe<Array<Scalars['BigInt']>>;
  open?: Maybe<Scalars['BigDecimal']>;
  open_not?: Maybe<Scalars['BigDecimal']>;
  open_gt?: Maybe<Scalars['BigDecimal']>;
  open_lt?: Maybe<Scalars['BigDecimal']>;
  open_gte?: Maybe<Scalars['BigDecimal']>;
  open_lte?: Maybe<Scalars['BigDecimal']>;
  open_in?: Maybe<Array<Scalars['BigDecimal']>>;
  open_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  high?: Maybe<Scalars['BigDecimal']>;
  high_not?: Maybe<Scalars['BigDecimal']>;
  high_gt?: Maybe<Scalars['BigDecimal']>;
  high_lt?: Maybe<Scalars['BigDecimal']>;
  high_gte?: Maybe<Scalars['BigDecimal']>;
  high_lte?: Maybe<Scalars['BigDecimal']>;
  high_in?: Maybe<Array<Scalars['BigDecimal']>>;
  high_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  low?: Maybe<Scalars['BigDecimal']>;
  low_not?: Maybe<Scalars['BigDecimal']>;
  low_gt?: Maybe<Scalars['BigDecimal']>;
  low_lt?: Maybe<Scalars['BigDecimal']>;
  low_gte?: Maybe<Scalars['BigDecimal']>;
  low_lte?: Maybe<Scalars['BigDecimal']>;
  low_in?: Maybe<Array<Scalars['BigDecimal']>>;
  low_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  close?: Maybe<Scalars['BigDecimal']>;
  close_not?: Maybe<Scalars['BigDecimal']>;
  close_gt?: Maybe<Scalars['BigDecimal']>;
  close_lt?: Maybe<Scalars['BigDecimal']>;
  close_gte?: Maybe<Scalars['BigDecimal']>;
  close_lte?: Maybe<Scalars['BigDecimal']>;
  close_in?: Maybe<Array<Scalars['BigDecimal']>>;
  close_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  /** Filter for the block changed event. */
  _change_block?: Maybe<BlockChangedFilter>;
};

export enum PoolHourData_OrderBy {
  Id = 'id',
  PeriodStartUnix = 'periodStartUnix',
  Pool = 'pool',
  Liquidity = 'liquidity',
  SqrtPrice = 'sqrtPrice',
  Token0Price = 'token0Price',
  Token1Price = 'token1Price',
  Tick = 'tick',
  FeeGrowthGlobal0X128 = 'feeGrowthGlobal0X128',
  FeeGrowthGlobal1X128 = 'feeGrowthGlobal1X128',
  TvlUsd = 'tvlUSD',
  VolumeToken0 = 'volumeToken0',
  VolumeToken1 = 'volumeToken1',
  VolumeUsd = 'volumeUSD',
  FeesUsd = 'feesUSD',
  TxCount = 'txCount',
  Open = 'open',
  High = 'high',
  Low = 'low',
  Close = 'close'
}

export type Pool_Filter = {
  id?: Maybe<Scalars['ID']>;
  id_not?: Maybe<Scalars['ID']>;
  id_gt?: Maybe<Scalars['ID']>;
  id_lt?: Maybe<Scalars['ID']>;
  id_gte?: Maybe<Scalars['ID']>;
  id_lte?: Maybe<Scalars['ID']>;
  id_in?: Maybe<Array<Scalars['ID']>>;
  id_not_in?: Maybe<Array<Scalars['ID']>>;
  createdAtTimestamp?: Maybe<Scalars['BigInt']>;
  createdAtTimestamp_not?: Maybe<Scalars['BigInt']>;
  createdAtTimestamp_gt?: Maybe<Scalars['BigInt']>;
  createdAtTimestamp_lt?: Maybe<Scalars['BigInt']>;
  createdAtTimestamp_gte?: Maybe<Scalars['BigInt']>;
  createdAtTimestamp_lte?: Maybe<Scalars['BigInt']>;
  createdAtTimestamp_in?: Maybe<Array<Scalars['BigInt']>>;
  createdAtTimestamp_not_in?: Maybe<Array<Scalars['BigInt']>>;
  createdAtBlockNumber?: Maybe<Scalars['BigInt']>;
  createdAtBlockNumber_not?: Maybe<Scalars['BigInt']>;
  createdAtBlockNumber_gt?: Maybe<Scalars['BigInt']>;
  createdAtBlockNumber_lt?: Maybe<Scalars['BigInt']>;
  createdAtBlockNumber_gte?: Maybe<Scalars['BigInt']>;
  createdAtBlockNumber_lte?: Maybe<Scalars['BigInt']>;
  createdAtBlockNumber_in?: Maybe<Array<Scalars['BigInt']>>;
  createdAtBlockNumber_not_in?: Maybe<Array<Scalars['BigInt']>>;
  token0?: Maybe<Scalars['String']>;
  token0_not?: Maybe<Scalars['String']>;
  token0_gt?: Maybe<Scalars['String']>;
  token0_lt?: Maybe<Scalars['String']>;
  token0_gte?: Maybe<Scalars['String']>;
  token0_lte?: Maybe<Scalars['String']>;
  token0_in?: Maybe<Array<Scalars['String']>>;
  token0_not_in?: Maybe<Array<Scalars['String']>>;
  token0_contains?: Maybe<Scalars['String']>;
  token0_contains_nocase?: Maybe<Scalars['String']>;
  token0_not_contains?: Maybe<Scalars['String']>;
  token0_not_contains_nocase?: Maybe<Scalars['String']>;
  token0_starts_with?: Maybe<Scalars['String']>;
  token0_starts_with_nocase?: Maybe<Scalars['String']>;
  token0_not_starts_with?: Maybe<Scalars['String']>;
  token0_not_starts_with_nocase?: Maybe<Scalars['String']>;
  token0_ends_with?: Maybe<Scalars['String']>;
  token0_ends_with_nocase?: Maybe<Scalars['String']>;
  token0_not_ends_with?: Maybe<Scalars['String']>;
  token0_not_ends_with_nocase?: Maybe<Scalars['String']>;
  token0_?: Maybe<Token_Filter>;
  token1?: Maybe<Scalars['String']>;
  token1_not?: Maybe<Scalars['String']>;
  token1_gt?: Maybe<Scalars['String']>;
  token1_lt?: Maybe<Scalars['String']>;
  token1_gte?: Maybe<Scalars['String']>;
  token1_lte?: Maybe<Scalars['String']>;
  token1_in?: Maybe<Array<Scalars['String']>>;
  token1_not_in?: Maybe<Array<Scalars['String']>>;
  token1_contains?: Maybe<Scalars['String']>;
  token1_contains_nocase?: Maybe<Scalars['String']>;
  token1_not_contains?: Maybe<Scalars['String']>;
  token1_not_contains_nocase?: Maybe<Scalars['String']>;
  token1_starts_with?: Maybe<Scalars['String']>;
  token1_starts_with_nocase?: Maybe<Scalars['String']>;
  token1_not_starts_with?: Maybe<Scalars['String']>;
  token1_not_starts_with_nocase?: Maybe<Scalars['String']>;
  token1_ends_with?: Maybe<Scalars['String']>;
  token1_ends_with_nocase?: Maybe<Scalars['String']>;
  token1_not_ends_with?: Maybe<Scalars['String']>;
  token1_not_ends_with_nocase?: Maybe<Scalars['String']>;
  token1_?: Maybe<Token_Filter>;
  feeTier?: Maybe<Scalars['BigInt']>;
  feeTier_not?: Maybe<Scalars['BigInt']>;
  feeTier_gt?: Maybe<Scalars['BigInt']>;
  feeTier_lt?: Maybe<Scalars['BigInt']>;
  feeTier_gte?: Maybe<Scalars['BigInt']>;
  feeTier_lte?: Maybe<Scalars['BigInt']>;
  feeTier_in?: Maybe<Array<Scalars['BigInt']>>;
  feeTier_not_in?: Maybe<Array<Scalars['BigInt']>>;
  liquidity?: Maybe<Scalars['BigInt']>;
  liquidity_not?: Maybe<Scalars['BigInt']>;
  liquidity_gt?: Maybe<Scalars['BigInt']>;
  liquidity_lt?: Maybe<Scalars['BigInt']>;
  liquidity_gte?: Maybe<Scalars['BigInt']>;
  liquidity_lte?: Maybe<Scalars['BigInt']>;
  liquidity_in?: Maybe<Array<Scalars['BigInt']>>;
  liquidity_not_in?: Maybe<Array<Scalars['BigInt']>>;
  sqrtPrice?: Maybe<Scalars['BigInt']>;
  sqrtPrice_not?: Maybe<Scalars['BigInt']>;
  sqrtPrice_gt?: Maybe<Scalars['BigInt']>;
  sqrtPrice_lt?: Maybe<Scalars['BigInt']>;
  sqrtPrice_gte?: Maybe<Scalars['BigInt']>;
  sqrtPrice_lte?: Maybe<Scalars['BigInt']>;
  sqrtPrice_in?: Maybe<Array<Scalars['BigInt']>>;
  sqrtPrice_not_in?: Maybe<Array<Scalars['BigInt']>>;
  feeGrowthGlobal0X128?: Maybe<Scalars['BigInt']>;
  feeGrowthGlobal0X128_not?: Maybe<Scalars['BigInt']>;
  feeGrowthGlobal0X128_gt?: Maybe<Scalars['BigInt']>;
  feeGrowthGlobal0X128_lt?: Maybe<Scalars['BigInt']>;
  feeGrowthGlobal0X128_gte?: Maybe<Scalars['BigInt']>;
  feeGrowthGlobal0X128_lte?: Maybe<Scalars['BigInt']>;
  feeGrowthGlobal0X128_in?: Maybe<Array<Scalars['BigInt']>>;
  feeGrowthGlobal0X128_not_in?: Maybe<Array<Scalars['BigInt']>>;
  feeGrowthGlobal1X128?: Maybe<Scalars['BigInt']>;
  feeGrowthGlobal1X128_not?: Maybe<Scalars['BigInt']>;
  feeGrowthGlobal1X128_gt?: Maybe<Scalars['BigInt']>;
  feeGrowthGlobal1X128_lt?: Maybe<Scalars['BigInt']>;
  feeGrowthGlobal1X128_gte?: Maybe<Scalars['BigInt']>;
  feeGrowthGlobal1X128_lte?: Maybe<Scalars['BigInt']>;
  feeGrowthGlobal1X128_in?: Maybe<Array<Scalars['BigInt']>>;
  feeGrowthGlobal1X128_not_in?: Maybe<Array<Scalars['BigInt']>>;
  token0Price?: Maybe<Scalars['BigDecimal']>;
  token0Price_not?: Maybe<Scalars['BigDecimal']>;
  token0Price_gt?: Maybe<Scalars['BigDecimal']>;
  token0Price_lt?: Maybe<Scalars['BigDecimal']>;
  token0Price_gte?: Maybe<Scalars['BigDecimal']>;
  token0Price_lte?: Maybe<Scalars['BigDecimal']>;
  token0Price_in?: Maybe<Array<Scalars['BigDecimal']>>;
  token0Price_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  token1Price?: Maybe<Scalars['BigDecimal']>;
  token1Price_not?: Maybe<Scalars['BigDecimal']>;
  token1Price_gt?: Maybe<Scalars['BigDecimal']>;
  token1Price_lt?: Maybe<Scalars['BigDecimal']>;
  token1Price_gte?: Maybe<Scalars['BigDecimal']>;
  token1Price_lte?: Maybe<Scalars['BigDecimal']>;
  token1Price_in?: Maybe<Array<Scalars['BigDecimal']>>;
  token1Price_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  tick?: Maybe<Scalars['BigInt']>;
  tick_not?: Maybe<Scalars['BigInt']>;
  tick_gt?: Maybe<Scalars['BigInt']>;
  tick_lt?: Maybe<Scalars['BigInt']>;
  tick_gte?: Maybe<Scalars['BigInt']>;
  tick_lte?: Maybe<Scalars['BigInt']>;
  tick_in?: Maybe<Array<Scalars['BigInt']>>;
  tick_not_in?: Maybe<Array<Scalars['BigInt']>>;
  observationIndex?: Maybe<Scalars['BigInt']>;
  observationIndex_not?: Maybe<Scalars['BigInt']>;
  observationIndex_gt?: Maybe<Scalars['BigInt']>;
  observationIndex_lt?: Maybe<Scalars['BigInt']>;
  observationIndex_gte?: Maybe<Scalars['BigInt']>;
  observationIndex_lte?: Maybe<Scalars['BigInt']>;
  observationIndex_in?: Maybe<Array<Scalars['BigInt']>>;
  observationIndex_not_in?: Maybe<Array<Scalars['BigInt']>>;
  volumeToken0?: Maybe<Scalars['BigDecimal']>;
  volumeToken0_not?: Maybe<Scalars['BigDecimal']>;
  volumeToken0_gt?: Maybe<Scalars['BigDecimal']>;
  volumeToken0_lt?: Maybe<Scalars['BigDecimal']>;
  volumeToken0_gte?: Maybe<Scalars['BigDecimal']>;
  volumeToken0_lte?: Maybe<Scalars['BigDecimal']>;
  volumeToken0_in?: Maybe<Array<Scalars['BigDecimal']>>;
  volumeToken0_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  volumeToken1?: Maybe<Scalars['BigDecimal']>;
  volumeToken1_not?: Maybe<Scalars['BigDecimal']>;
  volumeToken1_gt?: Maybe<Scalars['BigDecimal']>;
  volumeToken1_lt?: Maybe<Scalars['BigDecimal']>;
  volumeToken1_gte?: Maybe<Scalars['BigDecimal']>;
  volumeToken1_lte?: Maybe<Scalars['BigDecimal']>;
  volumeToken1_in?: Maybe<Array<Scalars['BigDecimal']>>;
  volumeToken1_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  volumeUSD?: Maybe<Scalars['BigDecimal']>;
  volumeUSD_not?: Maybe<Scalars['BigDecimal']>;
  volumeUSD_gt?: Maybe<Scalars['BigDecimal']>;
  volumeUSD_lt?: Maybe<Scalars['BigDecimal']>;
  volumeUSD_gte?: Maybe<Scalars['BigDecimal']>;
  volumeUSD_lte?: Maybe<Scalars['BigDecimal']>;
  volumeUSD_in?: Maybe<Array<Scalars['BigDecimal']>>;
  volumeUSD_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  untrackedVolumeUSD?: Maybe<Scalars['BigDecimal']>;
  untrackedVolumeUSD_not?: Maybe<Scalars['BigDecimal']>;
  untrackedVolumeUSD_gt?: Maybe<Scalars['BigDecimal']>;
  untrackedVolumeUSD_lt?: Maybe<Scalars['BigDecimal']>;
  untrackedVolumeUSD_gte?: Maybe<Scalars['BigDecimal']>;
  untrackedVolumeUSD_lte?: Maybe<Scalars['BigDecimal']>;
  untrackedVolumeUSD_in?: Maybe<Array<Scalars['BigDecimal']>>;
  untrackedVolumeUSD_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  feesUSD?: Maybe<Scalars['BigDecimal']>;
  feesUSD_not?: Maybe<Scalars['BigDecimal']>;
  feesUSD_gt?: Maybe<Scalars['BigDecimal']>;
  feesUSD_lt?: Maybe<Scalars['BigDecimal']>;
  feesUSD_gte?: Maybe<Scalars['BigDecimal']>;
  feesUSD_lte?: Maybe<Scalars['BigDecimal']>;
  feesUSD_in?: Maybe<Array<Scalars['BigDecimal']>>;
  feesUSD_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  txCount?: Maybe<Scalars['BigInt']>;
  txCount_not?: Maybe<Scalars['BigInt']>;
  txCount_gt?: Maybe<Scalars['BigInt']>;
  txCount_lt?: Maybe<Scalars['BigInt']>;
  txCount_gte?: Maybe<Scalars['BigInt']>;
  txCount_lte?: Maybe<Scalars['BigInt']>;
  txCount_in?: Maybe<Array<Scalars['BigInt']>>;
  txCount_not_in?: Maybe<Array<Scalars['BigInt']>>;
  collectedFeesToken0?: Maybe<Scalars['BigDecimal']>;
  collectedFeesToken0_not?: Maybe<Scalars['BigDecimal']>;
  collectedFeesToken0_gt?: Maybe<Scalars['BigDecimal']>;
  collectedFeesToken0_lt?: Maybe<Scalars['BigDecimal']>;
  collectedFeesToken0_gte?: Maybe<Scalars['BigDecimal']>;
  collectedFeesToken0_lte?: Maybe<Scalars['BigDecimal']>;
  collectedFeesToken0_in?: Maybe<Array<Scalars['BigDecimal']>>;
  collectedFeesToken0_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  collectedFeesToken1?: Maybe<Scalars['BigDecimal']>;
  collectedFeesToken1_not?: Maybe<Scalars['BigDecimal']>;
  collectedFeesToken1_gt?: Maybe<Scalars['BigDecimal']>;
  collectedFeesToken1_lt?: Maybe<Scalars['BigDecimal']>;
  collectedFeesToken1_gte?: Maybe<Scalars['BigDecimal']>;
  collectedFeesToken1_lte?: Maybe<Scalars['BigDecimal']>;
  collectedFeesToken1_in?: Maybe<Array<Scalars['BigDecimal']>>;
  collectedFeesToken1_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  collectedFeesUSD?: Maybe<Scalars['BigDecimal']>;
  collectedFeesUSD_not?: Maybe<Scalars['BigDecimal']>;
  collectedFeesUSD_gt?: Maybe<Scalars['BigDecimal']>;
  collectedFeesUSD_lt?: Maybe<Scalars['BigDecimal']>;
  collectedFeesUSD_gte?: Maybe<Scalars['BigDecimal']>;
  collectedFeesUSD_lte?: Maybe<Scalars['BigDecimal']>;
  collectedFeesUSD_in?: Maybe<Array<Scalars['BigDecimal']>>;
  collectedFeesUSD_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  totalValueLockedToken0?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedToken0_not?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedToken0_gt?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedToken0_lt?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedToken0_gte?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedToken0_lte?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedToken0_in?: Maybe<Array<Scalars['BigDecimal']>>;
  totalValueLockedToken0_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  totalValueLockedToken1?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedToken1_not?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedToken1_gt?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedToken1_lt?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedToken1_gte?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedToken1_lte?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedToken1_in?: Maybe<Array<Scalars['BigDecimal']>>;
  totalValueLockedToken1_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  totalValueLockedETH?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedETH_not?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedETH_gt?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedETH_lt?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedETH_gte?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedETH_lte?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedETH_in?: Maybe<Array<Scalars['BigDecimal']>>;
  totalValueLockedETH_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  totalValueLockedUSD?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedUSD_not?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedUSD_gt?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedUSD_lt?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedUSD_gte?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedUSD_lte?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedUSD_in?: Maybe<Array<Scalars['BigDecimal']>>;
  totalValueLockedUSD_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  totalValueLockedUSDUntracked?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedUSDUntracked_not?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedUSDUntracked_gt?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedUSDUntracked_lt?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedUSDUntracked_gte?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedUSDUntracked_lte?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedUSDUntracked_in?: Maybe<Array<Scalars['BigDecimal']>>;
  totalValueLockedUSDUntracked_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  liquidityProviderCount?: Maybe<Scalars['BigInt']>;
  liquidityProviderCount_not?: Maybe<Scalars['BigInt']>;
  liquidityProviderCount_gt?: Maybe<Scalars['BigInt']>;
  liquidityProviderCount_lt?: Maybe<Scalars['BigInt']>;
  liquidityProviderCount_gte?: Maybe<Scalars['BigInt']>;
  liquidityProviderCount_lte?: Maybe<Scalars['BigInt']>;
  liquidityProviderCount_in?: Maybe<Array<Scalars['BigInt']>>;
  liquidityProviderCount_not_in?: Maybe<Array<Scalars['BigInt']>>;
  poolHourData_?: Maybe<PoolHourData_Filter>;
  poolDayData_?: Maybe<PoolDayData_Filter>;
  mints_?: Maybe<Mint_Filter>;
  burns_?: Maybe<Burn_Filter>;
  swaps_?: Maybe<Swap_Filter>;
  collects_?: Maybe<Collect_Filter>;
  ticks_?: Maybe<Tick_Filter>;
  /** Filter for the block changed event. */
  _change_block?: Maybe<BlockChangedFilter>;
};

export enum Pool_OrderBy {
  Id = 'id',
  CreatedAtTimestamp = 'createdAtTimestamp',
  CreatedAtBlockNumber = 'createdAtBlockNumber',
  Token0 = 'token0',
  Token1 = 'token1',
  FeeTier = 'feeTier',
  Liquidity = 'liquidity',
  SqrtPrice = 'sqrtPrice',
  FeeGrowthGlobal0X128 = 'feeGrowthGlobal0X128',
  FeeGrowthGlobal1X128 = 'feeGrowthGlobal1X128',
  Token0Price = 'token0Price',
  Token1Price = 'token1Price',
  Tick = 'tick',
  ObservationIndex = 'observationIndex',
  VolumeToken0 = 'volumeToken0',
  VolumeToken1 = 'volumeToken1',
  VolumeUsd = 'volumeUSD',
  UntrackedVolumeUsd = 'untrackedVolumeUSD',
  FeesUsd = 'feesUSD',
  TxCount = 'txCount',
  CollectedFeesToken0 = 'collectedFeesToken0',
  CollectedFeesToken1 = 'collectedFeesToken1',
  CollectedFeesUsd = 'collectedFeesUSD',
  TotalValueLockedToken0 = 'totalValueLockedToken0',
  TotalValueLockedToken1 = 'totalValueLockedToken1',
  TotalValueLockedEth = 'totalValueLockedETH',
  TotalValueLockedUsd = 'totalValueLockedUSD',
  TotalValueLockedUsdUntracked = 'totalValueLockedUSDUntracked',
  LiquidityProviderCount = 'liquidityProviderCount',
  PoolHourData = 'poolHourData',
  PoolDayData = 'poolDayData',
  Mints = 'mints',
  Burns = 'burns',
  Swaps = 'swaps',
  Collects = 'collects',
  Ticks = 'ticks'
}

export type Position = {
  __typename?: 'Position';
  id: Scalars['ID'];
  owner: Scalars['Bytes'];
  pool: Pool;
  token0: Token;
  token1: Token;
  tickLower: Tick;
  tickUpper: Tick;
  liquidity: Scalars['BigInt'];
  depositedToken0: Scalars['BigDecimal'];
  depositedToken1: Scalars['BigDecimal'];
  withdrawnToken0: Scalars['BigDecimal'];
  withdrawnToken1: Scalars['BigDecimal'];
  collectedFeesToken0: Scalars['BigDecimal'];
  collectedFeesToken1: Scalars['BigDecimal'];
  transaction: Transaction;
  feeGrowthInside0LastX128: Scalars['BigInt'];
  feeGrowthInside1LastX128: Scalars['BigInt'];
};

export type PositionSnapshot = {
  __typename?: 'PositionSnapshot';
  id: Scalars['ID'];
  owner: Scalars['Bytes'];
  pool: Pool;
  position: Position;
  blockNumber: Scalars['BigInt'];
  timestamp: Scalars['BigInt'];
  liquidity: Scalars['BigInt'];
  depositedToken0: Scalars['BigDecimal'];
  depositedToken1: Scalars['BigDecimal'];
  withdrawnToken0: Scalars['BigDecimal'];
  withdrawnToken1: Scalars['BigDecimal'];
  collectedFeesToken0: Scalars['BigDecimal'];
  collectedFeesToken1: Scalars['BigDecimal'];
  transaction: Transaction;
  feeGrowthInside0LastX128: Scalars['BigInt'];
  feeGrowthInside1LastX128: Scalars['BigInt'];
};

export type PositionSnapshot_Filter = {
  id?: Maybe<Scalars['ID']>;
  id_not?: Maybe<Scalars['ID']>;
  id_gt?: Maybe<Scalars['ID']>;
  id_lt?: Maybe<Scalars['ID']>;
  id_gte?: Maybe<Scalars['ID']>;
  id_lte?: Maybe<Scalars['ID']>;
  id_in?: Maybe<Array<Scalars['ID']>>;
  id_not_in?: Maybe<Array<Scalars['ID']>>;
  owner?: Maybe<Scalars['Bytes']>;
  owner_not?: Maybe<Scalars['Bytes']>;
  owner_in?: Maybe<Array<Scalars['Bytes']>>;
  owner_not_in?: Maybe<Array<Scalars['Bytes']>>;
  owner_contains?: Maybe<Scalars['Bytes']>;
  owner_not_contains?: Maybe<Scalars['Bytes']>;
  pool?: Maybe<Scalars['String']>;
  pool_not?: Maybe<Scalars['String']>;
  pool_gt?: Maybe<Scalars['String']>;
  pool_lt?: Maybe<Scalars['String']>;
  pool_gte?: Maybe<Scalars['String']>;
  pool_lte?: Maybe<Scalars['String']>;
  pool_in?: Maybe<Array<Scalars['String']>>;
  pool_not_in?: Maybe<Array<Scalars['String']>>;
  pool_contains?: Maybe<Scalars['String']>;
  pool_contains_nocase?: Maybe<Scalars['String']>;
  pool_not_contains?: Maybe<Scalars['String']>;
  pool_not_contains_nocase?: Maybe<Scalars['String']>;
  pool_starts_with?: Maybe<Scalars['String']>;
  pool_starts_with_nocase?: Maybe<Scalars['String']>;
  pool_not_starts_with?: Maybe<Scalars['String']>;
  pool_not_starts_with_nocase?: Maybe<Scalars['String']>;
  pool_ends_with?: Maybe<Scalars['String']>;
  pool_ends_with_nocase?: Maybe<Scalars['String']>;
  pool_not_ends_with?: Maybe<Scalars['String']>;
  pool_not_ends_with_nocase?: Maybe<Scalars['String']>;
  pool_?: Maybe<Pool_Filter>;
  position?: Maybe<Scalars['String']>;
  position_not?: Maybe<Scalars['String']>;
  position_gt?: Maybe<Scalars['String']>;
  position_lt?: Maybe<Scalars['String']>;
  position_gte?: Maybe<Scalars['String']>;
  position_lte?: Maybe<Scalars['String']>;
  position_in?: Maybe<Array<Scalars['String']>>;
  position_not_in?: Maybe<Array<Scalars['String']>>;
  position_contains?: Maybe<Scalars['String']>;
  position_contains_nocase?: Maybe<Scalars['String']>;
  position_not_contains?: Maybe<Scalars['String']>;
  position_not_contains_nocase?: Maybe<Scalars['String']>;
  position_starts_with?: Maybe<Scalars['String']>;
  position_starts_with_nocase?: Maybe<Scalars['String']>;
  position_not_starts_with?: Maybe<Scalars['String']>;
  position_not_starts_with_nocase?: Maybe<Scalars['String']>;
  position_ends_with?: Maybe<Scalars['String']>;
  position_ends_with_nocase?: Maybe<Scalars['String']>;
  position_not_ends_with?: Maybe<Scalars['String']>;
  position_not_ends_with_nocase?: Maybe<Scalars['String']>;
  position_?: Maybe<Position_Filter>;
  blockNumber?: Maybe<Scalars['BigInt']>;
  blockNumber_not?: Maybe<Scalars['BigInt']>;
  blockNumber_gt?: Maybe<Scalars['BigInt']>;
  blockNumber_lt?: Maybe<Scalars['BigInt']>;
  blockNumber_gte?: Maybe<Scalars['BigInt']>;
  blockNumber_lte?: Maybe<Scalars['BigInt']>;
  blockNumber_in?: Maybe<Array<Scalars['BigInt']>>;
  blockNumber_not_in?: Maybe<Array<Scalars['BigInt']>>;
  timestamp?: Maybe<Scalars['BigInt']>;
  timestamp_not?: Maybe<Scalars['BigInt']>;
  timestamp_gt?: Maybe<Scalars['BigInt']>;
  timestamp_lt?: Maybe<Scalars['BigInt']>;
  timestamp_gte?: Maybe<Scalars['BigInt']>;
  timestamp_lte?: Maybe<Scalars['BigInt']>;
  timestamp_in?: Maybe<Array<Scalars['BigInt']>>;
  timestamp_not_in?: Maybe<Array<Scalars['BigInt']>>;
  liquidity?: Maybe<Scalars['BigInt']>;
  liquidity_not?: Maybe<Scalars['BigInt']>;
  liquidity_gt?: Maybe<Scalars['BigInt']>;
  liquidity_lt?: Maybe<Scalars['BigInt']>;
  liquidity_gte?: Maybe<Scalars['BigInt']>;
  liquidity_lte?: Maybe<Scalars['BigInt']>;
  liquidity_in?: Maybe<Array<Scalars['BigInt']>>;
  liquidity_not_in?: Maybe<Array<Scalars['BigInt']>>;
  depositedToken0?: Maybe<Scalars['BigDecimal']>;
  depositedToken0_not?: Maybe<Scalars['BigDecimal']>;
  depositedToken0_gt?: Maybe<Scalars['BigDecimal']>;
  depositedToken0_lt?: Maybe<Scalars['BigDecimal']>;
  depositedToken0_gte?: Maybe<Scalars['BigDecimal']>;
  depositedToken0_lte?: Maybe<Scalars['BigDecimal']>;
  depositedToken0_in?: Maybe<Array<Scalars['BigDecimal']>>;
  depositedToken0_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  depositedToken1?: Maybe<Scalars['BigDecimal']>;
  depositedToken1_not?: Maybe<Scalars['BigDecimal']>;
  depositedToken1_gt?: Maybe<Scalars['BigDecimal']>;
  depositedToken1_lt?: Maybe<Scalars['BigDecimal']>;
  depositedToken1_gte?: Maybe<Scalars['BigDecimal']>;
  depositedToken1_lte?: Maybe<Scalars['BigDecimal']>;
  depositedToken1_in?: Maybe<Array<Scalars['BigDecimal']>>;
  depositedToken1_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  withdrawnToken0?: Maybe<Scalars['BigDecimal']>;
  withdrawnToken0_not?: Maybe<Scalars['BigDecimal']>;
  withdrawnToken0_gt?: Maybe<Scalars['BigDecimal']>;
  withdrawnToken0_lt?: Maybe<Scalars['BigDecimal']>;
  withdrawnToken0_gte?: Maybe<Scalars['BigDecimal']>;
  withdrawnToken0_lte?: Maybe<Scalars['BigDecimal']>;
  withdrawnToken0_in?: Maybe<Array<Scalars['BigDecimal']>>;
  withdrawnToken0_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  withdrawnToken1?: Maybe<Scalars['BigDecimal']>;
  withdrawnToken1_not?: Maybe<Scalars['BigDecimal']>;
  withdrawnToken1_gt?: Maybe<Scalars['BigDecimal']>;
  withdrawnToken1_lt?: Maybe<Scalars['BigDecimal']>;
  withdrawnToken1_gte?: Maybe<Scalars['BigDecimal']>;
  withdrawnToken1_lte?: Maybe<Scalars['BigDecimal']>;
  withdrawnToken1_in?: Maybe<Array<Scalars['BigDecimal']>>;
  withdrawnToken1_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  collectedFeesToken0?: Maybe<Scalars['BigDecimal']>;
  collectedFeesToken0_not?: Maybe<Scalars['BigDecimal']>;
  collectedFeesToken0_gt?: Maybe<Scalars['BigDecimal']>;
  collectedFeesToken0_lt?: Maybe<Scalars['BigDecimal']>;
  collectedFeesToken0_gte?: Maybe<Scalars['BigDecimal']>;
  collectedFeesToken0_lte?: Maybe<Scalars['BigDecimal']>;
  collectedFeesToken0_in?: Maybe<Array<Scalars['BigDecimal']>>;
  collectedFeesToken0_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  collectedFeesToken1?: Maybe<Scalars['BigDecimal']>;
  collectedFeesToken1_not?: Maybe<Scalars['BigDecimal']>;
  collectedFeesToken1_gt?: Maybe<Scalars['BigDecimal']>;
  collectedFeesToken1_lt?: Maybe<Scalars['BigDecimal']>;
  collectedFeesToken1_gte?: Maybe<Scalars['BigDecimal']>;
  collectedFeesToken1_lte?: Maybe<Scalars['BigDecimal']>;
  collectedFeesToken1_in?: Maybe<Array<Scalars['BigDecimal']>>;
  collectedFeesToken1_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  transaction?: Maybe<Scalars['String']>;
  transaction_not?: Maybe<Scalars['String']>;
  transaction_gt?: Maybe<Scalars['String']>;
  transaction_lt?: Maybe<Scalars['String']>;
  transaction_gte?: Maybe<Scalars['String']>;
  transaction_lte?: Maybe<Scalars['String']>;
  transaction_in?: Maybe<Array<Scalars['String']>>;
  transaction_not_in?: Maybe<Array<Scalars['String']>>;
  transaction_contains?: Maybe<Scalars['String']>;
  transaction_contains_nocase?: Maybe<Scalars['String']>;
  transaction_not_contains?: Maybe<Scalars['String']>;
  transaction_not_contains_nocase?: Maybe<Scalars['String']>;
  transaction_starts_with?: Maybe<Scalars['String']>;
  transaction_starts_with_nocase?: Maybe<Scalars['String']>;
  transaction_not_starts_with?: Maybe<Scalars['String']>;
  transaction_not_starts_with_nocase?: Maybe<Scalars['String']>;
  transaction_ends_with?: Maybe<Scalars['String']>;
  transaction_ends_with_nocase?: Maybe<Scalars['String']>;
  transaction_not_ends_with?: Maybe<Scalars['String']>;
  transaction_not_ends_with_nocase?: Maybe<Scalars['String']>;
  transaction_?: Maybe<Transaction_Filter>;
  feeGrowthInside0LastX128?: Maybe<Scalars['BigInt']>;
  feeGrowthInside0LastX128_not?: Maybe<Scalars['BigInt']>;
  feeGrowthInside0LastX128_gt?: Maybe<Scalars['BigInt']>;
  feeGrowthInside0LastX128_lt?: Maybe<Scalars['BigInt']>;
  feeGrowthInside0LastX128_gte?: Maybe<Scalars['BigInt']>;
  feeGrowthInside0LastX128_lte?: Maybe<Scalars['BigInt']>;
  feeGrowthInside0LastX128_in?: Maybe<Array<Scalars['BigInt']>>;
  feeGrowthInside0LastX128_not_in?: Maybe<Array<Scalars['BigInt']>>;
  feeGrowthInside1LastX128?: Maybe<Scalars['BigInt']>;
  feeGrowthInside1LastX128_not?: Maybe<Scalars['BigInt']>;
  feeGrowthInside1LastX128_gt?: Maybe<Scalars['BigInt']>;
  feeGrowthInside1LastX128_lt?: Maybe<Scalars['BigInt']>;
  feeGrowthInside1LastX128_gte?: Maybe<Scalars['BigInt']>;
  feeGrowthInside1LastX128_lte?: Maybe<Scalars['BigInt']>;
  feeGrowthInside1LastX128_in?: Maybe<Array<Scalars['BigInt']>>;
  feeGrowthInside1LastX128_not_in?: Maybe<Array<Scalars['BigInt']>>;
  /** Filter for the block changed event. */
  _change_block?: Maybe<BlockChangedFilter>;
};

export enum PositionSnapshot_OrderBy {
  Id = 'id',
  Owner = 'owner',
  Pool = 'pool',
  Position = 'position',
  BlockNumber = 'blockNumber',
  Timestamp = 'timestamp',
  Liquidity = 'liquidity',
  DepositedToken0 = 'depositedToken0',
  DepositedToken1 = 'depositedToken1',
  WithdrawnToken0 = 'withdrawnToken0',
  WithdrawnToken1 = 'withdrawnToken1',
  CollectedFeesToken0 = 'collectedFeesToken0',
  CollectedFeesToken1 = 'collectedFeesToken1',
  Transaction = 'transaction',
  FeeGrowthInside0LastX128 = 'feeGrowthInside0LastX128',
  FeeGrowthInside1LastX128 = 'feeGrowthInside1LastX128'
}

export type Position_Filter = {
  id?: Maybe<Scalars['ID']>;
  id_not?: Maybe<Scalars['ID']>;
  id_gt?: Maybe<Scalars['ID']>;
  id_lt?: Maybe<Scalars['ID']>;
  id_gte?: Maybe<Scalars['ID']>;
  id_lte?: Maybe<Scalars['ID']>;
  id_in?: Maybe<Array<Scalars['ID']>>;
  id_not_in?: Maybe<Array<Scalars['ID']>>;
  owner?: Maybe<Scalars['Bytes']>;
  owner_not?: Maybe<Scalars['Bytes']>;
  owner_in?: Maybe<Array<Scalars['Bytes']>>;
  owner_not_in?: Maybe<Array<Scalars['Bytes']>>;
  owner_contains?: Maybe<Scalars['Bytes']>;
  owner_not_contains?: Maybe<Scalars['Bytes']>;
  pool?: Maybe<Scalars['String']>;
  pool_not?: Maybe<Scalars['String']>;
  pool_gt?: Maybe<Scalars['String']>;
  pool_lt?: Maybe<Scalars['String']>;
  pool_gte?: Maybe<Scalars['String']>;
  pool_lte?: Maybe<Scalars['String']>;
  pool_in?: Maybe<Array<Scalars['String']>>;
  pool_not_in?: Maybe<Array<Scalars['String']>>;
  pool_contains?: Maybe<Scalars['String']>;
  pool_contains_nocase?: Maybe<Scalars['String']>;
  pool_not_contains?: Maybe<Scalars['String']>;
  pool_not_contains_nocase?: Maybe<Scalars['String']>;
  pool_starts_with?: Maybe<Scalars['String']>;
  pool_starts_with_nocase?: Maybe<Scalars['String']>;
  pool_not_starts_with?: Maybe<Scalars['String']>;
  pool_not_starts_with_nocase?: Maybe<Scalars['String']>;
  pool_ends_with?: Maybe<Scalars['String']>;
  pool_ends_with_nocase?: Maybe<Scalars['String']>;
  pool_not_ends_with?: Maybe<Scalars['String']>;
  pool_not_ends_with_nocase?: Maybe<Scalars['String']>;
  pool_?: Maybe<Pool_Filter>;
  token0?: Maybe<Scalars['String']>;
  token0_not?: Maybe<Scalars['String']>;
  token0_gt?: Maybe<Scalars['String']>;
  token0_lt?: Maybe<Scalars['String']>;
  token0_gte?: Maybe<Scalars['String']>;
  token0_lte?: Maybe<Scalars['String']>;
  token0_in?: Maybe<Array<Scalars['String']>>;
  token0_not_in?: Maybe<Array<Scalars['String']>>;
  token0_contains?: Maybe<Scalars['String']>;
  token0_contains_nocase?: Maybe<Scalars['String']>;
  token0_not_contains?: Maybe<Scalars['String']>;
  token0_not_contains_nocase?: Maybe<Scalars['String']>;
  token0_starts_with?: Maybe<Scalars['String']>;
  token0_starts_with_nocase?: Maybe<Scalars['String']>;
  token0_not_starts_with?: Maybe<Scalars['String']>;
  token0_not_starts_with_nocase?: Maybe<Scalars['String']>;
  token0_ends_with?: Maybe<Scalars['String']>;
  token0_ends_with_nocase?: Maybe<Scalars['String']>;
  token0_not_ends_with?: Maybe<Scalars['String']>;
  token0_not_ends_with_nocase?: Maybe<Scalars['String']>;
  token0_?: Maybe<Token_Filter>;
  token1?: Maybe<Scalars['String']>;
  token1_not?: Maybe<Scalars['String']>;
  token1_gt?: Maybe<Scalars['String']>;
  token1_lt?: Maybe<Scalars['String']>;
  token1_gte?: Maybe<Scalars['String']>;
  token1_lte?: Maybe<Scalars['String']>;
  token1_in?: Maybe<Array<Scalars['String']>>;
  token1_not_in?: Maybe<Array<Scalars['String']>>;
  token1_contains?: Maybe<Scalars['String']>;
  token1_contains_nocase?: Maybe<Scalars['String']>;
  token1_not_contains?: Maybe<Scalars['String']>;
  token1_not_contains_nocase?: Maybe<Scalars['String']>;
  token1_starts_with?: Maybe<Scalars['String']>;
  token1_starts_with_nocase?: Maybe<Scalars['String']>;
  token1_not_starts_with?: Maybe<Scalars['String']>;
  token1_not_starts_with_nocase?: Maybe<Scalars['String']>;
  token1_ends_with?: Maybe<Scalars['String']>;
  token1_ends_with_nocase?: Maybe<Scalars['String']>;
  token1_not_ends_with?: Maybe<Scalars['String']>;
  token1_not_ends_with_nocase?: Maybe<Scalars['String']>;
  token1_?: Maybe<Token_Filter>;
  tickLower?: Maybe<Scalars['String']>;
  tickLower_not?: Maybe<Scalars['String']>;
  tickLower_gt?: Maybe<Scalars['String']>;
  tickLower_lt?: Maybe<Scalars['String']>;
  tickLower_gte?: Maybe<Scalars['String']>;
  tickLower_lte?: Maybe<Scalars['String']>;
  tickLower_in?: Maybe<Array<Scalars['String']>>;
  tickLower_not_in?: Maybe<Array<Scalars['String']>>;
  tickLower_contains?: Maybe<Scalars['String']>;
  tickLower_contains_nocase?: Maybe<Scalars['String']>;
  tickLower_not_contains?: Maybe<Scalars['String']>;
  tickLower_not_contains_nocase?: Maybe<Scalars['String']>;
  tickLower_starts_with?: Maybe<Scalars['String']>;
  tickLower_starts_with_nocase?: Maybe<Scalars['String']>;
  tickLower_not_starts_with?: Maybe<Scalars['String']>;
  tickLower_not_starts_with_nocase?: Maybe<Scalars['String']>;
  tickLower_ends_with?: Maybe<Scalars['String']>;
  tickLower_ends_with_nocase?: Maybe<Scalars['String']>;
  tickLower_not_ends_with?: Maybe<Scalars['String']>;
  tickLower_not_ends_with_nocase?: Maybe<Scalars['String']>;
  tickLower_?: Maybe<Tick_Filter>;
  tickUpper?: Maybe<Scalars['String']>;
  tickUpper_not?: Maybe<Scalars['String']>;
  tickUpper_gt?: Maybe<Scalars['String']>;
  tickUpper_lt?: Maybe<Scalars['String']>;
  tickUpper_gte?: Maybe<Scalars['String']>;
  tickUpper_lte?: Maybe<Scalars['String']>;
  tickUpper_in?: Maybe<Array<Scalars['String']>>;
  tickUpper_not_in?: Maybe<Array<Scalars['String']>>;
  tickUpper_contains?: Maybe<Scalars['String']>;
  tickUpper_contains_nocase?: Maybe<Scalars['String']>;
  tickUpper_not_contains?: Maybe<Scalars['String']>;
  tickUpper_not_contains_nocase?: Maybe<Scalars['String']>;
  tickUpper_starts_with?: Maybe<Scalars['String']>;
  tickUpper_starts_with_nocase?: Maybe<Scalars['String']>;
  tickUpper_not_starts_with?: Maybe<Scalars['String']>;
  tickUpper_not_starts_with_nocase?: Maybe<Scalars['String']>;
  tickUpper_ends_with?: Maybe<Scalars['String']>;
  tickUpper_ends_with_nocase?: Maybe<Scalars['String']>;
  tickUpper_not_ends_with?: Maybe<Scalars['String']>;
  tickUpper_not_ends_with_nocase?: Maybe<Scalars['String']>;
  tickUpper_?: Maybe<Tick_Filter>;
  liquidity?: Maybe<Scalars['BigInt']>;
  liquidity_not?: Maybe<Scalars['BigInt']>;
  liquidity_gt?: Maybe<Scalars['BigInt']>;
  liquidity_lt?: Maybe<Scalars['BigInt']>;
  liquidity_gte?: Maybe<Scalars['BigInt']>;
  liquidity_lte?: Maybe<Scalars['BigInt']>;
  liquidity_in?: Maybe<Array<Scalars['BigInt']>>;
  liquidity_not_in?: Maybe<Array<Scalars['BigInt']>>;
  depositedToken0?: Maybe<Scalars['BigDecimal']>;
  depositedToken0_not?: Maybe<Scalars['BigDecimal']>;
  depositedToken0_gt?: Maybe<Scalars['BigDecimal']>;
  depositedToken0_lt?: Maybe<Scalars['BigDecimal']>;
  depositedToken0_gte?: Maybe<Scalars['BigDecimal']>;
  depositedToken0_lte?: Maybe<Scalars['BigDecimal']>;
  depositedToken0_in?: Maybe<Array<Scalars['BigDecimal']>>;
  depositedToken0_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  depositedToken1?: Maybe<Scalars['BigDecimal']>;
  depositedToken1_not?: Maybe<Scalars['BigDecimal']>;
  depositedToken1_gt?: Maybe<Scalars['BigDecimal']>;
  depositedToken1_lt?: Maybe<Scalars['BigDecimal']>;
  depositedToken1_gte?: Maybe<Scalars['BigDecimal']>;
  depositedToken1_lte?: Maybe<Scalars['BigDecimal']>;
  depositedToken1_in?: Maybe<Array<Scalars['BigDecimal']>>;
  depositedToken1_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  withdrawnToken0?: Maybe<Scalars['BigDecimal']>;
  withdrawnToken0_not?: Maybe<Scalars['BigDecimal']>;
  withdrawnToken0_gt?: Maybe<Scalars['BigDecimal']>;
  withdrawnToken0_lt?: Maybe<Scalars['BigDecimal']>;
  withdrawnToken0_gte?: Maybe<Scalars['BigDecimal']>;
  withdrawnToken0_lte?: Maybe<Scalars['BigDecimal']>;
  withdrawnToken0_in?: Maybe<Array<Scalars['BigDecimal']>>;
  withdrawnToken0_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  withdrawnToken1?: Maybe<Scalars['BigDecimal']>;
  withdrawnToken1_not?: Maybe<Scalars['BigDecimal']>;
  withdrawnToken1_gt?: Maybe<Scalars['BigDecimal']>;
  withdrawnToken1_lt?: Maybe<Scalars['BigDecimal']>;
  withdrawnToken1_gte?: Maybe<Scalars['BigDecimal']>;
  withdrawnToken1_lte?: Maybe<Scalars['BigDecimal']>;
  withdrawnToken1_in?: Maybe<Array<Scalars['BigDecimal']>>;
  withdrawnToken1_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  collectedFeesToken0?: Maybe<Scalars['BigDecimal']>;
  collectedFeesToken0_not?: Maybe<Scalars['BigDecimal']>;
  collectedFeesToken0_gt?: Maybe<Scalars['BigDecimal']>;
  collectedFeesToken0_lt?: Maybe<Scalars['BigDecimal']>;
  collectedFeesToken0_gte?: Maybe<Scalars['BigDecimal']>;
  collectedFeesToken0_lte?: Maybe<Scalars['BigDecimal']>;
  collectedFeesToken0_in?: Maybe<Array<Scalars['BigDecimal']>>;
  collectedFeesToken0_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  collectedFeesToken1?: Maybe<Scalars['BigDecimal']>;
  collectedFeesToken1_not?: Maybe<Scalars['BigDecimal']>;
  collectedFeesToken1_gt?: Maybe<Scalars['BigDecimal']>;
  collectedFeesToken1_lt?: Maybe<Scalars['BigDecimal']>;
  collectedFeesToken1_gte?: Maybe<Scalars['BigDecimal']>;
  collectedFeesToken1_lte?: Maybe<Scalars['BigDecimal']>;
  collectedFeesToken1_in?: Maybe<Array<Scalars['BigDecimal']>>;
  collectedFeesToken1_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  transaction?: Maybe<Scalars['String']>;
  transaction_not?: Maybe<Scalars['String']>;
  transaction_gt?: Maybe<Scalars['String']>;
  transaction_lt?: Maybe<Scalars['String']>;
  transaction_gte?: Maybe<Scalars['String']>;
  transaction_lte?: Maybe<Scalars['String']>;
  transaction_in?: Maybe<Array<Scalars['String']>>;
  transaction_not_in?: Maybe<Array<Scalars['String']>>;
  transaction_contains?: Maybe<Scalars['String']>;
  transaction_contains_nocase?: Maybe<Scalars['String']>;
  transaction_not_contains?: Maybe<Scalars['String']>;
  transaction_not_contains_nocase?: Maybe<Scalars['String']>;
  transaction_starts_with?: Maybe<Scalars['String']>;
  transaction_starts_with_nocase?: Maybe<Scalars['String']>;
  transaction_not_starts_with?: Maybe<Scalars['String']>;
  transaction_not_starts_with_nocase?: Maybe<Scalars['String']>;
  transaction_ends_with?: Maybe<Scalars['String']>;
  transaction_ends_with_nocase?: Maybe<Scalars['String']>;
  transaction_not_ends_with?: Maybe<Scalars['String']>;
  transaction_not_ends_with_nocase?: Maybe<Scalars['String']>;
  transaction_?: Maybe<Transaction_Filter>;
  feeGrowthInside0LastX128?: Maybe<Scalars['BigInt']>;
  feeGrowthInside0LastX128_not?: Maybe<Scalars['BigInt']>;
  feeGrowthInside0LastX128_gt?: Maybe<Scalars['BigInt']>;
  feeGrowthInside0LastX128_lt?: Maybe<Scalars['BigInt']>;
  feeGrowthInside0LastX128_gte?: Maybe<Scalars['BigInt']>;
  feeGrowthInside0LastX128_lte?: Maybe<Scalars['BigInt']>;
  feeGrowthInside0LastX128_in?: Maybe<Array<Scalars['BigInt']>>;
  feeGrowthInside0LastX128_not_in?: Maybe<Array<Scalars['BigInt']>>;
  feeGrowthInside1LastX128?: Maybe<Scalars['BigInt']>;
  feeGrowthInside1LastX128_not?: Maybe<Scalars['BigInt']>;
  feeGrowthInside1LastX128_gt?: Maybe<Scalars['BigInt']>;
  feeGrowthInside1LastX128_lt?: Maybe<Scalars['BigInt']>;
  feeGrowthInside1LastX128_gte?: Maybe<Scalars['BigInt']>;
  feeGrowthInside1LastX128_lte?: Maybe<Scalars['BigInt']>;
  feeGrowthInside1LastX128_in?: Maybe<Array<Scalars['BigInt']>>;
  feeGrowthInside1LastX128_not_in?: Maybe<Array<Scalars['BigInt']>>;
  /** Filter for the block changed event. */
  _change_block?: Maybe<BlockChangedFilter>;
};

export enum Position_OrderBy {
  Id = 'id',
  Owner = 'owner',
  Pool = 'pool',
  Token0 = 'token0',
  Token1 = 'token1',
  TickLower = 'tickLower',
  TickUpper = 'tickUpper',
  Liquidity = 'liquidity',
  DepositedToken0 = 'depositedToken0',
  DepositedToken1 = 'depositedToken1',
  WithdrawnToken0 = 'withdrawnToken0',
  WithdrawnToken1 = 'withdrawnToken1',
  CollectedFeesToken0 = 'collectedFeesToken0',
  CollectedFeesToken1 = 'collectedFeesToken1',
  Transaction = 'transaction',
  FeeGrowthInside0LastX128 = 'feeGrowthInside0LastX128',
  FeeGrowthInside1LastX128 = 'feeGrowthInside1LastX128'
}

export type Query = {
  __typename?: 'Query';
  factory?: Maybe<Factory>;
  factories: Array<Factory>;
  bundle?: Maybe<Bundle>;
  bundles: Array<Bundle>;
  token?: Maybe<Token>;
  tokens: Array<Token>;
  pool?: Maybe<Pool>;
  pools: Array<Pool>;
  tick?: Maybe<Tick>;
  ticks: Array<Tick>;
  position?: Maybe<Position>;
  positions: Array<Position>;
  positionSnapshot?: Maybe<PositionSnapshot>;
  positionSnapshots: Array<PositionSnapshot>;
  transaction?: Maybe<Transaction>;
  transactions: Array<Transaction>;
  mint?: Maybe<Mint>;
  mints: Array<Mint>;
  burn?: Maybe<Burn>;
  burns: Array<Burn>;
  swap?: Maybe<Swap>;
  swaps: Array<Swap>;
  collect?: Maybe<Collect>;
  collects: Array<Collect>;
  flash?: Maybe<Flash>;
  flashes: Array<Flash>;
  uniswapDayData?: Maybe<UniswapDayData>;
  uniswapDayDatas: Array<UniswapDayData>;
  poolDayData?: Maybe<PoolDayData>;
  poolDayDatas: Array<PoolDayData>;
  poolHourData?: Maybe<PoolHourData>;
  poolHourDatas: Array<PoolHourData>;
  tickHourData?: Maybe<TickHourData>;
  tickHourDatas: Array<TickHourData>;
  tickDayData?: Maybe<TickDayData>;
  tickDayDatas: Array<TickDayData>;
  tokenDayData?: Maybe<TokenDayData>;
  tokenDayDatas: Array<TokenDayData>;
  tokenHourData?: Maybe<TokenHourData>;
  tokenHourDatas: Array<TokenHourData>;
  /** Access to subgraph metadata */
  _meta?: Maybe<_Meta_>;
};


export type QueryFactoryArgs = {
  id: Scalars['ID'];
  block?: Maybe<Block_Height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryFactoriesArgs = {
  skip?: Maybe<Scalars['Int']>;
  first?: Maybe<Scalars['Int']>;
  orderBy?: Maybe<Factory_OrderBy>;
  orderDirection?: Maybe<OrderDirection>;
  where?: Maybe<Factory_Filter>;
  block?: Maybe<Block_Height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryBundleArgs = {
  id: Scalars['ID'];
  block?: Maybe<Block_Height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryBundlesArgs = {
  skip?: Maybe<Scalars['Int']>;
  first?: Maybe<Scalars['Int']>;
  orderBy?: Maybe<Bundle_OrderBy>;
  orderDirection?: Maybe<OrderDirection>;
  where?: Maybe<Bundle_Filter>;
  block?: Maybe<Block_Height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryTokenArgs = {
  id: Scalars['ID'];
  block?: Maybe<Block_Height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryTokensArgs = {
  skip?: Maybe<Scalars['Int']>;
  first?: Maybe<Scalars['Int']>;
  orderBy?: Maybe<Token_OrderBy>;
  orderDirection?: Maybe<OrderDirection>;
  where?: Maybe<Token_Filter>;
  block?: Maybe<Block_Height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryPoolArgs = {
  id: Scalars['ID'];
  block?: Maybe<Block_Height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryPoolsArgs = {
  skip?: Maybe<Scalars['Int']>;
  first?: Maybe<Scalars['Int']>;
  orderBy?: Maybe<Pool_OrderBy>;
  orderDirection?: Maybe<OrderDirection>;
  where?: Maybe<Pool_Filter>;
  block?: Maybe<Block_Height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryTickArgs = {
  id: Scalars['ID'];
  block?: Maybe<Block_Height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryTicksArgs = {
  skip?: Maybe<Scalars['Int']>;
  first?: Maybe<Scalars['Int']>;
  orderBy?: Maybe<Tick_OrderBy>;
  orderDirection?: Maybe<OrderDirection>;
  where?: Maybe<Tick_Filter>;
  block?: Maybe<Block_Height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryPositionArgs = {
  id: Scalars['ID'];
  block?: Maybe<Block_Height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryPositionsArgs = {
  skip?: Maybe<Scalars['Int']>;
  first?: Maybe<Scalars['Int']>;
  orderBy?: Maybe<Position_OrderBy>;
  orderDirection?: Maybe<OrderDirection>;
  where?: Maybe<Position_Filter>;
  block?: Maybe<Block_Height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryPositionSnapshotArgs = {
  id: Scalars['ID'];
  block?: Maybe<Block_Height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryPositionSnapshotsArgs = {
  skip?: Maybe<Scalars['Int']>;
  first?: Maybe<Scalars['Int']>;
  orderBy?: Maybe<PositionSnapshot_OrderBy>;
  orderDirection?: Maybe<OrderDirection>;
  where?: Maybe<PositionSnapshot_Filter>;
  block?: Maybe<Block_Height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryTransactionArgs = {
  id: Scalars['ID'];
  block?: Maybe<Block_Height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryTransactionsArgs = {
  skip?: Maybe<Scalars['Int']>;
  first?: Maybe<Scalars['Int']>;
  orderBy?: Maybe<Transaction_OrderBy>;
  orderDirection?: Maybe<OrderDirection>;
  where?: Maybe<Transaction_Filter>;
  block?: Maybe<Block_Height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryMintArgs = {
  id: Scalars['ID'];
  block?: Maybe<Block_Height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryMintsArgs = {
  skip?: Maybe<Scalars['Int']>;
  first?: Maybe<Scalars['Int']>;
  orderBy?: Maybe<Mint_OrderBy>;
  orderDirection?: Maybe<OrderDirection>;
  where?: Maybe<Mint_Filter>;
  block?: Maybe<Block_Height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryBurnArgs = {
  id: Scalars['ID'];
  block?: Maybe<Block_Height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryBurnsArgs = {
  skip?: Maybe<Scalars['Int']>;
  first?: Maybe<Scalars['Int']>;
  orderBy?: Maybe<Burn_OrderBy>;
  orderDirection?: Maybe<OrderDirection>;
  where?: Maybe<Burn_Filter>;
  block?: Maybe<Block_Height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QuerySwapArgs = {
  id: Scalars['ID'];
  block?: Maybe<Block_Height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QuerySwapsArgs = {
  skip?: Maybe<Scalars['Int']>;
  first?: Maybe<Scalars['Int']>;
  orderBy?: Maybe<Swap_OrderBy>;
  orderDirection?: Maybe<OrderDirection>;
  where?: Maybe<Swap_Filter>;
  block?: Maybe<Block_Height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryCollectArgs = {
  id: Scalars['ID'];
  block?: Maybe<Block_Height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryCollectsArgs = {
  skip?: Maybe<Scalars['Int']>;
  first?: Maybe<Scalars['Int']>;
  orderBy?: Maybe<Collect_OrderBy>;
  orderDirection?: Maybe<OrderDirection>;
  where?: Maybe<Collect_Filter>;
  block?: Maybe<Block_Height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryFlashArgs = {
  id: Scalars['ID'];
  block?: Maybe<Block_Height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryFlashesArgs = {
  skip?: Maybe<Scalars['Int']>;
  first?: Maybe<Scalars['Int']>;
  orderBy?: Maybe<Flash_OrderBy>;
  orderDirection?: Maybe<OrderDirection>;
  where?: Maybe<Flash_Filter>;
  block?: Maybe<Block_Height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryUniswapDayDataArgs = {
  id: Scalars['ID'];
  block?: Maybe<Block_Height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryUniswapDayDatasArgs = {
  skip?: Maybe<Scalars['Int']>;
  first?: Maybe<Scalars['Int']>;
  orderBy?: Maybe<UniswapDayData_OrderBy>;
  orderDirection?: Maybe<OrderDirection>;
  where?: Maybe<UniswapDayData_Filter>;
  block?: Maybe<Block_Height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryPoolDayDataArgs = {
  id: Scalars['ID'];
  block?: Maybe<Block_Height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryPoolDayDatasArgs = {
  skip?: Maybe<Scalars['Int']>;
  first?: Maybe<Scalars['Int']>;
  orderBy?: Maybe<PoolDayData_OrderBy>;
  orderDirection?: Maybe<OrderDirection>;
  where?: Maybe<PoolDayData_Filter>;
  block?: Maybe<Block_Height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryPoolHourDataArgs = {
  id: Scalars['ID'];
  block?: Maybe<Block_Height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryPoolHourDatasArgs = {
  skip?: Maybe<Scalars['Int']>;
  first?: Maybe<Scalars['Int']>;
  orderBy?: Maybe<PoolHourData_OrderBy>;
  orderDirection?: Maybe<OrderDirection>;
  where?: Maybe<PoolHourData_Filter>;
  block?: Maybe<Block_Height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryTickHourDataArgs = {
  id: Scalars['ID'];
  block?: Maybe<Block_Height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryTickHourDatasArgs = {
  skip?: Maybe<Scalars['Int']>;
  first?: Maybe<Scalars['Int']>;
  orderBy?: Maybe<TickHourData_OrderBy>;
  orderDirection?: Maybe<OrderDirection>;
  where?: Maybe<TickHourData_Filter>;
  block?: Maybe<Block_Height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryTickDayDataArgs = {
  id: Scalars['ID'];
  block?: Maybe<Block_Height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryTickDayDatasArgs = {
  skip?: Maybe<Scalars['Int']>;
  first?: Maybe<Scalars['Int']>;
  orderBy?: Maybe<TickDayData_OrderBy>;
  orderDirection?: Maybe<OrderDirection>;
  where?: Maybe<TickDayData_Filter>;
  block?: Maybe<Block_Height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryTokenDayDataArgs = {
  id: Scalars['ID'];
  block?: Maybe<Block_Height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryTokenDayDatasArgs = {
  skip?: Maybe<Scalars['Int']>;
  first?: Maybe<Scalars['Int']>;
  orderBy?: Maybe<TokenDayData_OrderBy>;
  orderDirection?: Maybe<OrderDirection>;
  where?: Maybe<TokenDayData_Filter>;
  block?: Maybe<Block_Height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryTokenHourDataArgs = {
  id: Scalars['ID'];
  block?: Maybe<Block_Height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryTokenHourDatasArgs = {
  skip?: Maybe<Scalars['Int']>;
  first?: Maybe<Scalars['Int']>;
  orderBy?: Maybe<TokenHourData_OrderBy>;
  orderDirection?: Maybe<OrderDirection>;
  where?: Maybe<TokenHourData_Filter>;
  block?: Maybe<Block_Height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type Query_MetaArgs = {
  block?: Maybe<Block_Height>;
};

export type Subscription = {
  __typename?: 'Subscription';
  factory?: Maybe<Factory>;
  factories: Array<Factory>;
  bundle?: Maybe<Bundle>;
  bundles: Array<Bundle>;
  token?: Maybe<Token>;
  tokens: Array<Token>;
  pool?: Maybe<Pool>;
  pools: Array<Pool>;
  tick?: Maybe<Tick>;
  ticks: Array<Tick>;
  position?: Maybe<Position>;
  positions: Array<Position>;
  positionSnapshot?: Maybe<PositionSnapshot>;
  positionSnapshots: Array<PositionSnapshot>;
  transaction?: Maybe<Transaction>;
  transactions: Array<Transaction>;
  mint?: Maybe<Mint>;
  mints: Array<Mint>;
  burn?: Maybe<Burn>;
  burns: Array<Burn>;
  swap?: Maybe<Swap>;
  swaps: Array<Swap>;
  collect?: Maybe<Collect>;
  collects: Array<Collect>;
  flash?: Maybe<Flash>;
  flashes: Array<Flash>;
  uniswapDayData?: Maybe<UniswapDayData>;
  uniswapDayDatas: Array<UniswapDayData>;
  poolDayData?: Maybe<PoolDayData>;
  poolDayDatas: Array<PoolDayData>;
  poolHourData?: Maybe<PoolHourData>;
  poolHourDatas: Array<PoolHourData>;
  tickHourData?: Maybe<TickHourData>;
  tickHourDatas: Array<TickHourData>;
  tickDayData?: Maybe<TickDayData>;
  tickDayDatas: Array<TickDayData>;
  tokenDayData?: Maybe<TokenDayData>;
  tokenDayDatas: Array<TokenDayData>;
  tokenHourData?: Maybe<TokenHourData>;
  tokenHourDatas: Array<TokenHourData>;
  /** Access to subgraph metadata */
  _meta?: Maybe<_Meta_>;
};


export type SubscriptionFactoryArgs = {
  id: Scalars['ID'];
  block?: Maybe<Block_Height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionFactoriesArgs = {
  skip?: Maybe<Scalars['Int']>;
  first?: Maybe<Scalars['Int']>;
  orderBy?: Maybe<Factory_OrderBy>;
  orderDirection?: Maybe<OrderDirection>;
  where?: Maybe<Factory_Filter>;
  block?: Maybe<Block_Height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionBundleArgs = {
  id: Scalars['ID'];
  block?: Maybe<Block_Height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionBundlesArgs = {
  skip?: Maybe<Scalars['Int']>;
  first?: Maybe<Scalars['Int']>;
  orderBy?: Maybe<Bundle_OrderBy>;
  orderDirection?: Maybe<OrderDirection>;
  where?: Maybe<Bundle_Filter>;
  block?: Maybe<Block_Height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionTokenArgs = {
  id: Scalars['ID'];
  block?: Maybe<Block_Height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionTokensArgs = {
  skip?: Maybe<Scalars['Int']>;
  first?: Maybe<Scalars['Int']>;
  orderBy?: Maybe<Token_OrderBy>;
  orderDirection?: Maybe<OrderDirection>;
  where?: Maybe<Token_Filter>;
  block?: Maybe<Block_Height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionPoolArgs = {
  id: Scalars['ID'];
  block?: Maybe<Block_Height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionPoolsArgs = {
  skip?: Maybe<Scalars['Int']>;
  first?: Maybe<Scalars['Int']>;
  orderBy?: Maybe<Pool_OrderBy>;
  orderDirection?: Maybe<OrderDirection>;
  where?: Maybe<Pool_Filter>;
  block?: Maybe<Block_Height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionTickArgs = {
  id: Scalars['ID'];
  block?: Maybe<Block_Height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionTicksArgs = {
  skip?: Maybe<Scalars['Int']>;
  first?: Maybe<Scalars['Int']>;
  orderBy?: Maybe<Tick_OrderBy>;
  orderDirection?: Maybe<OrderDirection>;
  where?: Maybe<Tick_Filter>;
  block?: Maybe<Block_Height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionPositionArgs = {
  id: Scalars['ID'];
  block?: Maybe<Block_Height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionPositionsArgs = {
  skip?: Maybe<Scalars['Int']>;
  first?: Maybe<Scalars['Int']>;
  orderBy?: Maybe<Position_OrderBy>;
  orderDirection?: Maybe<OrderDirection>;
  where?: Maybe<Position_Filter>;
  block?: Maybe<Block_Height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionPositionSnapshotArgs = {
  id: Scalars['ID'];
  block?: Maybe<Block_Height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionPositionSnapshotsArgs = {
  skip?: Maybe<Scalars['Int']>;
  first?: Maybe<Scalars['Int']>;
  orderBy?: Maybe<PositionSnapshot_OrderBy>;
  orderDirection?: Maybe<OrderDirection>;
  where?: Maybe<PositionSnapshot_Filter>;
  block?: Maybe<Block_Height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionTransactionArgs = {
  id: Scalars['ID'];
  block?: Maybe<Block_Height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionTransactionsArgs = {
  skip?: Maybe<Scalars['Int']>;
  first?: Maybe<Scalars['Int']>;
  orderBy?: Maybe<Transaction_OrderBy>;
  orderDirection?: Maybe<OrderDirection>;
  where?: Maybe<Transaction_Filter>;
  block?: Maybe<Block_Height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionMintArgs = {
  id: Scalars['ID'];
  block?: Maybe<Block_Height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionMintsArgs = {
  skip?: Maybe<Scalars['Int']>;
  first?: Maybe<Scalars['Int']>;
  orderBy?: Maybe<Mint_OrderBy>;
  orderDirection?: Maybe<OrderDirection>;
  where?: Maybe<Mint_Filter>;
  block?: Maybe<Block_Height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionBurnArgs = {
  id: Scalars['ID'];
  block?: Maybe<Block_Height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionBurnsArgs = {
  skip?: Maybe<Scalars['Int']>;
  first?: Maybe<Scalars['Int']>;
  orderBy?: Maybe<Burn_OrderBy>;
  orderDirection?: Maybe<OrderDirection>;
  where?: Maybe<Burn_Filter>;
  block?: Maybe<Block_Height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionSwapArgs = {
  id: Scalars['ID'];
  block?: Maybe<Block_Height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionSwapsArgs = {
  skip?: Maybe<Scalars['Int']>;
  first?: Maybe<Scalars['Int']>;
  orderBy?: Maybe<Swap_OrderBy>;
  orderDirection?: Maybe<OrderDirection>;
  where?: Maybe<Swap_Filter>;
  block?: Maybe<Block_Height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionCollectArgs = {
  id: Scalars['ID'];
  block?: Maybe<Block_Height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionCollectsArgs = {
  skip?: Maybe<Scalars['Int']>;
  first?: Maybe<Scalars['Int']>;
  orderBy?: Maybe<Collect_OrderBy>;
  orderDirection?: Maybe<OrderDirection>;
  where?: Maybe<Collect_Filter>;
  block?: Maybe<Block_Height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionFlashArgs = {
  id: Scalars['ID'];
  block?: Maybe<Block_Height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionFlashesArgs = {
  skip?: Maybe<Scalars['Int']>;
  first?: Maybe<Scalars['Int']>;
  orderBy?: Maybe<Flash_OrderBy>;
  orderDirection?: Maybe<OrderDirection>;
  where?: Maybe<Flash_Filter>;
  block?: Maybe<Block_Height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionUniswapDayDataArgs = {
  id: Scalars['ID'];
  block?: Maybe<Block_Height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionUniswapDayDatasArgs = {
  skip?: Maybe<Scalars['Int']>;
  first?: Maybe<Scalars['Int']>;
  orderBy?: Maybe<UniswapDayData_OrderBy>;
  orderDirection?: Maybe<OrderDirection>;
  where?: Maybe<UniswapDayData_Filter>;
  block?: Maybe<Block_Height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionPoolDayDataArgs = {
  id: Scalars['ID'];
  block?: Maybe<Block_Height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionPoolDayDatasArgs = {
  skip?: Maybe<Scalars['Int']>;
  first?: Maybe<Scalars['Int']>;
  orderBy?: Maybe<PoolDayData_OrderBy>;
  orderDirection?: Maybe<OrderDirection>;
  where?: Maybe<PoolDayData_Filter>;
  block?: Maybe<Block_Height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionPoolHourDataArgs = {
  id: Scalars['ID'];
  block?: Maybe<Block_Height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionPoolHourDatasArgs = {
  skip?: Maybe<Scalars['Int']>;
  first?: Maybe<Scalars['Int']>;
  orderBy?: Maybe<PoolHourData_OrderBy>;
  orderDirection?: Maybe<OrderDirection>;
  where?: Maybe<PoolHourData_Filter>;
  block?: Maybe<Block_Height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionTickHourDataArgs = {
  id: Scalars['ID'];
  block?: Maybe<Block_Height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionTickHourDatasArgs = {
  skip?: Maybe<Scalars['Int']>;
  first?: Maybe<Scalars['Int']>;
  orderBy?: Maybe<TickHourData_OrderBy>;
  orderDirection?: Maybe<OrderDirection>;
  where?: Maybe<TickHourData_Filter>;
  block?: Maybe<Block_Height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionTickDayDataArgs = {
  id: Scalars['ID'];
  block?: Maybe<Block_Height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionTickDayDatasArgs = {
  skip?: Maybe<Scalars['Int']>;
  first?: Maybe<Scalars['Int']>;
  orderBy?: Maybe<TickDayData_OrderBy>;
  orderDirection?: Maybe<OrderDirection>;
  where?: Maybe<TickDayData_Filter>;
  block?: Maybe<Block_Height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionTokenDayDataArgs = {
  id: Scalars['ID'];
  block?: Maybe<Block_Height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionTokenDayDatasArgs = {
  skip?: Maybe<Scalars['Int']>;
  first?: Maybe<Scalars['Int']>;
  orderBy?: Maybe<TokenDayData_OrderBy>;
  orderDirection?: Maybe<OrderDirection>;
  where?: Maybe<TokenDayData_Filter>;
  block?: Maybe<Block_Height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionTokenHourDataArgs = {
  id: Scalars['ID'];
  block?: Maybe<Block_Height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionTokenHourDatasArgs = {
  skip?: Maybe<Scalars['Int']>;
  first?: Maybe<Scalars['Int']>;
  orderBy?: Maybe<TokenHourData_OrderBy>;
  orderDirection?: Maybe<OrderDirection>;
  where?: Maybe<TokenHourData_Filter>;
  block?: Maybe<Block_Height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type Subscription_MetaArgs = {
  block?: Maybe<Block_Height>;
};

export type Swap = {
  __typename?: 'Swap';
  id: Scalars['ID'];
  transaction: Transaction;
  timestamp: Scalars['BigInt'];
  pool: Pool;
  token0: Token;
  token1: Token;
  sender: Scalars['Bytes'];
  recipient: Scalars['Bytes'];
  origin: Scalars['Bytes'];
  amount0: Scalars['BigDecimal'];
  amount1: Scalars['BigDecimal'];
  amountUSD: Scalars['BigDecimal'];
  sqrtPriceX96: Scalars['BigInt'];
  tick: Scalars['BigInt'];
  logIndex?: Maybe<Scalars['BigInt']>;
};

export type Swap_Filter = {
  id?: Maybe<Scalars['ID']>;
  id_not?: Maybe<Scalars['ID']>;
  id_gt?: Maybe<Scalars['ID']>;
  id_lt?: Maybe<Scalars['ID']>;
  id_gte?: Maybe<Scalars['ID']>;
  id_lte?: Maybe<Scalars['ID']>;
  id_in?: Maybe<Array<Scalars['ID']>>;
  id_not_in?: Maybe<Array<Scalars['ID']>>;
  transaction?: Maybe<Scalars['String']>;
  transaction_not?: Maybe<Scalars['String']>;
  transaction_gt?: Maybe<Scalars['String']>;
  transaction_lt?: Maybe<Scalars['String']>;
  transaction_gte?: Maybe<Scalars['String']>;
  transaction_lte?: Maybe<Scalars['String']>;
  transaction_in?: Maybe<Array<Scalars['String']>>;
  transaction_not_in?: Maybe<Array<Scalars['String']>>;
  transaction_contains?: Maybe<Scalars['String']>;
  transaction_contains_nocase?: Maybe<Scalars['String']>;
  transaction_not_contains?: Maybe<Scalars['String']>;
  transaction_not_contains_nocase?: Maybe<Scalars['String']>;
  transaction_starts_with?: Maybe<Scalars['String']>;
  transaction_starts_with_nocase?: Maybe<Scalars['String']>;
  transaction_not_starts_with?: Maybe<Scalars['String']>;
  transaction_not_starts_with_nocase?: Maybe<Scalars['String']>;
  transaction_ends_with?: Maybe<Scalars['String']>;
  transaction_ends_with_nocase?: Maybe<Scalars['String']>;
  transaction_not_ends_with?: Maybe<Scalars['String']>;
  transaction_not_ends_with_nocase?: Maybe<Scalars['String']>;
  transaction_?: Maybe<Transaction_Filter>;
  timestamp?: Maybe<Scalars['BigInt']>;
  timestamp_not?: Maybe<Scalars['BigInt']>;
  timestamp_gt?: Maybe<Scalars['BigInt']>;
  timestamp_lt?: Maybe<Scalars['BigInt']>;
  timestamp_gte?: Maybe<Scalars['BigInt']>;
  timestamp_lte?: Maybe<Scalars['BigInt']>;
  timestamp_in?: Maybe<Array<Scalars['BigInt']>>;
  timestamp_not_in?: Maybe<Array<Scalars['BigInt']>>;
  pool?: Maybe<Scalars['String']>;
  pool_not?: Maybe<Scalars['String']>;
  pool_gt?: Maybe<Scalars['String']>;
  pool_lt?: Maybe<Scalars['String']>;
  pool_gte?: Maybe<Scalars['String']>;
  pool_lte?: Maybe<Scalars['String']>;
  pool_in?: Maybe<Array<Scalars['String']>>;
  pool_not_in?: Maybe<Array<Scalars['String']>>;
  pool_contains?: Maybe<Scalars['String']>;
  pool_contains_nocase?: Maybe<Scalars['String']>;
  pool_not_contains?: Maybe<Scalars['String']>;
  pool_not_contains_nocase?: Maybe<Scalars['String']>;
  pool_starts_with?: Maybe<Scalars['String']>;
  pool_starts_with_nocase?: Maybe<Scalars['String']>;
  pool_not_starts_with?: Maybe<Scalars['String']>;
  pool_not_starts_with_nocase?: Maybe<Scalars['String']>;
  pool_ends_with?: Maybe<Scalars['String']>;
  pool_ends_with_nocase?: Maybe<Scalars['String']>;
  pool_not_ends_with?: Maybe<Scalars['String']>;
  pool_not_ends_with_nocase?: Maybe<Scalars['String']>;
  pool_?: Maybe<Pool_Filter>;
  token0?: Maybe<Scalars['String']>;
  token0_not?: Maybe<Scalars['String']>;
  token0_gt?: Maybe<Scalars['String']>;
  token0_lt?: Maybe<Scalars['String']>;
  token0_gte?: Maybe<Scalars['String']>;
  token0_lte?: Maybe<Scalars['String']>;
  token0_in?: Maybe<Array<Scalars['String']>>;
  token0_not_in?: Maybe<Array<Scalars['String']>>;
  token0_contains?: Maybe<Scalars['String']>;
  token0_contains_nocase?: Maybe<Scalars['String']>;
  token0_not_contains?: Maybe<Scalars['String']>;
  token0_not_contains_nocase?: Maybe<Scalars['String']>;
  token0_starts_with?: Maybe<Scalars['String']>;
  token0_starts_with_nocase?: Maybe<Scalars['String']>;
  token0_not_starts_with?: Maybe<Scalars['String']>;
  token0_not_starts_with_nocase?: Maybe<Scalars['String']>;
  token0_ends_with?: Maybe<Scalars['String']>;
  token0_ends_with_nocase?: Maybe<Scalars['String']>;
  token0_not_ends_with?: Maybe<Scalars['String']>;
  token0_not_ends_with_nocase?: Maybe<Scalars['String']>;
  token0_?: Maybe<Token_Filter>;
  token1?: Maybe<Scalars['String']>;
  token1_not?: Maybe<Scalars['String']>;
  token1_gt?: Maybe<Scalars['String']>;
  token1_lt?: Maybe<Scalars['String']>;
  token1_gte?: Maybe<Scalars['String']>;
  token1_lte?: Maybe<Scalars['String']>;
  token1_in?: Maybe<Array<Scalars['String']>>;
  token1_not_in?: Maybe<Array<Scalars['String']>>;
  token1_contains?: Maybe<Scalars['String']>;
  token1_contains_nocase?: Maybe<Scalars['String']>;
  token1_not_contains?: Maybe<Scalars['String']>;
  token1_not_contains_nocase?: Maybe<Scalars['String']>;
  token1_starts_with?: Maybe<Scalars['String']>;
  token1_starts_with_nocase?: Maybe<Scalars['String']>;
  token1_not_starts_with?: Maybe<Scalars['String']>;
  token1_not_starts_with_nocase?: Maybe<Scalars['String']>;
  token1_ends_with?: Maybe<Scalars['String']>;
  token1_ends_with_nocase?: Maybe<Scalars['String']>;
  token1_not_ends_with?: Maybe<Scalars['String']>;
  token1_not_ends_with_nocase?: Maybe<Scalars['String']>;
  token1_?: Maybe<Token_Filter>;
  sender?: Maybe<Scalars['Bytes']>;
  sender_not?: Maybe<Scalars['Bytes']>;
  sender_in?: Maybe<Array<Scalars['Bytes']>>;
  sender_not_in?: Maybe<Array<Scalars['Bytes']>>;
  sender_contains?: Maybe<Scalars['Bytes']>;
  sender_not_contains?: Maybe<Scalars['Bytes']>;
  recipient?: Maybe<Scalars['Bytes']>;
  recipient_not?: Maybe<Scalars['Bytes']>;
  recipient_in?: Maybe<Array<Scalars['Bytes']>>;
  recipient_not_in?: Maybe<Array<Scalars['Bytes']>>;
  recipient_contains?: Maybe<Scalars['Bytes']>;
  recipient_not_contains?: Maybe<Scalars['Bytes']>;
  origin?: Maybe<Scalars['Bytes']>;
  origin_not?: Maybe<Scalars['Bytes']>;
  origin_in?: Maybe<Array<Scalars['Bytes']>>;
  origin_not_in?: Maybe<Array<Scalars['Bytes']>>;
  origin_contains?: Maybe<Scalars['Bytes']>;
  origin_not_contains?: Maybe<Scalars['Bytes']>;
  amount0?: Maybe<Scalars['BigDecimal']>;
  amount0_not?: Maybe<Scalars['BigDecimal']>;
  amount0_gt?: Maybe<Scalars['BigDecimal']>;
  amount0_lt?: Maybe<Scalars['BigDecimal']>;
  amount0_gte?: Maybe<Scalars['BigDecimal']>;
  amount0_lte?: Maybe<Scalars['BigDecimal']>;
  amount0_in?: Maybe<Array<Scalars['BigDecimal']>>;
  amount0_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  amount1?: Maybe<Scalars['BigDecimal']>;
  amount1_not?: Maybe<Scalars['BigDecimal']>;
  amount1_gt?: Maybe<Scalars['BigDecimal']>;
  amount1_lt?: Maybe<Scalars['BigDecimal']>;
  amount1_gte?: Maybe<Scalars['BigDecimal']>;
  amount1_lte?: Maybe<Scalars['BigDecimal']>;
  amount1_in?: Maybe<Array<Scalars['BigDecimal']>>;
  amount1_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  amountUSD?: Maybe<Scalars['BigDecimal']>;
  amountUSD_not?: Maybe<Scalars['BigDecimal']>;
  amountUSD_gt?: Maybe<Scalars['BigDecimal']>;
  amountUSD_lt?: Maybe<Scalars['BigDecimal']>;
  amountUSD_gte?: Maybe<Scalars['BigDecimal']>;
  amountUSD_lte?: Maybe<Scalars['BigDecimal']>;
  amountUSD_in?: Maybe<Array<Scalars['BigDecimal']>>;
  amountUSD_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  sqrtPriceX96?: Maybe<Scalars['BigInt']>;
  sqrtPriceX96_not?: Maybe<Scalars['BigInt']>;
  sqrtPriceX96_gt?: Maybe<Scalars['BigInt']>;
  sqrtPriceX96_lt?: Maybe<Scalars['BigInt']>;
  sqrtPriceX96_gte?: Maybe<Scalars['BigInt']>;
  sqrtPriceX96_lte?: Maybe<Scalars['BigInt']>;
  sqrtPriceX96_in?: Maybe<Array<Scalars['BigInt']>>;
  sqrtPriceX96_not_in?: Maybe<Array<Scalars['BigInt']>>;
  tick?: Maybe<Scalars['BigInt']>;
  tick_not?: Maybe<Scalars['BigInt']>;
  tick_gt?: Maybe<Scalars['BigInt']>;
  tick_lt?: Maybe<Scalars['BigInt']>;
  tick_gte?: Maybe<Scalars['BigInt']>;
  tick_lte?: Maybe<Scalars['BigInt']>;
  tick_in?: Maybe<Array<Scalars['BigInt']>>;
  tick_not_in?: Maybe<Array<Scalars['BigInt']>>;
  logIndex?: Maybe<Scalars['BigInt']>;
  logIndex_not?: Maybe<Scalars['BigInt']>;
  logIndex_gt?: Maybe<Scalars['BigInt']>;
  logIndex_lt?: Maybe<Scalars['BigInt']>;
  logIndex_gte?: Maybe<Scalars['BigInt']>;
  logIndex_lte?: Maybe<Scalars['BigInt']>;
  logIndex_in?: Maybe<Array<Scalars['BigInt']>>;
  logIndex_not_in?: Maybe<Array<Scalars['BigInt']>>;
  /** Filter for the block changed event. */
  _change_block?: Maybe<BlockChangedFilter>;
};

export enum Swap_OrderBy {
  Id = 'id',
  Transaction = 'transaction',
  Timestamp = 'timestamp',
  Pool = 'pool',
  Token0 = 'token0',
  Token1 = 'token1',
  Sender = 'sender',
  Recipient = 'recipient',
  Origin = 'origin',
  Amount0 = 'amount0',
  Amount1 = 'amount1',
  AmountUsd = 'amountUSD',
  SqrtPriceX96 = 'sqrtPriceX96',
  Tick = 'tick',
  LogIndex = 'logIndex'
}

export type Tick = {
  __typename?: 'Tick';
  id: Scalars['ID'];
  poolAddress?: Maybe<Scalars['String']>;
  tickIdx: Scalars['BigInt'];
  pool: Pool;
  liquidityGross: Scalars['BigInt'];
  liquidityNet: Scalars['BigInt'];
  price0: Scalars['BigDecimal'];
  price1: Scalars['BigDecimal'];
  volumeToken0: Scalars['BigDecimal'];
  volumeToken1: Scalars['BigDecimal'];
  volumeUSD: Scalars['BigDecimal'];
  untrackedVolumeUSD: Scalars['BigDecimal'];
  feesUSD: Scalars['BigDecimal'];
  collectedFeesToken0: Scalars['BigDecimal'];
  collectedFeesToken1: Scalars['BigDecimal'];
  collectedFeesUSD: Scalars['BigDecimal'];
  createdAtTimestamp: Scalars['BigInt'];
  createdAtBlockNumber: Scalars['BigInt'];
  liquidityProviderCount: Scalars['BigInt'];
  feeGrowthOutside0X128: Scalars['BigInt'];
  feeGrowthOutside1X128: Scalars['BigInt'];
};

export type TickDayData = {
  __typename?: 'TickDayData';
  id: Scalars['ID'];
  date: Scalars['Int'];
  pool: Pool;
  tick: Tick;
  liquidityGross: Scalars['BigInt'];
  liquidityNet: Scalars['BigInt'];
  volumeToken0: Scalars['BigDecimal'];
  volumeToken1: Scalars['BigDecimal'];
  volumeUSD: Scalars['BigDecimal'];
  feesUSD: Scalars['BigDecimal'];
  feeGrowthOutside0X128: Scalars['BigInt'];
  feeGrowthOutside1X128: Scalars['BigInt'];
};

export type TickDayData_Filter = {
  id?: Maybe<Scalars['ID']>;
  id_not?: Maybe<Scalars['ID']>;
  id_gt?: Maybe<Scalars['ID']>;
  id_lt?: Maybe<Scalars['ID']>;
  id_gte?: Maybe<Scalars['ID']>;
  id_lte?: Maybe<Scalars['ID']>;
  id_in?: Maybe<Array<Scalars['ID']>>;
  id_not_in?: Maybe<Array<Scalars['ID']>>;
  date?: Maybe<Scalars['Int']>;
  date_not?: Maybe<Scalars['Int']>;
  date_gt?: Maybe<Scalars['Int']>;
  date_lt?: Maybe<Scalars['Int']>;
  date_gte?: Maybe<Scalars['Int']>;
  date_lte?: Maybe<Scalars['Int']>;
  date_in?: Maybe<Array<Scalars['Int']>>;
  date_not_in?: Maybe<Array<Scalars['Int']>>;
  pool?: Maybe<Scalars['String']>;
  pool_not?: Maybe<Scalars['String']>;
  pool_gt?: Maybe<Scalars['String']>;
  pool_lt?: Maybe<Scalars['String']>;
  pool_gte?: Maybe<Scalars['String']>;
  pool_lte?: Maybe<Scalars['String']>;
  pool_in?: Maybe<Array<Scalars['String']>>;
  pool_not_in?: Maybe<Array<Scalars['String']>>;
  pool_contains?: Maybe<Scalars['String']>;
  pool_contains_nocase?: Maybe<Scalars['String']>;
  pool_not_contains?: Maybe<Scalars['String']>;
  pool_not_contains_nocase?: Maybe<Scalars['String']>;
  pool_starts_with?: Maybe<Scalars['String']>;
  pool_starts_with_nocase?: Maybe<Scalars['String']>;
  pool_not_starts_with?: Maybe<Scalars['String']>;
  pool_not_starts_with_nocase?: Maybe<Scalars['String']>;
  pool_ends_with?: Maybe<Scalars['String']>;
  pool_ends_with_nocase?: Maybe<Scalars['String']>;
  pool_not_ends_with?: Maybe<Scalars['String']>;
  pool_not_ends_with_nocase?: Maybe<Scalars['String']>;
  pool_?: Maybe<Pool_Filter>;
  tick?: Maybe<Scalars['String']>;
  tick_not?: Maybe<Scalars['String']>;
  tick_gt?: Maybe<Scalars['String']>;
  tick_lt?: Maybe<Scalars['String']>;
  tick_gte?: Maybe<Scalars['String']>;
  tick_lte?: Maybe<Scalars['String']>;
  tick_in?: Maybe<Array<Scalars['String']>>;
  tick_not_in?: Maybe<Array<Scalars['String']>>;
  tick_contains?: Maybe<Scalars['String']>;
  tick_contains_nocase?: Maybe<Scalars['String']>;
  tick_not_contains?: Maybe<Scalars['String']>;
  tick_not_contains_nocase?: Maybe<Scalars['String']>;
  tick_starts_with?: Maybe<Scalars['String']>;
  tick_starts_with_nocase?: Maybe<Scalars['String']>;
  tick_not_starts_with?: Maybe<Scalars['String']>;
  tick_not_starts_with_nocase?: Maybe<Scalars['String']>;
  tick_ends_with?: Maybe<Scalars['String']>;
  tick_ends_with_nocase?: Maybe<Scalars['String']>;
  tick_not_ends_with?: Maybe<Scalars['String']>;
  tick_not_ends_with_nocase?: Maybe<Scalars['String']>;
  tick_?: Maybe<Tick_Filter>;
  liquidityGross?: Maybe<Scalars['BigInt']>;
  liquidityGross_not?: Maybe<Scalars['BigInt']>;
  liquidityGross_gt?: Maybe<Scalars['BigInt']>;
  liquidityGross_lt?: Maybe<Scalars['BigInt']>;
  liquidityGross_gte?: Maybe<Scalars['BigInt']>;
  liquidityGross_lte?: Maybe<Scalars['BigInt']>;
  liquidityGross_in?: Maybe<Array<Scalars['BigInt']>>;
  liquidityGross_not_in?: Maybe<Array<Scalars['BigInt']>>;
  liquidityNet?: Maybe<Scalars['BigInt']>;
  liquidityNet_not?: Maybe<Scalars['BigInt']>;
  liquidityNet_gt?: Maybe<Scalars['BigInt']>;
  liquidityNet_lt?: Maybe<Scalars['BigInt']>;
  liquidityNet_gte?: Maybe<Scalars['BigInt']>;
  liquidityNet_lte?: Maybe<Scalars['BigInt']>;
  liquidityNet_in?: Maybe<Array<Scalars['BigInt']>>;
  liquidityNet_not_in?: Maybe<Array<Scalars['BigInt']>>;
  volumeToken0?: Maybe<Scalars['BigDecimal']>;
  volumeToken0_not?: Maybe<Scalars['BigDecimal']>;
  volumeToken0_gt?: Maybe<Scalars['BigDecimal']>;
  volumeToken0_lt?: Maybe<Scalars['BigDecimal']>;
  volumeToken0_gte?: Maybe<Scalars['BigDecimal']>;
  volumeToken0_lte?: Maybe<Scalars['BigDecimal']>;
  volumeToken0_in?: Maybe<Array<Scalars['BigDecimal']>>;
  volumeToken0_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  volumeToken1?: Maybe<Scalars['BigDecimal']>;
  volumeToken1_not?: Maybe<Scalars['BigDecimal']>;
  volumeToken1_gt?: Maybe<Scalars['BigDecimal']>;
  volumeToken1_lt?: Maybe<Scalars['BigDecimal']>;
  volumeToken1_gte?: Maybe<Scalars['BigDecimal']>;
  volumeToken1_lte?: Maybe<Scalars['BigDecimal']>;
  volumeToken1_in?: Maybe<Array<Scalars['BigDecimal']>>;
  volumeToken1_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  volumeUSD?: Maybe<Scalars['BigDecimal']>;
  volumeUSD_not?: Maybe<Scalars['BigDecimal']>;
  volumeUSD_gt?: Maybe<Scalars['BigDecimal']>;
  volumeUSD_lt?: Maybe<Scalars['BigDecimal']>;
  volumeUSD_gte?: Maybe<Scalars['BigDecimal']>;
  volumeUSD_lte?: Maybe<Scalars['BigDecimal']>;
  volumeUSD_in?: Maybe<Array<Scalars['BigDecimal']>>;
  volumeUSD_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  feesUSD?: Maybe<Scalars['BigDecimal']>;
  feesUSD_not?: Maybe<Scalars['BigDecimal']>;
  feesUSD_gt?: Maybe<Scalars['BigDecimal']>;
  feesUSD_lt?: Maybe<Scalars['BigDecimal']>;
  feesUSD_gte?: Maybe<Scalars['BigDecimal']>;
  feesUSD_lte?: Maybe<Scalars['BigDecimal']>;
  feesUSD_in?: Maybe<Array<Scalars['BigDecimal']>>;
  feesUSD_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  feeGrowthOutside0X128?: Maybe<Scalars['BigInt']>;
  feeGrowthOutside0X128_not?: Maybe<Scalars['BigInt']>;
  feeGrowthOutside0X128_gt?: Maybe<Scalars['BigInt']>;
  feeGrowthOutside0X128_lt?: Maybe<Scalars['BigInt']>;
  feeGrowthOutside0X128_gte?: Maybe<Scalars['BigInt']>;
  feeGrowthOutside0X128_lte?: Maybe<Scalars['BigInt']>;
  feeGrowthOutside0X128_in?: Maybe<Array<Scalars['BigInt']>>;
  feeGrowthOutside0X128_not_in?: Maybe<Array<Scalars['BigInt']>>;
  feeGrowthOutside1X128?: Maybe<Scalars['BigInt']>;
  feeGrowthOutside1X128_not?: Maybe<Scalars['BigInt']>;
  feeGrowthOutside1X128_gt?: Maybe<Scalars['BigInt']>;
  feeGrowthOutside1X128_lt?: Maybe<Scalars['BigInt']>;
  feeGrowthOutside1X128_gte?: Maybe<Scalars['BigInt']>;
  feeGrowthOutside1X128_lte?: Maybe<Scalars['BigInt']>;
  feeGrowthOutside1X128_in?: Maybe<Array<Scalars['BigInt']>>;
  feeGrowthOutside1X128_not_in?: Maybe<Array<Scalars['BigInt']>>;
  /** Filter for the block changed event. */
  _change_block?: Maybe<BlockChangedFilter>;
};

export enum TickDayData_OrderBy {
  Id = 'id',
  Date = 'date',
  Pool = 'pool',
  Tick = 'tick',
  LiquidityGross = 'liquidityGross',
  LiquidityNet = 'liquidityNet',
  VolumeToken0 = 'volumeToken0',
  VolumeToken1 = 'volumeToken1',
  VolumeUsd = 'volumeUSD',
  FeesUsd = 'feesUSD',
  FeeGrowthOutside0X128 = 'feeGrowthOutside0X128',
  FeeGrowthOutside1X128 = 'feeGrowthOutside1X128'
}

export type TickHourData = {
  __typename?: 'TickHourData';
  id: Scalars['ID'];
  periodStartUnix: Scalars['Int'];
  pool: Pool;
  tick: Tick;
  liquidityGross: Scalars['BigInt'];
  liquidityNet: Scalars['BigInt'];
  volumeToken0: Scalars['BigDecimal'];
  volumeToken1: Scalars['BigDecimal'];
  volumeUSD: Scalars['BigDecimal'];
  feesUSD: Scalars['BigDecimal'];
};

export type TickHourData_Filter = {
  id?: Maybe<Scalars['ID']>;
  id_not?: Maybe<Scalars['ID']>;
  id_gt?: Maybe<Scalars['ID']>;
  id_lt?: Maybe<Scalars['ID']>;
  id_gte?: Maybe<Scalars['ID']>;
  id_lte?: Maybe<Scalars['ID']>;
  id_in?: Maybe<Array<Scalars['ID']>>;
  id_not_in?: Maybe<Array<Scalars['ID']>>;
  periodStartUnix?: Maybe<Scalars['Int']>;
  periodStartUnix_not?: Maybe<Scalars['Int']>;
  periodStartUnix_gt?: Maybe<Scalars['Int']>;
  periodStartUnix_lt?: Maybe<Scalars['Int']>;
  periodStartUnix_gte?: Maybe<Scalars['Int']>;
  periodStartUnix_lte?: Maybe<Scalars['Int']>;
  periodStartUnix_in?: Maybe<Array<Scalars['Int']>>;
  periodStartUnix_not_in?: Maybe<Array<Scalars['Int']>>;
  pool?: Maybe<Scalars['String']>;
  pool_not?: Maybe<Scalars['String']>;
  pool_gt?: Maybe<Scalars['String']>;
  pool_lt?: Maybe<Scalars['String']>;
  pool_gte?: Maybe<Scalars['String']>;
  pool_lte?: Maybe<Scalars['String']>;
  pool_in?: Maybe<Array<Scalars['String']>>;
  pool_not_in?: Maybe<Array<Scalars['String']>>;
  pool_contains?: Maybe<Scalars['String']>;
  pool_contains_nocase?: Maybe<Scalars['String']>;
  pool_not_contains?: Maybe<Scalars['String']>;
  pool_not_contains_nocase?: Maybe<Scalars['String']>;
  pool_starts_with?: Maybe<Scalars['String']>;
  pool_starts_with_nocase?: Maybe<Scalars['String']>;
  pool_not_starts_with?: Maybe<Scalars['String']>;
  pool_not_starts_with_nocase?: Maybe<Scalars['String']>;
  pool_ends_with?: Maybe<Scalars['String']>;
  pool_ends_with_nocase?: Maybe<Scalars['String']>;
  pool_not_ends_with?: Maybe<Scalars['String']>;
  pool_not_ends_with_nocase?: Maybe<Scalars['String']>;
  pool_?: Maybe<Pool_Filter>;
  tick?: Maybe<Scalars['String']>;
  tick_not?: Maybe<Scalars['String']>;
  tick_gt?: Maybe<Scalars['String']>;
  tick_lt?: Maybe<Scalars['String']>;
  tick_gte?: Maybe<Scalars['String']>;
  tick_lte?: Maybe<Scalars['String']>;
  tick_in?: Maybe<Array<Scalars['String']>>;
  tick_not_in?: Maybe<Array<Scalars['String']>>;
  tick_contains?: Maybe<Scalars['String']>;
  tick_contains_nocase?: Maybe<Scalars['String']>;
  tick_not_contains?: Maybe<Scalars['String']>;
  tick_not_contains_nocase?: Maybe<Scalars['String']>;
  tick_starts_with?: Maybe<Scalars['String']>;
  tick_starts_with_nocase?: Maybe<Scalars['String']>;
  tick_not_starts_with?: Maybe<Scalars['String']>;
  tick_not_starts_with_nocase?: Maybe<Scalars['String']>;
  tick_ends_with?: Maybe<Scalars['String']>;
  tick_ends_with_nocase?: Maybe<Scalars['String']>;
  tick_not_ends_with?: Maybe<Scalars['String']>;
  tick_not_ends_with_nocase?: Maybe<Scalars['String']>;
  tick_?: Maybe<Tick_Filter>;
  liquidityGross?: Maybe<Scalars['BigInt']>;
  liquidityGross_not?: Maybe<Scalars['BigInt']>;
  liquidityGross_gt?: Maybe<Scalars['BigInt']>;
  liquidityGross_lt?: Maybe<Scalars['BigInt']>;
  liquidityGross_gte?: Maybe<Scalars['BigInt']>;
  liquidityGross_lte?: Maybe<Scalars['BigInt']>;
  liquidityGross_in?: Maybe<Array<Scalars['BigInt']>>;
  liquidityGross_not_in?: Maybe<Array<Scalars['BigInt']>>;
  liquidityNet?: Maybe<Scalars['BigInt']>;
  liquidityNet_not?: Maybe<Scalars['BigInt']>;
  liquidityNet_gt?: Maybe<Scalars['BigInt']>;
  liquidityNet_lt?: Maybe<Scalars['BigInt']>;
  liquidityNet_gte?: Maybe<Scalars['BigInt']>;
  liquidityNet_lte?: Maybe<Scalars['BigInt']>;
  liquidityNet_in?: Maybe<Array<Scalars['BigInt']>>;
  liquidityNet_not_in?: Maybe<Array<Scalars['BigInt']>>;
  volumeToken0?: Maybe<Scalars['BigDecimal']>;
  volumeToken0_not?: Maybe<Scalars['BigDecimal']>;
  volumeToken0_gt?: Maybe<Scalars['BigDecimal']>;
  volumeToken0_lt?: Maybe<Scalars['BigDecimal']>;
  volumeToken0_gte?: Maybe<Scalars['BigDecimal']>;
  volumeToken0_lte?: Maybe<Scalars['BigDecimal']>;
  volumeToken0_in?: Maybe<Array<Scalars['BigDecimal']>>;
  volumeToken0_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  volumeToken1?: Maybe<Scalars['BigDecimal']>;
  volumeToken1_not?: Maybe<Scalars['BigDecimal']>;
  volumeToken1_gt?: Maybe<Scalars['BigDecimal']>;
  volumeToken1_lt?: Maybe<Scalars['BigDecimal']>;
  volumeToken1_gte?: Maybe<Scalars['BigDecimal']>;
  volumeToken1_lte?: Maybe<Scalars['BigDecimal']>;
  volumeToken1_in?: Maybe<Array<Scalars['BigDecimal']>>;
  volumeToken1_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  volumeUSD?: Maybe<Scalars['BigDecimal']>;
  volumeUSD_not?: Maybe<Scalars['BigDecimal']>;
  volumeUSD_gt?: Maybe<Scalars['BigDecimal']>;
  volumeUSD_lt?: Maybe<Scalars['BigDecimal']>;
  volumeUSD_gte?: Maybe<Scalars['BigDecimal']>;
  volumeUSD_lte?: Maybe<Scalars['BigDecimal']>;
  volumeUSD_in?: Maybe<Array<Scalars['BigDecimal']>>;
  volumeUSD_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  feesUSD?: Maybe<Scalars['BigDecimal']>;
  feesUSD_not?: Maybe<Scalars['BigDecimal']>;
  feesUSD_gt?: Maybe<Scalars['BigDecimal']>;
  feesUSD_lt?: Maybe<Scalars['BigDecimal']>;
  feesUSD_gte?: Maybe<Scalars['BigDecimal']>;
  feesUSD_lte?: Maybe<Scalars['BigDecimal']>;
  feesUSD_in?: Maybe<Array<Scalars['BigDecimal']>>;
  feesUSD_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  /** Filter for the block changed event. */
  _change_block?: Maybe<BlockChangedFilter>;
};

export enum TickHourData_OrderBy {
  Id = 'id',
  PeriodStartUnix = 'periodStartUnix',
  Pool = 'pool',
  Tick = 'tick',
  LiquidityGross = 'liquidityGross',
  LiquidityNet = 'liquidityNet',
  VolumeToken0 = 'volumeToken0',
  VolumeToken1 = 'volumeToken1',
  VolumeUsd = 'volumeUSD',
  FeesUsd = 'feesUSD'
}

export type Tick_Filter = {
  id?: Maybe<Scalars['ID']>;
  id_not?: Maybe<Scalars['ID']>;
  id_gt?: Maybe<Scalars['ID']>;
  id_lt?: Maybe<Scalars['ID']>;
  id_gte?: Maybe<Scalars['ID']>;
  id_lte?: Maybe<Scalars['ID']>;
  id_in?: Maybe<Array<Scalars['ID']>>;
  id_not_in?: Maybe<Array<Scalars['ID']>>;
  poolAddress?: Maybe<Scalars['String']>;
  poolAddress_not?: Maybe<Scalars['String']>;
  poolAddress_gt?: Maybe<Scalars['String']>;
  poolAddress_lt?: Maybe<Scalars['String']>;
  poolAddress_gte?: Maybe<Scalars['String']>;
  poolAddress_lte?: Maybe<Scalars['String']>;
  poolAddress_in?: Maybe<Array<Scalars['String']>>;
  poolAddress_not_in?: Maybe<Array<Scalars['String']>>;
  poolAddress_contains?: Maybe<Scalars['String']>;
  poolAddress_contains_nocase?: Maybe<Scalars['String']>;
  poolAddress_not_contains?: Maybe<Scalars['String']>;
  poolAddress_not_contains_nocase?: Maybe<Scalars['String']>;
  poolAddress_starts_with?: Maybe<Scalars['String']>;
  poolAddress_starts_with_nocase?: Maybe<Scalars['String']>;
  poolAddress_not_starts_with?: Maybe<Scalars['String']>;
  poolAddress_not_starts_with_nocase?: Maybe<Scalars['String']>;
  poolAddress_ends_with?: Maybe<Scalars['String']>;
  poolAddress_ends_with_nocase?: Maybe<Scalars['String']>;
  poolAddress_not_ends_with?: Maybe<Scalars['String']>;
  poolAddress_not_ends_with_nocase?: Maybe<Scalars['String']>;
  tickIdx?: Maybe<Scalars['BigInt']>;
  tickIdx_not?: Maybe<Scalars['BigInt']>;
  tickIdx_gt?: Maybe<Scalars['BigInt']>;
  tickIdx_lt?: Maybe<Scalars['BigInt']>;
  tickIdx_gte?: Maybe<Scalars['BigInt']>;
  tickIdx_lte?: Maybe<Scalars['BigInt']>;
  tickIdx_in?: Maybe<Array<Scalars['BigInt']>>;
  tickIdx_not_in?: Maybe<Array<Scalars['BigInt']>>;
  pool?: Maybe<Scalars['String']>;
  pool_not?: Maybe<Scalars['String']>;
  pool_gt?: Maybe<Scalars['String']>;
  pool_lt?: Maybe<Scalars['String']>;
  pool_gte?: Maybe<Scalars['String']>;
  pool_lte?: Maybe<Scalars['String']>;
  pool_in?: Maybe<Array<Scalars['String']>>;
  pool_not_in?: Maybe<Array<Scalars['String']>>;
  pool_contains?: Maybe<Scalars['String']>;
  pool_contains_nocase?: Maybe<Scalars['String']>;
  pool_not_contains?: Maybe<Scalars['String']>;
  pool_not_contains_nocase?: Maybe<Scalars['String']>;
  pool_starts_with?: Maybe<Scalars['String']>;
  pool_starts_with_nocase?: Maybe<Scalars['String']>;
  pool_not_starts_with?: Maybe<Scalars['String']>;
  pool_not_starts_with_nocase?: Maybe<Scalars['String']>;
  pool_ends_with?: Maybe<Scalars['String']>;
  pool_ends_with_nocase?: Maybe<Scalars['String']>;
  pool_not_ends_with?: Maybe<Scalars['String']>;
  pool_not_ends_with_nocase?: Maybe<Scalars['String']>;
  pool_?: Maybe<Pool_Filter>;
  liquidityGross?: Maybe<Scalars['BigInt']>;
  liquidityGross_not?: Maybe<Scalars['BigInt']>;
  liquidityGross_gt?: Maybe<Scalars['BigInt']>;
  liquidityGross_lt?: Maybe<Scalars['BigInt']>;
  liquidityGross_gte?: Maybe<Scalars['BigInt']>;
  liquidityGross_lte?: Maybe<Scalars['BigInt']>;
  liquidityGross_in?: Maybe<Array<Scalars['BigInt']>>;
  liquidityGross_not_in?: Maybe<Array<Scalars['BigInt']>>;
  liquidityNet?: Maybe<Scalars['BigInt']>;
  liquidityNet_not?: Maybe<Scalars['BigInt']>;
  liquidityNet_gt?: Maybe<Scalars['BigInt']>;
  liquidityNet_lt?: Maybe<Scalars['BigInt']>;
  liquidityNet_gte?: Maybe<Scalars['BigInt']>;
  liquidityNet_lte?: Maybe<Scalars['BigInt']>;
  liquidityNet_in?: Maybe<Array<Scalars['BigInt']>>;
  liquidityNet_not_in?: Maybe<Array<Scalars['BigInt']>>;
  price0?: Maybe<Scalars['BigDecimal']>;
  price0_not?: Maybe<Scalars['BigDecimal']>;
  price0_gt?: Maybe<Scalars['BigDecimal']>;
  price0_lt?: Maybe<Scalars['BigDecimal']>;
  price0_gte?: Maybe<Scalars['BigDecimal']>;
  price0_lte?: Maybe<Scalars['BigDecimal']>;
  price0_in?: Maybe<Array<Scalars['BigDecimal']>>;
  price0_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  price1?: Maybe<Scalars['BigDecimal']>;
  price1_not?: Maybe<Scalars['BigDecimal']>;
  price1_gt?: Maybe<Scalars['BigDecimal']>;
  price1_lt?: Maybe<Scalars['BigDecimal']>;
  price1_gte?: Maybe<Scalars['BigDecimal']>;
  price1_lte?: Maybe<Scalars['BigDecimal']>;
  price1_in?: Maybe<Array<Scalars['BigDecimal']>>;
  price1_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  volumeToken0?: Maybe<Scalars['BigDecimal']>;
  volumeToken0_not?: Maybe<Scalars['BigDecimal']>;
  volumeToken0_gt?: Maybe<Scalars['BigDecimal']>;
  volumeToken0_lt?: Maybe<Scalars['BigDecimal']>;
  volumeToken0_gte?: Maybe<Scalars['BigDecimal']>;
  volumeToken0_lte?: Maybe<Scalars['BigDecimal']>;
  volumeToken0_in?: Maybe<Array<Scalars['BigDecimal']>>;
  volumeToken0_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  volumeToken1?: Maybe<Scalars['BigDecimal']>;
  volumeToken1_not?: Maybe<Scalars['BigDecimal']>;
  volumeToken1_gt?: Maybe<Scalars['BigDecimal']>;
  volumeToken1_lt?: Maybe<Scalars['BigDecimal']>;
  volumeToken1_gte?: Maybe<Scalars['BigDecimal']>;
  volumeToken1_lte?: Maybe<Scalars['BigDecimal']>;
  volumeToken1_in?: Maybe<Array<Scalars['BigDecimal']>>;
  volumeToken1_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  volumeUSD?: Maybe<Scalars['BigDecimal']>;
  volumeUSD_not?: Maybe<Scalars['BigDecimal']>;
  volumeUSD_gt?: Maybe<Scalars['BigDecimal']>;
  volumeUSD_lt?: Maybe<Scalars['BigDecimal']>;
  volumeUSD_gte?: Maybe<Scalars['BigDecimal']>;
  volumeUSD_lte?: Maybe<Scalars['BigDecimal']>;
  volumeUSD_in?: Maybe<Array<Scalars['BigDecimal']>>;
  volumeUSD_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  untrackedVolumeUSD?: Maybe<Scalars['BigDecimal']>;
  untrackedVolumeUSD_not?: Maybe<Scalars['BigDecimal']>;
  untrackedVolumeUSD_gt?: Maybe<Scalars['BigDecimal']>;
  untrackedVolumeUSD_lt?: Maybe<Scalars['BigDecimal']>;
  untrackedVolumeUSD_gte?: Maybe<Scalars['BigDecimal']>;
  untrackedVolumeUSD_lte?: Maybe<Scalars['BigDecimal']>;
  untrackedVolumeUSD_in?: Maybe<Array<Scalars['BigDecimal']>>;
  untrackedVolumeUSD_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  feesUSD?: Maybe<Scalars['BigDecimal']>;
  feesUSD_not?: Maybe<Scalars['BigDecimal']>;
  feesUSD_gt?: Maybe<Scalars['BigDecimal']>;
  feesUSD_lt?: Maybe<Scalars['BigDecimal']>;
  feesUSD_gte?: Maybe<Scalars['BigDecimal']>;
  feesUSD_lte?: Maybe<Scalars['BigDecimal']>;
  feesUSD_in?: Maybe<Array<Scalars['BigDecimal']>>;
  feesUSD_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  collectedFeesToken0?: Maybe<Scalars['BigDecimal']>;
  collectedFeesToken0_not?: Maybe<Scalars['BigDecimal']>;
  collectedFeesToken0_gt?: Maybe<Scalars['BigDecimal']>;
  collectedFeesToken0_lt?: Maybe<Scalars['BigDecimal']>;
  collectedFeesToken0_gte?: Maybe<Scalars['BigDecimal']>;
  collectedFeesToken0_lte?: Maybe<Scalars['BigDecimal']>;
  collectedFeesToken0_in?: Maybe<Array<Scalars['BigDecimal']>>;
  collectedFeesToken0_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  collectedFeesToken1?: Maybe<Scalars['BigDecimal']>;
  collectedFeesToken1_not?: Maybe<Scalars['BigDecimal']>;
  collectedFeesToken1_gt?: Maybe<Scalars['BigDecimal']>;
  collectedFeesToken1_lt?: Maybe<Scalars['BigDecimal']>;
  collectedFeesToken1_gte?: Maybe<Scalars['BigDecimal']>;
  collectedFeesToken1_lte?: Maybe<Scalars['BigDecimal']>;
  collectedFeesToken1_in?: Maybe<Array<Scalars['BigDecimal']>>;
  collectedFeesToken1_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  collectedFeesUSD?: Maybe<Scalars['BigDecimal']>;
  collectedFeesUSD_not?: Maybe<Scalars['BigDecimal']>;
  collectedFeesUSD_gt?: Maybe<Scalars['BigDecimal']>;
  collectedFeesUSD_lt?: Maybe<Scalars['BigDecimal']>;
  collectedFeesUSD_gte?: Maybe<Scalars['BigDecimal']>;
  collectedFeesUSD_lte?: Maybe<Scalars['BigDecimal']>;
  collectedFeesUSD_in?: Maybe<Array<Scalars['BigDecimal']>>;
  collectedFeesUSD_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  createdAtTimestamp?: Maybe<Scalars['BigInt']>;
  createdAtTimestamp_not?: Maybe<Scalars['BigInt']>;
  createdAtTimestamp_gt?: Maybe<Scalars['BigInt']>;
  createdAtTimestamp_lt?: Maybe<Scalars['BigInt']>;
  createdAtTimestamp_gte?: Maybe<Scalars['BigInt']>;
  createdAtTimestamp_lte?: Maybe<Scalars['BigInt']>;
  createdAtTimestamp_in?: Maybe<Array<Scalars['BigInt']>>;
  createdAtTimestamp_not_in?: Maybe<Array<Scalars['BigInt']>>;
  createdAtBlockNumber?: Maybe<Scalars['BigInt']>;
  createdAtBlockNumber_not?: Maybe<Scalars['BigInt']>;
  createdAtBlockNumber_gt?: Maybe<Scalars['BigInt']>;
  createdAtBlockNumber_lt?: Maybe<Scalars['BigInt']>;
  createdAtBlockNumber_gte?: Maybe<Scalars['BigInt']>;
  createdAtBlockNumber_lte?: Maybe<Scalars['BigInt']>;
  createdAtBlockNumber_in?: Maybe<Array<Scalars['BigInt']>>;
  createdAtBlockNumber_not_in?: Maybe<Array<Scalars['BigInt']>>;
  liquidityProviderCount?: Maybe<Scalars['BigInt']>;
  liquidityProviderCount_not?: Maybe<Scalars['BigInt']>;
  liquidityProviderCount_gt?: Maybe<Scalars['BigInt']>;
  liquidityProviderCount_lt?: Maybe<Scalars['BigInt']>;
  liquidityProviderCount_gte?: Maybe<Scalars['BigInt']>;
  liquidityProviderCount_lte?: Maybe<Scalars['BigInt']>;
  liquidityProviderCount_in?: Maybe<Array<Scalars['BigInt']>>;
  liquidityProviderCount_not_in?: Maybe<Array<Scalars['BigInt']>>;
  feeGrowthOutside0X128?: Maybe<Scalars['BigInt']>;
  feeGrowthOutside0X128_not?: Maybe<Scalars['BigInt']>;
  feeGrowthOutside0X128_gt?: Maybe<Scalars['BigInt']>;
  feeGrowthOutside0X128_lt?: Maybe<Scalars['BigInt']>;
  feeGrowthOutside0X128_gte?: Maybe<Scalars['BigInt']>;
  feeGrowthOutside0X128_lte?: Maybe<Scalars['BigInt']>;
  feeGrowthOutside0X128_in?: Maybe<Array<Scalars['BigInt']>>;
  feeGrowthOutside0X128_not_in?: Maybe<Array<Scalars['BigInt']>>;
  feeGrowthOutside1X128?: Maybe<Scalars['BigInt']>;
  feeGrowthOutside1X128_not?: Maybe<Scalars['BigInt']>;
  feeGrowthOutside1X128_gt?: Maybe<Scalars['BigInt']>;
  feeGrowthOutside1X128_lt?: Maybe<Scalars['BigInt']>;
  feeGrowthOutside1X128_gte?: Maybe<Scalars['BigInt']>;
  feeGrowthOutside1X128_lte?: Maybe<Scalars['BigInt']>;
  feeGrowthOutside1X128_in?: Maybe<Array<Scalars['BigInt']>>;
  feeGrowthOutside1X128_not_in?: Maybe<Array<Scalars['BigInt']>>;
  /** Filter for the block changed event. */
  _change_block?: Maybe<BlockChangedFilter>;
};

export enum Tick_OrderBy {
  Id = 'id',
  PoolAddress = 'poolAddress',
  TickIdx = 'tickIdx',
  Pool = 'pool',
  LiquidityGross = 'liquidityGross',
  LiquidityNet = 'liquidityNet',
  Price0 = 'price0',
  Price1 = 'price1',
  VolumeToken0 = 'volumeToken0',
  VolumeToken1 = 'volumeToken1',
  VolumeUsd = 'volumeUSD',
  UntrackedVolumeUsd = 'untrackedVolumeUSD',
  FeesUsd = 'feesUSD',
  CollectedFeesToken0 = 'collectedFeesToken0',
  CollectedFeesToken1 = 'collectedFeesToken1',
  CollectedFeesUsd = 'collectedFeesUSD',
  CreatedAtTimestamp = 'createdAtTimestamp',
  CreatedAtBlockNumber = 'createdAtBlockNumber',
  LiquidityProviderCount = 'liquidityProviderCount',
  FeeGrowthOutside0X128 = 'feeGrowthOutside0X128',
  FeeGrowthOutside1X128 = 'feeGrowthOutside1X128'
}

export type Token = {
  __typename?: 'Token';
  id: Scalars['ID'];
  symbol: Scalars['String'];
  name: Scalars['String'];
  decimals: Scalars['BigInt'];
  totalSupply: Scalars['BigInt'];
  volume: Scalars['BigDecimal'];
  volumeUSD: Scalars['BigDecimal'];
  untrackedVolumeUSD: Scalars['BigDecimal'];
  feesUSD: Scalars['BigDecimal'];
  txCount: Scalars['BigInt'];
  poolCount: Scalars['BigInt'];
  totalValueLocked: Scalars['BigDecimal'];
  totalValueLockedUSD: Scalars['BigDecimal'];
  totalValueLockedUSDUntracked: Scalars['BigDecimal'];
  derivedETH: Scalars['BigDecimal'];
  whitelistPools: Array<Pool>;
  tokenDayData: Array<TokenDayData>;
};


export type TokenWhitelistPoolsArgs = {
  skip?: Maybe<Scalars['Int']>;
  first?: Maybe<Scalars['Int']>;
  orderBy?: Maybe<Pool_OrderBy>;
  orderDirection?: Maybe<OrderDirection>;
  where?: Maybe<Pool_Filter>;
};


export type TokenTokenDayDataArgs = {
  skip?: Maybe<Scalars['Int']>;
  first?: Maybe<Scalars['Int']>;
  orderBy?: Maybe<TokenDayData_OrderBy>;
  orderDirection?: Maybe<OrderDirection>;
  where?: Maybe<TokenDayData_Filter>;
};

export type TokenDayData = {
  __typename?: 'TokenDayData';
  id: Scalars['ID'];
  date: Scalars['Int'];
  token: Token;
  volume: Scalars['BigDecimal'];
  volumeUSD: Scalars['BigDecimal'];
  untrackedVolumeUSD: Scalars['BigDecimal'];
  totalValueLocked: Scalars['BigDecimal'];
  totalValueLockedUSD: Scalars['BigDecimal'];
  priceUSD: Scalars['BigDecimal'];
  feesUSD: Scalars['BigDecimal'];
  open: Scalars['BigDecimal'];
  high: Scalars['BigDecimal'];
  low: Scalars['BigDecimal'];
  close: Scalars['BigDecimal'];
};

export type TokenDayData_Filter = {
  id?: Maybe<Scalars['ID']>;
  id_not?: Maybe<Scalars['ID']>;
  id_gt?: Maybe<Scalars['ID']>;
  id_lt?: Maybe<Scalars['ID']>;
  id_gte?: Maybe<Scalars['ID']>;
  id_lte?: Maybe<Scalars['ID']>;
  id_in?: Maybe<Array<Scalars['ID']>>;
  id_not_in?: Maybe<Array<Scalars['ID']>>;
  date?: Maybe<Scalars['Int']>;
  date_not?: Maybe<Scalars['Int']>;
  date_gt?: Maybe<Scalars['Int']>;
  date_lt?: Maybe<Scalars['Int']>;
  date_gte?: Maybe<Scalars['Int']>;
  date_lte?: Maybe<Scalars['Int']>;
  date_in?: Maybe<Array<Scalars['Int']>>;
  date_not_in?: Maybe<Array<Scalars['Int']>>;
  token?: Maybe<Scalars['String']>;
  token_not?: Maybe<Scalars['String']>;
  token_gt?: Maybe<Scalars['String']>;
  token_lt?: Maybe<Scalars['String']>;
  token_gte?: Maybe<Scalars['String']>;
  token_lte?: Maybe<Scalars['String']>;
  token_in?: Maybe<Array<Scalars['String']>>;
  token_not_in?: Maybe<Array<Scalars['String']>>;
  token_contains?: Maybe<Scalars['String']>;
  token_contains_nocase?: Maybe<Scalars['String']>;
  token_not_contains?: Maybe<Scalars['String']>;
  token_not_contains_nocase?: Maybe<Scalars['String']>;
  token_starts_with?: Maybe<Scalars['String']>;
  token_starts_with_nocase?: Maybe<Scalars['String']>;
  token_not_starts_with?: Maybe<Scalars['String']>;
  token_not_starts_with_nocase?: Maybe<Scalars['String']>;
  token_ends_with?: Maybe<Scalars['String']>;
  token_ends_with_nocase?: Maybe<Scalars['String']>;
  token_not_ends_with?: Maybe<Scalars['String']>;
  token_not_ends_with_nocase?: Maybe<Scalars['String']>;
  token_?: Maybe<Token_Filter>;
  volume?: Maybe<Scalars['BigDecimal']>;
  volume_not?: Maybe<Scalars['BigDecimal']>;
  volume_gt?: Maybe<Scalars['BigDecimal']>;
  volume_lt?: Maybe<Scalars['BigDecimal']>;
  volume_gte?: Maybe<Scalars['BigDecimal']>;
  volume_lte?: Maybe<Scalars['BigDecimal']>;
  volume_in?: Maybe<Array<Scalars['BigDecimal']>>;
  volume_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  volumeUSD?: Maybe<Scalars['BigDecimal']>;
  volumeUSD_not?: Maybe<Scalars['BigDecimal']>;
  volumeUSD_gt?: Maybe<Scalars['BigDecimal']>;
  volumeUSD_lt?: Maybe<Scalars['BigDecimal']>;
  volumeUSD_gte?: Maybe<Scalars['BigDecimal']>;
  volumeUSD_lte?: Maybe<Scalars['BigDecimal']>;
  volumeUSD_in?: Maybe<Array<Scalars['BigDecimal']>>;
  volumeUSD_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  untrackedVolumeUSD?: Maybe<Scalars['BigDecimal']>;
  untrackedVolumeUSD_not?: Maybe<Scalars['BigDecimal']>;
  untrackedVolumeUSD_gt?: Maybe<Scalars['BigDecimal']>;
  untrackedVolumeUSD_lt?: Maybe<Scalars['BigDecimal']>;
  untrackedVolumeUSD_gte?: Maybe<Scalars['BigDecimal']>;
  untrackedVolumeUSD_lte?: Maybe<Scalars['BigDecimal']>;
  untrackedVolumeUSD_in?: Maybe<Array<Scalars['BigDecimal']>>;
  untrackedVolumeUSD_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  totalValueLocked?: Maybe<Scalars['BigDecimal']>;
  totalValueLocked_not?: Maybe<Scalars['BigDecimal']>;
  totalValueLocked_gt?: Maybe<Scalars['BigDecimal']>;
  totalValueLocked_lt?: Maybe<Scalars['BigDecimal']>;
  totalValueLocked_gte?: Maybe<Scalars['BigDecimal']>;
  totalValueLocked_lte?: Maybe<Scalars['BigDecimal']>;
  totalValueLocked_in?: Maybe<Array<Scalars['BigDecimal']>>;
  totalValueLocked_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  totalValueLockedUSD?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedUSD_not?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedUSD_gt?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedUSD_lt?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedUSD_gte?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedUSD_lte?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedUSD_in?: Maybe<Array<Scalars['BigDecimal']>>;
  totalValueLockedUSD_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  priceUSD?: Maybe<Scalars['BigDecimal']>;
  priceUSD_not?: Maybe<Scalars['BigDecimal']>;
  priceUSD_gt?: Maybe<Scalars['BigDecimal']>;
  priceUSD_lt?: Maybe<Scalars['BigDecimal']>;
  priceUSD_gte?: Maybe<Scalars['BigDecimal']>;
  priceUSD_lte?: Maybe<Scalars['BigDecimal']>;
  priceUSD_in?: Maybe<Array<Scalars['BigDecimal']>>;
  priceUSD_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  feesUSD?: Maybe<Scalars['BigDecimal']>;
  feesUSD_not?: Maybe<Scalars['BigDecimal']>;
  feesUSD_gt?: Maybe<Scalars['BigDecimal']>;
  feesUSD_lt?: Maybe<Scalars['BigDecimal']>;
  feesUSD_gte?: Maybe<Scalars['BigDecimal']>;
  feesUSD_lte?: Maybe<Scalars['BigDecimal']>;
  feesUSD_in?: Maybe<Array<Scalars['BigDecimal']>>;
  feesUSD_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  open?: Maybe<Scalars['BigDecimal']>;
  open_not?: Maybe<Scalars['BigDecimal']>;
  open_gt?: Maybe<Scalars['BigDecimal']>;
  open_lt?: Maybe<Scalars['BigDecimal']>;
  open_gte?: Maybe<Scalars['BigDecimal']>;
  open_lte?: Maybe<Scalars['BigDecimal']>;
  open_in?: Maybe<Array<Scalars['BigDecimal']>>;
  open_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  high?: Maybe<Scalars['BigDecimal']>;
  high_not?: Maybe<Scalars['BigDecimal']>;
  high_gt?: Maybe<Scalars['BigDecimal']>;
  high_lt?: Maybe<Scalars['BigDecimal']>;
  high_gte?: Maybe<Scalars['BigDecimal']>;
  high_lte?: Maybe<Scalars['BigDecimal']>;
  high_in?: Maybe<Array<Scalars['BigDecimal']>>;
  high_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  low?: Maybe<Scalars['BigDecimal']>;
  low_not?: Maybe<Scalars['BigDecimal']>;
  low_gt?: Maybe<Scalars['BigDecimal']>;
  low_lt?: Maybe<Scalars['BigDecimal']>;
  low_gte?: Maybe<Scalars['BigDecimal']>;
  low_lte?: Maybe<Scalars['BigDecimal']>;
  low_in?: Maybe<Array<Scalars['BigDecimal']>>;
  low_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  close?: Maybe<Scalars['BigDecimal']>;
  close_not?: Maybe<Scalars['BigDecimal']>;
  close_gt?: Maybe<Scalars['BigDecimal']>;
  close_lt?: Maybe<Scalars['BigDecimal']>;
  close_gte?: Maybe<Scalars['BigDecimal']>;
  close_lte?: Maybe<Scalars['BigDecimal']>;
  close_in?: Maybe<Array<Scalars['BigDecimal']>>;
  close_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  /** Filter for the block changed event. */
  _change_block?: Maybe<BlockChangedFilter>;
};

export enum TokenDayData_OrderBy {
  Id = 'id',
  Date = 'date',
  Token = 'token',
  Volume = 'volume',
  VolumeUsd = 'volumeUSD',
  UntrackedVolumeUsd = 'untrackedVolumeUSD',
  TotalValueLocked = 'totalValueLocked',
  TotalValueLockedUsd = 'totalValueLockedUSD',
  PriceUsd = 'priceUSD',
  FeesUsd = 'feesUSD',
  Open = 'open',
  High = 'high',
  Low = 'low',
  Close = 'close'
}

export type TokenHourData = {
  __typename?: 'TokenHourData';
  id: Scalars['ID'];
  periodStartUnix: Scalars['Int'];
  token: Token;
  volume: Scalars['BigDecimal'];
  volumeUSD: Scalars['BigDecimal'];
  untrackedVolumeUSD: Scalars['BigDecimal'];
  totalValueLocked: Scalars['BigDecimal'];
  totalValueLockedUSD: Scalars['BigDecimal'];
  priceUSD: Scalars['BigDecimal'];
  feesUSD: Scalars['BigDecimal'];
  open: Scalars['BigDecimal'];
  high: Scalars['BigDecimal'];
  low: Scalars['BigDecimal'];
  close: Scalars['BigDecimal'];
};

export type TokenHourData_Filter = {
  id?: Maybe<Scalars['ID']>;
  id_not?: Maybe<Scalars['ID']>;
  id_gt?: Maybe<Scalars['ID']>;
  id_lt?: Maybe<Scalars['ID']>;
  id_gte?: Maybe<Scalars['ID']>;
  id_lte?: Maybe<Scalars['ID']>;
  id_in?: Maybe<Array<Scalars['ID']>>;
  id_not_in?: Maybe<Array<Scalars['ID']>>;
  periodStartUnix?: Maybe<Scalars['Int']>;
  periodStartUnix_not?: Maybe<Scalars['Int']>;
  periodStartUnix_gt?: Maybe<Scalars['Int']>;
  periodStartUnix_lt?: Maybe<Scalars['Int']>;
  periodStartUnix_gte?: Maybe<Scalars['Int']>;
  periodStartUnix_lte?: Maybe<Scalars['Int']>;
  periodStartUnix_in?: Maybe<Array<Scalars['Int']>>;
  periodStartUnix_not_in?: Maybe<Array<Scalars['Int']>>;
  token?: Maybe<Scalars['String']>;
  token_not?: Maybe<Scalars['String']>;
  token_gt?: Maybe<Scalars['String']>;
  token_lt?: Maybe<Scalars['String']>;
  token_gte?: Maybe<Scalars['String']>;
  token_lte?: Maybe<Scalars['String']>;
  token_in?: Maybe<Array<Scalars['String']>>;
  token_not_in?: Maybe<Array<Scalars['String']>>;
  token_contains?: Maybe<Scalars['String']>;
  token_contains_nocase?: Maybe<Scalars['String']>;
  token_not_contains?: Maybe<Scalars['String']>;
  token_not_contains_nocase?: Maybe<Scalars['String']>;
  token_starts_with?: Maybe<Scalars['String']>;
  token_starts_with_nocase?: Maybe<Scalars['String']>;
  token_not_starts_with?: Maybe<Scalars['String']>;
  token_not_starts_with_nocase?: Maybe<Scalars['String']>;
  token_ends_with?: Maybe<Scalars['String']>;
  token_ends_with_nocase?: Maybe<Scalars['String']>;
  token_not_ends_with?: Maybe<Scalars['String']>;
  token_not_ends_with_nocase?: Maybe<Scalars['String']>;
  token_?: Maybe<Token_Filter>;
  volume?: Maybe<Scalars['BigDecimal']>;
  volume_not?: Maybe<Scalars['BigDecimal']>;
  volume_gt?: Maybe<Scalars['BigDecimal']>;
  volume_lt?: Maybe<Scalars['BigDecimal']>;
  volume_gte?: Maybe<Scalars['BigDecimal']>;
  volume_lte?: Maybe<Scalars['BigDecimal']>;
  volume_in?: Maybe<Array<Scalars['BigDecimal']>>;
  volume_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  volumeUSD?: Maybe<Scalars['BigDecimal']>;
  volumeUSD_not?: Maybe<Scalars['BigDecimal']>;
  volumeUSD_gt?: Maybe<Scalars['BigDecimal']>;
  volumeUSD_lt?: Maybe<Scalars['BigDecimal']>;
  volumeUSD_gte?: Maybe<Scalars['BigDecimal']>;
  volumeUSD_lte?: Maybe<Scalars['BigDecimal']>;
  volumeUSD_in?: Maybe<Array<Scalars['BigDecimal']>>;
  volumeUSD_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  untrackedVolumeUSD?: Maybe<Scalars['BigDecimal']>;
  untrackedVolumeUSD_not?: Maybe<Scalars['BigDecimal']>;
  untrackedVolumeUSD_gt?: Maybe<Scalars['BigDecimal']>;
  untrackedVolumeUSD_lt?: Maybe<Scalars['BigDecimal']>;
  untrackedVolumeUSD_gte?: Maybe<Scalars['BigDecimal']>;
  untrackedVolumeUSD_lte?: Maybe<Scalars['BigDecimal']>;
  untrackedVolumeUSD_in?: Maybe<Array<Scalars['BigDecimal']>>;
  untrackedVolumeUSD_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  totalValueLocked?: Maybe<Scalars['BigDecimal']>;
  totalValueLocked_not?: Maybe<Scalars['BigDecimal']>;
  totalValueLocked_gt?: Maybe<Scalars['BigDecimal']>;
  totalValueLocked_lt?: Maybe<Scalars['BigDecimal']>;
  totalValueLocked_gte?: Maybe<Scalars['BigDecimal']>;
  totalValueLocked_lte?: Maybe<Scalars['BigDecimal']>;
  totalValueLocked_in?: Maybe<Array<Scalars['BigDecimal']>>;
  totalValueLocked_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  totalValueLockedUSD?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedUSD_not?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedUSD_gt?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedUSD_lt?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedUSD_gte?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedUSD_lte?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedUSD_in?: Maybe<Array<Scalars['BigDecimal']>>;
  totalValueLockedUSD_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  priceUSD?: Maybe<Scalars['BigDecimal']>;
  priceUSD_not?: Maybe<Scalars['BigDecimal']>;
  priceUSD_gt?: Maybe<Scalars['BigDecimal']>;
  priceUSD_lt?: Maybe<Scalars['BigDecimal']>;
  priceUSD_gte?: Maybe<Scalars['BigDecimal']>;
  priceUSD_lte?: Maybe<Scalars['BigDecimal']>;
  priceUSD_in?: Maybe<Array<Scalars['BigDecimal']>>;
  priceUSD_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  feesUSD?: Maybe<Scalars['BigDecimal']>;
  feesUSD_not?: Maybe<Scalars['BigDecimal']>;
  feesUSD_gt?: Maybe<Scalars['BigDecimal']>;
  feesUSD_lt?: Maybe<Scalars['BigDecimal']>;
  feesUSD_gte?: Maybe<Scalars['BigDecimal']>;
  feesUSD_lte?: Maybe<Scalars['BigDecimal']>;
  feesUSD_in?: Maybe<Array<Scalars['BigDecimal']>>;
  feesUSD_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  open?: Maybe<Scalars['BigDecimal']>;
  open_not?: Maybe<Scalars['BigDecimal']>;
  open_gt?: Maybe<Scalars['BigDecimal']>;
  open_lt?: Maybe<Scalars['BigDecimal']>;
  open_gte?: Maybe<Scalars['BigDecimal']>;
  open_lte?: Maybe<Scalars['BigDecimal']>;
  open_in?: Maybe<Array<Scalars['BigDecimal']>>;
  open_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  high?: Maybe<Scalars['BigDecimal']>;
  high_not?: Maybe<Scalars['BigDecimal']>;
  high_gt?: Maybe<Scalars['BigDecimal']>;
  high_lt?: Maybe<Scalars['BigDecimal']>;
  high_gte?: Maybe<Scalars['BigDecimal']>;
  high_lte?: Maybe<Scalars['BigDecimal']>;
  high_in?: Maybe<Array<Scalars['BigDecimal']>>;
  high_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  low?: Maybe<Scalars['BigDecimal']>;
  low_not?: Maybe<Scalars['BigDecimal']>;
  low_gt?: Maybe<Scalars['BigDecimal']>;
  low_lt?: Maybe<Scalars['BigDecimal']>;
  low_gte?: Maybe<Scalars['BigDecimal']>;
  low_lte?: Maybe<Scalars['BigDecimal']>;
  low_in?: Maybe<Array<Scalars['BigDecimal']>>;
  low_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  close?: Maybe<Scalars['BigDecimal']>;
  close_not?: Maybe<Scalars['BigDecimal']>;
  close_gt?: Maybe<Scalars['BigDecimal']>;
  close_lt?: Maybe<Scalars['BigDecimal']>;
  close_gte?: Maybe<Scalars['BigDecimal']>;
  close_lte?: Maybe<Scalars['BigDecimal']>;
  close_in?: Maybe<Array<Scalars['BigDecimal']>>;
  close_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  /** Filter for the block changed event. */
  _change_block?: Maybe<BlockChangedFilter>;
};

export enum TokenHourData_OrderBy {
  Id = 'id',
  PeriodStartUnix = 'periodStartUnix',
  Token = 'token',
  Volume = 'volume',
  VolumeUsd = 'volumeUSD',
  UntrackedVolumeUsd = 'untrackedVolumeUSD',
  TotalValueLocked = 'totalValueLocked',
  TotalValueLockedUsd = 'totalValueLockedUSD',
  PriceUsd = 'priceUSD',
  FeesUsd = 'feesUSD',
  Open = 'open',
  High = 'high',
  Low = 'low',
  Close = 'close'
}

export type Token_Filter = {
  id?: Maybe<Scalars['ID']>;
  id_not?: Maybe<Scalars['ID']>;
  id_gt?: Maybe<Scalars['ID']>;
  id_lt?: Maybe<Scalars['ID']>;
  id_gte?: Maybe<Scalars['ID']>;
  id_lte?: Maybe<Scalars['ID']>;
  id_in?: Maybe<Array<Scalars['ID']>>;
  id_not_in?: Maybe<Array<Scalars['ID']>>;
  symbol?: Maybe<Scalars['String']>;
  symbol_not?: Maybe<Scalars['String']>;
  symbol_gt?: Maybe<Scalars['String']>;
  symbol_lt?: Maybe<Scalars['String']>;
  symbol_gte?: Maybe<Scalars['String']>;
  symbol_lte?: Maybe<Scalars['String']>;
  symbol_in?: Maybe<Array<Scalars['String']>>;
  symbol_not_in?: Maybe<Array<Scalars['String']>>;
  symbol_contains?: Maybe<Scalars['String']>;
  symbol_contains_nocase?: Maybe<Scalars['String']>;
  symbol_not_contains?: Maybe<Scalars['String']>;
  symbol_not_contains_nocase?: Maybe<Scalars['String']>;
  symbol_starts_with?: Maybe<Scalars['String']>;
  symbol_starts_with_nocase?: Maybe<Scalars['String']>;
  symbol_not_starts_with?: Maybe<Scalars['String']>;
  symbol_not_starts_with_nocase?: Maybe<Scalars['String']>;
  symbol_ends_with?: Maybe<Scalars['String']>;
  symbol_ends_with_nocase?: Maybe<Scalars['String']>;
  symbol_not_ends_with?: Maybe<Scalars['String']>;
  symbol_not_ends_with_nocase?: Maybe<Scalars['String']>;
  name?: Maybe<Scalars['String']>;
  name_not?: Maybe<Scalars['String']>;
  name_gt?: Maybe<Scalars['String']>;
  name_lt?: Maybe<Scalars['String']>;
  name_gte?: Maybe<Scalars['String']>;
  name_lte?: Maybe<Scalars['String']>;
  name_in?: Maybe<Array<Scalars['String']>>;
  name_not_in?: Maybe<Array<Scalars['String']>>;
  name_contains?: Maybe<Scalars['String']>;
  name_contains_nocase?: Maybe<Scalars['String']>;
  name_not_contains?: Maybe<Scalars['String']>;
  name_not_contains_nocase?: Maybe<Scalars['String']>;
  name_starts_with?: Maybe<Scalars['String']>;
  name_starts_with_nocase?: Maybe<Scalars['String']>;
  name_not_starts_with?: Maybe<Scalars['String']>;
  name_not_starts_with_nocase?: Maybe<Scalars['String']>;
  name_ends_with?: Maybe<Scalars['String']>;
  name_ends_with_nocase?: Maybe<Scalars['String']>;
  name_not_ends_with?: Maybe<Scalars['String']>;
  name_not_ends_with_nocase?: Maybe<Scalars['String']>;
  decimals?: Maybe<Scalars['BigInt']>;
  decimals_not?: Maybe<Scalars['BigInt']>;
  decimals_gt?: Maybe<Scalars['BigInt']>;
  decimals_lt?: Maybe<Scalars['BigInt']>;
  decimals_gte?: Maybe<Scalars['BigInt']>;
  decimals_lte?: Maybe<Scalars['BigInt']>;
  decimals_in?: Maybe<Array<Scalars['BigInt']>>;
  decimals_not_in?: Maybe<Array<Scalars['BigInt']>>;
  totalSupply?: Maybe<Scalars['BigInt']>;
  totalSupply_not?: Maybe<Scalars['BigInt']>;
  totalSupply_gt?: Maybe<Scalars['BigInt']>;
  totalSupply_lt?: Maybe<Scalars['BigInt']>;
  totalSupply_gte?: Maybe<Scalars['BigInt']>;
  totalSupply_lte?: Maybe<Scalars['BigInt']>;
  totalSupply_in?: Maybe<Array<Scalars['BigInt']>>;
  totalSupply_not_in?: Maybe<Array<Scalars['BigInt']>>;
  volume?: Maybe<Scalars['BigDecimal']>;
  volume_not?: Maybe<Scalars['BigDecimal']>;
  volume_gt?: Maybe<Scalars['BigDecimal']>;
  volume_lt?: Maybe<Scalars['BigDecimal']>;
  volume_gte?: Maybe<Scalars['BigDecimal']>;
  volume_lte?: Maybe<Scalars['BigDecimal']>;
  volume_in?: Maybe<Array<Scalars['BigDecimal']>>;
  volume_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  volumeUSD?: Maybe<Scalars['BigDecimal']>;
  volumeUSD_not?: Maybe<Scalars['BigDecimal']>;
  volumeUSD_gt?: Maybe<Scalars['BigDecimal']>;
  volumeUSD_lt?: Maybe<Scalars['BigDecimal']>;
  volumeUSD_gte?: Maybe<Scalars['BigDecimal']>;
  volumeUSD_lte?: Maybe<Scalars['BigDecimal']>;
  volumeUSD_in?: Maybe<Array<Scalars['BigDecimal']>>;
  volumeUSD_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  untrackedVolumeUSD?: Maybe<Scalars['BigDecimal']>;
  untrackedVolumeUSD_not?: Maybe<Scalars['BigDecimal']>;
  untrackedVolumeUSD_gt?: Maybe<Scalars['BigDecimal']>;
  untrackedVolumeUSD_lt?: Maybe<Scalars['BigDecimal']>;
  untrackedVolumeUSD_gte?: Maybe<Scalars['BigDecimal']>;
  untrackedVolumeUSD_lte?: Maybe<Scalars['BigDecimal']>;
  untrackedVolumeUSD_in?: Maybe<Array<Scalars['BigDecimal']>>;
  untrackedVolumeUSD_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  feesUSD?: Maybe<Scalars['BigDecimal']>;
  feesUSD_not?: Maybe<Scalars['BigDecimal']>;
  feesUSD_gt?: Maybe<Scalars['BigDecimal']>;
  feesUSD_lt?: Maybe<Scalars['BigDecimal']>;
  feesUSD_gte?: Maybe<Scalars['BigDecimal']>;
  feesUSD_lte?: Maybe<Scalars['BigDecimal']>;
  feesUSD_in?: Maybe<Array<Scalars['BigDecimal']>>;
  feesUSD_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  txCount?: Maybe<Scalars['BigInt']>;
  txCount_not?: Maybe<Scalars['BigInt']>;
  txCount_gt?: Maybe<Scalars['BigInt']>;
  txCount_lt?: Maybe<Scalars['BigInt']>;
  txCount_gte?: Maybe<Scalars['BigInt']>;
  txCount_lte?: Maybe<Scalars['BigInt']>;
  txCount_in?: Maybe<Array<Scalars['BigInt']>>;
  txCount_not_in?: Maybe<Array<Scalars['BigInt']>>;
  poolCount?: Maybe<Scalars['BigInt']>;
  poolCount_not?: Maybe<Scalars['BigInt']>;
  poolCount_gt?: Maybe<Scalars['BigInt']>;
  poolCount_lt?: Maybe<Scalars['BigInt']>;
  poolCount_gte?: Maybe<Scalars['BigInt']>;
  poolCount_lte?: Maybe<Scalars['BigInt']>;
  poolCount_in?: Maybe<Array<Scalars['BigInt']>>;
  poolCount_not_in?: Maybe<Array<Scalars['BigInt']>>;
  totalValueLocked?: Maybe<Scalars['BigDecimal']>;
  totalValueLocked_not?: Maybe<Scalars['BigDecimal']>;
  totalValueLocked_gt?: Maybe<Scalars['BigDecimal']>;
  totalValueLocked_lt?: Maybe<Scalars['BigDecimal']>;
  totalValueLocked_gte?: Maybe<Scalars['BigDecimal']>;
  totalValueLocked_lte?: Maybe<Scalars['BigDecimal']>;
  totalValueLocked_in?: Maybe<Array<Scalars['BigDecimal']>>;
  totalValueLocked_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  totalValueLockedUSD?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedUSD_not?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedUSD_gt?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedUSD_lt?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedUSD_gte?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedUSD_lte?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedUSD_in?: Maybe<Array<Scalars['BigDecimal']>>;
  totalValueLockedUSD_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  totalValueLockedUSDUntracked?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedUSDUntracked_not?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedUSDUntracked_gt?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedUSDUntracked_lt?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedUSDUntracked_gte?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedUSDUntracked_lte?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedUSDUntracked_in?: Maybe<Array<Scalars['BigDecimal']>>;
  totalValueLockedUSDUntracked_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  derivedETH?: Maybe<Scalars['BigDecimal']>;
  derivedETH_not?: Maybe<Scalars['BigDecimal']>;
  derivedETH_gt?: Maybe<Scalars['BigDecimal']>;
  derivedETH_lt?: Maybe<Scalars['BigDecimal']>;
  derivedETH_gte?: Maybe<Scalars['BigDecimal']>;
  derivedETH_lte?: Maybe<Scalars['BigDecimal']>;
  derivedETH_in?: Maybe<Array<Scalars['BigDecimal']>>;
  derivedETH_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  whitelistPools?: Maybe<Array<Scalars['String']>>;
  whitelistPools_not?: Maybe<Array<Scalars['String']>>;
  whitelistPools_contains?: Maybe<Array<Scalars['String']>>;
  whitelistPools_contains_nocase?: Maybe<Array<Scalars['String']>>;
  whitelistPools_not_contains?: Maybe<Array<Scalars['String']>>;
  whitelistPools_not_contains_nocase?: Maybe<Array<Scalars['String']>>;
  whitelistPools_?: Maybe<Pool_Filter>;
  tokenDayData_?: Maybe<TokenDayData_Filter>;
  /** Filter for the block changed event. */
  _change_block?: Maybe<BlockChangedFilter>;
};

export enum Token_OrderBy {
  Id = 'id',
  Symbol = 'symbol',
  Name = 'name',
  Decimals = 'decimals',
  TotalSupply = 'totalSupply',
  Volume = 'volume',
  VolumeUsd = 'volumeUSD',
  UntrackedVolumeUsd = 'untrackedVolumeUSD',
  FeesUsd = 'feesUSD',
  TxCount = 'txCount',
  PoolCount = 'poolCount',
  TotalValueLocked = 'totalValueLocked',
  TotalValueLockedUsd = 'totalValueLockedUSD',
  TotalValueLockedUsdUntracked = 'totalValueLockedUSDUntracked',
  DerivedEth = 'derivedETH',
  WhitelistPools = 'whitelistPools',
  TokenDayData = 'tokenDayData'
}

export type Transaction = {
  __typename?: 'Transaction';
  id: Scalars['ID'];
  blockNumber: Scalars['BigInt'];
  timestamp: Scalars['BigInt'];
  gasUsed: Scalars['BigInt'];
  gasPrice: Scalars['BigInt'];
  mints: Array<Maybe<Mint>>;
  burns: Array<Maybe<Burn>>;
  swaps: Array<Maybe<Swap>>;
  flashed: Array<Maybe<Flash>>;
  collects: Array<Maybe<Collect>>;
};


export type TransactionMintsArgs = {
  skip?: Maybe<Scalars['Int']>;
  first?: Maybe<Scalars['Int']>;
  orderBy?: Maybe<Mint_OrderBy>;
  orderDirection?: Maybe<OrderDirection>;
  where?: Maybe<Mint_Filter>;
};


export type TransactionBurnsArgs = {
  skip?: Maybe<Scalars['Int']>;
  first?: Maybe<Scalars['Int']>;
  orderBy?: Maybe<Burn_OrderBy>;
  orderDirection?: Maybe<OrderDirection>;
  where?: Maybe<Burn_Filter>;
};


export type TransactionSwapsArgs = {
  skip?: Maybe<Scalars['Int']>;
  first?: Maybe<Scalars['Int']>;
  orderBy?: Maybe<Swap_OrderBy>;
  orderDirection?: Maybe<OrderDirection>;
  where?: Maybe<Swap_Filter>;
};


export type TransactionFlashedArgs = {
  skip?: Maybe<Scalars['Int']>;
  first?: Maybe<Scalars['Int']>;
  orderBy?: Maybe<Flash_OrderBy>;
  orderDirection?: Maybe<OrderDirection>;
  where?: Maybe<Flash_Filter>;
};


export type TransactionCollectsArgs = {
  skip?: Maybe<Scalars['Int']>;
  first?: Maybe<Scalars['Int']>;
  orderBy?: Maybe<Collect_OrderBy>;
  orderDirection?: Maybe<OrderDirection>;
  where?: Maybe<Collect_Filter>;
};

export type Transaction_Filter = {
  id?: Maybe<Scalars['ID']>;
  id_not?: Maybe<Scalars['ID']>;
  id_gt?: Maybe<Scalars['ID']>;
  id_lt?: Maybe<Scalars['ID']>;
  id_gte?: Maybe<Scalars['ID']>;
  id_lte?: Maybe<Scalars['ID']>;
  id_in?: Maybe<Array<Scalars['ID']>>;
  id_not_in?: Maybe<Array<Scalars['ID']>>;
  blockNumber?: Maybe<Scalars['BigInt']>;
  blockNumber_not?: Maybe<Scalars['BigInt']>;
  blockNumber_gt?: Maybe<Scalars['BigInt']>;
  blockNumber_lt?: Maybe<Scalars['BigInt']>;
  blockNumber_gte?: Maybe<Scalars['BigInt']>;
  blockNumber_lte?: Maybe<Scalars['BigInt']>;
  blockNumber_in?: Maybe<Array<Scalars['BigInt']>>;
  blockNumber_not_in?: Maybe<Array<Scalars['BigInt']>>;
  timestamp?: Maybe<Scalars['BigInt']>;
  timestamp_not?: Maybe<Scalars['BigInt']>;
  timestamp_gt?: Maybe<Scalars['BigInt']>;
  timestamp_lt?: Maybe<Scalars['BigInt']>;
  timestamp_gte?: Maybe<Scalars['BigInt']>;
  timestamp_lte?: Maybe<Scalars['BigInt']>;
  timestamp_in?: Maybe<Array<Scalars['BigInt']>>;
  timestamp_not_in?: Maybe<Array<Scalars['BigInt']>>;
  gasUsed?: Maybe<Scalars['BigInt']>;
  gasUsed_not?: Maybe<Scalars['BigInt']>;
  gasUsed_gt?: Maybe<Scalars['BigInt']>;
  gasUsed_lt?: Maybe<Scalars['BigInt']>;
  gasUsed_gte?: Maybe<Scalars['BigInt']>;
  gasUsed_lte?: Maybe<Scalars['BigInt']>;
  gasUsed_in?: Maybe<Array<Scalars['BigInt']>>;
  gasUsed_not_in?: Maybe<Array<Scalars['BigInt']>>;
  gasPrice?: Maybe<Scalars['BigInt']>;
  gasPrice_not?: Maybe<Scalars['BigInt']>;
  gasPrice_gt?: Maybe<Scalars['BigInt']>;
  gasPrice_lt?: Maybe<Scalars['BigInt']>;
  gasPrice_gte?: Maybe<Scalars['BigInt']>;
  gasPrice_lte?: Maybe<Scalars['BigInt']>;
  gasPrice_in?: Maybe<Array<Scalars['BigInt']>>;
  gasPrice_not_in?: Maybe<Array<Scalars['BigInt']>>;
  mints_?: Maybe<Mint_Filter>;
  burns_?: Maybe<Burn_Filter>;
  swaps_?: Maybe<Swap_Filter>;
  flashed_?: Maybe<Flash_Filter>;
  collects_?: Maybe<Collect_Filter>;
  /** Filter for the block changed event. */
  _change_block?: Maybe<BlockChangedFilter>;
};

export enum Transaction_OrderBy {
  Id = 'id',
  BlockNumber = 'blockNumber',
  Timestamp = 'timestamp',
  GasUsed = 'gasUsed',
  GasPrice = 'gasPrice',
  Mints = 'mints',
  Burns = 'burns',
  Swaps = 'swaps',
  Flashed = 'flashed',
  Collects = 'collects'
}

export type UniswapDayData = {
  __typename?: 'UniswapDayData';
  id: Scalars['ID'];
  date: Scalars['Int'];
  volumeETH: Scalars['BigDecimal'];
  volumeUSD: Scalars['BigDecimal'];
  volumeUSDUntracked: Scalars['BigDecimal'];
  feesUSD: Scalars['BigDecimal'];
  txCount: Scalars['BigInt'];
  tvlUSD: Scalars['BigDecimal'];
};

export type UniswapDayData_Filter = {
  id?: Maybe<Scalars['ID']>;
  id_not?: Maybe<Scalars['ID']>;
  id_gt?: Maybe<Scalars['ID']>;
  id_lt?: Maybe<Scalars['ID']>;
  id_gte?: Maybe<Scalars['ID']>;
  id_lte?: Maybe<Scalars['ID']>;
  id_in?: Maybe<Array<Scalars['ID']>>;
  id_not_in?: Maybe<Array<Scalars['ID']>>;
  date?: Maybe<Scalars['Int']>;
  date_not?: Maybe<Scalars['Int']>;
  date_gt?: Maybe<Scalars['Int']>;
  date_lt?: Maybe<Scalars['Int']>;
  date_gte?: Maybe<Scalars['Int']>;
  date_lte?: Maybe<Scalars['Int']>;
  date_in?: Maybe<Array<Scalars['Int']>>;
  date_not_in?: Maybe<Array<Scalars['Int']>>;
  volumeETH?: Maybe<Scalars['BigDecimal']>;
  volumeETH_not?: Maybe<Scalars['BigDecimal']>;
  volumeETH_gt?: Maybe<Scalars['BigDecimal']>;
  volumeETH_lt?: Maybe<Scalars['BigDecimal']>;
  volumeETH_gte?: Maybe<Scalars['BigDecimal']>;
  volumeETH_lte?: Maybe<Scalars['BigDecimal']>;
  volumeETH_in?: Maybe<Array<Scalars['BigDecimal']>>;
  volumeETH_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  volumeUSD?: Maybe<Scalars['BigDecimal']>;
  volumeUSD_not?: Maybe<Scalars['BigDecimal']>;
  volumeUSD_gt?: Maybe<Scalars['BigDecimal']>;
  volumeUSD_lt?: Maybe<Scalars['BigDecimal']>;
  volumeUSD_gte?: Maybe<Scalars['BigDecimal']>;
  volumeUSD_lte?: Maybe<Scalars['BigDecimal']>;
  volumeUSD_in?: Maybe<Array<Scalars['BigDecimal']>>;
  volumeUSD_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  volumeUSDUntracked?: Maybe<Scalars['BigDecimal']>;
  volumeUSDUntracked_not?: Maybe<Scalars['BigDecimal']>;
  volumeUSDUntracked_gt?: Maybe<Scalars['BigDecimal']>;
  volumeUSDUntracked_lt?: Maybe<Scalars['BigDecimal']>;
  volumeUSDUntracked_gte?: Maybe<Scalars['BigDecimal']>;
  volumeUSDUntracked_lte?: Maybe<Scalars['BigDecimal']>;
  volumeUSDUntracked_in?: Maybe<Array<Scalars['BigDecimal']>>;
  volumeUSDUntracked_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  feesUSD?: Maybe<Scalars['BigDecimal']>;
  feesUSD_not?: Maybe<Scalars['BigDecimal']>;
  feesUSD_gt?: Maybe<Scalars['BigDecimal']>;
  feesUSD_lt?: Maybe<Scalars['BigDecimal']>;
  feesUSD_gte?: Maybe<Scalars['BigDecimal']>;
  feesUSD_lte?: Maybe<Scalars['BigDecimal']>;
  feesUSD_in?: Maybe<Array<Scalars['BigDecimal']>>;
  feesUSD_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  txCount?: Maybe<Scalars['BigInt']>;
  txCount_not?: Maybe<Scalars['BigInt']>;
  txCount_gt?: Maybe<Scalars['BigInt']>;
  txCount_lt?: Maybe<Scalars['BigInt']>;
  txCount_gte?: Maybe<Scalars['BigInt']>;
  txCount_lte?: Maybe<Scalars['BigInt']>;
  txCount_in?: Maybe<Array<Scalars['BigInt']>>;
  txCount_not_in?: Maybe<Array<Scalars['BigInt']>>;
  tvlUSD?: Maybe<Scalars['BigDecimal']>;
  tvlUSD_not?: Maybe<Scalars['BigDecimal']>;
  tvlUSD_gt?: Maybe<Scalars['BigDecimal']>;
  tvlUSD_lt?: Maybe<Scalars['BigDecimal']>;
  tvlUSD_gte?: Maybe<Scalars['BigDecimal']>;
  tvlUSD_lte?: Maybe<Scalars['BigDecimal']>;
  tvlUSD_in?: Maybe<Array<Scalars['BigDecimal']>>;
  tvlUSD_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  /** Filter for the block changed event. */
  _change_block?: Maybe<BlockChangedFilter>;
};

export enum UniswapDayData_OrderBy {
  Id = 'id',
  Date = 'date',
  VolumeEth = 'volumeETH',
  VolumeUsd = 'volumeUSD',
  VolumeUsdUntracked = 'volumeUSDUntracked',
  FeesUsd = 'feesUSD',
  TxCount = 'txCount',
  TvlUsd = 'tvlUSD'
}

export type _Block_ = {
  __typename?: '_Block_';
  /** The hash of the block */
  hash?: Maybe<Scalars['Bytes']>;
  /** The block number */
  number: Scalars['Int'];
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

export type AllV3TicksQueryVariables = Exact<{
  poolAddress: Scalars['String'];
  skip: Scalars['Int'];
}>;


export type AllV3TicksQuery = (
  { __typename?: 'Query' }
  & { ticks: Array<(
    { __typename?: 'Tick' }
    & Pick<Tick, 'liquidityNet' | 'price0' | 'price1'>
    & { tick: Tick['tickIdx'] }
  )> }
);

export type FeeTierDistributionQueryVariables = Exact<{
  token0: Scalars['String'];
  token1: Scalars['String'];
}>;


export type FeeTierDistributionQuery = (
  { __typename?: 'Query' }
  & { _meta?: Maybe<(
    { __typename?: '_Meta_' }
    & { block: (
      { __typename?: '_Block_' }
      & Pick<_Block_, 'number'>
    ) }
  )>, asToken0: Array<(
    { __typename?: 'Pool' }
    & Pick<Pool, 'feeTier' | 'totalValueLockedToken0' | 'totalValueLockedToken1'>
  )>, asToken1: Array<(
    { __typename?: 'Pool' }
    & Pick<Pool, 'feeTier' | 'totalValueLockedToken0' | 'totalValueLockedToken1'>
  )> }
);


export const AllV3TicksDocument = `
    query allV3Ticks($poolAddress: String!, $skip: Int!) {
  ticks(
    first: 1000
    skip: $skip
    where: {poolAddress: $poolAddress}
    orderBy: tickIdx
  ) {
    tick: tickIdx
    liquidityNet
    price0
    price1
  }
}
    `;
export const FeeTierDistributionDocument = `
    query feeTierDistribution($token0: String!, $token1: String!) {
  _meta {
    block {
      number
    }
  }
  asToken0: pools(
    orderBy: totalValueLockedToken0
    orderDirection: desc
    where: {token0: $token0, token1: $token1}
  ) {
    feeTier
    totalValueLockedToken0
    totalValueLockedToken1
  }
  asToken1: pools(
    orderBy: totalValueLockedToken0
    orderDirection: desc
    where: {token0: $token1, token1: $token0}
  ) {
    feeTier
    totalValueLockedToken0
    totalValueLockedToken1
  }
}
    `;

const injectedRtkApi = api.injectEndpoints({
  endpoints: (build) => ({
    allV3Ticks: build.query<AllV3TicksQuery, AllV3TicksQueryVariables>({
      query: (variables) => ({ document: AllV3TicksDocument, variables })
    }),
    feeTierDistribution: build.query<FeeTierDistributionQuery, FeeTierDistributionQueryVariables>({
      query: (variables) => ({ document: FeeTierDistributionDocument, variables })
    }),
  }),
});

export { injectedRtkApi as api };
export const { useAllV3TicksQuery, useLazyAllV3TicksQuery, useFeeTierDistributionQuery, useLazyFeeTierDistributionQuery } = injectedRtkApi;

