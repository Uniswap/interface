import { getChainInfo } from 'constants/chainInfo'
import { BACKEND_CHAIN_NAMES, CHAIN_NAME_TO_CHAIN_ID, validateUrlChainParam } from 'graphql/data/util'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import { useRef } from 'react'
import { Check, ChevronDown, ChevronUp } from 'react-feather'
import { useNavigate, useParams } from 'react-router-dom'
import { useModalIsOpen, useToggleModal } from 'state/application/hooks'
import { ApplicationModal } from 'state/application/reducer'
import styled, { useTheme } from 'styled-components/macro'

import FilterOption from './FilterOption'

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
  box-shadow: ${({ theme }) => theme.deepShadow};
  border: 0.5px solid ${({ theme }) => theme.backgroundOutline};
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
const StyledMenu = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  border: none;
  text-align: left;
`
const StyledMenuContent = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 8px;
  align-items: center;
  border: none;
  font-weight: 600;
  vertical-align: middle;
`
const Chevron = styled.span<{ open: boolean }>`
  padding-top: 1px;
  color: ${({ open, theme }) => (open ? theme.accentActive : theme.textSecondary)};
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
const NetworkFilterOption = styled(FilterOption)`
  width: 156px;
`

export default function NetworkFilter() {
  const theme = useTheme()
  const node = useRef<HTMLDivElement | null>(null)
  const open = useModalIsOpen(ApplicationModal.NETWORK_FILTER)
  const toggleMenu = useToggleModal(ApplicationModal.NETWORK_FILTER)
  useOnClickOutside(node, open ? toggleMenu : undefined)
  const navigate = useNavigate()

  const { chainName } = useParams<{ chainName?: string }>()
  const currentChainName = validateUrlChainParam(chainName)

  const { label, circleLogoUrl, logoUrl } = getChainInfo(CHAIN_NAME_TO_CHAIN_ID[currentChainName])

  return (
    <StyledMenu ref={node}>
      <NetworkFilterOption onClick={toggleMenu} aria-label={`networkFilter`} active={open}>
        <StyledMenuContent>
          <NetworkLabel>
            <Logo src={circleLogoUrl ?? logoUrl} /> {label}
          </NetworkLabel>
          <Chevron open={open}>
            {open ? (
              <ChevronUp width={20} height={15} viewBox="0 0 24 20" />
            ) : (
              <ChevronDown width={20} height={15} viewBox="0 0 24 20" />
            )}
          </Chevron>
        </StyledMenuContent>
      </NetworkFilterOption>
      {open && (
        <MenuTimeFlyout>
          {BACKEND_CHAIN_NAMES.map((network) => {
            const chainInfo = getChainInfo(CHAIN_NAME_TO_CHAIN_ID[network])
            return (
              <InternalLinkMenuItem
                key={network}
                onClick={() => {
                  navigate(`/tokens/${network.toLowerCase()}`)
                  toggleMenu()
                }}
              >
                <NetworkLabel>
                  <Logo src={chainInfo.circleLogoUrl ?? chainInfo.logoUrl} />
                  {chainInfo.label}
                </NetworkLabel>
                {network === currentChainName && (
                  <CheckContainer>
                    <Check size={16} color={theme.accentAction} />
                  </CheckContainer>
                )}
              </InternalLinkMenuItem>
            )
          })}
        </MenuTimeFlyout>
      )}
    </StyledMenu>
  )
}
