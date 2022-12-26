import { Trans, t } from '@lingui/macro'
import { useRef } from 'react'
import { isMobile } from 'react-device-detect'
import {
  Award,
  BookOpen,
  Edit,
  FileText,
  Info,
  Menu as MenuIcon,
  MessageCircle,
  PieChart,
  Share2,
  Triangle,
  UserPlus,
} from 'react-feather'
import { NavLink } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Text } from 'rebass'
import styled, { css } from 'styled-components'

import { ReactComponent as BlogIcon } from 'assets/svg/blog.svg'
import { ReactComponent as DiscoverIconSvg } from 'assets/svg/discover_icon.svg'
import { ReactComponent as RoadMapIcon } from 'assets/svg/roadmap.svg'
import { ButtonPrimary } from 'components/Button'
import SlideToUnlock from 'components/Header/SlideToUnlock'
import Faucet from 'components/Icons/Faucet'
import Loader from 'components/Loader'
import MenuFlyout from 'components/MenuFlyout'
import { AutoRow } from 'components/Row'
import { ENV_LEVEL, ENV_TYPE, TAG } from 'constants/env'
import { AGGREGATOR_ANALYTICS_URL, DMM_ANALYTICS_URL } from 'constants/index'
import { FAUCET_NETWORKS } from 'constants/networks'
import { EVMNetworkInfo } from 'constants/networks/type'
import { useActiveWeb3React } from 'hooks'
import useClaimReward from 'hooks/useClaimReward'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import useTheme from 'hooks/useTheme'
import { ApplicationModal } from 'state/application/actions'
import { useModalOpen, useToggleModal } from 'state/application/hooks'
import { ExternalLink } from 'theme'

import ClaimRewardModal from './ClaimRewardModal'
import FaucetModal from './FaucetModal'
import NavDropDown from './NavDropDown'

const MenuItem = styled.li`
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
    a {
      color: ${({ theme }) => theme.text};
    }
  }

  svg {
    margin-right: 8px;
    height: 16px;
    width: 16px;
  }

  a {
    color: ${({ theme }) => theme.subText};
    display: flex;
    align-items: center;
    :hover {
      text-decoration: none;
      color: ${({ theme }) => theme.text};
    }
  }
`

const StyledMenuIcon = styled(MenuIcon)`
  path {
    stroke: ${({ theme }) => theme.text};
  }
`

const DiscoverWrapper = styled(MenuItem)`
  display: none;

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    display: flex;
  `};
`

const CampaignWrapper = styled(MenuItem)`
  display: none;

  /* It's better to break at 420px than at extraSmall */
  @media (max-width: 420px) {
    display: flex;
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

const MenuFlyoutBrowserStyle = css`
  min-width: unset;
  right: -8px;
`

const MenuFlyoutMobileStyle = css`
  overflow-y: scroll;
`

const ClaimRewardButton = styled(ButtonPrimary)`
  margin-top: 20px;
  padding: 11px;
  font-size: 14px;
  width: 100%;
  max-width: 180px;
`

export const NewLabel = styled.span`
  font-size: 10px;
  color: ${({ theme }) => theme.red};
  height: calc(100% + 4px);
  margin-left: 2px;
`

export default function Menu() {
  const { chainId, account, isEVM, networkInfo } = useActiveWeb3React()
  const theme = useTheme()
  const node = useRef<HTMLDivElement>()
  const open = useModalOpen(ApplicationModal.MENU)
  const toggle = useToggleModal(ApplicationModal.MENU)

  const under1440 = useMedia('(max-width: 1440px)')
  const above1321 = useMedia('(min-width: 1321px)')
  const under1200 = useMedia('(max-width: 1200px)')

  const bridgeLink = networkInfo.bridgeURL
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
        {FAUCET_NETWORKS.includes(chainId) && (
          <MenuItem
            onClick={() => {
              toggleFaucetPopup()
              mixpanelHandler(MIXPANEL_TYPE.FAUCET_MENU_CLICKED)
            }}
          >
            <Faucet />
            <Text width="max-content">
              <Trans>Faucet</Trans>
            </Text>
          </MenuItem>
        )}

        {bridgeLink && (
          <MenuItem>
            <ExternalLink href={bridgeLink}>
              <Share2 />
              <Trans>Bridge Assets</Trans>
            </ExternalLink>
          </MenuItem>
        )}

        <DiscoverWrapper>
          <NavLink to={'/discover?tab=trending_soon'} onClick={toggle}>
            <DiscoverIconSvg />
            <SlideToUnlock>
              <Trans>Discover</Trans>
            </SlideToUnlock>
            <NewLabel>
              <Trans>New</Trans>
            </NewLabel>
          </NavLink>
        </DiscoverWrapper>

        <CampaignWrapper>
          <NavLink to="/campaigns" onClick={toggle}>
            <Award />
            <Trans>Campaigns</Trans>
          </NavLink>
        </CampaignWrapper>

        {under1440 && (
          <MenuItem>
            <NavDropDown
              icon={<Info />}
              title={'About'}
              link={'/about'}
              options={[
                { link: '/about/kyberswap', label: 'Kyberswap' },
                { link: '/about/knc', label: 'KNC' },
              ]}
            />
          </MenuItem>
        )}
        <MenuItem>
          <NavLink to="/referral" onClick={toggle}>
            <UserPlus />
            <Trans>Referral</Trans>
          </NavLink>
        </MenuItem>
        {under1200 && (
          <MenuItem>
            <NavDropDown
              icon={<Info />}
              title={'KyberDAO'}
              link={'/kyberdao/stake-knc'}
              options={[
                { link: '/kyberdao/stake-knc', label: 'Stake KNC' },
                { link: '/kyberdao/vote', label: 'Vote' },
                { link: 'https://kyberswap.canny.io/feature-request', label: 'Feature Request', external: true },
              ]}
            />
          </MenuItem>
        )}
        {!above1321 && (
          <MenuItem>
            <NavDropDown
              icon={<PieChart />}
              link="#"
              title={'Analytics'}
              options={[
                { link: DMM_ANALYTICS_URL[chainId], label: t`Liquidity`, external: true },
                {
                  link: AGGREGATOR_ANALYTICS_URL,
                  label: t`Aggregator`,
                  external: true,
                },
              ]}
            />
          </MenuItem>
        )}
        <MenuItem>
          <ExternalLink href="https://docs.kyberswap.com">
            <BookOpen />
            <Trans>Docs</Trans>
          </ExternalLink>
        </MenuItem>

        <MenuItem>
          <ExternalLink href="https://kyberswap.canny.io/" onClick={toggle}>
            <RoadMapIcon />
            <Trans>Roadmap</Trans>
          </ExternalLink>
        </MenuItem>

        <MenuItem>
          <ExternalLink href="https://gov.kyber.org">
            <MessageCircle />
            <Trans>Forum</Trans>
          </ExternalLink>
        </MenuItem>

        {under1440 && (
          <MenuItem>
            <ExternalLink href="https://blog.kyberswap.com">
              <BlogIcon />
              <Trans>Blog</Trans>
            </ExternalLink>
          </MenuItem>
        )}

        <MenuItem>
          <ExternalLink href="/15022022KyberSwapTermsofUse.pdf">
            <FileText />
            <Trans>Terms</Trans>
          </ExternalLink>
        </MenuItem>
        {ENV_LEVEL < ENV_TYPE.PROD && (
          <MenuItem>
            <NavLink to="/swap-legacy" onClick={toggle}>
              <Triangle size={14} />
              <Trans>Swap Legacy</Trans>
            </NavLink>
          </MenuItem>
        )}
        <MenuItem>
          <ExternalLink href="https://forms.gle/gLiNsi7iUzHws2BY8">
            <Edit />
            <Trans>Business Enquiries</Trans>
          </ExternalLink>
        </MenuItem>
        <AutoRow justify="center">
          <ClaimRewardButton
            disabled={!account || !isEVM || !(networkInfo as EVMNetworkInfo).classic.claimReward || pendingTx}
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
        </AutoRow>

        <Text fontSize="10px" fontWeight={300} color={theme.subText} mt="16px" textAlign={isMobile ? 'left' : 'center'}>
          kyberswap@{TAG}
        </Text>
      </MenuFlyout>
      <ClaimRewardModal />
      {FAUCET_NETWORKS.includes(chainId) && <FaucetModal />}
    </StyledMenu>
  )
}
