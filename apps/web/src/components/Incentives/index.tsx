import React from "react";
import { ProcessedIncentive, useIncentivesData } from "hooks/useIncentivesData";
import { IncentiveTable } from "./IncentiveTable";
import { useNavigate, useLocation } from "react-router-dom";
import { LightCard } from "components/Card";
import styled from "styled-components";
import { ThemedText } from "theme/components";
import { useAccount } from "../../hooks/useAccount";
import { LiquidityTab } from "../../pages/Farms";

const StyledLightCard = styled(LightCard)`
  padding: 20px;
  margin: 20px 0;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  text-align: center;
`;

export default function Incentives() {
  const { activeIncentives, endedIncentives, isLoading } = useIncentivesData();
  const navigate = useNavigate();
  const location = useLocation();
  const account = useAccount();

  const isEndedTab = location.pathname.includes(LiquidityTab.EndedIncentives);
  const incentivesToShow = isEndedTab ? endedIncentives : activeIncentives;

  const handleDeposit = (incentive: ProcessedIncentive) => {
    if (incentive.hasUserPositionInPool) {
      return navigate(`/#/pool/${incentive.poolPositionId}`);
    } else {
      return navigate(
        `/#/add/${incentive.token0Address}/${incentive.token1Address}`
      );
    }
  };

  if (!account.isConnected) {
    return (
      <StyledLightCard>
        <ThemedText.BodySecondary>
          Connect wallet to see real-time APR
        </ThemedText.BodySecondary>
      </StyledLightCard>
    );
  }

  return (
    <IncentiveTable
      incentives={incentivesToShow}
      isLoading={isLoading}
      onDeposit={handleDeposit}
    />
  );
}
