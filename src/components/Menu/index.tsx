import React, { useRef } from 'react'
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
import styled, { css } from 'styled-components'
import { NavLink } from 'react-router-dom'
import { Trans, t } from '@lingui/macro'
import { Text } from 'rebass'
import { ChainId } from '@dynamic-amm/sdk'
import { ApplicationModal } from 'state/application/actions'
import { useModalOpen, useToggleModal } from 'state/application/hooks'
import { ExternalLink } from 'theme'
import { DMM_ANALYTICS_URL } from '../../constants'
import { useActiveWeb3React } from 'hooks'
import { useMedia } from 'react-use'
// import { SlideToUnlock } from 'components/Header'
import MenuFlyout from 'components/MenuFlyout'

const StyledMenuIcon = styled(MenuIcon)`
  path {
    stroke: ${({ theme }) => theme.text};
  }
`

const StyledMenuButton = styled.button<{ active?: boolean }>`
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

  :hover {
    cursor: pointer;
    outline: none;
    background-color: ${({ theme }) => theme.buttonBlack};
  }

  ${({ active }) =>
    active
      ? css`
          cursor: pointer;
          outline: none;
          background-color: ${({ theme }) => theme.buttonBlack};
        `
      : ''}
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

const NavMenuItem = styled(NavLink)`
  flex: 1;
  padding: 0.75rem 0;
  text-decoration: none;
  display: flex;
  font-weight: 500;
  white-space: nowrap;
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
  padding: 0.75rem 0;
  display: flex;
  font-weight: 500;
  align-items: center;
  white-space: nowrap;
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

const MenuFlyoutBrowserStyle = css`
  min-width: unset;
  right: -8px;

  & ${MenuItem}:nth-child(1),
  & ${NavMenuItem}:nth-child(1) {
    padding-top: 0.5rem;
  }
`

const MenuFlyoutMobileStyle = css`
  & ${MenuItem}:nth-child(1),
  & ${NavMenuItem}:nth-child(1) {
    padding-top: 0.5rem;
  }
`

export default function Menu() {
  const { chainId } = useActiveWeb3React()
  const node = useRef<HTMLDivElement>()
  const open = useModalOpen(ApplicationModal.MENU)
  const toggle = useToggleModal(ApplicationModal.MENU)

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
      <StyledMenuButton active={open} onClick={toggle} aria-label="Menu">
        <StyledMenuIcon />
      </StyledMenuButton>

      <MenuFlyout
        node={node}
        browserCustomStyle={MenuFlyoutBrowserStyle}
        mobileCustomStyle={MenuFlyoutMobileStyle}
        isOpen={open}
        toggle={toggle}
        translatedTitle={t`Menu`}
        hasArrow
      >
        {/* !above768 && (
          <MenuItem href={process.env.REACT_APP_ZKYBER_URL ?? ''}>
            <img src="https://kyberswap.com/favicon.ico" width="14" alt="KyberSwap" />
            <SlideToUnlock>
              <Text width="max-content" marginLeft="8px">
                ZKyber ↗
              </Text>
            </SlideToUnlock>
          </MenuItem>
          ) */}
        {bridgeLink && (
          <MenuItem href={bridgeLink}>
            <Share2 size={14} />
            <Text width="max-content">
              <Trans>Bridge Assets</Trans>
            </Text>
          </MenuItem>
        )}

        {!above768 && (
          <NavMenuItem to="/myPools" onClick={toggle}>
            <Monitor size={14} />
            <Trans>My Pools</Trans>
          </NavMenuItem>
        )}
        {!above1320 && (
          <NavMenuItem to="/about" onClick={toggle}>
            <Info size={14} />
            <Trans>About</Trans>
          </NavMenuItem>
        )}
        {chainId && [ChainId.MAINNET, ChainId.ROPSTEN].includes(chainId) && (
          <NavMenuItem to="/migration" onClick={toggle}>
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
          <NavMenuItem to="/swap-legacy" onClick={toggle}>
            <Triangle size={14} />
            <Trans>Swap Legacy</Trans>
          </NavMenuItem>
        )}
        <MenuItem id="link" href="https://forms.gle/gLiNsi7iUzHws2BY8">
          <Edit size={14} />
          <Trans>Contact Us</Trans>
        </MenuItem>
      </MenuFlyout>
    </StyledMenu>
  )
}
