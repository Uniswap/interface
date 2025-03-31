// IncentivesDataProvider.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import { useAccount } from "hooks/useAccount";
import { formatUnits } from "viem/utils";
import { findTokenByAddress, INCENTIVES_QUERY } from "./types";
import { TARAXA_MAINNET_LIST } from "constants/lists";
import useTotalPositions, { PositionsResponse } from "hooks/useTotalPositions";
import { useTokenBalances } from "hooks/useTokenBalances";
import { useTokenList } from "hooks/useTokenList";
import { useMultipleTokenBalances } from "hooks/useMultipleTokenBalances";

interface IncentiveData {
  id: string;
  reward: string;
  rewardToken: {
    id: string;
    symbol: string;
    decimals: number;
  };
  pool: {
    id: string;
    feeTier: number;
    token0: {
      id: string;
      symbol: string;
      name: string;
    };
    token1: {
      id: string;
      symbol: string;
      name: string;
    };
    liquidity: string;
    totalValueLockedUSD: string;
    feesUSD: string;
    volumeUSD: string;
  };
  startTime: string;
  endTime: string;
  vestingPeriod: string;
  refundee: string;
  ended: boolean;
}

interface UserPosition {
  id: string;
  minter: { id: string };
  owner: { id: string };
  pool: {
    id: string;
    feeTier: number;
    incentives: { id: string }[];
  };
  liquidity: string;
  depositedToken0: string;
  depositedToken1: string;
  withdrawnToken0: string;
  withdrawnToken1: string;
  token0: { symbol: string };
  token1: { symbol: string };
  tickLower: { tickIdx: string };
  tickUpper: { tickIdx: string };
}

export interface ProcessedIncentive {
  id: string;
  poolName: string;
  token0Symbol: string;
  token1Symbol: string;
  token0Address: string;
  token1Address: string;
  token0LogoURI: string;
  token1LogoURI: string;
  feeTier: string;
  liquidity: string;
  volume24h: string;
  feesUSD: string;
  apr24h: string;
  hasUserPosition: boolean;
  ended: boolean;
  reward: string;
  rewardSymbol: string;
  poolAddress: string;
  poolId?: number;
  userHasTokensToDeposit: boolean;
}

interface IncentivesContextType {
  activeIncentives: ProcessedIncentive[];
  endedIncentives: ProcessedIncentive[];
  userPositions: UserPosition[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

const IncentivesContext = createContext<IncentivesContextType | null>(null);

interface TokenInfoDetails {
  chainId: number;
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  logoURI: string;
}

export function IncentivesDataProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const account = useAccount();
  const [activeIncentives, setActiveIncentives] = useState<
    ProcessedIncentive[]
  >([]);
  const [endedIncentives, setEndedIncentives] = useState<ProcessedIncentive[]>(
    []
  );
  const [userPositions, setUserPositions] = useState<UserPosition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { getPositionsWithDepositsOfUser } = useTotalPositions();

  const { tokenList, isLoadingTokenList } = useTokenList();

  useEffect(() => {
    if (account.address) {
      fetchData();
    }
  }, [account.address]);

  const tokenAddresses = useMemo(() => {
    const addresses = new Set<string>();
    activeIncentives.forEach((incentive) => {
      addresses.add(incentive.token0Address.toLowerCase());
      addresses.add(incentive.token1Address.toLowerCase());
    });
    return Array.from(addresses);
  }, [activeIncentives]);

  const { balances, isBalancesLoading } =
    useMultipleTokenBalances(tokenAddresses);
  console.log("balances", balances);

  const fetchData = async () => {
    if (!account.address) return;

    try {
      setIsLoading(true);
      setError(null);
      const [positions, incentivesResponse] = await Promise.all([
        getPositionsWithDepositsOfUser(account.address),
        fetch("https://indexer.lswap.app/subgraphs/name/taraxa/uniswap-v3/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: INCENTIVES_QUERY,
            variables: { userAddress: account.address },
          }),
        }),
      ]);

      const incentivesData = await incentivesResponse.json();
      if (incentivesData.errors) {
        throw new Error(incentivesData.errors[0].message);
      }

      // Wait for balances to be loaded
      if (isBalancesLoading) {
        return;
      }

      const incentives = incentivesData.data.incentives.map(
        (inc: IncentiveData) => processIncentive(inc, positions)
      );

      setActiveIncentives(
        incentives.filter((inc: ProcessedIncentive) => !inc.ended)
      );
      setEndedIncentives(
        incentives.filter((inc: ProcessedIncentive) => inc.ended)
      );
      setUserPositions(incentivesData.data.userPositions);
    } catch (error) {
      console.error("Error fetching data:", error);
      setError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const processIncentive = useCallback(
    (
      incentive: IncentiveData,
      userPositions: PositionsResponse[]
    ): ProcessedIncentive => {
      const userPosition = userPositions.find(
        (pos) => pos.pool.id.toLowerCase() === incentive.pool.id.toLowerCase()
      );
      const hasUserPosition = userPosition ? true : false;

      const token0Info = findTokenByAddress(
        tokenList,
        incentive.pool.token0.id
      );
      const token1Info = findTokenByAddress(
        tokenList,
        incentive.pool.token1.id
      );

      const rewardInTokens = parseFloat(
        formatUnits(BigInt(incentive.reward), incentive.rewardToken.decimals)
      );
      const volume24h = parseFloat(incentive.pool.volumeUSD);
      const apr24h =
        volume24h > 0 ? ((rewardInTokens * 365) / volume24h) * 100 : 0;
      const userHasTokensToDeposit =
        balances[incentive.pool.token0.id.toLowerCase()]?.balance > 0 &&
        balances[incentive.pool.token1.id.toLowerCase()]?.balance > 0;
      console.log("balances", balances);
      console.log(
        "balances[incentive.pool.token1.id.toLowerCase()]",
        balances[incentive.pool.token1.id]
      );
      console.log(
        "incentive.pool.token0.id.toLowerCase(",
        incentive.pool.token0.id.toLowerCase()
      );
      console.log(
        "incentive.pool.token1.id.toLowerCase()",
        incentive.pool.token1.id.toLowerCase()
      );
      console.log("userHasTokensToDeposit", userHasTokensToDeposit);

      return {
        id: incentive.id,
        poolId: userPosition?.id,
        poolName: `${incentive.pool.token0.symbol}-${incentive.pool.token1.symbol}`,
        feeTier: `${(incentive.pool.feeTier / 10000).toFixed(2)}%`,
        liquidity: incentive.pool.totalValueLockedUSD,
        volume24h: incentive.pool.volumeUSD,
        apr24h: `${apr24h.toFixed(2)}%`,
        reward: formatUnits(
          BigInt(incentive.reward),
          incentive.rewardToken.decimals
        ),
        rewardSymbol: incentive.rewardToken.symbol,
        hasUserPosition,
        poolAddress: incentive.pool.id,
        token0Symbol: incentive.pool.token0.symbol,
        token1Symbol: incentive.pool.token1.symbol,
        token0Address: incentive.pool.token0.id,
        token1Address: incentive.pool.token1.id,
        token0LogoURI: token0Info?.logoURI || "",
        token1LogoURI: token1Info?.logoURI || "",
        feesUSD: incentive.pool.feesUSD,
        ended: Number(incentive.endTime) < Math.floor(Date.now() / 1000),
        userHasTokensToDeposit,
      };
    },
    [balances, tokenList]
  );

  const value = {
    activeIncentives,
    endedIncentives,
    userPositions,
    isLoading,
    error,
    refetch: fetchData,
  };

  if (isLoadingTokenList || isBalancesLoading) {
    return null;
  }

  return (
    <IncentivesContext.Provider value={value}>
      {children}
    </IncentivesContext.Provider>
  );
}

export function useIncentivesData() {
  const context = useContext(IncentivesContext);
  if (!context) {
    throw new Error(
      "useIncentivesData must be used within an IncentivesDataProvider"
    );
  }
  return context;
}
