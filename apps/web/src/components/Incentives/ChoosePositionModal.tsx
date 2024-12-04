import React, { useCallback, useEffect, useState } from "react";

import useTotalPositions, { PositionsResponse } from "hooks/useTotalPositions";
import Modal from "components/Modal";
import { Wrapper } from "pages/Farms/styled";
import styled, { useTheme } from "styled-components";
import Row from "components/Row";
import { X } from "react-feather";
import Column from "components/Column";
import { ThemedText } from "theme/components";

const CenteredRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  max-width: 100%;
  gap: 8px;
  border-bottom: 1px solid ${({ theme }) => theme.surface3};
`;

export const SaveButton = styled.button`
  border-radius: 12px;
  padding: 10px 20px;
  margin: 10px;
  background: ${({ theme }) => theme.accent1};
  font-weight: 600;
  font-size: 16px;
  border: none;
  color: ${({ theme }) => theme.neutral1};
  cursor: pointer;
  transition: background 0.3s, transform 0.2s;

  :hover {
    background: ${({ theme }) => theme.accent2};
    transform: scale(1.05); /* Slight zoom effect */
  }

  :disabled {
    background: ${({ theme }) => theme.blur};
    cursor: not-allowed;
    transform: none;
  }
`;

export const CancelButton = styled.button`
  border-radius: 12px;
  padding: 10px 20px;
  margin: 10px;
  background: ${({ theme }) => theme.neutral3};
  font-weight: 600;
  font-size: 16px;
  border: none;
  color: ${({ theme }) => theme.neutral1};
  cursor: pointer;
  transition: background 0.3s, transform 0.2s;

  :hover {
    background: ${({ theme }) => theme.accent2};
    transform: scale(1.05); /* Slight zoom effect */
  }

  :disabled {
    background: ${({ theme }) => theme.blur};
    cursor: not-allowed;
    transform: none;
  }
`;

const Header = styled(CenteredRow)`
  font-weight: 600;
  font-size: 18px;
  width: 100%;
  justify-content: space-between;
`;

const CloseButton = styled.button`
  cursor: pointer;
  background: transparent;
  border: none;
  color: ${({ theme }) => theme.neutral1};
  font-size: 18px;
`;

const FlagsColumn = styled(Column)`
  max-height: 600px;
  padding: 16px;
  overflow-y: auto;
  //   background-color: ${({ theme }) => theme.background};
  border-radius: 8px;
  display: grid;
  grid-template-columns: repeat(
    auto-fit,
    minmax(120px, 160px)
  ); /* Reduced max width */
  gap: 10px; /* Increased gap for better spacing */
  //   justify-content: center;
  align-items: start;
`;

const Tile = styled.div<{ selected: boolean }>`
  padding: 16px;
  background-color: ${({ theme, selected }) =>
    selected ? theme.accent1 : theme.neutral3};
  cursor: pointer;
  border-radius: 8px;
  text-align: center;
  box-shadow: ${({ selected }) =>
    selected ? "0 4px 6px rgba(0, 0, 0, 0.2)" : "0 2px 4px rgba(0, 0, 0, 0.1)"};
  transition: background-color 0.3s, box-shadow 0.3s, transform 0.2s;

  &:hover {
    background-color: ${({ theme }) => theme.accent2};
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
    transform: scale(1.05); /* Adds slight zoom effect */
  }

  span {
    font-size: 16px; /* Increase font size */
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3); /* Add subtle shadow */
  }
`;

interface ChoosePositionModalProps {
  show: boolean;
  onHide: () => void;
  onSelectPosition: (positionId: number) => void;
  positionIds: number[];
}

const ChoosePositionModal: React.FC<ChoosePositionModalProps> = ({
  show,
  onHide,
  onSelectPosition,
  positionIds,
}) => {
  const [selectedPosition, setSelectedPosition] = useState<number | null>(null);
  const [relevantPositions, setRelevantPositions] = useState<
    PositionsResponse[]
  >([]);

  const { fetchPositionsWithIds, isLoading: isLoadingDepositData } =
    useTotalPositions();

  const getUserPositionsGql = useCallback(async () => {
    if (!positionIds) return;

    const positions = await fetchPositionsWithIds(positionIds.map(String));
    setRelevantPositions(positions);
  }, [fetchPositionsWithIds, positionIds]);

  const handleSelectPosition = (positionId: number) => {
    setSelectedPosition(positionId);
  };

  useEffect(() => {
    getUserPositionsGql();
  }, [positionIds]);

  const handleConfirmSelection = () => {
    if (selectedPosition) {
      onSelectPosition(selectedPosition);
      onHide();
    }
  };

  const hasPositions = relevantPositions.length > 0;

  return (
    <Modal isOpen={show && hasPositions} onDismiss={onHide} slideIn>
      <Wrapper>
        <Header>
          <Row width="100%" justify="space-between">
            <span>Choose Position</span>
            <CloseButton onClick={onHide}>
              <X size={24} />
            </CloseButton>
          </Row>
        </Header>
        <FlagsColumn>
          {hasPositions ? (
            <>
              {relevantPositions
                .map((p) => p.id)
                .map((id) => (
                  <Tile
                    key={id}
                    selected={selectedPosition === id}
                    onClick={() => handleSelectPosition(id)}
                  >
                    <span>Position ID: {id}</span>
                  </Tile>
                ))}
            </>
          ) : (
            <ThemedText.BodyPrimary>
              No positions available for this pool.
            </ThemedText.BodyPrimary>
          )}
        </FlagsColumn>
        {hasPositions && (
          <div style={{ display: "flex", justifyContent: "center" }}>
            <SaveButton
              onClick={handleConfirmSelection}
              disabled={!selectedPosition}
            >
              Confirm
            </SaveButton>
            <CancelButton onClick={() => onHide()}>Close</CancelButton>
          </div>
        )}
      </Wrapper>
    </Modal>
  );
};

export default ChoosePositionModal;
