import { ApolloError } from "@apollo/client";
import { createColumnHelper } from "@tanstack/react-table";
import Row from "components/Row";
import { Table } from "components/Table";
import { Cell } from "components/Table/Cell";
import { Filter } from "components/Table/Filter";
import {
  FilterHeaderRow,
  HeaderArrow,
  HeaderSortText,
  StyledExternalLink,
  TimestampCell,
  TokenLinkCell,
} from "components/Table/styled";
import { useChainFromUrlParam } from "constants/chains";
import { useUpdateManualOutage } from "featureFlags/flags/outageBanner";
import {
  BETypeToTransactionType,
  TransactionType,
  useAllTransactions,
} from "graphql/data/useAllTransactions";
import { OrderDirection, getSupportedGraphQlChain } from "graphql/data/util";
import { useActiveLocalCurrency } from "hooks/useActiveLocalCurrency";
import { Trans } from "i18n";
import { useCallback, useEffect, useMemo, useReducer, useState } from "react";
import { ThemedText } from "theme/components";
// import {
//   PoolTransaction,
//   PoolTransactionType,
// } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { shortenAddress } from "utilities/src/addresses";
import { useFormatter } from "utils/formatNumbers";
import { ExplorerDataType, getExplorerLink } from "utils/getExplorerLink";
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
} from "./types";
import { TokenLogoImage } from "../DoubleLogo";
import blankTokenUrl from "assets/svg/blank_token.svg";
import { useV3Positions } from "../../hooks/useV3Positions";
import { useAccount } from "../../hooks/useAccount";
import { Pool } from "@taraswap/v3-sdk";
import { Token } from "@taraswap/sdk-core";
import { useChainId } from "wagmi";
import { PositionDetails } from "../../types/position";
import { position } from "polished";

const LOGO_DEFAULT_SIZE = 30;

const PoolTokenImage = ({
  pool,
}: {
  pool: {
    token0: TokenInfoDetails | undefined;
    token1: TokenInfoDetails | undefined;
  };
}) => {
  console.log("🚀 ~ pool:", pool);
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
  const activeLocalCurrency = useActiveLocalCurrency();
  const account = useAccount();
  const chainId = useChainId();

  const [tokenList, setTokenList] = useState<TokenInfoDetails[]>([]);
  const { formatNumber, formatFiatPrice } = useFormatter();
  const [filterModalIsOpen, toggleFilterModal] = useReducer((s) => !s, false);
  const [filter, setFilters] = useState<TransactionType[]>([
    TransactionType.SWAP,
    TransactionType.BURN,
    TransactionType.MINT,
  ]);
  const chain = getSupportedGraphQlChain(useChainFromUrlParam(), {
    fallbackToEthereum: true,
  });
  const [poolIncentives, setPoolIncentives] = useState<PoolInfo[]>([]);
  const poolsPositions = useV3Positions(account.address);
  const userPositions: {
    poolAddress: string;
    tokenId: string;
    liquidity: string;
  }[] = useMemo(() => {
    return (
      poolsPositions?.positions?.map((position) => {
        const token0 = new Token(chainId, position.token0, 18, "");
        const token1 = new Token(chainId, position.token1, 18, "");
        const poolAddress = Pool.getAddress(token0, token1, position.fee);
        return {
          poolAddress,
          tokenId: position.tokenId.toString(),
          liquidity: position.liquidity.toString(),
        };
      }) || []
    );
  }, [poolsPositions, chainId]);
  // console.log("🚀 ~ Incentives ~ userPositions:", userPositions);

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

  const fetchIncentives = useCallback(async () => {
    if (!indexerTaraswap) {
      return;
    }
    const response = await fetch(indexerTaraswap, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: INCENTIVES_QUERY,
      }),
    });
    const data = await response.json();

    if (data && data.data && data.data.incentives) {
      let poolIncentives: Incentive[] = data.data.incentives.filter(
        (incentive: Incentive) => incentive.ended === false
      );
      const poolInfo: (PoolInfo | null)[] = await Promise.all(
        poolIncentives.map(async (incentive) => {
          const poolDetails = await fetchTokensForPool(incentive.pool);
          if (poolDetails && poolDetails.token0 && poolDetails.token1) {
            console.log("🚀 ~ poolPosition ~ userPositions:", userPositions);

            const poolPosition = userPositions.filter((userPosition) => {
              return userPosition.poolAddress === poolDetails.id;
            });
            console.log("🚀 ~ poolPosition ~ poolPosition:", poolPosition);
            return {
              address: poolDetails.id,
              token0: poolDetails.token0,
              token1: poolDetails.token1,
              feeTier: poolDetails.feeTier,
              tvl: poolDetails.totalValueLockedUSD,
              totalDeposit: poolPosition[0] ? poolPosition[0].liquidity : "0",
              positionId: poolPosition[0] ? poolPosition[0].tokenId : "",
              totalrewards: incentive.reward,
              tokenreward: incentive.rewardToken.symbol,
              link:
                poolPosition[0] && poolPosition[0].tokenId
                  ? `/pool/${poolPosition[0].tokenId}`
                  : `/add/${poolDetails.token0.id}/${poolDetails.token1.id}`,
            } as PoolInfo;
          }
          return null;
        })
      );

      // Filter out null values

      console.log("🚀 ~ fetchIncentives ~ filtered poolInfo:", poolInfo);
      setPoolIncentives(poolInfo.filter((pool) => pool !== null) as PoolInfo[]);
    }
  }, [indexerTaraswap, userPositions]);

  useEffect(() => {
    console.log("Fetching Incentives:", userPositions);
    fetchIncentives();
  }, [fetchIncentives]);

  useEffect(() => {
    fetchCoinDetails();
  }, [fetchCoinDetails]);

  const { transactions, loading, loadMore, errorV2, errorV3 } =
    useAllTransactions(chain.backendChain.chain, filter);
  const combinedError = errorV2 && errorV3 && undefined;
  const allDataStillLoading = loading && !transactions.length;
  console.log("combinedError", combinedError);
  const showLoadingSkeleton = allDataStillLoading || !!combinedError;
  useUpdateManualOutage({ chainId: chain.id, errorV3, errorV2 });
  // TODO(WEB-3236): once GQL BE Transaction query is supported add usd, token0 amount, and token1 amount sort support

  const poolTransactionTableValues: PoolIncentivesTableValues[] | undefined =
    useMemo(
      () =>
        poolIncentives.map((pool) => ({
          ...pool,
          pool: {
            token0: findTokenByAddress(tokenList, pool.token0.id),
            token1: findTokenByAddress(tokenList, pool.token1.id),
          },
          apr1d: 0,
          pendingRewards: 0,
        })),
      [poolIncentives, tokenList]
    );

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
            loading={showLoadingSkeleton}
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
      columnHelper.accessor("apr1d", {
        id: "apr1d",
        header: () => (
          <Cell minWidth={200}>
            <ThemedText.BodySecondary>
              <Trans i18nKey="common.incentives.apr1d" />
            </ThemedText.BodySecondary>
          </Cell>
        ),
        cell: (apr1d) => (
          <Cell loading={showLoadingSkeleton} minWidth={200}>
            <ThemedText.BodySecondary>
              {apr1d.getValue?.()}
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
        cell: (tvl) => (
          <Cell loading={showLoadingSkeleton} minWidth={200}>
            <ThemedText.BodySecondary>
              {tvl.getValue?.()}
            </ThemedText.BodySecondary>
          </Cell>
        ),
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
        cell: (totalrewards) => (
          <Cell loading={showLoadingSkeleton} minWidth={200}>
            <ThemedText.BodySecondary>
              {totalrewards.getValue?.()}
            </ThemedText.BodySecondary>
          </Cell>
        ),
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
          <Cell loading={showLoadingSkeleton} minWidth={200}>
            <ThemedText.BodySecondary>
              {tokenreward.getValue?.()}
            </ThemedText.BodySecondary>
          </Cell>
        ),
      }),
      columnHelper.accessor("totalDeposit", {
        id: "totalDeposit",
        header: () => (
          <Cell minWidth={200}>
            <ThemedText.BodySecondary>
              <Trans i18nKey="common.incentives.total.deposits" />
            </ThemedText.BodySecondary>
          </Cell>
        ),
        cell: (totalDeposit) => (
          <Cell loading={showLoadingSkeleton} minWidth={200}>
            <ThemedText.BodySecondary>
              {totalDeposit.getValue?.()}
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
          <Cell loading={showLoadingSkeleton} minWidth={200}>
            <ThemedText.BodySecondary>
              {pendingRewards.getValue?.()}
            </ThemedText.BodySecondary>
          </Cell>
        ),
      }),
    ];
  }, [showLoadingSkeleton]);

  return (
    <Table
      columns={columns}
      data={poolTransactionTableValues}
      loading={allDataStillLoading}
      error={combinedError}
      loadMore={loadMore}
      maxWidth={1200}
    />
  );
}
