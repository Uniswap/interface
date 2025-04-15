import { Token } from "@taraswap/sdk-core";
import { useAccount } from "hooks/useAccount";
import { useV3StakerContract } from "hooks/useV3StakerContract";
import { useV3NFTPositionManagerContract } from "hooks/useContract";
import { useState, useCallback, useEffect, useMemo } from "react";
import { Trans } from "i18n";
import { LoadingRows, IncentiveCard, IncentiveHeader, IncentiveContent, AutoColumnWrapper, IncentiveStatus } from "./styled";
import { ThemedText } from "theme/components";
import { RowBetween, RowFixed } from "components/Row";
import CurrencyLogo from "components/Logo/CurrencyLogo";
import { ButtonPrimary } from "components/Button";
import { IncentiveKey } from "hooks/usePosition";
import Row from "components/Row";
import { getAddress } from "ethers/lib/utils";
import { useIncentivesData, type ProcessedIncentive } from "hooks/useIncentivesData";
import { ScrollBarStyles } from "components/Common";
import styled from "styled-components";
import { useBulkPosition } from "hooks/useBulkPosition";
import { ethers } from "ethers";

const Container = styled(AutoColumnWrapper)`
  position: relative;
  height: 100%;
`

const ButtonsContainer = styled(Row)`
  position: sticky;
  top: 0;
  background: ${({ theme }) => theme.surface1};
  padding: 16px 0;
  gap: 8px;
  justify-content: center;
  z-index: 1;
`

const ScrollableContent = styled(AutoColumnWrapper)`
  max-height: calc(100vh - 340px);
  overflow-y: auto;
  gap: 0px;
  ${ScrollBarStyles}
`

function IncentivesList({ tokenId, poolAddress }: { tokenId: number, poolAddress: string }) {
  const [expandedIncentive, setExpandedIncentive] = useState<string | null>(null);
  const { address, chainId } = useAccount();
  const v3StakerContract = useV3StakerContract();
  const [isTokenOwner, setIsTokenOwner] = useState(false);

  const { activeIncentives, endedIncentives, isLoading, error } = useIncentivesData(poolAddress);
  const allIncentives = [...activeIncentives, ...endedIncentives];

  const {
    isBulkStaking,
    isBulkUnstaking,
    isBulkWithdrawing,
    isStaking,
    isUnstaking,
    isClaiming,
    currentIncentiveId,
    hasRewards,
    handleStake,
    handleUnstake,
    handleClaim,
    handleBulkStake,
    handleBulkUnstake,
    handleBulkWithdraw
  } = useBulkPosition(tokenId, poolAddress, allIncentives);

  const hasAvailableIncentives = useMemo(() => {
    return activeIncentives.some(incentive => incentive.hasUserPositionInPool && !incentive.hasUserPositionInIncentive);
  }, [activeIncentives]);

  const hasStakedIncentives = useMemo(() => {
    return allIncentives.some(incentive => incentive.hasUserPositionInPool && incentive.hasUserPositionInIncentive);
  }, [allIncentives]);

  const canWithdraw = useMemo(() => {
    return isTokenOwner && !hasStakedIncentives;
  }, [isTokenOwner, hasStakedIncentives]);

  if (isLoading) {
    return (
      <Container gap="md">
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
      <Container gap="md">
        <ThemedText.DeprecatedMain>Error loading incentives: {error.message}</ThemedText.DeprecatedMain>
      </Container>
    );
  }

  return (
    <Container gap="md">
      <Trans i18nKey="common.incentives" />

      <ButtonsContainer gap="8px">
        <ButtonPrimary
          onClick={handleBulkStake}
          disabled={isBulkStaking || !hasAvailableIncentives}
          style={{ padding: '8px', fontSize: '14px', height: '32px', whiteSpace: 'nowrap', width: '120px' }}
        >
          {isBulkStaking ? (
            <Trans i18nKey="common.staking" />
          ) : (
            <Trans i18nKey="common.stakeAll" />
          )}
        </ButtonPrimary>
        <ButtonPrimary
          onClick={handleBulkUnstake}
          disabled={isBulkUnstaking || !hasStakedIncentives}
          style={{ padding: '8px', fontSize: '14px', height: '32px', whiteSpace: 'nowrap', width: '120px' }}
        >
          {isBulkUnstaking ? (
            <Trans i18nKey="common.unstaking" />
          ) : (
            <Trans i18nKey="common.unstakeAll" />
          )}
        </ButtonPrimary>
        <ButtonPrimary
          onClick={handleBulkWithdraw}
          disabled={isBulkWithdrawing || !canWithdraw}
          style={{ padding: '8px', fontSize: '14px', height: '32px', whiteSpace: 'nowrap', width: '120px' }}
        >
          {isBulkWithdrawing ? (
            <Trans i18nKey="common.withdrawing" />
          ) : (
            <Trans i18nKey="common.withdraw" />
          )}
        </ButtonPrimary>
      </ButtonsContainer>

      <ScrollableContent gap="md">
        {allIncentives.map((incentive) => {
          const isExpanded = expandedIncentive === incentive.id;
          const isActive = !incentive.ended;
          const hasStaked = incentive.hasUserPositionInIncentive;
          const rewardToken = new Token(
            1,
            incentive.rewardToken.id,
            incentive.rewardToken.decimals,
            incentive.rewardToken.symbol
          );

          return (
            <IncentiveCard key={incentive.id} onClick={() => setExpandedIncentive(isExpanded ? null : incentive.id)}>
              <IncentiveHeader>
                <RowFixed gap="8px">
                  <CurrencyLogo
                    currency={rewardToken}
                    size={24}
                    logoURI={`https://raw.githubusercontent.com/taraswap/assets/master/logos/${getAddress(rewardToken.address)}/logo.png`}
                  />
                  <ThemedText.DeprecatedMain>
                    {incentive.reward} {rewardToken.symbol} Rewards
                  </ThemedText.DeprecatedMain>
                  {hasStaked && (
                    <ThemedText.DeprecatedMain style={{ marginLeft: '8px', fontSize: '14px' }}>
                      (Staked)
                    </ThemedText.DeprecatedMain>
                  )}
                </RowFixed>
                <RowFixed gap="8px">
                  <IncentiveStatus isActive={isActive}>
                    {isActive ? <Trans i18nKey="common.active" /> : <Trans i18nKey="common.ended" />}
                  </IncentiveStatus>
                </RowFixed>
              </IncentiveHeader>
              {isExpanded && (
                <IncentiveContent gap="md">
                  <RowBetween>
                    <ThemedText.DeprecatedMain>
                      <Trans i18nKey="common.accruedRewards" />
                    </ThemedText.DeprecatedMain>
                    <RowFixed gap="8px">
                      <CurrencyLogo
                        currency={rewardToken}
                        size={20}
                        logoURI={`https://raw.githubusercontent.com/taraswap/assets/master/logos/${getAddress(rewardToken.address)}/logo.png`}
                      />
                      <ThemedText.DeprecatedMain>
                        {incentive.currentReward?.reward || '0'} {rewardToken.symbol}
                      </ThemedText.DeprecatedMain>
                    </RowFixed>
                  </RowBetween>
                  <Row justify="center" gap="8px">
                    <ButtonPrimary
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStake(incentive);
                      }}
                      disabled={!isActive || hasStaked || (isStaking && currentIncentiveId === incentive.id)}
                      style={{ padding: '8px', fontSize: '14px', height: '32px', width: '120px' }}
                    >
                      {isStaking && currentIncentiveId === incentive.id ? (
                        <Trans i18nKey="common.staking" />
                      ) : (
                        <Trans i18nKey="common.stake" />
                      )}
                    </ButtonPrimary>
                    <ButtonPrimary
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUnstake(incentive);
                      }}
                      disabled={!hasStaked || (isUnstaking && currentIncentiveId === incentive.id)}
                      style={{ padding: '8px', fontSize: '14px', height: '32px', width: '120px' }}
                    >
                      {isUnstaking && currentIncentiveId === incentive.id ? (
                        <Trans i18nKey="common.unstaking" />
                      ) : (
                        <Trans i18nKey="common.unstake" />
                      )}
                    </ButtonPrimary>
                    {Number(incentive.currentReward?.reward) > 0 && (
                      <ButtonPrimary
                        onClick={(e) => {
                          e.stopPropagation();
                          handleClaim(incentive);
                        }}
                        disabled={!hasRewards || (isClaiming && currentIncentiveId === incentive.id)}
                        style={{ padding: '8px', fontSize: '14px', height: '32px', width: '120px' }}
                      >
                        {isClaiming && currentIncentiveId === incentive.id ? (
                          <Trans i18nKey="common.claiming" />
                        ) : (
                          <Trans i18nKey="common.claim" />
                        )}
                      </ButtonPrimary>
                    )}
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