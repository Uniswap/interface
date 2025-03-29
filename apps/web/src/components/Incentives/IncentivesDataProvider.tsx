import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { useAccount } from "../../hooks/useAccount";
import { useChainId } from "wagmi";
import { useV3StakerContract } from "../../hooks/useV3StakerContract";
import useTotalPositions, { PositionsResponse } from "hooks/useTotalPositions";
import { ZERO_ADDRESS } from "constants/misc";
import { useV3Positions } from "../../hooks/useV3Positions";
import { formatUnits } from "viem/utils";
import { useLocation } from "react-router-dom";
import {
  TokenInfoDetails,
  Incentive,
  PoolInfo,
  indexerTaraswap,
  INCENTIVES_QUERY,
  POOL_QUERY,
  TaraxaMainnetListResponse,
  findTokenByAddress,
  PoolResponse,
  calculateApy24hrs,
} from "./types";
import { TARAXA_MAINNET_LIST } from "constants/lists";
import { buildIncentiveIdFromIncentive } from "hooks/usePosition";

interface IncentivesDataContextType {
  activeIncentives: Incentive[];
  endedIncentives: Incentive[];
  poolInfoActiveIncentives: PoolInfo[];
  poolInfoEndedIncentives: PoolInfo[];
  userPositions: {
    poolAddress: string;
    poolFeeTier: number;
    tokenId: string;
    liquidity: string;
    depositedToken0: string;
    depositedToken1: string;
    tickLower: string;
    tickUpper: string;
  }[];
  tokenList: TokenInfoDetails[];

  isLoading: boolean;
  isLoadingIncentives: boolean;
  isLoadingPoolInfo: boolean;
  isLoadingPositions: boolean;

  errors: {
    incentivesError: Error | null;
    poolInfoError: Error | null;
    positionsError: Error | null;
  };

  refetchIncentives: () => Promise<void>;
  refetchUserPositions: () => Promise<void>;
}

const IncentivesDataContext = createContext<
  IncentivesDataContextType | undefined
>(undefined);

export const useIncentivesData = () => {
  const context = useContext(IncentivesDataContext);
  if (context === undefined) {
    throw new Error(
      "useIncentivesData must be used within an IncentivesDataProvider"
    );
  }
  return context;
};

export const IncentivesDataProvider: React.FC<React.PropsWithChildren<{}>> = ({
  children,
}) => {
  const account = useAccount();
  const v3StakerContract = useV3StakerContract(true);
  const [tokenList, setTokenList] = useState<TokenInfoDetails[]>([]);
  const [rawIncentivesData, setRawIncentivesData] = useState<Incentive[]>([]);
  const [poolInfoActiveIncentives, setPoolInfoActiveIncentives] = useState<
    PoolInfo[]
  >([]);
  const [poolInfoEndedIncentives, setPoolInfoEndedIncentives] = useState<
    PoolInfo[]
  >([]);
  const [userPositionsGql, setUserPositionsGql] = useState<PositionsResponse[]>(
    []
  );

  const [isLoadingIncentives, setIsLoadingIncentives] = useState(false);
  const [isLoadingPoolInfo, setIsLoadingPoolInfo] = useState(false);
  const [isLoadingTokenList, setIsLoadingTokenList] = useState(false);

  const [incentivesError, setIncentivesError] = useState<Error | null>(null);
  const [poolInfoError, setPoolInfoError] = useState<Error | null>(null);
  const [positionsError, setPositionsError] = useState<Error | null>(null);

  const { positions, loading: positionsLoading } = useV3Positions(
    account.address || ZERO_ADDRESS
  );

  const { getPositionsWithDepositsOfUser, isLoading: isLoadingDepositData } =
    useTotalPositions();

  const activeIncentives = useMemo((): Incentive[] => {
    const filteredIncentives = rawIncentivesData.filter((incentive) => {
      const now = Math.floor(Date.now() / 1000);
      return Number(incentive.endTime) > now;
    });

    const userPositionsPoolIds = userPositionsGql.map(
      (position) => position.pool.id
    );
    return filteredIncentives.sort((a, b) => {
      const aHasPosition = userPositionsPoolIds.includes(a.pool.id);
      const bHasPosition = userPositionsPoolIds.includes(b.pool.id);

      if (aHasPosition && !bHasPosition) return -1;
      if (!aHasPosition && bHasPosition) return 1;
      return 0;
    });
  }, [rawIncentivesData, userPositionsGql]);

  const endedIncentives = useMemo(
    () =>
      rawIncentivesData.filter((incentive) => {
        const now = Math.floor(Date.now() / 1000);
        return Number(incentive.endTime) <= now;
      }),
    [rawIncentivesData]
  );

  const isLoading = useMemo(
    () =>
      isLoadingIncentives ||
      isLoadingPoolInfo ||
      positionsLoading ||
      isLoadingDepositData ||
      isLoadingTokenList,
    [
      isLoadingIncentives,
      isLoadingPoolInfo,
      positionsLoading,
      isLoadingDepositData,
      isLoadingTokenList,
    ]
  );

  const errors = useMemo(
    () => ({
      incentivesError,
      poolInfoError,
      positionsError,
    }),
    [incentivesError, poolInfoError, positionsError]
  );

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

      try {
        const data: TaraxaMainnetListResponse = JSON.parse(text);
        if (data && data.tokens) {
          setTokenList(data.tokens);
          return data.tokens;
        }
        return [];
      } catch (parseError) {
        console.error("Error parsing token list JSON:", parseError);
        throw parseError;
      }
    } catch (error) {
      console.error("Error fetching token list:", error);
      return [];
    } finally {
      setIsLoadingTokenList(false);
    }
  }, []);

  const fetchTokensForPool = async (
    poolId: string
  ): Promise<PoolResponse | null> => {
    if (!indexerTaraswap || !poolId) {
      return null;
    }
    const response = await fetch(indexerTaraswap, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: POOL_QUERY,
        variables: { id: poolId },
      }),
    });
    const data = await response.json();
    if (data && data.data && data.data.pools) {
      return data.data.pools[0];
    }
    return null;
  };

  const fetchIncentivesData = useCallback(async () => {
    if (isLoadingIncentives || !indexerTaraswap || !account.isConnected) {
      return;
    }

    try {
      setIsLoadingIncentives(true);
      setIncentivesError(null);

      const response = await fetch(indexerTaraswap, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: INCENTIVES_QUERY }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const data = await response.json();

      if (data && data.data && data.data.incentives) {
        const activeIncentivesData = data.data.incentives.filter(
          (incentive: Incentive) => incentive.ended === false
        );
        setRawIncentivesData(data.data.incentives);
      } else {
        console.warn("No incentives data found in response", data);
      }
    } catch (error) {
      console.error("Error fetching incentives:", error);
      setIncentivesError(
        error instanceof Error ? error : new Error("Failed to fetch incentives")
      );
    } finally {
      setIsLoadingIncentives(false);
    }
  }, [account.isConnected, isLoadingIncentives, indexerTaraswap]);

  const getUserPositionsGql = useCallback(async () => {
    if (!account || !account.address) return;

    try {
      setPositionsError(null);
      const positions = await getPositionsWithDepositsOfUser(account.address);
      setUserPositionsGql(positions);
    } catch (error) {
      console.error("Error fetching user positions:", error);
      setPositionsError(
        error instanceof Error
          ? error
          : new Error("Failed to fetch user positions")
      );
    }
  }, [getPositionsWithDepositsOfUser, account.address]);

  const processIncentives = useCallback(
    async (incentives: Incentive[], userPositionsParam: any[]) => {
      if (!account.isConnected || incentives.length === 0) {
        return [];
      }

      try {
        setIsLoadingPoolInfo(true);
        setPoolInfoError(null);
        const chunkSize = 5;
        const incentiveChunks = Array(Math.ceil(incentives.length / chunkSize))
          .fill(0)
          .map((_, index) =>
            incentives.slice(index * chunkSize, (index + 1) * chunkSize)
          );

        let allPoolInfo: PoolInfo[] = [];

        for (const chunk of incentiveChunks) {
          const chunkPoolInfo = await Promise.all(
            chunk.map(async (incentive) => {
              try {
                const poolDetails = await fetchTokensForPool(incentive.pool.id);
                let pendingRewards = "0";

                if (
                  !poolDetails ||
                  !poolDetails.token0 ||
                  !poolDetails.token1
                ) {
                  return null;
                }

                const totalPoolLiquidity = parseFloat(
                  poolDetails.totalValueLockedUSD
                );

                const totalRewardsToken = incentive.ended
                  ? "0"
                  : formatUnits(
                      BigInt(incentive.reward),
                      incentive.rewardToken.decimals
                    );

                if (v3StakerContract) {
                  try {
                    const incentiveId =
                      buildIncentiveIdFromIncentive(incentive);

                    const allRewards = await v3StakerContract?.rewards(
                      incentiveId,
                      account.address
                    );
                    pendingRewards = formatUnits(
                      BigInt(allRewards),
                      incentive.rewardToken.decimals
                    );
                  } catch (err) {
                    console.warn(err);
                    pendingRewards = "0";
                  }
                }

                const token0Details = findTokenByAddress(
                  tokenList,
                  poolDetails.token0.id
                );

                const token1Details = findTokenByAddress(
                  tokenList,
                  poolDetails.token1.id
                );

                const rewardTokenDetails = findTokenByAddress(
                  tokenList,
                  incentive.rewardToken.id
                );

                const poolPosition = userPositionsParam.filter(
                  (userPosition) => {
                    return (
                      userPosition.poolAddress.toLowerCase() ===
                        poolDetails.id.toLowerCase() &&
                      userPosition.poolFeeTier === poolDetails.feeTier
                    );
                  }
                );

                const relevantPosition = userPositionsGql.find(
                  (pos) =>
                    pos.pool.id.toLowerCase() ===
                      poolDetails.id.toLowerCase() &&
                    pos.pool.feeTier === poolDetails.feeTier
                );
                const relevantPositions = userPositionsGql.filter((pos) => {
                  return (
                    pos.pool.id.toLowerCase() ===
                      poolDetails.id.toLowerCase() &&
                    pos.pool.feeTier === poolDetails.feeTier
                  );
                });

                let unifiedTokenId = poolPosition[0]
                  ? poolPosition[0].tokenId
                  : relevantPosition?.id;

                const totalDeposit = poolPosition[0]
                  ? poolPosition[0].liquidity
                  : relevantPosition
                  ? relevantPosition.liquidity.toString()
                  : "0";

                const positionId = poolPosition[0]
                  ? poolPosition[0].tokenId
                  : relevantPosition
                  ? relevantPosition.id
                  : "";
                const multipleRelevantPositions = relevantPositions.length > 1;

                const apr24hrs = await calculateApy24hrs(
                  incentive,
                  totalRewardsToken
                );

                const isEligible =
                  (poolPosition[0] && poolPosition[0].tokenId) ||
                  relevantPosition
                    ? true
                    : false;

                return {
                  ...poolDetails,
                  address: poolDetails.id,
                  feeTier: poolDetails.feeTier,
                  tvl: totalPoolLiquidity.toFixed(2),
                  apy: apr24hrs * 365,
                  totalrewards: totalRewardsToken,
                  tokenreward: incentive.rewardToken.symbol,
                  tokenRewardLogoUri: rewardTokenDetails?.logoURI || "",
                  totalDeposit: totalDeposit,
                  depositedToken0: relevantPosition
                    ? relevantPosition.depositedToken0
                    : 0,
                  depositedToken1: relevantPosition
                    ? relevantPosition.depositedToken1
                    : 0,
                  withdrawnToken0: relevantPosition
                    ? relevantPosition.withdrawnToken0
                    : 0,
                  withdrawnToken1: relevantPosition
                    ? relevantPosition.withdrawnToken1
                    : 0,
                  incentiveId: incentive.id,
                  positionId: positionId,
                  eligible: isEligible,
                  tickLower: poolPosition[0]
                    ? poolPosition[0].tickLower.tickIdx.toString()
                    : "0",
                  tickUpper: poolPosition[0]
                    ? poolPosition[0].tickUpper.tickIdx.toString()
                    : "0",
                  displayedTotalDeposit: relevantPosition
                    ? `${parseFloat(
                        relevantPosition.depositedToken0 ?? "0"
                      ).toFixed(4)} ${token0Details?.symbol} + ${parseFloat(
                        relevantPosition.depositedToken1 ?? "0"
                      ).toFixed(4)} ${token1Details?.symbol}`
                    : "-",
                  pendingRewards,
                  pool: {
                    token0: token0Details,
                    token1: token1Details,
                  },
                  link: multipleRelevantPositions
                    ? undefined
                    : (poolPosition[0] && poolPosition[0].tokenId) ||
                      relevantPosition
                    ? `/pool/${unifiedTokenId}?incentive=${incentive.id}`
                    : `/add/${poolDetails.token0.id}/${poolDetails.token1.id}`,
                  hasMultipleRelevantPositions: multipleRelevantPositions,
                  userPositions: relevantPositions,
                };
              } catch (error) {
                console.error("Error processing incentive:", error);
                return null;
              }
            })
          );

          allPoolInfo = [
            ...allPoolInfo,
            ...(chunkPoolInfo.filter(Boolean) as PoolInfo[]),
          ];
        }
        const uniquePools = [
          ...new Set(
            allPoolInfo.filter(Boolean).map((pool) => {
              const key = pool.id.toLowerCase();
              return allPoolInfo.find((p) => p.id.toLowerCase() === key);
            })
          ),
        ];

        return uniquePools;
      } catch (error) {
        console.error("Error processing incentives:", error);
        setPoolInfoError(
          error instanceof Error
            ? error
            : new Error("Failed to process incentives")
        );
        return [];
      } finally {
        setIsLoadingPoolInfo(false);
      }
    },
    [
      account.isConnected,
      v3StakerContract,
      tokenList,
      fetchTokensForPool,
      userPositionsGql,
    ]
  );

  const lastValidPositionsRef = useRef<
    IncentivesDataContextType["userPositions"]
  >([]);

  const userPositions = useMemo(() => {
    if (
      isLoadingDepositData ||
      !userPositionsGql ||
      userPositionsGql.length === 0
    ) {
      return lastValidPositionsRef.current;
    }

    const mappedPositions = userPositionsGql.map((position) => ({
      poolAddress: position.pool.id,
      poolFeeTier: position.pool.feeTier,
      tokenId: position.id.toString(),
      liquidity: position.liquidity.toString(),
      depositedToken0: (
        parseFloat(position.depositedToken0) -
        parseFloat(position.withdrawnToken0)
      ).toFixed(4),
      depositedToken1: (
        parseFloat(position.depositedToken1) -
        parseFloat(position.withdrawnToken1)
      ).toFixed(4),
      tickLower: position.tickLower.tickIdx.toString(),
      tickUpper: position.tickUpper.tickIdx.toString(),
    }));

    lastValidPositionsRef.current = mappedPositions;
    return mappedPositions;
  }, [userPositionsGql, isLoadingDepositData]);

  useEffect(() => {
    fetchTokenList();
  }, [fetchTokenList]);

  useEffect(() => {
    let isMounted = true;

    if (account.isConnected && isMounted) {
      if (!isLoadingIncentives) {
        fetchIncentivesData();
      }
      if (!isLoadingDepositData) {
        getUserPositionsGql();
      }
    }

    return () => {
      isMounted = false;
    };
  }, [account.isConnected]);

  useEffect(() => {
    if (!rawIncentivesData.length) {
      return;
    }

    if (isLoadingPoolInfo) {
      return;
    }

    if (poolInfoEndedIncentives.length > 0) {
      return;
    }

    if (userPositionsGql.length > 0 && userPositions.length === 0) {
      return;
    }
    const processAllIncentives = async () => {
      setIsLoadingPoolInfo(true);

      try {
        const currentUserPositions = [...userPositions];

        if (activeIncentives.length > 0) {
          const activePoolInfo = await processIncentives(
            activeIncentives,
            currentUserPositions
          );

          const sortedActivePoolInfo = [...activePoolInfo]
            .filter((pool): pool is PoolInfo => pool !== undefined)
            .sort((a, b) => {
              if (a.eligible !== b.eligible) {
                return a.eligible ? -1 : 1;
              }
              return b.apy - a.apy;
            });

          setPoolInfoActiveIncentives(sortedActivePoolInfo);
        }

        if (poolInfoEndedIncentives.length === 0) {
          const endedPoolInfo = await processIncentives(
            endedIncentives,
            currentUserPositions
          );

          const sortedEndedPoolInfo = [...endedPoolInfo]
            .filter((pool): pool is PoolInfo => pool !== undefined)
            .sort((a, b) => {
              return a.eligible === b.eligible ? 0 : a.eligible ? -1 : 1;
            });

          setPoolInfoEndedIncentives(sortedEndedPoolInfo);
        }
      } catch (error) {
        console.error("Error processing incentives:", error);
        setPoolInfoError(
          error instanceof Error
            ? error
            : new Error("Failed to process incentives")
        );
      } finally {
        setIsLoadingPoolInfo(false);
      }
    };

    processAllIncentives();
  }, [
    rawIncentivesData,
    userPositions,
    userPositionsGql.length,
    activeIncentives.length,
    endedIncentives.length,
    isLoadingPoolInfo,
    poolInfoEndedIncentives.length,
  ]);

  const refetchIncentives = useCallback(async () => {
    await fetchIncentivesData();
  }, [fetchIncentivesData]);

  const refetchUserPositions = useCallback(async () => {
    await getUserPositionsGql();
  }, [getUserPositionsGql]);

  const value = {
    activeIncentives,
    endedIncentives,
    poolInfoActiveIncentives,
    poolInfoEndedIncentives,
    userPositions,
    tokenList,
    isLoading,
    isLoadingIncentives,
    isLoadingPoolInfo,
    isLoadingPositions: positionsLoading || isLoadingDepositData,
    errors,
    refetchIncentives,
    refetchUserPositions,
  };

  return (
    <IncentivesDataContext.Provider value={value}>
      {children}
    </IncentivesDataContext.Provider>
  );
};
