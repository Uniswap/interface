import React, { ReactNode, useRef } from 'react'
import {
  Info,
  PieChart,
  Menu as MenuIcon,
  Zap,
  BookOpen,
  FileText,
  Monitor,
  User,
  Triangle,
  Edit,
  Share2
} from 'react-feather'
import styled from 'styled-components'
import { NavLink } from 'react-router-dom'
import { Trans } from '@lingui/macro'
import { Text } from 'rebass'

import { ChainId } from '@dynamic-amm/sdk'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import { ApplicationModal } from 'state/application/actions'
import { useModalOpen, useToggleModal } from 'state/application/hooks'
import { ExternalLink } from 'theme'
import { DMM_ANALYTICS_URL } from '../../constants'
import { useActiveWeb3React } from 'hooks'
import { useMedia } from 'react-use'

const StyledMenuIcon = styled(MenuIcon)`
  path {
    stroke: ${({ theme }) => theme.text};
  }
`

const StyledMenuButton = styled.button`
  border: none;
  background-color: transparent;
  margin: 0;
  padding: 0;
  height: 40px;
  width: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.text};

  border-radius: 0.5rem;

  :hover,
  :focus {
    cursor: pointer;
    outline: none;
    background-color: ${({ theme }) => theme.buttonBlack};
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
  background-color: ${({ theme }) => theme.background};
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
    top: unset;
    bottom: 3.5rem;
  `};
`

const NavMenuItem = styled(NavLink)`
  flex: 1;
  padding: 0.5rem 0.5rem;
  text-decoration: none;
  display: flex;
  font-weight: 500;
  align-items: center;
  color: ${({ theme }) => theme.text2};
  :hover {
    color: ${({ theme }) => theme.text};
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
  font-weight: 500;
  align-items: center;
  color: ${({ theme }) => theme.text2};
  :hover {
    color: ${({ theme }) => theme.text};
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

  const above1320 = useMedia('(min-width: 1320px)')
  const above1100 = useMedia('(min-width: 1100px)')
  const above768 = useMedia('(min-width: 768px)')

  const getBridgeLink = () => {
    if (!chainId) return ''
    if ([ChainId.MATIC, ChainId.MUMBAI].includes(chainId)) return 'https://wallet.matic.network/bridge'
    if ([ChainId.BSCMAINNET, ChainId.BSCTESTNET].includes(chainId)) return 'https://www.binance.org/en/bridge'
    if ([ChainId.AVAXMAINNET, ChainId.AVAXTESTNET].includes(chainId)) return 'https://bridge.avax.network'
    if ([ChainId.FANTOM].includes(chainId)) return 'https://multichain.xyz'
    if ([ChainId.CRONOSTESTNET, ChainId.CRONOS].includes(chainId))
      return 'https://cronos.crypto.org/docs/bridge/cdcapp.html'
    return ''
  }

  const bridgeLink = getBridgeLink()

  return (
    <StyledMenu ref={node as any}>
      <StyledMenuButton onClick={toggle} aria-label="Menu">
        <StyledMenuIcon />
      </StyledMenuButton>

      {open && (
        <MenuFlyout>
          {/*{!above768 && (*/}
          {/*  <MenuItem href={process.env.REACT_APP_ZKYBER_URL ?? ''}>*/}
          {/*    <img src="https://kyberswap.com/favicon.ico" width="14" alt="KyberSwap" />*/}
          {/*    <SlideToUnlock>*/}
          {/*      <Text width="max-content" marginLeft="8px">*/}
          {/*        ZKyber ↗*/}
          {/*      </Text>*/}
          {/*    </SlideToUnlock>*/}
          {/*  </MenuItem>*/}
          {/*)}*/}
          {bridgeLink && (
            <MenuItem href={bridgeLink}>
              <Share2 size={14} />
              <Text width="max-content">
                <Trans>Bridge Assets</Trans>
              </Text>
            </MenuItem>
          )}

          {!above768 && (
            <NavMenuItem to="/myPools">
              <Monitor size={14} />
              <Trans>My Pools</Trans>
            </NavMenuItem>
          )}
          {!above1320 && (
            <NavMenuItem to="/about">
              <Info size={14} />
              <Trans>About</Trans>
            </NavMenuItem>
          )}
          {chainId && [ChainId.MAINNET, ChainId.ROPSTEN].includes(chainId) && (
            <NavMenuItem to="/migration">
              <Zap size={14} />
              <Trans>Migrate Liquidity</Trans>
            </NavMenuItem>
          )}
          {!above1100 && (
            <MenuItem id="link" href={DMM_ANALYTICS_URL[chainId as ChainId]}>
              <PieChart size={14} />
              <Trans>Analytics</Trans>
            </MenuItem>
          )}
          <MenuItem id="link" href="https://docs.kyberswap.com">
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
          <MenuItem id="link" href="https://forms.gle/gLiNsi7iUzHws2BY8">
            <Edit size={14} />
            <Trans>Contact Us</Trans>
          </MenuItem>
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
