import { getAddress } from "ethers/lib/utils";
import React, { useState } from "react";
import styled from "styled-components";
import Tooltip from "components/Tooltip";

interface FeeDistributionBarProps {
  tokenRewardsPercentage: number;
  tradeFeesPercentage: number;
  daily24hAPR: number;
  rewardTokenImage: string;
  rewardTokenSymbol: string;
  rewardTokenAddress: string;
}

const BarContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  min-width: 150px;
`;

const ProgressBarSection = styled.div`
  position: relative;
  flex: 1;
`;

const APR = styled.div`
  font-size: 16px;
  color: #fff;
  white-space: nowrap;
  position: absolute;
  right: 0;
  top: -24px;
`;

const ProgressBarContainer = styled.div`
  width: 100%;
  height: 4px;
  background: #333;
  border-radius: 4px;
  position: relative;
  overflow: hidden;
  min-width: 80px;
`;

const TradeFeesBar = styled.div<{ width: string }>`
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  background: #40b66b;
  width: ${(props) => props.width};
  border-radius: 4px 0 0 4px;
  z-index: 1;
`;

const TokenRewardsBar = styled.div<{ width: string; offset: string }>`
  position: absolute;
  left: ${(props) => props.offset};
  top: 0;
  height: 100%;
  background: #ffffff;
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

  // Ensure we have valid percentage values
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
      <Tooltip
        text={`${tradeFees}% from trading fees, ${tokenRewards}% from ${rewardTokenSymbol} rewards`}
        show={showTooltip}
      >
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
      </Tooltip>
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
