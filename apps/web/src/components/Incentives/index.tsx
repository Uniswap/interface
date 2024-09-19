import { createColumnHelper } from "@tanstack/react-table";
import Row from "components/Row";
import { Table } from "components/Table";
import { Cell } from "components/Table/Cell";
import { Trans } from "i18n";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ThemedText } from "theme/components";
import { TARAXA_MAINNET_LIST } from "../../constants/lists";
import {
  TokenInfoDetails,
  PoolInfo,
  Incentive,
  indexerTaraswap,
  indexerLara,
  INCENTIVES_QUERY,
  POOL_QUERY,
  PoolIncentivesTableValues,
  TaraxaMainnetListResponse,
  findTokenByAddress,
  PoolResponse,
  calculateApy,
} from "./types";
import { TokenLogoImage } from "../DoubleLogo";
import blankTokenUrl from "assets/svg/blank_token.svg";
import { useV3Positions } from "../../hooks/useV3Positions";
import { useAccount } from "../../hooks/useAccount";
import { FeeAmount, Pool, Position } from "@taraswap/v3-sdk";
import { Token } from "@taraswap/sdk-core";
import { useChainId } from "wagmi";
import { formatUnits } from "viem/utils";

const LOGO_DEFAULT_SIZE = 30;

const PoolTokenImage = ({
  pool,
}: {
  pool: {
    token0: TokenInfoDetails | undefined;
    token1: TokenInfoDetails | undefined;
  };
}) => {
  return (
    <Row gap="4px">
      {pool.token0?.logoURI && (
        <TokenLogoImage
          size={LOGO_DEFAULT_SIZE}
          src={pool.token0?.logoURI ?? blankTokenUrl}
        />
      )}
      {pool.token1?.logoURI && (
        <TokenLogoImage
          size={LOGO_DEFAULT_SIZE}
          src={pool.token1?.logoURI ?? blankTokenUrl}
        />
      )}
      {pool.token0?.symbol}-{pool.token1?.symbol}
    </Row>
  );
};

export default function Incentives() {
  const account = useAccount();
  const chainId = useChainId();
  const [tokenList, setTokenList] = useState<TokenInfoDetails[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [rawIncentivesData, setRawIncentivesData] = useState<Incentive[]>([]);
  const [poolTransactionTableValues, setPoolTransactionTableValues] = useState<
    PoolIncentivesTableValues[]
  >([]);
  const { positions, loading: positionsLoading } = useV3Positions(
    account.address
  );
  const positionsKey = positions
    ?.map((pos) => pos.tokenId)
    .sort()
    .join("-");

  const userPositions = useMemo(() => {
    if (positionsLoading || !positions || positions.length === 0) return [];
    return positions?.map((position) => {
      const token0 = new Token(chainId, position.token0, 18, "");
      const token1 = new Token(chainId, position.token1, 18, "");
      const poolAddress = Pool.getAddress(token0, token1, position.fee);
      return {
        poolAddress,
        tokenId: position.tokenId.toString(),
        liquidity: position.liquidity.toString(),
        tickLower: position.tickLower.toString(),
        tickUpper: position.tickUpper.toString(),
      };
    });
  }, [positionsLoading, positionsKey, chainId]);

  const fetchCoinDetails = useCallback(async () => {
    const response = await fetch(TARAXA_MAINNET_LIST);
    const data: TaraxaMainnetListResponse =
      (await response.json()) as TaraxaMainnetListResponse;
    if (data && data.tokens) {
      setTokenList(data.tokens);
    }
  }, []);

  const fetchTokensForPool = async (
    poolId: string
  ): Promise<PoolResponse | null> => {
    if (!indexerLara || !poolId) {
      return null;
    }
    const response = await fetch(indexerLara, {
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
    if (!indexerTaraswap) {
      return;
    }
    const response = await fetch(indexerTaraswap, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: INCENTIVES_QUERY }),
    });
    const data = await response.json();
    if (data && data.data && data.data.incentives) {
      let incentivesData: Incentive[] = data.data.incentives.filter(
        (incentive: Incentive) => incentive.ended === false
      );
      setRawIncentivesData(incentivesData);
    }
  }, [indexerTaraswap]);

  useEffect(() => {
    fetchIncentivesData();
  }, []);

  const processIncentives = useCallback(
    async (
      userPositionsParam: {
        poolAddress: string;
        tokenId: string;
        liquidity: string;
        tickLower: string;
        tickUpper: string;
      }[]
    ) => {
      setIsLoading(true);

      const poolInfo = await Promise.all(
        rawIncentivesData.map(async (incentive) => {
          const poolDetails = await fetchTokensForPool(incentive.pool);

          if (poolDetails && poolDetails.token0 && poolDetails.token1) {
            // Extract necessary data
            const totalPoolLiquidity = parseFloat(poolDetails.liquidity);
            // Format the value reward
            const totalRewardsToken = formatUnits(
              BigInt(incentive.reward),
              incentive.rewardToken.decimals
            );

            const annualRewardPerStandardLiquidity = calculateApy(
              incentive,
              totalPoolLiquidity,
              totalRewardsToken
            );

            const poolPosition = userPositionsParam.filter((userPosition) => {
              return (
                userPosition.poolAddress.toLowerCase() ===
                poolDetails.id.toLowerCase()
              );
            });

            return {
              ...poolDetails,
              address: poolDetails.id,
              token0: poolDetails.token0,
              token1: poolDetails.token1,
              feeTier: poolDetails.feeTier,
              tvl: poolDetails.totalValueLockedUSD,
              totalDeposit: poolPosition[0] ? poolPosition[0].liquidity : "0",
              positionId: poolPosition[0] ? poolPosition[0].tokenId : "",
              totalrewards: totalRewardsToken,
              tokenreward: incentive.rewardToken.symbol,
              tickLower: poolPosition[0] ? poolPosition[0].tickLower : "0",
              tickUpper: poolPosition[0] ? poolPosition[0].tickUpper : "0",
              apy: annualRewardPerStandardLiquidity,
              link:
                poolPosition[0] && poolPosition[0].tokenId
                  ? `/pool/${poolPosition[0].tokenId}`
                  : `/add/${poolDetails.token0.id}/${poolDetails.token1.id}`,
            } as unknown as PoolInfo;
          }
          return null;
        })
      );
      setIsLoading(false);
      let filteredData = poolInfo.filter((pool) => pool !== null) as PoolInfo[];
      return filteredData;
    },
    [rawIncentivesData]
  );

  useEffect(() => {
    if (
      rawIncentivesData &&
      rawIncentivesData.length > 0 &&
      tokenList?.length > 0
    ) {
      processIncentives(userPositions).then((data) => {
        if (data) {
          let displayedTotalDeposit: string = "";
          setPoolTransactionTableValues(
            data.map((pool) => {
              const token0 = findTokenByAddress(tokenList, pool.token0.id);
              const token1 = findTokenByAddress(tokenList, pool.token1.id);
              const feeTier: FeeAmount = Number(pool.feeTier) as FeeAmount;
              if (token0 && token1) {
                const tokenA = new Token(
                  chainId,
                  token0.address,
                  token0.decimals,
                  token0.symbol
                );
                const tokenB = new Token(
                  chainId,
                  token1.address,
                  token1.decimals,
                  token1.symbol
                );
                const poolInstance = new Pool(
                  tokenA,
                  tokenB,
                  feeTier,
                  pool.sqrtPrice,
                  pool.liquidity,
                  Number(pool.tick)
                );
                const position = new Position({
                  pool: poolInstance,
                  liquidity: pool.totalDeposit,
                  tickLower: Number(pool.tickLower),
                  tickUpper: Number(pool.tickUpper),
                });
                const amount0 = position.amount0.toSignificant(6);
                const amount1 = position.amount1.toSignificant(6);

                displayedTotalDeposit = `${amount0} ${token0.symbol} + ${amount1} ${token1.symbol}`;
              }

              return {
                ...pool,
                pool: {
                  token0: findTokenByAddress(tokenList, pool.token0.id),
                  token1: findTokenByAddress(tokenList, pool.token1.id),
                },
                displayedTotalDeposit,
                pendingRewards: 0,
              };
            })
          );
        }
      });
    }
  }, [rawIncentivesData, tokenList]);

  useEffect(() => {
    fetchCoinDetails();
  }, [fetchCoinDetails]);

  const columns = useMemo(() => {
    const columnHelper = createColumnHelper<PoolIncentivesTableValues>();
    return [
      columnHelper.accessor("pool", {
        id: "pool",
        header: () => (
          <Cell minWidth={200} justifyContent="flex-start" grow>
            <Row gap="4px">
              <ThemedText.BodySecondary>
                <Trans i18nKey="common.incentives.pool.fee" />
              </ThemedText.BodySecondary>
            </Row>
          </Cell>
        ),
        cell: (pool) => (
          <Cell
            loading={isLoading}
            minWidth={200}
            justifyContent="flex-start"
            grow
          >
            <ThemedText.BodySecondary>
              <PoolTokenImage pool={pool.getValue?.()} />
            </ThemedText.BodySecondary>
          </Cell>
        ),
      }),
      columnHelper.accessor("apy", {
        id: "apy",
        header: () => (
          <Cell minWidth={200}>
            <ThemedText.BodySecondary>
              <Trans i18nKey="common.incentives.apr1d" />
            </ThemedText.BodySecondary>
          </Cell>
        ),
        cell: (apy) => (
          <Cell loading={isLoading} minWidth={200}>
            <ThemedText.BodySecondary>
              {apy.getValue?.()}
            </ThemedText.BodySecondary>
          </Cell>
        ),
      }),
      columnHelper.accessor("tvl", {
        id: "tvl",
        header: () => (
          <Cell minWidth={200}>
            <ThemedText.BodySecondary>
              <Trans i18nKey="common.incentives.pool.tvl" />
            </ThemedText.BodySecondary>
          </Cell>
        ),
        cell: (tvl) => {
          // Get the raw value
          const tvlValue = tvl.getValue?.();

          // Safeguard against undefined values
          if (!tvlValue) {
            return null;
          }

          // Parse and format the value
          const tvlNumber = parseFloat(tvlValue);
          const tvlFormatted = tvlNumber.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          });

          return (
            <Cell loading={isLoading} minWidth={200}>
              <ThemedText.BodySecondary>
                {tvlFormatted}
              </ThemedText.BodySecondary>
            </Cell>
          );
        },
      }),
      columnHelper.accessor("totalrewards", {
        id: "totalrewards",
        header: () => (
          <Cell minWidth={200}>
            <ThemedText.BodySecondary>
              <Trans i18nKey="common.incentives.total.program.rewards" />
            </ThemedText.BodySecondary>
          </Cell>
        ),
        cell: (totalrewards) => {
          // Get the raw value
          const totalrewardsValue = totalrewards.getValue?.();

          // Safeguard against undefined values
          if (!totalrewardsValue) {
            return null;
          }

          const totalrewardsFormatted = Number(
            totalrewardsValue
          ).toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          });

          return (
            <Cell loading={isLoading} minWidth={200}>
              <ThemedText.BodySecondary>
                {totalrewardsFormatted}
              </ThemedText.BodySecondary>
            </Cell>
          );
        },
      }),
      columnHelper.accessor("tokenreward", {
        id: "tokenreward",
        header: () => (
          <Cell minWidth={200}>
            <ThemedText.BodySecondary>
              <Trans i18nKey="common.incentives.token.reward" />
            </ThemedText.BodySecondary>
          </Cell>
        ),
        cell: (tokenreward) => (
          <Cell loading={isLoading} minWidth={200}>
            <ThemedText.BodySecondary>
              {tokenreward.getValue?.()}
            </ThemedText.BodySecondary>
          </Cell>
        ),
      }),
      columnHelper.accessor("displayedTotalDeposit", {
        id: "displayedTotalDeposit",
        header: () => (
          <Cell minWidth={200}>
            <ThemedText.BodySecondary>
              <Trans i18nKey="common.incentives.total.deposits" />
            </ThemedText.BodySecondary>
          </Cell>
        ),
        cell: (displayedTotalDeposit) => (
          <Cell loading={isLoading} minWidth={200}>
            <ThemedText.BodySecondary>
              {displayedTotalDeposit.getValue?.()}
            </ThemedText.BodySecondary>
          </Cell>
        ),
      }),
      columnHelper.accessor("pendingRewards", {
        id: "pendingRewards",
        header: () => (
          <Cell minWidth={200}>
            <ThemedText.BodySecondary>
              <Trans i18nKey="common.incentives.pending.reward" />
            </ThemedText.BodySecondary>
          </Cell>
        ),
        cell: (pendingRewards) => (
          <Cell loading={isLoading} minWidth={200}>
            <ThemedText.BodySecondary>
              {pendingRewards.getValue?.()}
            </ThemedText.BodySecondary>
          </Cell>
        ),
      }),
    ];
  }, [isLoading]);

  return (
    <Table
      columns={columns}
      data={poolTransactionTableValues}
      loading={isLoading}
      maxWidth={1200}
    />
  );
}
