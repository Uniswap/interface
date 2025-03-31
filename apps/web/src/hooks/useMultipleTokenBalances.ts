import { useCallback, useMemo, useState, useEffect } from "react";
import { Token } from "@taraswap/sdk-core";
import { useAccount } from "wagmi";
import ERC20ABI from "uniswap/src/abis/erc20.json";
import { getAddress } from "ethers/lib/utils";
import { Interface } from "@ethersproject/abi";
import { useMultipleContractSingleData } from "lib/hooks/multicall";

interface TokenBalance {
  usdValue: number;
  balance: number;
}

const ERC20Interface = new Interface(ERC20ABI);

export function useMultipleTokenBalances(tokenAddresses: string[]): {
  balances: Record<string, { balance: number }>;
  isBalancesLoading: boolean;
} {
  const { address: account, chainId } = useAccount();
  const [isBalancesLoading, setIsBalancesLoading] = useState(false);

  const validTokenAddresses = useMemo(() => {
    if (!account || !tokenAddresses?.length) return [];
    return tokenAddresses;
  }, [account, tokenAddresses]);

  const balanceResults = useMultipleContractSingleData(
    validTokenAddresses,
    ERC20Interface,
    "balanceOf",
    useMemo(() => [account], [account])
  );

  useEffect(() => {
    const isLoading = balanceResults.some((result) => result.loading);
    setIsBalancesLoading(isLoading);
  }, [balanceResults]);

  const balances = useMemo(() => {
    return validTokenAddresses.reduce((acc, address, index) => {
      const balance = balanceResults[index]?.result?.[0]
        ? Number(balanceResults[index]?.result?.[0])
        : 0;

      if (balance > 0) {
        acc[address.toLowerCase()] = { balance };
      }
      return acc;
    }, {} as Record<string, { balance: number }>);
  }, [validTokenAddresses, balanceResults]);

  return {
    balances,
    isBalancesLoading,
  };
}
