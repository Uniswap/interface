import { useState, useCallback } from "react";

type SimulateSwapProp = {
  currencyFrom: string;
  currencyTo: string;
  amountFrom: string | number;
};

export function useSimulateSwap() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const simulateSwap = useCallback(
    async ({ currencyFrom, currencyTo, amountFrom }: SimulateSwapProp) => {
      if (!currencyFrom || !currencyTo || !amountFrom) {
        setError(
          "Invalid input"
        );
        return null;
      }

      setIsLoading(true);
      setError(null);

      try {
        const payload = {
          currencyFrom,
          currencyTo,
          amountFrom,
        };

        const apiUrl = process.env.REACT_APP_TELESWAP_API_URL;
        const apiKey = process.env.REACT_APP_TELESWAP_API_KEY;

        if (!apiUrl || !apiKey) {
          setError(
            "API configuration is missing. Please check your environment variables."
          );
          return null;
        }

        const response = await fetch(`${apiUrl}/simulate`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Teleswap-X-API-Key": apiKey,
          },
          body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok) {
          setError(`${data.error}`);
          return null;
        }

        return data;
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred.");
        console.error("Simulate Swap Error:", err);
      } finally {
        setIsLoading(false);
      }
      return null;
    },
    []
  );

  return { simulateSwap, isLoading, error };
}
