import React from "react";
import styled from "styled-components";
import { FeeDistributionBar } from "./FeeDistributionBar";
import { useFeeDistribution } from "hooks/useFeeDistribution";

interface PoolFeeDetailsProps {
  poolId: string;
  rewardTokenImage: string;
  rewardTokenSymbol: string;
}

const Container = styled.div`
  padding: 12px 16px;
  border-radius: 12px;
  width: 100%;
  display: flex;
  align-items: center;
`;

const LoadingText = styled.div`
  color: #fff;
  text-align: center;
  padding: 20px;
`;

export const PoolFeeDetails: React.FC<PoolFeeDetailsProps> = ({
  poolId,
  rewardTokenImage,
  rewardTokenSymbol,
}) => {
  const { data, loading, error } = useFeeDistribution(poolId);

  if (loading) {
    return <></>;
  }
  console.log("data", data);
  if (error || !data) {
    return <></>;
  }

  return (
    <Container>
      <FeeDistributionBar
        tradeFees={data.tradeFees}
        tokenRewards={data.tokenRewards}
        totalAPR={data.totalAPR}
        rewardTokenImage={rewardTokenImage}
        rewardTokenSymbol={rewardTokenSymbol}
      />
    </Container>
  );
};
