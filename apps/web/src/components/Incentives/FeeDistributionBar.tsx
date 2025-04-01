import React from "react";
import styled from "styled-components";

interface FeeDistributionBarProps {
  tradeFees: number;
  tokenRewards: number;
  totalAPR: number;
  rewardTokenImage: string;
  rewardTokenSymbol: string;
}

const BarContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
`;

const BarSection = styled.div`
  flex: 1;
`;

const TotalAPR = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: #fff;
  margin-bottom: 4px;
`;

const ProgressBarContainer = styled.div`
  width: 100%;
  height: 4px;
  border-radius: 4px;
  position: relative;
  overflow: hidden;
`;

const TradeFeesBar = styled.div<{ width: string }>`
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  background: #18ac5b;
  width: ${(props) => props.width};
  border-radius: 4px 0 0 4px;
`;

const TokenRewardsBar = styled.div<{ width: string; offset: string }>`
  position: absolute;
  left: ${(props) => props.offset};
  top: 0;
  height: 100%;
  background: #ffffff;
  width: ${(props) => props.width};
  border-radius: 0 4px 4px 0;
`;

const TokenIcon = styled.img`
  width: 20 px;
  height: 20px;
  border-radius: 50%;
`;

export const FeeDistributionBar: React.FC<FeeDistributionBarProps> = ({
  tradeFees,
  tokenRewards,
  rewardTokenImage,
  rewardTokenSymbol,
  totalAPR,
}) => {
  const tradeFeesPercentage = (tradeFees / totalAPR) * 100;
  const tokenRewardsPercentage = (tokenRewards / totalAPR) * 100;

  return (
    <BarContainer>
      <BarSection>
        <TotalAPR>{totalAPR.toFixed(2)}%</TotalAPR>
        <ProgressBarContainer>
          <TradeFeesBar width={`${tradeFeesPercentage}%`} />
          <TokenRewardsBar
            width={`${tokenRewardsPercentage}%`}
            offset={`${tradeFeesPercentage}%`}
          />
        </ProgressBarContainer>
      </BarSection>
      <TokenIcon src={rewardTokenImage} alt={rewardTokenSymbol} />
    </BarContainer>
  );
};
