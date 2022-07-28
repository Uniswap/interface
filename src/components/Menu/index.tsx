import React, { useRef } from 'react'
import styled, { css } from 'styled-components'
import { NavLink } from 'react-router-dom'
import { t, Trans } from '@lingui/macro'
import { Text } from 'rebass'

import { ChainId } from '@kyberswap/ks-sdk-core'
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
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import ClaimRewardModal from './ClaimRewardModal'
import FaucetModal from './FaucetModal'
import DiscoverIcon from 'components/Icons/DiscoverIcon'
import Faucet from 'components/Icons/Faucet'
import AboutPageDropwdown from './AboutPageDropDown'
import {
  BookOpen,
  Edit,
  FileText,
  Menu as MenuIcon,
  MessageCircle,
  PieChart,
  Share2,
  Triangle,
  UserPlus,
} from 'react-feather'
import { MoneyBag } from 'components/Icons'
import { NETWORKS_INFO } from 'constants/networks'

const sharedStylesMenuItem = css`
  flex: 1;
  padding: 0.75rem 0;
  text-decoration: none;
  display: flex;
  font-weight: 500;
  white-space: nowrap;
  align-items: center;
  color: ${({ theme }) => theme.subText};

  :hover {
    color: ${({ theme }) => theme.text};
    cursor: pointer;
    text-decoration: none;
  }

  > svg {
    margin-right: 8px;
  }
`

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

  border-radius: 999px;

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

export const NavMenuItem = styled(NavLink)`
  ${sharedStylesMenuItem}
`

const MenuItem = styled(ExternalLink)`
  ${sharedStylesMenuItem}
`

const MenuButton = styled.div`
  ${sharedStylesMenuItem}
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

export const NewLabel = styled.span`
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

  const under1440 = useMedia('(max-width: 1440px)')
  const above1321 = useMedia('(min-width: 1321px)')
  const above768 = useMedia('(min-width: 768px)')

  const getBridgeLink = () => {
    if (!chainId) return ''
    return NETWORKS_INFO[chainId].bridgeURL
  }

  const bridgeLink = getBridgeLink()
  const toggleClaimPopup = useToggleModal(ApplicationModal.CLAIM_POPUP)
  const toggleFaucetPopup = useToggleModal(ApplicationModal.FAUCET_POPUP)
  const { pendingTx } = useClaimReward()
  const { mixpanelHandler } = useMixpanel()
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
        {chainId && [ChainId.BTTC, ChainId.RINKEBY].includes(chainId) && (
          <MenuButton
            onClick={() => {
              toggleFaucetPopup()
              mixpanelHandler(MIXPANEL_TYPE.FAUCET_MENU_CLICKED)
            }}
          >
            <Faucet />
            <Text width="max-content">
              <Trans>Faucet</Trans>
            </Text>
          </MenuButton>
        )}

        {bridgeLink && (
          <MenuItem href={bridgeLink}>
            <Share2 size={14} />
            <Text width="max-content">
              <Trans>Bridge Assets</Trans>
            </Text>
          </MenuItem>
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

        {!above768 && (
          <NavMenuItem to="/farms" onClick={toggle}>
            <MoneyBag size={16} />
            <Trans>Farm</Trans>
          </NavMenuItem>
        )}

        {under1440 && <AboutPageDropwdown />}

        <NavMenuItem to="/referral" onClick={toggle}>
          <UserPlus size={14} />
          <Trans>Referral</Trans>
        </NavMenuItem>
        {!above1321 && (
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
          disabled={!account || (!!chainId && NETWORKS_INFO[chainId].classic.claimReward === '') || pendingTx}
          onClick={() => {
            mixpanelHandler(MIXPANEL_TYPE.CLAIM_REWARDS_INITIATED)
            toggleClaimPopup()
          }}
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
      <FaucetModal />
    </StyledMenu>
  )
}
