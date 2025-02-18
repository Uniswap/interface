import { useState, useEffect } from "react";

const useTswapPrice = (indexerTaraswap: string | undefined) => {
  const [tswapPrice, setTswapPrice] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTswapPrice = async () => {
      if (!indexerTaraswap) return;

      try {
        setLoading(true);
        setError(null);

        const response = await fetch(indexerTaraswap, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: `
              query tokens {
                token(id: "0x712037beab9a29216650b8d032b4d9a59af8ad6c") {
                  id
                  symbol
                  derivedETH
                }
                bundle(id: 1) {
                  ethPriceUSD
                }
              }
            `,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        const derivedETH = parseFloat(data?.data?.token?.derivedETH || "0");
        const ethPriceUSD = parseFloat(data?.data?.bundle?.ethPriceUSD || "0");

        setTswapPrice(derivedETH * ethPriceUSD);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchTswapPrice();
  }, [indexerTaraswap]);

  return { tswapPrice, loading, error };
};

export default useTswapPrice;
