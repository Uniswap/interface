import { Trans } from '@lingui/macro'
import useScrollPosition from '@react-hook/window-scroll'
import LimitWarningModal from 'components/LimitWarning/LimitWarningModal'
import PerpModal from 'components/Perpetual/PerpModal'
import { CHAIN_INFO, SupportedChainId } from 'constants/chains'
import { KROM } from 'constants/tokens'
import useTheme from 'hooks/useTheme'
import useUSDCPrice from 'hooks/useUSDCPrice'
import { darken } from 'polished'
import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Text } from 'rebass'
import { useModalOpen, useShowClaimPopup, useTogglePerpModal, useToggleSelfClaimModal } from 'state/application/hooks'
import { ApplicationModal } from 'state/application/reducer'
import { useUserHasAvailableClaim } from 'state/claim/hooks'
import { useUserHasSubmittedClaim } from 'state/transactions/hooks'
import { useDarkModeManager } from 'state/user/hooks'
import { useNativeCurrencyBalances } from 'state/wallet/hooks'
import styled from 'styled-components/macro'

import ComingSoon from '../../../src/assets/images/coming-soon.png'
import ComingSoonLight from '../../../src/assets/images/coming-soon-light.png'
import tokenLogo from '../../assets/images/krom_logo.png'
import { ReactComponent as Logo } from '../../assets/svg/logo.svg'
import { ReactComponent as PhoneScreenLogo } from '../../assets/svg/phone-logo.svg'
import { useActiveWeb3React } from '../../hooks/web3'
import { ExternalLink, MEDIA_WIDTHS, TYPE } from '../../theme'
import ClaimModal from '../claim/ClaimModal'
import { CardNoise } from '../earn/styled'
import Menu from '../Menu'
import Modal from '../Modal'
import Row from '../Row'
import { Dots } from '../swap/styleds'
import Web3Status from '../Web3Status'
import NetworkSelector from './NetworkSelector'
import UniBalanceContent from './UniBalanceContent'

const HeaderFrame = styled.div<{ showBackground: boolean }>`
  display: grid;
  grid-template-columns: 120px 1fr 240px;
  justify-content: space-between;
  align-items: center;
  flex-direction: row;
  width: 100%;
  top: 0;
  position: relative;
  padding: 0.5rem;
  z-index: 21;
  /* Background slide effect on scroll. */
  background-image: ${({ theme }) => `linear-gradient(to bottom, transparent 50%, ${theme.bg0} 50% )}}`};
  background-position: ${({ showBackground }) => (showBackground ? '0 -100%' : '0 0')};
  background-size: 100% 200%;
  box-shadow: 0px 0px 0px 1px ${({ theme, showBackground }) => (showBackground ? theme.bg2 : 'transparent;')};
  transition: background-position 0.1s, box-shadow 0.1s;
  background-blend-mode: hard-light;

  ${({ theme }) => theme.mediaWidth.upToLarge`
    grid-template-columns: 175px 1fr 1fr;
  `};

  ${({ theme }) => theme.mediaWidth.upToMedium`
    padding:  0.5rem;
    grid-template-columns: 1fr 1fr;
  `};

  ${({ theme }) => theme.mediaWidth.upToSmall`
    padding:  1rem;
    grid-template-columns: 36px 240px;
  `};
`

const MainLogo = styled.div`
  @media screen and (max-width: 550px) {
    display: none;
  }
`

const PhoneLogo = styled.div`
  @media screen and (min-width: 550px) {
    display: none;
  }

  @media screen and (max-width: 380px) {
    position: relative;
    left: -15px;
  }
`

const StyledImage = styled.img`
  height: 15px;
  width: 40px;
  tranform: rotate(20deg);
  position: relative;
  left: -20px;
  top: -10px;
`

const HeaderControls = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-self: flex-end;
`

const HeaderElement = styled.div`
  display: flex;
  align-items: center;

  &:not(:first-child) {
    margin-left: 0.5em;
  }

  /* addresses safari's lack of support for "gap" */
  & > *:not(:first-child) {
    margin-left: 8px;
  }

  ${({ theme }) => theme.mediaWidth.upToMedium`
    align-items: center;
  `};
`

const HeaderLinks = styled(Row)`
  justify-self: center;
  background-color: ${({ theme }) => theme.bg0};
  width: fit-content;
  padding: 4px;
  border-radius: 16px;
  display: grid;
  grid-auto-flow: column;
  grid-gap: 10px;
  overflow: auto;
  align-items: center;
  ${({ theme }) => theme.mediaWidth.upToLarge`
    justify-self: start;  
    `};
  ${({ theme }) => theme.mediaWidth.upToMedium`
    justify-self: center;
  `};
  ${({ theme }) => theme.mediaWidth.upToMedium`
    flex-direction: row;
    justify-content: space-between;
    justify-self: center;
    z-index: 99;
    position: fixed;
    bottom: 0; right: 50%;
    transform: translate(50%,-50%);
    margin: 0 auto;
    background-color: ${({ theme }) => theme.bg0};
    border: 1px solid ${({ theme }) => theme.bg2};
    box-shadow: 0px 6px 10px rgb(0 0 0 / 2%);
  `};
`

const AccountElement = styled.div<{ active: boolean }>`
  display: flex;
  flex-direction: row;
  align-items: center;
  background-color: ${({ theme, active }) => (!active ? theme.bg1 : theme.bg1)};
  border-radius: 12px;
  white-space: nowrap;
  width: 100%;

  :focus {
    border: 1px solid blue;
  }
`

const UNIAmount = styled(AccountElement)`
  color: white;
  padding: 4px 8px;
  height: 36px;
  font-weight: 500;
  background-color: ${({ theme }) => theme.bg3};
  background: radial-gradient(174.47% 188.91% at 1.84% 0%, #ff007a 0%, #2172e5 100%), #edeef2;
`

const KromPriceStyled = styled.div`
  font-weight: 500;
  width: 110px;
  display: flex;
  justify-content: center;
`

const UNIWrapper = styled.span`
  width: fit-content;
  position: relative;
  cursor: pointer;

  :hover {
    opacity: 0.8;
  }

  :active {
    opacity: 0.9;
  }
`

const BalanceText = styled(Text)`
  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    display: none;
  `};
`

const Title = styled.a`
  display: flex;
  align-items: center;
  pointer-events: auto;
  justify-self: flex-start;
  margin-right: 12px;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    justify-self: center;
  `};
  :hover {
    cursor: pointer;
  }
`

const UniIcon = styled.div`
  transition: transform 0.3s ease;
  overflow: hidden;
  width: 200px;
  :hover {
    transform: rotate(-5deg);
  }

  @media screen and (max-width: 720px) {
    margin-left: 150px;
  }
`

const activeClassName = 'ACTIVE'

const StyledNavLink = styled(NavLink).attrs({
  activeClassName,
})`
  ${({ theme }) => theme.flexRowNoWrap}
  align-items: left;
  border-radius: 3rem;
  outline: none;
  cursor: pointer;
  text-decoration: none;
  color: ${({ theme }) => theme.text2};
  font-size: 1rem;
  overflow: hidden;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    font-size: 0.7rem;
    overflow: visible
  `};
  font-weight: 500;
  padding: 8px 12px;
  word-break: break-word;

  white-space: nowrap;
  &.${activeClassName} {
    border-radius: 12px;
    font-weight: 600;
    justify-content: center;
    color: ${({ theme }) => theme.text1};
    background-color: ${({ theme }) => theme.bg2};
  }

  :hover,
  :focus {
    color: ${({ theme }) => darken(0.1, theme.text1)};
  }
`

const StyledExternalLink = styled(ExternalLink).attrs({
  activeClassName,
})<{ isActive?: boolean }>`
  ${({ theme }) => theme.flexRowNoWrap}
  align-items: left;
  border-radius: 3rem;
  outline: none;
  cursor: pointer;
  text-decoration: none;
  color: ${({ theme }) => theme.text2};
  font-size: 1rem;
  width: fit-content;
  margin: 0 12px;
  font-weight: 500;

  &.${activeClassName} {
    border-radius: 12px;
    font-weight: 600;
    color: ${({ theme }) => theme.text1};
  }

  :hover,
  :focus {
    color: ${({ theme }) => darken(0.1, theme.text1)};
    text-decoration: none;
  }
`

const StyledPrice = styled.span`
  position: relative;
  top: -2px;
`

const StyledNavLinkAlt = styled.button`
  background-color: transparent;
  border-color: transparent;
  border-width: 0px;
  cursor: pointer;
  color: ${({ theme }) => theme.text2};
  &.${activeClassName} {
    border-radius: 12px;
    font-weight: 600;
    color: ${({ theme }) => theme.text1};
  }

  :hover,
  :focus {
    color: ${({ theme }) => darken(0.1, theme.text1)};
    text-decoration: none;
  }
  font-size: 1rem;
  overflow: hidden;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    font-size: 0.7rem;
    overflow: visible
  `};
  font-weight: 500;
  padding: 8px 12px;
  word-break: break-word;
  white-space: nowrap;
  text-decoration: none;
`

export default function Header() {
  const { account, chainId } = useActiveWeb3React()

  const userEthBalance = useNativeCurrencyBalances(account ? [account] : [])?.[account ?? '']
  const [darkMode] = useDarkModeManager()
  const { white, black } = useTheme()

  const toggleClaimModal = useToggleSelfClaimModal()
  const togglePerpModal = useTogglePerpModal()

  function TopLevelModals() {
    const open = useModalOpen(ApplicationModal.PERP_POPUP)
    const toggle = useTogglePerpModal()
    return <PerpModal isOpen={open} onDismiss={toggle} />
  }

  const handleTogglePerpModal = () => {
    const tickingDate = localStorage.getItem('KromTOUTicked')

    if (tickingDate == null) {
      togglePerpModal()
    } else {
      const millis = Date.now() - (tickingDate as unknown as number)
      // External redirection
      if (Math.floor(millis / 1000 / 60 / 60 / 24) < 30) {
        window.open('https://perp.kromatika.finance/', '_blank')
      } else {
        togglePerpModal()
      }
    }
  }

  const availableClaim: boolean = useUserHasAvailableClaim(account)

  const { claimTxn } = useUserHasSubmittedClaim(account ?? undefined)

  const showClaimPopup = useShowClaimPopup()

  const scrollY = useScrollPosition()

  const kromToken = chainId ? KROM[chainId] : undefined

  const kromPrice = useUSDCPrice(kromToken)

  const pools: { [chainId: number]: string } = {
    [SupportedChainId.MAINNET]: 'https://info.uniswap.org/#/pools/0x6ae0cdc5d2b89a8dcb99ad6b3435b3e7f7290077',
    [SupportedChainId.ARBITRUM_ONE]:
      'https://info.uniswap.org/#/arbitrum/pools/0x54651ca452ad2d7e35babcff40760b7af0404213',
    [SupportedChainId.OPTIMISM]: 'https://info.uniswap.org/#/optimism/pools/0xe62bd99a9501ca33d98913105fc2bec5bae6e5dd',
    [SupportedChainId.POLYGON]: ' https://info.uniswap.org/#/polygon/pools/0xba589ba3af52975a12acc6de69c9ab3ac1ae7804',
  }
  const {
    infoLink,
    addNetworkInfo: {
      nativeCurrency: { symbol: nativeCurrencySymbol },
    },
  } = CHAIN_INFO[chainId ? chainId : SupportedChainId.MAINNET]

  const [isPolygonWarningModalOpen, setIsPolygonWarningModalOpen] = useState<boolean>(true)

  const handleDismissPolygonWarning = () => {
    setIsPolygonWarningModalOpen(false)
  }

  const hasClickedOnNavbarElement = () => {
    setIsPolygonWarningModalOpen(true)
  }
  return (
    <>
      <HeaderFrame showBackground={true}>
        <ClaimModal />
        <Title href=".">
          <UniIcon>
            <MainLogo>
              <Logo
                fill={darkMode ? white : black}
                transform="scale(9)"
                width="100px"
                height="35px"
                title="logo"
                z-index="1"
                viewBox="0 0 350 840"
              />
            </MainLogo>
            <PhoneLogo>
              <PhoneScreenLogo fill={darkMode ? white : black} width="100px" height="35px" title="logo" z-index="1" />
            </PhoneLogo>
          </UniIcon>
        </Title>
        <HeaderLinks>
          <StyledNavLink
            id={`pool-nav-link`}
            to={'/pool'}
            isActive={(match: any, { pathname }: any) =>
              Boolean(match) ||
              pathname.startsWith('/add') ||
              pathname.startsWith('/remove') ||
              pathname.startsWith('/increase') ||
              pathname.startsWith('/find')
            }
            onClick={() => hasClickedOnNavbarElement()}
          >
            <Trans>Dashboard</Trans>
          </StyledNavLink>
          <StyledNavLink id={`swap-nav-link`} to={'/limitorder'} onClick={() => hasClickedOnNavbarElement()}>
            <Trans>Limit</Trans>
          </StyledNavLink>
          <StyledNavLink id={`swap-nav-link`} to={'/swap'} onClick={() => hasClickedOnNavbarElement()}>
            <Trans>Swap</Trans>
          </StyledNavLink>
          <StyledNavLinkAlt
            id={`perp-nav-link`}
            // target="_blank"
            onClick={() => handleTogglePerpModal()}
          >
            <Trans>Perp</Trans>
          </StyledNavLinkAlt>
          {/* <StyledImage src={darkMode ? ComingSoon : ComingSoonLight}></StyledImage> */}
        </HeaderLinks>

        <HeaderControls>
          <HeaderElement>
            {chainId && (
              <ExternalLink href={pools[chainId]}>
                <KromPriceStyled>
                  {kromPrice ? (
                    <BalanceText
                      style={{
                        flexShrink: 0,
                        userSelect: 'none',
                        backgroundColor: darkMode ? '#212429' : '#F5F5F5',
                        borderRadius: '10px',
                        padding: '9px 8px',
                        color: darkMode ? 'white' : 'black',
                      }}
                      fontWeight={500}
                    >
                      <Trans>
                        {' '}
                        <img
                          src={tokenLogo}
                          width="20px"
                          height="20px"
                          style={{ position: 'relative', top: '2px', marginRight: '5px' }}
                        />
                        <StyledPrice> ${kromPrice?.toSignificant(2)}</StyledPrice>
                      </Trans>
                    </BalanceText>
                  ) : null}
                </KromPriceStyled>
              </ExternalLink>
            )}
          </HeaderElement>
          <HeaderElement>
            <NetworkSelector />
          </HeaderElement>
          <HeaderElement>
            {availableClaim && !showClaimPopup && (
              <UNIWrapper onClick={toggleClaimModal}>
                <UNIAmount active={!!account && !availableClaim} style={{ pointerEvents: 'auto' }}>
                  <TYPE.white padding="0 2px">
                    {claimTxn && !claimTxn?.receipt ? (
                      <Dots>
                        <Trans>Claiming UNI</Trans>
                      </Dots>
                    ) : (
                      <Trans>Claim UNI</Trans>
                    )}
                  </TYPE.white>
                </UNIAmount>
                <CardNoise />
              </UNIWrapper>
            )}
            <Web3Status />
          </HeaderElement>
          <HeaderElement>
            <Menu />
          </HeaderElement>
        </HeaderControls>
      </HeaderFrame>
      <TopLevelModals />
    </>
  )
}
