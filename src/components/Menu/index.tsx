import { Trans, t } from '@lingui/macro'
import { useEffect, useState } from 'react'
import { isMobile } from 'react-device-detect'
import {
  Award,
  BookOpen,
  Edit,
  FileText,
  HelpCircle,
  Info,
  Menu as MenuIcon,
  MessageCircle,
  PieChart,
  Share2,
  UserPlus,
} from 'react-feather'
import { NavLink, useLocation } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Text } from 'rebass'
import styled, { css } from 'styled-components'

import { ReactComponent as BlogIcon } from 'assets/svg/blog.svg'
import { ReactComponent as DiscoverIconSvg } from 'assets/svg/discover_icon.svg'
import { ReactComponent as LightIcon } from 'assets/svg/light.svg'
import { ReactComponent as RoadMapIcon } from 'assets/svg/roadmap.svg'
import { ButtonEmpty, ButtonPrimary } from 'components/Button'
import { AutoColumn } from 'components/Column'
import SlideToUnlock from 'components/Header/SlideToUnlock'
import ArrowRight from 'components/Icons/ArrowRight'
import Faucet from 'components/Icons/Faucet'
import MailIcon from 'components/Icons/MailIcon'
import LanguageSelector from 'components/LanguageSelector'
import Loader from 'components/Loader'
import MenuFlyout from 'components/MenuFlyout'
import Row, { AutoRow } from 'components/Row'
import NotificationModal from 'components/SubscribeButton/NotificationModal'
import Toggle from 'components/Toggle'
import ThemeToggle from 'components/Toggle/ThemeToggle'
import { TutorialIds } from 'components/Tutorial/TutorialSwap/constant'
import { TAG } from 'constants/env'
import { AGGREGATOR_ANALYTICS_URL, APP_PATHS, DMM_ANALYTICS_URL, TERM_FILES_PATH } from 'constants/index'
import { getLocaleLabel } from 'constants/locales'
import { FAUCET_NETWORKS } from 'constants/networks'
import { EVMNetworkInfo } from 'constants/networks/type'
import { useActiveWeb3React } from 'hooks'
import useClaimReward from 'hooks/useClaimReward'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import useNotification from 'hooks/useNotification'
import useTheme from 'hooks/useTheme'
import { ApplicationModal } from 'state/application/actions'
import { useModalOpen, useToggleModal } from 'state/application/hooks'
import { useTutorialSwapGuide } from 'state/tutorial/hooks'
import { useDarkModeManager, useHolidayMode, useUserLocale } from 'state/user/hooks'
import { ExternalLink } from 'theme'
import { isChristmasTime } from 'utils'

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
  font-size: 15px;

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

const NavLinkBetween = styled(MenuItem)`
  justify-content: space-between;
  position: unset !important;
  max-height: 40px;
  svg {
    margin: 0;
    width: unset;
    height: unset;
  }
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
    border: 1px solid ${({ theme }) => theme.primary};
  }

  ${({ active }) =>
    active &&
    css`
      cursor: pointer;
      outline: none;
      background-color: ${({ theme }) => theme.buttonBlack};
    `}
`

const StyledMenu = styled.div`
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
  width: 230px;
  ${({ theme }) => theme.mediaWidth.upToLarge`
    top: unset;
    bottom: 3.5rem;
  `};
`

const MenuFlyoutMobileStyle = css`
  overflow-y: scroll;
`

const ClaimRewardButton = styled(ButtonPrimary)`
  margin-top: 10px;
  padding: 11px;
  font-size: 14px;
  width: max-content;
  ${!isMobile &&
  css`
    margin-left: auto;
    margin-right: auto;
  `}
`

export const NewLabel = styled.span`
  font-size: 10px;
  color: ${({ theme }) => theme.red};
  height: calc(100% + 4px);
  margin-left: 2px;
`
const Divider = styled.div`
  border-top: 1px solid ${({ theme }) => theme.border};
  margin-top: 10px;
  margin-bottom: 10px;
`

const Title = styled(MenuItem)`
  font-weight: 500;
  font-size: 16px;
  color: ${({ theme }) => theme.text};
`
const noop = () => {
  //
}

export default function Menu() {
  const { chainId, account, isEVM, networkInfo } = useActiveWeb3React()
  const theme = useTheme()

  const open = useModalOpen(ApplicationModal.MENU)
  const toggle = useToggleModal(ApplicationModal.MENU)
  const { showNotificationModal } = useNotification()
  const [darkMode, toggleSetDarkMode] = useDarkModeManager()
  const [holidayMode, toggleHolidayMode] = useHolidayMode()
  const [isSelectingLanguage, setIsSelectingLanguage] = useState(false)

  const userLocale = useUserLocale()
  const location = useLocation()

  const { mixpanelHandler } = useMixpanel()

  const setShowTutorialSwapGuide = useTutorialSwapGuide()[1]
  const openTutorialSwapGuide = () => {
    setShowTutorialSwapGuide({ show: true, step: 0 })
    mixpanelHandler(MIXPANEL_TYPE.TUTORIAL_CLICK_START)
    toggle()
  }
  const under1440 = useMedia('(max-width: 1440px)')
  const above1321 = useMedia('(min-width: 1321px)')
  const under1040 = useMedia('(max-width: 1040px)')

  const bridgeLink = networkInfo.bridgeURL
  const toggleClaimPopup = useToggleModal(ApplicationModal.CLAIM_POPUP)
  const toggleFaucetPopup = useToggleModal(ApplicationModal.FAUCET_POPUP)
  const { pendingTx } = useClaimReward()

  useEffect(() => {
    if (!open) setIsSelectingLanguage(false)
  }, [open])

  return (
    <StyledMenu>
      <MenuFlyout
        trigger={
          <StyledMenuButton active={open} onClick={toggle} aria-label="Menu" id={TutorialIds.BUTTON_MENU_HEADER}>
            <StyledMenuIcon />
          </StyledMenuButton>
        }
        customStyle={MenuFlyoutBrowserStyle}
        mobileCustomStyle={MenuFlyoutMobileStyle}
        isOpen={open}
        toggle={toggle}
        hasArrow
      >
        {isSelectingLanguage ? (
          <AutoColumn gap="md">
            <LanguageSelector setIsSelectingLanguage={setIsSelectingLanguage} />
          </AutoColumn>
        ) : (
          <>
            <Title style={{ paddingTop: 0 }}>
              <Trans>Menu</Trans>
            </Title>
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
            {under1040 && (
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
              <ExternalLink href={TERM_FILES_PATH.KYBERSWAP_TERMS}>
                <FileText />
                <Trans>Terms</Trans>
              </ExternalLink>
            </MenuItem>
            <MenuItem>
              <ExternalLink href="https://forms.gle/gLiNsi7iUzHws2BY8">
                <Edit />
                <Trans>Business Enquiries</Trans>
              </ExternalLink>
            </MenuItem>
            <MenuItem>
              <ExternalLink href="https://support.kyberswap.com">
                <HelpCircle size={20} />
                <Trans>Help</Trans>
              </ExternalLink>
            </MenuItem>

            <Divider />

            <Title>
              <Trans>Preferences</Trans>
            </Title>

            {location.pathname.startsWith(APP_PATHS.SWAP) && (
              <NavLinkBetween
                id={TutorialIds.BUTTON_VIEW_GUIDE_SWAP}
                onClick={() => {
                  toggle()
                  openTutorialSwapGuide()
                }}
              >
                <Trans>Swap Guide</Trans>
                <Row justify="flex-end">
                  <Text color={theme.text}>View</Text>&nbsp;
                  <LightIcon color={theme.text} />
                </Row>
              </NavLinkBetween>
            )}
            {isChristmasTime() && (
              <NavLinkBetween onClick={toggleHolidayMode}>
                <Trans>Holiday Mode</Trans>
                <Toggle isActive={holidayMode} toggle={noop} />
              </NavLinkBetween>
            )}

            <NavLinkBetween onClick={toggleSetDarkMode}>
              <Trans>Dark Mode</Trans>
              <ThemeToggle id="toggle-dark-mode-button" isDarkMode={darkMode} toggle={noop} />
            </NavLinkBetween>
            <NavLinkBetween
              onClick={() => {
                showNotificationModal()
                mixpanelHandler(MIXPANEL_TYPE.NOTIFICATION_CLICK_MENU)
              }}
            >
              <Trans>Notifications</Trans>
              <MailIcon size={17} color={theme.text} />
            </NavLinkBetween>
            <NavLinkBetween onClick={() => setIsSelectingLanguage(true)}>
              <Trans>Language</Trans>
              <ButtonEmpty
                padding="0"
                width="fit-content"
                style={{ color: theme.text, textDecoration: 'none', fontSize: '14px' }}
              >
                {getLocaleLabel(userLocale, true)}&nbsp;&nbsp;
                <ArrowRight fill={theme.text} />
              </ButtonEmpty>
            </NavLinkBetween>

            <Divider />

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

            <Text fontSize="10px" fontWeight={300} color={theme.subText} mt="16px" textAlign={'center'}>
              kyberswap@{TAG}
            </Text>
          </>
        )}
      </MenuFlyout>

      <ClaimRewardModal />
      <NotificationModal />
      {FAUCET_NETWORKS.includes(chainId) && <FaucetModal />}
    </StyledMenu>
  )
}
