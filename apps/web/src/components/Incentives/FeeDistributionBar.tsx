import { getAddress } from "ethers/lib/utils";
import React, { useState } from "react";
import styled from "styled-components";

interface FeeDistributionBarProps {
  tokenRewardsPercentage: number;
  tradeFeesPercentage: number;
  daily24hAPR: number;
  rewardTokenImage: string;
  rewardTokenSymbol: string;
  rewardTokenAddress: string;
}

const BarContainer = styled.div`
  width: 100%;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;
  min-width: 150px;
`;

const ProgressBarSection = styled.div`
  position: relative;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
`;

const APR = styled.div`
  font-size: 16px;
  color: #fff;
  white-space: nowrap;
  margin-bottom: 4px;
`;

const ProgressBarContainer = styled.div`
  width: 90px;
  height: 4px;
  background: #333;
  border-radius: 4px;
  position: relative;
  overflow: hidden;
  min-width: 80px;
  max-width: 150px;
`;

const TradeFeesBar = styled.div<{ width: string }>`
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  background: #ffffff;
  width: ${(props) => props.width};
  border-radius: 4px 0 0 4px;
  z-index: 1;
`;

const TokenRewardsBar = styled.div<{ width: string; offset: string }>`
  position: absolute;
  left: ${(props) => props.offset};
  top: 0;
  height: 100%;
  background: #40b66b;
  width: ${(props) => props.width};
  border-radius: 0 4px 4px 0;
  z-index: 1;
`;

const TokenIconLink = styled.a`
  cursor: pointer;
  &:hover {
    opacity: 0.8;
  }
`;

const TokenIcon = styled.img`
  width: 20px;
  height: 20px;
  border-radius: 50%;
`;

const BarAndAPRContainer = styled.div`
  display: flex;
  align-items: center;
  flex: 1;
  cursor: pointer;
`;

export const FeeDistributionBar: React.FC<FeeDistributionBarProps> = ({
  tokenRewardsPercentage,
  tradeFeesPercentage,
  rewardTokenImage,
  rewardTokenSymbol,
  rewardTokenAddress,
  daily24hAPR,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const tradeFees = Math.min(
    Math.max(0, Number(tradeFeesPercentage) || 0),
    100
  );
  const tokenRewards = Math.min(
    Math.max(0, Number(tokenRewardsPercentage) || 0),
    100
  );

  return (
    <BarContainer>
      <BarAndAPRContainer
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <ProgressBarSection>
          <APR>{daily24hAPR.toFixed(2)}%</APR>
          <ProgressBarContainer>
            <TradeFeesBar width={`${tradeFees}%`} />
            <TokenRewardsBar
              width={`${tokenRewards}%`}
              offset={`${tradeFees}%`}
            />
          </ProgressBarContainer>
        </ProgressBarSection>
      </BarAndAPRContainer>
      <TokenIconLink
        href={`https://www.taraswap.info/#/tokens/${getAddress(
          rewardTokenAddress
        )}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        <TokenIcon src={rewardTokenImage} alt={rewardTokenSymbol} />
      </TokenIconLink>
    </BarContainer>
  );
};
