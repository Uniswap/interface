export type TokenInfo = {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
};

export type RewardToken = {
  id: string;
  decimals: number;
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
  tick: string;
  sqrtPrice: string;
  totalValueLockedUSD: string;
};

export type PoolInfo = PoolResponse & {
  address: string;
  tvl: string;
  totalrewards: string;
  tokenreward: string;
  totalDeposit: string;
  positionId?: string;
  link: string;
  tickLower: string;
  tickUpper: string;
  displayedTotalDeposit: string;
  apy: number;
  pendingRewards: number;
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

export const EXACT_INCENTIVE_QUERY = `
query incentive($id: String!) {
  incentive(subgraphError: deny, id : $id){
    id
    rewardToken {
      id
    }
    pool
    startTime
    endTime
    vestingPeriod
    refundee
    }
  }
`;

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
        decimals
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
      tick
      sqrtPrice
      totalValueLockedUSD
    }
  }
`;

export type PoolIncentivesTableValues = PoolInfo & {
  pool: {
    token0: TokenInfoDetails | undefined;
    token1: TokenInfoDetails | undefined;
  };
};

export const calculateApy = (
  incentive: Incentive,
  totalPoolLiquidity: number,
  totalRewardsToken: string
): number => {
  // Calculate duration in days
  const startTime = parseInt(incentive.startTime, 10);
  const endTime = parseInt(incentive.endTime, 10);
  const durationInDays = (endTime - startTime) / (60 * 60 * 24);
  // Avoid division by zero
  if (durationInDays <= 0 || totalPoolLiquidity <= 0) {
    return 0;
  }
  // Calculate daily reward tokens
  const dailyRewardTokens = parseFloat(totalRewardsToken) / durationInDays;

  // Calculate daily reward per liquidity unit
  const dailyRewardPerLiquidityUnit = dailyRewardTokens / totalPoolLiquidity;

  // Annualize the reward rate
  const annualRewardPerLiquidityUnit = dailyRewardPerLiquidityUnit * 365;

  // Standardize per 1,000 liquidity units
  const standardLiquidityAmount = 1000000000;
  const annualRewardPerStandardLiquidity =
    annualRewardPerLiquidityUnit * standardLiquidityAmount;

  return annualRewardPerStandardLiquidity;
};
