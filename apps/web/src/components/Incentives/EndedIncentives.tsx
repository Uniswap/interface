import React from "react";
import {
  useIncentivesData,
  ProcessedIncentive,
} from "./IncentivesDataProvider";
import { IncentiveTable } from "./IncentiveTable";
import { useNavigate } from "react-router-dom";
import { LightCard } from "components/Card";
import styled from "styled-components";
import { ThemedText } from "theme/components";
import { useAccount } from "../../hooks/useAccount";

const StyledLightCard = styled(LightCard)`
  padding: 20px;
  margin: 20px 0;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  text-align: center;
`;

export default function EndedIncentives() {
  const { endedIncentives, isLoading } = useIncentivesData();
  const navigate = useNavigate();
  const account = useAccount();

  const handleDeposit = (incentive: ProcessedIncentive) => {
    if (incentive.hasUserPosition) {
      navigate(`/pool/${incentive.id}`);
    } else {
      navigate(`/add/${incentive.token0Address}/${incentive.token1Address}`);
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
      incentives={endedIncentives}
      isLoading={isLoading}
      onDeposit={handleDeposit}
    />
  );
}
