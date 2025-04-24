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
  const nftManagerPositionsContract = useV3NFTPositionManagerContract();
  const [isBulkStaking, setIsBulkStaking] = useState(false);
  const [isBulkUnstaking, setIsBulkUnstaking] = useState(false);
  const [isBulkWithdrawing, setIsBulkWithdrawing] = useState(false);
  const [isBulkClaiming, setIsBulkClaiming] = useState(false);
  const [isTokenOwner, setIsTokenOwner] = useState(false);
  const [hasRewards, setHasRewards] = useState(false);
  const [isStaking, setIsStaking] = useState(false);
  const [isUnstaking, setIsUnstaking] = useState(false);
  const [currentIncentiveId, setCurrentIncentiveId] = useState<string | null>(null);

  const { activeIncentives, endedIncentives, isLoading, error } = useIncentivesData(poolAddress);
  const allIncentives = [...activeIncentives, ...endedIncentives];

  const hasAvailableIncentives = useMemo(() => {
    return activeIncentives.some(incentive => incentive.hasUserPositionInPool && !incentive.hasUserPositionInIncentive);
  }, [activeIncentives]);

  const hasStakedIncentives = useMemo(() => {
    return allIncentives.some(incentive => incentive.hasUserPositionInPool && incentive.hasUserPositionInIncentive);
  }, [allIncentives]);

  const canWithdraw = useMemo(() => {
    return isTokenOwner && !hasStakedIncentives;
  }, [isTokenOwner, hasStakedIncentives]);

  const getIncentiveData = useCallback(async (incentiveId: string) => {
    const incentive = allIncentives.find(inc => inc.id === incentiveId);
    if (!incentive) {
      return null
    }
    return incentive;
  }, [address, allIncentives]);

  useEffect(() => {
    const checkTokenOwnership = async () => {
      if (!v3StakerContract || !address) {
        setIsTokenOwner(false);
        return;
      }

      try {
        const deposit = await v3StakerContract.deposits(tokenId);
        setIsTokenOwner(deposit.owner.toLowerCase() === address.toLowerCase());
      } catch (error) {
        console.error('Error checking token ownership:', error);
        setIsTokenOwner(false);
      }
    };

    checkTokenOwnership();
  }, [v3StakerContract, address, tokenId]);

  useEffect(() => {
    const checkRewards = async () => {
      if (!v3StakerContract || !address) {
        setHasRewards(false);
        return;
      }

      try {
        let totalRewards = 0;
        for (const incentive of allIncentives) {
          if (incentive.hasUserPositionInIncentive && incentive.currentReward) {
            totalRewards += Number(incentive.currentReward.reward);
          }
        }
        setHasRewards(totalRewards > 0);
      } catch (error) {
        console.error('Error checking rewards:', error);
        setHasRewards(false);
      }
    };

    checkRewards();
  }, [v3StakerContract, address, allIncentives]);

  const handleStake = useCallback(async (incentive: ProcessedIncentive) => {
    if (!v3StakerContract || !address) return;
    setIsStaking(true);
    setCurrentIncentiveId(incentive.id);

    try {
      const incentiveData = await getIncentiveData(incentive.id);
      if (!incentiveData) {
        throw new Error('Failed to fetch incentive data');
      }

      const incentiveKey: IncentiveKey = {
        rewardToken: incentiveData.rewardToken.id,
        pool: incentiveData.poolAddress,
        startTime: incentiveData.startTime,
        endTime: incentiveData.endTime,
        vestingPeriod: parseInt(incentiveData.vestingPeriod),
        refundee: incentiveData.refundee,
      };

      const stakeTx = await v3StakerContract.stakeToken(incentiveKey, tokenId);
      await stakeTx.wait();
    } catch (error) {
      console.error('Error staking:', error);
    } finally {
      setIsStaking(false);
      setCurrentIncentiveId(null);
    }
  }, [v3StakerContract, tokenId, address, getIncentiveData]);

  const handleUnstake = useCallback(async (incentive: ProcessedIncentive) => {
    if (!v3StakerContract || !address) return;
    setIsUnstaking(true);
    setCurrentIncentiveId(incentive.id);

    try {
      const incentiveData = await getIncentiveData(incentive.id);
      if (!incentiveData) {
        throw new Error('Failed to fetch incentive data');
      }

      const incentiveKey: IncentiveKey = {
        rewardToken: incentiveData.rewardToken.id,
        pool: incentiveData.poolAddress,
        startTime: incentiveData.startTime,
        endTime: incentiveData.endTime,
        vestingPeriod: parseInt(incentiveData.vestingPeriod),
        refundee: incentiveData.refundee,
      };

      const unstakeTx = await v3StakerContract.unstakeToken(incentiveKey, tokenId);
      await unstakeTx.wait();
    } catch (error) {
      console.error('Error unstaking:', error);
    } finally {
      setIsUnstaking(false);
      setCurrentIncentiveId(null);
    }
  }, [v3StakerContract, tokenId, address, getIncentiveData]);

  const handleClaim = useCallback(async (incentive: ProcessedIncentive) => {
    if (!v3StakerContract || !address) return;

    try {
      const incentiveData = await getIncentiveData(incentive.id);
      if (!incentiveData) {
        throw new Error('Failed to fetch incentive data');
      }

      const reward = await v3StakerContract.rewards(
        incentive.rewardToken.id,
        address
      );
      const claimTx = await v3StakerContract.claimReward(
        incentive.rewardToken.id,
        address,
        reward
      );
      const claimReceipt = await claimTx.wait();
    } catch (error) {
      console.error('Error claiming:', error);
    }
  }, [v3StakerContract, address, getIncentiveData]);

  const handleBulkStake = useCallback(async () => {
    if (!v3StakerContract || !address || !nftManagerPositionsContract) return;
    setIsBulkStaking(true);

    try {
      const incentivesToStake = activeIncentives.filter(
        (incentive) => !incentive.hasUserPositionInIncentive
      );

      if (incentivesToStake.length === 0) {
        throw new Error('No incentives available to stake');
      }


      const incentiveKeys = await Promise.all(
        incentivesToStake.map(async (incentive) => {
          const key = [
            incentive.token1Address,
            incentive.poolAddress,
            incentive.startTime,
            incentive.endTime,
            incentive.vestingPeriod,
            incentive.refundee
          ];
          return key;
        }))

      const data = ethers.utils.defaultAbiCoder.encode(
        ['tuple(address,address,uint256,uint256,uint256,address)[]'],
        [incentiveKeys]
      );

      const transferTx = await nftManagerPositionsContract[
        'safeTransferFrom(address,address,uint256,bytes)'
      ](address, v3StakerContract.address, tokenId, data, {
        gasLimit: 500000
      });

      const receipt = await transferTx.wait();

    } catch (error) {
      console.error('Error in bulk staking:', error);
      throw error;
    } finally {
      setIsBulkStaking(false);
    }
  }, [v3StakerContract, tokenId, address, getIncentiveData, activeIncentives, nftManagerPositionsContract]);

  const handleBulkUnstake = useCallback(async () => {
    if (!v3StakerContract || !address || !nftManagerPositionsContract) return;
    setIsBulkUnstaking(true);

    try {
      const stakedIncentives = allIncentives.filter(
        (incentive) => incentive.hasUserPositionInIncentive
      );

      if (stakedIncentives.length === 0) {
        throw new Error('No staked incentives to unstake from');
      }

      const incentiveKeys = await Promise.all(
        stakedIncentives.map(async (incentive) => {
          const key = [
            incentive.rewardToken.id,
            incentive.poolAddress,
            incentive.startTime,
            incentive.endTime,
            incentive.vestingPeriod,
            incentive.refundee
          ];
          return key;
        })
      );

      const unstakeCalls = incentiveKeys.map((key) => {
        const callData = v3StakerContract.interface.encodeFunctionData('unstakeToken', [
          key,
          tokenId
        ]);
        return callData;
      });

      const unstakeTx = await v3StakerContract.multicall(unstakeCalls, {
        gasLimit: 500000
      });

      const receipt = await unstakeTx.wait();

    } catch (error) {
      console.error('Error in bulk unstaking:', error);
      throw error;
    } finally {
      setIsBulkUnstaking(false);
    }
  }, [v3StakerContract, tokenId, address, getIncentiveData, allIncentives, nftManagerPositionsContract]);

  const handleBulkWithdraw = useCallback(async () => {
    if (!v3StakerContract || !address || !nftManagerPositionsContract) return;
    setIsBulkWithdrawing(true);
    try {
      const withdrawTx = await v3StakerContract.withdrawToken(
        tokenId,
        address,
        []
      );
      const withdrawReceipt = await withdrawTx.wait();
    } catch (error) {
      console.error('Error in bulk withdrawal:', error);
      throw error;
    } finally {
      setIsBulkWithdrawing(false);
    }
  }, [v3StakerContract, tokenId, address, nftManagerPositionsContract, allIncentives]);

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
                        style={{ padding: '8px', fontSize: '14px', height: '32px', width: '120px' }}
                      >
                        <Trans i18nKey="common.claim" />
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