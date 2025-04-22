import { useAccount } from "hooks/useAccount";
import { useV3StakerContract } from "hooks/useV3StakerContract";
import { useV3NFTPositionManagerContract } from "hooks/useContract";
import { useCallback, useState, useEffect } from "react";
import { IncentiveKey } from "hooks/usePosition";
import { ProcessedIncentive } from "hooks/useIncentivesData";
import { ethers } from "ethers";

export const useBulkPosition = (tokenId: number, poolAddress: string, allIncentives: ProcessedIncentive[]) => {
  const { address } = useAccount();
  const v3StakerContract = useV3StakerContract();
  const nftManagerPositionsContract = useV3NFTPositionManagerContract();
  const [isBulkStaking, setIsBulkStaking] = useState(false);
  const [isBulkUnstaking, setIsBulkUnstaking] = useState(false);
  const [isBulkWithdrawing, setIsBulkWithdrawing] = useState(false);
  const [isStaking, setIsStaking] = useState(false);
  const [isUnstaking, setIsUnstaking] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [currentIncentiveId, setCurrentIncentiveId] = useState<string | null>(null);
  const [isDeposited, setIsDeposited] = useState<boolean>(false);

  const checkDepositStatus = useCallback(async () => {
    if (!v3StakerContract || !address) return false;
    try {
      const deposit = await v3StakerContract.deposits(tokenId);
      const isDeposited = deposit.owner === address;
      setIsDeposited(isDeposited);
      return isDeposited;
    } catch (error) {
      console.error('Error checking deposit status:', error);
      return false;
    }
  }, [v3StakerContract, tokenId, address]);

  useEffect(() => {
    checkDepositStatus();
  }, [checkDepositStatus]);

  const getIncentiveData = useCallback(async (incentiveId: string) => {
    const incentive = allIncentives.find(inc => inc.id === incentiveId);
    if (!incentive) {
      return null
    }
    return incentive;
  }, [allIncentives]);

  const handleStake = useCallback(async (incentive: ProcessedIncentive) => {
    if (!v3StakerContract || !address || !nftManagerPositionsContract) return;
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
      const stakeReceipt = await stakeTx.wait();
      console.log('stakeReceipt', stakeReceipt)
    } catch (error) {
      console.error('Error staking:', error);
    } finally {
      setIsStaking(false);
      setCurrentIncentiveId(null);
    }
  }, [v3StakerContract, tokenId, address, getIncentiveData, nftManagerPositionsContract]);

  const handleUnstake = useCallback(async (incentive: ProcessedIncentive) => {
    if (!v3StakerContract || !address || !nftManagerPositionsContract) return;
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
  }, [v3StakerContract, tokenId, address, getIncentiveData, nftManagerPositionsContract]);

  const handleClaim = useCallback(async (incentive: ProcessedIncentive) => {
    if (!v3StakerContract || !address) return;
    setIsClaiming(true);
    setCurrentIncentiveId(incentive.id);

    try {
      const incentiveData = await getIncentiveData(incentive.id);
      if (!incentiveData) {
        throw new Error('Failed to fetch incentive data');
      }

      const reward = await v3StakerContract.rewards(
        incentive.rewardToken.id,
        address
      );
      console.log('Reward amount before claim:', reward.toString());
      
      if (reward.lte(0)) {
        console.log('No rewards available to claim');
        return;
      }

      const claimTx = await v3StakerContract.claimReward(
        incentive.rewardToken.id,
        address,
        reward
      );
      const claimReceipt = await claimTx.wait();
      console.log('Claim transaction receipt:', claimReceipt);
    } catch (error) {
      console.error('Error claiming:', error);
    } finally {
      setIsClaiming(false);
      setCurrentIncentiveId(null);
    }
  }, [v3StakerContract, address, getIncentiveData]);

  const handleBulkStake = useCallback(async () => {
    if (!v3StakerContract || !address || !nftManagerPositionsContract) return;
    setIsBulkStaking(true);

    try {
      const incentivesToStake = allIncentives.filter(
        (incentive) => incentive.status === 'active'
      );

      if (incentivesToStake.length === 0) {
        throw new Error('No incentives available to stake');
      }

      const deposit = await v3StakerContract.deposits(tokenId);
      console.log('deposit', deposit)
      const isDeposited = deposit.owner === address;
      console.log('isDeposited', isDeposited)

      if (isDeposited) {
        const stakeCalls = incentivesToStake.map((incentive) => {
          const incentiveKey = {
            rewardToken: incentive.rewardToken.id,
            pool: incentive.poolAddress,
            startTime: incentive.startTime,
            endTime: incentive.endTime,
            vestingPeriod: parseInt(incentive.vestingPeriod),
            refundee: incentive.refundee,
          };
          return v3StakerContract.interface.encodeFunctionData('stakeToken', [incentiveKey, tokenId]);
        });

        const stakeTx = await v3StakerContract.multicall(stakeCalls, {
          gasLimit: 500000
        });
        const receipt = await stakeTx.wait();
        console.log('receipt', receipt)
        return
      }
      
      const incentiveKeys = await Promise.all(
        incentivesToStake.map(async (incentive) => {
          const key = [
            incentive.rewardToken.id,
            incentive.poolAddress,
            incentive.startTime,
            incentive.endTime,
            incentive.vestingPeriod,
            incentive.refundee
          ];
          return key;
        }));

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
      console.log('receipt', receipt)

    } catch (error) {
      console.error('Error in bulk staking:', error);
      throw error;
    } finally {
      setIsBulkStaking(false);
    }
  }, [v3StakerContract, tokenId, address, allIncentives, nftManagerPositionsContract]);


  const handleBulkUnstake = useCallback(async () => {
    if (!v3StakerContract || !address || !nftManagerPositionsContract) return;
    setIsBulkUnstaking(true);

    try {
      const stakedIncentives = allIncentives.filter(
        (incentive) => incentive.hasUserPositionInIncentive && incentive.hasUserPositionInPool
      );
      console.log('stakedIncentives', stakedIncentives)

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

      console.log('incentiveKeys', incentiveKeys)
      console.log('tokenId', tokenId)
      const unstakeCalls = incentiveKeys.map((key) => {
        console.log('key', key)
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
      console.log('receipt', receipt)

    } catch (error) {
      console.error('Error in bulk unstaking:', error);
      throw error;
    } finally {
      setIsBulkUnstaking(false);
    }
  }, [v3StakerContract, tokenId, address, allIncentives, nftManagerPositionsContract]);


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
      // Refresh deposit status after successful withdrawal
      await checkDepositStatus();
    } catch (error) {
      console.error('Error in bulk withdrawal:', error);
      throw error;
    } finally {
      setIsBulkWithdrawing(false);
    }
  }, [v3StakerContract, tokenId, address, nftManagerPositionsContract, checkDepositStatus]);

  const checkStakeStatus = useCallback(async (positionId: number, incentiveId: string) => {
    if (!v3StakerContract) return null;
    try {
      const stake = await v3StakerContract.stakes(positionId, incentiveId);
      console.log('Stake status:', {
        positionId,
        incentiveId,
        liquidity: stake.toString()
      });
      return stake;
    } catch (error) {
      console.error('Error checking stake status:', error);
      return null;
    }
  }, [v3StakerContract]);

  return {
    isBulkStaking,
    isBulkUnstaking,
    isBulkWithdrawing,
    isStaking,
    isUnstaking,
    isClaiming,
    currentIncentiveId,
    isDeposited,
    getIncentiveData,
    handleStake,
    handleUnstake,
    handleClaim,
    handleBulkStake,
    handleBulkUnstake,
    handleBulkWithdraw,
    checkStakeStatus
  };
}; 