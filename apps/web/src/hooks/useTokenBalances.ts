import { useTokenBalancesQuery } from "graphql/data/apollo/TokenBalancesProvider";
import { supportedChainIdFromGQLChain } from "graphql/data/util";
import { useAccount } from "hooks/useAccount";
import { TokenBalances } from "lib/hooks/useTokenList/sorting";
import { useMemo } from "react";
import { PortfolioTokenBalancePartsFragment } from "uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks";

export function useTokenBalances(): {
  balanceMap: TokenBalances;
  balanceList: readonly (PortfolioTokenBalancePartsFragment | undefined)[];
  loading: boolean;
} {
  const { chainId } = useAccount();
  const { data, loading } = useTokenBalancesQuery();
  return useMemo(() => {
    const balanceList = data?.portfolios?.[0]?.tokenBalances ?? [];
    const balanceMap =
      balanceList?.reduce((balanceMap, tokenBalance) => {
        const address =
          tokenBalance?.token?.standard === "ERC20"
            ? tokenBalance.token?.address?.toLowerCase()
            : tokenBalance?.token?.symbol ?? "ETH";
        if (
          tokenBalance?.token?.chain &&
          supportedChainIdFromGQLChain(tokenBalance.token?.chain) === chainId &&
          address
        ) {
          const usdValue = tokenBalance.denominatedValue?.value ?? 0;
          const balance = tokenBalance.quantity ?? 0;
          balanceMap[address] = { usdValue, balance };
        }
        return balanceMap;
      }, {} as TokenBalances) ?? {};
    return { balanceMap, balanceList, loading };
  }, [chainId, data?.portfolios, loading]);
}
