import { getChainInfo } from 'constants/chainInfo'
import { SupportedChainId } from 'constants/chains'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import { useRef, useState } from 'react'
import { Check, ChevronDown, ChevronUp } from 'react-feather'
import { useModalIsOpen, useToggleModal } from 'state/application/hooks'
import { ApplicationModal } from 'state/application/reducer'
import styled, { css, useTheme } from 'styled-components/macro'

const NETWORKS = [
  SupportedChainId.MAINNET,
  SupportedChainId.ARBITRUM_ONE,
  SupportedChainId.POLYGON,
  SupportedChainId.OPTIMISM,
]

enum FlyoutAlignment {
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
}

const InternalMenuItem = styled.div`
  flex: 1;
  padding: 12px 16px;
  color: ${({ theme }) => theme.text2};

  :hover {
    color: ${({ theme }) => theme.text1};
    cursor: pointer;
    text-decoration: none;
  }
  > svg {
    margin-right: 8px;
  }
`

const InternalLinkMenuItem = styled(InternalMenuItem)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  text-decoration: none;
  cursor: pointer;

  :hover {
    background-color: ${({ theme }) => theme.bg2};
    text-decoration: none;
  }
`
const MenuTimeFlyout = styled.span<{ flyoutAlignment?: FlyoutAlignment }>`
  min-width: 200px;
  max-height: 350px;
  overflow: auto;
  background-color: ${({ theme }) => theme.bg1};
  box-shadow: 0px 0px 1px rgba(0, 0, 0, 0.01), 0px 4px 8px rgba(0, 0, 0, 0.04), 0px 16px 24px rgba(0, 0, 0, 0.04),
    0px 24px 32px rgba(0, 0, 0, 0.01);
  border: 1px solid ${({ theme }) => theme.bg0};
  border-radius: 12px;
  padding: 8px 0px;
  display: flex;
  flex-direction: column;
  font-size: 16px;
  position: absolute;
  top: 48px;
  z-index: 100;

  ${({ flyoutAlignment = FlyoutAlignment.RIGHT }) =>
    flyoutAlignment === FlyoutAlignment.RIGHT
      ? css`
          right: 0px;
        `
      : css`
          left: 0px;
        `};
  ${({ theme }) => theme.mediaWidth.upToMedium`
    bottom: unset;
    right: 0;
    left: unset;
  `};
`

const StyledMenuButton = styled.button`
  width: 100%;
  height: 100%;
  border: none;
  background-color: transparent;
  margin: 0;
  background-color: ${({ theme }) => theme.bg0};
  border: 1px solid ${({ theme }) => theme.bg0};
  padding: 6px 12px 6px 12px;
  border-radius: 12px;
  font-size: 16px;
  line-height: 24px;
  font-weight: 400;

  :hover,
  :focus {
    cursor: pointer;
    outline: none;
    border: 1px solid ${({ theme }) => theme.bg3};
  }

  svg {
    margin-top: 2px;
  }
`

const StyledMenu = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  border: none;
  text-align: left;
  width: 160px;
`

const StyledMenuContent = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  border: none;
  width: 100%;
  font-weight: 600;
  vertical-align: middle;
  color: ${({ theme }) => theme.text1};
`

const Chevron = styled.span`
  color: ${({ theme }) => theme.text2};
`
const NetworkLabel = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`
const Logo = styled.img`
  height: 20px;
  width: 20px;
`
const CheckContainer = styled.div`
  display: flex;
  flex-direction: flex-end;
`

// TODO: change this to reflect data pipeline
export default function NetworkFilter() {
  const theme = useTheme()
  const node = useRef<HTMLDivElement | null>(null)
  const open = useModalIsOpen(ApplicationModal.NETWORK_FILTER)
  const toggleMenu = useToggleModal(ApplicationModal.NETWORK_FILTER)
  useOnClickOutside(node, open ? toggleMenu : undefined)
  const [activeNetwork, setNetwork] = useState(SupportedChainId.MAINNET)
  const { label, logoUrl } = getChainInfo(activeNetwork)

  return (
    <StyledMenu ref={node}>
      <StyledMenuButton onClick={toggleMenu} aria-label={`networkFilter`}>
        <StyledMenuContent>
          <NetworkLabel>
            <Logo src={logoUrl} /> {label}
          </NetworkLabel>
          <Chevron>
            {open ? <ChevronUp size={15} viewBox="0 0 24 20" /> : <ChevronDown size={15} viewBox="0 0 24 20" />}
          </Chevron>
        </StyledMenuContent>
      </StyledMenuButton>
      {open && (
        <MenuTimeFlyout flyoutAlignment={FlyoutAlignment.LEFT}>
          {NETWORKS.map((network) => (
            <InternalLinkMenuItem
              key={network}
              onClick={() => {
                setNetwork(network)
                toggleMenu()
              }}
            >
              <NetworkLabel>
                <Logo src={getChainInfo(network).logoUrl} /> {getChainInfo(network).label}
              </NetworkLabel>
              {network === activeNetwork && (
                <CheckContainer>
                  <Check size={16} color={theme.primary1} />
                </CheckContainer>
              )}
            </InternalLinkMenuItem>
          ))}
        </MenuTimeFlyout>
      )}
    </StyledMenu>
  )
}
