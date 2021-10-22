import React, { ReactNode, useRef } from 'react'
import { Info, PieChart, Menu as MenuIcon, Zap, BookOpen, FileText, Monitor, User, Triangle } from 'react-feather'
import styled from 'styled-components'
import { NavLink } from 'react-router-dom'
import { Trans } from '@lingui/macro'

import { ChainId } from '@dynamic-amm/sdk'
import { useOnClickOutside } from '../../hooks/useOnClickOutside'
import { ApplicationModal } from '../../state/application/actions'
import { useModalOpen, useToggleModal } from '../../state/application/hooks'
import { ExternalLink } from '../../theme'
import { DMM_ANALYTICS_URL } from '../../constants'
import { useActiveWeb3React } from 'hooks'

const StyledMenuIcon = styled(MenuIcon)`
  path {
    stroke: ${({ theme }) => theme.text1};
  }
`

const StyledMenuButton = styled.button`
  width: 100%;
  height: 100%;
  border: none;
  background-color: transparent;
  margin: 0;
  padding: 0;
  height: 35px;
  color: ${({ theme }) => theme.text11};
  background-color: ${({ theme }) => theme.bg3};

  padding: 0.15rem 0.5rem;
  border-radius: 0.5rem;

  :hover,
  :focus {
    cursor: pointer;
    outline: none;
    background-color: ${({ theme }) => theme.bg4};
  }

  svg {
    margin-top: 2px;
  }
`

const StyledMenu = styled.div`
  margin-left: 0.5rem;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  border: none;
  text-align: left;
`

const MenuFlyout = styled.span`
  min-width: 9rem;
  background-color: ${({ theme }) => theme.bg3};
  box-shadow: 0px 0px 1px rgba(0, 0, 0, 0.01), 0px 4px 8px rgba(0, 0, 0, 0.04), 0px 16px 24px rgba(0, 0, 0, 0.04),
    0px 24px 32px rgba(0, 0, 0, 0.01);
  border-radius: 12px;
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  font-size: 1rem;
  position: absolute;
  top: 4rem;
  right: 0rem;
  z-index: 100;

  ${({ theme }) => theme.mediaWidth.upToLarge`
    top: -14.25rem;
  `};
`

const NavMenuItem = styled(NavLink)`
  flex: 1;
  padding: 0.5rem 0.5rem;
  text-decoration: none;
  display: flex;
  align-items: center;
  color: ${({ theme }) => theme.text2};
  :hover {
    color: ${({ theme }) => theme.text1};
    cursor: pointer;
  }
  > svg {
    margin-right: 8px;
  }
`

const MenuItem = styled(ExternalLink)`
  flex: 1;
  padding: 0.5rem 0.5rem;
  display: flex;
  align-items: center;
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

export default function Menu() {
  const { chainId } = useActiveWeb3React()
  const node = useRef<HTMLDivElement>()
  const open = useModalOpen(ApplicationModal.MENU)
  const toggle = useToggleModal(ApplicationModal.MENU)
  useOnClickOutside(node, open ? toggle : undefined)

  return (
    <StyledMenu ref={node as any}>
      <StyledMenuButton onClick={toggle} aria-label="Menu">
        <StyledMenuIcon />
      </StyledMenuButton>

      {open && (
        <MenuFlyout>
          <NavMenuItem to="/myPools">
            <Monitor size={14} />
            <Trans>Dashboard</Trans>
          </NavMenuItem>
          <NavMenuItem to="/about">
            <Info size={14} />
            <Trans>About</Trans>
          </NavMenuItem>
          {chainId && [ChainId.MAINNET, ChainId.ROPSTEN].includes(chainId) && (
            <NavMenuItem to="/migration">
              <Zap size={14} />
              <Trans>Migrate Liquidity</Trans>
            </NavMenuItem>
          )}
          <MenuItem id="link" href={DMM_ANALYTICS_URL[chainId as ChainId]}>
            <PieChart size={14} />
            <Trans>Analytics</Trans>
          </MenuItem>
          <MenuItem id="link" href="https://docs.dmm.exchange">
            <BookOpen size={14} />
            <Trans>Docs</Trans>
          </MenuItem>
          <MenuItem id="link" href="https://gov.kyber.org">
            <User size={14} />
            <Trans>Forum</Trans>
          </MenuItem>
          <MenuItem id="link" href="https://files.dmm.exchange/tac.pdf">
            <FileText size={14} />
            <Trans>Terms</Trans>
          </MenuItem>

          {process.env.REACT_APP_MAINNET_ENV !== 'production' && (
            <NavMenuItem to="/swap-legacy">
              <Triangle size={14} />
              <Trans>Swap Legacy</Trans>
            </NavMenuItem>
          )}
        </MenuFlyout>
      )}
    </StyledMenu>
  )
}

export function FlyoutPriceRange({ header, content }: { header: ReactNode; content: ReactNode }) {
  const node = useRef<HTMLDivElement>()
  const open = useModalOpen(ApplicationModal.PRICE_RANGE)
  const toggle = useToggleModal(ApplicationModal.PRICE_RANGE)

  return (
    <StyledMenu ref={node as any}>
      <span style={{ width: '100%' }} onClick={toggle}>
        {header}
      </span>

      {open && (
        <MenuFlyout>
          <MenuItem id="link" href="https://dmm.exchange/">
            {content}
          </MenuItem>
        </MenuFlyout>
      )}
    </StyledMenu>
  )
}
