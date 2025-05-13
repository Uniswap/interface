import { useState, useEffect } from "react";
import { indexerTaraswap } from "components/Incentives/types";

interface Incentive {
  id: string;
}

interface ActiveIncentivesResult {
  count: number;
  loading: boolean;
  error: Error | null;
}

export function useActiveIncentives(): ActiveIncentivesResult {
  const [result, setResult] = useState<ActiveIncentivesResult>({
    count: 0,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const fetchActiveIncentives = async () => {
      if (!indexerTaraswap) {
        setResult({
          count: 0,
          loading: false,
          error: new Error("GraphQL endpoint not configured"),
        });
        return;
      }

      try {
        // Get current timestamp in seconds
        const currentTimestamp = Math.floor(Date.now() / 1000);
        const response = await fetch(indexerTaraswap, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: `
              query activeIncentives {
                incentives(
                  subgraphError: deny,
                  where: { startTime_lte: "${currentTimestamp}", endTime_gte: "${currentTimestamp}" }
                ) {
                  id
                }
              }
            `,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();

        if (!data?.data?.incentives) {
          throw new Error("Invalid response format");
        }

        setResult({
          count: data.data.incentives.length,
          loading: false,
          error: null,
        });
      } catch (error) {
        console.error("Error fetching active incentives:", error);
        setResult({
          count: 0,
          loading: false,
          error: error as Error,
        });
      }
    };

    fetchActiveIncentives();
  }, []);

  return result;
}
