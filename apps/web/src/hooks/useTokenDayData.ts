import { useState, useEffect } from "react";
import { indexerTaraswap } from "components/Incentives/types";
import { WRAPPED_NATIVE_CURRENCY } from "constants/tokens";
import { ChainId } from "@taraswap/sdk-core";

interface TokenDayData {
  id: string;
  priceUSD: string;
  token: {
    id: string;
  };
}

interface TokenDayDataResult {
  data: TokenDayData[] | null;
  loading: boolean;
  error: Error | null;
}

export function useTokenDayData(tokenAddress?: string): TokenDayDataResult {
  const [result, setResult] = useState<TokenDayDataResult>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const fetchTokenDayData = async () => {
      if (!indexerTaraswap) {
        setResult({
          data: null,
          loading: false,
          error: new Error("GraphQL endpoint not configured"),
        });
        return;
      }

      if (!tokenAddress) {
        setResult({
          data: null,
          loading: false,
          error: new Error("Token address is required"),
        });
        return;
      }

      try {
        const response = await fetch(indexerTaraswap, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: `
              query {
                tokenDayDatas(
                  subgraphError: deny,
                  orderBy: id,
                  orderDirection: desc,
                  first: 2,
                  where: { token: "${
                    tokenAddress.toLowerCase() === "eth"
                      ? WRAPPED_NATIVE_CURRENCY[
                          ChainId.TARAXA
                        ]?.address?.toLowerCase()
                      : tokenAddress.toLowerCase()
                  }" }
                ) {
                  id
                  priceUSD
                  token {
                    id
                  }
                }
              }
            `,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        if (data?.data?.tokenDayDatas) {
          setResult({
            data: data.data.tokenDayDatas,
            loading: false,
            error: null,
          });
        } else {
          throw new Error("Invalid response format");
        }
      } catch (error) {
        setResult({
          data: null,
          loading: false,
          error: error as Error,
        });
      }
    };

    fetchTokenDayData();
  }, [tokenAddress]);

  return result;
}

export function calculatePriceChange(
  data: TokenDayData[] | null
): number | null {
  if (!data || data.length < 2) {
    return null;
  }

  const currentPrice = parseFloat(data[0].priceUSD);
  const previousPrice = parseFloat(data[1].priceUSD);

  if (isNaN(currentPrice) || isNaN(previousPrice) || previousPrice === 0) {
    return null;
  }

  const priceChange = ((currentPrice - previousPrice) / previousPrice) * 100;
  return Number(priceChange.toFixed(2));
}
