import { useMemo } from "react";
import { Interface } from "@ethersproject/abi";
import { useMultipleContractSingleData } from "lib/hooks/multicall";
import { CurrencyAmount, Token } from "@taraswap/sdk-core";
import { useAccount } from "hooks/useAccount";
import { isAddress } from "utilities/src/addresses";
import JSBI from "jsbi";

const ERC20Interface = new Interface([
  {
    constant: true,
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: true,
    inputs: [{ name: "_owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "balance", type: "uint256" }],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "symbol",
    outputs: [{ name: "", type: "string" }],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "name",
    outputs: [{ name: "", type: "string" }],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
]);

export function useSingleTokenBalance(
  userAddress?: string,
  tokenAddress?: string
): CurrencyAmount<Token> | undefined {
  const { chainId } = useAccount();

  const validatedTokenAddress = useMemo(() => {
    return isAddress(tokenAddress) ? tokenAddress : undefined;
  }, [tokenAddress]);

  const balance = useMultipleContractSingleData(
    validatedTokenAddress ? [validatedTokenAddress] : [],
    ERC20Interface,
    "balanceOf",
    useMemo(() => [userAddress], [userAddress])
  );

  const symbol = useMultipleContractSingleData(
    validatedTokenAddress ? [validatedTokenAddress] : [],
    ERC20Interface,
    "symbol",
    useMemo(() => [], [])
  );

  const name = useMultipleContractSingleData(
    validatedTokenAddress ? [validatedTokenAddress] : [],
    ERC20Interface,
    "name",
    useMemo(() => [], [])
  );

  const decimals = useMultipleContractSingleData(
    validatedTokenAddress ? [validatedTokenAddress] : [],
    ERC20Interface,
    "decimals",
    useMemo(() => [], [])
  );

  return useMemo(() => {
    if (!userAddress || !validatedTokenAddress || !chainId) {
      return undefined;
    }

    const value = balance?.[0]?.result?.[0];
    const amount = value ? JSBI.BigInt(value.toString()) : undefined;

    if (amount) {
      return CurrencyAmount.fromRawAmount(
        new Token(
          chainId,
          validatedTokenAddress,
          decimals?.[0]?.result?.[0],
          symbol?.[0]?.result?.[0],
          name?.[0]?.result?.[0]
        ),
        amount
      );
    }

    return undefined;
  }, [userAddress, validatedTokenAddress, chainId, balance]);
}
