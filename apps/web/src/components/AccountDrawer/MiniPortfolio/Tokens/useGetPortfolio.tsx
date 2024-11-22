import { Currency, Token } from "@taraswap/sdk-core";
import { NATIVE_CHAIN_ID, nativeOnChain } from "constants/tokens";
import { BigNumber } from "ethers";
import { supportedChainIdFromGQLChain } from "graphql/data/util";
import { useState, useEffect, useCallback } from "react";
import { Chain } from "uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks";
import { parseEther } from "viem";

export interface TokenInputData {
  address: string;
  circulating_market_cap?: number | null;
  decimals: string;
  exchange_rate: number | null;
  holders?: string;
  icon_url?: string | null;
  name: string;
  symbol: string;
  total_supply?: string;
  type?: string;
  volume_24h?: number | null;
}

export interface AddressData {
  block_number_balance_updated_at: number;
  coin_balance: string;
  creation_transaction_hash: string | null;
  creation_tx_hash: string | null;
  creator_address_hash: string | null;
  ens_domain_name: string | null;
  exchange_rate: string;
  has_beacon_chain_withdrawals: boolean;
  has_decompiled_code: boolean;
  has_logs: boolean;
  has_token_transfers: boolean;
  has_tokens: boolean;
  has_validated_blocks: boolean;
  hash: string;
  implementations: any[]; // Assuming implementations is an array of any type
  is_contract: boolean;
  is_scam: boolean;
  is_verified: boolean;
  metadata: any | null; // Assuming metadata can be of any type or null
  name: string | null;
  private_tags: any[]; // Assuming private_tags is an array of any type
  proxy_type: any | null; // Assuming proxy_type can be of any type or null
  public_tags: any[]; // Assuming public_tags is an array of any type
  token: any | null; // Assuming token can be of any type or null
  watchlist_address_id: any | null; // Assuming watchlist_address_id can be of any type or null
  watchlist_names: any[]; // Assuming watchlist_names is an array of any type
}

export interface NativeBalance {
  block_number_balance_updated_at: number;
  coin_balance: bigint;
  exchange_rate: number;
}

export interface TokenData {
  token: TokenInputData;
  token_id: string | null;
  token_instance: string | null;
  value: string;
}

const useGetPortfolio = (
  baseEndpoint: string = "https://tara.to/api/v2/addresses",
  address?: string
) => {
  const [tokens, setTokens] = useState<TokenData[]>([]);
  const [nativeBalance, setNativeBalance] = useState<NativeBalance>({
    block_number_balance_updated_at: 0,
    coin_balance: BigInt("0"),
    exchange_rate: 0,
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTokens = useCallback(async () => {
    if (!address) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${baseEndpoint}/${address}/token-balances`);
      if (!response.ok) {
        throw new Error(`Failed to fetch tokens: ${response.statusText}`);
      }
      const data: TokenData[] = await response.json();
      setTokens(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [baseEndpoint, address]);

  const fetchNativeTokens = useCallback(async () => {
    if (!address) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${baseEndpoint}/${address}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch tokens: ${response.statusText}`);
      }
      const jsonData = await response.json();
      const data: NativeBalance = {
        ...jsonData,
        coin_balance: BigInt(jsonData.coin_balance),
      };
      setNativeBalance(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [baseEndpoint, address]);

  useEffect(() => {
    fetchTokens();
  }, [fetchTokens]);

  useEffect(() => {
    fetchNativeTokens();
  }, [fetchNativeTokens]);

  return { tokens, nativeBalance, loading, error };
};

export const addNativeTokenToArrayStart = (
  tokens: TokenData[],
  nativeCurrency: NativeBalance
): TokenData[] => {
  const nativeToken: TokenData = {
    token: {
      address: NATIVE_CHAIN_ID,
      decimals: "18",
      symbol: "TARA",
      name: "TARA",
      exchange_rate: nativeCurrency.exchange_rate,
    },
    token_id: "NATIVE",
    token_instance: null,
    value: nativeCurrency.coin_balance.toString(),
  };
  return [nativeToken, ...tokens];
};

export const splitHiddenTokens = (
  tokens: TokenData[],
  hideSmallBalances: boolean
) => {
  const visibleTokens: TokenData[] = [];
  const hiddenTokens: TokenData[] = [];

  tokens.forEach((token) => {
    const valueInEth = parseEther("1");
    const tokenBalance = BigInt(token.value);
    if (token.token_id === "NATIVE") {
      visibleTokens.unshift(token);
    } else if (hideSmallBalances && tokenBalance < valueInEth) {
      hiddenTokens.push(token);
    } else {
      visibleTokens.push(token);
    }
  });

  return { visibleTokens, hiddenTokens };
};

export function tokenToCurrency(token: TokenData): Currency | undefined {
  const chainId = supportedChainIdFromGQLChain(Chain.Taraxa);
  if (!chainId) {
    return undefined;
  }
  if (token.token.address === NATIVE_CHAIN_ID || !token.token.address) {
    return nativeOnChain(chainId);
  } else {
    return new Token(
      chainId,
      token.token.address,
      Number(token.token.decimals ?? 18),
      token.token.symbol,
      token.token.name
    );
  }
}

export default useGetPortfolio;
