import { Currency, Token } from '@uniswap/sdk-core';
import { ButtonGray } from 'components/Button/buttons'
import CurrencySearchModal from 'components/SearchModal/CurrencySearchModal'
import styled from 'lib/styled-components'
import React, { useCallback, useEffect, useState } from 'react';
import { useActiveSmartPool, useSelectActiveSmartPool } from 'state/application/hooks';

const PoolSelectButton = styled(ButtonGray)<{
    visible: boolean
    selected: boolean
    hideInput?: boolean
    disabled?: boolean
  }>`
    align-items: center;
    background-color: ${({ selected, theme }) => (selected ? theme.surface1 : theme.accent1)};
    opacity: ${({ disabled }) => (!disabled ? 1 : 0.4)};
    box-shadow: ${({ selected }) => (selected ? 'none' : '0px 6px 10px rgba(0, 0, 0, 0.075)')};
    box-shadow: 0px 6px 10px rgba(0, 0, 0, 0.075);
    color: ${({ selected, theme }) => (selected ? theme.neutral1 : theme.white)};
    cursor: pointer;
    border-radius: 16px;
    outline: none;
    user-select: none;
    border: none;
    font-size: 24px;
    font-weight: 500;
    height: ${({ hideInput }) => (hideInput ? '2.8rem' : '2.4rem')};
    width: ${({ hideInput }) => (hideInput ? '100%' : 'initial')};
    padding: 0 8px;
    justify-content: space-between;
    margin-bottom: 16px;
    margin-left: ${({ hideInput }) => (hideInput ? '0' : '12px')};
    visibility: ${({ visible }) => (visible ? 'visible' : 'hidden')};
    display: flex;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;

    @media (max-width: 910px) { 
      white-space: normal;
      word-wrap: break-word;
      height: auto;
      min-height: 3rem;
    }

    :focus,
    :hover {
      background-color: ${({ selected, theme }) => (selected ? theme.surface2 : theme.accent1)};
    }
`;

const StyledTokenName = styled.span<{ active?: boolean }>`
  ${({ active }) => (active ? '  margin: 0 0.25rem 0 0.25rem;' : '  margin: 0 0.25rem 0 0.25rem;')}
  font-size: 20px;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
  white-space: nowrap;

  @media (max-width: 910px) {
    white-space: normal;
    word-wrap: break-word;
  }
`;

interface PoolSelectProps {
  operatedPools: Token[];
}

const PoolSelect: React.FC<PoolSelectProps> = ({ operatedPools }) => {
  const [showModal, setShowModal] = useState(false);
  const activeSmartPool = useActiveSmartPool();
  const onPoolSelect = useSelectActiveSmartPool();

  // on chain switch revert to default pool if selected does not exist on new chain
  const activePoolExistsOnChain = operatedPools?.some(pool => pool.address === activeSmartPool?.address);

  // initialize selected pool
  useEffect(() => {
    if (!activeSmartPool?.name || !activePoolExistsOnChain) {
      onPoolSelect(operatedPools[0]);
    }
  }, [activePoolExistsOnChain, activeSmartPool?.name, operatedPools, onPoolSelect])

  const handleSelectPool = useCallback((pool: Currency) => {
    onPoolSelect(pool);
    setShowModal(false);
  }, [onPoolSelect]);

  return (
    <>
      {activeSmartPool && (
        <PoolSelectButton
          disabled={false}
          visible={true}
          selected={true}
          hideInput={false}
          className="operated-pool-select-button"
          onClick={() => setShowModal(true)}
        >
          <StyledTokenName className="pool-name-container" active={true}>
            {activeSmartPool.name}
          </StyledTokenName>
        </PoolSelectButton>
      )}

      <CurrencySearchModal
          isOpen={showModal}
          onDismiss={() => setShowModal(false)}
          onCurrencySelect={handleSelectPool}
          operatedPools={operatedPools as Token[]}
          shouldDisplayPoolsOnly={true}
        />
    </>
  );
};

export default PoolSelect;