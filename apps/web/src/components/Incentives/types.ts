import { BigNumber } from "ethers";
import { useGetStakedLiqudityForPool } from "hooks/useGetPositionsForPool";
import { useTokenUsdPrice } from "hooks/useTokenUsdPrice";
import { PositionsResponse } from "hooks/useTotalPositions";

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
  pool: {
    id: string;
  };
  reward: string;
  rewardToken: RewardToken;
  startTime: string;
  vestingPeriod: string;
  refundee: string;
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
  feeTier: number;
  tick: string;
  sqrtPrice: string;
  totalValueLockedUSD: string;
};

export type PoolInfo = PoolResponse & {
  address: string;
  tvl: string;
  totalrewards: string;
  tokenreward: string;
  tokenRewardLogoUri: string;
  totalDeposit: string;
  depositedToken0: number;
  depositedToken1: number;
  withdrawnToken0: number;
  withdrawnToken1: number;
  incentiveId: string;
  positionId?: string;
  eligible: boolean;
  link?: string;
  tickLower: string;
  tickUpper: string;
  hasMultipleRelevantPositions: boolean;
  displayedTotalDeposit: string;
  apy: number;
  pendingRewards: string;
  userPositions?: PositionsResponse[];
  pool: {
    token0: TokenInfoDetails | undefined;
    token1: TokenInfoDetails | undefined;
  };
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

export const POSITIONS_QUERY = `
query positions{
	positions(subgraphError: deny){
    id
    minter {
      id
    }
    owner {
      id
    }
    pool {
      id
      feeTier
      incentives {
        id
      }
    }
    liquidity
    depositedToken0
    depositedToken1
    withdrawnToken0
    withdrawnToken1
    token0{
      symbol
    }
    token1{
      symbol
    }
    tickLower {
      tickIdx
    }
    tickUpper {
  		tickIdx
    }
  }
}
`;

export const POSITIONS_WITH_IDS_QUERY = `
query positionsWithIds($ids: [ID!]){
	positions(subgraphError: deny, where: {id_in: $ids}){
    id
    minter {
      id
    }
    owner {
      id
    }
    pool {
      id
      feeTier
      incentives {
        id
      }
    }
    liquidity
    depositedToken0
    depositedToken1
    withdrawnToken0
    withdrawnToken1
    token0{
      symbol
    }
    token1{
      symbol
    }
    tickLower {
      tickIdx
    }
    tickUpper {
  	  tickIdx
    }
  }
}
`;

export const STAKED_POSITIONS_QUERY = `
query positions{
	positions(subgraphError: deny, where: {owner: "0x3611731bac2f6891dd222f6f47d9f6faf7d72e30", liquidity_gt: "0"}){
    id
    minter {
      id
    }
    owner {
      id
    }
    pool {
      id
      feeTier
      incentives {
        id
      }
    }
    liquidity
    depositedToken0
    depositedToken1
    withdrawnToken0
    withdrawnToken1
    token0{
      symbol
    }
    token1{
      symbol
    }
    tickLower {
      tickIdx
    }
    tickUpper {
  	  tickIdx
    }
  }
}
`;

export const USER_OWNED_POSITIONS_QUERY = `
query positions($address: String!){
	positions(subgraphError: deny, where: {owner: $address, liquidity_gt: "0"}){
    id
    minter {
      id
    }
    owner {
      id
    }
    pool {
      id
      feeTier
      incentives {
        id
      }
    }
    liquidity
    depositedToken0
    depositedToken1
    withdrawnToken0
    withdrawnToken1
    token0{
      symbol
    }
    token1{
      symbol
    }
    tickLower {
      tickIdx
    }
    tickUpper {
  	  tickIdx
    }
  }
}
`;

export const USER_STAKED_POSITIONS_QUERY = `
query positions($address: String!){
	positions(subgraphError: deny, where: {minter: $address, owner: "0x3611731bac2f6891dd222f6f47d9f6faf7d72e30", liquidity_gt: "0"}){
    id
    minter {
      id
    }
    owner {
      id
    }
    pool {
      id
      feeTier
      incentives {
        id
      }
    }
    liquidity
    depositedToken0
    depositedToken1
    withdrawnToken0
    withdrawnToken1
    token0{
      symbol
    }
    token1{
      symbol
    }
    tickLower {
      tickIdx
    }
    tickUpper {
  	  tickIdx
    }
  }
}
`;

export const EXACT_INCENTIVE_QUERY = `
query incentive($id: String!) {
  incentive(subgraphError: deny, id : $id){
    id
    rewardToken {
      id
      symbol
    }
    pool{
      id
      feeTier
    }
    startTime
    endTime
    vestingPeriod
    refundee
    }
  }
`;

// export const TOKEN_SPOT_PRICE_QUERY = `
// query tokenSpotPrice($token: String!) {
//   tokenSpotPrice(subgraphError: deny, token: $token)
// }
// `;

export const INCENTIVES_QUERY = `
  query incentives {
    incentives(subgraphError: deny) {
      id
      ended
      reward
      contract
      startTime
      endTime
      vestingPeriod
      rewardToken {
        id
        decimals
        symbol
      }
      pool{
        id
        feeTier
      }
      refundee
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

export const calculateApy24hrs = async (
  incentive: Incentive,
  totalRewardsToken: string // in ETH ex: 100 = 100 * 10^18 wei
): Promise<number> => {
  const incentiveDuration =
    Number(incentive.endTime) - Number(incentive.startTime);
  const incentiveDurationInDays = incentiveDuration / (60 * 60 * 24);

  // Correctly convert totalRewardsToken to its decimal value
  const totalRewardTokensDecimal = parseFloat(totalRewardsToken);

  // Calculate daily rewards in tokens
  const dailyRewardTokens = totalRewardTokensDecimal / incentiveDurationInDays;

  // Get the USD price of the reward token
  const { usdPrice: rewardTokenUsdPrice } = await useTokenUsdPrice(
    incentive.rewardToken.id
  );

  if (!rewardTokenUsdPrice) {
    return 0;
  }

  let stakedLiquidity = await useGetStakedLiqudityForPool(
    incentive.pool.id.toLowerCase()
  );
  // console.log("stakedLiquidity", stakedLiquidity);
  if (stakedLiquidity === 0) {
    stakedLiquidity = 1;
  }
  // Daily rewards in USD
  // need to divide this by number of stakers later
  const dailyRewards = dailyRewardTokens * rewardTokenUsdPrice;
  console.log("dailyRewards", dailyRewards);
  const dailyRewardUsd =
    (dailyRewardTokens * rewardTokenUsdPrice) / stakedLiquidity;

  console.log("dailyRewardUsd", dailyRewardUsd);

  return dailyRewardUsd;
};
