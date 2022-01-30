import { Trans } from '@lingui/macro'
import useScrollPosition from '@react-hook/window-scroll'
import Card from 'components/Card'
import { GreyCard } from 'components/Card'
import { AutoColumn } from 'components/Column'
import Tooltip from 'components/Tooltip'
import { CHAIN_INFO, SupportedChainId } from 'constants/chains'
import useCopyClipboard from 'hooks/useCopyClipboard'
import { darken } from 'polished'
import React, { useState } from 'react'
import { AlertOctagon, CheckCircle, Eye, EyeOff, ChevronDown, ChevronUp, Circle, Clipboard, Info, Link, Settings } from 'react-feather'
import { NavLink } from 'react-router-dom'
import { Text } from 'rebass'
import { useShowClaimPopup, useToggleSelfClaimModal } from 'state/application/hooks'
import { useUserHasAvailableClaim } from 'state/claim/hooks'
import { useUserHasSubmittedClaim } from 'state/transactions/hooks'
import { useDarkModeManager } from 'state/user/hooks'
import { useETHBalances } from 'state/wallet/hooks'
import styled from 'styled-components/macro'
import { CloseIcon } from 'theme/components'
import { StyledInternalLink } from 'theme/components'
import { IconWrapper } from 'theme/components'
import Logo from '../../assets/svg/logo.svg'
import LogoDark from '../../assets/svg/logo_white.svg'
import { useActiveWeb3React } from '../../hooks/web3'
import { ExternalLink, TYPE } from '../../theme'
import ClaimModal from '../claim/ClaimModal'
import { CardNoise } from '../earn/styled'
import Menu from '../Menu'
import Modal from '../Modal'
import Row from '../Row'
import { Dots } from '../swap/styleds'
import Web3Status from '../Web3Status'
import NetworkCard from './NetworkCard'
import UniBalanceContent from './UniBalanceContent'
import logo from '../../assets/svg/logo.svg'
import Swal from 'sweetalert2'
import { ChartModal } from 'components/swap/ChartModal'
import { useEthPrice } from 'state/logs/utils'
import Badge from 'components/Badge'
import useInterval from 'hooks/useInterval'
const HeaderFrame = styled.div<{ showBackground: boolean }>`
  display: grid;
  grid-template-columns: 150px 1fr 120px;
  align-items: center;
  justify-content: space-between;
  align-items: center;
  flex-direction: row;
  width: 100%;
  top: 0;
  position: relative;
  padding: 1rem;
  z-index: 21;
  position: relative;
  /* Background slide effect on scroll. */
  background-position: ${({ showBackground }) => (showBackground ? '0 -100%' : '0 0')};
  background-size: 100% 200%;
  transition: background-position 0.1s, box-shadow 0.1s;
  background-blend-mode: hard-light;
  margin-top:20px;
  ${({ theme }) => theme.mediaWidth.upToLarge`
    grid-template-columns: 48px 1fr 1fr;
  `};

  ${({ theme }) => theme.mediaWidth.upToMedium`
    padding:  1rem;
    grid-template-columns: 1fr 1fr;
  `};

  ${({ theme }) => theme.mediaWidth.upToSmall`
    padding:  1rem;
    grid-template-columns: 36px 1fr;
  `};
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
  cursor: pointer;

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
  :hover {
    transform: scale(1.1);
  }
`

const activeClassName = 'ACTIVE'
export const StyledAnchorLink = styled.a`
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

:hover,
:focus {
  color: ${({ theme }) => darken(0.1, theme.text1)};
}`
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
  font-weight: 500;
  padding: 8px 12px;
  word-break: break-word;
  overflow: hidden;
  white-space: nowrap;
  &.${activeClassName} {
    border-radius: 12px;
    font-weight: 600;
    justify-content: center;
    color: ${({ theme }) => theme.text1};
    background-color: radial-gradient(#f5b642, rgba(129,3,3,.95));
  }

  :hover,
  :focus {
    color: ${({ theme }) => darken(0.1, theme.text1)};
  }
`

const StyledInput = styled.input`
  * {
    display: flex;
    max-width: 275px;
    width: 100%;
    cursor: pointer;
    background-color: #eaeaeb;
    border: none;
    color: #222;
    font-size: 14px;
    border-radius: 5px;
    padding: 15px 45px 15px 15px;
    font-family: 'Montserrat', sans-serif;
    box-shadow: 0 3px 15px #b8c6db;
    -moz-box-shadow: 0 3px 15px #b8c6db;
    -webkit-box-shadow: 0 3px 15px #b8c6db;
  }
`

const StyledExternalLink = styled(ExternalLink).attrs({
  activeClassName,
}) <{ isActive?: boolean }>`
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

export default function Header() {
  const { account, chainId } = useActiveWeb3React()

  const userEthBalance = useETHBalances(account ? [account] : [])?.[account?.toLowerCase() ?? '']
  const [darkMode] = useDarkModeManager()

  const toggleClaimModal = useToggleSelfClaimModal()

  const availableClaim: boolean = useUserHasAvailableClaim(account)

  const { claimTxn } = useUserHasSubmittedClaim(account ?? undefined)

  const [showUniBalanceModal, setShowUniBalanceModal] = useState(false)
  const showClaimPopup = useShowClaimPopup()

  const scrollY = useScrollPosition()
  const { infoLink } = CHAIN_INFO[chainId ? chainId : SupportedChainId.MAINNET]
  const [ethPrice] = useEthPrice()
  const [showContracts, setShowContracts] = useState(false)
  const [clip, setClip] = useCopyClipboard()
  const href = 'https://www.dextools.io/app/ether/pair-explorer/0xac6776d1c8d455ad282c76eb4c2ade2b07170104'
  const [width, setWidth] = useState<number>(window.innerWidth)
  function handleWindowSizeChange() {
    setWidth(window.innerWidth)
  }
  React.useEffect(() => {
    window.addEventListener('resize', handleWindowSizeChange)
    return () => {
      window.removeEventListener('resize', handleWindowSizeChange)
    }
  }, [])
  const isMobile: boolean = width <= 768
  const [showETHValue, setShowETHValue] = React.useState(!!localStorage.getItem('show_balance'))
  const [gas, setGas] = React.useState<any>()
  const [showNotify, setShowNotify] = React.useState(!!localStorage.getItem('subscribed') && localStorage.getItem('subscribed') !== 'false');
  React.useEffect(() => {
      if (showNotify && Math.trunc(gas?.fast / 10) <= 85) {
        Swal.fire({
          toast: true,
          position: 'bottom-end',
          timer: 10000,
          showConfirmButton: false,
          timerProgressBar: true,
          icon: 'success',
          title: 'GWEI is currently at ' + Math.trunc(gas?.fast / 10)
        })
      } 
  }, [gas, showNotify])
  const promise = () => {
    const error = (e:unknown) => console.error(e)
    console.log(`fetching gas prices`)
    fetch('https://ethgasstation.info/api/ethgasAPI.json?api-key=XXAPI_Key_HereXXX', { method: 'GET' })
    .then((res) => res.json())
    .then((response) => {
      setGas(response)
    }).catch(error)
  } 
  const onNotify = React.useCallback(() => {
    Swal.fire({
      title: showNotify ? "Cancel notifications" : 'Subscribe to notifications',
      text: showNotify ? "Cancelling notifications will no longer alert you when GWEI is in optimal conditions ( GWEI < 85 )." : 'Subscribing to notifications will alert you in app when GWEI is in optimal conditions (GWEI < 85).',
      showConfirmButton: true,
      confirmButtonText: showNotify ? 'Unsubscribe' : "Subscribe",
      showCancelButton: true,
      icon: 'question',
    }).then(({ isConfirmed }) => {
      if (showNotify && isConfirmed) {
        setShowNotify(() => false)
        localStorage.setItem('subscribed', 'false')
      } else if (!showNotify && isConfirmed) {
        setShowNotify(true)
        localStorage.setItem('subscribed', 'true')
      }
    })
  }, [showNotify])

  const setEthBalanceVisisbleCallback = (visible: boolean ) => {
    if (!visible) localStorage.removeItem('show_balance')
    else localStorage.setItem('show_balance', visible.toString());
    setShowETHValue(visible);
  }

  const [showGasTt, setShowGasTt] = React.useState(false)
  useInterval(promise, 15000, true)
  return (
    <>
      <HeaderFrame showBackground={scrollY > 45}>
        <Modal isOpen={showUniBalanceModal} onDismiss={() => setShowUniBalanceModal(false)}>
          <UniBalanceContent setShowUniBalanceModal={setShowUniBalanceModal} />
        </Modal>
        <Title style={{textDecoration:"none"}} href="/">
          <UniIcon>
            <img
              width={isMobile ? '50px' : '70px'}
              src={logo}
              alt="logo"
            />

          </UniIcon>

        </Title>
        
        <HeaderLinks>
          
          <StyledNavLink id={`swap-nav-link`} to={'/swap'}>
            <Trans>Swap</Trans>
          </StyledNavLink>
          <StyledNavLink
            id={`pool-nav-link`}
            to={'/pool'}
            isActive={(match, { pathname }) =>
              Boolean(match) ||
              pathname.startsWith('/add') ||
              pathname.startsWith('/remove') ||
              pathname.startsWith('/increase') ||
              pathname.startsWith('/find')
            }
          >
            <Trans>Pool</Trans>
          </StyledNavLink>
          {chainId && [SupportedChainId.MAINNET, SupportedChainId.BINANCE].includes(chainId) && (
            <StyledNavLink id={`stake-nav-link`} to={'/gains'}>
              <Trans>Gains</Trans>
            </StyledNavLink>
          )}

          <StyledNavLink id={`chart-nav-link`} to={'/charts'}>
            <Trans>Charts</Trans>
            <sup>↗</sup>
          </StyledNavLink>

          <div
            style={{
              position: 'relative',
              justifyContent: 'center',
              padding: 3,
              borderRadius: 12,
              display: 'flex',
              color: 'rgb(168,228,44)',
            }}
          >
            {' '}
            <span style={{ cursor: 'pointer', display: 'flex', flexFlow:'row wrap', alignItems: 'center' }}>
              <img style={{ filter: 'sepia(1)', maxWidth: 15 }} src={'https://www.freeiconspng.com/uploads/gas-icon-21.png'}
              />
              {gas && (
                <span style={{ color: '#fff', marginLeft: 5, fontSize: 14, fontWeight: 'bold' }}>
                  {gas?.fast / 10}
                </span>
              )}
            </span>
            {gas && Math.trunc(gas?.fast / 10) > 85 ? 
              <AlertOctagon fill={showNotify ? 'green' : 'red'} 
                            color={'#fff'} 
                            onClick={onNotify} 
                            style={{ 
                              cursor: 'pointer', 
                              marginLeft: 5
                            }}
                            onMouseEnter={() => setShowGasTt(true)}
                            onMouseLeave={() => setShowGasTt(false)}
              /> : 
            <CheckCircle fill={showNotify ? 'green' : 'red'} 
                         color={'#fff'} 
                         onClick={onNotify} 
                         style={{
                          cursor: 'pointer',
                          marginLeft: 5 
                        }} />
              }
          </div>

        </HeaderLinks>

        <HeaderControls>


          <NetworkCard />

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
                      <></>
                    )}
                  </TYPE.white>
                </UNIAmount>
                <CardNoise />
              </UNIWrapper>
            )}
            <AccountElement active={!!account} style={{ pointerEvents: 'auto' }}>
            {!isMobile && (account && userEthBalance ? <small style={{position:'relative', left:5, cursor: 'pointer'}}> 
              {showETHValue && <Eye style={{width: 19, height: 19}} onClick={() => setEthBalanceVisisbleCallback(!showETHValue)}  />}
              {!showETHValue && <EyeOff style={{width: 19, height: 19}}  onClick={() => setEthBalanceVisisbleCallback(!showETHValue)} />}
              </small> : null)}
              {account && userEthBalance ? (
                <BalanceText style={{ flexShrink: 0 }} pl="0.75rem" pr="0.5rem" fontWeight={500}>
                  <Trans>{showETHValue ? userEthBalance?.toSignificant(3) : '...'} ETH</Trans>
  
                </BalanceText>
              ) : null}
              <Web3Status />
            </AccountElement>
            <Menu />
          </HeaderElement>
        </HeaderControls>
      </HeaderFrame>
    </>
  )
}
