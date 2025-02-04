import { useState, useCallback } from "react";

type ExecuteCrossChainSwapProp = {
  currencyFrom: string;
  currencyTo: string;
  amountFrom: string | number;
  amountTo: string | number;
  recipient: string;
};

export function useExecuteCrossChainSwap() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchIpAddress = useCallback(async () => {
    const defaultIpAddress = "127.0.0.1"
    try {
      const response = await fetch("https://api.ipify.org?format=json");
      const data = await response.json();
      return data.ip || defaultIpAddress;
    } catch (error) {
      console.error("Failed to fetch IP address:", error);
      return defaultIpAddress;
    }
  }, []);

  const executeCrossChainSwap = useCallback(
    async ({
      currencyFrom,
      currencyTo,
      amountFrom,
      amountTo,
      recipient,
    }: ExecuteCrossChainSwapProp) => {
      if (
        !currencyFrom ||
        !currencyTo ||
        !amountFrom ||
        !amountTo ||
        !recipient
      ) {
        setError(
          "Invalid input"
        );
        return null;
      }

      setIsLoading(true);
      setError(null);
      try {
        const userIpAddress = await fetchIpAddress();
        const userId = userIpAddress.split('.').reduce((acc: any, octet: any) => (acc << 8) + parseInt(octet, 10), 0);
        const payload = {
          currencyFrom,
          currencyTo,
          currencyFromAmount: amountFrom, //Amount the user will send
          currencyToAmount: amountTo, //Amout the user will receive
          addressTo: recipient, //Address that will receive the desired tokens
          userAgent: navigator.userAgent,
          siteLanguage: navigator.language,
          acceptLanguage: navigator.languages?.join(","),
          deviceTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          deviceOperatingSystem: /Mac/.test(navigator.platform)
            ? "macOS"
            : /Win/.test(navigator.platform)
              ? "Windows"
              : "Unknown OS",
          userIpAddress: userIpAddress,
          userId: userId,
        };

        console.log(
          "----------------------- payload ------------------------",
          payload
        );

        const apiUrl = process.env.REACT_APP_TELESWAP_API_URL;
        const apiKey = process.env.REACT_APP_TELESWAP_API_KEY;

        if (!apiUrl || !apiKey) {
          setError(
            "API configuration is missing. Please check your environment variables."
          );
          return null;
        }

        const response = await fetch(`${apiUrl}/swap`, {
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
        console.error("Execute cross-chain Swap Error:", err);
      } finally {
        setIsLoading(false);
      }
      return null;
    },
    []
  );

  return { executeCrossChainSwap, isLoading, error };
}
