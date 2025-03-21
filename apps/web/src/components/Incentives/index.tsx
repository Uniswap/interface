import { createColumnHelper } from "@tanstack/react-table";
import Row from "components/Row";
import { Table } from "components/Table";
import { Cell } from "components/Table/Cell";
import { Trans } from "i18n";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { useIncentivesData } from "./IncentivesDataProvider";

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
    <StyledPoolRow gap="4px">
      <TokenContainer>
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
      </TokenContainer>
      <SymbolText>
        {pool.token0?.symbol}/{pool.token1?.symbol}
      </SymbolText>
    </StyledPoolRow>
  );
};

export default function Incentives() {
  const account = useAccount();
  const chainId = useChainId();
  const [showPositionsModal, setShowPositionsModal] = useState(false);
  const { poolInfoActiveIncentives, isLoading, refetchIncentives } =
    useIncentivesData();
  const navigate = useNavigate();

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
              {new Intl.NumberFormat("en-US", {
                style: "percent",
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
              }).format(apy.getValue?.())}
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
          const tvlValue = tvl.getValue?.();
          if (!tvlValue) {
            return null;
          }

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
              {parseFloat(pendingRewards.getValue?.() || "0").toFixed(2)}&nbsp;
              {pendingRewards.row?.original?.tokenreward}
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
        cell: (totalRewards) => {
          const totalRewardsValue = totalRewards.getValue?.();

          if (!totalRewardsValue) {
            return null;
          }

          const totalRewardsFormatted = Number(
            totalRewardsValue
          ).toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          });

          return (
            <Cell
              loading={isLoading}
              minWidth={200}
              key={totalRewards?.row?.original?.address}
            >
              <ThemedText.BodySecondary>
                {totalRewardsFormatted}
              </ThemedText.BodySecondary>
            </Cell>
          );
        },
      }),
    ];
  }, [isLoading, showPositionsModal, poolInfoActiveIncentives]);

  return account.isConnected ? (
    <Table
      columns={columns}
      data={poolInfoActiveIncentives}
      loading={isLoading}
      maxWidth={1200}
      key={poolInfoActiveIncentives.map((p) => p.address).join("-")}
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

const StyledDepositButton = styled(SaveButton)`
  width: 130px;
  height: 40px;
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
  padding: 8px 0;
  font-size: 14px;
`;

const StyledPoolRow = styled(Row)`
  align-items: center;
  margin-left: 4px;
`;

const TokenContainer = styled.div`
  display: flex;
  margin-right: 8px;
`;

const SymbolText = styled(ThemedText.BodyPrimary)`
  font-size: 14px;
  white-space: nowrap;
`;

const StyledRewardRow = styled(Row)`
  width: 100%;
  height: 40px;
`;

const RewardSymbolText = styled(ThemedText.BodySecondary)`
  font-size: 14px;
  white-space: nowrap;
`;

const RewardAmountText = styled(ThemedText.BodyPrimary)`
  font-size: 14px;
  text-align: center;
  white-space: nowrap;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
`;
