import { useState, useEffect, useCallback, useMemo } from "react";
import { useAccount } from "hooks/useAccount";
import { formatUnits } from "viem/utils";
import {
  findTokenByAddress,
  INCENTIVES_QUERY,
} from "components/Incentives/types";
import { PositionsResponse } from "hooks/useTotalPositions";
import { useTokenList } from "hooks/useTokenList";
import { useMultipleTokenBalances } from "hooks/useMultipleTokenBalances";
import { useV3StakerContract } from "hooks/useV3StakerContract";
import { usePoolDatas } from "hooks/usePoolDatas";

interface IncentiveData {
  id: string;
  reward: string;
  rewardToken: {
    id: string;
    symbol: string;
    decimals: number;
    derivedETH: string;
  };
  pool: {
    id: string;
    feeTier: number;
    token0: {
      id: string;
      symbol: string;
      name: string;
    };
    token1: {
      id: string;
      symbol: string;
      name: string;
      derivedETH: string;
      decimals: number;
    };
    liquidity: string;
    totalValueLockedUSD: string;
    feesUSD: string;
    volumeUSD: string;
    poolDayData: {
      feesUSD: string;
      volumeUSD: string;
    }[];
  };
  startTime: string;
  endTime: string;
  vestingPeriod: string;
  refundee: string;
  ended: boolean;
}

export interface UserPosition {
  id: string;
  minter: { id: string };
  owner: { id: string };
  pool: {
    id: string;
    feeTier: number;
    incentives: { id: string }[];
    token0: { symbol: string, id: string };
    token1: { symbol: string, id: string };
  };
  liquidity: string;
  depositedToken0: string;
  withdrawnToken0: string;
  depositedToken1: string;
  withdrawnToken1: string;
  token0: { symbol: string};
  token1: { symbol: string};
  tickLower: { tickIdx: string };
  tickUpper: { tickIdx: string };
}

export interface ProcessedIncentive {
  id: string;
  poolName: string;
  token0Symbol: string;
  token1Symbol: string;
  token0Address: string;
  token1Address: string;
  token0LogoURI: string;
  token1LogoURI: string;
  feeTier: string;
  liquidity: string;
  volume24h: string;
  feesUSD: string;
  apr24h: string;
  tradingFeeAPR: number;
  tokenRewardsAPR: number;
  totalAPR: number;
  tradeFeesPercentage: number;
  tokenRewardsPercentage: number;
  hasUserPositionInIncentive: boolean;
  status: 'active' | 'ended' | 'inactive';
  reward: string;
  rewardToken: {
    id: string;
    symbol: string;
    decimals: number;
  };
  poolAddress: string;
  poolId?: string;
  userHasTokensToDeposit: boolean;
  daily24hAPR: number;
  weeklyRewards: number;
  weeklyRewardsUSD: number;
  accruedRewards: string;
  startTime: number;
  endTime: number;
  vestingPeriod: string;
  refundee: string;
  currentReward?: {
    reward: string;
  };
  positionOnIncentiveIds?: number[];
  positionOnPoolIds?: number[];
  hasUserPositionInPool: boolean;
  canWithdraw: boolean;
  poolPositionId?: number;
}

export interface PositionWithReward extends PositionsResponse {
  reward: string;
  incentiveId: string;
}

const formatValue = (value: string | number) => {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "$0.00";
  return num.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });
};

export function useIncentivesData(poolAddress?: string) {
  const account = useAccount();
  const v3StakerContract = useV3StakerContract();
  const [activeIncentives, setActiveIncentives] = useState<ProcessedIncentive[]>([]);
  const [endedIncentives, setEndedIncentives] = useState<ProcessedIncentive[]>([]);
  const [userPositionsInPools, setUserPositionsInPools] = useState<UserPosition[]>([]);
  const [userPositionsInIncentives, setUserPositionsInIncentives] = useState<PositionWithReward[]>([]);
  const [positionsToWithdraw, setPositionsToWithdraw] = useState<PositionWithReward[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [storedBalances, setStoredBalances] = useState<Record<string, { balance: number }>>({});
  const { tokenList, isLoadingTokenList } = useTokenList();
  const [incentivesData, setIncentivesData] = useState<IncentiveData[]>([]);
  const [ethPriceUSD, setEthPriceUSD] = useState<number>(0);

  const getIncentivesQuery = useCallback(() => {
    const baseQuery = INCENTIVES_QUERY;
    if (!poolAddress) return baseQuery;

    return baseQuery.replace(
      'incentives(',
      `incentives(where: { pool: "${poolAddress.toLowerCase()}" },`
    );
  }, [poolAddress]);

  const getUserPositionsQuery = useCallback((userAddress: string) => {
    return `
      query {
        positions(where: { owner: "${userAddress.toLowerCase()}", liquidity_gt: "0" }) {
          id
          owner {
            id
          }
          minter {
            id
          }
          pool {
            id
            feeTier
            incentives {
              id
            }
            token0 {
              id
              symbol
              decimals
            }
            token1 {
              id
              symbol
              decimals
            }
          }
          liquidity
          depositedToken0
          withdrawnToken0
          depositedToken1
          withdrawnToken1
          token0 {
            id
            symbol
            decimals
          }
          token1 {
            id
            symbol
            decimals
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
  }, []);

  const processIncentive = useCallback(
    async (
      incentive: IncentiveData,
      userPositions: UserPosition[],
      currentBalances: Record<string, { balance: number }>,
      ethPrice: number,
      poolData?: any
    ): Promise<ProcessedIncentive> => {
      const positionOnIncentiveIds = [];
      const positionOnIncentive: UserPosition[] = [];
      const positionOnPoolIds = userPositions.map(position => Number(position.id));
      let hasUserPositionInIncentive = false;
      let currentReward: { reward: string } | undefined = undefined;
      let canWithdraw = false;

      const status = Number(incentive.endTime) < Math.floor(Date.now() / 1000)
        ? 'ended'
        : Number(incentive.startTime) > Math.floor(Date.now() / 1000)
          ? 'inactive'
          : 'active';

      if (userPositions.length > 0 && v3StakerContract) {
        try {
          for (const position of userPositions) {
            const stakeInfo = await v3StakerContract.stakes(position.id, incentive.id);
            const deposit = await v3StakerContract.deposits(position.id);
            if (deposit.owner === account.address) {
              canWithdraw = true;
            }
            if (canWithdraw) {
              setPositionsToWithdraw(prev => {
                const positionExists = prev.some(p => Number(p.id) === Number(position.id));
                if (positionExists) {
                  return prev;
                }
                const positionWithReward: PositionWithReward = {
                  ...position,
                  id: Number(position.id),
                  liquidity: Number(position.liquidity),
                  tickLower: { tickIdx: Number(position.tickLower.tickIdx) },
                  tickUpper: { tickIdx: Number(position.tickUpper.tickIdx) },
                  reward: currentReward?.reward ?? '0',
                  incentiveId: incentive.id
                };
                return [...prev, positionWithReward];
              });
            }

            if (stakeInfo.liquidity > 0) {
              hasUserPositionInIncentive = true;
              const reward = await v3StakerContract.rewards(
                incentive.rewardToken.id,
                account.address as string
              );
              currentReward = {
                reward: formatUnits(reward || '0', incentive.rewardToken.decimals),
              };
              positionOnIncentiveIds.push(Number(position.id));
              positionOnIncentive.push(position);
              
              setUserPositionsInIncentives(prevPositions => {
                const positionExists = prevPositions.some((p) => {
                  return Number(p.id) === Number(position.id) && p.incentiveId === incentive.id;
                });
                if (!positionExists) {
                  const positionWithReward: PositionWithReward = {
                    ...position,
                    id: Number(position.id),
                    liquidity: Number(position.liquidity),
                    tickLower: { tickIdx: Number(position.tickLower.tickIdx) },
                    tickUpper: { tickIdx: Number(position.tickUpper.tickIdx) },
                    reward: currentReward?.reward ?? '0',
                    incentiveId: incentive.id
                  };
                  return [...prevPositions, positionWithReward];
                }
                return prevPositions;
              });
            }
          }
        } catch (error) {
          console.warn('Error checking stake status:', error);
          hasUserPositionInIncentive = false;
        }
      }

      const token0Info = findTokenByAddress(
        tokenList,
        incentive.pool.token0.id
      );
      const token1Info = findTokenByAddress(
        tokenList,
        incentive.pool.token1.id
      );

      const tvlUSD = poolData?.tvlUSD ;
      const volumeUSD = poolData?.volumeUSD ;
      const feeTierBps = incentive.pool.feeTier;
      const feeRate = feeTierBps / 1e6;
      const feesUSD = volumeUSD * feeRate;
      const annualizedFees = feesUSD * 365;
      const tradingFeeAPR = tvlUSD > 0 ? (annualizedFees / tvlUSD) * 100 : 0;

      const timeRange =
        parseInt(incentive.endTime) - parseInt(incentive.startTime);
      const rewardPerSecond = parseFloat(incentive.reward) / timeRange;

      const rewardToken = incentive.pool.token1;
      const rewardTokenPriceUSD =
        parseFloat(rewardToken.derivedETH || "0") * ethPrice;

      const dailyRewardRate = rewardPerSecond * 86400;
      const decimals = rewardToken.decimals || 18;
      const adjustedDailyReward = dailyRewardRate / Math.pow(10, decimals);

      const dailyRewardsUSD = adjustedDailyReward * rewardTokenPriceUSD;
      const annualizedRewardsUSD = dailyRewardsUSD * 365;
      const tokenRewardsAPR =
        tvlUSD > 0 ? (annualizedRewardsUSD / tvlUSD) * 100 : 0;

      const totalAPR = tradingFeeAPR + tokenRewardsAPR;
      const tradeFeesPercentage =
        totalAPR > 0 ? (tradingFeeAPR / totalAPR) * 100 : 0;
      const tokenRewardsPercentage =
        totalAPR > 0 ? (tokenRewardsAPR / totalAPR) * 100 : 0;

      const userHasTokensToDeposit =
        currentBalances[incentive.pool.token1.id]?.balance > 0;

      const daily24hAPR = totalAPR / 365;
      const weeklyRewards = adjustedDailyReward * 7;
      const weeklyRewardsUSD = dailyRewardsUSD * 7;

      const currentTime = Math.floor(Date.now() / 1000);
      const startTime = parseInt(incentive.startTime);
      const endTime = parseInt(incentive.endTime);
      const timeElapsed = Math.min(currentTime - startTime, endTime - startTime);
      const accruedRewards = (timeElapsed * rewardPerSecond) / Math.pow(10, decimals);

      const processedIncentive: ProcessedIncentive = {
        id: incentive.id,
        poolId: userPositions.length > 0 ? incentive.pool.id : undefined,
        poolName: `${incentive.pool.token0.symbol}-${incentive.pool.token1.symbol}`,
        positionOnIncentiveIds,
        positionOnPoolIds,
        poolPositionId: userPositions.filter(position => position.pool.id === incentive.pool.id)[0]?.id ? Number(userPositions.filter(position => position.pool.id === incentive.pool.id)[0]?.id) : undefined,
        hasUserPositionInPool: userPositions.filter(position => position.pool.id === incentive.pool.id).length > 0,
        feeTier: `${(incentive.pool.feeTier / 10000).toFixed(2)}%`,
        liquidity: formatValue(tvlUSD),
        volume24h: formatValue(volumeUSD),
        apr24h: `${(totalAPR / 365).toFixed(2)}%`,
        tradingFeeAPR,
        tokenRewardsAPR,
        totalAPR,
        tradeFeesPercentage,
        tokenRewardsPercentage,
        reward: formatUnits(
          BigInt(incentive.reward),
          incentive.rewardToken.decimals
        ),
        rewardToken: {
          id: incentive.rewardToken.id,
          symbol: incentive.rewardToken.symbol,
          decimals: incentive.rewardToken.decimals,
        },
        hasUserPositionInIncentive,
        poolAddress: incentive.pool.id,
        token0Symbol: incentive.pool.token0.symbol,
        token1Symbol: incentive.pool.token1.symbol,
        token0Address: incentive.pool.token0.id,
        token1Address: incentive.pool.token1.id,
        token0LogoURI: token0Info?.logoURI || "",
        token1LogoURI: token1Info?.logoURI || "",
        feesUSD: formatValue(feesUSD),
        status: status as 'active' | 'ended' | 'inactive',
        userHasTokensToDeposit,
        daily24hAPR,
        weeklyRewards,
        weeklyRewardsUSD,
        accruedRewards: accruedRewards.toFixed(6),
        startTime,
        endTime,
        vestingPeriod: incentive.vestingPeriod,
        refundee: incentive.refundee,
        currentReward,
        canWithdraw,
      };

      return processedIncentive;
    },
    [tokenList, v3StakerContract, account.address]
  );

  const poolAddresses = useMemo(() => {
    return incentivesData.map((incentive: IncentiveData) => incentive.pool.id);
  }, [incentivesData]);

  const { data: poolsData, loading: poolsLoading } = usePoolDatas(poolAddresses);
  console.log('poolsData', poolsData)

  const fetchData = async () => {
    if (!account.address) return;

    try {
      setIsLoading(true);
      setError(null);

      const [incentivesResponse, positionsResponse] = await Promise.all([
        fetch("https://indexer.lswap.app/subgraphs/name/taraxa/uniswap-v3/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: getIncentivesQuery(),
            variables: { userAddress: account.address },
          }),
        }),
        fetch("https://indexer.lswap.app/subgraphs/name/taraxa/uniswap-v3/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: getUserPositionsQuery(account.address),
          }),
        }),
      ]);

      const [incentivesData, positionsData] = await Promise.all([
        incentivesResponse.json(),
        positionsResponse.json(),
      ]);

      if (incentivesData.errors) {
        throw new Error(incentivesData.errors[0].message);
      }

      if (positionsData.errors) {
        throw new Error(positionsData.errors[0].message);
      }

      if (!incentivesData?.data?.incentives?.length) {
        setActiveIncentives([]);
        setEndedIncentives([]);
        setIncentivesData([]);
        setUserPositionsInPools([]);
        setUserPositionsInIncentives([]);
        setPositionsToWithdraw([]);
        setIsLoading(false);
        return;
      }

      setIncentivesData(incentivesData.data.incentives);
      setEthPriceUSD(parseFloat(incentivesData.data.bundle?.ethPriceUSD || "0"));
      const positions = positionsData.data?.positions || [];
      setUserPositionsInPools(positions);
    } catch (error) {
      console.error("Error fetching data:", error);
      setError(error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!poolsLoading && poolsData && incentivesData.length > 0) {
      const processIncentives = async () => {
        try {
          const processedIncentives = await Promise.all(
            incentivesData.map((inc: IncentiveData) => {
              if (!inc.rewardToken?.decimals) {
                inc.rewardToken = {
                  ...inc.rewardToken,
                  decimals: 18,
                };
              }
              const poolData = poolsData[inc.pool.id];
              return processIncentive(inc, userPositionsInPools, storedBalances, ethPriceUSD, poolData);
            })
          );

          const sortedIncentives = processedIncentives.sort((a, b) => {
            if (a.status === 'active' && b.status !== 'active') return -1;
            if (a.status !== 'active' && b.status === 'active') return 1;
            if (a.status === 'inactive' && b.status === 'ended') return -1;
            if (a.status === 'ended' && b.status === 'inactive') return 1;
            return 0;
          });

          setActiveIncentives(sortedIncentives.filter((inc: ProcessedIncentive) => inc.status === 'active'));
          setEndedIncentives(sortedIncentives.filter((inc: ProcessedIncentive) => inc.status === 'inactive' || inc.status === 'ended'));
          setIsLoading(false);
        } catch (error) {
          console.error("Error processing incentives:", error);
          setError(error);
          setIsLoading(false);
        }
      };

      processIncentives();
    }
  }, [poolsData, poolsLoading, incentivesData, userPositionsInPools, storedBalances, ethPriceUSD, processIncentive]);

  useEffect(() => {
    if (account.address) {
      fetchData();
    }
  }, [account.address, poolAddress]);

  return {
    activeIncentives,
    endedIncentives,
    userPositionsInPools,
    userPositionsInIncentives,
    positionsToWithdraw,
    isLoading: isLoading || poolsLoading,
    error,
    refetch: fetchData,
  };
}
