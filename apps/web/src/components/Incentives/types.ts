export type TokenInfo = {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
};

export type RewardToken = {
  id: string;
  symbol: string;
};

export type Incentive = {
  contract: string;
  endTime: string;
  ended: boolean;
  id: string;
  pool: string;
  reward: string;
  rewardToken: RewardToken;
  startTime: string;
};

export type TokenInfoDetails = {
  chainId: number;
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  logoURI: string;
};

export type VersionInfo = {
  major: number;
  minor: number;
  patch: number;
};

export type TaraxaMainnetListResponse = {
  tokens: TokenInfoDetails[];
  name: string;
  logoURI: string;
  keywords: string[];
  timestamp: string;
  version: VersionInfo;
};

export type PoolResponse = {
  id: string;
  token0Price: string;
  token1Price: string;
  feesUSD: string;
  token0: {
    name: string;
    id: string;
    symbol: string;
  };
  token1: {
    name: string;
    id: string;
    symbol: string;
  };
  liquidity: string;
  feeTier: string;
  totalValueLockedUSD: string;
};

export type PoolInfo = {
  address: string;
  token0: {
    name: string;
    id: string;
    symbol: string;
  };
  token1: {
    name: string;
    id: string;
    symbol: string;
  };
  tvl: string;
  totalrewards: string;
  tokenreward: string;
  totalDeposit: string;
  positionId?: string;
  link: string;
};

export function findTokenByAddress(
  tokens: TokenInfoDetails[],
  address: string
): TokenInfoDetails | undefined {
  if (!tokens || tokens.length === 0) {
    return;
  }
  return tokens.find(
    (token) => token.address.toLowerCase() === address.toLowerCase()
  );
}

export const indexerTaraswap = process.env.REACT_APP_INDEXER_SUBGRAPH_TARASWAP;
export const indexerLara = process.env.REACT_APP_INDEXER_SUBGRAPH_LARA;

export const INCENTIVES_QUERY = `
  query incentives {
    incentives(subgraphError: deny) {
      id
      ended
      reward
      contract
      startTime
      endTime
      rewardToken {
        id
        symbol
      }
      pool
    }
  }
`;

export const POOL_QUERY = `
  query pool($id: String!) {
    pools(subgraphError: deny, where: {id: $id}) {
      id
      token0Price
      token1Price
      feesUSD
      token0 {
        name
        id
        symbol
      }
      token1 {
        name
        id
        symbol
      }
      liquidity
      feeTier
      totalValueLockedUSD
    }
  }
`;

export type PoolIncentivesTableValues = PoolInfo & {
  pool: {
    token0: TokenInfoDetails | undefined;
    token1: TokenInfoDetails | undefined;
  };
  pendingRewards: number;
  apr1d: number;
};
