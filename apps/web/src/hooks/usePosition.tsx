import {
  EXACT_INCENTIVE_QUERY,
  Incentive,
  indexerTaraswap,
} from "components/Incentives/types";
import { BigNumber } from "ethers";
import { useAccount } from "hooks/useAccount";
import { useV3NFTPositionManagerContract } from "hooks/useContract";
import { useV3StakerContract } from "hooks/useV3StakerContract";
import { useCallback, useEffect, useState } from "react";

export interface PositionDetails {
  owner: string;
  numberOfStakes: number;
  tickLower: number;
  tickUpper: number;
}

export interface RewardInfo {
  reward: BigNumber;
  maxRewards: BigNumber;
  secondsInsideX128: BigNumber;
}

export interface IncentiveKey {
  rewardToken: string;
  pool: string;
  startTime: number;
  endTime: number;
  vestingPeriod: number;
  refundee: string;
}

const usePosition = (tokenId: number, incentiveId: string) => {
  const { address } = useAccount();
  const v3StakerContract = useV3StakerContract();
  const nftManagerPositionsContract = useV3NFTPositionManagerContract();

  const [incentive, setIncentive] = useState<Incentive | null>(null);
  const [isApproving, setIsApproving] = useState<boolean>(false);
  const [isTransferring, setIsTransferring] = useState<boolean>(false);
  const [isStaking, setIsStaking] = useState<boolean>(false);
  const [isUnstaking, setIsUnstaking] = useState<boolean>(false);
  const [isClaiming, setIsClaiming] = useState<boolean>(false);
  const [isWithdrawing, setIsWithdrawing] = useState<boolean>(false);
  const [isEndingIncentive, setIsEndingIncentive] = useState<boolean>(false);
  const [isFetchingRewardInfo, setIsFetchingRewardInfo] =
    useState<boolean>(false);

  const fetchIncentive = useCallback(
    async (incentiveId: string): Promise<Incentive | null> => {
      if (!indexerTaraswap || !incentiveId) {
        return null;
      }
      const response = await fetch(indexerTaraswap, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: EXACT_INCENTIVE_QUERY,
          variables: { id: incentiveId },
        }),
      });
      const data = await response.json();
      if (data && data.data && data.data.incentive) {
        return data.data.incentive;
      }
      return null;
    },
    [indexerTaraswap, incentiveId]
  );

  useEffect(() => {
    if (!incentiveId) return;
    fetchIncentive(incentiveId).then((incentive) => {
      if (incentive) {
        setIncentive(incentive);
      }
    });
  }, [incentiveId, fetchIncentive]);

  useEffect(() => {
    getRewardInfo();
  }, [isTransferring, isStaking, isUnstaking, isClaiming, isWithdrawing]);

  const isApprovedForTransfer = useCallback(async (): Promise<boolean> => {
    if (!nftManagerPositionsContract) return false;

    try {
      const approvedAddress = await nftManagerPositionsContract.getApproved(
        tokenId
      );
      return (
        approvedAddress.toLowerCase() ===
        v3StakerContract?.address.toLowerCase()
      );
    } catch (e) {
      console.warn(e);
      return false;
    }
  }, [nftManagerPositionsContract]);

  const approve = useCallback(
    async (next: () => void) => {
      if (!(nftManagerPositionsContract && v3StakerContract && incentiveId))
        return;

      try {
        setIsApproving(true);
        const approveTx = await nftManagerPositionsContract.approve(
          v3StakerContract.address,
          tokenId
        );
        await approveTx.wait();
        next();
      } catch (e) {
        console.warn(e);
      } finally {
        setIsApproving(false);
      }
    },
    [tokenId, incentiveId, v3StakerContract, nftManagerPositionsContract]
  );

  const transfer = useCallback(
    async (next: () => void) => {
      if (
        !(
          address &&
          nftManagerPositionsContract &&
          v3StakerContract &&
          incentiveId
        )
      )
        return;

      try {
        setIsTransferring(true);
        const transferTx = await nftManagerPositionsContract[
          "safeTransferFrom(address,address,uint256)"
        ](address, v3StakerContract.address, tokenId);
        await transferTx.wait();
        next();
      } catch (e) {
        console.warn(e);
      } finally {
        setIsTransferring(false);
      }
    },
    [
      tokenId,
      incentiveId,
      v3StakerContract,
      nftManagerPositionsContract,
      address,
    ]
  );

  const getAccruedRewards = useCallback(async (): Promise<
    BigNumber | undefined
  > => {
    if (!(v3StakerContract && incentive)) return;

    try {
      setIsFetchingRewardInfo(true);
      const accruedRewards = await v3StakerContract.rewards(
        incentive.rewardToken.id,
        address
      );
      return accruedRewards;
    } catch (e) {
      console.warn(e);
      return undefined;
    } finally {
      setIsFetchingRewardInfo(false);
    }
  }, [incentive, v3StakerContract, address]);

  const stakePosition = useCallback(
    async (next: () => void) => {
      if (!(v3StakerContract && incentive)) return;

      try {
        setIsStaking(true);
        const incentiveKey = buildIncentiveIdFromIncentive(incentive);
        const stakeTx = await v3StakerContract.stakeToken(
          incentiveKey,
          tokenId
        );
        await stakeTx.wait();
        next();
      } catch (e) {
        console.warn(e);
      } finally {
        setIsStaking(false);
      }
    },
    [tokenId, incentive, v3StakerContract]
  );

  const unstakePosition = useCallback(
    async (next: () => void) => {
      if (!(v3StakerContract && incentive)) return;

      try {
        setIsUnstaking(true);
        const incentiveKey = buildIncentiveIdFromIncentive(incentive);
        const unstakeTx = await v3StakerContract.unstakeToken(
          incentiveKey,
          tokenId
        );
        await unstakeTx.wait();
        next();
      } catch (e) {
        console.warn(e);
      } finally {
        setIsUnstaking(false);
      }
    },
    [tokenId, incentive, v3StakerContract]
  );

  const claim = useCallback(
    async (next: () => void) => {
      if (!(v3StakerContract && incentive && address)) return;

      try {
        setIsClaiming(true);
        const reward = await v3StakerContract.rewards(
          incentive.rewardToken.id,
          address
        );
        const claimTx = await v3StakerContract.claimReward(
          incentive.rewardToken.id,
          address,
          reward
        );
        await claimTx.wait();
        next();
      } catch (e) {
        console.warn(e);
      } finally {
        setIsClaiming(false);
      }
    },
    [incentive, address, v3StakerContract]
  );

  const withdrawPosition = useCallback(
    async (next: () => void) => {
      if (!(v3StakerContract && address)) return;

      try {
        setIsWithdrawing(true);
        const withdrawTx = await v3StakerContract.withdrawToken(
          tokenId,
          address,
          []
        );
        await withdrawTx.wait();
        next();
      } catch (e) {
        console.warn(e);
      } finally {
        setIsWithdrawing(false);
      }
    },
    [tokenId, address, v3StakerContract]
  );

  const endIncentive = useCallback(
    async (next: () => void) => {
      if (!(v3StakerContract && incentive)) return;

      try {
        setIsEndingIncentive(true);
        const incentiveKey = buildIncentiveIdFromIncentive(incentive);
        const endIncentiveTx = await v3StakerContract.endIncentive(
          incentiveKey
        );
        await endIncentiveTx.wait();
        next();
      } catch (e) {
        console.warn(e);
      } finally {
        setIsEndingIncentive(false);
      }
    },
    [incentive, v3StakerContract]
  );

  const getRewardInfo = useCallback(async (): Promise<
    RewardInfo | null | undefined
  > => {
    if (!(v3StakerContract && address && incentive)) return null;

    try {
      setIsFetchingRewardInfo(true);
      const incentiveKey = buildIncentiveIdFromIncentive(incentive);
      const rewardInfo: RewardInfo = await v3StakerContract.getRewardInfo(
        incentiveKey,
        tokenId
      );
      setIsFetchingRewardInfo(false);
      return rewardInfo;
    } catch (e) {
      console.warn(e);
      setIsFetchingRewardInfo(false);
      return undefined;
    }
  }, [tokenId, incentive, v3StakerContract, address]);

  const isDeposited = useCallback(async (): Promise<boolean> => {
    if (!nftManagerPositionsContract || !v3StakerContract) return false;

    try {
      const owner = await nftManagerPositionsContract.ownerOf(tokenId);
      return owner.toLowerCase() === v3StakerContract.address.toLowerCase();
    } catch (e) {
      console.warn(e);
      return false;
    }
  }, [tokenId, address, nftManagerPositionsContract, v3StakerContract]);

  return {
    incentive,
    getAccruedRewards,
    isFetchingRewardInfo,
    isApproving,
    isTransferring,
    isStaking,
    isEndingIncentive,
    isUnstaking,
    isClaiming,
    isWithdrawing,
    isDeposited,
    isApprovedForTransfer,
    getRewardInfo,
    approve,
    transfer,
    stakePosition,
    unstakePosition,
    claim,
    withdrawPosition,
    endIncentive,
  };
};

export const buildIncentiveIdFromIncentive = (
  incentive: Incentive
): IncentiveKey => {
  return {
    rewardToken: incentive.rewardToken.id,
    pool: incentive.pool.id,
    startTime: parseInt(incentive.startTime),
    endTime: parseInt(incentive.endTime),
    vestingPeriod: parseInt(incentive.vestingPeriod),
    refundee: incentive.refundee,
  };
};

export default usePosition;
