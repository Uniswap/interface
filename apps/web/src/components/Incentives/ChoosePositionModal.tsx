import React, { useCallback, useEffect, useState } from "react";
import useTotalPositions, { PositionsResponse } from "hooks/useTotalPositions";
import Modal from "components/Modal";
import { Wrapper } from "pages/Farms/styled";
import styled from "styled-components";
import Row from "components/Row";
import { X } from "react-feather";
import { ThemedText } from "theme/components";
import PositionListItem from "components/PositionListItem";
import { BigNumber } from "@ethersproject/bignumber";

const CenteredRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  max-width: 100%;
  gap: 8px;
  border-bottom: 1px solid ${({ theme }) => theme.surface3};
`;

const Header = styled(CenteredRow)`
  font-weight: 600;
  font-size: 18px;
  width: 100%;
  max-width: 500px;
  justify-content: space-between;
  margin-bottom: 10px;
  border: none;
`;

const CloseButton = styled.button`
  cursor: pointer;
  background: transparent;
  border: none;
  color: ${({ theme }) => theme.neutral1};
  font-size: 18px;
`;

const PositionsContainer = styled.div`
  max-height: 600px;
  padding: 2px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  
  > div {
    width: 100%;
    max-width: 500px;
  }
`;

const PositionWrapper = styled.div<{ selected: boolean }>`
  cursor: pointer;
  border: 2px solid ${({ theme, selected }) =>
    selected ? theme.accent1 : theme.surface3};
  border-radius: 8px;
  transition: all 0.2s ease;
  margin-bottom: 8px;

  &:hover {
    border-color: ${({ theme }) => theme.accent1};
    background: ${({ theme }) => theme.surface2};
    transform: scale(1.01);
  }

  ${({ selected, theme }) =>
    selected &&
    `
    background: ${theme.surface2};
    box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
  `}
`;

const ModalWrapper = styled(Wrapper)`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
`;

interface ChoosePositionModalProps {
  show: boolean;
  onHide: () => void;
  onSelectPosition: (positionId: number) => void;
  positionIds: number[];
  token0Address: string;
  token1Address: string;
  token0Symbol: string;
  token1Symbol: string;
  feeTier: string;
}

const ChoosePositionModal: React.FC<ChoosePositionModalProps> = ({
  show,
  onHide,
  positionIds,
  token0Address,
  token1Address,
  feeTier,
}) => {
  const [selectedPosition, setSelectedPosition] = useState<number | null>(null);
  const [relevantPositions, setRelevantPositions] = useState<PositionsResponse[]>([]);

  const { fetchPositionsWithIds, isLoading: isLoadingDepositData } = useTotalPositions();

  const getUserPositionsGql = useCallback(async () => {
    if (!positionIds?.length) return;
    const positions = await fetchPositionsWithIds(positionIds.map(String));
    setRelevantPositions(positions);
  }, [fetchPositionsWithIds, positionIds]);

  const handleSelectPosition = (positionId: number) => {
    setSelectedPosition(positionId);
  };

  useEffect(() => {
    getUserPositionsGql();
  }, [getUserPositionsGql]);


  const hasPositions = relevantPositions.length > 0;

  return (
    <Modal isOpen={show && hasPositions} onDismiss={onHide} maxHeight={80} maxWidth={450}>
      <ModalWrapper>
        <Header>
          <Row width="100%" justify="space-between">
            <span>Choose Position</span>
            <CloseButton onClick={onHide}>
              <X size={24} />
            </CloseButton>
          </Row>
        </Header>
        <PositionsContainer>
          {hasPositions ? (
            relevantPositions.map((position) => (
              <PositionWrapper
                key={position.id}
                selected={selectedPosition === Number(position.id)}
                onClick={() => handleSelectPosition(Number(position.id))}
              >
                <PositionListItem
                  token0={token0Address}
                  token1={token1Address}
                  tokenId={BigNumber.from(position.id)}
                  fee={parseInt(feeTier.replace('%', '')) * 10000}
                  liquidity={BigNumber.from(position.liquidity)}
                  tickLower={Number(position.tickLower.tickIdx)}
                  tickUpper={Number(position.tickUpper.tickIdx)}
                />
              </PositionWrapper>
            ))
          ) : (
            <ThemedText.BodyPrimary>
              No positions available for this pool.
            </ThemedText.BodyPrimary>
          )}
        </PositionsContainer>
      </ModalWrapper>
    </Modal>
  );
};

export default ChoosePositionModal;
