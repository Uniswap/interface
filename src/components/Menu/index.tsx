import React, { useRef } from 'react'
import styled, { css } from 'styled-components'
import { NavLink } from 'react-router-dom'
import { t, Trans } from '@lingui/macro'
import { Text } from 'rebass'
import { ChainId } from '@dynamic-amm/sdk'
import { ApplicationModal } from 'state/application/actions'
import { useModalOpen, useToggleModal } from 'state/application/hooks'
import { ExternalLink } from 'theme'
import { DMM_ANALYTICS_URL } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { useMedia } from 'react-use'
import { SlideToUnlock } from 'components/Header'
import MenuFlyout from 'components/MenuFlyout'
import { ButtonPrimary } from 'components/Button'
import useClaimReward from 'hooks/useClaimReward'
import Loader from 'components/Loader'
import ClaimRewardModal from 'components/Menu/ClaimRewardModal'
import DiscoverIcon from 'components/Icons/DiscoverIcon'
import {
  BookOpen,
  Edit,
  FileText,
  Info,
  Menu as MenuIcon,
  MessageCircle,
  Monitor,
  PieChart,
  Share2,
  Triangle,
  UserPlus,
} from 'react-feather'

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
const ClaimRewardButton = styled(ButtonPrimary)`
  margin-top: 20px;
  padding: 11px;
  font-size: 14px;
  width: max-content;
`

const NewLabel = styled.span`
  font-size: 10px;
  color: ${({ theme }) => theme.red};
  height: calc(100% + 4px);
  margin-left: 2px;
`

export default function Menu() {
  const { chainId, account } = useActiveWeb3React()
  const theme = useTheme()
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
    if ([ChainId.ARBITRUM, ChainId.ARBITRUM_TESTNET].includes(chainId)) return 'https://bridge.arbitrum.io'
    if ([ChainId.BTTC].includes(chainId)) return 'https://wallet.bt.io/bridge'
    if ([ChainId.AURORA].includes(chainId)) return 'https://rainbowbridge.app'
    if ([ChainId.VELAS].includes(chainId)) return 'https://bridge.velaspad.io'
    if ([ChainId.OASIS].includes(chainId)) return 'https://oasisprotocol.org/b-ridges'

    return ''
  }

  const bridgeLink = getBridgeLink()
  const toggleClaimPopup = useToggleModal(ApplicationModal.CLAIM_POPUP)
  const { pendingTx } = useClaimReward()

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

        {!above768 && (
          <NavMenuItem to={'/discover?tab=trending_soon'} onClick={toggle}>
            <DiscoverIcon size={14} />
            <SlideToUnlock>
              <Text width="max-content">
                <Trans>Discover</Trans>
              </Text>
            </SlideToUnlock>
            <NewLabel>
              <Trans>New</Trans>
            </NewLabel>
          </NavMenuItem>
        )}

        {!above1320 && (
          <NavMenuItem to="/about" onClick={toggle}>
            <Info size={14} />
            <Trans>About</Trans>
          </NavMenuItem>
        )}

        <NavMenuItem to="/referral" onClick={toggle}>
          <UserPlus size={14} />
          <Trans>Referral</Trans>
          <NewLabel>
            <Trans>New</Trans>
          </NewLabel>
        </NavMenuItem>
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
          <MessageCircle size={14} />
          <Trans>Forum</Trans>
        </MenuItem>

        <MenuItem id="link" href="/15022022KyberSwapTermsofUse.pdf">
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
        <ClaimRewardButton
          disabled={!account || (!!chainId && ![ChainId.MATIC, ChainId.ROPSTEN].includes(chainId)) || pendingTx}
          onClick={toggleClaimPopup}
        >
          {pendingTx ? (
            <>
              <Loader style={{ marginRight: '5px' }} stroke={theme.disableText} /> <Trans>Claiming...</Trans>
            </>
          ) : (
            <Trans>Claim Rewards</Trans>
          )}
        </ClaimRewardButton>
      </MenuFlyout>
      <ClaimRewardModal />
    </StyledMenu>
  )
}
