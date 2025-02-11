import { useCallback } from "react";

export const useAwaitingDeposit = () => {
  const getSwapStatus = useCallback(async (swapId: string) => {
    const apiUrl = process.env.REACT_APP_TELESWAP_API_URL;
    const apiKey = process.env.REACT_APP_TELESWAP_API_KEY;

    if (!apiUrl || !apiKey) {
      // setError(
      //   "API configuration is missing. Please check your environment variables."
      // );
      return null;
    }
    try {
      const response = await fetch(`${apiUrl}/swap/${swapId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Teleswap-X-API-Key": apiKey,
        },
      });
      return await response.json();
    } catch (error) {
      return null;
    }
  }, []);
  return { getSwapStatus };
};
