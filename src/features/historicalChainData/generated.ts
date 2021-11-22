import { useQuery, UseQueryOptions } from 'react-query';
export type Maybe<T> = T | null;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };

function fetcher<TData, TVariables>(endpoint: string, requestInit: RequestInit, query: string, variables?: TVariables) {
  return async (): Promise<TData> => {
    const res = await fetch(endpoint, {
      method: 'POST',
      ...requestInit,
      body: JSON.stringify({ query, variables }),
    });

    const json = await res.json();

    if (json.errors) {
      const { message } = json.errors[0];

      throw new Error(message);
    }

    return json.data;
  }
}
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

export type Block_Height = {
  hash?: Maybe<Scalars['Bytes']>;
  number?: Maybe<Scalars['Int']>;
  number_gte?: Maybe<Scalars['Int']>;
};

export type Bundle = {
  __typename?: 'Bundle';
  ethPriceUSD: Scalars['BigDecimal'];
  id: Scalars['ID'];
};

export type Bundle_Filter = {
  ethPriceUSD?: Maybe<Scalars['BigDecimal']>;
  ethPriceUSD_gt?: Maybe<Scalars['BigDecimal']>;
  ethPriceUSD_gte?: Maybe<Scalars['BigDecimal']>;
  ethPriceUSD_in?: Maybe<Array<Scalars['BigDecimal']>>;
  ethPriceUSD_lt?: Maybe<Scalars['BigDecimal']>;
  ethPriceUSD_lte?: Maybe<Scalars['BigDecimal']>;
  ethPriceUSD_not?: Maybe<Scalars['BigDecimal']>;
  ethPriceUSD_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  id?: Maybe<Scalars['ID']>;
  id_gt?: Maybe<Scalars['ID']>;
  id_gte?: Maybe<Scalars['ID']>;
  id_in?: Maybe<Array<Scalars['ID']>>;
  id_lt?: Maybe<Scalars['ID']>;
  id_lte?: Maybe<Scalars['ID']>;
  id_not?: Maybe<Scalars['ID']>;
  id_not_in?: Maybe<Array<Scalars['ID']>>;
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
  amount?: Maybe<Scalars['BigInt']>;
  amount0?: Maybe<Scalars['BigDecimal']>;
  amount0_gt?: Maybe<Scalars['BigDecimal']>;
  amount0_gte?: Maybe<Scalars['BigDecimal']>;
  amount0_in?: Maybe<Array<Scalars['BigDecimal']>>;
  amount0_lt?: Maybe<Scalars['BigDecimal']>;
  amount0_lte?: Maybe<Scalars['BigDecimal']>;
  amount0_not?: Maybe<Scalars['BigDecimal']>;
  amount0_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  amount1?: Maybe<Scalars['BigDecimal']>;
  amount1_gt?: Maybe<Scalars['BigDecimal']>;
  amount1_gte?: Maybe<Scalars['BigDecimal']>;
  amount1_in?: Maybe<Array<Scalars['BigDecimal']>>;
  amount1_lt?: Maybe<Scalars['BigDecimal']>;
  amount1_lte?: Maybe<Scalars['BigDecimal']>;
  amount1_not?: Maybe<Scalars['BigDecimal']>;
  amount1_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  amountUSD?: Maybe<Scalars['BigDecimal']>;
  amountUSD_gt?: Maybe<Scalars['BigDecimal']>;
  amountUSD_gte?: Maybe<Scalars['BigDecimal']>;
  amountUSD_in?: Maybe<Array<Scalars['BigDecimal']>>;
  amountUSD_lt?: Maybe<Scalars['BigDecimal']>;
  amountUSD_lte?: Maybe<Scalars['BigDecimal']>;
  amountUSD_not?: Maybe<Scalars['BigDecimal']>;
  amountUSD_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  amount_gt?: Maybe<Scalars['BigInt']>;
  amount_gte?: Maybe<Scalars['BigInt']>;
  amount_in?: Maybe<Array<Scalars['BigInt']>>;
  amount_lt?: Maybe<Scalars['BigInt']>;
  amount_lte?: Maybe<Scalars['BigInt']>;
  amount_not?: Maybe<Scalars['BigInt']>;
  amount_not_in?: Maybe<Array<Scalars['BigInt']>>;
  id?: Maybe<Scalars['ID']>;
  id_gt?: Maybe<Scalars['ID']>;
  id_gte?: Maybe<Scalars['ID']>;
  id_in?: Maybe<Array<Scalars['ID']>>;
  id_lt?: Maybe<Scalars['ID']>;
  id_lte?: Maybe<Scalars['ID']>;
  id_not?: Maybe<Scalars['ID']>;
  id_not_in?: Maybe<Array<Scalars['ID']>>;
  logIndex?: Maybe<Scalars['BigInt']>;
  logIndex_gt?: Maybe<Scalars['BigInt']>;
  logIndex_gte?: Maybe<Scalars['BigInt']>;
  logIndex_in?: Maybe<Array<Scalars['BigInt']>>;
  logIndex_lt?: Maybe<Scalars['BigInt']>;
  logIndex_lte?: Maybe<Scalars['BigInt']>;
  logIndex_not?: Maybe<Scalars['BigInt']>;
  logIndex_not_in?: Maybe<Array<Scalars['BigInt']>>;
  origin?: Maybe<Scalars['Bytes']>;
  origin_contains?: Maybe<Scalars['Bytes']>;
  origin_in?: Maybe<Array<Scalars['Bytes']>>;
  origin_not?: Maybe<Scalars['Bytes']>;
  origin_not_contains?: Maybe<Scalars['Bytes']>;
  origin_not_in?: Maybe<Array<Scalars['Bytes']>>;
  owner?: Maybe<Scalars['Bytes']>;
  owner_contains?: Maybe<Scalars['Bytes']>;
  owner_in?: Maybe<Array<Scalars['Bytes']>>;
  owner_not?: Maybe<Scalars['Bytes']>;
  owner_not_contains?: Maybe<Scalars['Bytes']>;
  owner_not_in?: Maybe<Array<Scalars['Bytes']>>;
  pool?: Maybe<Scalars['String']>;
  pool_contains?: Maybe<Scalars['String']>;
  pool_ends_with?: Maybe<Scalars['String']>;
  pool_gt?: Maybe<Scalars['String']>;
  pool_gte?: Maybe<Scalars['String']>;
  pool_in?: Maybe<Array<Scalars['String']>>;
  pool_lt?: Maybe<Scalars['String']>;
  pool_lte?: Maybe<Scalars['String']>;
  pool_not?: Maybe<Scalars['String']>;
  pool_not_contains?: Maybe<Scalars['String']>;
  pool_not_ends_with?: Maybe<Scalars['String']>;
  pool_not_in?: Maybe<Array<Scalars['String']>>;
  pool_not_starts_with?: Maybe<Scalars['String']>;
  pool_starts_with?: Maybe<Scalars['String']>;
  tickLower?: Maybe<Scalars['BigInt']>;
  tickLower_gt?: Maybe<Scalars['BigInt']>;
  tickLower_gte?: Maybe<Scalars['BigInt']>;
  tickLower_in?: Maybe<Array<Scalars['BigInt']>>;
  tickLower_lt?: Maybe<Scalars['BigInt']>;
  tickLower_lte?: Maybe<Scalars['BigInt']>;
  tickLower_not?: Maybe<Scalars['BigInt']>;
  tickLower_not_in?: Maybe<Array<Scalars['BigInt']>>;
  tickUpper?: Maybe<Scalars['BigInt']>;
  tickUpper_gt?: Maybe<Scalars['BigInt']>;
  tickUpper_gte?: Maybe<Scalars['BigInt']>;
  tickUpper_in?: Maybe<Array<Scalars['BigInt']>>;
  tickUpper_lt?: Maybe<Scalars['BigInt']>;
  tickUpper_lte?: Maybe<Scalars['BigInt']>;
  tickUpper_not?: Maybe<Scalars['BigInt']>;
  tickUpper_not_in?: Maybe<Array<Scalars['BigInt']>>;
  timestamp?: Maybe<Scalars['BigInt']>;
  timestamp_gt?: Maybe<Scalars['BigInt']>;
  timestamp_gte?: Maybe<Scalars['BigInt']>;
  timestamp_in?: Maybe<Array<Scalars['BigInt']>>;
  timestamp_lt?: Maybe<Scalars['BigInt']>;
  timestamp_lte?: Maybe<Scalars['BigInt']>;
  timestamp_not?: Maybe<Scalars['BigInt']>;
  timestamp_not_in?: Maybe<Array<Scalars['BigInt']>>;
  token0?: Maybe<Scalars['String']>;
  token0_contains?: Maybe<Scalars['String']>;
  token0_ends_with?: Maybe<Scalars['String']>;
  token0_gt?: Maybe<Scalars['String']>;
  token0_gte?: Maybe<Scalars['String']>;
  token0_in?: Maybe<Array<Scalars['String']>>;
  token0_lt?: Maybe<Scalars['String']>;
  token0_lte?: Maybe<Scalars['String']>;
  token0_not?: Maybe<Scalars['String']>;
  token0_not_contains?: Maybe<Scalars['String']>;
  token0_not_ends_with?: Maybe<Scalars['String']>;
  token0_not_in?: Maybe<Array<Scalars['String']>>;
  token0_not_starts_with?: Maybe<Scalars['String']>;
  token0_starts_with?: Maybe<Scalars['String']>;
  token1?: Maybe<Scalars['String']>;
  token1_contains?: Maybe<Scalars['String']>;
  token1_ends_with?: Maybe<Scalars['String']>;
  token1_gt?: Maybe<Scalars['String']>;
  token1_gte?: Maybe<Scalars['String']>;
  token1_in?: Maybe<Array<Scalars['String']>>;
  token1_lt?: Maybe<Scalars['String']>;
  token1_lte?: Maybe<Scalars['String']>;
  token1_not?: Maybe<Scalars['String']>;
  token1_not_contains?: Maybe<Scalars['String']>;
  token1_not_ends_with?: Maybe<Scalars['String']>;
  token1_not_in?: Maybe<Array<Scalars['String']>>;
  token1_not_starts_with?: Maybe<Scalars['String']>;
  token1_starts_with?: Maybe<Scalars['String']>;
  transaction?: Maybe<Scalars['String']>;
  transaction_contains?: Maybe<Scalars['String']>;
  transaction_ends_with?: Maybe<Scalars['String']>;
  transaction_gt?: Maybe<Scalars['String']>;
  transaction_gte?: Maybe<Scalars['String']>;
  transaction_in?: Maybe<Array<Scalars['String']>>;
  transaction_lt?: Maybe<Scalars['String']>;
  transaction_lte?: Maybe<Scalars['String']>;
  transaction_not?: Maybe<Scalars['String']>;
  transaction_not_contains?: Maybe<Scalars['String']>;
  transaction_not_ends_with?: Maybe<Scalars['String']>;
  transaction_not_in?: Maybe<Array<Scalars['String']>>;
  transaction_not_starts_with?: Maybe<Scalars['String']>;
  transaction_starts_with?: Maybe<Scalars['String']>;
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
  TickLower = 'tickLower',
  TickUpper = 'tickUpper',
  Timestamp = 'timestamp',
  Token0 = 'token0',
  Token1 = 'token1',
  Transaction = 'transaction'
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
  amount0?: Maybe<Scalars['BigDecimal']>;
  amount0_gt?: Maybe<Scalars['BigDecimal']>;
  amount0_gte?: Maybe<Scalars['BigDecimal']>;
  amount0_in?: Maybe<Array<Scalars['BigDecimal']>>;
  amount0_lt?: Maybe<Scalars['BigDecimal']>;
  amount0_lte?: Maybe<Scalars['BigDecimal']>;
  amount0_not?: Maybe<Scalars['BigDecimal']>;
  amount0_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  amount1?: Maybe<Scalars['BigDecimal']>;
  amount1_gt?: Maybe<Scalars['BigDecimal']>;
  amount1_gte?: Maybe<Scalars['BigDecimal']>;
  amount1_in?: Maybe<Array<Scalars['BigDecimal']>>;
  amount1_lt?: Maybe<Scalars['BigDecimal']>;
  amount1_lte?: Maybe<Scalars['BigDecimal']>;
  amount1_not?: Maybe<Scalars['BigDecimal']>;
  amount1_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  amountUSD?: Maybe<Scalars['BigDecimal']>;
  amountUSD_gt?: Maybe<Scalars['BigDecimal']>;
  amountUSD_gte?: Maybe<Scalars['BigDecimal']>;
  amountUSD_in?: Maybe<Array<Scalars['BigDecimal']>>;
  amountUSD_lt?: Maybe<Scalars['BigDecimal']>;
  amountUSD_lte?: Maybe<Scalars['BigDecimal']>;
  amountUSD_not?: Maybe<Scalars['BigDecimal']>;
  amountUSD_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  id?: Maybe<Scalars['ID']>;
  id_gt?: Maybe<Scalars['ID']>;
  id_gte?: Maybe<Scalars['ID']>;
  id_in?: Maybe<Array<Scalars['ID']>>;
  id_lt?: Maybe<Scalars['ID']>;
  id_lte?: Maybe<Scalars['ID']>;
  id_not?: Maybe<Scalars['ID']>;
  id_not_in?: Maybe<Array<Scalars['ID']>>;
  logIndex?: Maybe<Scalars['BigInt']>;
  logIndex_gt?: Maybe<Scalars['BigInt']>;
  logIndex_gte?: Maybe<Scalars['BigInt']>;
  logIndex_in?: Maybe<Array<Scalars['BigInt']>>;
  logIndex_lt?: Maybe<Scalars['BigInt']>;
  logIndex_lte?: Maybe<Scalars['BigInt']>;
  logIndex_not?: Maybe<Scalars['BigInt']>;
  logIndex_not_in?: Maybe<Array<Scalars['BigInt']>>;
  owner?: Maybe<Scalars['Bytes']>;
  owner_contains?: Maybe<Scalars['Bytes']>;
  owner_in?: Maybe<Array<Scalars['Bytes']>>;
  owner_not?: Maybe<Scalars['Bytes']>;
  owner_not_contains?: Maybe<Scalars['Bytes']>;
  owner_not_in?: Maybe<Array<Scalars['Bytes']>>;
  pool?: Maybe<Scalars['String']>;
  pool_contains?: Maybe<Scalars['String']>;
  pool_ends_with?: Maybe<Scalars['String']>;
  pool_gt?: Maybe<Scalars['String']>;
  pool_gte?: Maybe<Scalars['String']>;
  pool_in?: Maybe<Array<Scalars['String']>>;
  pool_lt?: Maybe<Scalars['String']>;
  pool_lte?: Maybe<Scalars['String']>;
  pool_not?: Maybe<Scalars['String']>;
  pool_not_contains?: Maybe<Scalars['String']>;
  pool_not_ends_with?: Maybe<Scalars['String']>;
  pool_not_in?: Maybe<Array<Scalars['String']>>;
  pool_not_starts_with?: Maybe<Scalars['String']>;
  pool_starts_with?: Maybe<Scalars['String']>;
  tickLower?: Maybe<Scalars['BigInt']>;
  tickLower_gt?: Maybe<Scalars['BigInt']>;
  tickLower_gte?: Maybe<Scalars['BigInt']>;
  tickLower_in?: Maybe<Array<Scalars['BigInt']>>;
  tickLower_lt?: Maybe<Scalars['BigInt']>;
  tickLower_lte?: Maybe<Scalars['BigInt']>;
  tickLower_not?: Maybe<Scalars['BigInt']>;
  tickLower_not_in?: Maybe<Array<Scalars['BigInt']>>;
  tickUpper?: Maybe<Scalars['BigInt']>;
  tickUpper_gt?: Maybe<Scalars['BigInt']>;
  tickUpper_gte?: Maybe<Scalars['BigInt']>;
  tickUpper_in?: Maybe<Array<Scalars['BigInt']>>;
  tickUpper_lt?: Maybe<Scalars['BigInt']>;
  tickUpper_lte?: Maybe<Scalars['BigInt']>;
  tickUpper_not?: Maybe<Scalars['BigInt']>;
  tickUpper_not_in?: Maybe<Array<Scalars['BigInt']>>;
  timestamp?: Maybe<Scalars['BigInt']>;
  timestamp_gt?: Maybe<Scalars['BigInt']>;
  timestamp_gte?: Maybe<Scalars['BigInt']>;
  timestamp_in?: Maybe<Array<Scalars['BigInt']>>;
  timestamp_lt?: Maybe<Scalars['BigInt']>;
  timestamp_lte?: Maybe<Scalars['BigInt']>;
  timestamp_not?: Maybe<Scalars['BigInt']>;
  timestamp_not_in?: Maybe<Array<Scalars['BigInt']>>;
  transaction?: Maybe<Scalars['String']>;
  transaction_contains?: Maybe<Scalars['String']>;
  transaction_ends_with?: Maybe<Scalars['String']>;
  transaction_gt?: Maybe<Scalars['String']>;
  transaction_gte?: Maybe<Scalars['String']>;
  transaction_in?: Maybe<Array<Scalars['String']>>;
  transaction_lt?: Maybe<Scalars['String']>;
  transaction_lte?: Maybe<Scalars['String']>;
  transaction_not?: Maybe<Scalars['String']>;
  transaction_not_contains?: Maybe<Scalars['String']>;
  transaction_not_ends_with?: Maybe<Scalars['String']>;
  transaction_not_in?: Maybe<Array<Scalars['String']>>;
  transaction_not_starts_with?: Maybe<Scalars['String']>;
  transaction_starts_with?: Maybe<Scalars['String']>;
};

export enum Collect_OrderBy {
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
  Transaction = 'transaction'
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
  id?: Maybe<Scalars['ID']>;
  id_gt?: Maybe<Scalars['ID']>;
  id_gte?: Maybe<Scalars['ID']>;
  id_in?: Maybe<Array<Scalars['ID']>>;
  id_lt?: Maybe<Scalars['ID']>;
  id_lte?: Maybe<Scalars['ID']>;
  id_not?: Maybe<Scalars['ID']>;
  id_not_in?: Maybe<Array<Scalars['ID']>>;
  owner?: Maybe<Scalars['ID']>;
  owner_gt?: Maybe<Scalars['ID']>;
  owner_gte?: Maybe<Scalars['ID']>;
  owner_in?: Maybe<Array<Scalars['ID']>>;
  owner_lt?: Maybe<Scalars['ID']>;
  owner_lte?: Maybe<Scalars['ID']>;
  owner_not?: Maybe<Scalars['ID']>;
  owner_not_in?: Maybe<Array<Scalars['ID']>>;
  poolCount?: Maybe<Scalars['BigInt']>;
  poolCount_gt?: Maybe<Scalars['BigInt']>;
  poolCount_gte?: Maybe<Scalars['BigInt']>;
  poolCount_in?: Maybe<Array<Scalars['BigInt']>>;
  poolCount_lt?: Maybe<Scalars['BigInt']>;
  poolCount_lte?: Maybe<Scalars['BigInt']>;
  poolCount_not?: Maybe<Scalars['BigInt']>;
  poolCount_not_in?: Maybe<Array<Scalars['BigInt']>>;
  totalFeesETH?: Maybe<Scalars['BigDecimal']>;
  totalFeesETH_gt?: Maybe<Scalars['BigDecimal']>;
  totalFeesETH_gte?: Maybe<Scalars['BigDecimal']>;
  totalFeesETH_in?: Maybe<Array<Scalars['BigDecimal']>>;
  totalFeesETH_lt?: Maybe<Scalars['BigDecimal']>;
  totalFeesETH_lte?: Maybe<Scalars['BigDecimal']>;
  totalFeesETH_not?: Maybe<Scalars['BigDecimal']>;
  totalFeesETH_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  totalFeesUSD?: Maybe<Scalars['BigDecimal']>;
  totalFeesUSD_gt?: Maybe<Scalars['BigDecimal']>;
  totalFeesUSD_gte?: Maybe<Scalars['BigDecimal']>;
  totalFeesUSD_in?: Maybe<Array<Scalars['BigDecimal']>>;
  totalFeesUSD_lt?: Maybe<Scalars['BigDecimal']>;
  totalFeesUSD_lte?: Maybe<Scalars['BigDecimal']>;
  totalFeesUSD_not?: Maybe<Scalars['BigDecimal']>;
  totalFeesUSD_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  totalValueLockedETH?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedETHUntracked?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedETHUntracked_gt?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedETHUntracked_gte?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedETHUntracked_in?: Maybe<Array<Scalars['BigDecimal']>>;
  totalValueLockedETHUntracked_lt?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedETHUntracked_lte?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedETHUntracked_not?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedETHUntracked_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  totalValueLockedETH_gt?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedETH_gte?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedETH_in?: Maybe<Array<Scalars['BigDecimal']>>;
  totalValueLockedETH_lt?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedETH_lte?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedETH_not?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedETH_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  totalValueLockedUSD?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedUSDUntracked?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedUSDUntracked_gt?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedUSDUntracked_gte?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedUSDUntracked_in?: Maybe<Array<Scalars['BigDecimal']>>;
  totalValueLockedUSDUntracked_lt?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedUSDUntracked_lte?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedUSDUntracked_not?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedUSDUntracked_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  totalValueLockedUSD_gt?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedUSD_gte?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedUSD_in?: Maybe<Array<Scalars['BigDecimal']>>;
  totalValueLockedUSD_lt?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedUSD_lte?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedUSD_not?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedUSD_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  totalVolumeETH?: Maybe<Scalars['BigDecimal']>;
  totalVolumeETH_gt?: Maybe<Scalars['BigDecimal']>;
  totalVolumeETH_gte?: Maybe<Scalars['BigDecimal']>;
  totalVolumeETH_in?: Maybe<Array<Scalars['BigDecimal']>>;
  totalVolumeETH_lt?: Maybe<Scalars['BigDecimal']>;
  totalVolumeETH_lte?: Maybe<Scalars['BigDecimal']>;
  totalVolumeETH_not?: Maybe<Scalars['BigDecimal']>;
  totalVolumeETH_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  totalVolumeUSD?: Maybe<Scalars['BigDecimal']>;
  totalVolumeUSD_gt?: Maybe<Scalars['BigDecimal']>;
  totalVolumeUSD_gte?: Maybe<Scalars['BigDecimal']>;
  totalVolumeUSD_in?: Maybe<Array<Scalars['BigDecimal']>>;
  totalVolumeUSD_lt?: Maybe<Scalars['BigDecimal']>;
  totalVolumeUSD_lte?: Maybe<Scalars['BigDecimal']>;
  totalVolumeUSD_not?: Maybe<Scalars['BigDecimal']>;
  totalVolumeUSD_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  txCount?: Maybe<Scalars['BigInt']>;
  txCount_gt?: Maybe<Scalars['BigInt']>;
  txCount_gte?: Maybe<Scalars['BigInt']>;
  txCount_in?: Maybe<Array<Scalars['BigInt']>>;
  txCount_lt?: Maybe<Scalars['BigInt']>;
  txCount_lte?: Maybe<Scalars['BigInt']>;
  txCount_not?: Maybe<Scalars['BigInt']>;
  txCount_not_in?: Maybe<Array<Scalars['BigInt']>>;
  untrackedVolumeUSD?: Maybe<Scalars['BigDecimal']>;
  untrackedVolumeUSD_gt?: Maybe<Scalars['BigDecimal']>;
  untrackedVolumeUSD_gte?: Maybe<Scalars['BigDecimal']>;
  untrackedVolumeUSD_in?: Maybe<Array<Scalars['BigDecimal']>>;
  untrackedVolumeUSD_lt?: Maybe<Scalars['BigDecimal']>;
  untrackedVolumeUSD_lte?: Maybe<Scalars['BigDecimal']>;
  untrackedVolumeUSD_not?: Maybe<Scalars['BigDecimal']>;
  untrackedVolumeUSD_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
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
  amount0?: Maybe<Scalars['BigDecimal']>;
  amount0Paid?: Maybe<Scalars['BigDecimal']>;
  amount0Paid_gt?: Maybe<Scalars['BigDecimal']>;
  amount0Paid_gte?: Maybe<Scalars['BigDecimal']>;
  amount0Paid_in?: Maybe<Array<Scalars['BigDecimal']>>;
  amount0Paid_lt?: Maybe<Scalars['BigDecimal']>;
  amount0Paid_lte?: Maybe<Scalars['BigDecimal']>;
  amount0Paid_not?: Maybe<Scalars['BigDecimal']>;
  amount0Paid_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  amount0_gt?: Maybe<Scalars['BigDecimal']>;
  amount0_gte?: Maybe<Scalars['BigDecimal']>;
  amount0_in?: Maybe<Array<Scalars['BigDecimal']>>;
  amount0_lt?: Maybe<Scalars['BigDecimal']>;
  amount0_lte?: Maybe<Scalars['BigDecimal']>;
  amount0_not?: Maybe<Scalars['BigDecimal']>;
  amount0_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  amount1?: Maybe<Scalars['BigDecimal']>;
  amount1Paid?: Maybe<Scalars['BigDecimal']>;
  amount1Paid_gt?: Maybe<Scalars['BigDecimal']>;
  amount1Paid_gte?: Maybe<Scalars['BigDecimal']>;
  amount1Paid_in?: Maybe<Array<Scalars['BigDecimal']>>;
  amount1Paid_lt?: Maybe<Scalars['BigDecimal']>;
  amount1Paid_lte?: Maybe<Scalars['BigDecimal']>;
  amount1Paid_not?: Maybe<Scalars['BigDecimal']>;
  amount1Paid_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  amount1_gt?: Maybe<Scalars['BigDecimal']>;
  amount1_gte?: Maybe<Scalars['BigDecimal']>;
  amount1_in?: Maybe<Array<Scalars['BigDecimal']>>;
  amount1_lt?: Maybe<Scalars['BigDecimal']>;
  amount1_lte?: Maybe<Scalars['BigDecimal']>;
  amount1_not?: Maybe<Scalars['BigDecimal']>;
  amount1_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  amountUSD?: Maybe<Scalars['BigDecimal']>;
  amountUSD_gt?: Maybe<Scalars['BigDecimal']>;
  amountUSD_gte?: Maybe<Scalars['BigDecimal']>;
  amountUSD_in?: Maybe<Array<Scalars['BigDecimal']>>;
  amountUSD_lt?: Maybe<Scalars['BigDecimal']>;
  amountUSD_lte?: Maybe<Scalars['BigDecimal']>;
  amountUSD_not?: Maybe<Scalars['BigDecimal']>;
  amountUSD_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  id?: Maybe<Scalars['ID']>;
  id_gt?: Maybe<Scalars['ID']>;
  id_gte?: Maybe<Scalars['ID']>;
  id_in?: Maybe<Array<Scalars['ID']>>;
  id_lt?: Maybe<Scalars['ID']>;
  id_lte?: Maybe<Scalars['ID']>;
  id_not?: Maybe<Scalars['ID']>;
  id_not_in?: Maybe<Array<Scalars['ID']>>;
  logIndex?: Maybe<Scalars['BigInt']>;
  logIndex_gt?: Maybe<Scalars['BigInt']>;
  logIndex_gte?: Maybe<Scalars['BigInt']>;
  logIndex_in?: Maybe<Array<Scalars['BigInt']>>;
  logIndex_lt?: Maybe<Scalars['BigInt']>;
  logIndex_lte?: Maybe<Scalars['BigInt']>;
  logIndex_not?: Maybe<Scalars['BigInt']>;
  logIndex_not_in?: Maybe<Array<Scalars['BigInt']>>;
  pool?: Maybe<Scalars['String']>;
  pool_contains?: Maybe<Scalars['String']>;
  pool_ends_with?: Maybe<Scalars['String']>;
  pool_gt?: Maybe<Scalars['String']>;
  pool_gte?: Maybe<Scalars['String']>;
  pool_in?: Maybe<Array<Scalars['String']>>;
  pool_lt?: Maybe<Scalars['String']>;
  pool_lte?: Maybe<Scalars['String']>;
  pool_not?: Maybe<Scalars['String']>;
  pool_not_contains?: Maybe<Scalars['String']>;
  pool_not_ends_with?: Maybe<Scalars['String']>;
  pool_not_in?: Maybe<Array<Scalars['String']>>;
  pool_not_starts_with?: Maybe<Scalars['String']>;
  pool_starts_with?: Maybe<Scalars['String']>;
  recipient?: Maybe<Scalars['Bytes']>;
  recipient_contains?: Maybe<Scalars['Bytes']>;
  recipient_in?: Maybe<Array<Scalars['Bytes']>>;
  recipient_not?: Maybe<Scalars['Bytes']>;
  recipient_not_contains?: Maybe<Scalars['Bytes']>;
  recipient_not_in?: Maybe<Array<Scalars['Bytes']>>;
  sender?: Maybe<Scalars['Bytes']>;
  sender_contains?: Maybe<Scalars['Bytes']>;
  sender_in?: Maybe<Array<Scalars['Bytes']>>;
  sender_not?: Maybe<Scalars['Bytes']>;
  sender_not_contains?: Maybe<Scalars['Bytes']>;
  sender_not_in?: Maybe<Array<Scalars['Bytes']>>;
  timestamp?: Maybe<Scalars['BigInt']>;
  timestamp_gt?: Maybe<Scalars['BigInt']>;
  timestamp_gte?: Maybe<Scalars['BigInt']>;
  timestamp_in?: Maybe<Array<Scalars['BigInt']>>;
  timestamp_lt?: Maybe<Scalars['BigInt']>;
  timestamp_lte?: Maybe<Scalars['BigInt']>;
  timestamp_not?: Maybe<Scalars['BigInt']>;
  timestamp_not_in?: Maybe<Array<Scalars['BigInt']>>;
  transaction?: Maybe<Scalars['String']>;
  transaction_contains?: Maybe<Scalars['String']>;
  transaction_ends_with?: Maybe<Scalars['String']>;
  transaction_gt?: Maybe<Scalars['String']>;
  transaction_gte?: Maybe<Scalars['String']>;
  transaction_in?: Maybe<Array<Scalars['String']>>;
  transaction_lt?: Maybe<Scalars['String']>;
  transaction_lte?: Maybe<Scalars['String']>;
  transaction_not?: Maybe<Scalars['String']>;
  transaction_not_contains?: Maybe<Scalars['String']>;
  transaction_not_ends_with?: Maybe<Scalars['String']>;
  transaction_not_in?: Maybe<Array<Scalars['String']>>;
  transaction_not_starts_with?: Maybe<Scalars['String']>;
  transaction_starts_with?: Maybe<Scalars['String']>;
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
  Recipient = 'recipient',
  Sender = 'sender',
  Timestamp = 'timestamp',
  Transaction = 'transaction'
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
  amount?: Maybe<Scalars['BigInt']>;
  amount0?: Maybe<Scalars['BigDecimal']>;
  amount0_gt?: Maybe<Scalars['BigDecimal']>;
  amount0_gte?: Maybe<Scalars['BigDecimal']>;
  amount0_in?: Maybe<Array<Scalars['BigDecimal']>>;
  amount0_lt?: Maybe<Scalars['BigDecimal']>;
  amount0_lte?: Maybe<Scalars['BigDecimal']>;
  amount0_not?: Maybe<Scalars['BigDecimal']>;
  amount0_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  amount1?: Maybe<Scalars['BigDecimal']>;
  amount1_gt?: Maybe<Scalars['BigDecimal']>;
  amount1_gte?: Maybe<Scalars['BigDecimal']>;
  amount1_in?: Maybe<Array<Scalars['BigDecimal']>>;
  amount1_lt?: Maybe<Scalars['BigDecimal']>;
  amount1_lte?: Maybe<Scalars['BigDecimal']>;
  amount1_not?: Maybe<Scalars['BigDecimal']>;
  amount1_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  amountUSD?: Maybe<Scalars['BigDecimal']>;
  amountUSD_gt?: Maybe<Scalars['BigDecimal']>;
  amountUSD_gte?: Maybe<Scalars['BigDecimal']>;
  amountUSD_in?: Maybe<Array<Scalars['BigDecimal']>>;
  amountUSD_lt?: Maybe<Scalars['BigDecimal']>;
  amountUSD_lte?: Maybe<Scalars['BigDecimal']>;
  amountUSD_not?: Maybe<Scalars['BigDecimal']>;
  amountUSD_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  amount_gt?: Maybe<Scalars['BigInt']>;
  amount_gte?: Maybe<Scalars['BigInt']>;
  amount_in?: Maybe<Array<Scalars['BigInt']>>;
  amount_lt?: Maybe<Scalars['BigInt']>;
  amount_lte?: Maybe<Scalars['BigInt']>;
  amount_not?: Maybe<Scalars['BigInt']>;
  amount_not_in?: Maybe<Array<Scalars['BigInt']>>;
  id?: Maybe<Scalars['ID']>;
  id_gt?: Maybe<Scalars['ID']>;
  id_gte?: Maybe<Scalars['ID']>;
  id_in?: Maybe<Array<Scalars['ID']>>;
  id_lt?: Maybe<Scalars['ID']>;
  id_lte?: Maybe<Scalars['ID']>;
  id_not?: Maybe<Scalars['ID']>;
  id_not_in?: Maybe<Array<Scalars['ID']>>;
  logIndex?: Maybe<Scalars['BigInt']>;
  logIndex_gt?: Maybe<Scalars['BigInt']>;
  logIndex_gte?: Maybe<Scalars['BigInt']>;
  logIndex_in?: Maybe<Array<Scalars['BigInt']>>;
  logIndex_lt?: Maybe<Scalars['BigInt']>;
  logIndex_lte?: Maybe<Scalars['BigInt']>;
  logIndex_not?: Maybe<Scalars['BigInt']>;
  logIndex_not_in?: Maybe<Array<Scalars['BigInt']>>;
  origin?: Maybe<Scalars['Bytes']>;
  origin_contains?: Maybe<Scalars['Bytes']>;
  origin_in?: Maybe<Array<Scalars['Bytes']>>;
  origin_not?: Maybe<Scalars['Bytes']>;
  origin_not_contains?: Maybe<Scalars['Bytes']>;
  origin_not_in?: Maybe<Array<Scalars['Bytes']>>;
  owner?: Maybe<Scalars['Bytes']>;
  owner_contains?: Maybe<Scalars['Bytes']>;
  owner_in?: Maybe<Array<Scalars['Bytes']>>;
  owner_not?: Maybe<Scalars['Bytes']>;
  owner_not_contains?: Maybe<Scalars['Bytes']>;
  owner_not_in?: Maybe<Array<Scalars['Bytes']>>;
  pool?: Maybe<Scalars['String']>;
  pool_contains?: Maybe<Scalars['String']>;
  pool_ends_with?: Maybe<Scalars['String']>;
  pool_gt?: Maybe<Scalars['String']>;
  pool_gte?: Maybe<Scalars['String']>;
  pool_in?: Maybe<Array<Scalars['String']>>;
  pool_lt?: Maybe<Scalars['String']>;
  pool_lte?: Maybe<Scalars['String']>;
  pool_not?: Maybe<Scalars['String']>;
  pool_not_contains?: Maybe<Scalars['String']>;
  pool_not_ends_with?: Maybe<Scalars['String']>;
  pool_not_in?: Maybe<Array<Scalars['String']>>;
  pool_not_starts_with?: Maybe<Scalars['String']>;
  pool_starts_with?: Maybe<Scalars['String']>;
  sender?: Maybe<Scalars['Bytes']>;
  sender_contains?: Maybe<Scalars['Bytes']>;
  sender_in?: Maybe<Array<Scalars['Bytes']>>;
  sender_not?: Maybe<Scalars['Bytes']>;
  sender_not_contains?: Maybe<Scalars['Bytes']>;
  sender_not_in?: Maybe<Array<Scalars['Bytes']>>;
  tickLower?: Maybe<Scalars['BigInt']>;
  tickLower_gt?: Maybe<Scalars['BigInt']>;
  tickLower_gte?: Maybe<Scalars['BigInt']>;
  tickLower_in?: Maybe<Array<Scalars['BigInt']>>;
  tickLower_lt?: Maybe<Scalars['BigInt']>;
  tickLower_lte?: Maybe<Scalars['BigInt']>;
  tickLower_not?: Maybe<Scalars['BigInt']>;
  tickLower_not_in?: Maybe<Array<Scalars['BigInt']>>;
  tickUpper?: Maybe<Scalars['BigInt']>;
  tickUpper_gt?: Maybe<Scalars['BigInt']>;
  tickUpper_gte?: Maybe<Scalars['BigInt']>;
  tickUpper_in?: Maybe<Array<Scalars['BigInt']>>;
  tickUpper_lt?: Maybe<Scalars['BigInt']>;
  tickUpper_lte?: Maybe<Scalars['BigInt']>;
  tickUpper_not?: Maybe<Scalars['BigInt']>;
  tickUpper_not_in?: Maybe<Array<Scalars['BigInt']>>;
  timestamp?: Maybe<Scalars['BigInt']>;
  timestamp_gt?: Maybe<Scalars['BigInt']>;
  timestamp_gte?: Maybe<Scalars['BigInt']>;
  timestamp_in?: Maybe<Array<Scalars['BigInt']>>;
  timestamp_lt?: Maybe<Scalars['BigInt']>;
  timestamp_lte?: Maybe<Scalars['BigInt']>;
  timestamp_not?: Maybe<Scalars['BigInt']>;
  timestamp_not_in?: Maybe<Array<Scalars['BigInt']>>;
  token0?: Maybe<Scalars['String']>;
  token0_contains?: Maybe<Scalars['String']>;
  token0_ends_with?: Maybe<Scalars['String']>;
  token0_gt?: Maybe<Scalars['String']>;
  token0_gte?: Maybe<Scalars['String']>;
  token0_in?: Maybe<Array<Scalars['String']>>;
  token0_lt?: Maybe<Scalars['String']>;
  token0_lte?: Maybe<Scalars['String']>;
  token0_not?: Maybe<Scalars['String']>;
  token0_not_contains?: Maybe<Scalars['String']>;
  token0_not_ends_with?: Maybe<Scalars['String']>;
  token0_not_in?: Maybe<Array<Scalars['String']>>;
  token0_not_starts_with?: Maybe<Scalars['String']>;
  token0_starts_with?: Maybe<Scalars['String']>;
  token1?: Maybe<Scalars['String']>;
  token1_contains?: Maybe<Scalars['String']>;
  token1_ends_with?: Maybe<Scalars['String']>;
  token1_gt?: Maybe<Scalars['String']>;
  token1_gte?: Maybe<Scalars['String']>;
  token1_in?: Maybe<Array<Scalars['String']>>;
  token1_lt?: Maybe<Scalars['String']>;
  token1_lte?: Maybe<Scalars['String']>;
  token1_not?: Maybe<Scalars['String']>;
  token1_not_contains?: Maybe<Scalars['String']>;
  token1_not_ends_with?: Maybe<Scalars['String']>;
  token1_not_in?: Maybe<Array<Scalars['String']>>;
  token1_not_starts_with?: Maybe<Scalars['String']>;
  token1_starts_with?: Maybe<Scalars['String']>;
  transaction?: Maybe<Scalars['String']>;
  transaction_contains?: Maybe<Scalars['String']>;
  transaction_ends_with?: Maybe<Scalars['String']>;
  transaction_gt?: Maybe<Scalars['String']>;
  transaction_gte?: Maybe<Scalars['String']>;
  transaction_in?: Maybe<Array<Scalars['String']>>;
  transaction_lt?: Maybe<Scalars['String']>;
  transaction_lte?: Maybe<Scalars['String']>;
  transaction_not?: Maybe<Scalars['String']>;
  transaction_not_contains?: Maybe<Scalars['String']>;
  transaction_not_ends_with?: Maybe<Scalars['String']>;
  transaction_not_in?: Maybe<Array<Scalars['String']>>;
  transaction_not_starts_with?: Maybe<Scalars['String']>;
  transaction_starts_with?: Maybe<Scalars['String']>;
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
  Sender = 'sender',
  TickLower = 'tickLower',
  TickUpper = 'tickUpper',
  Timestamp = 'timestamp',
  Token0 = 'token0',
  Token1 = 'token1',
  Transaction = 'transaction'
}

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
  feeGrowthGlobal0X128: Scalars['BigInt'];
  feeGrowthGlobal1X128: Scalars['BigInt'];
  feeTier: Scalars['BigInt'];
  feesUSD: Scalars['BigDecimal'];
  id: Scalars['ID'];
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
  first?: Maybe<Scalars['Int']>;
  orderBy?: Maybe<Burn_OrderBy>;
  orderDirection?: Maybe<OrderDirection>;
  skip?: Maybe<Scalars['Int']>;
  where?: Maybe<Burn_Filter>;
};


export type PoolCollectsArgs = {
  first?: Maybe<Scalars['Int']>;
  orderBy?: Maybe<Collect_OrderBy>;
  orderDirection?: Maybe<OrderDirection>;
  skip?: Maybe<Scalars['Int']>;
  where?: Maybe<Collect_Filter>;
};


export type PoolMintsArgs = {
  first?: Maybe<Scalars['Int']>;
  orderBy?: Maybe<Mint_OrderBy>;
  orderDirection?: Maybe<OrderDirection>;
  skip?: Maybe<Scalars['Int']>;
  where?: Maybe<Mint_Filter>;
};


export type PoolPoolDayDataArgs = {
  first?: Maybe<Scalars['Int']>;
  orderBy?: Maybe<PoolDayData_OrderBy>;
  orderDirection?: Maybe<OrderDirection>;
  skip?: Maybe<Scalars['Int']>;
  where?: Maybe<PoolDayData_Filter>;
};


export type PoolPoolHourDataArgs = {
  first?: Maybe<Scalars['Int']>;
  orderBy?: Maybe<PoolHourData_OrderBy>;
  orderDirection?: Maybe<OrderDirection>;
  skip?: Maybe<Scalars['Int']>;
  where?: Maybe<PoolHourData_Filter>;
};


export type PoolSwapsArgs = {
  first?: Maybe<Scalars['Int']>;
  orderBy?: Maybe<Swap_OrderBy>;
  orderDirection?: Maybe<OrderDirection>;
  skip?: Maybe<Scalars['Int']>;
  where?: Maybe<Swap_Filter>;
};


export type PoolTicksArgs = {
  first?: Maybe<Scalars['Int']>;
  orderBy?: Maybe<Tick_OrderBy>;
  orderDirection?: Maybe<OrderDirection>;
  skip?: Maybe<Scalars['Int']>;
  where?: Maybe<Tick_Filter>;
};

export type PoolDayData = {
  __typename?: 'PoolDayData';
  close: Scalars['BigDecimal'];
  date: Scalars['Int'];
  feeGrowthGlobal0X128: Scalars['BigInt'];
  feeGrowthGlobal1X128: Scalars['BigInt'];
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
  close?: Maybe<Scalars['BigDecimal']>;
  close_gt?: Maybe<Scalars['BigDecimal']>;
  close_gte?: Maybe<Scalars['BigDecimal']>;
  close_in?: Maybe<Array<Scalars['BigDecimal']>>;
  close_lt?: Maybe<Scalars['BigDecimal']>;
  close_lte?: Maybe<Scalars['BigDecimal']>;
  close_not?: Maybe<Scalars['BigDecimal']>;
  close_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  date?: Maybe<Scalars['Int']>;
  date_gt?: Maybe<Scalars['Int']>;
  date_gte?: Maybe<Scalars['Int']>;
  date_in?: Maybe<Array<Scalars['Int']>>;
  date_lt?: Maybe<Scalars['Int']>;
  date_lte?: Maybe<Scalars['Int']>;
  date_not?: Maybe<Scalars['Int']>;
  date_not_in?: Maybe<Array<Scalars['Int']>>;
  feeGrowthGlobal0X128?: Maybe<Scalars['BigInt']>;
  feeGrowthGlobal0X128_gt?: Maybe<Scalars['BigInt']>;
  feeGrowthGlobal0X128_gte?: Maybe<Scalars['BigInt']>;
  feeGrowthGlobal0X128_in?: Maybe<Array<Scalars['BigInt']>>;
  feeGrowthGlobal0X128_lt?: Maybe<Scalars['BigInt']>;
  feeGrowthGlobal0X128_lte?: Maybe<Scalars['BigInt']>;
  feeGrowthGlobal0X128_not?: Maybe<Scalars['BigInt']>;
  feeGrowthGlobal0X128_not_in?: Maybe<Array<Scalars['BigInt']>>;
  feeGrowthGlobal1X128?: Maybe<Scalars['BigInt']>;
  feeGrowthGlobal1X128_gt?: Maybe<Scalars['BigInt']>;
  feeGrowthGlobal1X128_gte?: Maybe<Scalars['BigInt']>;
  feeGrowthGlobal1X128_in?: Maybe<Array<Scalars['BigInt']>>;
  feeGrowthGlobal1X128_lt?: Maybe<Scalars['BigInt']>;
  feeGrowthGlobal1X128_lte?: Maybe<Scalars['BigInt']>;
  feeGrowthGlobal1X128_not?: Maybe<Scalars['BigInt']>;
  feeGrowthGlobal1X128_not_in?: Maybe<Array<Scalars['BigInt']>>;
  feesUSD?: Maybe<Scalars['BigDecimal']>;
  feesUSD_gt?: Maybe<Scalars['BigDecimal']>;
  feesUSD_gte?: Maybe<Scalars['BigDecimal']>;
  feesUSD_in?: Maybe<Array<Scalars['BigDecimal']>>;
  feesUSD_lt?: Maybe<Scalars['BigDecimal']>;
  feesUSD_lte?: Maybe<Scalars['BigDecimal']>;
  feesUSD_not?: Maybe<Scalars['BigDecimal']>;
  feesUSD_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  high?: Maybe<Scalars['BigDecimal']>;
  high_gt?: Maybe<Scalars['BigDecimal']>;
  high_gte?: Maybe<Scalars['BigDecimal']>;
  high_in?: Maybe<Array<Scalars['BigDecimal']>>;
  high_lt?: Maybe<Scalars['BigDecimal']>;
  high_lte?: Maybe<Scalars['BigDecimal']>;
  high_not?: Maybe<Scalars['BigDecimal']>;
  high_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  id?: Maybe<Scalars['ID']>;
  id_gt?: Maybe<Scalars['ID']>;
  id_gte?: Maybe<Scalars['ID']>;
  id_in?: Maybe<Array<Scalars['ID']>>;
  id_lt?: Maybe<Scalars['ID']>;
  id_lte?: Maybe<Scalars['ID']>;
  id_not?: Maybe<Scalars['ID']>;
  id_not_in?: Maybe<Array<Scalars['ID']>>;
  liquidity?: Maybe<Scalars['BigInt']>;
  liquidity_gt?: Maybe<Scalars['BigInt']>;
  liquidity_gte?: Maybe<Scalars['BigInt']>;
  liquidity_in?: Maybe<Array<Scalars['BigInt']>>;
  liquidity_lt?: Maybe<Scalars['BigInt']>;
  liquidity_lte?: Maybe<Scalars['BigInt']>;
  liquidity_not?: Maybe<Scalars['BigInt']>;
  liquidity_not_in?: Maybe<Array<Scalars['BigInt']>>;
  low?: Maybe<Scalars['BigDecimal']>;
  low_gt?: Maybe<Scalars['BigDecimal']>;
  low_gte?: Maybe<Scalars['BigDecimal']>;
  low_in?: Maybe<Array<Scalars['BigDecimal']>>;
  low_lt?: Maybe<Scalars['BigDecimal']>;
  low_lte?: Maybe<Scalars['BigDecimal']>;
  low_not?: Maybe<Scalars['BigDecimal']>;
  low_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  open?: Maybe<Scalars['BigDecimal']>;
  open_gt?: Maybe<Scalars['BigDecimal']>;
  open_gte?: Maybe<Scalars['BigDecimal']>;
  open_in?: Maybe<Array<Scalars['BigDecimal']>>;
  open_lt?: Maybe<Scalars['BigDecimal']>;
  open_lte?: Maybe<Scalars['BigDecimal']>;
  open_not?: Maybe<Scalars['BigDecimal']>;
  open_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  pool?: Maybe<Scalars['String']>;
  pool_contains?: Maybe<Scalars['String']>;
  pool_ends_with?: Maybe<Scalars['String']>;
  pool_gt?: Maybe<Scalars['String']>;
  pool_gte?: Maybe<Scalars['String']>;
  pool_in?: Maybe<Array<Scalars['String']>>;
  pool_lt?: Maybe<Scalars['String']>;
  pool_lte?: Maybe<Scalars['String']>;
  pool_not?: Maybe<Scalars['String']>;
  pool_not_contains?: Maybe<Scalars['String']>;
  pool_not_ends_with?: Maybe<Scalars['String']>;
  pool_not_in?: Maybe<Array<Scalars['String']>>;
  pool_not_starts_with?: Maybe<Scalars['String']>;
  pool_starts_with?: Maybe<Scalars['String']>;
  sqrtPrice?: Maybe<Scalars['BigInt']>;
  sqrtPrice_gt?: Maybe<Scalars['BigInt']>;
  sqrtPrice_gte?: Maybe<Scalars['BigInt']>;
  sqrtPrice_in?: Maybe<Array<Scalars['BigInt']>>;
  sqrtPrice_lt?: Maybe<Scalars['BigInt']>;
  sqrtPrice_lte?: Maybe<Scalars['BigInt']>;
  sqrtPrice_not?: Maybe<Scalars['BigInt']>;
  sqrtPrice_not_in?: Maybe<Array<Scalars['BigInt']>>;
  tick?: Maybe<Scalars['BigInt']>;
  tick_gt?: Maybe<Scalars['BigInt']>;
  tick_gte?: Maybe<Scalars['BigInt']>;
  tick_in?: Maybe<Array<Scalars['BigInt']>>;
  tick_lt?: Maybe<Scalars['BigInt']>;
  tick_lte?: Maybe<Scalars['BigInt']>;
  tick_not?: Maybe<Scalars['BigInt']>;
  tick_not_in?: Maybe<Array<Scalars['BigInt']>>;
  token0Price?: Maybe<Scalars['BigDecimal']>;
  token0Price_gt?: Maybe<Scalars['BigDecimal']>;
  token0Price_gte?: Maybe<Scalars['BigDecimal']>;
  token0Price_in?: Maybe<Array<Scalars['BigDecimal']>>;
  token0Price_lt?: Maybe<Scalars['BigDecimal']>;
  token0Price_lte?: Maybe<Scalars['BigDecimal']>;
  token0Price_not?: Maybe<Scalars['BigDecimal']>;
  token0Price_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  token1Price?: Maybe<Scalars['BigDecimal']>;
  token1Price_gt?: Maybe<Scalars['BigDecimal']>;
  token1Price_gte?: Maybe<Scalars['BigDecimal']>;
  token1Price_in?: Maybe<Array<Scalars['BigDecimal']>>;
  token1Price_lt?: Maybe<Scalars['BigDecimal']>;
  token1Price_lte?: Maybe<Scalars['BigDecimal']>;
  token1Price_not?: Maybe<Scalars['BigDecimal']>;
  token1Price_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  tvlUSD?: Maybe<Scalars['BigDecimal']>;
  tvlUSD_gt?: Maybe<Scalars['BigDecimal']>;
  tvlUSD_gte?: Maybe<Scalars['BigDecimal']>;
  tvlUSD_in?: Maybe<Array<Scalars['BigDecimal']>>;
  tvlUSD_lt?: Maybe<Scalars['BigDecimal']>;
  tvlUSD_lte?: Maybe<Scalars['BigDecimal']>;
  tvlUSD_not?: Maybe<Scalars['BigDecimal']>;
  tvlUSD_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  txCount?: Maybe<Scalars['BigInt']>;
  txCount_gt?: Maybe<Scalars['BigInt']>;
  txCount_gte?: Maybe<Scalars['BigInt']>;
  txCount_in?: Maybe<Array<Scalars['BigInt']>>;
  txCount_lt?: Maybe<Scalars['BigInt']>;
  txCount_lte?: Maybe<Scalars['BigInt']>;
  txCount_not?: Maybe<Scalars['BigInt']>;
  txCount_not_in?: Maybe<Array<Scalars['BigInt']>>;
  volumeToken0?: Maybe<Scalars['BigDecimal']>;
  volumeToken0_gt?: Maybe<Scalars['BigDecimal']>;
  volumeToken0_gte?: Maybe<Scalars['BigDecimal']>;
  volumeToken0_in?: Maybe<Array<Scalars['BigDecimal']>>;
  volumeToken0_lt?: Maybe<Scalars['BigDecimal']>;
  volumeToken0_lte?: Maybe<Scalars['BigDecimal']>;
  volumeToken0_not?: Maybe<Scalars['BigDecimal']>;
  volumeToken0_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  volumeToken1?: Maybe<Scalars['BigDecimal']>;
  volumeToken1_gt?: Maybe<Scalars['BigDecimal']>;
  volumeToken1_gte?: Maybe<Scalars['BigDecimal']>;
  volumeToken1_in?: Maybe<Array<Scalars['BigDecimal']>>;
  volumeToken1_lt?: Maybe<Scalars['BigDecimal']>;
  volumeToken1_lte?: Maybe<Scalars['BigDecimal']>;
  volumeToken1_not?: Maybe<Scalars['BigDecimal']>;
  volumeToken1_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  volumeUSD?: Maybe<Scalars['BigDecimal']>;
  volumeUSD_gt?: Maybe<Scalars['BigDecimal']>;
  volumeUSD_gte?: Maybe<Scalars['BigDecimal']>;
  volumeUSD_in?: Maybe<Array<Scalars['BigDecimal']>>;
  volumeUSD_lt?: Maybe<Scalars['BigDecimal']>;
  volumeUSD_lte?: Maybe<Scalars['BigDecimal']>;
  volumeUSD_not?: Maybe<Scalars['BigDecimal']>;
  volumeUSD_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
};

export enum PoolDayData_OrderBy {
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
  VolumeUsd = 'volumeUSD'
}

export type PoolHourData = {
  __typename?: 'PoolHourData';
  close: Scalars['BigDecimal'];
  feeGrowthGlobal0X128: Scalars['BigInt'];
  feeGrowthGlobal1X128: Scalars['BigInt'];
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
  close?: Maybe<Scalars['BigDecimal']>;
  close_gt?: Maybe<Scalars['BigDecimal']>;
  close_gte?: Maybe<Scalars['BigDecimal']>;
  close_in?: Maybe<Array<Scalars['BigDecimal']>>;
  close_lt?: Maybe<Scalars['BigDecimal']>;
  close_lte?: Maybe<Scalars['BigDecimal']>;
  close_not?: Maybe<Scalars['BigDecimal']>;
  close_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  feeGrowthGlobal0X128?: Maybe<Scalars['BigInt']>;
  feeGrowthGlobal0X128_gt?: Maybe<Scalars['BigInt']>;
  feeGrowthGlobal0X128_gte?: Maybe<Scalars['BigInt']>;
  feeGrowthGlobal0X128_in?: Maybe<Array<Scalars['BigInt']>>;
  feeGrowthGlobal0X128_lt?: Maybe<Scalars['BigInt']>;
  feeGrowthGlobal0X128_lte?: Maybe<Scalars['BigInt']>;
  feeGrowthGlobal0X128_not?: Maybe<Scalars['BigInt']>;
  feeGrowthGlobal0X128_not_in?: Maybe<Array<Scalars['BigInt']>>;
  feeGrowthGlobal1X128?: Maybe<Scalars['BigInt']>;
  feeGrowthGlobal1X128_gt?: Maybe<Scalars['BigInt']>;
  feeGrowthGlobal1X128_gte?: Maybe<Scalars['BigInt']>;
  feeGrowthGlobal1X128_in?: Maybe<Array<Scalars['BigInt']>>;
  feeGrowthGlobal1X128_lt?: Maybe<Scalars['BigInt']>;
  feeGrowthGlobal1X128_lte?: Maybe<Scalars['BigInt']>;
  feeGrowthGlobal1X128_not?: Maybe<Scalars['BigInt']>;
  feeGrowthGlobal1X128_not_in?: Maybe<Array<Scalars['BigInt']>>;
  feesUSD?: Maybe<Scalars['BigDecimal']>;
  feesUSD_gt?: Maybe<Scalars['BigDecimal']>;
  feesUSD_gte?: Maybe<Scalars['BigDecimal']>;
  feesUSD_in?: Maybe<Array<Scalars['BigDecimal']>>;
  feesUSD_lt?: Maybe<Scalars['BigDecimal']>;
  feesUSD_lte?: Maybe<Scalars['BigDecimal']>;
  feesUSD_not?: Maybe<Scalars['BigDecimal']>;
  feesUSD_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  high?: Maybe<Scalars['BigDecimal']>;
  high_gt?: Maybe<Scalars['BigDecimal']>;
  high_gte?: Maybe<Scalars['BigDecimal']>;
  high_in?: Maybe<Array<Scalars['BigDecimal']>>;
  high_lt?: Maybe<Scalars['BigDecimal']>;
  high_lte?: Maybe<Scalars['BigDecimal']>;
  high_not?: Maybe<Scalars['BigDecimal']>;
  high_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  id?: Maybe<Scalars['ID']>;
  id_gt?: Maybe<Scalars['ID']>;
  id_gte?: Maybe<Scalars['ID']>;
  id_in?: Maybe<Array<Scalars['ID']>>;
  id_lt?: Maybe<Scalars['ID']>;
  id_lte?: Maybe<Scalars['ID']>;
  id_not?: Maybe<Scalars['ID']>;
  id_not_in?: Maybe<Array<Scalars['ID']>>;
  liquidity?: Maybe<Scalars['BigInt']>;
  liquidity_gt?: Maybe<Scalars['BigInt']>;
  liquidity_gte?: Maybe<Scalars['BigInt']>;
  liquidity_in?: Maybe<Array<Scalars['BigInt']>>;
  liquidity_lt?: Maybe<Scalars['BigInt']>;
  liquidity_lte?: Maybe<Scalars['BigInt']>;
  liquidity_not?: Maybe<Scalars['BigInt']>;
  liquidity_not_in?: Maybe<Array<Scalars['BigInt']>>;
  low?: Maybe<Scalars['BigDecimal']>;
  low_gt?: Maybe<Scalars['BigDecimal']>;
  low_gte?: Maybe<Scalars['BigDecimal']>;
  low_in?: Maybe<Array<Scalars['BigDecimal']>>;
  low_lt?: Maybe<Scalars['BigDecimal']>;
  low_lte?: Maybe<Scalars['BigDecimal']>;
  low_not?: Maybe<Scalars['BigDecimal']>;
  low_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  open?: Maybe<Scalars['BigDecimal']>;
  open_gt?: Maybe<Scalars['BigDecimal']>;
  open_gte?: Maybe<Scalars['BigDecimal']>;
  open_in?: Maybe<Array<Scalars['BigDecimal']>>;
  open_lt?: Maybe<Scalars['BigDecimal']>;
  open_lte?: Maybe<Scalars['BigDecimal']>;
  open_not?: Maybe<Scalars['BigDecimal']>;
  open_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  periodStartUnix?: Maybe<Scalars['Int']>;
  periodStartUnix_gt?: Maybe<Scalars['Int']>;
  periodStartUnix_gte?: Maybe<Scalars['Int']>;
  periodStartUnix_in?: Maybe<Array<Scalars['Int']>>;
  periodStartUnix_lt?: Maybe<Scalars['Int']>;
  periodStartUnix_lte?: Maybe<Scalars['Int']>;
  periodStartUnix_not?: Maybe<Scalars['Int']>;
  periodStartUnix_not_in?: Maybe<Array<Scalars['Int']>>;
  pool?: Maybe<Scalars['String']>;
  pool_contains?: Maybe<Scalars['String']>;
  pool_ends_with?: Maybe<Scalars['String']>;
  pool_gt?: Maybe<Scalars['String']>;
  pool_gte?: Maybe<Scalars['String']>;
  pool_in?: Maybe<Array<Scalars['String']>>;
  pool_lt?: Maybe<Scalars['String']>;
  pool_lte?: Maybe<Scalars['String']>;
  pool_not?: Maybe<Scalars['String']>;
  pool_not_contains?: Maybe<Scalars['String']>;
  pool_not_ends_with?: Maybe<Scalars['String']>;
  pool_not_in?: Maybe<Array<Scalars['String']>>;
  pool_not_starts_with?: Maybe<Scalars['String']>;
  pool_starts_with?: Maybe<Scalars['String']>;
  sqrtPrice?: Maybe<Scalars['BigInt']>;
  sqrtPrice_gt?: Maybe<Scalars['BigInt']>;
  sqrtPrice_gte?: Maybe<Scalars['BigInt']>;
  sqrtPrice_in?: Maybe<Array<Scalars['BigInt']>>;
  sqrtPrice_lt?: Maybe<Scalars['BigInt']>;
  sqrtPrice_lte?: Maybe<Scalars['BigInt']>;
  sqrtPrice_not?: Maybe<Scalars['BigInt']>;
  sqrtPrice_not_in?: Maybe<Array<Scalars['BigInt']>>;
  tick?: Maybe<Scalars['BigInt']>;
  tick_gt?: Maybe<Scalars['BigInt']>;
  tick_gte?: Maybe<Scalars['BigInt']>;
  tick_in?: Maybe<Array<Scalars['BigInt']>>;
  tick_lt?: Maybe<Scalars['BigInt']>;
  tick_lte?: Maybe<Scalars['BigInt']>;
  tick_not?: Maybe<Scalars['BigInt']>;
  tick_not_in?: Maybe<Array<Scalars['BigInt']>>;
  token0Price?: Maybe<Scalars['BigDecimal']>;
  token0Price_gt?: Maybe<Scalars['BigDecimal']>;
  token0Price_gte?: Maybe<Scalars['BigDecimal']>;
  token0Price_in?: Maybe<Array<Scalars['BigDecimal']>>;
  token0Price_lt?: Maybe<Scalars['BigDecimal']>;
  token0Price_lte?: Maybe<Scalars['BigDecimal']>;
  token0Price_not?: Maybe<Scalars['BigDecimal']>;
  token0Price_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  token1Price?: Maybe<Scalars['BigDecimal']>;
  token1Price_gt?: Maybe<Scalars['BigDecimal']>;
  token1Price_gte?: Maybe<Scalars['BigDecimal']>;
  token1Price_in?: Maybe<Array<Scalars['BigDecimal']>>;
  token1Price_lt?: Maybe<Scalars['BigDecimal']>;
  token1Price_lte?: Maybe<Scalars['BigDecimal']>;
  token1Price_not?: Maybe<Scalars['BigDecimal']>;
  token1Price_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  tvlUSD?: Maybe<Scalars['BigDecimal']>;
  tvlUSD_gt?: Maybe<Scalars['BigDecimal']>;
  tvlUSD_gte?: Maybe<Scalars['BigDecimal']>;
  tvlUSD_in?: Maybe<Array<Scalars['BigDecimal']>>;
  tvlUSD_lt?: Maybe<Scalars['BigDecimal']>;
  tvlUSD_lte?: Maybe<Scalars['BigDecimal']>;
  tvlUSD_not?: Maybe<Scalars['BigDecimal']>;
  tvlUSD_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  txCount?: Maybe<Scalars['BigInt']>;
  txCount_gt?: Maybe<Scalars['BigInt']>;
  txCount_gte?: Maybe<Scalars['BigInt']>;
  txCount_in?: Maybe<Array<Scalars['BigInt']>>;
  txCount_lt?: Maybe<Scalars['BigInt']>;
  txCount_lte?: Maybe<Scalars['BigInt']>;
  txCount_not?: Maybe<Scalars['BigInt']>;
  txCount_not_in?: Maybe<Array<Scalars['BigInt']>>;
  volumeToken0?: Maybe<Scalars['BigDecimal']>;
  volumeToken0_gt?: Maybe<Scalars['BigDecimal']>;
  volumeToken0_gte?: Maybe<Scalars['BigDecimal']>;
  volumeToken0_in?: Maybe<Array<Scalars['BigDecimal']>>;
  volumeToken0_lt?: Maybe<Scalars['BigDecimal']>;
  volumeToken0_lte?: Maybe<Scalars['BigDecimal']>;
  volumeToken0_not?: Maybe<Scalars['BigDecimal']>;
  volumeToken0_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  volumeToken1?: Maybe<Scalars['BigDecimal']>;
  volumeToken1_gt?: Maybe<Scalars['BigDecimal']>;
  volumeToken1_gte?: Maybe<Scalars['BigDecimal']>;
  volumeToken1_in?: Maybe<Array<Scalars['BigDecimal']>>;
  volumeToken1_lt?: Maybe<Scalars['BigDecimal']>;
  volumeToken1_lte?: Maybe<Scalars['BigDecimal']>;
  volumeToken1_not?: Maybe<Scalars['BigDecimal']>;
  volumeToken1_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  volumeUSD?: Maybe<Scalars['BigDecimal']>;
  volumeUSD_gt?: Maybe<Scalars['BigDecimal']>;
  volumeUSD_gte?: Maybe<Scalars['BigDecimal']>;
  volumeUSD_in?: Maybe<Array<Scalars['BigDecimal']>>;
  volumeUSD_lt?: Maybe<Scalars['BigDecimal']>;
  volumeUSD_lte?: Maybe<Scalars['BigDecimal']>;
  volumeUSD_not?: Maybe<Scalars['BigDecimal']>;
  volumeUSD_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
};

export enum PoolHourData_OrderBy {
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
  VolumeUsd = 'volumeUSD'
}

export type Pool_Filter = {
  collectedFeesToken0?: Maybe<Scalars['BigDecimal']>;
  collectedFeesToken0_gt?: Maybe<Scalars['BigDecimal']>;
  collectedFeesToken0_gte?: Maybe<Scalars['BigDecimal']>;
  collectedFeesToken0_in?: Maybe<Array<Scalars['BigDecimal']>>;
  collectedFeesToken0_lt?: Maybe<Scalars['BigDecimal']>;
  collectedFeesToken0_lte?: Maybe<Scalars['BigDecimal']>;
  collectedFeesToken0_not?: Maybe<Scalars['BigDecimal']>;
  collectedFeesToken0_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  collectedFeesToken1?: Maybe<Scalars['BigDecimal']>;
  collectedFeesToken1_gt?: Maybe<Scalars['BigDecimal']>;
  collectedFeesToken1_gte?: Maybe<Scalars['BigDecimal']>;
  collectedFeesToken1_in?: Maybe<Array<Scalars['BigDecimal']>>;
  collectedFeesToken1_lt?: Maybe<Scalars['BigDecimal']>;
  collectedFeesToken1_lte?: Maybe<Scalars['BigDecimal']>;
  collectedFeesToken1_not?: Maybe<Scalars['BigDecimal']>;
  collectedFeesToken1_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  collectedFeesUSD?: Maybe<Scalars['BigDecimal']>;
  collectedFeesUSD_gt?: Maybe<Scalars['BigDecimal']>;
  collectedFeesUSD_gte?: Maybe<Scalars['BigDecimal']>;
  collectedFeesUSD_in?: Maybe<Array<Scalars['BigDecimal']>>;
  collectedFeesUSD_lt?: Maybe<Scalars['BigDecimal']>;
  collectedFeesUSD_lte?: Maybe<Scalars['BigDecimal']>;
  collectedFeesUSD_not?: Maybe<Scalars['BigDecimal']>;
  collectedFeesUSD_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  createdAtBlockNumber?: Maybe<Scalars['BigInt']>;
  createdAtBlockNumber_gt?: Maybe<Scalars['BigInt']>;
  createdAtBlockNumber_gte?: Maybe<Scalars['BigInt']>;
  createdAtBlockNumber_in?: Maybe<Array<Scalars['BigInt']>>;
  createdAtBlockNumber_lt?: Maybe<Scalars['BigInt']>;
  createdAtBlockNumber_lte?: Maybe<Scalars['BigInt']>;
  createdAtBlockNumber_not?: Maybe<Scalars['BigInt']>;
  createdAtBlockNumber_not_in?: Maybe<Array<Scalars['BigInt']>>;
  createdAtTimestamp?: Maybe<Scalars['BigInt']>;
  createdAtTimestamp_gt?: Maybe<Scalars['BigInt']>;
  createdAtTimestamp_gte?: Maybe<Scalars['BigInt']>;
  createdAtTimestamp_in?: Maybe<Array<Scalars['BigInt']>>;
  createdAtTimestamp_lt?: Maybe<Scalars['BigInt']>;
  createdAtTimestamp_lte?: Maybe<Scalars['BigInt']>;
  createdAtTimestamp_not?: Maybe<Scalars['BigInt']>;
  createdAtTimestamp_not_in?: Maybe<Array<Scalars['BigInt']>>;
  feeGrowthGlobal0X128?: Maybe<Scalars['BigInt']>;
  feeGrowthGlobal0X128_gt?: Maybe<Scalars['BigInt']>;
  feeGrowthGlobal0X128_gte?: Maybe<Scalars['BigInt']>;
  feeGrowthGlobal0X128_in?: Maybe<Array<Scalars['BigInt']>>;
  feeGrowthGlobal0X128_lt?: Maybe<Scalars['BigInt']>;
  feeGrowthGlobal0X128_lte?: Maybe<Scalars['BigInt']>;
  feeGrowthGlobal0X128_not?: Maybe<Scalars['BigInt']>;
  feeGrowthGlobal0X128_not_in?: Maybe<Array<Scalars['BigInt']>>;
  feeGrowthGlobal1X128?: Maybe<Scalars['BigInt']>;
  feeGrowthGlobal1X128_gt?: Maybe<Scalars['BigInt']>;
  feeGrowthGlobal1X128_gte?: Maybe<Scalars['BigInt']>;
  feeGrowthGlobal1X128_in?: Maybe<Array<Scalars['BigInt']>>;
  feeGrowthGlobal1X128_lt?: Maybe<Scalars['BigInt']>;
  feeGrowthGlobal1X128_lte?: Maybe<Scalars['BigInt']>;
  feeGrowthGlobal1X128_not?: Maybe<Scalars['BigInt']>;
  feeGrowthGlobal1X128_not_in?: Maybe<Array<Scalars['BigInt']>>;
  feeTier?: Maybe<Scalars['BigInt']>;
  feeTier_gt?: Maybe<Scalars['BigInt']>;
  feeTier_gte?: Maybe<Scalars['BigInt']>;
  feeTier_in?: Maybe<Array<Scalars['BigInt']>>;
  feeTier_lt?: Maybe<Scalars['BigInt']>;
  feeTier_lte?: Maybe<Scalars['BigInt']>;
  feeTier_not?: Maybe<Scalars['BigInt']>;
  feeTier_not_in?: Maybe<Array<Scalars['BigInt']>>;
  feesUSD?: Maybe<Scalars['BigDecimal']>;
  feesUSD_gt?: Maybe<Scalars['BigDecimal']>;
  feesUSD_gte?: Maybe<Scalars['BigDecimal']>;
  feesUSD_in?: Maybe<Array<Scalars['BigDecimal']>>;
  feesUSD_lt?: Maybe<Scalars['BigDecimal']>;
  feesUSD_lte?: Maybe<Scalars['BigDecimal']>;
  feesUSD_not?: Maybe<Scalars['BigDecimal']>;
  feesUSD_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  id?: Maybe<Scalars['ID']>;
  id_gt?: Maybe<Scalars['ID']>;
  id_gte?: Maybe<Scalars['ID']>;
  id_in?: Maybe<Array<Scalars['ID']>>;
  id_lt?: Maybe<Scalars['ID']>;
  id_lte?: Maybe<Scalars['ID']>;
  id_not?: Maybe<Scalars['ID']>;
  id_not_in?: Maybe<Array<Scalars['ID']>>;
  liquidity?: Maybe<Scalars['BigInt']>;
  liquidityProviderCount?: Maybe<Scalars['BigInt']>;
  liquidityProviderCount_gt?: Maybe<Scalars['BigInt']>;
  liquidityProviderCount_gte?: Maybe<Scalars['BigInt']>;
  liquidityProviderCount_in?: Maybe<Array<Scalars['BigInt']>>;
  liquidityProviderCount_lt?: Maybe<Scalars['BigInt']>;
  liquidityProviderCount_lte?: Maybe<Scalars['BigInt']>;
  liquidityProviderCount_not?: Maybe<Scalars['BigInt']>;
  liquidityProviderCount_not_in?: Maybe<Array<Scalars['BigInt']>>;
  liquidity_gt?: Maybe<Scalars['BigInt']>;
  liquidity_gte?: Maybe<Scalars['BigInt']>;
  liquidity_in?: Maybe<Array<Scalars['BigInt']>>;
  liquidity_lt?: Maybe<Scalars['BigInt']>;
  liquidity_lte?: Maybe<Scalars['BigInt']>;
  liquidity_not?: Maybe<Scalars['BigInt']>;
  liquidity_not_in?: Maybe<Array<Scalars['BigInt']>>;
  observationIndex?: Maybe<Scalars['BigInt']>;
  observationIndex_gt?: Maybe<Scalars['BigInt']>;
  observationIndex_gte?: Maybe<Scalars['BigInt']>;
  observationIndex_in?: Maybe<Array<Scalars['BigInt']>>;
  observationIndex_lt?: Maybe<Scalars['BigInt']>;
  observationIndex_lte?: Maybe<Scalars['BigInt']>;
  observationIndex_not?: Maybe<Scalars['BigInt']>;
  observationIndex_not_in?: Maybe<Array<Scalars['BigInt']>>;
  sqrtPrice?: Maybe<Scalars['BigInt']>;
  sqrtPrice_gt?: Maybe<Scalars['BigInt']>;
  sqrtPrice_gte?: Maybe<Scalars['BigInt']>;
  sqrtPrice_in?: Maybe<Array<Scalars['BigInt']>>;
  sqrtPrice_lt?: Maybe<Scalars['BigInt']>;
  sqrtPrice_lte?: Maybe<Scalars['BigInt']>;
  sqrtPrice_not?: Maybe<Scalars['BigInt']>;
  sqrtPrice_not_in?: Maybe<Array<Scalars['BigInt']>>;
  tick?: Maybe<Scalars['BigInt']>;
  tick_gt?: Maybe<Scalars['BigInt']>;
  tick_gte?: Maybe<Scalars['BigInt']>;
  tick_in?: Maybe<Array<Scalars['BigInt']>>;
  tick_lt?: Maybe<Scalars['BigInt']>;
  tick_lte?: Maybe<Scalars['BigInt']>;
  tick_not?: Maybe<Scalars['BigInt']>;
  tick_not_in?: Maybe<Array<Scalars['BigInt']>>;
  token0?: Maybe<Scalars['String']>;
  token0Price?: Maybe<Scalars['BigDecimal']>;
  token0Price_gt?: Maybe<Scalars['BigDecimal']>;
  token0Price_gte?: Maybe<Scalars['BigDecimal']>;
  token0Price_in?: Maybe<Array<Scalars['BigDecimal']>>;
  token0Price_lt?: Maybe<Scalars['BigDecimal']>;
  token0Price_lte?: Maybe<Scalars['BigDecimal']>;
  token0Price_not?: Maybe<Scalars['BigDecimal']>;
  token0Price_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  token0_contains?: Maybe<Scalars['String']>;
  token0_ends_with?: Maybe<Scalars['String']>;
  token0_gt?: Maybe<Scalars['String']>;
  token0_gte?: Maybe<Scalars['String']>;
  token0_in?: Maybe<Array<Scalars['String']>>;
  token0_lt?: Maybe<Scalars['String']>;
  token0_lte?: Maybe<Scalars['String']>;
  token0_not?: Maybe<Scalars['String']>;
  token0_not_contains?: Maybe<Scalars['String']>;
  token0_not_ends_with?: Maybe<Scalars['String']>;
  token0_not_in?: Maybe<Array<Scalars['String']>>;
  token0_not_starts_with?: Maybe<Scalars['String']>;
  token0_starts_with?: Maybe<Scalars['String']>;
  token1?: Maybe<Scalars['String']>;
  token1Price?: Maybe<Scalars['BigDecimal']>;
  token1Price_gt?: Maybe<Scalars['BigDecimal']>;
  token1Price_gte?: Maybe<Scalars['BigDecimal']>;
  token1Price_in?: Maybe<Array<Scalars['BigDecimal']>>;
  token1Price_lt?: Maybe<Scalars['BigDecimal']>;
  token1Price_lte?: Maybe<Scalars['BigDecimal']>;
  token1Price_not?: Maybe<Scalars['BigDecimal']>;
  token1Price_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  token1_contains?: Maybe<Scalars['String']>;
  token1_ends_with?: Maybe<Scalars['String']>;
  token1_gt?: Maybe<Scalars['String']>;
  token1_gte?: Maybe<Scalars['String']>;
  token1_in?: Maybe<Array<Scalars['String']>>;
  token1_lt?: Maybe<Scalars['String']>;
  token1_lte?: Maybe<Scalars['String']>;
  token1_not?: Maybe<Scalars['String']>;
  token1_not_contains?: Maybe<Scalars['String']>;
  token1_not_ends_with?: Maybe<Scalars['String']>;
  token1_not_in?: Maybe<Array<Scalars['String']>>;
  token1_not_starts_with?: Maybe<Scalars['String']>;
  token1_starts_with?: Maybe<Scalars['String']>;
  totalValueLockedETH?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedETH_gt?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedETH_gte?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedETH_in?: Maybe<Array<Scalars['BigDecimal']>>;
  totalValueLockedETH_lt?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedETH_lte?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedETH_not?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedETH_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  totalValueLockedToken0?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedToken0_gt?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedToken0_gte?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedToken0_in?: Maybe<Array<Scalars['BigDecimal']>>;
  totalValueLockedToken0_lt?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedToken0_lte?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedToken0_not?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedToken0_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  totalValueLockedToken1?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedToken1_gt?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedToken1_gte?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedToken1_in?: Maybe<Array<Scalars['BigDecimal']>>;
  totalValueLockedToken1_lt?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedToken1_lte?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedToken1_not?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedToken1_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  totalValueLockedUSD?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedUSDUntracked?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedUSDUntracked_gt?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedUSDUntracked_gte?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedUSDUntracked_in?: Maybe<Array<Scalars['BigDecimal']>>;
  totalValueLockedUSDUntracked_lt?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedUSDUntracked_lte?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedUSDUntracked_not?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedUSDUntracked_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  totalValueLockedUSD_gt?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedUSD_gte?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedUSD_in?: Maybe<Array<Scalars['BigDecimal']>>;
  totalValueLockedUSD_lt?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedUSD_lte?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedUSD_not?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedUSD_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  txCount?: Maybe<Scalars['BigInt']>;
  txCount_gt?: Maybe<Scalars['BigInt']>;
  txCount_gte?: Maybe<Scalars['BigInt']>;
  txCount_in?: Maybe<Array<Scalars['BigInt']>>;
  txCount_lt?: Maybe<Scalars['BigInt']>;
  txCount_lte?: Maybe<Scalars['BigInt']>;
  txCount_not?: Maybe<Scalars['BigInt']>;
  txCount_not_in?: Maybe<Array<Scalars['BigInt']>>;
  untrackedVolumeUSD?: Maybe<Scalars['BigDecimal']>;
  untrackedVolumeUSD_gt?: Maybe<Scalars['BigDecimal']>;
  untrackedVolumeUSD_gte?: Maybe<Scalars['BigDecimal']>;
  untrackedVolumeUSD_in?: Maybe<Array<Scalars['BigDecimal']>>;
  untrackedVolumeUSD_lt?: Maybe<Scalars['BigDecimal']>;
  untrackedVolumeUSD_lte?: Maybe<Scalars['BigDecimal']>;
  untrackedVolumeUSD_not?: Maybe<Scalars['BigDecimal']>;
  untrackedVolumeUSD_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  volumeToken0?: Maybe<Scalars['BigDecimal']>;
  volumeToken0_gt?: Maybe<Scalars['BigDecimal']>;
  volumeToken0_gte?: Maybe<Scalars['BigDecimal']>;
  volumeToken0_in?: Maybe<Array<Scalars['BigDecimal']>>;
  volumeToken0_lt?: Maybe<Scalars['BigDecimal']>;
  volumeToken0_lte?: Maybe<Scalars['BigDecimal']>;
  volumeToken0_not?: Maybe<Scalars['BigDecimal']>;
  volumeToken0_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  volumeToken1?: Maybe<Scalars['BigDecimal']>;
  volumeToken1_gt?: Maybe<Scalars['BigDecimal']>;
  volumeToken1_gte?: Maybe<Scalars['BigDecimal']>;
  volumeToken1_in?: Maybe<Array<Scalars['BigDecimal']>>;
  volumeToken1_lt?: Maybe<Scalars['BigDecimal']>;
  volumeToken1_lte?: Maybe<Scalars['BigDecimal']>;
  volumeToken1_not?: Maybe<Scalars['BigDecimal']>;
  volumeToken1_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  volumeUSD?: Maybe<Scalars['BigDecimal']>;
  volumeUSD_gt?: Maybe<Scalars['BigDecimal']>;
  volumeUSD_gte?: Maybe<Scalars['BigDecimal']>;
  volumeUSD_in?: Maybe<Array<Scalars['BigDecimal']>>;
  volumeUSD_lt?: Maybe<Scalars['BigDecimal']>;
  volumeUSD_lte?: Maybe<Scalars['BigDecimal']>;
  volumeUSD_not?: Maybe<Scalars['BigDecimal']>;
  volumeUSD_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
};

export enum Pool_OrderBy {
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
  VolumeUsd = 'volumeUSD'
}

export type Position = {
  __typename?: 'Position';
  collectedFeesToken0: Scalars['BigDecimal'];
  collectedFeesToken1: Scalars['BigDecimal'];
  depositedToken0: Scalars['BigDecimal'];
  depositedToken1: Scalars['BigDecimal'];
  feeGrowthInside0LastX128: Scalars['BigInt'];
  feeGrowthInside1LastX128: Scalars['BigInt'];
  id: Scalars['ID'];
  liquidity: Scalars['BigInt'];
  owner: Scalars['Bytes'];
  pool: Pool;
  tickLower: Tick;
  tickUpper: Tick;
  token0: Token;
  token1: Token;
  transaction: Transaction;
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
  feeGrowthInside0LastX128: Scalars['BigInt'];
  feeGrowthInside1LastX128: Scalars['BigInt'];
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
  blockNumber?: Maybe<Scalars['BigInt']>;
  blockNumber_gt?: Maybe<Scalars['BigInt']>;
  blockNumber_gte?: Maybe<Scalars['BigInt']>;
  blockNumber_in?: Maybe<Array<Scalars['BigInt']>>;
  blockNumber_lt?: Maybe<Scalars['BigInt']>;
  blockNumber_lte?: Maybe<Scalars['BigInt']>;
  blockNumber_not?: Maybe<Scalars['BigInt']>;
  blockNumber_not_in?: Maybe<Array<Scalars['BigInt']>>;
  collectedFeesToken0?: Maybe<Scalars['BigDecimal']>;
  collectedFeesToken0_gt?: Maybe<Scalars['BigDecimal']>;
  collectedFeesToken0_gte?: Maybe<Scalars['BigDecimal']>;
  collectedFeesToken0_in?: Maybe<Array<Scalars['BigDecimal']>>;
  collectedFeesToken0_lt?: Maybe<Scalars['BigDecimal']>;
  collectedFeesToken0_lte?: Maybe<Scalars['BigDecimal']>;
  collectedFeesToken0_not?: Maybe<Scalars['BigDecimal']>;
  collectedFeesToken0_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  collectedFeesToken1?: Maybe<Scalars['BigDecimal']>;
  collectedFeesToken1_gt?: Maybe<Scalars['BigDecimal']>;
  collectedFeesToken1_gte?: Maybe<Scalars['BigDecimal']>;
  collectedFeesToken1_in?: Maybe<Array<Scalars['BigDecimal']>>;
  collectedFeesToken1_lt?: Maybe<Scalars['BigDecimal']>;
  collectedFeesToken1_lte?: Maybe<Scalars['BigDecimal']>;
  collectedFeesToken1_not?: Maybe<Scalars['BigDecimal']>;
  collectedFeesToken1_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  depositedToken0?: Maybe<Scalars['BigDecimal']>;
  depositedToken0_gt?: Maybe<Scalars['BigDecimal']>;
  depositedToken0_gte?: Maybe<Scalars['BigDecimal']>;
  depositedToken0_in?: Maybe<Array<Scalars['BigDecimal']>>;
  depositedToken0_lt?: Maybe<Scalars['BigDecimal']>;
  depositedToken0_lte?: Maybe<Scalars['BigDecimal']>;
  depositedToken0_not?: Maybe<Scalars['BigDecimal']>;
  depositedToken0_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  depositedToken1?: Maybe<Scalars['BigDecimal']>;
  depositedToken1_gt?: Maybe<Scalars['BigDecimal']>;
  depositedToken1_gte?: Maybe<Scalars['BigDecimal']>;
  depositedToken1_in?: Maybe<Array<Scalars['BigDecimal']>>;
  depositedToken1_lt?: Maybe<Scalars['BigDecimal']>;
  depositedToken1_lte?: Maybe<Scalars['BigDecimal']>;
  depositedToken1_not?: Maybe<Scalars['BigDecimal']>;
  depositedToken1_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  feeGrowthInside0LastX128?: Maybe<Scalars['BigInt']>;
  feeGrowthInside0LastX128_gt?: Maybe<Scalars['BigInt']>;
  feeGrowthInside0LastX128_gte?: Maybe<Scalars['BigInt']>;
  feeGrowthInside0LastX128_in?: Maybe<Array<Scalars['BigInt']>>;
  feeGrowthInside0LastX128_lt?: Maybe<Scalars['BigInt']>;
  feeGrowthInside0LastX128_lte?: Maybe<Scalars['BigInt']>;
  feeGrowthInside0LastX128_not?: Maybe<Scalars['BigInt']>;
  feeGrowthInside0LastX128_not_in?: Maybe<Array<Scalars['BigInt']>>;
  feeGrowthInside1LastX128?: Maybe<Scalars['BigInt']>;
  feeGrowthInside1LastX128_gt?: Maybe<Scalars['BigInt']>;
  feeGrowthInside1LastX128_gte?: Maybe<Scalars['BigInt']>;
  feeGrowthInside1LastX128_in?: Maybe<Array<Scalars['BigInt']>>;
  feeGrowthInside1LastX128_lt?: Maybe<Scalars['BigInt']>;
  feeGrowthInside1LastX128_lte?: Maybe<Scalars['BigInt']>;
  feeGrowthInside1LastX128_not?: Maybe<Scalars['BigInt']>;
  feeGrowthInside1LastX128_not_in?: Maybe<Array<Scalars['BigInt']>>;
  id?: Maybe<Scalars['ID']>;
  id_gt?: Maybe<Scalars['ID']>;
  id_gte?: Maybe<Scalars['ID']>;
  id_in?: Maybe<Array<Scalars['ID']>>;
  id_lt?: Maybe<Scalars['ID']>;
  id_lte?: Maybe<Scalars['ID']>;
  id_not?: Maybe<Scalars['ID']>;
  id_not_in?: Maybe<Array<Scalars['ID']>>;
  liquidity?: Maybe<Scalars['BigInt']>;
  liquidity_gt?: Maybe<Scalars['BigInt']>;
  liquidity_gte?: Maybe<Scalars['BigInt']>;
  liquidity_in?: Maybe<Array<Scalars['BigInt']>>;
  liquidity_lt?: Maybe<Scalars['BigInt']>;
  liquidity_lte?: Maybe<Scalars['BigInt']>;
  liquidity_not?: Maybe<Scalars['BigInt']>;
  liquidity_not_in?: Maybe<Array<Scalars['BigInt']>>;
  owner?: Maybe<Scalars['Bytes']>;
  owner_contains?: Maybe<Scalars['Bytes']>;
  owner_in?: Maybe<Array<Scalars['Bytes']>>;
  owner_not?: Maybe<Scalars['Bytes']>;
  owner_not_contains?: Maybe<Scalars['Bytes']>;
  owner_not_in?: Maybe<Array<Scalars['Bytes']>>;
  pool?: Maybe<Scalars['String']>;
  pool_contains?: Maybe<Scalars['String']>;
  pool_ends_with?: Maybe<Scalars['String']>;
  pool_gt?: Maybe<Scalars['String']>;
  pool_gte?: Maybe<Scalars['String']>;
  pool_in?: Maybe<Array<Scalars['String']>>;
  pool_lt?: Maybe<Scalars['String']>;
  pool_lte?: Maybe<Scalars['String']>;
  pool_not?: Maybe<Scalars['String']>;
  pool_not_contains?: Maybe<Scalars['String']>;
  pool_not_ends_with?: Maybe<Scalars['String']>;
  pool_not_in?: Maybe<Array<Scalars['String']>>;
  pool_not_starts_with?: Maybe<Scalars['String']>;
  pool_starts_with?: Maybe<Scalars['String']>;
  position?: Maybe<Scalars['String']>;
  position_contains?: Maybe<Scalars['String']>;
  position_ends_with?: Maybe<Scalars['String']>;
  position_gt?: Maybe<Scalars['String']>;
  position_gte?: Maybe<Scalars['String']>;
  position_in?: Maybe<Array<Scalars['String']>>;
  position_lt?: Maybe<Scalars['String']>;
  position_lte?: Maybe<Scalars['String']>;
  position_not?: Maybe<Scalars['String']>;
  position_not_contains?: Maybe<Scalars['String']>;
  position_not_ends_with?: Maybe<Scalars['String']>;
  position_not_in?: Maybe<Array<Scalars['String']>>;
  position_not_starts_with?: Maybe<Scalars['String']>;
  position_starts_with?: Maybe<Scalars['String']>;
  timestamp?: Maybe<Scalars['BigInt']>;
  timestamp_gt?: Maybe<Scalars['BigInt']>;
  timestamp_gte?: Maybe<Scalars['BigInt']>;
  timestamp_in?: Maybe<Array<Scalars['BigInt']>>;
  timestamp_lt?: Maybe<Scalars['BigInt']>;
  timestamp_lte?: Maybe<Scalars['BigInt']>;
  timestamp_not?: Maybe<Scalars['BigInt']>;
  timestamp_not_in?: Maybe<Array<Scalars['BigInt']>>;
  transaction?: Maybe<Scalars['String']>;
  transaction_contains?: Maybe<Scalars['String']>;
  transaction_ends_with?: Maybe<Scalars['String']>;
  transaction_gt?: Maybe<Scalars['String']>;
  transaction_gte?: Maybe<Scalars['String']>;
  transaction_in?: Maybe<Array<Scalars['String']>>;
  transaction_lt?: Maybe<Scalars['String']>;
  transaction_lte?: Maybe<Scalars['String']>;
  transaction_not?: Maybe<Scalars['String']>;
  transaction_not_contains?: Maybe<Scalars['String']>;
  transaction_not_ends_with?: Maybe<Scalars['String']>;
  transaction_not_in?: Maybe<Array<Scalars['String']>>;
  transaction_not_starts_with?: Maybe<Scalars['String']>;
  transaction_starts_with?: Maybe<Scalars['String']>;
  withdrawnToken0?: Maybe<Scalars['BigDecimal']>;
  withdrawnToken0_gt?: Maybe<Scalars['BigDecimal']>;
  withdrawnToken0_gte?: Maybe<Scalars['BigDecimal']>;
  withdrawnToken0_in?: Maybe<Array<Scalars['BigDecimal']>>;
  withdrawnToken0_lt?: Maybe<Scalars['BigDecimal']>;
  withdrawnToken0_lte?: Maybe<Scalars['BigDecimal']>;
  withdrawnToken0_not?: Maybe<Scalars['BigDecimal']>;
  withdrawnToken0_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  withdrawnToken1?: Maybe<Scalars['BigDecimal']>;
  withdrawnToken1_gt?: Maybe<Scalars['BigDecimal']>;
  withdrawnToken1_gte?: Maybe<Scalars['BigDecimal']>;
  withdrawnToken1_in?: Maybe<Array<Scalars['BigDecimal']>>;
  withdrawnToken1_lt?: Maybe<Scalars['BigDecimal']>;
  withdrawnToken1_lte?: Maybe<Scalars['BigDecimal']>;
  withdrawnToken1_not?: Maybe<Scalars['BigDecimal']>;
  withdrawnToken1_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
};

export enum PositionSnapshot_OrderBy {
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
  WithdrawnToken1 = 'withdrawnToken1'
}

export type Position_Filter = {
  collectedFeesToken0?: Maybe<Scalars['BigDecimal']>;
  collectedFeesToken0_gt?: Maybe<Scalars['BigDecimal']>;
  collectedFeesToken0_gte?: Maybe<Scalars['BigDecimal']>;
  collectedFeesToken0_in?: Maybe<Array<Scalars['BigDecimal']>>;
  collectedFeesToken0_lt?: Maybe<Scalars['BigDecimal']>;
  collectedFeesToken0_lte?: Maybe<Scalars['BigDecimal']>;
  collectedFeesToken0_not?: Maybe<Scalars['BigDecimal']>;
  collectedFeesToken0_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  collectedFeesToken1?: Maybe<Scalars['BigDecimal']>;
  collectedFeesToken1_gt?: Maybe<Scalars['BigDecimal']>;
  collectedFeesToken1_gte?: Maybe<Scalars['BigDecimal']>;
  collectedFeesToken1_in?: Maybe<Array<Scalars['BigDecimal']>>;
  collectedFeesToken1_lt?: Maybe<Scalars['BigDecimal']>;
  collectedFeesToken1_lte?: Maybe<Scalars['BigDecimal']>;
  collectedFeesToken1_not?: Maybe<Scalars['BigDecimal']>;
  collectedFeesToken1_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  depositedToken0?: Maybe<Scalars['BigDecimal']>;
  depositedToken0_gt?: Maybe<Scalars['BigDecimal']>;
  depositedToken0_gte?: Maybe<Scalars['BigDecimal']>;
  depositedToken0_in?: Maybe<Array<Scalars['BigDecimal']>>;
  depositedToken0_lt?: Maybe<Scalars['BigDecimal']>;
  depositedToken0_lte?: Maybe<Scalars['BigDecimal']>;
  depositedToken0_not?: Maybe<Scalars['BigDecimal']>;
  depositedToken0_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  depositedToken1?: Maybe<Scalars['BigDecimal']>;
  depositedToken1_gt?: Maybe<Scalars['BigDecimal']>;
  depositedToken1_gte?: Maybe<Scalars['BigDecimal']>;
  depositedToken1_in?: Maybe<Array<Scalars['BigDecimal']>>;
  depositedToken1_lt?: Maybe<Scalars['BigDecimal']>;
  depositedToken1_lte?: Maybe<Scalars['BigDecimal']>;
  depositedToken1_not?: Maybe<Scalars['BigDecimal']>;
  depositedToken1_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  feeGrowthInside0LastX128?: Maybe<Scalars['BigInt']>;
  feeGrowthInside0LastX128_gt?: Maybe<Scalars['BigInt']>;
  feeGrowthInside0LastX128_gte?: Maybe<Scalars['BigInt']>;
  feeGrowthInside0LastX128_in?: Maybe<Array<Scalars['BigInt']>>;
  feeGrowthInside0LastX128_lt?: Maybe<Scalars['BigInt']>;
  feeGrowthInside0LastX128_lte?: Maybe<Scalars['BigInt']>;
  feeGrowthInside0LastX128_not?: Maybe<Scalars['BigInt']>;
  feeGrowthInside0LastX128_not_in?: Maybe<Array<Scalars['BigInt']>>;
  feeGrowthInside1LastX128?: Maybe<Scalars['BigInt']>;
  feeGrowthInside1LastX128_gt?: Maybe<Scalars['BigInt']>;
  feeGrowthInside1LastX128_gte?: Maybe<Scalars['BigInt']>;
  feeGrowthInside1LastX128_in?: Maybe<Array<Scalars['BigInt']>>;
  feeGrowthInside1LastX128_lt?: Maybe<Scalars['BigInt']>;
  feeGrowthInside1LastX128_lte?: Maybe<Scalars['BigInt']>;
  feeGrowthInside1LastX128_not?: Maybe<Scalars['BigInt']>;
  feeGrowthInside1LastX128_not_in?: Maybe<Array<Scalars['BigInt']>>;
  id?: Maybe<Scalars['ID']>;
  id_gt?: Maybe<Scalars['ID']>;
  id_gte?: Maybe<Scalars['ID']>;
  id_in?: Maybe<Array<Scalars['ID']>>;
  id_lt?: Maybe<Scalars['ID']>;
  id_lte?: Maybe<Scalars['ID']>;
  id_not?: Maybe<Scalars['ID']>;
  id_not_in?: Maybe<Array<Scalars['ID']>>;
  liquidity?: Maybe<Scalars['BigInt']>;
  liquidity_gt?: Maybe<Scalars['BigInt']>;
  liquidity_gte?: Maybe<Scalars['BigInt']>;
  liquidity_in?: Maybe<Array<Scalars['BigInt']>>;
  liquidity_lt?: Maybe<Scalars['BigInt']>;
  liquidity_lte?: Maybe<Scalars['BigInt']>;
  liquidity_not?: Maybe<Scalars['BigInt']>;
  liquidity_not_in?: Maybe<Array<Scalars['BigInt']>>;
  owner?: Maybe<Scalars['Bytes']>;
  owner_contains?: Maybe<Scalars['Bytes']>;
  owner_in?: Maybe<Array<Scalars['Bytes']>>;
  owner_not?: Maybe<Scalars['Bytes']>;
  owner_not_contains?: Maybe<Scalars['Bytes']>;
  owner_not_in?: Maybe<Array<Scalars['Bytes']>>;
  pool?: Maybe<Scalars['String']>;
  pool_contains?: Maybe<Scalars['String']>;
  pool_ends_with?: Maybe<Scalars['String']>;
  pool_gt?: Maybe<Scalars['String']>;
  pool_gte?: Maybe<Scalars['String']>;
  pool_in?: Maybe<Array<Scalars['String']>>;
  pool_lt?: Maybe<Scalars['String']>;
  pool_lte?: Maybe<Scalars['String']>;
  pool_not?: Maybe<Scalars['String']>;
  pool_not_contains?: Maybe<Scalars['String']>;
  pool_not_ends_with?: Maybe<Scalars['String']>;
  pool_not_in?: Maybe<Array<Scalars['String']>>;
  pool_not_starts_with?: Maybe<Scalars['String']>;
  pool_starts_with?: Maybe<Scalars['String']>;
  tickLower?: Maybe<Scalars['String']>;
  tickLower_contains?: Maybe<Scalars['String']>;
  tickLower_ends_with?: Maybe<Scalars['String']>;
  tickLower_gt?: Maybe<Scalars['String']>;
  tickLower_gte?: Maybe<Scalars['String']>;
  tickLower_in?: Maybe<Array<Scalars['String']>>;
  tickLower_lt?: Maybe<Scalars['String']>;
  tickLower_lte?: Maybe<Scalars['String']>;
  tickLower_not?: Maybe<Scalars['String']>;
  tickLower_not_contains?: Maybe<Scalars['String']>;
  tickLower_not_ends_with?: Maybe<Scalars['String']>;
  tickLower_not_in?: Maybe<Array<Scalars['String']>>;
  tickLower_not_starts_with?: Maybe<Scalars['String']>;
  tickLower_starts_with?: Maybe<Scalars['String']>;
  tickUpper?: Maybe<Scalars['String']>;
  tickUpper_contains?: Maybe<Scalars['String']>;
  tickUpper_ends_with?: Maybe<Scalars['String']>;
  tickUpper_gt?: Maybe<Scalars['String']>;
  tickUpper_gte?: Maybe<Scalars['String']>;
  tickUpper_in?: Maybe<Array<Scalars['String']>>;
  tickUpper_lt?: Maybe<Scalars['String']>;
  tickUpper_lte?: Maybe<Scalars['String']>;
  tickUpper_not?: Maybe<Scalars['String']>;
  tickUpper_not_contains?: Maybe<Scalars['String']>;
  tickUpper_not_ends_with?: Maybe<Scalars['String']>;
  tickUpper_not_in?: Maybe<Array<Scalars['String']>>;
  tickUpper_not_starts_with?: Maybe<Scalars['String']>;
  tickUpper_starts_with?: Maybe<Scalars['String']>;
  token0?: Maybe<Scalars['String']>;
  token0_contains?: Maybe<Scalars['String']>;
  token0_ends_with?: Maybe<Scalars['String']>;
  token0_gt?: Maybe<Scalars['String']>;
  token0_gte?: Maybe<Scalars['String']>;
  token0_in?: Maybe<Array<Scalars['String']>>;
  token0_lt?: Maybe<Scalars['String']>;
  token0_lte?: Maybe<Scalars['String']>;
  token0_not?: Maybe<Scalars['String']>;
  token0_not_contains?: Maybe<Scalars['String']>;
  token0_not_ends_with?: Maybe<Scalars['String']>;
  token0_not_in?: Maybe<Array<Scalars['String']>>;
  token0_not_starts_with?: Maybe<Scalars['String']>;
  token0_starts_with?: Maybe<Scalars['String']>;
  token1?: Maybe<Scalars['String']>;
  token1_contains?: Maybe<Scalars['String']>;
  token1_ends_with?: Maybe<Scalars['String']>;
  token1_gt?: Maybe<Scalars['String']>;
  token1_gte?: Maybe<Scalars['String']>;
  token1_in?: Maybe<Array<Scalars['String']>>;
  token1_lt?: Maybe<Scalars['String']>;
  token1_lte?: Maybe<Scalars['String']>;
  token1_not?: Maybe<Scalars['String']>;
  token1_not_contains?: Maybe<Scalars['String']>;
  token1_not_ends_with?: Maybe<Scalars['String']>;
  token1_not_in?: Maybe<Array<Scalars['String']>>;
  token1_not_starts_with?: Maybe<Scalars['String']>;
  token1_starts_with?: Maybe<Scalars['String']>;
  transaction?: Maybe<Scalars['String']>;
  transaction_contains?: Maybe<Scalars['String']>;
  transaction_ends_with?: Maybe<Scalars['String']>;
  transaction_gt?: Maybe<Scalars['String']>;
  transaction_gte?: Maybe<Scalars['String']>;
  transaction_in?: Maybe<Array<Scalars['String']>>;
  transaction_lt?: Maybe<Scalars['String']>;
  transaction_lte?: Maybe<Scalars['String']>;
  transaction_not?: Maybe<Scalars['String']>;
  transaction_not_contains?: Maybe<Scalars['String']>;
  transaction_not_ends_with?: Maybe<Scalars['String']>;
  transaction_not_in?: Maybe<Array<Scalars['String']>>;
  transaction_not_starts_with?: Maybe<Scalars['String']>;
  transaction_starts_with?: Maybe<Scalars['String']>;
  withdrawnToken0?: Maybe<Scalars['BigDecimal']>;
  withdrawnToken0_gt?: Maybe<Scalars['BigDecimal']>;
  withdrawnToken0_gte?: Maybe<Scalars['BigDecimal']>;
  withdrawnToken0_in?: Maybe<Array<Scalars['BigDecimal']>>;
  withdrawnToken0_lt?: Maybe<Scalars['BigDecimal']>;
  withdrawnToken0_lte?: Maybe<Scalars['BigDecimal']>;
  withdrawnToken0_not?: Maybe<Scalars['BigDecimal']>;
  withdrawnToken0_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  withdrawnToken1?: Maybe<Scalars['BigDecimal']>;
  withdrawnToken1_gt?: Maybe<Scalars['BigDecimal']>;
  withdrawnToken1_gte?: Maybe<Scalars['BigDecimal']>;
  withdrawnToken1_in?: Maybe<Array<Scalars['BigDecimal']>>;
  withdrawnToken1_lt?: Maybe<Scalars['BigDecimal']>;
  withdrawnToken1_lte?: Maybe<Scalars['BigDecimal']>;
  withdrawnToken1_not?: Maybe<Scalars['BigDecimal']>;
  withdrawnToken1_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
};

export enum Position_OrderBy {
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
  tickDayData?: Maybe<TickDayData>;
  tickDayDatas: Array<TickDayData>;
  tickHourData?: Maybe<TickHourData>;
  tickHourDatas: Array<TickHourData>;
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
  block?: Maybe<Block_Height>;
};


export type QueryBundleArgs = {
  block?: Maybe<Block_Height>;
  id: Scalars['ID'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryBundlesArgs = {
  block?: Maybe<Block_Height>;
  first?: Maybe<Scalars['Int']>;
  orderBy?: Maybe<Bundle_OrderBy>;
  orderDirection?: Maybe<OrderDirection>;
  skip?: Maybe<Scalars['Int']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: Maybe<Bundle_Filter>;
};


export type QueryBurnArgs = {
  block?: Maybe<Block_Height>;
  id: Scalars['ID'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryBurnsArgs = {
  block?: Maybe<Block_Height>;
  first?: Maybe<Scalars['Int']>;
  orderBy?: Maybe<Burn_OrderBy>;
  orderDirection?: Maybe<OrderDirection>;
  skip?: Maybe<Scalars['Int']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: Maybe<Burn_Filter>;
};


export type QueryCollectArgs = {
  block?: Maybe<Block_Height>;
  id: Scalars['ID'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryCollectsArgs = {
  block?: Maybe<Block_Height>;
  first?: Maybe<Scalars['Int']>;
  orderBy?: Maybe<Collect_OrderBy>;
  orderDirection?: Maybe<OrderDirection>;
  skip?: Maybe<Scalars['Int']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: Maybe<Collect_Filter>;
};


export type QueryFactoriesArgs = {
  block?: Maybe<Block_Height>;
  first?: Maybe<Scalars['Int']>;
  orderBy?: Maybe<Factory_OrderBy>;
  orderDirection?: Maybe<OrderDirection>;
  skip?: Maybe<Scalars['Int']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: Maybe<Factory_Filter>;
};


export type QueryFactoryArgs = {
  block?: Maybe<Block_Height>;
  id: Scalars['ID'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryFlashArgs = {
  block?: Maybe<Block_Height>;
  id: Scalars['ID'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryFlashesArgs = {
  block?: Maybe<Block_Height>;
  first?: Maybe<Scalars['Int']>;
  orderBy?: Maybe<Flash_OrderBy>;
  orderDirection?: Maybe<OrderDirection>;
  skip?: Maybe<Scalars['Int']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: Maybe<Flash_Filter>;
};


export type QueryMintArgs = {
  block?: Maybe<Block_Height>;
  id: Scalars['ID'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryMintsArgs = {
  block?: Maybe<Block_Height>;
  first?: Maybe<Scalars['Int']>;
  orderBy?: Maybe<Mint_OrderBy>;
  orderDirection?: Maybe<OrderDirection>;
  skip?: Maybe<Scalars['Int']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: Maybe<Mint_Filter>;
};


export type QueryPoolArgs = {
  block?: Maybe<Block_Height>;
  id: Scalars['ID'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryPoolDayDataArgs = {
  block?: Maybe<Block_Height>;
  id: Scalars['ID'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryPoolDayDatasArgs = {
  block?: Maybe<Block_Height>;
  first?: Maybe<Scalars['Int']>;
  orderBy?: Maybe<PoolDayData_OrderBy>;
  orderDirection?: Maybe<OrderDirection>;
  skip?: Maybe<Scalars['Int']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: Maybe<PoolDayData_Filter>;
};


export type QueryPoolHourDataArgs = {
  block?: Maybe<Block_Height>;
  id: Scalars['ID'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryPoolHourDatasArgs = {
  block?: Maybe<Block_Height>;
  first?: Maybe<Scalars['Int']>;
  orderBy?: Maybe<PoolHourData_OrderBy>;
  orderDirection?: Maybe<OrderDirection>;
  skip?: Maybe<Scalars['Int']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: Maybe<PoolHourData_Filter>;
};


export type QueryPoolsArgs = {
  block?: Maybe<Block_Height>;
  first?: Maybe<Scalars['Int']>;
  orderBy?: Maybe<Pool_OrderBy>;
  orderDirection?: Maybe<OrderDirection>;
  skip?: Maybe<Scalars['Int']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: Maybe<Pool_Filter>;
};


export type QueryPositionArgs = {
  block?: Maybe<Block_Height>;
  id: Scalars['ID'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryPositionSnapshotArgs = {
  block?: Maybe<Block_Height>;
  id: Scalars['ID'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryPositionSnapshotsArgs = {
  block?: Maybe<Block_Height>;
  first?: Maybe<Scalars['Int']>;
  orderBy?: Maybe<PositionSnapshot_OrderBy>;
  orderDirection?: Maybe<OrderDirection>;
  skip?: Maybe<Scalars['Int']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: Maybe<PositionSnapshot_Filter>;
};


export type QueryPositionsArgs = {
  block?: Maybe<Block_Height>;
  first?: Maybe<Scalars['Int']>;
  orderBy?: Maybe<Position_OrderBy>;
  orderDirection?: Maybe<OrderDirection>;
  skip?: Maybe<Scalars['Int']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: Maybe<Position_Filter>;
};


export type QuerySwapArgs = {
  block?: Maybe<Block_Height>;
  id: Scalars['ID'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QuerySwapsArgs = {
  block?: Maybe<Block_Height>;
  first?: Maybe<Scalars['Int']>;
  orderBy?: Maybe<Swap_OrderBy>;
  orderDirection?: Maybe<OrderDirection>;
  skip?: Maybe<Scalars['Int']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: Maybe<Swap_Filter>;
};


export type QueryTickArgs = {
  block?: Maybe<Block_Height>;
  id: Scalars['ID'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryTickDayDataArgs = {
  block?: Maybe<Block_Height>;
  id: Scalars['ID'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryTickDayDatasArgs = {
  block?: Maybe<Block_Height>;
  first?: Maybe<Scalars['Int']>;
  orderBy?: Maybe<TickDayData_OrderBy>;
  orderDirection?: Maybe<OrderDirection>;
  skip?: Maybe<Scalars['Int']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: Maybe<TickDayData_Filter>;
};


export type QueryTickHourDataArgs = {
  block?: Maybe<Block_Height>;
  id: Scalars['ID'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryTickHourDatasArgs = {
  block?: Maybe<Block_Height>;
  first?: Maybe<Scalars['Int']>;
  orderBy?: Maybe<TickHourData_OrderBy>;
  orderDirection?: Maybe<OrderDirection>;
  skip?: Maybe<Scalars['Int']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: Maybe<TickHourData_Filter>;
};


export type QueryTicksArgs = {
  block?: Maybe<Block_Height>;
  first?: Maybe<Scalars['Int']>;
  orderBy?: Maybe<Tick_OrderBy>;
  orderDirection?: Maybe<OrderDirection>;
  skip?: Maybe<Scalars['Int']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: Maybe<Tick_Filter>;
};


export type QueryTokenArgs = {
  block?: Maybe<Block_Height>;
  id: Scalars['ID'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryTokenDayDataArgs = {
  block?: Maybe<Block_Height>;
  id: Scalars['ID'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryTokenDayDatasArgs = {
  block?: Maybe<Block_Height>;
  first?: Maybe<Scalars['Int']>;
  orderBy?: Maybe<TokenDayData_OrderBy>;
  orderDirection?: Maybe<OrderDirection>;
  skip?: Maybe<Scalars['Int']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: Maybe<TokenDayData_Filter>;
};


export type QueryTokenHourDataArgs = {
  block?: Maybe<Block_Height>;
  id: Scalars['ID'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryTokenHourDatasArgs = {
  block?: Maybe<Block_Height>;
  first?: Maybe<Scalars['Int']>;
  orderBy?: Maybe<TokenHourData_OrderBy>;
  orderDirection?: Maybe<OrderDirection>;
  skip?: Maybe<Scalars['Int']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: Maybe<TokenHourData_Filter>;
};


export type QueryTokensArgs = {
  block?: Maybe<Block_Height>;
  first?: Maybe<Scalars['Int']>;
  orderBy?: Maybe<Token_OrderBy>;
  orderDirection?: Maybe<OrderDirection>;
  skip?: Maybe<Scalars['Int']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: Maybe<Token_Filter>;
};


export type QueryTransactionArgs = {
  block?: Maybe<Block_Height>;
  id: Scalars['ID'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryTransactionsArgs = {
  block?: Maybe<Block_Height>;
  first?: Maybe<Scalars['Int']>;
  orderBy?: Maybe<Transaction_OrderBy>;
  orderDirection?: Maybe<OrderDirection>;
  skip?: Maybe<Scalars['Int']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: Maybe<Transaction_Filter>;
};


export type QueryUniswapDayDataArgs = {
  block?: Maybe<Block_Height>;
  id: Scalars['ID'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryUniswapDayDatasArgs = {
  block?: Maybe<Block_Height>;
  first?: Maybe<Scalars['Int']>;
  orderBy?: Maybe<UniswapDayData_OrderBy>;
  orderDirection?: Maybe<OrderDirection>;
  skip?: Maybe<Scalars['Int']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: Maybe<UniswapDayData_Filter>;
};

export type Subscription = {
  __typename?: 'Subscription';
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
  tickDayData?: Maybe<TickDayData>;
  tickDayDatas: Array<TickDayData>;
  tickHourData?: Maybe<TickHourData>;
  tickHourDatas: Array<TickHourData>;
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


export type Subscription_MetaArgs = {
  block?: Maybe<Block_Height>;
};


export type SubscriptionBundleArgs = {
  block?: Maybe<Block_Height>;
  id: Scalars['ID'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionBundlesArgs = {
  block?: Maybe<Block_Height>;
  first?: Maybe<Scalars['Int']>;
  orderBy?: Maybe<Bundle_OrderBy>;
  orderDirection?: Maybe<OrderDirection>;
  skip?: Maybe<Scalars['Int']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: Maybe<Bundle_Filter>;
};


export type SubscriptionBurnArgs = {
  block?: Maybe<Block_Height>;
  id: Scalars['ID'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionBurnsArgs = {
  block?: Maybe<Block_Height>;
  first?: Maybe<Scalars['Int']>;
  orderBy?: Maybe<Burn_OrderBy>;
  orderDirection?: Maybe<OrderDirection>;
  skip?: Maybe<Scalars['Int']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: Maybe<Burn_Filter>;
};


export type SubscriptionCollectArgs = {
  block?: Maybe<Block_Height>;
  id: Scalars['ID'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionCollectsArgs = {
  block?: Maybe<Block_Height>;
  first?: Maybe<Scalars['Int']>;
  orderBy?: Maybe<Collect_OrderBy>;
  orderDirection?: Maybe<OrderDirection>;
  skip?: Maybe<Scalars['Int']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: Maybe<Collect_Filter>;
};


export type SubscriptionFactoriesArgs = {
  block?: Maybe<Block_Height>;
  first?: Maybe<Scalars['Int']>;
  orderBy?: Maybe<Factory_OrderBy>;
  orderDirection?: Maybe<OrderDirection>;
  skip?: Maybe<Scalars['Int']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: Maybe<Factory_Filter>;
};


export type SubscriptionFactoryArgs = {
  block?: Maybe<Block_Height>;
  id: Scalars['ID'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionFlashArgs = {
  block?: Maybe<Block_Height>;
  id: Scalars['ID'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionFlashesArgs = {
  block?: Maybe<Block_Height>;
  first?: Maybe<Scalars['Int']>;
  orderBy?: Maybe<Flash_OrderBy>;
  orderDirection?: Maybe<OrderDirection>;
  skip?: Maybe<Scalars['Int']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: Maybe<Flash_Filter>;
};


export type SubscriptionMintArgs = {
  block?: Maybe<Block_Height>;
  id: Scalars['ID'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionMintsArgs = {
  block?: Maybe<Block_Height>;
  first?: Maybe<Scalars['Int']>;
  orderBy?: Maybe<Mint_OrderBy>;
  orderDirection?: Maybe<OrderDirection>;
  skip?: Maybe<Scalars['Int']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: Maybe<Mint_Filter>;
};


export type SubscriptionPoolArgs = {
  block?: Maybe<Block_Height>;
  id: Scalars['ID'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionPoolDayDataArgs = {
  block?: Maybe<Block_Height>;
  id: Scalars['ID'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionPoolDayDatasArgs = {
  block?: Maybe<Block_Height>;
  first?: Maybe<Scalars['Int']>;
  orderBy?: Maybe<PoolDayData_OrderBy>;
  orderDirection?: Maybe<OrderDirection>;
  skip?: Maybe<Scalars['Int']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: Maybe<PoolDayData_Filter>;
};


export type SubscriptionPoolHourDataArgs = {
  block?: Maybe<Block_Height>;
  id: Scalars['ID'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionPoolHourDatasArgs = {
  block?: Maybe<Block_Height>;
  first?: Maybe<Scalars['Int']>;
  orderBy?: Maybe<PoolHourData_OrderBy>;
  orderDirection?: Maybe<OrderDirection>;
  skip?: Maybe<Scalars['Int']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: Maybe<PoolHourData_Filter>;
};


export type SubscriptionPoolsArgs = {
  block?: Maybe<Block_Height>;
  first?: Maybe<Scalars['Int']>;
  orderBy?: Maybe<Pool_OrderBy>;
  orderDirection?: Maybe<OrderDirection>;
  skip?: Maybe<Scalars['Int']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: Maybe<Pool_Filter>;
};


export type SubscriptionPositionArgs = {
  block?: Maybe<Block_Height>;
  id: Scalars['ID'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionPositionSnapshotArgs = {
  block?: Maybe<Block_Height>;
  id: Scalars['ID'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionPositionSnapshotsArgs = {
  block?: Maybe<Block_Height>;
  first?: Maybe<Scalars['Int']>;
  orderBy?: Maybe<PositionSnapshot_OrderBy>;
  orderDirection?: Maybe<OrderDirection>;
  skip?: Maybe<Scalars['Int']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: Maybe<PositionSnapshot_Filter>;
};


export type SubscriptionPositionsArgs = {
  block?: Maybe<Block_Height>;
  first?: Maybe<Scalars['Int']>;
  orderBy?: Maybe<Position_OrderBy>;
  orderDirection?: Maybe<OrderDirection>;
  skip?: Maybe<Scalars['Int']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: Maybe<Position_Filter>;
};


export type SubscriptionSwapArgs = {
  block?: Maybe<Block_Height>;
  id: Scalars['ID'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionSwapsArgs = {
  block?: Maybe<Block_Height>;
  first?: Maybe<Scalars['Int']>;
  orderBy?: Maybe<Swap_OrderBy>;
  orderDirection?: Maybe<OrderDirection>;
  skip?: Maybe<Scalars['Int']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: Maybe<Swap_Filter>;
};


export type SubscriptionTickArgs = {
  block?: Maybe<Block_Height>;
  id: Scalars['ID'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionTickDayDataArgs = {
  block?: Maybe<Block_Height>;
  id: Scalars['ID'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionTickDayDatasArgs = {
  block?: Maybe<Block_Height>;
  first?: Maybe<Scalars['Int']>;
  orderBy?: Maybe<TickDayData_OrderBy>;
  orderDirection?: Maybe<OrderDirection>;
  skip?: Maybe<Scalars['Int']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: Maybe<TickDayData_Filter>;
};


export type SubscriptionTickHourDataArgs = {
  block?: Maybe<Block_Height>;
  id: Scalars['ID'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionTickHourDatasArgs = {
  block?: Maybe<Block_Height>;
  first?: Maybe<Scalars['Int']>;
  orderBy?: Maybe<TickHourData_OrderBy>;
  orderDirection?: Maybe<OrderDirection>;
  skip?: Maybe<Scalars['Int']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: Maybe<TickHourData_Filter>;
};


export type SubscriptionTicksArgs = {
  block?: Maybe<Block_Height>;
  first?: Maybe<Scalars['Int']>;
  orderBy?: Maybe<Tick_OrderBy>;
  orderDirection?: Maybe<OrderDirection>;
  skip?: Maybe<Scalars['Int']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: Maybe<Tick_Filter>;
};


export type SubscriptionTokenArgs = {
  block?: Maybe<Block_Height>;
  id: Scalars['ID'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionTokenDayDataArgs = {
  block?: Maybe<Block_Height>;
  id: Scalars['ID'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionTokenDayDatasArgs = {
  block?: Maybe<Block_Height>;
  first?: Maybe<Scalars['Int']>;
  orderBy?: Maybe<TokenDayData_OrderBy>;
  orderDirection?: Maybe<OrderDirection>;
  skip?: Maybe<Scalars['Int']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: Maybe<TokenDayData_Filter>;
};


export type SubscriptionTokenHourDataArgs = {
  block?: Maybe<Block_Height>;
  id: Scalars['ID'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionTokenHourDatasArgs = {
  block?: Maybe<Block_Height>;
  first?: Maybe<Scalars['Int']>;
  orderBy?: Maybe<TokenHourData_OrderBy>;
  orderDirection?: Maybe<OrderDirection>;
  skip?: Maybe<Scalars['Int']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: Maybe<TokenHourData_Filter>;
};


export type SubscriptionTokensArgs = {
  block?: Maybe<Block_Height>;
  first?: Maybe<Scalars['Int']>;
  orderBy?: Maybe<Token_OrderBy>;
  orderDirection?: Maybe<OrderDirection>;
  skip?: Maybe<Scalars['Int']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: Maybe<Token_Filter>;
};


export type SubscriptionTransactionArgs = {
  block?: Maybe<Block_Height>;
  id: Scalars['ID'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionTransactionsArgs = {
  block?: Maybe<Block_Height>;
  first?: Maybe<Scalars['Int']>;
  orderBy?: Maybe<Transaction_OrderBy>;
  orderDirection?: Maybe<OrderDirection>;
  skip?: Maybe<Scalars['Int']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: Maybe<Transaction_Filter>;
};


export type SubscriptionUniswapDayDataArgs = {
  block?: Maybe<Block_Height>;
  id: Scalars['ID'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionUniswapDayDatasArgs = {
  block?: Maybe<Block_Height>;
  first?: Maybe<Scalars['Int']>;
  orderBy?: Maybe<UniswapDayData_OrderBy>;
  orderDirection?: Maybe<OrderDirection>;
  skip?: Maybe<Scalars['Int']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: Maybe<UniswapDayData_Filter>;
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
  amount0?: Maybe<Scalars['BigDecimal']>;
  amount0_gt?: Maybe<Scalars['BigDecimal']>;
  amount0_gte?: Maybe<Scalars['BigDecimal']>;
  amount0_in?: Maybe<Array<Scalars['BigDecimal']>>;
  amount0_lt?: Maybe<Scalars['BigDecimal']>;
  amount0_lte?: Maybe<Scalars['BigDecimal']>;
  amount0_not?: Maybe<Scalars['BigDecimal']>;
  amount0_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  amount1?: Maybe<Scalars['BigDecimal']>;
  amount1_gt?: Maybe<Scalars['BigDecimal']>;
  amount1_gte?: Maybe<Scalars['BigDecimal']>;
  amount1_in?: Maybe<Array<Scalars['BigDecimal']>>;
  amount1_lt?: Maybe<Scalars['BigDecimal']>;
  amount1_lte?: Maybe<Scalars['BigDecimal']>;
  amount1_not?: Maybe<Scalars['BigDecimal']>;
  amount1_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  amountUSD?: Maybe<Scalars['BigDecimal']>;
  amountUSD_gt?: Maybe<Scalars['BigDecimal']>;
  amountUSD_gte?: Maybe<Scalars['BigDecimal']>;
  amountUSD_in?: Maybe<Array<Scalars['BigDecimal']>>;
  amountUSD_lt?: Maybe<Scalars['BigDecimal']>;
  amountUSD_lte?: Maybe<Scalars['BigDecimal']>;
  amountUSD_not?: Maybe<Scalars['BigDecimal']>;
  amountUSD_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  id?: Maybe<Scalars['ID']>;
  id_gt?: Maybe<Scalars['ID']>;
  id_gte?: Maybe<Scalars['ID']>;
  id_in?: Maybe<Array<Scalars['ID']>>;
  id_lt?: Maybe<Scalars['ID']>;
  id_lte?: Maybe<Scalars['ID']>;
  id_not?: Maybe<Scalars['ID']>;
  id_not_in?: Maybe<Array<Scalars['ID']>>;
  logIndex?: Maybe<Scalars['BigInt']>;
  logIndex_gt?: Maybe<Scalars['BigInt']>;
  logIndex_gte?: Maybe<Scalars['BigInt']>;
  logIndex_in?: Maybe<Array<Scalars['BigInt']>>;
  logIndex_lt?: Maybe<Scalars['BigInt']>;
  logIndex_lte?: Maybe<Scalars['BigInt']>;
  logIndex_not?: Maybe<Scalars['BigInt']>;
  logIndex_not_in?: Maybe<Array<Scalars['BigInt']>>;
  origin?: Maybe<Scalars['Bytes']>;
  origin_contains?: Maybe<Scalars['Bytes']>;
  origin_in?: Maybe<Array<Scalars['Bytes']>>;
  origin_not?: Maybe<Scalars['Bytes']>;
  origin_not_contains?: Maybe<Scalars['Bytes']>;
  origin_not_in?: Maybe<Array<Scalars['Bytes']>>;
  pool?: Maybe<Scalars['String']>;
  pool_contains?: Maybe<Scalars['String']>;
  pool_ends_with?: Maybe<Scalars['String']>;
  pool_gt?: Maybe<Scalars['String']>;
  pool_gte?: Maybe<Scalars['String']>;
  pool_in?: Maybe<Array<Scalars['String']>>;
  pool_lt?: Maybe<Scalars['String']>;
  pool_lte?: Maybe<Scalars['String']>;
  pool_not?: Maybe<Scalars['String']>;
  pool_not_contains?: Maybe<Scalars['String']>;
  pool_not_ends_with?: Maybe<Scalars['String']>;
  pool_not_in?: Maybe<Array<Scalars['String']>>;
  pool_not_starts_with?: Maybe<Scalars['String']>;
  pool_starts_with?: Maybe<Scalars['String']>;
  recipient?: Maybe<Scalars['Bytes']>;
  recipient_contains?: Maybe<Scalars['Bytes']>;
  recipient_in?: Maybe<Array<Scalars['Bytes']>>;
  recipient_not?: Maybe<Scalars['Bytes']>;
  recipient_not_contains?: Maybe<Scalars['Bytes']>;
  recipient_not_in?: Maybe<Array<Scalars['Bytes']>>;
  sender?: Maybe<Scalars['Bytes']>;
  sender_contains?: Maybe<Scalars['Bytes']>;
  sender_in?: Maybe<Array<Scalars['Bytes']>>;
  sender_not?: Maybe<Scalars['Bytes']>;
  sender_not_contains?: Maybe<Scalars['Bytes']>;
  sender_not_in?: Maybe<Array<Scalars['Bytes']>>;
  sqrtPriceX96?: Maybe<Scalars['BigInt']>;
  sqrtPriceX96_gt?: Maybe<Scalars['BigInt']>;
  sqrtPriceX96_gte?: Maybe<Scalars['BigInt']>;
  sqrtPriceX96_in?: Maybe<Array<Scalars['BigInt']>>;
  sqrtPriceX96_lt?: Maybe<Scalars['BigInt']>;
  sqrtPriceX96_lte?: Maybe<Scalars['BigInt']>;
  sqrtPriceX96_not?: Maybe<Scalars['BigInt']>;
  sqrtPriceX96_not_in?: Maybe<Array<Scalars['BigInt']>>;
  tick?: Maybe<Scalars['BigInt']>;
  tick_gt?: Maybe<Scalars['BigInt']>;
  tick_gte?: Maybe<Scalars['BigInt']>;
  tick_in?: Maybe<Array<Scalars['BigInt']>>;
  tick_lt?: Maybe<Scalars['BigInt']>;
  tick_lte?: Maybe<Scalars['BigInt']>;
  tick_not?: Maybe<Scalars['BigInt']>;
  tick_not_in?: Maybe<Array<Scalars['BigInt']>>;
  timestamp?: Maybe<Scalars['BigInt']>;
  timestamp_gt?: Maybe<Scalars['BigInt']>;
  timestamp_gte?: Maybe<Scalars['BigInt']>;
  timestamp_in?: Maybe<Array<Scalars['BigInt']>>;
  timestamp_lt?: Maybe<Scalars['BigInt']>;
  timestamp_lte?: Maybe<Scalars['BigInt']>;
  timestamp_not?: Maybe<Scalars['BigInt']>;
  timestamp_not_in?: Maybe<Array<Scalars['BigInt']>>;
  token0?: Maybe<Scalars['String']>;
  token0_contains?: Maybe<Scalars['String']>;
  token0_ends_with?: Maybe<Scalars['String']>;
  token0_gt?: Maybe<Scalars['String']>;
  token0_gte?: Maybe<Scalars['String']>;
  token0_in?: Maybe<Array<Scalars['String']>>;
  token0_lt?: Maybe<Scalars['String']>;
  token0_lte?: Maybe<Scalars['String']>;
  token0_not?: Maybe<Scalars['String']>;
  token0_not_contains?: Maybe<Scalars['String']>;
  token0_not_ends_with?: Maybe<Scalars['String']>;
  token0_not_in?: Maybe<Array<Scalars['String']>>;
  token0_not_starts_with?: Maybe<Scalars['String']>;
  token0_starts_with?: Maybe<Scalars['String']>;
  token1?: Maybe<Scalars['String']>;
  token1_contains?: Maybe<Scalars['String']>;
  token1_ends_with?: Maybe<Scalars['String']>;
  token1_gt?: Maybe<Scalars['String']>;
  token1_gte?: Maybe<Scalars['String']>;
  token1_in?: Maybe<Array<Scalars['String']>>;
  token1_lt?: Maybe<Scalars['String']>;
  token1_lte?: Maybe<Scalars['String']>;
  token1_not?: Maybe<Scalars['String']>;
  token1_not_contains?: Maybe<Scalars['String']>;
  token1_not_ends_with?: Maybe<Scalars['String']>;
  token1_not_in?: Maybe<Array<Scalars['String']>>;
  token1_not_starts_with?: Maybe<Scalars['String']>;
  token1_starts_with?: Maybe<Scalars['String']>;
  transaction?: Maybe<Scalars['String']>;
  transaction_contains?: Maybe<Scalars['String']>;
  transaction_ends_with?: Maybe<Scalars['String']>;
  transaction_gt?: Maybe<Scalars['String']>;
  transaction_gte?: Maybe<Scalars['String']>;
  transaction_in?: Maybe<Array<Scalars['String']>>;
  transaction_lt?: Maybe<Scalars['String']>;
  transaction_lte?: Maybe<Scalars['String']>;
  transaction_not?: Maybe<Scalars['String']>;
  transaction_not_contains?: Maybe<Scalars['String']>;
  transaction_not_ends_with?: Maybe<Scalars['String']>;
  transaction_not_in?: Maybe<Array<Scalars['String']>>;
  transaction_not_starts_with?: Maybe<Scalars['String']>;
  transaction_starts_with?: Maybe<Scalars['String']>;
};

export enum Swap_OrderBy {
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
  Transaction = 'transaction'
}

export type Tick = {
  __typename?: 'Tick';
  collectedFeesToken0: Scalars['BigDecimal'];
  collectedFeesToken1: Scalars['BigDecimal'];
  collectedFeesUSD: Scalars['BigDecimal'];
  createdAtBlockNumber: Scalars['BigInt'];
  createdAtTimestamp: Scalars['BigInt'];
  feeGrowthOutside0X128: Scalars['BigInt'];
  feeGrowthOutside1X128: Scalars['BigInt'];
  feesUSD: Scalars['BigDecimal'];
  id: Scalars['ID'];
  liquidityGross: Scalars['BigInt'];
  liquidityNet: Scalars['BigInt'];
  liquidityProviderCount: Scalars['BigInt'];
  pool: Pool;
  poolAddress?: Maybe<Scalars['String']>;
  price0: Scalars['BigDecimal'];
  price1: Scalars['BigDecimal'];
  tickIdx: Scalars['BigInt'];
  untrackedVolumeUSD: Scalars['BigDecimal'];
  volumeToken0: Scalars['BigDecimal'];
  volumeToken1: Scalars['BigDecimal'];
  volumeUSD: Scalars['BigDecimal'];
};

export type TickDayData = {
  __typename?: 'TickDayData';
  date: Scalars['Int'];
  feeGrowthOutside0X128: Scalars['BigInt'];
  feeGrowthOutside1X128: Scalars['BigInt'];
  feesUSD: Scalars['BigDecimal'];
  id: Scalars['ID'];
  liquidityGross: Scalars['BigInt'];
  liquidityNet: Scalars['BigInt'];
  pool: Pool;
  tick: Tick;
  volumeToken0: Scalars['BigDecimal'];
  volumeToken1: Scalars['BigDecimal'];
  volumeUSD: Scalars['BigDecimal'];
};

export type TickDayData_Filter = {
  date?: Maybe<Scalars['Int']>;
  date_gt?: Maybe<Scalars['Int']>;
  date_gte?: Maybe<Scalars['Int']>;
  date_in?: Maybe<Array<Scalars['Int']>>;
  date_lt?: Maybe<Scalars['Int']>;
  date_lte?: Maybe<Scalars['Int']>;
  date_not?: Maybe<Scalars['Int']>;
  date_not_in?: Maybe<Array<Scalars['Int']>>;
  feeGrowthOutside0X128?: Maybe<Scalars['BigInt']>;
  feeGrowthOutside0X128_gt?: Maybe<Scalars['BigInt']>;
  feeGrowthOutside0X128_gte?: Maybe<Scalars['BigInt']>;
  feeGrowthOutside0X128_in?: Maybe<Array<Scalars['BigInt']>>;
  feeGrowthOutside0X128_lt?: Maybe<Scalars['BigInt']>;
  feeGrowthOutside0X128_lte?: Maybe<Scalars['BigInt']>;
  feeGrowthOutside0X128_not?: Maybe<Scalars['BigInt']>;
  feeGrowthOutside0X128_not_in?: Maybe<Array<Scalars['BigInt']>>;
  feeGrowthOutside1X128?: Maybe<Scalars['BigInt']>;
  feeGrowthOutside1X128_gt?: Maybe<Scalars['BigInt']>;
  feeGrowthOutside1X128_gte?: Maybe<Scalars['BigInt']>;
  feeGrowthOutside1X128_in?: Maybe<Array<Scalars['BigInt']>>;
  feeGrowthOutside1X128_lt?: Maybe<Scalars['BigInt']>;
  feeGrowthOutside1X128_lte?: Maybe<Scalars['BigInt']>;
  feeGrowthOutside1X128_not?: Maybe<Scalars['BigInt']>;
  feeGrowthOutside1X128_not_in?: Maybe<Array<Scalars['BigInt']>>;
  feesUSD?: Maybe<Scalars['BigDecimal']>;
  feesUSD_gt?: Maybe<Scalars['BigDecimal']>;
  feesUSD_gte?: Maybe<Scalars['BigDecimal']>;
  feesUSD_in?: Maybe<Array<Scalars['BigDecimal']>>;
  feesUSD_lt?: Maybe<Scalars['BigDecimal']>;
  feesUSD_lte?: Maybe<Scalars['BigDecimal']>;
  feesUSD_not?: Maybe<Scalars['BigDecimal']>;
  feesUSD_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  id?: Maybe<Scalars['ID']>;
  id_gt?: Maybe<Scalars['ID']>;
  id_gte?: Maybe<Scalars['ID']>;
  id_in?: Maybe<Array<Scalars['ID']>>;
  id_lt?: Maybe<Scalars['ID']>;
  id_lte?: Maybe<Scalars['ID']>;
  id_not?: Maybe<Scalars['ID']>;
  id_not_in?: Maybe<Array<Scalars['ID']>>;
  liquidityGross?: Maybe<Scalars['BigInt']>;
  liquidityGross_gt?: Maybe<Scalars['BigInt']>;
  liquidityGross_gte?: Maybe<Scalars['BigInt']>;
  liquidityGross_in?: Maybe<Array<Scalars['BigInt']>>;
  liquidityGross_lt?: Maybe<Scalars['BigInt']>;
  liquidityGross_lte?: Maybe<Scalars['BigInt']>;
  liquidityGross_not?: Maybe<Scalars['BigInt']>;
  liquidityGross_not_in?: Maybe<Array<Scalars['BigInt']>>;
  liquidityNet?: Maybe<Scalars['BigInt']>;
  liquidityNet_gt?: Maybe<Scalars['BigInt']>;
  liquidityNet_gte?: Maybe<Scalars['BigInt']>;
  liquidityNet_in?: Maybe<Array<Scalars['BigInt']>>;
  liquidityNet_lt?: Maybe<Scalars['BigInt']>;
  liquidityNet_lte?: Maybe<Scalars['BigInt']>;
  liquidityNet_not?: Maybe<Scalars['BigInt']>;
  liquidityNet_not_in?: Maybe<Array<Scalars['BigInt']>>;
  pool?: Maybe<Scalars['String']>;
  pool_contains?: Maybe<Scalars['String']>;
  pool_ends_with?: Maybe<Scalars['String']>;
  pool_gt?: Maybe<Scalars['String']>;
  pool_gte?: Maybe<Scalars['String']>;
  pool_in?: Maybe<Array<Scalars['String']>>;
  pool_lt?: Maybe<Scalars['String']>;
  pool_lte?: Maybe<Scalars['String']>;
  pool_not?: Maybe<Scalars['String']>;
  pool_not_contains?: Maybe<Scalars['String']>;
  pool_not_ends_with?: Maybe<Scalars['String']>;
  pool_not_in?: Maybe<Array<Scalars['String']>>;
  pool_not_starts_with?: Maybe<Scalars['String']>;
  pool_starts_with?: Maybe<Scalars['String']>;
  tick?: Maybe<Scalars['String']>;
  tick_contains?: Maybe<Scalars['String']>;
  tick_ends_with?: Maybe<Scalars['String']>;
  tick_gt?: Maybe<Scalars['String']>;
  tick_gte?: Maybe<Scalars['String']>;
  tick_in?: Maybe<Array<Scalars['String']>>;
  tick_lt?: Maybe<Scalars['String']>;
  tick_lte?: Maybe<Scalars['String']>;
  tick_not?: Maybe<Scalars['String']>;
  tick_not_contains?: Maybe<Scalars['String']>;
  tick_not_ends_with?: Maybe<Scalars['String']>;
  tick_not_in?: Maybe<Array<Scalars['String']>>;
  tick_not_starts_with?: Maybe<Scalars['String']>;
  tick_starts_with?: Maybe<Scalars['String']>;
  volumeToken0?: Maybe<Scalars['BigDecimal']>;
  volumeToken0_gt?: Maybe<Scalars['BigDecimal']>;
  volumeToken0_gte?: Maybe<Scalars['BigDecimal']>;
  volumeToken0_in?: Maybe<Array<Scalars['BigDecimal']>>;
  volumeToken0_lt?: Maybe<Scalars['BigDecimal']>;
  volumeToken0_lte?: Maybe<Scalars['BigDecimal']>;
  volumeToken0_not?: Maybe<Scalars['BigDecimal']>;
  volumeToken0_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  volumeToken1?: Maybe<Scalars['BigDecimal']>;
  volumeToken1_gt?: Maybe<Scalars['BigDecimal']>;
  volumeToken1_gte?: Maybe<Scalars['BigDecimal']>;
  volumeToken1_in?: Maybe<Array<Scalars['BigDecimal']>>;
  volumeToken1_lt?: Maybe<Scalars['BigDecimal']>;
  volumeToken1_lte?: Maybe<Scalars['BigDecimal']>;
  volumeToken1_not?: Maybe<Scalars['BigDecimal']>;
  volumeToken1_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  volumeUSD?: Maybe<Scalars['BigDecimal']>;
  volumeUSD_gt?: Maybe<Scalars['BigDecimal']>;
  volumeUSD_gte?: Maybe<Scalars['BigDecimal']>;
  volumeUSD_in?: Maybe<Array<Scalars['BigDecimal']>>;
  volumeUSD_lt?: Maybe<Scalars['BigDecimal']>;
  volumeUSD_lte?: Maybe<Scalars['BigDecimal']>;
  volumeUSD_not?: Maybe<Scalars['BigDecimal']>;
  volumeUSD_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
};

export enum TickDayData_OrderBy {
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
  VolumeUsd = 'volumeUSD'
}

export type TickHourData = {
  __typename?: 'TickHourData';
  feesUSD: Scalars['BigDecimal'];
  id: Scalars['ID'];
  liquidityGross: Scalars['BigInt'];
  liquidityNet: Scalars['BigInt'];
  periodStartUnix: Scalars['Int'];
  pool: Pool;
  tick: Tick;
  volumeToken0: Scalars['BigDecimal'];
  volumeToken1: Scalars['BigDecimal'];
  volumeUSD: Scalars['BigDecimal'];
};

export type TickHourData_Filter = {
  feesUSD?: Maybe<Scalars['BigDecimal']>;
  feesUSD_gt?: Maybe<Scalars['BigDecimal']>;
  feesUSD_gte?: Maybe<Scalars['BigDecimal']>;
  feesUSD_in?: Maybe<Array<Scalars['BigDecimal']>>;
  feesUSD_lt?: Maybe<Scalars['BigDecimal']>;
  feesUSD_lte?: Maybe<Scalars['BigDecimal']>;
  feesUSD_not?: Maybe<Scalars['BigDecimal']>;
  feesUSD_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  id?: Maybe<Scalars['ID']>;
  id_gt?: Maybe<Scalars['ID']>;
  id_gte?: Maybe<Scalars['ID']>;
  id_in?: Maybe<Array<Scalars['ID']>>;
  id_lt?: Maybe<Scalars['ID']>;
  id_lte?: Maybe<Scalars['ID']>;
  id_not?: Maybe<Scalars['ID']>;
  id_not_in?: Maybe<Array<Scalars['ID']>>;
  liquidityGross?: Maybe<Scalars['BigInt']>;
  liquidityGross_gt?: Maybe<Scalars['BigInt']>;
  liquidityGross_gte?: Maybe<Scalars['BigInt']>;
  liquidityGross_in?: Maybe<Array<Scalars['BigInt']>>;
  liquidityGross_lt?: Maybe<Scalars['BigInt']>;
  liquidityGross_lte?: Maybe<Scalars['BigInt']>;
  liquidityGross_not?: Maybe<Scalars['BigInt']>;
  liquidityGross_not_in?: Maybe<Array<Scalars['BigInt']>>;
  liquidityNet?: Maybe<Scalars['BigInt']>;
  liquidityNet_gt?: Maybe<Scalars['BigInt']>;
  liquidityNet_gte?: Maybe<Scalars['BigInt']>;
  liquidityNet_in?: Maybe<Array<Scalars['BigInt']>>;
  liquidityNet_lt?: Maybe<Scalars['BigInt']>;
  liquidityNet_lte?: Maybe<Scalars['BigInt']>;
  liquidityNet_not?: Maybe<Scalars['BigInt']>;
  liquidityNet_not_in?: Maybe<Array<Scalars['BigInt']>>;
  periodStartUnix?: Maybe<Scalars['Int']>;
  periodStartUnix_gt?: Maybe<Scalars['Int']>;
  periodStartUnix_gte?: Maybe<Scalars['Int']>;
  periodStartUnix_in?: Maybe<Array<Scalars['Int']>>;
  periodStartUnix_lt?: Maybe<Scalars['Int']>;
  periodStartUnix_lte?: Maybe<Scalars['Int']>;
  periodStartUnix_not?: Maybe<Scalars['Int']>;
  periodStartUnix_not_in?: Maybe<Array<Scalars['Int']>>;
  pool?: Maybe<Scalars['String']>;
  pool_contains?: Maybe<Scalars['String']>;
  pool_ends_with?: Maybe<Scalars['String']>;
  pool_gt?: Maybe<Scalars['String']>;
  pool_gte?: Maybe<Scalars['String']>;
  pool_in?: Maybe<Array<Scalars['String']>>;
  pool_lt?: Maybe<Scalars['String']>;
  pool_lte?: Maybe<Scalars['String']>;
  pool_not?: Maybe<Scalars['String']>;
  pool_not_contains?: Maybe<Scalars['String']>;
  pool_not_ends_with?: Maybe<Scalars['String']>;
  pool_not_in?: Maybe<Array<Scalars['String']>>;
  pool_not_starts_with?: Maybe<Scalars['String']>;
  pool_starts_with?: Maybe<Scalars['String']>;
  tick?: Maybe<Scalars['String']>;
  tick_contains?: Maybe<Scalars['String']>;
  tick_ends_with?: Maybe<Scalars['String']>;
  tick_gt?: Maybe<Scalars['String']>;
  tick_gte?: Maybe<Scalars['String']>;
  tick_in?: Maybe<Array<Scalars['String']>>;
  tick_lt?: Maybe<Scalars['String']>;
  tick_lte?: Maybe<Scalars['String']>;
  tick_not?: Maybe<Scalars['String']>;
  tick_not_contains?: Maybe<Scalars['String']>;
  tick_not_ends_with?: Maybe<Scalars['String']>;
  tick_not_in?: Maybe<Array<Scalars['String']>>;
  tick_not_starts_with?: Maybe<Scalars['String']>;
  tick_starts_with?: Maybe<Scalars['String']>;
  volumeToken0?: Maybe<Scalars['BigDecimal']>;
  volumeToken0_gt?: Maybe<Scalars['BigDecimal']>;
  volumeToken0_gte?: Maybe<Scalars['BigDecimal']>;
  volumeToken0_in?: Maybe<Array<Scalars['BigDecimal']>>;
  volumeToken0_lt?: Maybe<Scalars['BigDecimal']>;
  volumeToken0_lte?: Maybe<Scalars['BigDecimal']>;
  volumeToken0_not?: Maybe<Scalars['BigDecimal']>;
  volumeToken0_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  volumeToken1?: Maybe<Scalars['BigDecimal']>;
  volumeToken1_gt?: Maybe<Scalars['BigDecimal']>;
  volumeToken1_gte?: Maybe<Scalars['BigDecimal']>;
  volumeToken1_in?: Maybe<Array<Scalars['BigDecimal']>>;
  volumeToken1_lt?: Maybe<Scalars['BigDecimal']>;
  volumeToken1_lte?: Maybe<Scalars['BigDecimal']>;
  volumeToken1_not?: Maybe<Scalars['BigDecimal']>;
  volumeToken1_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  volumeUSD?: Maybe<Scalars['BigDecimal']>;
  volumeUSD_gt?: Maybe<Scalars['BigDecimal']>;
  volumeUSD_gte?: Maybe<Scalars['BigDecimal']>;
  volumeUSD_in?: Maybe<Array<Scalars['BigDecimal']>>;
  volumeUSD_lt?: Maybe<Scalars['BigDecimal']>;
  volumeUSD_lte?: Maybe<Scalars['BigDecimal']>;
  volumeUSD_not?: Maybe<Scalars['BigDecimal']>;
  volumeUSD_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
};

export enum TickHourData_OrderBy {
  FeesUsd = 'feesUSD',
  Id = 'id',
  LiquidityGross = 'liquidityGross',
  LiquidityNet = 'liquidityNet',
  PeriodStartUnix = 'periodStartUnix',
  Pool = 'pool',
  Tick = 'tick',
  VolumeToken0 = 'volumeToken0',
  VolumeToken1 = 'volumeToken1',
  VolumeUsd = 'volumeUSD'
}

export type Tick_Filter = {
  collectedFeesToken0?: Maybe<Scalars['BigDecimal']>;
  collectedFeesToken0_gt?: Maybe<Scalars['BigDecimal']>;
  collectedFeesToken0_gte?: Maybe<Scalars['BigDecimal']>;
  collectedFeesToken0_in?: Maybe<Array<Scalars['BigDecimal']>>;
  collectedFeesToken0_lt?: Maybe<Scalars['BigDecimal']>;
  collectedFeesToken0_lte?: Maybe<Scalars['BigDecimal']>;
  collectedFeesToken0_not?: Maybe<Scalars['BigDecimal']>;
  collectedFeesToken0_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  collectedFeesToken1?: Maybe<Scalars['BigDecimal']>;
  collectedFeesToken1_gt?: Maybe<Scalars['BigDecimal']>;
  collectedFeesToken1_gte?: Maybe<Scalars['BigDecimal']>;
  collectedFeesToken1_in?: Maybe<Array<Scalars['BigDecimal']>>;
  collectedFeesToken1_lt?: Maybe<Scalars['BigDecimal']>;
  collectedFeesToken1_lte?: Maybe<Scalars['BigDecimal']>;
  collectedFeesToken1_not?: Maybe<Scalars['BigDecimal']>;
  collectedFeesToken1_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  collectedFeesUSD?: Maybe<Scalars['BigDecimal']>;
  collectedFeesUSD_gt?: Maybe<Scalars['BigDecimal']>;
  collectedFeesUSD_gte?: Maybe<Scalars['BigDecimal']>;
  collectedFeesUSD_in?: Maybe<Array<Scalars['BigDecimal']>>;
  collectedFeesUSD_lt?: Maybe<Scalars['BigDecimal']>;
  collectedFeesUSD_lte?: Maybe<Scalars['BigDecimal']>;
  collectedFeesUSD_not?: Maybe<Scalars['BigDecimal']>;
  collectedFeesUSD_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  createdAtBlockNumber?: Maybe<Scalars['BigInt']>;
  createdAtBlockNumber_gt?: Maybe<Scalars['BigInt']>;
  createdAtBlockNumber_gte?: Maybe<Scalars['BigInt']>;
  createdAtBlockNumber_in?: Maybe<Array<Scalars['BigInt']>>;
  createdAtBlockNumber_lt?: Maybe<Scalars['BigInt']>;
  createdAtBlockNumber_lte?: Maybe<Scalars['BigInt']>;
  createdAtBlockNumber_not?: Maybe<Scalars['BigInt']>;
  createdAtBlockNumber_not_in?: Maybe<Array<Scalars['BigInt']>>;
  createdAtTimestamp?: Maybe<Scalars['BigInt']>;
  createdAtTimestamp_gt?: Maybe<Scalars['BigInt']>;
  createdAtTimestamp_gte?: Maybe<Scalars['BigInt']>;
  createdAtTimestamp_in?: Maybe<Array<Scalars['BigInt']>>;
  createdAtTimestamp_lt?: Maybe<Scalars['BigInt']>;
  createdAtTimestamp_lte?: Maybe<Scalars['BigInt']>;
  createdAtTimestamp_not?: Maybe<Scalars['BigInt']>;
  createdAtTimestamp_not_in?: Maybe<Array<Scalars['BigInt']>>;
  feeGrowthOutside0X128?: Maybe<Scalars['BigInt']>;
  feeGrowthOutside0X128_gt?: Maybe<Scalars['BigInt']>;
  feeGrowthOutside0X128_gte?: Maybe<Scalars['BigInt']>;
  feeGrowthOutside0X128_in?: Maybe<Array<Scalars['BigInt']>>;
  feeGrowthOutside0X128_lt?: Maybe<Scalars['BigInt']>;
  feeGrowthOutside0X128_lte?: Maybe<Scalars['BigInt']>;
  feeGrowthOutside0X128_not?: Maybe<Scalars['BigInt']>;
  feeGrowthOutside0X128_not_in?: Maybe<Array<Scalars['BigInt']>>;
  feeGrowthOutside1X128?: Maybe<Scalars['BigInt']>;
  feeGrowthOutside1X128_gt?: Maybe<Scalars['BigInt']>;
  feeGrowthOutside1X128_gte?: Maybe<Scalars['BigInt']>;
  feeGrowthOutside1X128_in?: Maybe<Array<Scalars['BigInt']>>;
  feeGrowthOutside1X128_lt?: Maybe<Scalars['BigInt']>;
  feeGrowthOutside1X128_lte?: Maybe<Scalars['BigInt']>;
  feeGrowthOutside1X128_not?: Maybe<Scalars['BigInt']>;
  feeGrowthOutside1X128_not_in?: Maybe<Array<Scalars['BigInt']>>;
  feesUSD?: Maybe<Scalars['BigDecimal']>;
  feesUSD_gt?: Maybe<Scalars['BigDecimal']>;
  feesUSD_gte?: Maybe<Scalars['BigDecimal']>;
  feesUSD_in?: Maybe<Array<Scalars['BigDecimal']>>;
  feesUSD_lt?: Maybe<Scalars['BigDecimal']>;
  feesUSD_lte?: Maybe<Scalars['BigDecimal']>;
  feesUSD_not?: Maybe<Scalars['BigDecimal']>;
  feesUSD_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  id?: Maybe<Scalars['ID']>;
  id_gt?: Maybe<Scalars['ID']>;
  id_gte?: Maybe<Scalars['ID']>;
  id_in?: Maybe<Array<Scalars['ID']>>;
  id_lt?: Maybe<Scalars['ID']>;
  id_lte?: Maybe<Scalars['ID']>;
  id_not?: Maybe<Scalars['ID']>;
  id_not_in?: Maybe<Array<Scalars['ID']>>;
  liquidityGross?: Maybe<Scalars['BigInt']>;
  liquidityGross_gt?: Maybe<Scalars['BigInt']>;
  liquidityGross_gte?: Maybe<Scalars['BigInt']>;
  liquidityGross_in?: Maybe<Array<Scalars['BigInt']>>;
  liquidityGross_lt?: Maybe<Scalars['BigInt']>;
  liquidityGross_lte?: Maybe<Scalars['BigInt']>;
  liquidityGross_not?: Maybe<Scalars['BigInt']>;
  liquidityGross_not_in?: Maybe<Array<Scalars['BigInt']>>;
  liquidityNet?: Maybe<Scalars['BigInt']>;
  liquidityNet_gt?: Maybe<Scalars['BigInt']>;
  liquidityNet_gte?: Maybe<Scalars['BigInt']>;
  liquidityNet_in?: Maybe<Array<Scalars['BigInt']>>;
  liquidityNet_lt?: Maybe<Scalars['BigInt']>;
  liquidityNet_lte?: Maybe<Scalars['BigInt']>;
  liquidityNet_not?: Maybe<Scalars['BigInt']>;
  liquidityNet_not_in?: Maybe<Array<Scalars['BigInt']>>;
  liquidityProviderCount?: Maybe<Scalars['BigInt']>;
  liquidityProviderCount_gt?: Maybe<Scalars['BigInt']>;
  liquidityProviderCount_gte?: Maybe<Scalars['BigInt']>;
  liquidityProviderCount_in?: Maybe<Array<Scalars['BigInt']>>;
  liquidityProviderCount_lt?: Maybe<Scalars['BigInt']>;
  liquidityProviderCount_lte?: Maybe<Scalars['BigInt']>;
  liquidityProviderCount_not?: Maybe<Scalars['BigInt']>;
  liquidityProviderCount_not_in?: Maybe<Array<Scalars['BigInt']>>;
  pool?: Maybe<Scalars['String']>;
  poolAddress?: Maybe<Scalars['String']>;
  poolAddress_contains?: Maybe<Scalars['String']>;
  poolAddress_ends_with?: Maybe<Scalars['String']>;
  poolAddress_gt?: Maybe<Scalars['String']>;
  poolAddress_gte?: Maybe<Scalars['String']>;
  poolAddress_in?: Maybe<Array<Scalars['String']>>;
  poolAddress_lt?: Maybe<Scalars['String']>;
  poolAddress_lte?: Maybe<Scalars['String']>;
  poolAddress_not?: Maybe<Scalars['String']>;
  poolAddress_not_contains?: Maybe<Scalars['String']>;
  poolAddress_not_ends_with?: Maybe<Scalars['String']>;
  poolAddress_not_in?: Maybe<Array<Scalars['String']>>;
  poolAddress_not_starts_with?: Maybe<Scalars['String']>;
  poolAddress_starts_with?: Maybe<Scalars['String']>;
  pool_contains?: Maybe<Scalars['String']>;
  pool_ends_with?: Maybe<Scalars['String']>;
  pool_gt?: Maybe<Scalars['String']>;
  pool_gte?: Maybe<Scalars['String']>;
  pool_in?: Maybe<Array<Scalars['String']>>;
  pool_lt?: Maybe<Scalars['String']>;
  pool_lte?: Maybe<Scalars['String']>;
  pool_not?: Maybe<Scalars['String']>;
  pool_not_contains?: Maybe<Scalars['String']>;
  pool_not_ends_with?: Maybe<Scalars['String']>;
  pool_not_in?: Maybe<Array<Scalars['String']>>;
  pool_not_starts_with?: Maybe<Scalars['String']>;
  pool_starts_with?: Maybe<Scalars['String']>;
  price0?: Maybe<Scalars['BigDecimal']>;
  price0_gt?: Maybe<Scalars['BigDecimal']>;
  price0_gte?: Maybe<Scalars['BigDecimal']>;
  price0_in?: Maybe<Array<Scalars['BigDecimal']>>;
  price0_lt?: Maybe<Scalars['BigDecimal']>;
  price0_lte?: Maybe<Scalars['BigDecimal']>;
  price0_not?: Maybe<Scalars['BigDecimal']>;
  price0_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  price1?: Maybe<Scalars['BigDecimal']>;
  price1_gt?: Maybe<Scalars['BigDecimal']>;
  price1_gte?: Maybe<Scalars['BigDecimal']>;
  price1_in?: Maybe<Array<Scalars['BigDecimal']>>;
  price1_lt?: Maybe<Scalars['BigDecimal']>;
  price1_lte?: Maybe<Scalars['BigDecimal']>;
  price1_not?: Maybe<Scalars['BigDecimal']>;
  price1_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  tickIdx?: Maybe<Scalars['BigInt']>;
  tickIdx_gt?: Maybe<Scalars['BigInt']>;
  tickIdx_gte?: Maybe<Scalars['BigInt']>;
  tickIdx_in?: Maybe<Array<Scalars['BigInt']>>;
  tickIdx_lt?: Maybe<Scalars['BigInt']>;
  tickIdx_lte?: Maybe<Scalars['BigInt']>;
  tickIdx_not?: Maybe<Scalars['BigInt']>;
  tickIdx_not_in?: Maybe<Array<Scalars['BigInt']>>;
  untrackedVolumeUSD?: Maybe<Scalars['BigDecimal']>;
  untrackedVolumeUSD_gt?: Maybe<Scalars['BigDecimal']>;
  untrackedVolumeUSD_gte?: Maybe<Scalars['BigDecimal']>;
  untrackedVolumeUSD_in?: Maybe<Array<Scalars['BigDecimal']>>;
  untrackedVolumeUSD_lt?: Maybe<Scalars['BigDecimal']>;
  untrackedVolumeUSD_lte?: Maybe<Scalars['BigDecimal']>;
  untrackedVolumeUSD_not?: Maybe<Scalars['BigDecimal']>;
  untrackedVolumeUSD_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  volumeToken0?: Maybe<Scalars['BigDecimal']>;
  volumeToken0_gt?: Maybe<Scalars['BigDecimal']>;
  volumeToken0_gte?: Maybe<Scalars['BigDecimal']>;
  volumeToken0_in?: Maybe<Array<Scalars['BigDecimal']>>;
  volumeToken0_lt?: Maybe<Scalars['BigDecimal']>;
  volumeToken0_lte?: Maybe<Scalars['BigDecimal']>;
  volumeToken0_not?: Maybe<Scalars['BigDecimal']>;
  volumeToken0_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  volumeToken1?: Maybe<Scalars['BigDecimal']>;
  volumeToken1_gt?: Maybe<Scalars['BigDecimal']>;
  volumeToken1_gte?: Maybe<Scalars['BigDecimal']>;
  volumeToken1_in?: Maybe<Array<Scalars['BigDecimal']>>;
  volumeToken1_lt?: Maybe<Scalars['BigDecimal']>;
  volumeToken1_lte?: Maybe<Scalars['BigDecimal']>;
  volumeToken1_not?: Maybe<Scalars['BigDecimal']>;
  volumeToken1_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  volumeUSD?: Maybe<Scalars['BigDecimal']>;
  volumeUSD_gt?: Maybe<Scalars['BigDecimal']>;
  volumeUSD_gte?: Maybe<Scalars['BigDecimal']>;
  volumeUSD_in?: Maybe<Array<Scalars['BigDecimal']>>;
  volumeUSD_lt?: Maybe<Scalars['BigDecimal']>;
  volumeUSD_lte?: Maybe<Scalars['BigDecimal']>;
  volumeUSD_not?: Maybe<Scalars['BigDecimal']>;
  volumeUSD_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
};

export enum Tick_OrderBy {
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
  VolumeUsd = 'volumeUSD'
}

export type Token = {
  __typename?: 'Token';
  decimals: Scalars['BigInt'];
  derivedETH: Scalars['BigDecimal'];
  feesUSD: Scalars['BigDecimal'];
  id: Scalars['ID'];
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
  first?: Maybe<Scalars['Int']>;
  orderBy?: Maybe<TokenDayData_OrderBy>;
  orderDirection?: Maybe<OrderDirection>;
  skip?: Maybe<Scalars['Int']>;
  where?: Maybe<TokenDayData_Filter>;
};


export type TokenWhitelistPoolsArgs = {
  first?: Maybe<Scalars['Int']>;
  orderBy?: Maybe<Pool_OrderBy>;
  orderDirection?: Maybe<OrderDirection>;
  skip?: Maybe<Scalars['Int']>;
  where?: Maybe<Pool_Filter>;
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
  close?: Maybe<Scalars['BigDecimal']>;
  close_gt?: Maybe<Scalars['BigDecimal']>;
  close_gte?: Maybe<Scalars['BigDecimal']>;
  close_in?: Maybe<Array<Scalars['BigDecimal']>>;
  close_lt?: Maybe<Scalars['BigDecimal']>;
  close_lte?: Maybe<Scalars['BigDecimal']>;
  close_not?: Maybe<Scalars['BigDecimal']>;
  close_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  date?: Maybe<Scalars['Int']>;
  date_gt?: Maybe<Scalars['Int']>;
  date_gte?: Maybe<Scalars['Int']>;
  date_in?: Maybe<Array<Scalars['Int']>>;
  date_lt?: Maybe<Scalars['Int']>;
  date_lte?: Maybe<Scalars['Int']>;
  date_not?: Maybe<Scalars['Int']>;
  date_not_in?: Maybe<Array<Scalars['Int']>>;
  feesUSD?: Maybe<Scalars['BigDecimal']>;
  feesUSD_gt?: Maybe<Scalars['BigDecimal']>;
  feesUSD_gte?: Maybe<Scalars['BigDecimal']>;
  feesUSD_in?: Maybe<Array<Scalars['BigDecimal']>>;
  feesUSD_lt?: Maybe<Scalars['BigDecimal']>;
  feesUSD_lte?: Maybe<Scalars['BigDecimal']>;
  feesUSD_not?: Maybe<Scalars['BigDecimal']>;
  feesUSD_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  high?: Maybe<Scalars['BigDecimal']>;
  high_gt?: Maybe<Scalars['BigDecimal']>;
  high_gte?: Maybe<Scalars['BigDecimal']>;
  high_in?: Maybe<Array<Scalars['BigDecimal']>>;
  high_lt?: Maybe<Scalars['BigDecimal']>;
  high_lte?: Maybe<Scalars['BigDecimal']>;
  high_not?: Maybe<Scalars['BigDecimal']>;
  high_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  id?: Maybe<Scalars['ID']>;
  id_gt?: Maybe<Scalars['ID']>;
  id_gte?: Maybe<Scalars['ID']>;
  id_in?: Maybe<Array<Scalars['ID']>>;
  id_lt?: Maybe<Scalars['ID']>;
  id_lte?: Maybe<Scalars['ID']>;
  id_not?: Maybe<Scalars['ID']>;
  id_not_in?: Maybe<Array<Scalars['ID']>>;
  low?: Maybe<Scalars['BigDecimal']>;
  low_gt?: Maybe<Scalars['BigDecimal']>;
  low_gte?: Maybe<Scalars['BigDecimal']>;
  low_in?: Maybe<Array<Scalars['BigDecimal']>>;
  low_lt?: Maybe<Scalars['BigDecimal']>;
  low_lte?: Maybe<Scalars['BigDecimal']>;
  low_not?: Maybe<Scalars['BigDecimal']>;
  low_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  open?: Maybe<Scalars['BigDecimal']>;
  open_gt?: Maybe<Scalars['BigDecimal']>;
  open_gte?: Maybe<Scalars['BigDecimal']>;
  open_in?: Maybe<Array<Scalars['BigDecimal']>>;
  open_lt?: Maybe<Scalars['BigDecimal']>;
  open_lte?: Maybe<Scalars['BigDecimal']>;
  open_not?: Maybe<Scalars['BigDecimal']>;
  open_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  priceUSD?: Maybe<Scalars['BigDecimal']>;
  priceUSD_gt?: Maybe<Scalars['BigDecimal']>;
  priceUSD_gte?: Maybe<Scalars['BigDecimal']>;
  priceUSD_in?: Maybe<Array<Scalars['BigDecimal']>>;
  priceUSD_lt?: Maybe<Scalars['BigDecimal']>;
  priceUSD_lte?: Maybe<Scalars['BigDecimal']>;
  priceUSD_not?: Maybe<Scalars['BigDecimal']>;
  priceUSD_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  token?: Maybe<Scalars['String']>;
  token_contains?: Maybe<Scalars['String']>;
  token_ends_with?: Maybe<Scalars['String']>;
  token_gt?: Maybe<Scalars['String']>;
  token_gte?: Maybe<Scalars['String']>;
  token_in?: Maybe<Array<Scalars['String']>>;
  token_lt?: Maybe<Scalars['String']>;
  token_lte?: Maybe<Scalars['String']>;
  token_not?: Maybe<Scalars['String']>;
  token_not_contains?: Maybe<Scalars['String']>;
  token_not_ends_with?: Maybe<Scalars['String']>;
  token_not_in?: Maybe<Array<Scalars['String']>>;
  token_not_starts_with?: Maybe<Scalars['String']>;
  token_starts_with?: Maybe<Scalars['String']>;
  totalValueLocked?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedUSD?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedUSD_gt?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedUSD_gte?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedUSD_in?: Maybe<Array<Scalars['BigDecimal']>>;
  totalValueLockedUSD_lt?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedUSD_lte?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedUSD_not?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedUSD_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  totalValueLocked_gt?: Maybe<Scalars['BigDecimal']>;
  totalValueLocked_gte?: Maybe<Scalars['BigDecimal']>;
  totalValueLocked_in?: Maybe<Array<Scalars['BigDecimal']>>;
  totalValueLocked_lt?: Maybe<Scalars['BigDecimal']>;
  totalValueLocked_lte?: Maybe<Scalars['BigDecimal']>;
  totalValueLocked_not?: Maybe<Scalars['BigDecimal']>;
  totalValueLocked_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  untrackedVolumeUSD?: Maybe<Scalars['BigDecimal']>;
  untrackedVolumeUSD_gt?: Maybe<Scalars['BigDecimal']>;
  untrackedVolumeUSD_gte?: Maybe<Scalars['BigDecimal']>;
  untrackedVolumeUSD_in?: Maybe<Array<Scalars['BigDecimal']>>;
  untrackedVolumeUSD_lt?: Maybe<Scalars['BigDecimal']>;
  untrackedVolumeUSD_lte?: Maybe<Scalars['BigDecimal']>;
  untrackedVolumeUSD_not?: Maybe<Scalars['BigDecimal']>;
  untrackedVolumeUSD_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  volume?: Maybe<Scalars['BigDecimal']>;
  volumeUSD?: Maybe<Scalars['BigDecimal']>;
  volumeUSD_gt?: Maybe<Scalars['BigDecimal']>;
  volumeUSD_gte?: Maybe<Scalars['BigDecimal']>;
  volumeUSD_in?: Maybe<Array<Scalars['BigDecimal']>>;
  volumeUSD_lt?: Maybe<Scalars['BigDecimal']>;
  volumeUSD_lte?: Maybe<Scalars['BigDecimal']>;
  volumeUSD_not?: Maybe<Scalars['BigDecimal']>;
  volumeUSD_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  volume_gt?: Maybe<Scalars['BigDecimal']>;
  volume_gte?: Maybe<Scalars['BigDecimal']>;
  volume_in?: Maybe<Array<Scalars['BigDecimal']>>;
  volume_lt?: Maybe<Scalars['BigDecimal']>;
  volume_lte?: Maybe<Scalars['BigDecimal']>;
  volume_not?: Maybe<Scalars['BigDecimal']>;
  volume_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
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
  close?: Maybe<Scalars['BigDecimal']>;
  close_gt?: Maybe<Scalars['BigDecimal']>;
  close_gte?: Maybe<Scalars['BigDecimal']>;
  close_in?: Maybe<Array<Scalars['BigDecimal']>>;
  close_lt?: Maybe<Scalars['BigDecimal']>;
  close_lte?: Maybe<Scalars['BigDecimal']>;
  close_not?: Maybe<Scalars['BigDecimal']>;
  close_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  feesUSD?: Maybe<Scalars['BigDecimal']>;
  feesUSD_gt?: Maybe<Scalars['BigDecimal']>;
  feesUSD_gte?: Maybe<Scalars['BigDecimal']>;
  feesUSD_in?: Maybe<Array<Scalars['BigDecimal']>>;
  feesUSD_lt?: Maybe<Scalars['BigDecimal']>;
  feesUSD_lte?: Maybe<Scalars['BigDecimal']>;
  feesUSD_not?: Maybe<Scalars['BigDecimal']>;
  feesUSD_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  high?: Maybe<Scalars['BigDecimal']>;
  high_gt?: Maybe<Scalars['BigDecimal']>;
  high_gte?: Maybe<Scalars['BigDecimal']>;
  high_in?: Maybe<Array<Scalars['BigDecimal']>>;
  high_lt?: Maybe<Scalars['BigDecimal']>;
  high_lte?: Maybe<Scalars['BigDecimal']>;
  high_not?: Maybe<Scalars['BigDecimal']>;
  high_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  id?: Maybe<Scalars['ID']>;
  id_gt?: Maybe<Scalars['ID']>;
  id_gte?: Maybe<Scalars['ID']>;
  id_in?: Maybe<Array<Scalars['ID']>>;
  id_lt?: Maybe<Scalars['ID']>;
  id_lte?: Maybe<Scalars['ID']>;
  id_not?: Maybe<Scalars['ID']>;
  id_not_in?: Maybe<Array<Scalars['ID']>>;
  low?: Maybe<Scalars['BigDecimal']>;
  low_gt?: Maybe<Scalars['BigDecimal']>;
  low_gte?: Maybe<Scalars['BigDecimal']>;
  low_in?: Maybe<Array<Scalars['BigDecimal']>>;
  low_lt?: Maybe<Scalars['BigDecimal']>;
  low_lte?: Maybe<Scalars['BigDecimal']>;
  low_not?: Maybe<Scalars['BigDecimal']>;
  low_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  open?: Maybe<Scalars['BigDecimal']>;
  open_gt?: Maybe<Scalars['BigDecimal']>;
  open_gte?: Maybe<Scalars['BigDecimal']>;
  open_in?: Maybe<Array<Scalars['BigDecimal']>>;
  open_lt?: Maybe<Scalars['BigDecimal']>;
  open_lte?: Maybe<Scalars['BigDecimal']>;
  open_not?: Maybe<Scalars['BigDecimal']>;
  open_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  periodStartUnix?: Maybe<Scalars['Int']>;
  periodStartUnix_gt?: Maybe<Scalars['Int']>;
  periodStartUnix_gte?: Maybe<Scalars['Int']>;
  periodStartUnix_in?: Maybe<Array<Scalars['Int']>>;
  periodStartUnix_lt?: Maybe<Scalars['Int']>;
  periodStartUnix_lte?: Maybe<Scalars['Int']>;
  periodStartUnix_not?: Maybe<Scalars['Int']>;
  periodStartUnix_not_in?: Maybe<Array<Scalars['Int']>>;
  priceUSD?: Maybe<Scalars['BigDecimal']>;
  priceUSD_gt?: Maybe<Scalars['BigDecimal']>;
  priceUSD_gte?: Maybe<Scalars['BigDecimal']>;
  priceUSD_in?: Maybe<Array<Scalars['BigDecimal']>>;
  priceUSD_lt?: Maybe<Scalars['BigDecimal']>;
  priceUSD_lte?: Maybe<Scalars['BigDecimal']>;
  priceUSD_not?: Maybe<Scalars['BigDecimal']>;
  priceUSD_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  token?: Maybe<Scalars['String']>;
  token_contains?: Maybe<Scalars['String']>;
  token_ends_with?: Maybe<Scalars['String']>;
  token_gt?: Maybe<Scalars['String']>;
  token_gte?: Maybe<Scalars['String']>;
  token_in?: Maybe<Array<Scalars['String']>>;
  token_lt?: Maybe<Scalars['String']>;
  token_lte?: Maybe<Scalars['String']>;
  token_not?: Maybe<Scalars['String']>;
  token_not_contains?: Maybe<Scalars['String']>;
  token_not_ends_with?: Maybe<Scalars['String']>;
  token_not_in?: Maybe<Array<Scalars['String']>>;
  token_not_starts_with?: Maybe<Scalars['String']>;
  token_starts_with?: Maybe<Scalars['String']>;
  totalValueLocked?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedUSD?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedUSD_gt?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedUSD_gte?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedUSD_in?: Maybe<Array<Scalars['BigDecimal']>>;
  totalValueLockedUSD_lt?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedUSD_lte?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedUSD_not?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedUSD_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  totalValueLocked_gt?: Maybe<Scalars['BigDecimal']>;
  totalValueLocked_gte?: Maybe<Scalars['BigDecimal']>;
  totalValueLocked_in?: Maybe<Array<Scalars['BigDecimal']>>;
  totalValueLocked_lt?: Maybe<Scalars['BigDecimal']>;
  totalValueLocked_lte?: Maybe<Scalars['BigDecimal']>;
  totalValueLocked_not?: Maybe<Scalars['BigDecimal']>;
  totalValueLocked_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  untrackedVolumeUSD?: Maybe<Scalars['BigDecimal']>;
  untrackedVolumeUSD_gt?: Maybe<Scalars['BigDecimal']>;
  untrackedVolumeUSD_gte?: Maybe<Scalars['BigDecimal']>;
  untrackedVolumeUSD_in?: Maybe<Array<Scalars['BigDecimal']>>;
  untrackedVolumeUSD_lt?: Maybe<Scalars['BigDecimal']>;
  untrackedVolumeUSD_lte?: Maybe<Scalars['BigDecimal']>;
  untrackedVolumeUSD_not?: Maybe<Scalars['BigDecimal']>;
  untrackedVolumeUSD_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  volume?: Maybe<Scalars['BigDecimal']>;
  volumeUSD?: Maybe<Scalars['BigDecimal']>;
  volumeUSD_gt?: Maybe<Scalars['BigDecimal']>;
  volumeUSD_gte?: Maybe<Scalars['BigDecimal']>;
  volumeUSD_in?: Maybe<Array<Scalars['BigDecimal']>>;
  volumeUSD_lt?: Maybe<Scalars['BigDecimal']>;
  volumeUSD_lte?: Maybe<Scalars['BigDecimal']>;
  volumeUSD_not?: Maybe<Scalars['BigDecimal']>;
  volumeUSD_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  volume_gt?: Maybe<Scalars['BigDecimal']>;
  volume_gte?: Maybe<Scalars['BigDecimal']>;
  volume_in?: Maybe<Array<Scalars['BigDecimal']>>;
  volume_lt?: Maybe<Scalars['BigDecimal']>;
  volume_lte?: Maybe<Scalars['BigDecimal']>;
  volume_not?: Maybe<Scalars['BigDecimal']>;
  volume_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
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
  TotalValueLocked = 'totalValueLocked',
  TotalValueLockedUsd = 'totalValueLockedUSD',
  UntrackedVolumeUsd = 'untrackedVolumeUSD',
  Volume = 'volume',
  VolumeUsd = 'volumeUSD'
}

export type Token_Filter = {
  decimals?: Maybe<Scalars['BigInt']>;
  decimals_gt?: Maybe<Scalars['BigInt']>;
  decimals_gte?: Maybe<Scalars['BigInt']>;
  decimals_in?: Maybe<Array<Scalars['BigInt']>>;
  decimals_lt?: Maybe<Scalars['BigInt']>;
  decimals_lte?: Maybe<Scalars['BigInt']>;
  decimals_not?: Maybe<Scalars['BigInt']>;
  decimals_not_in?: Maybe<Array<Scalars['BigInt']>>;
  derivedETH?: Maybe<Scalars['BigDecimal']>;
  derivedETH_gt?: Maybe<Scalars['BigDecimal']>;
  derivedETH_gte?: Maybe<Scalars['BigDecimal']>;
  derivedETH_in?: Maybe<Array<Scalars['BigDecimal']>>;
  derivedETH_lt?: Maybe<Scalars['BigDecimal']>;
  derivedETH_lte?: Maybe<Scalars['BigDecimal']>;
  derivedETH_not?: Maybe<Scalars['BigDecimal']>;
  derivedETH_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  feesUSD?: Maybe<Scalars['BigDecimal']>;
  feesUSD_gt?: Maybe<Scalars['BigDecimal']>;
  feesUSD_gte?: Maybe<Scalars['BigDecimal']>;
  feesUSD_in?: Maybe<Array<Scalars['BigDecimal']>>;
  feesUSD_lt?: Maybe<Scalars['BigDecimal']>;
  feesUSD_lte?: Maybe<Scalars['BigDecimal']>;
  feesUSD_not?: Maybe<Scalars['BigDecimal']>;
  feesUSD_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  id?: Maybe<Scalars['ID']>;
  id_gt?: Maybe<Scalars['ID']>;
  id_gte?: Maybe<Scalars['ID']>;
  id_in?: Maybe<Array<Scalars['ID']>>;
  id_lt?: Maybe<Scalars['ID']>;
  id_lte?: Maybe<Scalars['ID']>;
  id_not?: Maybe<Scalars['ID']>;
  id_not_in?: Maybe<Array<Scalars['ID']>>;
  name?: Maybe<Scalars['String']>;
  name_contains?: Maybe<Scalars['String']>;
  name_ends_with?: Maybe<Scalars['String']>;
  name_gt?: Maybe<Scalars['String']>;
  name_gte?: Maybe<Scalars['String']>;
  name_in?: Maybe<Array<Scalars['String']>>;
  name_lt?: Maybe<Scalars['String']>;
  name_lte?: Maybe<Scalars['String']>;
  name_not?: Maybe<Scalars['String']>;
  name_not_contains?: Maybe<Scalars['String']>;
  name_not_ends_with?: Maybe<Scalars['String']>;
  name_not_in?: Maybe<Array<Scalars['String']>>;
  name_not_starts_with?: Maybe<Scalars['String']>;
  name_starts_with?: Maybe<Scalars['String']>;
  poolCount?: Maybe<Scalars['BigInt']>;
  poolCount_gt?: Maybe<Scalars['BigInt']>;
  poolCount_gte?: Maybe<Scalars['BigInt']>;
  poolCount_in?: Maybe<Array<Scalars['BigInt']>>;
  poolCount_lt?: Maybe<Scalars['BigInt']>;
  poolCount_lte?: Maybe<Scalars['BigInt']>;
  poolCount_not?: Maybe<Scalars['BigInt']>;
  poolCount_not_in?: Maybe<Array<Scalars['BigInt']>>;
  symbol?: Maybe<Scalars['String']>;
  symbol_contains?: Maybe<Scalars['String']>;
  symbol_ends_with?: Maybe<Scalars['String']>;
  symbol_gt?: Maybe<Scalars['String']>;
  symbol_gte?: Maybe<Scalars['String']>;
  symbol_in?: Maybe<Array<Scalars['String']>>;
  symbol_lt?: Maybe<Scalars['String']>;
  symbol_lte?: Maybe<Scalars['String']>;
  symbol_not?: Maybe<Scalars['String']>;
  symbol_not_contains?: Maybe<Scalars['String']>;
  symbol_not_ends_with?: Maybe<Scalars['String']>;
  symbol_not_in?: Maybe<Array<Scalars['String']>>;
  symbol_not_starts_with?: Maybe<Scalars['String']>;
  symbol_starts_with?: Maybe<Scalars['String']>;
  totalSupply?: Maybe<Scalars['BigInt']>;
  totalSupply_gt?: Maybe<Scalars['BigInt']>;
  totalSupply_gte?: Maybe<Scalars['BigInt']>;
  totalSupply_in?: Maybe<Array<Scalars['BigInt']>>;
  totalSupply_lt?: Maybe<Scalars['BigInt']>;
  totalSupply_lte?: Maybe<Scalars['BigInt']>;
  totalSupply_not?: Maybe<Scalars['BigInt']>;
  totalSupply_not_in?: Maybe<Array<Scalars['BigInt']>>;
  totalValueLocked?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedUSD?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedUSDUntracked?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedUSDUntracked_gt?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedUSDUntracked_gte?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedUSDUntracked_in?: Maybe<Array<Scalars['BigDecimal']>>;
  totalValueLockedUSDUntracked_lt?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedUSDUntracked_lte?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedUSDUntracked_not?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedUSDUntracked_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  totalValueLockedUSD_gt?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedUSD_gte?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedUSD_in?: Maybe<Array<Scalars['BigDecimal']>>;
  totalValueLockedUSD_lt?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedUSD_lte?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedUSD_not?: Maybe<Scalars['BigDecimal']>;
  totalValueLockedUSD_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  totalValueLocked_gt?: Maybe<Scalars['BigDecimal']>;
  totalValueLocked_gte?: Maybe<Scalars['BigDecimal']>;
  totalValueLocked_in?: Maybe<Array<Scalars['BigDecimal']>>;
  totalValueLocked_lt?: Maybe<Scalars['BigDecimal']>;
  totalValueLocked_lte?: Maybe<Scalars['BigDecimal']>;
  totalValueLocked_not?: Maybe<Scalars['BigDecimal']>;
  totalValueLocked_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  txCount?: Maybe<Scalars['BigInt']>;
  txCount_gt?: Maybe<Scalars['BigInt']>;
  txCount_gte?: Maybe<Scalars['BigInt']>;
  txCount_in?: Maybe<Array<Scalars['BigInt']>>;
  txCount_lt?: Maybe<Scalars['BigInt']>;
  txCount_lte?: Maybe<Scalars['BigInt']>;
  txCount_not?: Maybe<Scalars['BigInt']>;
  txCount_not_in?: Maybe<Array<Scalars['BigInt']>>;
  untrackedVolumeUSD?: Maybe<Scalars['BigDecimal']>;
  untrackedVolumeUSD_gt?: Maybe<Scalars['BigDecimal']>;
  untrackedVolumeUSD_gte?: Maybe<Scalars['BigDecimal']>;
  untrackedVolumeUSD_in?: Maybe<Array<Scalars['BigDecimal']>>;
  untrackedVolumeUSD_lt?: Maybe<Scalars['BigDecimal']>;
  untrackedVolumeUSD_lte?: Maybe<Scalars['BigDecimal']>;
  untrackedVolumeUSD_not?: Maybe<Scalars['BigDecimal']>;
  untrackedVolumeUSD_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  volume?: Maybe<Scalars['BigDecimal']>;
  volumeUSD?: Maybe<Scalars['BigDecimal']>;
  volumeUSD_gt?: Maybe<Scalars['BigDecimal']>;
  volumeUSD_gte?: Maybe<Scalars['BigDecimal']>;
  volumeUSD_in?: Maybe<Array<Scalars['BigDecimal']>>;
  volumeUSD_lt?: Maybe<Scalars['BigDecimal']>;
  volumeUSD_lte?: Maybe<Scalars['BigDecimal']>;
  volumeUSD_not?: Maybe<Scalars['BigDecimal']>;
  volumeUSD_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  volume_gt?: Maybe<Scalars['BigDecimal']>;
  volume_gte?: Maybe<Scalars['BigDecimal']>;
  volume_in?: Maybe<Array<Scalars['BigDecimal']>>;
  volume_lt?: Maybe<Scalars['BigDecimal']>;
  volume_lte?: Maybe<Scalars['BigDecimal']>;
  volume_not?: Maybe<Scalars['BigDecimal']>;
  volume_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  whitelistPools?: Maybe<Array<Scalars['String']>>;
  whitelistPools_contains?: Maybe<Array<Scalars['String']>>;
  whitelistPools_not?: Maybe<Array<Scalars['String']>>;
  whitelistPools_not_contains?: Maybe<Array<Scalars['String']>>;
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
  first?: Maybe<Scalars['Int']>;
  orderBy?: Maybe<Burn_OrderBy>;
  orderDirection?: Maybe<OrderDirection>;
  skip?: Maybe<Scalars['Int']>;
  where?: Maybe<Burn_Filter>;
};


export type TransactionCollectsArgs = {
  first?: Maybe<Scalars['Int']>;
  orderBy?: Maybe<Collect_OrderBy>;
  orderDirection?: Maybe<OrderDirection>;
  skip?: Maybe<Scalars['Int']>;
  where?: Maybe<Collect_Filter>;
};


export type TransactionFlashedArgs = {
  first?: Maybe<Scalars['Int']>;
  orderBy?: Maybe<Flash_OrderBy>;
  orderDirection?: Maybe<OrderDirection>;
  skip?: Maybe<Scalars['Int']>;
  where?: Maybe<Flash_Filter>;
};


export type TransactionMintsArgs = {
  first?: Maybe<Scalars['Int']>;
  orderBy?: Maybe<Mint_OrderBy>;
  orderDirection?: Maybe<OrderDirection>;
  skip?: Maybe<Scalars['Int']>;
  where?: Maybe<Mint_Filter>;
};


export type TransactionSwapsArgs = {
  first?: Maybe<Scalars['Int']>;
  orderBy?: Maybe<Swap_OrderBy>;
  orderDirection?: Maybe<OrderDirection>;
  skip?: Maybe<Scalars['Int']>;
  where?: Maybe<Swap_Filter>;
};

export type Transaction_Filter = {
  blockNumber?: Maybe<Scalars['BigInt']>;
  blockNumber_gt?: Maybe<Scalars['BigInt']>;
  blockNumber_gte?: Maybe<Scalars['BigInt']>;
  blockNumber_in?: Maybe<Array<Scalars['BigInt']>>;
  blockNumber_lt?: Maybe<Scalars['BigInt']>;
  blockNumber_lte?: Maybe<Scalars['BigInt']>;
  blockNumber_not?: Maybe<Scalars['BigInt']>;
  blockNumber_not_in?: Maybe<Array<Scalars['BigInt']>>;
  gasPrice?: Maybe<Scalars['BigInt']>;
  gasPrice_gt?: Maybe<Scalars['BigInt']>;
  gasPrice_gte?: Maybe<Scalars['BigInt']>;
  gasPrice_in?: Maybe<Array<Scalars['BigInt']>>;
  gasPrice_lt?: Maybe<Scalars['BigInt']>;
  gasPrice_lte?: Maybe<Scalars['BigInt']>;
  gasPrice_not?: Maybe<Scalars['BigInt']>;
  gasPrice_not_in?: Maybe<Array<Scalars['BigInt']>>;
  gasUsed?: Maybe<Scalars['BigInt']>;
  gasUsed_gt?: Maybe<Scalars['BigInt']>;
  gasUsed_gte?: Maybe<Scalars['BigInt']>;
  gasUsed_in?: Maybe<Array<Scalars['BigInt']>>;
  gasUsed_lt?: Maybe<Scalars['BigInt']>;
  gasUsed_lte?: Maybe<Scalars['BigInt']>;
  gasUsed_not?: Maybe<Scalars['BigInt']>;
  gasUsed_not_in?: Maybe<Array<Scalars['BigInt']>>;
  id?: Maybe<Scalars['ID']>;
  id_gt?: Maybe<Scalars['ID']>;
  id_gte?: Maybe<Scalars['ID']>;
  id_in?: Maybe<Array<Scalars['ID']>>;
  id_lt?: Maybe<Scalars['ID']>;
  id_lte?: Maybe<Scalars['ID']>;
  id_not?: Maybe<Scalars['ID']>;
  id_not_in?: Maybe<Array<Scalars['ID']>>;
  timestamp?: Maybe<Scalars['BigInt']>;
  timestamp_gt?: Maybe<Scalars['BigInt']>;
  timestamp_gte?: Maybe<Scalars['BigInt']>;
  timestamp_in?: Maybe<Array<Scalars['BigInt']>>;
  timestamp_lt?: Maybe<Scalars['BigInt']>;
  timestamp_lte?: Maybe<Scalars['BigInt']>;
  timestamp_not?: Maybe<Scalars['BigInt']>;
  timestamp_not_in?: Maybe<Array<Scalars['BigInt']>>;
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
  date?: Maybe<Scalars['Int']>;
  date_gt?: Maybe<Scalars['Int']>;
  date_gte?: Maybe<Scalars['Int']>;
  date_in?: Maybe<Array<Scalars['Int']>>;
  date_lt?: Maybe<Scalars['Int']>;
  date_lte?: Maybe<Scalars['Int']>;
  date_not?: Maybe<Scalars['Int']>;
  date_not_in?: Maybe<Array<Scalars['Int']>>;
  feesUSD?: Maybe<Scalars['BigDecimal']>;
  feesUSD_gt?: Maybe<Scalars['BigDecimal']>;
  feesUSD_gte?: Maybe<Scalars['BigDecimal']>;
  feesUSD_in?: Maybe<Array<Scalars['BigDecimal']>>;
  feesUSD_lt?: Maybe<Scalars['BigDecimal']>;
  feesUSD_lte?: Maybe<Scalars['BigDecimal']>;
  feesUSD_not?: Maybe<Scalars['BigDecimal']>;
  feesUSD_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  id?: Maybe<Scalars['ID']>;
  id_gt?: Maybe<Scalars['ID']>;
  id_gte?: Maybe<Scalars['ID']>;
  id_in?: Maybe<Array<Scalars['ID']>>;
  id_lt?: Maybe<Scalars['ID']>;
  id_lte?: Maybe<Scalars['ID']>;
  id_not?: Maybe<Scalars['ID']>;
  id_not_in?: Maybe<Array<Scalars['ID']>>;
  tvlUSD?: Maybe<Scalars['BigDecimal']>;
  tvlUSD_gt?: Maybe<Scalars['BigDecimal']>;
  tvlUSD_gte?: Maybe<Scalars['BigDecimal']>;
  tvlUSD_in?: Maybe<Array<Scalars['BigDecimal']>>;
  tvlUSD_lt?: Maybe<Scalars['BigDecimal']>;
  tvlUSD_lte?: Maybe<Scalars['BigDecimal']>;
  tvlUSD_not?: Maybe<Scalars['BigDecimal']>;
  tvlUSD_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  txCount?: Maybe<Scalars['BigInt']>;
  txCount_gt?: Maybe<Scalars['BigInt']>;
  txCount_gte?: Maybe<Scalars['BigInt']>;
  txCount_in?: Maybe<Array<Scalars['BigInt']>>;
  txCount_lt?: Maybe<Scalars['BigInt']>;
  txCount_lte?: Maybe<Scalars['BigInt']>;
  txCount_not?: Maybe<Scalars['BigInt']>;
  txCount_not_in?: Maybe<Array<Scalars['BigInt']>>;
  volumeETH?: Maybe<Scalars['BigDecimal']>;
  volumeETH_gt?: Maybe<Scalars['BigDecimal']>;
  volumeETH_gte?: Maybe<Scalars['BigDecimal']>;
  volumeETH_in?: Maybe<Array<Scalars['BigDecimal']>>;
  volumeETH_lt?: Maybe<Scalars['BigDecimal']>;
  volumeETH_lte?: Maybe<Scalars['BigDecimal']>;
  volumeETH_not?: Maybe<Scalars['BigDecimal']>;
  volumeETH_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  volumeUSD?: Maybe<Scalars['BigDecimal']>;
  volumeUSDUntracked?: Maybe<Scalars['BigDecimal']>;
  volumeUSDUntracked_gt?: Maybe<Scalars['BigDecimal']>;
  volumeUSDUntracked_gte?: Maybe<Scalars['BigDecimal']>;
  volumeUSDUntracked_in?: Maybe<Array<Scalars['BigDecimal']>>;
  volumeUSDUntracked_lt?: Maybe<Scalars['BigDecimal']>;
  volumeUSDUntracked_lte?: Maybe<Scalars['BigDecimal']>;
  volumeUSDUntracked_not?: Maybe<Scalars['BigDecimal']>;
  volumeUSDUntracked_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
  volumeUSD_gt?: Maybe<Scalars['BigDecimal']>;
  volumeUSD_gte?: Maybe<Scalars['BigDecimal']>;
  volumeUSD_in?: Maybe<Array<Scalars['BigDecimal']>>;
  volumeUSD_lt?: Maybe<Scalars['BigDecimal']>;
  volumeUSD_lte?: Maybe<Scalars['BigDecimal']>;
  volumeUSD_not?: Maybe<Scalars['BigDecimal']>;
  volumeUSD_not_in?: Maybe<Array<Scalars['BigDecimal']>>;
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
  /** The minimum block number */
  number_gte: Scalars['Int'];
};

/** The type for the top-level _meta field */
export type _Meta_ = {
  __typename?: '_Meta_';
  /**
   * Information about a specific subgraph block. The hash of the block
   * will be null if the _meta field has a block constraint that asks for
   * a block number. It will be filled if the _meta field has no block constraint
   * and therefore asks for the latest  block
   *
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

export type HourlyTokenPricesQueryVariables = Exact<{
  address?: Maybe<Scalars['String']>;
  periodStartUnix?: Maybe<Scalars['Int']>;
  chainId?: Maybe<Scalars['Int']>;
}>;


export type HourlyTokenPricesQuery = { __typename?: 'Query', tokenHourDatas: Array<{ __typename?: 'TokenHourData', high: any, low: any, open: any, close: any, timestamp: number }> };

export type DailyTokenPricesQueryVariables = Exact<{
  address?: Maybe<Scalars['String']>;
  chainId?: Maybe<Scalars['Int']>;
}>;


export type DailyTokenPricesQuery = { __typename?: 'Query', tokenDayDatas: Array<{ __typename?: 'TokenDayData', high: any, low: any, open: any, close: any, timestamp: number }> };


export const HourlyTokenPricesDocument = `
    query hourlyTokenPrices($address: String, $periodStartUnix: Int, $chainId: Int) {
  tokenHourDatas(
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
    `;
export const useHourlyTokenPricesQuery = <
      TData = HourlyTokenPricesQuery,
      TError = unknown
    >(
      dataSource: { endpoint: string, fetchParams?: RequestInit },
      variables?: HourlyTokenPricesQueryVariables,
      options?: UseQueryOptions<HourlyTokenPricesQuery, TError, TData>
    ) =>
    useQuery<HourlyTokenPricesQuery, TError, TData>(
      variables === undefined ? ['hourlyTokenPrices'] : ['hourlyTokenPrices', variables],
      fetcher<HourlyTokenPricesQuery, HourlyTokenPricesQueryVariables>(dataSource.endpoint, dataSource.fetchParams || {}, HourlyTokenPricesDocument, variables),
      options
    );
export const DailyTokenPricesDocument = `
    query dailyTokenPrices($address: String, $chainId: Int) {
  tokenDayDatas(where: {token: $address}, orderBy: date, orderDirection: desc) {
    timestamp: date
    high
    low
    open
    close
  }
}
    `;
export const useDailyTokenPricesQuery = <
      TData = DailyTokenPricesQuery,
      TError = unknown
    >(
      dataSource: { endpoint: string, fetchParams?: RequestInit },
      variables?: DailyTokenPricesQueryVariables,
      options?: UseQueryOptions<DailyTokenPricesQuery, TError, TData>
    ) =>
    useQuery<DailyTokenPricesQuery, TError, TData>(
      variables === undefined ? ['dailyTokenPrices'] : ['dailyTokenPrices', variables],
      fetcher<DailyTokenPricesQuery, DailyTokenPricesQueryVariables>(dataSource.endpoint, dataSource.fetchParams || {}, DailyTokenPricesDocument, variables),
      options
    );