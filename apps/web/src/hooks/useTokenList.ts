import { TARAXA_MAINNET_LIST } from "constants/lists";
import { useState, useCallback, useEffect } from "react";

export interface TokenInfoDetails {
  chainId: number;
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  logoURI: string;
}


interface TaraxaMainnetListResponse {
  tokens: TokenInfoDetails[];
}

export function useTokenList() {
  const [tokenList, setTokenList] = useState<TokenInfoDetails[]>([]);
  const [isLoadingTokenList, setIsLoadingTokenList] = useState(true);

  const fetchTokenList = useCallback(async () => {
    try {
      setIsLoadingTokenList(true);
      const response = await fetch(TARAXA_MAINNET_LIST);

      if (!response.ok) {
        throw new Error(
          `Failed to fetch token list: ${response.status} ${response.statusText}`
        );
      }

      const text = await response.text();
      const data: TaraxaMainnetListResponse = JSON.parse(text);

      if (data && data.tokens) {
        setTokenList(data.tokens);
        return data.tokens;
      }
      return [];
    } catch (error) {
      console.error("Error fetching token list:", error);
      return [];
    } finally {
      setIsLoadingTokenList(false);
    }
  }, []);

  useEffect(() => {
    fetchTokenList();
  }, [fetchTokenList]);

  return { tokenList, isLoadingTokenList };
}
