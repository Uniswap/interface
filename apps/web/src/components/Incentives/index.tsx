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
  INCENTIVES_QUERY,
  POOL_QUERY,
  TaraxaMainnetListResponse,
  findTokenByAddress,
  PoolResponse,
  calculateApy,
  calculateApy24hrs,
} from "./types";
import { TokenLogoImage } from "../DoubleLogo";
import blankTokenUrl from "assets/svg/blank_token.svg";
import { useV3Positions } from "../../hooks/useV3Positions";
import { useAccount } from "../../hooks/useAccount";
import { useChainId } from "wagmi";
import { formatUnits } from "viem/utils";
import { MouseoverTooltip } from "components/Tooltip";
import styled from "styled-components";
import { Info, Star, Sun } from "react-feather";
import { useV3StakerContract } from "../../hooks/useV3StakerContract";
import useTotalPositions, { PositionsResponse } from "hooks/useTotalPositions";
import { ZERO_ADDRESS } from "constants/misc";
import { LightCard } from "components/Card";
import { buildIncentiveIdFromIncentive, RewardInfo } from "hooks/usePosition";
import ChoosePositionModal, { SaveButton } from "./ChoosePositionModal";
import { useLocation, useNavigate } from "react-router-dom";

const LOGO_DEFAULT_SIZE = 30;

const StyledInfoIcon = styled(Info)`
  height: 12px;
  width: 12px;
  flex: 1 1 auto;
  stroke: ${({ theme }) => theme.neutral2};
`;

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
      {pool.token0?.symbol}/{pool.token1?.symbol}
    </Row>
  );
};

export default function Incentives() {
  const account = useAccount();
  const chainId = useChainId();
  const v3StakerContract = useV3StakerContract(true);
  const [tokenList, setTokenList] = useState<TokenInfoDetails[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showPositionsModal, setShowPositionsModal] = useState(false);
  const [rawIncentivesData, setRawIncentivesData] = useState<Incentive[]>([]);
  const [poolTransactionTableValues, setPoolTransactionTableValues] = useState<
    PoolInfo[]
  >([]);
  const [userPositionsGql, setUserPositionsGql] = useState<PositionsResponse[]>(
    []
  );
  const { positions, loading: positionsLoading } = useV3Positions(
    account.address || ZERO_ADDRESS
  );
  const { getPositionsWithDepositsOfUser, isLoading: isLoadingDepositData } =
    useTotalPositions();

  const positionsKey = positions
    ?.map((pos) => pos.tokenId)
    .sort()
    .join("-");

  const location = useLocation();

  const getUserPositionsGql = useCallback(async () => {
    if (!account || !account.address) return;

    const positions = await getPositionsWithDepositsOfUser(account.address);
    setUserPositionsGql(positions);
  }, [getPositionsWithDepositsOfUser, account.address]);

  useEffect(() => {
    if (account.isConnected) {
      getUserPositionsGql();
    }
  }, [account.isConnected, location]);

  const userPositions = useMemo(() => {
    if (
      isLoadingDepositData ||
      !userPositionsGql ||
      userPositionsGql.length == 0
    )
      return [];
    return userPositionsGql.map((position) => {
      return {
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
        tickLower: position.tickLower.toString(),
        tickUpper: position.tickUpper.toString(),
      };
    });
  }, [
    positionsLoading,
    isLoadingDepositData,
    userPositionsGql,
    positionsKey,
    chainId,
  ]);

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
    if (account.isConnected) {
      fetchIncentivesData();
    }
  }, [account.isConnected]);

  const processIncentives = useCallback(
    async (
      userPositionsParam: {
        poolAddress: string;
        poolFeeTier: number;
        tokenId: string;
        depositedToken0: string;
        depositedToken1: string;
        liquidity: string;
        tickLower: string;
        tickUpper: string;
      }[]
    ) => {
      if (!account.isConnected) {
        return [];
      }
      setIsLoading(true);

      const poolInfo = await Promise.all(
        rawIncentivesData.map(async (incentive) => {
          const poolDetails = await fetchTokensForPool(incentive.pool.id);
          let pendingRewards = "0";
          if (poolDetails && poolDetails.token0 && poolDetails.token1) {
            // Extract necessary data
            const totalPoolLiquidity = parseFloat(
              poolDetails.totalValueLockedUSD
            );
            // Format the value reward
            const totalRewardsToken = formatUnits(
              BigInt(incentive.reward),
              incentive.rewardToken.decimals
            );
            if (v3StakerContract) {
              const allRewards = await v3StakerContract?.rewards(
                incentive.rewardToken.id,
                account.address
              );
              pendingRewards = formatUnits(
                BigInt(allRewards),
                incentive.rewardToken.decimals
              );
            }

            const apr24hrs = await calculateApy24hrs(
              incentive,
              totalPoolLiquidity,
              totalRewardsToken
            );

            const poolPosition = userPositionsParam.filter((userPosition) => {
              return (
                userPosition.poolAddress.toLowerCase() ===
                  poolDetails.id.toLowerCase() &&
                userPosition.poolFeeTier === poolDetails.feeTier
              );
            });

            const relevantPosition = userPositionsGql.find(
              (pos) =>
                pos.pool.id.toLowerCase() === poolDetails.id.toLowerCase() &&
                pos.pool.feeTier === poolDetails.feeTier
            );

            const relevantPositions = userPositionsGql.filter(
              (pos) =>
                pos.pool.id.toLowerCase() === poolDetails.id.toLowerCase() &&
                pos.pool.feeTier === poolDetails.feeTier
            );

            const multipleRelevantPositions = relevantPositions.length > 1;

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

            if (v3StakerContract) {
              const incentiveId = buildIncentiveIdFromIncentive(incentive);
              try {
                const rewardInfo: RewardInfo =
                  await v3StakerContract?.getRewardInfo(
                    incentiveId,
                    positionId
                  );

                const pendingRewardsForPosition = formatUnits(
                  BigInt(rewardInfo.reward.toString()),
                  incentive.rewardToken.decimals
                );
                pendingRewards = pendingRewardsForPosition;
              } catch (e) {
                console.warn(e);
                pendingRewards = "0";
              }
            }

            const token0 = findTokenByAddress(tokenList, poolDetails.token0.id);
            const token1 = findTokenByAddress(tokenList, poolDetails.token1.id);

            const depositDisplay = relevantPosition
              ? `${parseFloat(relevantPosition.depositedToken0 ?? "0").toFixed(
                  4
                )} ${token0?.symbol} + ${parseFloat(
                  relevantPosition.depositedToken1 ?? "0"
                ).toFixed(4)} ${token1?.symbol}`
              : "-";

            const tokenRewardLogoUri = findTokenByAddress(
              tokenList,
              incentive.rewardToken.id
            )?.logoURI;

            return {
              ...poolDetails,
              address: poolDetails.id,
              incentiveId: incentive.id,
              pool: {
                token0: token0,
                token1: token1,
              },
              feeTier: poolDetails.feeTier,
              tvl: poolDetails.totalValueLockedUSD,
              totalDeposit: totalDeposit,
              positionId: positionId,
              totalrewards: totalRewardsToken,
              tokenreward: incentive.rewardToken.symbol,
              tokenRewardLogoUri: tokenRewardLogoUri,
              depositedToken0: relevantPosition
                ? relevantPosition.depositedToken0
                : 0,
              depositedToken1: relevantPosition
                ? relevantPosition.depositedToken1
                : 0,
              tickLower: poolPosition[0] ? poolPosition[0].tickLower : "0",
              tickUpper: poolPosition[0] ? poolPosition[0].tickUpper : "0",
              apy: apr24hrs * 365,
              eligible:
                (poolPosition[0] && poolPosition[0].tokenId) || relevantPosition
                  ? true
                  : false,
              link: multipleRelevantPositions
                ? undefined
                : (poolPosition[0] && poolPosition[0].tokenId) ||
                  relevantPosition
                ? `/pool/${unifiedTokenId}?incentive=${incentive.id}`
                : `/add/${poolDetails.token0.id}/${poolDetails.token1.id}`,
              pendingRewards,
              displayedTotalDeposit: depositDisplay,
              hasMultipleRelevantPositions: multipleRelevantPositions,
              userPositions: relevantPositions,
            } as PoolInfo;
          }
          return null;
        })
      );
      setIsLoading(false);
      let filteredData = poolInfo.filter((pool) => pool !== null) as PoolInfo[];
      return filteredData;
    },
    [rawIncentivesData, userPositionsGql, userPositions, account.isConnected]
  );

  useEffect(() => {
    if (
      account.isConnected &&
      rawIncentivesData &&
      rawIncentivesData.length > 0 &&
      tokenList?.length > 0
    ) {
      processIncentives(userPositions).then((data) => {
        if (data) {
          const eligiblePools = data.filter((pool) => pool.eligible);
          const ineligiblePools = data.filter((pool) => !pool.eligible);
          setPoolTransactionTableValues([...eligiblePools, ...ineligiblePools]);
        }
      });
    }
  }, [
    rawIncentivesData,
    tokenList,
    userPositions,
    userPositionsGql,
    account.isConnected,
    location,
  ]);

  const navigate = useNavigate();

  useEffect(() => {
    if (account.isConnected) {
      fetchCoinDetails();
    }
  }, [fetchCoinDetails, account.isConnected]);

  const columns = useMemo(() => {
    const columnHelper = createColumnHelper<PoolInfo>();
    return [
      columnHelper.accessor("pool", {
        id: "pool",
        header: (pool) => (
          <Cell
            minWidth={200}
            justifyContent="flex-start"
            grow
            key={pool.column.id}
          >
            <Row gap="4px">
              <ThemedText.BodyPrimary>
                <Trans i18nKey="common.incentives.pool.label" />
                &nbsp;
                <MouseoverTooltip
                  placement="right"
                  text={
                    <Trans i18nKey="common.incentives.eligible.description" />
                  }
                >
                  <StyledInfoIcon />
                </MouseoverTooltip>
              </ThemedText.BodyPrimary>
            </Row>
          </Cell>
        ),
        cell: (pool) => (
          <Cell
            loading={isLoading}
            minWidth={200}
            justifyContent="flex-start"
            grow
            key={pool?.row?.original?.address}
          >
            <>
              <Star
                color="#c7a912"
                size={20}
                fill="#c7a912"
                style={{
                  visibility: pool?.row?.original?.eligible
                    ? "visible"
                    : "hidden",
                }}
              />
            </>
            &nbsp;&nbsp;&nbsp;
            <ThemedText.BodyPrimary flex="column">
              <PoolTokenImage pool={pool.getValue?.()} />
            </ThemedText.BodyPrimary>
          </Cell>
        ),
      }),
      columnHelper.accessor("apy", {
        id: "apy",
        header: (apy) => (
          <Cell minWidth={200} key={apy.column.id}>
            <ThemedText.BodyPrimary>
              <Row gap="4px">
                <Trans i18nKey="common.incentives.apy" />
                <MouseoverTooltip
                  placement="right"
                  text={<Trans i18nKey="common.incentives.apy.description" />}
                >
                  <StyledInfoIcon />
                </MouseoverTooltip>
              </Row>
            </ThemedText.BodyPrimary>
          </Cell>
        ),
        cell: (apy) => (
          <Cell
            loading={isLoading}
            minWidth={200}
            key={apy?.row?.original?.address}
          >
            <ThemedText.BodyPrimary>
              {apy.getValue?.().toFixed(3)}%
            </ThemedText.BodyPrimary>
          </Cell>
        ),
      }),
      columnHelper.accessor("tvl", {
        id: "tvl",
        header: (tvl) => (
          <Cell minWidth={200} key={tvl.column.id}>
            <ThemedText.BodyPrimary>
              <Trans i18nKey="common.incentives.pool.tvl" />
            </ThemedText.BodyPrimary>
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
            <Cell
              loading={isLoading}
              minWidth={200}
              key={tvl?.row?.original?.address}
            >
              <ThemedText.BodyPrimary>{tvlFormatted}$</ThemedText.BodyPrimary>
            </Cell>
          );
        },
      }),
      columnHelper.accessor("pendingRewards", {
        id: "pendingRewards",
        header: (pendingRewards) => (
          <Cell minWidth={200} key={pendingRewards.column.id}>
            <ThemedText.BodyPrimary>
              <Row gap="4px">
                <Trans i18nKey="common.incentives.pending.reward" />
                <MouseoverTooltip
                  placement="right"
                  text={
                    <Trans i18nKey="common.incentives.pending.description" />
                  }
                >
                  <StyledInfoIcon />
                </MouseoverTooltip>
              </Row>
            </ThemedText.BodyPrimary>
          </Cell>
        ),
        cell: (pendingRewards) => (
          <Cell
            loading={isLoading}
            minWidth={200}
            key={pendingRewards?.row?.original?.address}
          >
            <ThemedText.BodyPrimary>
              {pendingRewards.getValue?.()}
            </ThemedText.BodyPrimary>
          </Cell>
        ),
      }),
      columnHelper.accessor("hasMultipleRelevantPositions", {
        id: "choosePosition",
        header: (hasMultipleRelevantPositions) => (
          <Cell minWidth={200} key={hasMultipleRelevantPositions.column.id}>
            <ThemedText.BodyPrimary>
              <Row gap="4px">
                <Trans i18nKey="common.incentives.choose.position" />
                &nbsp;
                <MouseoverTooltip
                  placement="right"
                  text={
                    <Trans i18nKey="common.incentives.choose.position.description" />
                  }
                >
                  <StyledInfoIcon />
                </MouseoverTooltip>
              </Row>
            </ThemedText.BodyPrimary>
          </Cell>
        ),
        cell: (hasMultipleRelevantPositions) => (
          <Cell
            loading={isLoading}
            minWidth={200}
            key={hasMultipleRelevantPositions?.row?.original?.address}
          >
            <SaveButton
              onClick={() => {
                setShowPositionsModal(true);
              }}
              style={{ textAlign: "center" }}
            >
              {hasMultipleRelevantPositions.getValue?.() ? (
                <Trans i18nKey="common.incentives.choose.position" />
              ) : (
                <Trans i18nKey="common.incentives.deposit" />
              )}
            </SaveButton>
            {showPositionsModal &&
              hasMultipleRelevantPositions?.row?.original?.userPositions && (
                <ChoosePositionModal
                  show={showPositionsModal}
                  onHide={() => {
                    setShowPositionsModal(false);
                  }}
                  onSelectPosition={(positionId: number) =>
                    navigate(
                      `/pool/${positionId}?incentive=${hasMultipleRelevantPositions?.row?.original?.incentiveId}`
                    )
                  }
                  positionIds={
                    hasMultipleRelevantPositions?.row?.original?.userPositions?.map(
                      (p) => p.id
                    ) || []
                  }
                />
              )}
          </Cell>
        ),
      }),
      columnHelper.accessor("tokenreward", {
        id: "tokenreward",
        header: (tokenreward) => (
          <Cell minWidth={200} key={tokenreward.column.id}>
            <ThemedText.BodySecondary>
              <Trans i18nKey="common.incentives.token.reward" />
            </ThemedText.BodySecondary>
          </Cell>
        ),
        cell: (tokenreward) => (
          <Cell
            loading={isLoading}
            minWidth={200}
            key={tokenreward?.row?.original?.address}
          >
            {tokenreward.row?.original?.tokenRewardLogoUri && (
              <>
                <TokenLogoImage
                  size={LOGO_DEFAULT_SIZE}
                  src={tokenreward.row?.original?.tokenRewardLogoUri}
                />
                &nbsp;&nbsp;&nbsp;
              </>
            )}
            <ThemedText.BodySecondary>
              {tokenreward.getValue?.()}
            </ThemedText.BodySecondary>
          </Cell>
        ),
      }),
      columnHelper.accessor("displayedTotalDeposit", {
        id: "displayedTotalDeposit",
        header: (displayedTotalDeposit) => (
          <Cell minWidth={200} key={displayedTotalDeposit.column.id}>
            <ThemedText.BodySecondary>
              <Trans i18nKey="common.incentives.total.deposits" />
            </ThemedText.BodySecondary>
          </Cell>
        ),
        cell: (displayedTotalDeposit) => (
          <Cell loading={isLoading} minWidth={200} justifyContent="center">
            <ThemedText.BodySecondarySmall style={{ textAlign: "right" }}>
              {displayedTotalDeposit.getValue?.()}
            </ThemedText.BodySecondarySmall>
          </Cell>
        ),
      }),
      columnHelper.accessor("feeTier", {
        id: "feeTier",
        header: (feeTier) => (
          <Cell
            minWidth={200}
            justifyContent="flex-end"
            grow
            key={feeTier.column.id}
          >
            <Row gap="4px" justify="flex-end">
              <ThemedText.BodySecondary>
                <Trans i18nKey="common.incentives.pool.feeTier" />
              </ThemedText.BodySecondary>
            </Row>
          </Cell>
        ),
        cell: (feeTier) => (
          <Cell
            loading={isLoading}
            minWidth={200}
            key={feeTier?.row?.original?.address}
          >
            <ThemedText.BodySecondary>
              {parseFloat(
                (Number(feeTier.getValue?.() || "0") / 10000).toString()
              ).toFixed(3)}
              %
            </ThemedText.BodySecondary>
          </Cell>
        ),
      }),
      columnHelper.accessor("totalrewards", {
        id: "totalrewards",
        header: (totalrewards) => (
          <Cell minWidth={200} key={totalrewards.column.id}>
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
            <Cell
              loading={isLoading}
              minWidth={200}
              key={totalrewards?.row?.original?.address}
            >
              <ThemedText.BodySecondary>
                {totalrewardsFormatted}
              </ThemedText.BodySecondary>
            </Cell>
          );
        },
      }),
    ];
  }, [isLoading, showPositionsModal, poolTransactionTableValues]);

  return account.isConnected ? (
    <Table
      columns={columns}
      data={poolTransactionTableValues}
      loading={isLoading}
      maxWidth={1200}
      key={poolTransactionTableValues.map((p) => p.address).join("-")}
    />
  ) : (
    <StyledLightCard>
      <ThemedText.BodySecondary>
        Connect wallet to see real-time APY
      </ThemedText.BodySecondary>
    </StyledLightCard>
  );
}
const StyledLightCard = styled(LightCard)`
  padding: 20px;
  margin: 20px 0;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  text-align: center;
`;
