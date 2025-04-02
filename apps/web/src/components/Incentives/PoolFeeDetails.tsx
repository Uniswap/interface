import React, { useMemo } from "react";
import styled from "styled-components";
import { FeeDistributionBar } from "./FeeDistributionBar";
import { useFeeDistribution } from "hooks/useFeeDistribution";
import { MouseoverTooltip } from "components/Tooltip";
import { useFormatter } from "utils/formatNumbers";
import DonutChart from "./DonutChart";
import { NumberType } from "utils/formatNumbers";

interface PoolFeeDetailsProps {
  incentiveId: string;
  rewardTokenImage: string;
  rewardTokenSymbol: string;
  rewardTokenAddress: string;
}

const Container = styled.div`
  padding-top: 0;
  display: flex;
  justify-content: flex-end;
  width: 100%;
`;

const PlaceholderBar = styled.div`
  width: 100%;
  height: 24px;
`;

const TooltipContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  min-width: 240px;
  border-radius: 12px;
`;

const TooltipHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const TooltipTitle = styled.div`
  color: ${({ theme }) => theme.neutral2};
  font-size: 14px;
  font-weight: 400;
`;

const TooltipValue = styled.div`
  color: ${({ theme }) => theme.neutral1};
  font-size: 24px;
  font-weight: 500;
`;

const ChartSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
`;

const LegendContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
`;

const LegendItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const LegendLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: ${({ theme }) => theme.neutral2};
  font-size: 14px;
`;

const LegendDot = styled.div<{ color: string }>`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: ${({ color }) => color};
`;

const LegendValue = styled.div`
  color: ${({ theme }) => theme.neutral1};
  font-size: 14px;
  font-weight: 500;
`;

const WeeklyRewards = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const WeeklyRewardsTitle = styled.div`
  color: ${({ theme }) => theme.neutral2};
  font-size: 14px;
`;

const WeeklyRewardsValue = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: ${({ theme }) => theme.neutral1};
  font-size: 14px;
`;

const TokenIcon = styled.img`
  width: 20px;
  height: 20px;
  border-radius: 50%;
`;

const EndDate = styled.div`
  color: ${({ theme }) => theme.neutral2};
  font-size: 12px;
  text-align: right;
`;

const FullWidthDistributionBar = styled.div`
  width: 100%;
  display: flex;
  justify-content: flex-end;
`;

export const PoolFeeDetails: React.FC<PoolFeeDetailsProps> = React.memo(
  ({
    incentiveId,
    rewardTokenImage,
    rewardTokenSymbol,
    rewardTokenAddress,
  }) => {
    const { data, loading, error } = useFeeDistribution(incentiveId);
    const { formatDelta, formatNumber } = useFormatter();

    const tooltipContent = useMemo(() => {
      if (!data) return null;

      const chartData = [
        {
          value: data.tradeFeesPercentage,
          color: "#40B66B",
        },
        {
          value: data.tokenRewardsPercentage,
          color: "#FFFFFF",
        },
      ];

      return (
        <TooltipContent>
          <TooltipHeader>
            <TooltipTitle>Total APR</TooltipTitle>
            <TooltipValue>{formatDelta(data.daily24hAPR)}</TooltipValue>
          </TooltipHeader>
          <ChartSection>
            <DonutChart data={chartData} size={120} thickness={16} />
            <LegendContainer>
              <LegendItem>
                <LegendLabel>
                  <LegendDot color="#40B66B" />
                  Trade fees
                </LegendLabel>
                <LegendValue>
                  {formatDelta(
                    (data.tradeFeesPercentage * data.daily24hAPR) / 100,
                  )}
                </LegendValue>
              </LegendItem>
              <LegendItem>
                <LegendLabel>
                  <LegendDot color="#FFFFFF" />
                  {rewardTokenSymbol}
                </LegendLabel>
                <LegendValue>
                  {formatDelta(
                    (data.tokenRewardsPercentage * data.daily24hAPR) / 100,
                  )}
                </LegendValue>
              </LegendItem>
            </LegendContainer>
          </ChartSection>
          <WeeklyRewards>
            <WeeklyRewardsTitle>Weekly Rewards</WeeklyRewardsTitle>
            <WeeklyRewardsValue>
              <TokenIcon src={rewardTokenImage} alt={rewardTokenSymbol} />
              {formatNumber({
                input: data.weeklyRewards,
                type: NumberType.TokenNonTx,
              })}{" "}
              {rewardTokenSymbol} ($
              {formatNumber({
                input: data.weeklyRewardsUSD,
                type: NumberType.FiatTokenPrice,
              })}
              )
            </WeeklyRewardsValue>
          </WeeklyRewards>
          {/* <EndDate>Ends 05/09/25</EndDate> */}
        </TooltipContent>
      );
    }, [data, rewardTokenSymbol, rewardTokenImage, formatDelta, formatNumber]);

    const content = useMemo(() => {
      if (loading || error || !data) {
        return (
          <Container>
            <PlaceholderBar />
          </Container>
        );
      }

      return (
        <MouseoverTooltip text={tooltipContent} placement="top">
          <Container>
            <FullWidthDistributionBar>
              <FeeDistributionBar
                tradeFeesPercentage={data.tradeFeesPercentage}
                tokenRewardsPercentage={data.tokenRewardsPercentage}
                daily24hAPR={data.daily24hAPR}
                rewardTokenImage={rewardTokenImage}
                rewardTokenSymbol={rewardTokenSymbol}
                rewardTokenAddress={rewardTokenAddress}
              />
            </FullWidthDistributionBar>
          </Container>
        </MouseoverTooltip>
      );
    }, [
      data,
      loading,
      error,
      tooltipContent,
      rewardTokenImage,
      rewardTokenSymbol,
      rewardTokenAddress,
    ]);

    return content;
  },
);
