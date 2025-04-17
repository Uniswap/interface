import { useState, useEffect, useCallback, useMemo } from "react";
import { useAccount } from "hooks/useAccount";
import { formatUnits } from "viem/utils";
import {
  findTokenByAddress,
  INCENTIVES_QUERY,
} from "components/Incentives/types";
import useTotalPositions, { PositionsResponse } from "hooks/useTotalPositions";
import { useTokenList } from "hooks/useTokenList";
import { useMultipleTokenBalances } from "hooks/useMultipleTokenBalances";
import { useV3StakerContract } from "hooks/useV3StakerContract";

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
  };
  liquidity: string;
  depositedToken0: string;
  depositedToken1: string;
  withdrawnToken0: string;
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
}


export function useIncentivesData(poolAddress?: string) {
  const account = useAccount();
  const v3StakerContract = useV3StakerContract();
  const [activeIncentives, setActiveIncentives] = useState<
    ProcessedIncentive[]
  >([]);
  const [endedIncentives, setEndedIncentives] = useState<ProcessedIncentive[]>(
    []
  );
  const [userPositionsInPools, setUserPositionsInPools] = useState<UserPosition[]>([]);
  const [userPositionsInIncentives, setUserPositionsInIncentives] = useState<PositionsResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [storedBalances, setStoredBalances] = useState<
    Record<string, { balance: number }>
  >({});
  const { getPositionsWithDepositsOfUser } = useTotalPositions();
  const { tokenList, isLoadingTokenList } = useTokenList();
  const [incentivesData, setIncentivesData] = useState<IncentiveData[]>([]);

  const tokenAddresses = useMemo(() => {
    const addresses = new Set<string>();
    incentivesData.forEach((incentive) => {
      addresses.add(incentive.pool.token0.id.toLowerCase());
      addresses.add(incentive.pool.token1.id.toLowerCase());
    });
    return Array.from(addresses);
  }, [incentivesData]);

  const { balances, isBalancesLoading } =
    useMultipleTokenBalances(tokenAddresses);

  useEffect(() => {
    if (!isBalancesLoading && balances) {
      setStoredBalances(balances);
    }
  }, [balances, isBalancesLoading]);

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
        positions(where: { owner: "${userAddress.toLowerCase()}" }) {
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
          }
          liquidity
          depositedToken0
          withdrawnToken0
          depositedToken1
          withdrawnToken1
          token0 {
            symbol
          }
          token1 {
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
  }, []);

  useEffect(() => {
    if (account.address) {
      fetchData();
    }
  }, [account.address, poolAddress]);

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

      if (!incentivesData.data?.incentives?.length) {
        setActiveIncentives([]);
        setEndedIncentives([]);
        setIncentivesData([]);
        setUserPositionsInPools([]);
        setUserPositionsInIncentives([]);
        setIsLoading(false);
        return;
      }

      setIncentivesData(incentivesData.data.incentives);
      const ethPriceUSD = parseFloat(incentivesData.data.bundle.ethPriceUSD);
      const positions = positionsData.data.positions;

      const incentives = incentivesData.data.incentives.map(
        (inc: IncentiveData) => {
          if (!inc.rewardToken?.decimals) {
            inc.rewardToken = {
              ...inc.rewardToken,
              decimals: 18,
            };
          }
          return processIncentive(inc, positions, storedBalances, ethPriceUSD);
        }
      );

      const processedIncentives = await Promise.all(incentives);
      const sortedIncentives = processedIncentives.sort((a, b) => {
        if (a.status === 'active' && b.status !== 'active') return -1;
        if (a.status !== 'active' && b.status === 'active') return 1;
        if (a.status === 'inactive' && b.status === 'ended') return -1;
        if (a.status === 'ended' && b.status === 'inactive') return 1;
        return 0;
      });

      setActiveIncentives(sortedIncentives.filter((inc: ProcessedIncentive) => inc.status === 'active'));
      setEndedIncentives(sortedIncentives.filter((inc: ProcessedIncentive) => inc.status === 'inactive' || inc.status === 'ended'));
      setUserPositionsInPools(positions);
    } catch (error) {
      console.error("Error fetching data:", error);
      setError(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (
      !isBalancesLoading &&
      Object.keys(storedBalances).length > 0 &&
      incentivesData.length > 0 &&
      account.address
    ) {
      const processIncentives = async () => {
        const positions = await getPositionsWithDepositsOfUser(
          account.address as string
        );
        const response = await fetch(
          "https://indexer.lswap.app/subgraphs/name/taraxa/uniswap-v3/",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              query: getIncentivesQuery(),
              variables: { userAddress: account.address },
            }),
          }
        );
        const data = await response.json();
        const ethPriceUSD = parseFloat(data.data.bundle.ethPriceUSD);

        const incentives = incentivesData.map((inc) =>
          processIncentive(inc, positions, storedBalances, ethPriceUSD)
        );

        const processedIncentives = await Promise.all(incentives);
        const sortedIncentives = processedIncentives.sort((a, b) => {
          if (a.status === 'active' && b.status !== 'active') return -1;
          if (a.status !== 'active' && b.status === 'active') return 1;
          if (a.status === 'inactive' && b.status === 'ended') return -1;
          if (a.status === 'ended' && b.status === 'inactive') return 1;
          return 0;
        });

        // Collect all positions from processed incentives
        const allPositions = new Set<PositionsResponse>();
        processedIncentives.forEach(inc => {
          if (inc.positionOnIncentiveIds) {
            inc.positionOnIncentiveIds.forEach(id => {
              const position = positions.find(p => p.id === id);
              if (position) allPositions.add(position);
            });
          }
        });
        
        setUserPositionsInIncentives(Array.from(allPositions));
        setActiveIncentives(sortedIncentives.filter((inc) => inc.status === 'active'));
        setEndedIncentives(sortedIncentives.filter((inc) => inc.status === 'inactive' || inc.status === 'ended'));
      };

      processIncentives();
    }
  }, [storedBalances, isBalancesLoading, incentivesData, account.address]);

  const processIncentive = useCallback(
    async (
      incentive: IncentiveData,
      userPositions: PositionsResponse[],
      currentBalances: Record<string, { balance: number }>,
      ethPriceUSD: number
    ): Promise<ProcessedIncentive> => {
      const positionOnIncentiveIds = [];
      const positionOnIncentive = [];
      const positionOnPoolIds = userPositionsInPools.map(position => Number(position.id));
      let hasUserPositionInIncentive = false;
      let currentReward = undefined;

      const status = Number(incentive.endTime) < Math.floor(Date.now() / 1000) 
        ? 'ended' 
        : Number(incentive.startTime) > Math.floor(Date.now() / 1000)
          ? 'inactive'
          : 'active';

      if (userPositions.length > 0 && v3StakerContract) {
        try {
          for (const position of userPositions) {
            const stakeInfo = await v3StakerContract.stakes(position.id, incentive.id);
            if (stakeInfo.liquidity > 0) {
              hasUserPositionInIncentive = true;
              const reward = await v3StakerContract.rewards(
                incentive.rewardToken.id,
                account.address as string
              );
              currentReward = {
                reward: formatUnits(reward || '0', incentive.rewardToken.decimals),
              };

              positionOnIncentiveIds.push(position.id);
              positionOnIncentive.push(position);
              break;
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

      const dailyFees = parseFloat(
        incentive.pool.poolDayData[0]?.feesUSD || "0"
      );
      const dailyVolume = parseFloat(
        incentive.pool.poolDayData[0]?.volumeUSD || "1"
      );
      const tvlUSD = parseFloat(incentive.pool.totalValueLockedUSD || "1");
      const annualizedFees = dailyFees * 365;
      const tradingFeeAPR = (annualizedFees / dailyVolume) * 100;

      const timeRange =
        parseInt(incentive.endTime) - parseInt(incentive.startTime);
      const rewardPerSecond = parseFloat(incentive.reward) / timeRange;

      const rewardToken = incentive.pool.token1;
      const rewardTokenPriceUSD =
        parseFloat(rewardToken.derivedETH || "0") * ethPriceUSD;

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
        currentBalances[incentive.pool.token0.id.toLowerCase()]?.balance > 0 &&
        currentBalances[incentive.pool.token1.id.toLowerCase()]?.balance > 0;

      const daily24hAPR = totalAPR / 365;
      const weeklyRewards = adjustedDailyReward * 7;
      const weeklyRewardsUSD = dailyRewardsUSD * 7;

      // Calculate accrued rewards
      const currentTime = Math.floor(Date.now() / 1000);
      const startTime = parseInt(incentive.startTime);
      const endTime = parseInt(incentive.endTime);
      const timeElapsed = Math.min(currentTime - startTime, endTime - startTime);
      const accruedRewards = (timeElapsed * rewardPerSecond) / Math.pow(10, decimals);

      return {
        id: incentive.id,
        poolId: userPositions.length > 0 ? incentive.pool.id : undefined,
        poolName: `${incentive.pool.token0.symbol}-${incentive.pool.token1.symbol}`,
        positionOnIncentiveIds,
        positionOnPoolIds,
        hasUserPositionInPool: userPositions.filter(position => position.pool.id === incentive.pool.id).length > 0,
        feeTier: `${(incentive.pool.feeTier / 10000).toFixed(2)}%`,
        liquidity: incentive.pool.totalValueLockedUSD,
        volume24h: incentive.pool.volumeUSD,
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
        feesUSD: incentive.pool.feesUSD,
        status,
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
      };
    },
    [tokenList, v3StakerContract]
  );

  if (isLoadingTokenList || (isBalancesLoading && incentivesData.length > 0)) {
    return {
      activeIncentives: [],
      endedIncentives: [],
      userPositions: [],
      isLoading: true,
      error: null,
      refetch: fetchData,
    };
  }

  return {
    activeIncentives,
    endedIncentives,
    userPositionsInPools,
    userPositionsInIncentives,
    isLoading,
    error,
    refetch: fetchData,
  };
}
