import { indexerTaraswap } from "components/Incentives/types";
import { TSWAP_TARAXA } from "constants/tokens";
import { useCallback, useEffect, useRef, useState } from "react";
import { useDebounce } from "./useDebounce";

interface UsdPriceResult {
  usdPrice: number | null;
  loading: boolean;
  error: Error | null;
}

// Cache object outside the hook to persist across renders
const priceCache: { [key: string]: { price: number; timestamp: number } } = {};
const CACHE_DURATION = 30000; // 30 seconds cache
const MIN_INTERVAL = 2000; // Minimum 2 seconds between requests

// Track pending requests
const pendingRequests: { [key: string]: Promise<any> } = {};
let lastRequestTime = 0;

export function useTokenUsdPrice(
  tokenAddress: string | undefined
): UsdPriceResult {
  const [result, setResult] = useState<UsdPriceResult>({
    usdPrice: null,
    loading: false,
    error: null,
  });

  const requestTimeoutRef = useRef<NodeJS.Timeout>();
  const debouncedAddress = useDebounce(tokenAddress, 500);

  const fetchPrice = useCallback(async (address: string) => {
    // Check cache first
    const cached = priceCache[address];
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return setResult({ usdPrice: cached.price, loading: false, error: null });
    }

    // Enforce minimum interval between requests
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    if (timeSinceLastRequest < MIN_INTERVAL) {
      const delay = MIN_INTERVAL - timeSinceLastRequest;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    setResult((prev) => ({ ...prev, loading: true }));

    // Check for existing request before creating a new one
    if (address in pendingRequests) {
      try {
        const data = await pendingRequests[address];
        return handleResponse(data);
      } catch (error) {
        handleError(error as Error);
      }
      return;
    }

    // Create new request if none exists
    try {
      pendingRequests[address] = fetch(indexerTaraswap, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `
            query tokens {
              token(id: "${address}") {
                id
                symbol
                derivedETH
              }
              bundle(id: 1){
                ethPriceUSD
              }
            }
          `,
        }),
      }).then((res) => res.json());

      lastRequestTime = Date.now();
      const data = await pendingRequests[address];
      handleResponse(data);
    } catch (error) {
      handleError(error as Error);
    } finally {
      delete pendingRequests[address];
    }
  }, []);

  const handleResponse = useCallback(
    (data: any) => {
      if (data?.data?.token && data?.data?.bundle) {
        const token = data.data.token;
        const ethPriceUSD = data.data.bundle.ethPriceUSD;
        const tokenUsdPrice =
          parseFloat(token.derivedETH) * parseFloat(ethPriceUSD);

        priceCache[debouncedAddress!] = {
          price: tokenUsdPrice,
          timestamp: Date.now(),
        };

        setResult({ usdPrice: tokenUsdPrice, loading: false, error: null });
      } else {
        setResult({
          usdPrice: null,
          loading: false,
          error: new Error("Invalid response"),
        });
      }
    },
    [debouncedAddress]
  );

  const handleError = useCallback((error: Error) => {
    setResult({ usdPrice: null, loading: false, error });
  }, []);

  useEffect(() => {
    if (!debouncedAddress) {
      setResult({ usdPrice: null, loading: false, error: null });
      return;
    }

    // Clear any existing timeout
    if (requestTimeoutRef.current) {
      clearTimeout(requestTimeoutRef.current);
    }

    // Set new timeout for the request
    requestTimeoutRef.current = setTimeout(() => {
      fetchPrice(debouncedAddress);
    }, 100);

    return () => {
      if (requestTimeoutRef.current) {
        clearTimeout(requestTimeoutRef.current);
      }
    };
  }, [debouncedAddress, fetchPrice]);

  return result;
}

export const useTokenEthPrice = async (tokenAddress: string) => {
  if (tokenAddress.toLowerCase() === TSWAP_TARAXA.address.toLowerCase()) {
    return { ethPrice: Number(process.env.REACT_APP_TSWAP_PRICE || 0.008) };
  }
  if (!indexerTaraswap) {
    return { ethPrice: null };
  }
  const response = await fetch(indexerTaraswap, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: `
          query tokens {
            token(id: "${tokenAddress}") {
              id
              symbol
              derivedETH
            }
          }
        `,
    }),
  });
  const data = await response.json();
  if (data && data.data) {
    const token = data.data.token;
    if (token) {
      const tokenEthPrice = token.derivedETH;
      return { ethPrice: tokenEthPrice };
    }
  }
  return { ethPrice: null };
};
