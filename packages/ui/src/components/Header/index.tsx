import {
  ChainId
  // TokenAmount
} from '@teleswap/sdk'
import TeleLogo from 'assets/images/tele/logo.svg'
import TextLogo from 'assets/svg/textLogo.svg'
import useThemedContext from 'hooks/useThemedContext'
import React, { useLayoutEffect, useState } from 'react'
import { useRef } from 'react'
// import { darken } from 'polished'
import { useTranslation } from 'react-i18next'
import { NavLink, NavLinkProps } from 'react-router-dom'
import { Box, Flex, Text } from 'rebass'
import styled from 'styled-components'

// import usePrevious from '../../hooks/usePrevious'
// import TeleLogoText from '../../assets/images/tele/logoText.svg'
import { useActiveWeb3React } from '../../hooks'
import { useDarkModeManager } from '../../state/user/hooks'
import {
  useETHBalances
  // useAggregateUniBalance
} from '../../state/wallet/hooks'
// import { CardNoise } from '../earn/styled'
// import { CountUp } from 'use-count-up'
// import { TYPE, ExternalLink } from '../../theme'
import { YellowCard } from '../Card'
// import ClaimModal from '../claim/ClaimModal'
// import { useToggleSelfClaimModal, useShowClaimPopup } from '../../state/application/hooks'
// import { useUserHasAvailableClaim } from '../../state/claim/hooks'
// import { useUserHasSubmittedClaim } from '../../state/transactions/hooks'
// import { Dots } from '../swap/styleds'
import Modal from '../Modal'
// import Menu from '../Menu'
import Row, { RowFixed } from '../Row'
import Web3Status from '../Web3Status'
import UniBalanceContent from './UniBalanceContent'

const HeaderFrame = styled.div`
  padding-top: 0.5rem;
  display: grid;
  grid-template-columns: 1fr;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  top: 0;
  position: relative;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  /* padding: 1rem; */
  z-index: 2;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    // grid-template-columns: 1fr;
    // padding: 0 1rem;
    width: 100%;
    position: relative;
  `};

  /* ${({ theme }) => theme.mediaWidth.upToExtraSmall`
        padding: 0.5rem 1rem;
  `} */
`

const HeaderControls = styled.div`
  padding: 0 1.3rem;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-self: flex-end;
  height: 4rem;
  max-height: 80px;
  width: 100%;
  /* ${({ theme }) => theme.mediaWidth.upToMedium`
    flex-direction: row;
    justify-content: space-between;
    justify-self: center;
    width: 100%;
    max-width: 960px;
    padding: 1rem;
    position: fixed;
    bottom: 0px;
    left: 0px;
    width: 100%;
    z-index: 99;
    height: 72px;
    border-radius: 12px 12px 0 0;
    background-color: ${({ theme }) => theme.bg1};
  `}; */
  ${({ theme }) => theme.mediaWidth.upToSmall`
    height: unset;
    max-height: unset;
    padding: unset;
  `}
`

const HeadLogoView = styled.div`
  .logoImg {
    display: none;
  }
  .textLogo {
    width: calc(120px + 7vw);
  }
  ${({ theme }) => theme.mediaWidth.upToSmall`
      height: 3.5rem;
      padding-left: 1.1rem;
      .logoImg {
        width: 1.8rem;
        height: auto;
        display: block;
      }
      .textLogo {
        display: none;
      }
  `}/*  .logoText {
    width: 6.6rem;
    height: 'auto';
    margin-left: 0.4rem;
    ${({ theme }) => theme.mediaWidth.upToSmall`
      display: none;
    `}
  } */
`
const HeadTabView = styled.div`
  height: 100%;
  /*  ${({ theme }) => theme.mediaWidth.upToSmall`
  `} */
`
const HeadWalletView = styled.div`
  ${({ theme }) => theme.mediaWidth.upToSmall`
      height: 3.5rem;
      padding-right: 1.1rem;
  `}
`

const HeaderElement = styled.div`
  width: 100%;
  height: 100%;
  align-items: center;
  display: grid;
  grid-template-rows: 1fr;
  grid-template-columns: 1fr 1fr 1fr;
  grid-template-areas: 'a1 a2 a3';
  width: 100%;
  /* addresses safari's lack of support for "gap" */
  & > *:not(:first-child) {
    margin-left: 8px;
  }

  ${({ theme }) => theme.mediaWidth.upToMedium`
    grid-template-rows: 1fr 1fr ;
    display: grid;
    grid-template-columns: 1fr 1fr 8fr;
    flex-direction: row-reverse;
    align-items: center;
    padding: 0 1rem;
    grid-row-gap: 1.5rem;
    grid-template-areas: 
          'a1 a1 a3'
          'a2 a2 a2'; 
    & > *:not(:first-child) {
      margin-left: unset;
    }
  `};
`

const HeaderElementWrap = styled.div`
  display: flex;
  align-items: center;
`

const HeaderRow = styled(RowFixed)`
  width: 100%;
  background: #161823;
  justify-content: center;
  height: 3.5rem;
  max-height: 70px;
  ${({ theme }) => theme.mediaWidth.upToMedium`
   width: 100%;
  `};
`

const HeaderLinks = styled(Row)`
  justify-content: center;
  height: 2.5rem;
  width: unset;
  padding: 0.3rem 0.4rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  font-family: 'Poppins';
  border-radius: 1rem;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    // padding: 1rem 0 1rem 1rem;
    justify-content: flex-end;
`};
  ${({ theme }) => theme.mediaWidth.upToSmall`
    width: unset;
    height: unset;
`};
`

const AccountElement = styled(Box)<{ active: boolean }>`
  width: 11.5rem;
  display: flex;
  flex-direction: row;
  align-items: center;
  background-color: ${({ theme, active }) => (!active ? theme.common1 : theme.common1)};
  border-radius: 1rem;
  white-space: nowrap;
  cursor: pointer;
  :focus {
    border: 1px solid blue;
  }
  ${({ theme }) => theme.mediaWidth.upToSmall`
    width: 10.5rem;
`};
`

// const UNIAmount = styled(AccountElement)`
//   color: white;
//   padding: 4px 8px;
//   height: 36px;
//   font-weight: 500;
//   background-color: ${({ theme }) => theme.bg3};
//   background: radial-gradient(174.47% 188.91% at 1.84% 0%, #ff007a 0%, #2172e5 100%), #edeef2;
// `

// const UNIWrapper = styled.span`
//   width: fit-content;
//   position: relative;
//   cursor: pointer;

//   :hover {
//     opacity: 0.8;
//   }

//   :active {
//     opacity: 0.9;
//   }
// `

const HideSmall = styled.span`
  ${({ theme }) => theme.mediaWidth.upToSmall`
    display: none;
  `};
`

const NetworkCard = styled(YellowCard)`
  border-radius: 12px;
  padding: 8px 12px;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    margin: 0;
    margin-right: 0.5rem;
    width: initial;
    overflow: hidden;
    text-overflow: ellipsis;
    flex-shrink: 1;
  `};
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
  :hover {
    transform: rotate(-5deg);
  }
`

const activeClassName = 'ACTIVE'

const StyledNavLink = styled(NavLink).attrs((props) => ({
  ...props,
  activeClassName,
  className: Array.isArray(props.className)
    ? [...props.className, 'text-emphasize']
    : props.className
    ? [props.className, 'text-emphasize']
    : ['text-emphasize']
}))`
  &:first-child {
    position: relative;
    left: -1px;
  }
  &:last-child {
    position: relative;
    right: -1px;
  }
  height: 100%;
  // padding: 0 1rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  ${({ theme }) => theme.flexRowNoWrap}
  outline: none;
  cursor: pointer;
  text-decoration: none;
  // color: ${({ theme }) => theme.text2};
  // width: max-content;
  margin: 0;
  font-weight: 600;
  border-radius: 0.8rem;
  font-family: 'Poppins';
  font-style: normal;
  font-weight: 400;
  // font-size: 0.7rem;
  line-height: 1rem;
  color: #ffffff;
  :hover {
    /* background: #0A1B1F;
    color: #FFFFFF;
    border: none;
    line-height: .9rem; */
  }
  &.${activeClassName} {
    background: rgba(57, 225, 186, 0.1);
    font-weight: 800;
    color: rgb(57, 225, 186);
    // background: ${({ theme }) => theme.primary1};
  }
  ${({ theme }) => theme.mediaWidth.upToSmall`
     padding: .6rem 1.2rem;
     width: unset;
  `};
  /* :hover  {
    background: #0A1B1F;
    color: #FFFFFF;
    border: 1px solid green;
  } */
`

const FixedWidthStyledNavLink = function ({
  ...rest
}: React.PropsWithoutRef<NavLinkProps> & React.RefAttributes<HTMLAnchorElement>) {
  const ref = useRef<any>()
  useLayoutEffect(() => {
    console.log(ref.current)
    if (ref.current) {
      ref.current.style.width = `calc(${window.getComputedStyle(ref.current.childNodes[0]).width} + 2rem)`
    }
  }, [])
  return (
    <StyledNavLink {...rest} ref={ref}>
      {rest.children}
    </StyledNavLink>
  )
}

// const StyledExternalLink = styled(ExternalLink).attrs({
//   activeClassName
// }) <{ isActive?: boolean }>`
//   ${({ theme }) => theme.flexRowNoWrap}
//   align-items: left;
//   border-radius: 3rem;
//   outline: none;
//   cursor: pointer;
//   text-decoration: none;
//   color: ${({ theme }) => theme.text2};
//   font-size: 1rem;
//   width: fit-content;
//   margin: 0 12px;
//   font-weight: 500;

//   &.${activeClassName} {
//     border-radius: 12px;
//     font-weight: 600;
//     color: ${({ theme }) => theme.text1};
//   }

//   :hover,
//   :focus {
//     color: ${({ theme }) => darken(0.1, theme.text1)};
//   }

//   ${({ theme }) => theme.mediaWidth.upToExtraSmall`
//       display: none;
// `}
// `

export const StyledMenuButton = styled.button`
  position: relative;
  width: 100%;
  height: 100%;
  border: none;
  background-color: transparent;
  margin: 0;
  padding: 0;
  height: 35px;
  background-color: ${({ theme }) => theme.bg3};
  margin-left: 8px;
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
  > * {
    stroke: ${({ theme }) => theme.text1};
  }
`

const NETWORK_LABELS: { [chainId in ChainId]?: string } = {
  [ChainId.RINKEBY]: 'Rinkeby',
  [ChainId.ROPSTEN]: 'Ropsten',
  [ChainId.GÖRLI]: 'Görli',
  [ChainId.OP_GOERLI]: 'OpGörli',
  [ChainId.KOVAN]: 'Kovan'
}

export default function Header() {
  const { account, chainId } = useActiveWeb3React()
  const { t } = useTranslation()
  const theme = useThemedContext()

  const userEthBalance = useETHBalances(account ? [account] : [])?.[account ?? '']
  // const [isDark] = useDarkModeManager()
  const [darkMode, toggleDarkMode] = useDarkModeManager()

  // const toggleClaimModal = useToggleSelfClaimModal()

  // const availableClaim: boolean = useUserHasAvailableClaim(account)

  // const { claimTxn } = useUserHasSubmittedClaim(account ?? undefined)

  // const aggregateBalance: TokenAmount | undefined = useAggregateUniBalance()

  const [showUniBalanceModal, setShowUniBalanceModal] = useState(false)
  // const showClaimPopup = useShowClaimPopup()

  // const countUpValue = aggregateBalance?.toFixed(0) ?? '0'
  // const countUpValuePrevious = usePrevious(countUpValue) ?? '0'

  return (
    <HeaderFrame>
      {/* <ClaimModal /> */}
      <Modal isOpen={showUniBalanceModal} onDismiss={() => setShowUniBalanceModal(false)}>
        <UniBalanceContent setShowUniBalanceModal={setShowUniBalanceModal} />
      </Modal>
      <HeaderControls>
        <HeaderElement>
          <HeadLogoView
            style={{
              gridArea: 'a1',
              height: '100%',
              display: 'flex',
              justifyContent: 'flex-start',
              alignItems: 'center',
              padding: '0.2rem 0'
            }}
          >
            <img className="logoImg" src={TeleLogo} alt="" />
            <img className="textLogo" src={TextLogo} alt="" />
          </HeadLogoView>
          <HeadTabView style={{ gridArea: 'a2', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <HeaderLinks>
              <FixedWidthStyledNavLink id={`swap-nav-link`} to={'/swap'}>
                <Text>{t('Swap')}</Text>
              </FixedWidthStyledNavLink>
              <FixedWidthStyledNavLink
                id={`pool-nav-link`}
                to={'/liquidity'}
                isActive={(match, { pathname }) =>
                  Boolean(match) ||
                  pathname.startsWith('/add') ||
                  pathname.startsWith('/remove') ||
                  pathname.startsWith('/create') ||
                  pathname.startsWith('/find')
                }
              >
                <Text>{t('Liquidity')}</Text>
              </FixedWidthStyledNavLink>
              <FixedWidthStyledNavLink id={`earn-nav-link`} to={'/farm'}>
                <Text>{t('Earn')}</Text>
              </FixedWidthStyledNavLink>
              {/* <StyledNavLink id={`stake-nav-link`} to={'/uni'}>
            UNI
          </StyledNavLink> */}
              {/* <StyledNavLink id={`stake-nav-link`} to={'/vote'}>
            Vote
          </StyledNavLink> */}
              {/* <StyledExternalLink id={`stake-nav-link`} href={'https://uniswap.info'}>
            Charts <span style={{ fontSize: '11px' }}>↗</span>
          </StyledExternalLink> */}
            </HeaderLinks>
          </HeadTabView>
          {/* {availableClaim && !showClaimPopup && (
            <UNIWrapper onClick={toggleClaimModal}>
              <UNIAmount active={!!account && !availableClaim} style={{ pointerEvents: 'auto' }}>
                <TYPE.white padding="0 2px">
                  {claimTxn && !claimTxn?.receipt ? <Dots>Claiming UNI</Dots> : 'Claim UNI'}
                </TYPE.white>
              </UNIAmount>
              <CardNoise />
            </UNIWrapper>
          )}
          {/* {!availableClaim && aggregateBalance && (
            <UNIWrapper onClick={() => setShowUniBalanceModal(true)}>
              <UNIAmount active={!!account && !availableClaim} style={{ pointerEvents: 'auto' }}>
                {account && (
                  <HideSmall>
                    <TYPE.white
                      style={{
                        paddingRight: '.4rem'
                      }}
                    >
                      <CountUp
                        key={countUpValue}
                        isCounting
                        start={parseFloat(countUpValuePrevious)}
                        end={parseFloat(countUpValue)}
                        thousandsSeparator={','}
                        duration={1}
                      />
                    </TYPE.white>
                  </HideSmall>
                )}
                UNI
              </UNIAmount>
              <CardNoise />
            </UNIWrapper>
          )} */}
          <Flex
            sx={{
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              height: 'calc(2.5rem - 2px)',
              gridArea: 'a3',
              '&>*': {
                display: 'flex',
                alignItems: 'center',
                height: '100%'
              }
            }}
          >
            <HideSmall>
              {chainId && NETWORK_LABELS[chainId] && (
                <NetworkCard className="secondary-title" title={NETWORK_LABELS[chainId]}>
                  {NETWORK_LABELS[chainId]}
                </NetworkCard>
              )}
            </HideSmall>
            <AccountElement
              className="secondary-title"
              active={!!account}
              sx={{
                pointerEvents: 'auto',
                minWidth: 'fit-content',
                display: 'flex',
                '*': { height: '100%', display: 'flex', alignItems: 'center' }
              }}
            >
              {account && userEthBalance ? (
                <BalanceText style={{ flexShrink: 0, color: theme.common2 }} pl="0.75rem" pr="0.5rem" fontWeight={500}>
                  {userEthBalance?.toSignificant(4)} TELE
                </BalanceText>
              ) : null}
              <Web3Status />
            </AccountElement>
            {/* <div style={{ width: "2rem" }}>
              <StyledMenuButton onClick={() => toggleDarkMode()}>
                {darkMode ? <Moon size={20} /> : <Sun size={20} />}
              </StyledMenuButton>
            </div> */}
          </Flex>
        </HeaderElement>
        {/* <HeaderElementWrap>
          <StyledMenuButton onClick={() => toggleDarkMode()}>
            {darkMode ? <Moon size={20} /> : <Sun size={20} />}
          </StyledMenuButton>
          <Menu />
        </HeaderElementWrap> */}
      </HeaderControls>
      {/* <HeaderRow>
        <Title href=".">
          <UniIcon>
            <img width={'24px'} src={darkMode ? LogoDark : Logo} alt="logo" />
          </UniIcon>
        </Title>
      </HeaderRow> */}
    </HeaderFrame>
  )
}
