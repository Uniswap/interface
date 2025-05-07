import { Token } from "@taraswap/sdk-core";
import { useMemo, useState, useCallback, useEffect } from "react";
import { Trans } from "i18n";
import {
  LoadingRows,
  IncentiveCard,
  IncentiveHeader,
  IncentiveContent,
  IncentiveStatus,
} from "./styled";
import { ThemedText } from "theme/components";
import { RowBetween, RowFixed } from "components/Row";
import CurrencyLogo from "components/Logo/CurrencyLogo";
import { ButtonPrimary } from "components/Button";
import Row from "components/Row";
import { formatEther, getAddress } from "ethers/lib/utils";
import {
  useIncentivesData,
  type ProcessedIncentive,
} from "hooks/useIncentivesData";
import { ScrollBarStyles } from "components/Common";
import styled from "styled-components";
import { useBulkPosition } from "hooks/useBulkPosition";
import Toggle from "components/Toggle";
import { ethers } from "ethers";

const Container = styled.div`
  height: 425px;
  width: 100%;
  display: flex;
  flex-direction: column;
`;

const ButtonsContainer = styled(Row)`
  position: sticky;
  top: 0;
  background: ${({ theme }) => theme.surface1};
  padding: 16px 0;
  gap: 8px;
  justify-content: center;
  z-index: 1;
`;

const ScrollableContent = styled.div`
  max-height: calc(100vh - 340px);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
  ${ScrollBarStyles}
`;

const ToggleLabel = styled.button`
  cursor: pointer;
  background-color: transparent;
  border: none;
  color: ${({ theme }) => theme.accent1};
  font-size: 14px;
  font-weight: 485;
`;

function IncentivesList({
  tokenId,
  poolAddress,
}: {
  tokenId: number;
  poolAddress: string;
}) {
  const [expandedIncentive, setExpandedIncentive] = useState<string | null>(
    null
  );
  const [pendingRewardsMap, setPendingRewardsMap] = useState<
    Record<string, number>
  >({});
  const [isTokenOwner, setIsTokenOwner] = useState(false);
  const [isBulkStaking, setIsBulkStaking] = useState(false);
  const [isBulkUnstaking, setIsBulkUnstaking] = useState(false);
  const [isBulkWithdrawing, setIsBulkWithdrawing] = useState(false);
  const [isStaking, setIsStaking] = useState(false);
  const [isUnstaking, setIsUnstaking] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [showEndedIncentives, setShowEndedIncentives] = useState(false);

  const {
    activeIncentives,
    endedIncentives,
    isLoading,
    error,
    refetch: refetchIncentives,
  } = useIncentivesData(poolAddress);
  const allIncentives = showEndedIncentives
    ? [...activeIncentives, ...endedIncentives]
    : activeIncentives;

  const {
    isDeposited,
    handleStake,
    handleUnstake,
    handleClaim,
    handleBulkStake,
    handleBulkUnstake,
    handleBulkWithdraw,
    getIncentivePendingRewards,
  } = useBulkPosition(tokenId, poolAddress, allIncentives);

  const hasAvailableIncentives = useMemo(() => {
    return activeIncentives.some(
      (incentive) =>
        incentive.positionOnPoolIds?.includes(tokenId) &&
        !incentive.positionOnIncentiveIds?.includes(tokenId)
    );
  }, [activeIncentives]);

  const hasStakedIncentives = useMemo(() => {
    return allIncentives.some((incentive) =>
      incentive.positionOnIncentiveIds?.includes(tokenId)
    );
  }, [allIncentives]);

  const hasAllIncetivesStaked = useMemo(() => {
    return allIncentives.every((incentive) =>
      incentive.positionOnIncentiveIds?.includes(tokenId)
    );
  }, [allIncentives]);

  const handleStakeWithRefresh = useCallback(
    async (incentive: ProcessedIncentive) => {
      try {
        setIsStaking(true);
        const tx = await handleStake(incentive);
        if (tx) {
          await tx.wait(2);
          await refetchIncentives();
        }
      } catch (error) {
        console.error("Error in stake with refresh:", error);
      } finally {
        setIsStaking(false);
      }
    },
    [handleStake, refetchIncentives]
  );

  const handleUnstakeWithRefresh = useCallback(
    async (incentive: ProcessedIncentive) => {
      try {
        setIsUnstaking(true);
        const tx = await handleUnstake(incentive);
        if (tx) {
          await tx.wait(2);
          await refetchIncentives();
        }
      } catch (error) {
        console.error("Error in unstake with refresh:", error);
      } finally {
        setIsUnstaking(false);
      }
    },
    [handleUnstake, refetchIncentives]
  );

  const handleClaimWithRefresh = useCallback(
    async (incentive: ProcessedIncentive) => {
      try {
        setIsClaiming(true);
        const tx = await handleClaim(incentive);
        if (tx) {
          await tx.wait(2);
          await refetchIncentives();
        }
      } catch (error) {
        console.error("Error in claim with refresh:", error);
      } finally {
        setIsClaiming(false);
      }
    },
    [handleClaim, refetchIncentives]
  );

  const handleBulkStakeWithRefresh = useCallback(async () => {
    try {
      setIsBulkStaking(true);
      const tx = await handleBulkStake();
      if (tx) {
        await tx.wait(2);
        await refetchIncentives();
      }
    } catch (error) {
      console.error("Error in bulk staking with refresh:", error);
    } finally {
      setIsBulkStaking(false);
    }
  }, [handleBulkStake, refetchIncentives]);

  const handleBulkUnstakeWithRefresh = useCallback(async () => {
    try {
      setIsBulkUnstaking(true);
      const tx = await handleBulkUnstake();
      if (tx) {
        await tx.wait(2);
        await refetchIncentives();
      }
    } catch (error) {
      console.error("Error in bulk unstaking with refresh:", error);
    } finally {
      setIsBulkUnstaking(false);
    }
  }, [handleBulkUnstake, refetchIncentives]);

  const handleBulkWithdrawWithRefresh = useCallback(async () => {
    try {
      setIsBulkWithdrawing(true);
      const tx = await handleBulkWithdraw();
      if (tx) {
        await tx.wait(2);
        await refetchIncentives();
      }
    } catch (error) {
      console.error("Error in bulk withdrawal with refresh:", error);
    } finally {
      setIsBulkWithdrawing(false);
    }
  }, [handleBulkWithdraw, refetchIncentives]);

  const positions = useMemo(
    () =>
      allIncentives.map((incentive) => ({
        tokenId: Number(incentive.id),
        incentive: incentive,
      })),
    [allIncentives]
  );

  useEffect(() => {
    const fetchRewards = async () => {
      const rewards: Record<string, number> = {};
      for (const incentive of allIncentives) {
        try {
          const reward = await getIncentivePendingRewards(incentive);
          rewards[incentive.id] = Number(ethers.utils.formatEther(reward || 0));
        } catch (error) {
          console.error("Error fetching rewards:", error);
          rewards[incentive.id] = 0;
        }
      }
      setPendingRewardsMap(rewards);
    };

    fetchRewards();
    const interval = setInterval(fetchRewards, 10000);
    return () => clearInterval(interval);
  }, [allIncentives, getIncentivePendingRewards]);

  if (isLoading) {
    return (
      <Container>
        <LoadingRows>
          <div />
          <div />
          <div />
        </LoadingRows>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <ThemedText.DeprecatedMain>
          Error loading incentives: {error.message}
        </ThemedText.DeprecatedMain>
      </Container>
    );
  }

  return (
    <Container>
      <Trans i18nKey="common.incentives" />

      <ButtonsContainer>
        <ButtonPrimary
          onClick={handleBulkStakeWithRefresh}
          disabled={
            isBulkStaking ||
            isStaking ||
            !hasAvailableIncentives ||
            hasAllIncetivesStaked
          }
          style={{
            padding: "8px",
            fontSize: "14px",
            height: "32px",
            whiteSpace: "nowrap",
            width: "120px",
          }}
        >
          {isBulkStaking || isStaking ? (
            <Trans i18nKey="common.staking" />
          ) : (
            <Trans i18nKey="common.stakeAll" />
          )}
        </ButtonPrimary>
        <ButtonPrimary
          onClick={handleBulkUnstakeWithRefresh}
          disabled={isBulkUnstaking || isUnstaking || !hasStakedIncentives}
          style={{
            padding: "8px",
            fontSize: "14px",
            height: "32px",
            whiteSpace: "nowrap",
            width: "120px",
          }}
        >
          {isBulkUnstaking || isUnstaking ? (
            <Trans i18nKey="common.unstaking" />
          ) : (
            <Trans i18nKey="common.unstakeAll" />
          )}
        </ButtonPrimary>
        <ButtonPrimary
          onClick={handleBulkWithdrawWithRefresh}
          disabled={isBulkWithdrawing || !isDeposited || hasStakedIncentives}
          style={{
            padding: "8px",
            fontSize: "14px",
            height: "32px",
            whiteSpace: "nowrap",
            width: "120px",
          }}
        >
          {isBulkWithdrawing ? (
            <Trans i18nKey="common.withdrawing" />
          ) : (
            <Trans i18nKey="common.withdraw" />
          )}
        </ButtonPrimary>
        <ToggleLabel>
          <ThemedText.BodySmall color="neutral2">
            <Trans i18nKey="common.showEndedIncentives" />
          </ThemedText.BodySmall>
        </ToggleLabel>
        <Toggle
          isActive={showEndedIncentives}
          toggle={() => setShowEndedIncentives(!showEndedIncentives)}
        />
      </ButtonsContainer>

      <ScrollableContent>
        {allIncentives.map((incentive) => {
          const isExpanded = expandedIncentive === incentive.id;
          const isActive = incentive.status === "active";
          const hasStaked = incentive.positionOnIncentiveIds?.includes(
            Number(tokenId)
          );
          const canStake =
            incentive.positionOnPoolIds?.includes(Number(tokenId)) &&
            !hasStaked;
          const rewardToken = new Token(
            1,
            incentive.rewardToken.id,
            incentive.rewardToken.decimals,
            incentive.rewardToken.symbol
          );

          const pendingRewards = pendingRewardsMap[incentive.id] || 0;
          return (
            <IncentiveCard
              key={incentive.id}
              onClick={() =>
                setExpandedIncentive(isExpanded ? null : incentive.id)
              }
            >
              <IncentiveHeader>
                <RowFixed>
                  <CurrencyLogo
                    currency={rewardToken}
                    size={24}
                    style={{ marginRight: "8px" }}
                    logoURI={`https://raw.githubusercontent.com/taraswap/assets/master/logos/${getAddress(
                      rewardToken.address
                    )}/logo.png`}
                  />
                  <ThemedText.DeprecatedMain>
                    {incentive.reward} {rewardToken.symbol} Rewards
                  </ThemedText.DeprecatedMain>
                  {hasStaked && (
                    <ThemedText.DeprecatedMain
                      style={{ marginLeft: "8px", fontSize: "14px" }}
                    >
                      (Staked)
                    </ThemedText.DeprecatedMain>
                  )}
                </RowFixed>
                <RowFixed>
                  <IncentiveStatus isActive={isActive}>
                    {isActive ? (
                      <Trans i18nKey="common.active" />
                    ) : incentive.status === "inactive" ? (
                      <Trans i18nKey="common.inactive" />
                    ) : (
                      <Trans i18nKey="common.ended" />
                    )}
                  </IncentiveStatus>
                </RowFixed>
              </IncentiveHeader>
              {isExpanded && (
                <IncentiveContent>
                  <RowBetween>
                    <ThemedText.DeprecatedMain>
                      <Trans i18nKey="common.pendingRewards" />
                    </ThemedText.DeprecatedMain>
                    <RowFixed>
                      <CurrencyLogo
                        currency={rewardToken}
                        size={20}
                        style={{ marginRight: "8px" }}
                        logoURI={`https://raw.githubusercontent.com/taraswap/assets/main/logos/${getAddress(
                          rewardToken.address
                        )}/logo.png`}
                      />
                      <ThemedText.DeprecatedMain>
                        {pendingRewards.toFixed(6) || "0"} &nbsp;
                        {rewardToken.symbol}
                      </ThemedText.DeprecatedMain>
                    </RowFixed>
                  </RowBetween>
                  <RowBetween>
                    <ThemedText.DeprecatedMain>
                      <Trans i18nKey="common.accruedRewards" />
                    </ThemedText.DeprecatedMain>
                    <RowFixed>
                      <CurrencyLogo
                        currency={rewardToken}
                        size={20}
                        style={{ marginRight: "8px" }}
                        logoURI={`https://raw.githubusercontent.com/taraswap/assets/main/logos/${getAddress(
                          rewardToken.address
                        )}/logo.png`}
                      />
                      <ThemedText.DeprecatedMain>
                        {Number(incentive.currentReward?.reward || 0).toFixed(
                          6
                        ) || "0"}
                        &nbsp;
                        {rewardToken.symbol}
                      </ThemedText.DeprecatedMain>
                    </RowFixed>
                  </RowBetween>
                  <Row>
                    <ButtonPrimary
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStakeWithRefresh(incentive);
                      }}
                      disabled={
                        !isActive || !canStake || isStaking || isBulkStaking
                      }
                      style={{
                        padding: "8px",
                        fontSize: "14px",
                        height: "32px",
                        width: "120px",
                        marginRight: "8px",
                        marginLeft: "12px",
                      }}
                    >
                      {isStaking || isBulkStaking ? (
                        <Trans i18nKey="common.staking" />
                      ) : (
                        <Trans i18nKey="common.stake" />
                      )}
                    </ButtonPrimary>
                    <ButtonPrimary
                      onClick={async (e) => {
                        e.stopPropagation();
                        handleUnstakeWithRefresh(incentive);
                      }}
                      disabled={!hasStaked || isUnstaking || isBulkUnstaking}
                      style={{
                        padding: "8px",
                        fontSize: "14px",
                        height: "32px",
                        width: "120px",
                        marginRight: "8px",
                      }}
                    >
                      {isUnstaking || isBulkUnstaking ? (
                        <Trans i18nKey="common.unstaking" />
                      ) : (
                        <Trans i18nKey="common.unstake" />
                      )}
                    </ButtonPrimary>
                    <ButtonPrimary
                      onClick={(e) => {
                        e.stopPropagation();
                        handleClaimWithRefresh(incentive);
                      }}
                      disabled={
                        Number(incentive.currentReward?.reward) <= 0 ||
                        isClaiming ||
                        isNaN(Number(incentive.currentReward?.reward))
                      }
                      style={{
                        padding: "8px",
                        fontSize: "14px",
                        height: "32px",
                        width: "120px",
                      }}
                    >
                      {isClaiming ? (
                        <Trans i18nKey="common.claiming" />
                      ) : (
                        <Trans i18nKey="common.claim" />
                      )}
                    </ButtonPrimary>
                  </Row>
                </IncentiveContent>
              )}
            </IncentiveCard>
          );
        })}
      </ScrollableContent>
    </Container>
  );
}

export default IncentivesList;
