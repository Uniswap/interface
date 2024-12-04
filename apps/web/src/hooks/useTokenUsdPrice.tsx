import { indexerTaraswap } from "components/Incentives/types";

export const useTokenUsdPrice = async (tokenAddress: string) => {
  if (!indexerTaraswap) {
    return { usdPrice: null };
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
            bundle(id: 1){
              ethPriceUSD
            }
          }
        `,
    }),
  });
  const data = await response.json();
  if (data && data.data) {
    const token = data.data.token;
    const ethPriceUSD = data.data.bundle.ethPriceUSD;
    if (token && ethPriceUSD) {
      const tokenUsdPrice =
        parseFloat(token.derivedETH) * parseFloat(ethPriceUSD);
      return { usdPrice: tokenUsdPrice };
    }
  }
  return { usdPrice: null };
};
