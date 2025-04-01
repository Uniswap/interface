import { getAddress } from "ethers/lib/utils";
import React from "react";
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
  display: flex;
  align-items: flex-end;
  gap: 12px;
  width: 100%;
  padding-bottom: 4px;
`;

const BarSection = styled.div`
  flex: 1;
  position: relative;
  margin-top: 20px;
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

export const FeeDistributionBar: React.FC<FeeDistributionBarProps> = ({
  tokenRewardsPercentage,
  tradeFeesPercentage,
  rewardTokenImage,
  rewardTokenSymbol,
  rewardTokenAddress,
  daily24hAPR,
}) => {
  return (
    <BarContainer>
      <BarSection>
        <APR>{daily24hAPR.toFixed(2)}%</APR>
        <ProgressBarContainer>
          <TradeFeesBar width={`${tradeFeesPercentage}%`} />
          <TokenRewardsBar
            width={`${tokenRewardsPercentage}%`}
            offset={`${tradeFeesPercentage}%`}
          />
        </ProgressBarContainer>
      </BarSection>
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
