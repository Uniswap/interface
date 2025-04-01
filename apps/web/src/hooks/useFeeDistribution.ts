import { useState, useEffect, useRef } from "react";

const FEE_DISTRIBUTION_QUERY = `
  query getFeeDistribution($incentiveId: ID!) {
    incentive(id: $incentiveId) {
      id
      reward
      endTime
      startTime
      pool {
        id
        totalValueLockedUSD
        token0 {
          symbol
          decimals
          derivedETH
        }
        token1 {
          symbol
          decimals
          derivedETH
        }
        poolDayData(first: 1, orderBy: date, orderDirection: desc) {
          feesUSD
          volumeUSD
        }
      }
    }
    bundle(id: "1") {
      ethPriceUSD
    }
  }
`;

interface FeeDistributionData {
  tradeFees: number;
  tokenRewards: number;
  totalAPR: number;
  tradeFeesPercentage: number;
  tokenRewardsPercentage: number;
  daily24hAPR: number;
}

interface FeeDistributionResult {
  loading: boolean;
  error: Error | null;
  data: FeeDistributionData | null;
}

// Cache to store results
const cache = new Map<
  string,
  { data: FeeDistributionData; timestamp: number }
>();
const CACHE_DURATION = 30000; // 30 seconds cache duration

export function useFeeDistribution(incentiveId: string): FeeDistributionResult {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<FeeDistributionData | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      // Check cache first
      const cached = cache.get(incentiveId);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        if (isMounted.current) {
          setData(cached.data);
          setLoading(false);
        }
        return;
      }

      try {
        if (isMounted.current) {
          setLoading(true);
          setError(null);
        }

        const response = await fetch(
          "https://indexer.lswap.app/subgraphs/name/taraxa/uniswap-v3/",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify({
              query: FEE_DISTRIBUTION_QUERY,
              variables: { incentiveId },
            }),
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.errors) {
          throw new Error(result.errors[0].message);
        }

        if (!result.data || !result.data.incentive) {
          throw new Error("No incentive data received from the API");
        }

        const { incentive, bundle } = result.data;
        const { pool } = incentive;

        // Calculate trading fee APR
        const dailyFees = parseFloat(pool.poolDayData[0]?.feesUSD || "0");
        const dailyVolume = parseFloat(pool.poolDayData[0]?.volumeUSD || "1");
        const tvlUSD = parseFloat(pool.totalValueLockedUSD || "1");
        const annualizedFees = dailyFees * 365;
        const tradingFeeAPR = (annualizedFees / dailyVolume) * 100;

        // Calculate token rewards APR for this specific incentive
        const ethPriceUSD = parseFloat(bundle.ethPriceUSD);
        const timeRange =
          parseInt(incentive.endTime) - parseInt(incentive.startTime);
        const rewardPerSecond = parseFloat(incentive.reward) / timeRange;

        // Assuming reward is in token0, adjust if needed
        const rewardToken = pool.token1;
        const rewardTokenPriceUSD =
          parseFloat(rewardToken.derivedETH) * ethPriceUSD;

        const dailyRewardRate = rewardPerSecond * 86400;
        const decimals = parseInt(rewardToken.decimals);
        const adjustedDailyReward = dailyRewardRate / Math.pow(10, decimals);

        const dailyRewardsUSD = adjustedDailyReward * rewardTokenPriceUSD;
        const annualizedRewardsUSD = dailyRewardsUSD * 365;
        const tokenRewardsAPR =
          tvlUSD > 0 ? (annualizedRewardsUSD / tvlUSD) * 100 : 0;

        // Calculate total APR
        const totalAPR = tradingFeeAPR + tokenRewardsAPR;

        // Calculate percentages of total APR
        const tradeFeesPercentage =
          totalAPR > 0 ? (tradingFeeAPR / totalAPR) * 100 : 0;
        const tokenRewardsPercentage =
          totalAPR > 0 ? (tokenRewardsAPR / totalAPR) * 100 : 0;

        const newData = {
          tradeFees: tradingFeeAPR,
          tokenRewards: tokenRewardsAPR,
          totalAPR,
          tradeFeesPercentage,
          tokenRewardsPercentage,
          daily24hAPR: totalAPR / 365,
        };

        // Update cache
        cache.set(incentiveId, { data: newData, timestamp: Date.now() });

        if (isMounted.current) {
          setData(newData);
        }
      } catch (err) {
        console.error("Error fetching fee distribution:", err);
        if (isMounted.current) {
          setError(err instanceof Error ? err : new Error("An error occurred"));
        }
      } finally {
        if (isMounted.current) {
          setLoading(false);
        }
      }
    };

    fetchData();
  }, [incentiveId]);

  return { loading, error, data };
}
