import { createColumnHelper } from "@tanstack/react-table";
import Row from "components/Row";
import { Table } from "components/Table";
import { Cell } from "components/Table/Cell";
import { Trans } from "i18n";
import { useMemo, useState, useEffect, useRef } from "react";
import { ThemedText } from "theme/components";
import { TokenInfoDetails, PoolInfo } from "./types";
import { TokenLogoImage } from "../DoubleLogo";
import blankTokenUrl from "assets/svg/blank_token.svg";
import { useAccount } from "../../hooks/useAccount";
import { MouseoverTooltip } from "components/Tooltip";
import styled from "styled-components";
import { Info, Star } from "react-feather";
import { LightCard } from "components/Card";
import ChoosePositionModal, { SaveButton } from "./ChoosePositionModal";
import { useNavigate } from "react-router-dom";
import { useIncentivesData } from "./IncentivesDataProvider";

const LOGO_DEFAULT_SIZE = 30;

const StyledInfoIcon = styled(Info)`
  height: 12px;
  width: 12px;
  flex: 1 1 auto;
  stroke: ${({ theme }) => theme.neutral2};
`;

interface PoolTokenImageProps {
  pool: {
    token0: TokenInfoDetails | undefined;
    token1: TokenInfoDetails | undefined;
  };
}

const PoolTokenImage = ({ pool }: PoolTokenImageProps) => {
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

export default function EndedIncentives() {
  const account = useAccount();
  const [showPositionsModal, setShowPositionsModal] = useState(false);
  const navigate = useNavigate();
  const hasRefreshed = useRef(false);
  const hasDisplayedDebugInfo = useRef(false);

  const [stableLoading, setStableLoading] = useState(true);
  const initialRenderComplete = useRef(false);

  const {
    poolInfoEndedIncentives,
    endedIncentives,
    userPositions,
    isLoading,
    isLoadingIncentives,
    isLoadingPoolInfo,
    isLoadingPositions,
    refetchIncentives,
    tokenList,
  } = useIncentivesData();

  const isLoadingData =
    isLoading || isLoadingIncentives || isLoadingPoolInfo || isLoadingPositions;

  useEffect(() => {
    if (!initialRenderComplete.current) {
      initialRenderComplete.current = true;
      return;
    }

    if (isLoadingData) {
      setStableLoading(true);
      return;
    }

    const timer = setTimeout(() => {
      if (poolInfoEndedIncentives && poolInfoEndedIncentives.length > 0) {
        setStableLoading(false);
      } else if (!isLoadingData) {
        setStableLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [isLoadingData, poolInfoEndedIncentives]);

  useEffect(() => {
    if (account.isConnected && !hasRefreshed.current) {
      hasRefreshed.current = true;
      refetchIncentives();
    }
    return undefined;
  }, [account.isConnected, refetchIncentives]);

  const columns = useMemo(() => {
    const columnHelper = createColumnHelper<PoolInfo>();
    return [
      columnHelper.accessor("pool", {
        id: "pool",
        header: (pool) => (
          <Cell
            width={220}
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
            loading={isLoadingData}
            width={220}
            justifyContent="flex-start"
            grow
            key={pool?.row?.original?.address}
          >
            <>
              <Star
                color="#c7a912"
                size={pool?.row?.original?.eligible ? 20 : 0}
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
          <Cell minWidth={120} key={apy.column.id}>
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
            loading={isLoadingData}
            minWidth={120}
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
          <Cell minWidth={150} key={tvl.column.id}>
            <ThemedText.BodyPrimary>
              <Trans i18nKey="common.incentives.pool.tvl" />
            </ThemedText.BodyPrimary>
          </Cell>
        ),
        cell: (tvl) => {
          const tvlValue = tvl.getValue?.();
          if (!tvlValue) return null;

          const tvlNumber = parseFloat(tvlValue);
          const tvlFormatted = tvlNumber.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          });

          return (
            <Cell
              loading={isLoadingData}
              minWidth={150}
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
          <Cell minWidth={150} key={pendingRewards.column.id}>
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
            loading={isLoadingData}
            minWidth={150}
            justifyContent="center"
            key={pendingRewards?.row?.original?.address}
          >
            <RewardAmountText>
              {parseFloat(pendingRewards.getValue?.() || "0").toFixed(2)}
              &nbsp;
              {pendingRewards.row?.original?.tokenreward}
            </RewardAmountText>
          </Cell>
        ),
      }),

      columnHelper.accessor("hasMultipleRelevantPositions", {
        id: "choosePosition",
        header: (hasMultipleRelevantPositions) => (
          <Cell minWidth={150} key={hasMultipleRelevantPositions.column.id}>
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
        cell: (hasMultipleRelevantPositions) => {
          const hasPositions =
            (hasMultipleRelevantPositions?.row?.original?.userPositions
              ?.length ?? 0) > 0;

          return (
            <Cell
              loading={isLoadingData}
              minWidth={150}
              key={hasMultipleRelevantPositions?.row?.original?.address}
              justifyContent="center"
            >
              <StyledDepositButton
                onClick={() => {
                  if (hasPositions) {
                    setShowPositionsModal(true);
                  } else {
                    const pool = hasMultipleRelevantPositions?.row?.original;
                    if (pool && pool.pool.token0 && pool.pool.token1) {
                      navigate(
                        `/add/${pool.pool.token0.address}/${pool.pool.token1.address}`
                      );
                    }
                  }
                }}
                disabled={!account.isConnected}
              >
                {hasPositions ? (
                  hasMultipleRelevantPositions.getValue?.() ? (
                    <Trans i18nKey="common.incentives.choose.position" />
                  ) : (
                    <Trans i18nKey="common.incentives.withdraw" />
                  )
                ) : (
                  "Deposit LP"
                )}
              </StyledDepositButton>
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
          );
        },
      }),

      columnHelper.accessor("tokenreward", {
        id: "tokenreward",
        header: (tokenreward) => (
          <Cell minWidth={150} key={tokenreward.column.id}>
            <ThemedText.BodySecondary>
              <Trans i18nKey="common.incentives.token.reward" />
            </ThemedText.BodySecondary>
          </Cell>
        ),
        cell: (tokenreward) => (
          <Cell
            loading={isLoadingData}
            minWidth={150}
            justifyContent="center"
            key={tokenreward?.row?.original?.address}
          >
            <StyledRewardRow gap="8px" justify="center" align="center">
              {tokenreward.row?.original?.tokenRewardLogoUri && (
                <TokenLogoImage
                  size={24}
                  src={tokenreward.row?.original?.tokenRewardLogoUri}
                />
              )}
              <RewardSymbolText>{tokenreward.getValue?.()}</RewardSymbolText>
            </StyledRewardRow>
          </Cell>
        ),
      }),

      columnHelper.accessor("displayedTotalDeposit", {
        id: "displayedTotalDeposit",
        header: (displayedTotalDeposit) => (
          <Cell minWidth={150} key={displayedTotalDeposit.column.id}>
            <ThemedText.BodySecondary>
              <Trans i18nKey="common.incentives.total.deposits" />
            </ThemedText.BodySecondary>
          </Cell>
        ),
        cell: (displayedTotalDeposit) => (
          <Cell loading={isLoadingData} minWidth={150} justifyContent="center">
            <ThemedText.BodySecondarySmall style={{ textAlign: "center" }}>
              {displayedTotalDeposit.getValue?.()}
            </ThemedText.BodySecondarySmall>
          </Cell>
        ),
      }),

      columnHelper.accessor("feeTier", {
        id: "feeTier",
        header: (feeTier) => (
          <Cell minWidth={120} justifyContent="center" key={feeTier.column.id}>
            <ThemedText.BodySecondary>
              <Trans i18nKey="common.incentives.pool.feeTier" />
            </ThemedText.BodySecondary>
          </Cell>
        ),
        cell: (feeTier) => (
          <Cell
            loading={isLoadingData}
            minWidth={120}
            justifyContent="center"
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
          <Cell minWidth={150} key={totalrewards.column.id}>
            <ThemedText.BodySecondary>
              <Trans i18nKey="common.incentives.total.program.rewards" />
            </ThemedText.BodySecondary>
          </Cell>
        ),
        cell: (totalrewards) => {
          const totalrewardsValue = totalrewards.getValue?.();
          if (!totalrewardsValue) return null;

          const totalrewardsFormatted = Number(
            totalrewardsValue
          ).toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          });

          return (
            <Cell
              loading={isLoadingData}
              minWidth={150}
              justifyContent="center"
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
  }, [stableLoading, showPositionsModal, navigate]);

  useEffect(() => {
    if (!hasDisplayedDebugInfo.current) {
      hasDisplayedDebugInfo.current = true;
    }
  }, [endedIncentives, poolInfoEndedIncentives, tokenList]);

  return account.isConnected ? (
    <>
      {stableLoading ? (
        <StyledLightCard>
          <ThemedText.BodySecondary>
            Loading ended incentives data...
          </ThemedText.BodySecondary>
        </StyledLightCard>
      ) : poolInfoEndedIncentives?.length > 0 ? (
        <>
          <Table
            columns={columns}
            data={poolInfoEndedIncentives}
            loading={false}
            maxWidth={1200}
            key={poolInfoEndedIncentives.map((p) => p.address).join("-")}
          />
          {userPositions?.length === 0 && (
            <StyledInfoCard>
              <ThemedText.BodySecondary>
                You don't have any positions yet. Add liquidity to participate
                in incentives.
              </ThemedText.BodySecondary>
            </StyledInfoCard>
          )}
        </>
      ) : (
        <StyledLightCard>
          <ThemedText.BodySecondary>
            {endedIncentives?.length > 0 ? (
              <>
                No ended incentives are currently available.
                <br />
                <br />
                Debug information:
                <ul>
                  <li>Raw ended incentives: {endedIncentives?.length || 0}</li>
                  <li>User positions: {userPositions?.length || 0}</li>
                  <li>Token list: {tokenList?.length || 0} tokens</li>
                </ul>
              </>
            ) : (
              "No incentives data available. Please try again later."
            )}
          </ThemedText.BodySecondary>
        </StyledLightCard>
      )}
    </>
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

const StyledInfoCard = styled(LightCard)`
  padding: 12px;
  margin: 12px 0;
  background-color: rgba(var(--info-light), 0.2);
  border: 1px solid rgba(var(--info), 0.4);
  text-align: center;
`;
