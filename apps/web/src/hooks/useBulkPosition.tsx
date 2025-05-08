import { useAccount } from "hooks/useAccount";
import { useV3StakerContract } from "hooks/useV3StakerContract";
import { useV3NFTPositionManagerContract } from "hooks/useContract";
import { useCallback, useState, useEffect } from "react";
import { IncentiveKey, RewardInfo } from "hooks/usePosition";
import { ProcessedIncentive } from "hooks/useIncentivesData";
import { ethers } from "ethers";

export const useBulkPosition = (
  tokenId: number,
  poolAddress: string,
  allIncentives: ProcessedIncentive[]
) => {
  const { address } = useAccount();
  const v3StakerContract = useV3StakerContract();
  const nftManagerPositionsContract = useV3NFTPositionManagerContract();
  const [isDeposited, setIsDeposited] = useState<boolean>(false);

  const checkDepositStatus = useCallback(async () => {
    if (!v3StakerContract || !address) return false;
    try {
      const deposit = await v3StakerContract.deposits(tokenId);
      const isDeposited = deposit.owner === address;
      setIsDeposited(isDeposited);
      return isDeposited;
    } catch (error) {
      console.error("Error checking deposit status:", error);
      return false;
    }
  }, [v3StakerContract, tokenId, address]);

  useEffect(() => {
    checkDepositStatus();
  }, [checkDepositStatus]);

  const getIncentiveData = useCallback(
    async (incentiveId: string) => {
      const incentive = allIncentives.find((inc) => inc.id === incentiveId);
      if (!incentive) {
        return null;
      }
      return incentive;
    },
    [allIncentives]
  );

  const handleStake = useCallback(
    async (incentive: ProcessedIncentive) => {
      if (!v3StakerContract || !address || !nftManagerPositionsContract) return;

      try {
        const incentiveData = await getIncentiveData(incentive.id);
        if (!incentiveData) {
          throw new Error("Failed to fetch incentive data");
        }

        const deposit = await v3StakerContract.deposits(tokenId);
        const isDeposited = deposit.owner === address;

        if (!isDeposited) {
          const incentiveKey = [
            incentiveData.rewardToken.id,
            incentiveData.poolAddress,
            incentiveData.startTime,
            incentiveData.endTime,
            incentiveData.vestingPeriod,
            incentiveData.refundee,
          ];

          const data = ethers.utils.defaultAbiCoder.encode(
            ["tuple(address,address,uint256,uint256,uint256,address)[]"],
            [[incentiveKey]]
          );

          const transferTx = await nftManagerPositionsContract[
            "safeTransferFrom(address,address,uint256,bytes)"
          ](address, v3StakerContract.address, tokenId, data, {
            gasLimit: 500000,
          });
          await transferTx.wait();
        }

        const incentiveKey: IncentiveKey = {
          rewardToken: incentiveData.rewardToken.id,
          pool: incentiveData.poolAddress,
          startTime: incentiveData.startTime,
          endTime: incentiveData.endTime,
          vestingPeriod: parseInt(incentiveData.vestingPeriod),
          refundee: incentiveData.refundee,
        };

        const stakeTx = await v3StakerContract.stakeToken(
          incentiveKey,
          Number(tokenId)
        );
        return stakeTx;
      } catch (error) {
        console.error("Error staking:", error);
        throw error;
      }
    },
    [
      v3StakerContract,
      tokenId,
      address,
      getIncentiveData,
      nftManagerPositionsContract,
    ]
  );

  const handleUnstake = useCallback(
    async (incentive: ProcessedIncentive) => {
      if (!v3StakerContract || !address || !nftManagerPositionsContract) return;

      try {
        const incentiveData = await getIncentiveData(incentive.id);
        if (!incentiveData) {
          throw new Error("Failed to fetch incentive data");
        }

        const incentiveKey: IncentiveKey = {
          rewardToken: incentiveData.rewardToken.id,
          pool: incentiveData.poolAddress,
          startTime: incentiveData.startTime,
          endTime: incentiveData.endTime,
          vestingPeriod: parseInt(incentiveData.vestingPeriod),
          refundee: incentiveData.refundee,
        };

        const unstakeTx = await v3StakerContract.unstakeToken(
          incentiveKey,
          tokenId
        );
        return unstakeTx;
      } catch (error) {
        console.error("Error unstaking:", error);
        throw error;
      }
    },
    [
      v3StakerContract,
      tokenId,
      address,
      getIncentiveData,
      nftManagerPositionsContract,
    ]
  );

  const handleClaim = useCallback(
    async (incentive: ProcessedIncentive) => {
      if (!v3StakerContract || !address) return;

      try {
        const incentiveData = await getIncentiveData(incentive.id);
        if (!incentiveData) {
          throw new Error("Failed to fetch incentive data");
        }

        const reward = await v3StakerContract.rewards(
          incentive.rewardToken.id,
          address
        );

        if (reward.lte(0)) {
          return;
        }

        const claimTx = await v3StakerContract.claimReward(
          incentive.rewardToken.id,
          address,
          reward
        );
        return claimTx;
      } catch (error) {
        console.error("Error claiming:", error);
        throw error;
      }
    },
    [v3StakerContract, address, getIncentiveData]
  );

  const handleBulkStake = useCallback(async () => {
    if (!v3StakerContract || !address || !nftManagerPositionsContract) return;

    try {
      const incentivesToStake = allIncentives.filter(
        (incentive) => incentive.status === "active"
      );

      if (incentivesToStake.length === 0) {
        throw new Error("No incentives available to stake");
      }

      const deposit = await v3StakerContract.deposits(tokenId);
      const isDeposited = deposit.owner === address;

      if (!isDeposited) {
        const incentiveKeys = await Promise.all(
          incentivesToStake.map(async (incentive) => {
            const key = [
              incentive.rewardToken.id,
              incentive.poolAddress,
              incentive.startTime,
              incentive.endTime,
              incentive.vestingPeriod,
              incentive.refundee,
            ];
            return key;
          })
        );

        const data = ethers.utils.defaultAbiCoder.encode(
          ["tuple(address,address,uint256,uint256,uint256,address)[]"],
          [incentiveKeys]
        );

        const transferTx = await nftManagerPositionsContract[
          "safeTransferFrom(address,address,uint256,bytes)"
        ](address, v3StakerContract.address, tokenId, data, {
          gasLimit: 500000,
        });
        const tx = await transferTx.wait();
        return tx;
      }

      const stakeCalls = incentivesToStake.map((incentive) => {
        const incentiveKey = {
          rewardToken: incentive.rewardToken.id,
          pool: incentive.poolAddress,
          startTime: incentive.startTime,
          endTime: incentive.endTime,
          vestingPeriod: parseInt(incentive.vestingPeriod),
          refundee: incentive.refundee,
        };
        return v3StakerContract.interface.encodeFunctionData("stakeToken", [
          incentiveKey,
          tokenId,
        ]);
      });

      const stakeTx = await v3StakerContract.multicall(stakeCalls, {
        gasLimit: 500000,
      });
      return stakeTx;
    } catch (error) {
      console.error("Error in bulk staking:", error);
      throw error;
    }
  }, [
    v3StakerContract,
    tokenId,
    address,
    allIncentives,
    nftManagerPositionsContract,
  ]);

  const handleBulkUnstake = useCallback(async () => {
    if (!v3StakerContract || !address || !nftManagerPositionsContract) return;

    try {
      const stakedIncentives = allIncentives.filter(
        (incentive) =>
          incentive.hasUserPositionInIncentive &&
          incentive.hasUserPositionInPool
      );

      if (stakedIncentives.length === 0) {
        throw new Error("No staked incentives to unstake from");
      }

      const incentiveKeys = await Promise.all(
        stakedIncentives.map(async (incentive) => {
          const key = [
            incentive.rewardToken.id,
            incentive.poolAddress,
            incentive.startTime,
            incentive.endTime,
            incentive.vestingPeriod,
            incentive.refundee,
          ];
          return key;
        })
      );

      const unstakeCalls = incentiveKeys.map((key) => {
        const callData = v3StakerContract.interface.encodeFunctionData(
          "unstakeToken",
          [key, tokenId]
        );
        return callData;
      });

      const unstakeTx = await v3StakerContract.multicall(unstakeCalls, {
        gasLimit: 500000,
      });
      await unstakeTx.wait();
      await checkDepositStatus();
      return unstakeTx;
    } catch (error) {
      console.error("Error in bulk unstaking:", error);
      throw error;
    }
  }, [
    v3StakerContract,
    tokenId,
    address,
    allIncentives,
    nftManagerPositionsContract,
    checkDepositStatus,
  ]);

  const handleBulkWithdraw = useCallback(async () => {
    if (!v3StakerContract || !address || !nftManagerPositionsContract) return;
    try {
      const withdrawTx = await v3StakerContract.withdrawToken(
        tokenId,
        address,
        []
      );
      await withdrawTx.wait();
      await checkDepositStatus();
      return withdrawTx;
    } catch (error) {
      console.error("Error in bulk withdrawal:", error);
      throw error;
    }
  }, [
    v3StakerContract,
    tokenId,
    address,
    nftManagerPositionsContract,
    checkDepositStatus,
  ]);

  const checkStakeStatus = useCallback(
    async (positionId: number, incentiveId: string) => {
      if (!v3StakerContract) return null;
      try {
        const stake = await v3StakerContract.stakes(positionId, incentiveId);
        return stake;
      } catch (error) {
        console.error("Error checking stake status:", error);
        return null;
      }
    },
    [v3StakerContract]
  );

  const getIncentivePendingRewards = useCallback(
    async (incentive: ProcessedIncentive | {
      rewardToken: {
        id: string;
        symbol: string;
        decimals: number;
      };
      poolAddress: string;
      startTime: number;
      endTime: number;
      vestingPeriod: string;
      refundee: string;
    }) => {
      if (!v3StakerContract) return null;
      try {
        const incentiveKey: IncentiveKey = {
          rewardToken: incentive.rewardToken.id,
          pool: incentive.poolAddress,
          startTime: incentive.startTime,
          endTime: incentive.endTime,
          vestingPeriod: parseInt(incentive.vestingPeriod),
          refundee: incentive.refundee,
        };

        const pendingRewards: RewardInfo = await v3StakerContract.getRewardInfo(
          incentiveKey,
          tokenId
        );
        return pendingRewards.reward;
      } catch (error) {
        console.error("Error getting pending rewards:", error);
        return null;
      }
    },
    [v3StakerContract, tokenId]
  );

  useEffect(() => {
    checkDepositStatus();
  }, [checkDepositStatus, allIncentives]);

  return {
    isDeposited,
    getIncentiveData,
    getIncentivePendingRewards,
    handleStake,
    handleUnstake,
    handleClaim,
    handleBulkStake,
    handleBulkUnstake,
    handleBulkWithdraw,
    checkStakeStatus,
  };
};
