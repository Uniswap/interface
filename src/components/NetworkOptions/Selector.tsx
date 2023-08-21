import ellipsisLogo from 'assets/svg/ellipsis.svg'
import Row from 'components/Row'
import { getChainInfo } from 'constants/chainInfo'
import { ChevronDown, ChevronUp } from 'react-feather'
import styled from 'styled-components'

const StyledButton = styled.button<{ isActive: boolean; showChevron?: boolean }>`
  height: 100%;
  margin: 0;
  padding: 6px ${({ showChevron }) => (showChevron ? '4px' : '10px')} 6px 12px;
  border-radius: 12px;
  border: none;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  background-color: ${({ theme }) => theme.backgroundInteractive};
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    border-radius: inherit;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: ${({ isActive, theme }) => (isActive ? theme.stateOverlayPressed : theme.stateOverlayHover)};
    pointer-events: none;
    opacity: ${({ isActive }) => (isActive ? 1 : 0)};
  }

  &:hover::before {
    opacity: ${({ isActive }) => (isActive ? 0 : 1)};
  }
`
const SquareChainLogoContainer = styled.div<{ isActive?: boolean }>`
  border-radius: 8px;
  width: 24px;
  height: 24px;
  outline: 2px solid ${({ theme }) => theme.backgroundInteractive};
  margin-left: -2px;
`
export const SquareChainLogo = styled.img`
  height: 100%;
  width: 100%;
  background: #505a78;
  border-radius: 6px;
  width: 24px;
  height: 24px;
`
const Chevron = styled.span<{ isActive: boolean }>`
  padding-top: 1px;
  color: ${({ theme }) => theme.textSecondary};
`
function AllNetworks({ chainIds, isActive }: { chainIds: number[]; isActive: boolean }) {
  return (
    <Row data-testid="all-networks-selected">
      {chainIds.slice(0, 3).map((chainId) => {
        const chainInfo = getChainInfo(chainId)
        return (
          <SquareChainLogoContainer key={chainId} isActive={isActive}>
            <SquareChainLogo src={chainInfo?.squareLogoUrl} alt={chainInfo?.label} />
          </SquareChainLogoContainer>
        )
      })}
      <SquareChainLogoContainer isActive={isActive}>
        <SquareChainLogo src={ellipsisLogo} alt="More network options" />
      </SquareChainLogoContainer>
    </Row>
  )
}
export function Selector({
  chainIds,
  selectedChainId = 0,
  isActive,
  onClick,
}: {
  chainIds: number[]
  selectedChainId?: number
  isActive: boolean
  onClick: () => void
}) {
  const chainInfo = getChainInfo(selectedChainId)
  return (
    <StyledButton
      isActive={isActive}
      showChevron={!!selectedChainId}
      onClick={onClick}
      aria-label="Toggle Network Options"
      data-testid="network-selector"
    >
      {selectedChainId === 0 ? (
        <AllNetworks chainIds={chainIds} isActive={isActive} />
      ) : (
        <>
          <SquareChainLogoContainer key={selectedChainId} isActive={isActive}>
            <SquareChainLogo
              src={chainInfo?.squareLogoUrl}
              alt={chainInfo?.label}
              data-testid={`network-${selectedChainId}-selected`}
            />
          </SquareChainLogoContainer>
          <Chevron isActive={isActive}>
            {isActive ? (
              <ChevronUp width={20} height={15} viewBox="0 0 24 20" data-testid="network-options-chevron-up" />
            ) : (
              <ChevronDown width={20} height={15} viewBox="0 0 24 20" data-testid="network-options-chevron-down" />
            )}
          </Chevron>
        </>
      )}
    </StyledButton>
  )
}
