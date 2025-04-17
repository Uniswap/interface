import { Token } from "@taraswap/sdk-core";
import { useMemo, useState, useEffect, useCallback } from "react";
import { Trans } from "i18n";
import { LoadingRows, IncentiveCard, IncentiveHeader, IncentiveContent, IncentiveStatus } from "./styled";
import { ThemedText } from "theme/components";
import { RowBetween, RowFixed } from "components/Row";
import CurrencyLogo from "components/Logo/CurrencyLogo";
import { ButtonPrimary } from "components/Button";
import Row from "components/Row";
import { getAddress } from "ethers/lib/utils";
import { useIncentivesData, type ProcessedIncentive } from "hooks/useIncentivesData";
import { ScrollBarStyles } from "components/Common";
import styled from "styled-components";
import { useBulkPosition } from "hooks/useBulkPosition";
import { address } from "nft/components/explore/Cells/Cells.css";
import { useV3StakerContract } from "hooks/useV3StakerContract";
import { useAccount } from "hooks/useAccount";

const Container = styled.div`
  height: 420px;
  width: 100%;
  display: flex;
  flex-direction: column;
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

const ScrollableContent = styled.div`
  max-height: calc(100vh - 340px);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
  ${ScrollBarStyles}
`

function IncentivesList({ tokenId, poolAddress }: { tokenId: number, poolAddress: string }) {
  const [expandedIncentive, setExpandedIncentive] = useState<string | null>(null);
  const [isTokenOwner, setIsTokenOwner] = useState(false);

  const { activeIncentives, endedIncentives, isLoading, error, refetch: refetchIncentives } = useIncentivesData(poolAddress);
  const allIncentives = [...activeIncentives, ...endedIncentives];

  const {
    isBulkStaking,
    isBulkUnstaking,
    isBulkWithdrawing,
    isStaking,
    isUnstaking,
    isClaiming,
    handleStake,
    handleUnstake,
    handleClaim,
    handleBulkStake,
    handleBulkUnstake,
    handleBulkWithdraw,
  } = useBulkPosition(tokenId, poolAddress, allIncentives);
  const nftManagerPositionsContract = useV3StakerContract();
  const {address} = useAccount();

  // useEffect(() => {
  //   const checkTokenOwnership = async () => {
  //     if (!nftManagerPositionsContract) return;
  //     try {
  //       const owner = await nftManagerPositionsContract.ownerOf(tokenId);
  //       setIsTokenOwner(owner.toLowerCase() === address?.toLowerCase());
  //     } catch (error) {
  //       console.error('Error checking token ownership:', error);
  //       setIsTokenOwner(false);
  //     }
  //   };
  //   checkTokenOwnership();
  // }, [tokenId, address, nftManagerPositionsContract]);

  const hasAvailableIncentives = useMemo(() => {
    return activeIncentives.some(incentive => {
      console.log('incentive', incentive)
      return incentive.positionOnPoolIds?.includes(tokenId) && !incentive.positionOnIncentiveIds?.includes(tokenId)
    }
    );
  }, [activeIncentives]);

  const hasStakedIncentives = useMemo(() => {
    return allIncentives.some(incentive => incentive.positionOnIncentiveIds?.includes(tokenId));
  }, [allIncentives]);


  const handleStakeWithRefresh = useCallback(async (incentive: ProcessedIncentive) => {
    await handleStake(incentive);
    await refetchIncentives();
  }, [handleStake, refetchIncentives]);

  const handleUnstakeWithRefresh = useCallback(async (incentive: ProcessedIncentive) => {
    await handleUnstake(incentive);
    await refetchIncentives();
  }, [handleUnstake, refetchIncentives]);

  const handleClaimWithRefresh = useCallback(async (incentive: ProcessedIncentive) => {
    await handleClaim(incentive);
    await refetchIncentives();
  }, [handleClaim, refetchIncentives]);

  const handleBulkStakeWithRefresh = useCallback(async () => {
    await handleBulkStake();
    await refetchIncentives();
  }, [handleBulkStake, refetchIncentives]);

  const handleBulkUnstakeWithRefresh = useCallback(async () => {
    await handleBulkUnstake();
    await refetchIncentives();
  }, [handleBulkUnstake, refetchIncentives]);

  const handleBulkWithdrawWithRefresh = useCallback(async () => {
    await handleBulkWithdraw();
    await refetchIncentives();
  }, [handleBulkWithdraw, refetchIncentives]);

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
        <ThemedText.DeprecatedMain>Error loading incentives: {error.message}</ThemedText.DeprecatedMain>
      </Container>
    );
  }

  return (
    <Container>
      <Trans i18nKey="common.incentives" />

      <ButtonsContainer >
        <ButtonPrimary
          onClick={handleBulkStakeWithRefresh}
          disabled={isBulkStaking || !hasAvailableIncentives || hasStakedIncentives}
          style={{ padding: '8px', fontSize: '14px', height: '32px', whiteSpace: 'nowrap', width: '120px' }}
        >
          {isBulkStaking ? (
            <Trans i18nKey="common.staking" />
          ) : (
            <Trans i18nKey="common.stakeAll" />
          )}
        </ButtonPrimary>
        <ButtonPrimary
          onClick={handleBulkUnstakeWithRefresh}
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
          onClick={handleBulkWithdrawWithRefresh}
          disabled={isBulkWithdrawing || hasStakedIncentives}
          style={{ padding: '8px', fontSize: '14px', height: '32px', whiteSpace: 'nowrap', width: '120px' }}
        >
          {isBulkWithdrawing ? (
            <Trans i18nKey="common.withdrawing" />
          ) : (
            <Trans i18nKey="common.withdraw" />
          )}
        </ButtonPrimary>
      </ButtonsContainer>

      <ScrollableContent>
        {allIncentives.map((incentive) => {
          const isExpanded = expandedIncentive === incentive.id;
          const isActive = incentive.status === 'active';
          const hasStaked = incentive.positionOnIncentiveIds?.includes(Number(tokenId));
          console.log('incentive.positionOnIncentiveIds', incentive.positionOnIncentiveIds)
          const canStake = incentive.positionOnPoolIds?.includes(tokenId) && !hasStaked;
          const rewardToken = new Token(
            1,
            incentive.rewardToken.id,
            incentive.rewardToken.decimals,
            incentive.rewardToken.symbol
          );

          return (
            <IncentiveCard key={incentive.id} onClick={() => setExpandedIncentive(isExpanded ? null : incentive.id)}>
              <IncentiveHeader>
                <RowFixed>
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
                <RowFixed >
                  <IncentiveStatus isActive={isActive}>
                    {isActive ? <Trans i18nKey="common.active" /> : incentive.status === 'inactive' ? <Trans i18nKey="common.inactive" /> : <Trans i18nKey="common.ended" />}
                  </IncentiveStatus>
                </RowFixed>
              </IncentiveHeader>
              {isExpanded && (
                <IncentiveContent >
                  <RowBetween>
                    <ThemedText.DeprecatedMain>
                      <Trans i18nKey="common.accruedRewards" />
                    </ThemedText.DeprecatedMain>
                    <RowFixed >
                      <CurrencyLogo
                        currency={rewardToken}
                        size={20}
                        style={{ marginRight: '8px' }}
                        logoURI={`https://raw.githubusercontent.com/taraswap/assets/master/logos/${getAddress(rewardToken.address)}/logo.png`}
                      />
                      <ThemedText.DeprecatedMain>
                        {incentive.currentReward?.reward || '0'} {rewardToken.symbol}
                      </ThemedText.DeprecatedMain>
                    </RowFixed>
                  </RowBetween>
                  <Row  >
                    <ButtonPrimary
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStakeWithRefresh(incentive);
                      }}
                      disabled={!isActive || !canStake || isStaking || isBulkStaking}
                      style={{ padding: '8px', fontSize: '14px', height: '32px', width: '120px' }}
                    >
                      {isStaking  ? (
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
                      disabled={!hasStaked || isUnstaking  || isBulkUnstaking}
                      style={{ padding: '8px', fontSize: '14px', height: '32px', width: '120px' }}
                    >
                      {isUnstaking  ? (
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
                        disabled={Number(incentive.currentReward?.reward) <= 0|| (isClaiming)}
                        style={{ padding: '8px', fontSize: '14px', height: '32px', width: '120px' }}
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