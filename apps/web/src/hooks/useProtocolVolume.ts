import { useState, useEffect } from "react";
import { indexerTaraswap } from "components/Incentives/types";

interface PoolDayData {
  id: string;
  volumeUSD: string;
  pool: {
    id: string;
  };
}

interface Pool {
  id: string;
  volumeUSD: string;
  feesUSD: string;
}

interface ProtocolVolumeResult {
  dailyVolume: number;
  lifetimeVolume: number;
  lifetimeFees: number;
  loading: boolean;
  error: Error | null;
}

export function useProtocolVolume(): ProtocolVolumeResult {
  const [result, setResult] = useState<ProtocolVolumeResult>({
    dailyVolume: 0,
    lifetimeVolume: 0,
    lifetimeFees: 0,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const fetchProtocolVolume = async () => {
      if (!indexerTaraswap) {
        setResult({
          dailyVolume: 0,
          lifetimeVolume: 0,
          lifetimeFees: 0,
          loading: false,
          error: new Error("GraphQL endpoint not configured"),
        });
        return;
      }

      try {
        // First, get all pools
        const poolsResponse = await fetch(indexerTaraswap, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: `
              query {
                pools(subgraphError: deny, where: {volumeUSD_gt: "0"}) {
                  id
                  volumeUSD
                  feesUSD
                }
              }
            `,
          }),
        });

        if (!poolsResponse.ok) {
          throw new Error(`HTTP error! Status: ${poolsResponse.status}`);
        }

        const poolsData = await poolsResponse.json();

        if (!poolsData?.data?.pools) {
          throw new Error("Invalid pools response format");
        }

        // Calculate lifetime volume and fees
        const { lifetimeVolume, lifetimeFees } = poolsData.data.pools.reduce(
          (
            acc: { lifetimeVolume: number; lifetimeFees: number },
            pool: Pool
          ) => ({
            lifetimeVolume: acc.lifetimeVolume + parseFloat(pool.volumeUSD),
            lifetimeFees: acc.lifetimeFees + parseFloat(pool.feesUSD),
          }),
          { lifetimeVolume: 0, lifetimeFees: 0 }
        );

        // Get pool IDs for fetching daily data
        const poolIds = poolsData.data.pools.map((pool: Pool) => pool.id);

        let dailyVolume = 0;
        // Fetch daily data for all pools
        for (const poolId of poolIds) {
          const dailyResponse = await fetch(indexerTaraswap, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              query: `
              query {
                poolDayDatas(
                  subgraphError: deny,
                  orderBy: id,
                  orderDirection: desc,
                  first: 1,
                  where: {
                    pool: "${poolId.toLowerCase()}"
                  }
                ) {
                  id
                  volumeUSD
                  pool {
                    id
                  }
                }
              }
            `,
            }),
          });

          if (!dailyResponse.ok) {
            throw new Error(`HTTP error! Status: ${dailyResponse.status}`);
          }

          const dailyData = await dailyResponse.json();

          if (!dailyData?.data?.poolDayDatas) {
            throw new Error("Invalid daily data response format");
          }

          const dayVolume = dailyData.data.poolDayDatas.reduce(
            (sum: number, dayData: PoolDayData) =>
              sum + parseFloat(dayData.volumeUSD),
            0
          );

          dailyVolume += dayVolume;
        }

        setResult({
          dailyVolume,
          lifetimeVolume,
          lifetimeFees,
          loading: false,
          error: null,
        });
      } catch (error) {
        console.error("Error fetching protocol volume:", error);
        setResult({
          dailyVolume: 0,
          lifetimeVolume: 0,
          lifetimeFees: 0,
          loading: false,
          error: error as Error,
        });
      }
    };

    fetchProtocolVolume();
  }, []);

  return result;
}
