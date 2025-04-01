import React, { useMemo } from "react";
import styled from "styled-components";
import { FeeDistributionBar } from "./FeeDistributionBar";
import { useFeeDistribution } from "hooks/useFeeDistribution";

interface PoolFeeDetailsProps {
  incentiveId: string;
  rewardTokenImage: string;
  rewardTokenSymbol: string;
  rewardTokenAddress: string;
}

const Container = styled.div`
  padding: 12px 16px;
  border-radius: 12px;
  width: 100%;
  display: flex;
  align-items: center;
  min-height: 48px;
`;

const PlaceholderBar = styled.div`
  width: 100%;
  height: 24px;
`;

export const PoolFeeDetails: React.FC<PoolFeeDetailsProps> = React.memo(
  ({
    incentiveId,
    rewardTokenImage,
    rewardTokenSymbol,
    rewardTokenAddress,
  }) => {
    const { data, loading, error } = useFeeDistribution(incentiveId);

    const content = useMemo(() => {
      if (loading || error || !data) {
        return (
          <Container>
            <PlaceholderBar />
          </Container>
        );
      }

      return (
        <Container>
          <FeeDistributionBar
            tradeFeesPercentage={data.tradeFeesPercentage}
            tokenRewardsPercentage={data.tokenRewardsPercentage}
            daily24hAPR={data.daily24hAPR}
            rewardTokenImage={rewardTokenImage}
            rewardTokenSymbol={rewardTokenSymbol}
            rewardTokenAddress={rewardTokenAddress}
          />
        </Container>
      );
    }, [
      data,
      loading,
      error,
      rewardTokenImage,
      rewardTokenSymbol,
      rewardTokenAddress,
    ]);

    return content;
  }
);
