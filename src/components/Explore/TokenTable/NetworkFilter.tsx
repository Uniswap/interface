import { getChainInfo } from 'constants/chainInfo'
import { SupportedChainId } from 'constants/chains'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import { useAtom } from 'jotai'
import { useRef } from 'react'
import { Check, ChevronDown, ChevronUp } from 'react-feather'
import { useModalIsOpen, useToggleModal } from 'state/application/hooks'
import { ApplicationModal } from 'state/application/reducer'
import styled, { useTheme } from 'styled-components/macro'

import { MEDIUM_MEDIA_BREAKPOINT } from '../constants'
import { filterNetworkAtom } from '../state'

const NETWORKS = [
  SupportedChainId.MAINNET,
  SupportedChainId.ARBITRUM_ONE,
  SupportedChainId.POLYGON,
  SupportedChainId.OPTIMISM,
]

const InternalMenuItem = styled.div`
  flex: 1;
  padding: 12px 8px;
  color: ${({ theme }) => theme.textPrimary};

  :hover {
    cursor: pointer;
    text-decoration: none;
  }
`

const InternalLinkMenuItem = styled(InternalMenuItem)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  text-decoration: none;
  cursor: pointer;
  border-radius: 8px;

  :hover {
    background-color: ${({ theme }) => theme.hoverState};
    text-decoration: none;
  }
`
const MenuTimeFlyout = styled.span`
  min-width: 240px;
  max-height: 350px;
  overflow: auto;
  background-color: ${({ theme }) => theme.backgroundSurface};
  box-shadow: ${({ theme }) => theme.flyoutDropShadow};
  border: 1px solid ${({ theme }) => theme.backgroundOutline};
  border-radius: 12px;
  padding: 8px;
  display: flex;
  flex-direction: column;
  font-size: 16px;
  position: absolute;
  top: 48px;
  z-index: 100;
  left: 0px;
`

const StyledMenuButton = styled.button<{ open: boolean }>`
  width: 100%;
  height: 100%;
  color: ${({ theme, open }) => (open ? theme.blue200 : theme.textPrimary)};
  border: none;
  background-color: ${({ theme, open }) => (open ? theme.accentActionSoft : theme.backgroundAction)};
  margin: 0;
  padding: 6px 12px 6px 12px;
  border-radius: 12px;
  font-size: 16px;
  line-height: 24px;
  font-weight: 400;

  :hover {
    cursor: pointer;
    outline: none;
    background-color: ${({ theme, open }) => (open ? theme.accentActionSoft : theme.backgroundContainer)};
  }
  :focus {
    background-color: ${({ theme, open }) => (open ? theme.accentActionSoft : theme.backgroundAction)};
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

  @media only screen and (max-width: ${MEDIUM_MEDIA_BREAKPOINT}) {
    flex: 1;
  }
`

const StyledMenuContent = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  border: none;
  width: 100%;
  font-weight: 600;
  vertical-align: middle;
`

const Chevron = styled.span<{ open: boolean }>`
  padding-top: 1px;
  color: ${({ open, theme }) => (open ? theme.blue200 : theme.textSecondary)};
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
  const [activeNetwork, setNetwork] = useAtom(filterNetworkAtom)
  const { label, logoUrl } = getChainInfo(activeNetwork)

  return (
    <StyledMenu ref={node}>
      <StyledMenuButton onClick={toggleMenu} aria-label={`networkFilter`} open={open}>
        <StyledMenuContent>
          <NetworkLabel>
            <Logo src={logoUrl} /> {label}
          </NetworkLabel>
          <Chevron open={open}>
            {open ? <ChevronUp size={15} viewBox="0 0 24 20" /> : <ChevronDown size={15} viewBox="0 0 24 20" />}
          </Chevron>
        </StyledMenuContent>
      </StyledMenuButton>
      {open && (
        <MenuTimeFlyout>
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
                  <Check size={16} color={theme.accentAction} />
                </CheckContainer>
              )}
            </InternalLinkMenuItem>
          ))}
        </MenuTimeFlyout>
      )}
    </StyledMenu>
  )
}
