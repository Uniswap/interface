import { useState, useEffect } from "react";

const FEE_DISTRIBUTION_QUERY = `
  query getFeeDistribution($poolId: ID!) {
    pool(id: $poolId) {
      id
      feeTier
      token0 {
        symbol
        id
      }
      token1 {
        symbol
        id
      }
      poolDayData(first: 1, orderBy: date, orderDirection: desc) {
        feesUSD
        volumeUSD
      }
    }
  }
`;

interface FeeDistributionData {
  tradeFees: number;
  tokenRewards: number;
  totalAPR: number;
}

interface FeeDistributionResult {
  loading: boolean;
  error: Error | null;
  data: FeeDistributionData | null;
}

export function useFeeDistribution(poolId: string): FeeDistributionResult {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<FeeDistributionData | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

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
              variables: { poolId: poolId },
            }),
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        console.log("response", response);

        const result = await response.json();
        console.log("result", result);

        if (result.errors) {
          throw new Error(result.errors[0].message);
        }

        if (!result.data || !result.data.pool) {
          throw new Error("No pool data received from the API");
        }

        // Calculate APRs based on pool data
        const { pool } = result.data;
        const dailyFees = parseFloat(pool.poolDayData[0]?.feesUSD || "0");
        const annualizedFees = dailyFees * 365;

        // Assuming RAY rewards are 1.04% of the total APR as shown in the image
        const tokenRewardsPercentage = 1.04;
        const tradeFees =
          (annualizedFees / parseFloat(pool.poolDayData[0]?.volumeUSD || "1")) *
          100;
        const totalAPR = tradeFees + tokenRewardsPercentage;

        setData({
          tradeFees,
          tokenRewards: tokenRewardsPercentage,
          totalAPR,
        });
      } catch (err) {
        console.error("Error fetching fee distribution:", err);
        setError(err instanceof Error ? err : new Error("An error occurred"));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [poolId]);

  return { loading, error, data };
}
