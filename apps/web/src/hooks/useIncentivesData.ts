import { useState, useEffect, useCallback, useMemo } from "react";
import { useAccount } from "hooks/useAccount";
import { formatUnits } from "viem/utils";
import {
  findTokenByAddress,
  INCENTIVES_QUERY,
} from "components/Incentives/types";
import { PositionsResponse } from "hooks/useTotalPositions";
import { useTokenList } from "hooks/useTokenList";
import { useV3StakerContract } from "hooks/useV3StakerContract";
import { usePoolDatas } from "hooks/usePoolDatas";
import { useTokenEthPrice } from "./useTokenUsdPrice";
import { Token } from "@taraswap/sdk-core";
import { useMultipleTokenBalances } from "./useMultipleTokenBalances";

interface IncentiveData {
  id: string;
  reward: string;
  rewardToken: {
    id: string;
    symbol: string;
    decimals: number;
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
  numberOfStakers?: number;
}

export interface UserPosition {
  id: string;
  minter: { id: string };
  owner: { id: string };
  pool: {
    id: string;
    feeTier: number;
    incentives: { id: string }[];
    token0: { symbol: string; id: string };
    token1: { symbol: string; id: string };
  };
  liquidity: string;
  depositedToken0: string;
  withdrawnToken0: string;
  depositedToken1: string;
  withdrawnToken1: string;
  token0: { symbol: string };
  token1: { symbol: string };
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
  status: "active" | "ended" | "inactive";
  reward: string;
  rewardToken: {
    id: string;
    symbol: string;
    decimals: number;
    logoURI: string;
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
  poolPositionIds?: number[];
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
  const [activeIncentives, setActiveIncentives] = useState<
    ProcessedIncentive[]
  >([]);
  const [endedIncentives, setEndedIncentives] = useState<ProcessedIncentive[]>(
    []
  );
  const [userPositionsInPools, setUserPositionsInPools] = useState<
    UserPosition[]
  >([]);
  const [userPositionsInIncentives, setUserPositionsInIncentives] = useState<
    PositionWithReward[]
  >([]);
  const [positionsToWithdraw, setPositionsToWithdraw] = useState<
    PositionWithReward[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { tokenList, isLoadingTokenList } = useTokenList();
  const [incentivesData, setIncentivesData] = useState<IncentiveData[]>([]);
  const [ethPriceUSD, setEthPriceUSD] = useState<number>(0);
  const [lastProcessedTime, setLastProcessedTime] = useState<number>(0);

  const accountAddress = useMemo(() => account.address, [account.address]);
  const tokenAddresses = useMemo(() => {
    if (!incentivesData.length) return [];
    return incentivesData.map(incentive => incentive.pool.token1.id);
  }, [incentivesData]);

  const { balances } = useMultipleTokenBalances(tokenAddresses);

  const getStakersQuery = useCallback((incentiveId: string) => {
    return `
      query incentivePoistions{
        incentivePositions(where: {incentive: "${incentiveId}"}){
          id
          incentive{
            id
          }
        }
      }`;
  }, []);

  const getIncentivesQuery = useCallback(() => {
    const baseQuery = INCENTIVES_QUERY;
    if (!poolAddress) return baseQuery;

    return baseQuery.replace(
      "incentives(",
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

  const fetchData = useCallback(async () => {
    if (!accountAddress) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const [incentivesResponse, positionsResponse] = await Promise.all([
        fetch("https://indexer.lswap.app/subgraphs/name/taraxa/uniswap-v3/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: getIncentivesQuery(),
            variables: { userAddress: accountAddress },
          }),
        }),
        fetch("https://indexer.lswap.app/subgraphs/name/taraxa/uniswap-v3/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: getUserPositionsQuery(accountAddress),
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

      // Fetch stakers data for all incentives
      const stakersPromises = incentivesData.data.incentives.map(
        (incentive: IncentiveData) =>
          fetch("https://indexer.lswap.app/subgraphs/name/taraxa/uniswap-v3/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              query: getStakersQuery(incentive.id),
            }),
          }).then((res) => res.json())
      );

      const stakersResults = await Promise.all(stakersPromises);
      const incentivesWithStakers = incentivesData.data.incentives.map(
        (incentive: IncentiveData, index: number) => ({
          ...incentive,
          numberOfStakers: stakersResults[index].data.incentivePositions.length,
        })
      );

      setIncentivesData(incentivesWithStakers);
      setEthPriceUSD(
        parseFloat(incentivesData.data.bundle?.ethPriceUSD || "0")
      );
      const positions = positionsData.data?.positions || [];
      setUserPositionsInPools(positions);
      setIsLoading(false);
    } catch (error) {
      setError(error);
      setIsLoading(false);
    }
  }, [
    accountAddress,
    getIncentivesQuery,
    getStakersQuery,
    getUserPositionsQuery,
  ]);

  const processIncentive = useCallback(
    async (
      incentive: IncentiveData,
      userPositions: UserPosition[],
      ethPrice: number,
      poolData?: any
    ): Promise<ProcessedIncentive> => {
      const positionOnIncentiveIds = [];
      const positionOnIncentive: UserPosition[] = [];
      const positionOnPoolIds = userPositions.map((position) =>
        Number(position.id)
      );
      let hasUserPositionInIncentive = false;
      let currentReward: { reward: string } | undefined = undefined;
      let canWithdraw = false;

      const status =
        Number(incentive.endTime) < Math.floor(Date.now() / 1000)
          ? "ended"
          : Number(incentive.startTime) > Math.floor(Date.now() / 1000)
          ? "inactive"
          : "active";

      if (userPositions.length > 0 && v3StakerContract) {
        try {
          for (const position of userPositions) {
            const stakeInfo = await v3StakerContract.stakes(
              position.id,
              incentive.id
            );
            const deposit = await v3StakerContract.deposits(position.id);
            if (deposit.owner === account.address) {
              canWithdraw = true;
            }
            if (canWithdraw) {
              setPositionsToWithdraw((prev) => {
                const positionExists = prev.some(
                  (p) => Number(p.id) === Number(position.id)
                );
                if (positionExists) {
                  return prev;
                }
                const positionWithReward: PositionWithReward = {
                  ...position,
                  id: Number(position.id),
                  liquidity: Number(position.liquidity),
                  tickLower: { tickIdx: Number(position.tickLower.tickIdx) },
                  tickUpper: { tickIdx: Number(position.tickUpper.tickIdx) },
                  reward: currentReward?.reward ?? "0",
                  incentiveId: incentive.id,
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
                reward: formatUnits(
                  reward || "0",
                  incentive.rewardToken.decimals
                ),
              };
              positionOnIncentiveIds.push(Number(position.id));
              positionOnIncentive.push(position);

              setUserPositionsInIncentives((prevPositions) => {
                const positionExists = prevPositions.some((p) => {
                  return (
                    Number(p.id) === Number(position.id) &&
                    p.incentiveId === incentive.id
                  );
                });
                if (!positionExists) {
                  const positionWithReward: PositionWithReward = {
                    ...position,
                    id: Number(position.id),
                    liquidity: Number(position.liquidity),
                    tickLower: { tickIdx: Number(position.tickLower.tickIdx) },
                    tickUpper: { tickIdx: Number(position.tickUpper.tickIdx) },
                    reward: currentReward?.reward ?? "0",
                    incentiveId: incentive.id,
                  };
                  return [...prevPositions, positionWithReward];
                }
                return prevPositions;
              });
            }
          }
        } catch (error) {
          console.warn("Error checking stake status:", error);
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

      const rewardTokenInfo = findTokenByAddress(
        tokenList,
        incentive.rewardToken.id
      );

      const rewardTokenPriceUSD = useTokenEthPrice(incentive.rewardToken.id);

      const tvlUSD = poolData?.tvlUSD;
      const volumeUSD = poolData?.volumeUSD;
      const createdAtTimestamp = poolData?.createdAtTimestamp;
      const poolTTL = Date.now() / 1000 - createdAtTimestamp;
      const averageVolumeUSDPerSecond = volumeUSD / poolTTL;
      const volume24h = averageVolumeUSDPerSecond * 86400;
      const feeTierBps = incentive.pool.feeTier;
      const feeRate = feeTierBps / 10000;
      const feesUSD = volume24h * feeRate;
      const annualizedFees = feesUSD * 365;
      const tradingFeeAPR = tvlUSD > 0 ? (annualizedFees / tvlUSD) * 100 : 0;

      const timeRange =
        parseInt(incentive.endTime) - parseInt(incentive.startTime);
      const currentTime = Math.floor(Date.now() / 1000);
      const timeElapsed = Math.min(
        currentTime - parseInt(incentive.startTime),
        timeRange
      );
      const remainingTime = timeRange - timeElapsed;
      const rewardPerSecond = parseFloat(incentive.reward) / timeRange;

      const rewardToken = incentive.rewardToken;

      const dailyRewardRate = rewardPerSecond * 86400;
      const decimals = rewardToken.decimals || 18;
      const adjustedDailyReward = dailyRewardRate / Math.pow(10, decimals);

      const tokenPrice = (await rewardTokenPriceUSD).ethPrice;
      const dailyRewardsUSD = adjustedDailyReward * tokenPrice * ethPriceUSD;
      const annualizedRewardsUSD = dailyRewardsUSD * 365;
      const tokenRewardsAPR =
        tvlUSD > 0
          ? (annualizedRewardsUSD / (incentive.numberOfStakers || 1)) * 100
          : 0;

      const totalAPR = tradingFeeAPR + tokenRewardsAPR;
      const tradeFeesPercentage =
        totalAPR > 0 ? (tradingFeeAPR / totalAPR) * 100 : 0;
      const tokenRewardsPercentage =
        totalAPR > 0 ? (tokenRewardsAPR / totalAPR) * 100 : 0;

      const token1Balance = balances[incentive.pool.token1.id.toLowerCase()]?.balance;
      const token0Balance = balances[incentive.pool.token0.id.toLowerCase()]?.balance;
      const hasTokensToDeposit = Boolean(token1Balance && token1Balance > 0 && token0Balance && token0Balance > 0);


      const daily24hAPR = totalAPR / 365;
      const weeklyRewards = adjustedDailyReward * 7;
      const weeklyRewardsUSD = dailyRewardsUSD * 7;

      const startTime = parseInt(incentive.startTime);
      const endTime = parseInt(incentive.endTime);
      const accruedRewards =
        (timeElapsed * rewardPerSecond) / Math.pow(10, decimals);

      const processedIncentive: ProcessedIncentive = {
        id: incentive.id,
        poolId: userPositions.length > 0 ? incentive.pool.id : undefined,
        poolName: `${incentive.pool.token0.symbol}-${incentive.pool.token1.symbol}`,
        positionOnIncentiveIds,
        positionOnPoolIds,
        poolPositionIds: userPositions
          .filter((position) => position.pool.id === incentive.pool.id)
          .map((position) => Number(position.id)),
        hasUserPositionInPool:
          userPositions.filter(
            (position) => position.pool.id === incentive.pool.id
          ).length > 0,
        feeTier: `${(incentive.pool.feeTier / 10000).toFixed(2)}%`,
        liquidity: formatValue(tvlUSD),
        volume24h: formatValue(volume24h),
        apr24h: `${daily24hAPR.toFixed(2)}%`,
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
          logoURI: rewardTokenInfo?.logoURI || "",
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
        status: status as "active" | "ended" | "inactive",
        userHasTokensToDeposit: hasTokensToDeposit,
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
    [tokenList, v3StakerContract, accountAddress, incentivesData, balances]
  );

  const poolAddresses = useMemo(() => {
    return incentivesData.map((incentive: IncentiveData) => incentive.pool.id);
  }, [incentivesData]);

  const { data: poolsData, loading: poolsLoading } =
    usePoolDatas(poolAddresses);

  useEffect(() => {
    if (!poolsLoading && poolsData && incentivesData.length > 0) {
      const now = Date.now();
      if (now - lastProcessedTime < 10000) {
        return;
      }

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
              return processIncentive(
                inc,
                userPositionsInPools,
                ethPriceUSD,
                poolData
              );
            })
          );

          const sortedIncentives = processedIncentives.sort((a, b) => {
            if (a.status === "active" && b.status !== "active") return -1;
            if (a.status !== "active" && b.status === "active") return 1;
            if (a.status === "inactive" && b.status === "ended") return -1;
            if (a.status === "ended" && b.status === "inactive") return 1;
            return 0;
          });

          const active = sortedIncentives.filter(
            (inc: ProcessedIncentive) => inc.status === "active"
          );
          const ended = sortedIncentives.filter(
            (inc: ProcessedIncentive) =>
              inc.status === "inactive" || inc.status === "ended"
          );

          setActiveIncentives(active);
          setEndedIncentives(ended);
          setLastProcessedTime(now);
          setIsLoading(false);
        } catch (error) {
          setError(error);
          setIsLoading(false);
        }
      };

      processIncentives();
      setIsLoading(false);
    }
  }, [
    poolsData,
    poolsLoading,
    incentivesData,
    userPositionsInPools,
    ethPriceUSD,
    processIncentive,
    lastProcessedTime,
  ]);

  useEffect(() => {
    if (accountAddress) {
      fetchData();
    }
  }, [accountAddress, poolAddress, fetchData]);

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
