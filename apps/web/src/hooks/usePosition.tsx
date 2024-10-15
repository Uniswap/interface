import {
  EXACT_INCENTIVE_QUERY,
  indexerTaraswap,
} from "components/Incentives/types";
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
  pendingRewards: number;
  maxRewards: number;
  secondsInsideX128: number;
}

export interface IncentiveKey {
  rewardToken: string;
  pool: string;
  startTime: number;
  endTime: number;
  vestingPeriod: number;
  refundee: string;
}

export interface Incentive {
  id: string;
  rewardToken: {
    id: string;
  };
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
  const [isLoading, setIsLoading] = useState<boolean>(false);

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
        setIsLoading(true);
        await nftManagerPositionsContract.approve(
          v3StakerContract.address,
          tokenId
        );
        next();
      } catch (e) {
        console.warn(e);
      } finally {
        setIsLoading(false);
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
        setIsLoading(true);
        await nftManagerPositionsContract[
          "safeTransferFrom(address,address,uint256)"
        ](address, v3StakerContract.address, tokenId);
        next();
      } catch (e) {
        console.warn(e);
      } finally {
        setIsLoading(false);
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

  const stakePosition = useCallback(
    async (next: () => void) => {
      if (!(v3StakerContract && incentive)) return;

      try {
        setIsLoading(true);
        const incentiveKey = buildIncentiveIdFromIncentive(incentive);
        await v3StakerContract.stakeToken(incentiveKey, tokenId);
        next();
      } catch (e) {
        console.warn(e);
      } finally {
        setIsLoading(false);
      }
    },
    [tokenId, incentive, v3StakerContract]
  );

  const unstakePosition = useCallback(
    async (next: () => void) => {
      if (!(v3StakerContract && incentive)) return;

      try {
        setIsLoading(true);
        const incentiveKey = buildIncentiveIdFromIncentive(incentive);
        await v3StakerContract.unstakeToken(incentiveKey, tokenId);
        next();
      } catch (e) {
        console.warn(e);
      } finally {
        setIsLoading(false);
      }
    },
    [tokenId, incentive, v3StakerContract]
  );

  const claim = useCallback(
    async (next: () => void) => {
      if (!(v3StakerContract && incentive && address)) return;

      try {
        setIsLoading(true);
        const reward = await v3StakerContract.rewards(
          incentive.rewardToken.id,
          address
        );
        await v3StakerContract.claimReward(
          incentive.rewardToken.id,
          address,
          reward
        );
        next();
      } catch (e) {
        console.warn(e);
      } finally {
        setIsLoading(false);
      }
    },
    [incentive, address, v3StakerContract]
  );

  const withdrawPosition = useCallback(
    async (next: () => void) => {
      if (!(v3StakerContract && address)) return;

      try {
        setIsLoading(true);
        await v3StakerContract.withdrawToken(tokenId, address, []);
        next();
      } catch (e) {
        console.warn(e);
      } finally {
        setIsLoading(false);
      }
    },
    [tokenId, address, v3StakerContract]
  );

  const getDepositData =
    useCallback(async (): Promise<PositionDetails | null> => {
      if (!(v3StakerContract && address)) return null;

      try {
        setIsLoading(true);
        const depositData: PositionDetails = await v3StakerContract.deposits(
          tokenId
        );
        return depositData;
      } catch (e) {
        console.warn(e);
        return null;
      } finally {
        setIsLoading(false);
      }
    }, [tokenId, address, v3StakerContract]);

  const getRewardInfo = useCallback(async (): Promise<RewardInfo | null> => {
    if (!(v3StakerContract && address && incentive)) return null;

    try {
      setIsLoading(true);
      const incentiveKey = buildIncentiveIdFromIncentive(incentive);
      const rewardInfo: RewardInfo = await v3StakerContract.getRewardInfo(
        incentiveKey,
        tokenId
      );
      return rewardInfo;
    } catch (e) {
      console.warn(e);
      return null;
    } finally {
      setIsLoading(false);
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
    isLoading,
    isDeposited,
    isApprovedForTransfer,
    getDepositData,
    getRewardInfo,
    approve,
    transfer,
    stakePosition,
    unstakePosition,
    claim,
    withdrawPosition,
  };
};

const buildIncentiveIdFromIncentive = (incentive: Incentive): IncentiveKey => {
  return {
    rewardToken: incentive.rewardToken.id,
    pool: incentive.pool,
    startTime: incentive.startTime,
    endTime: incentive.endTime,
    vestingPeriod: incentive.vestingPeriod,
    refundee: incentive.refundee,
  };
};

export default usePosition;
