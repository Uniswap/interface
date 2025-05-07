import React, { useState } from "react";
import { ProcessedIncentive, useIncentivesData } from "hooks/useIncentivesData";
import { IncentiveTable } from "./IncentiveTable";
import { useNavigate, useLocation } from "react-router-dom";
import { LightCard } from "components/Card";
import styled from "styled-components";
import { ThemedText } from "theme/components";
import { useAccount } from "../../hooks/useAccount";
import { LiquidityTab } from "../../pages/Farms";
import ChoosePositionModal from "./ChoosePositionModal";

const StyledLightCard = styled(LightCard)`
  padding: 20px;
  margin: 20px 0;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  text-align: center;
`;

export default function Incentives() {
  const { activeIncentives, endedIncentives, isLoading, error } =
    useIncentivesData();
  const [showPositionModal, setShowPositionModal] = useState(false);
  const [selectedIncentive, setSelectedIncentive] =
    useState<ProcessedIncentive | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const account = useAccount();

  const isEndedTab = location.pathname.includes(LiquidityTab.EndedIncentives);
  const incentivesToShow = isEndedTab ? endedIncentives : activeIncentives;

  const handleDeposit = (incentive: ProcessedIncentive) => {
    if (incentive.hasUserPositionInPool) {
      if (incentive.poolPositionIds && incentive.poolPositionIds.length > 1) {
        setSelectedIncentive(incentive);
        setShowPositionModal(true);
        return;
      }
      if (incentive.poolPositionIds && incentive.poolPositionIds[0]) {
        navigate(`/pools/${incentive.poolPositionIds?.[0]}`);
        return;
      }

      navigate(`/add/${incentive.token0Address}/${incentive.token1Address}`);
    }
  };

  const handleSelectPosition = (positionId: number) => {
    navigate(`/pools/${positionId}`);
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

  if (error) {
    console.error("error", error);
    return (
      <StyledLightCard>
        <ThemedText.BodySecondary>
          Error loading incentives data. Please try again later.
        </ThemedText.BodySecondary>
      </StyledLightCard>
    );
  }

  if (isLoading) {
    return (
      <StyledLightCard>
        <ThemedText.BodySecondary>
          Loading incentives data...
        </ThemedText.BodySecondary>
      </StyledLightCard>
    );
  }

  if (!incentivesToShow || incentivesToShow.length === 0) {
    return (
      <StyledLightCard>
        <ThemedText.BodySecondary>
          No {isEndedTab ? "ended" : "active"} incentives found.
        </ThemedText.BodySecondary>
      </StyledLightCard>
    );
  }

  return (
    <>
      <IncentiveTable
        incentives={incentivesToShow}
        isLoading={isLoading}
        onDeposit={handleDeposit}
      />
      {selectedIncentive && (
        <ChoosePositionModal
          show={showPositionModal}
          onHide={() => {
            setShowPositionModal(false);
            setSelectedIncentive(null);
          }}
          onSelectPosition={handleSelectPosition}
          positionIds={selectedIncentive.poolPositionIds || []}
          token0Address={selectedIncentive.token0Address}
          token1Address={selectedIncentive.token1Address}
          token0Symbol={selectedIncentive.token0Symbol}
          token1Symbol={selectedIncentive.token1Symbol}
          feeTier={selectedIncentive.feeTier}
        />
      )}
    </>
  );
}
