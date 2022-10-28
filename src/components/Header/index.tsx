import { AlertOctagon, CheckCircle, Eye, EyeOff } from 'react-feather'
import { NavLink, useLocation } from 'react-router-dom'
import React, { useState } from 'react'

import { BurntKiba } from 'components/BurntKiba'
import { ExternalLink } from '../../theme'
import Menu from '../Menu'
import NetworkCard from './NetworkCard'
import Row from '../Row'
import { SupportedChainId } from 'constants/chains'
import Swal from 'sweetalert2'
import { Text } from 'rebass'
import { Trans } from '@lingui/macro'
import Web3Status from '../Web3Status'
import { darken } from 'polished'
import logo from '../../assets/svg/logo.svg'
import styled from 'styled-components/macro'
import { useActiveWeb3React } from '../../hooks/web3'
import { useDarkModeManager } from 'state/user/hooks'
import { useETHBalances } from 'state/wallet/hooks'
import useInterval from 'hooks/useInterval'
import useTheme from 'hooks/useTheme'

export type EmbedModel = {
  showTrending?: boolean
  showChartInfo?: boolean
  showChartTrades?: boolean
  embedMode: boolean
  theme?: string
}

export const useIsEmbedMode = (): EmbedModel => {
  const location = useLocation()
  const params = new URLSearchParams(location.search)
  const isEmbedMode = Boolean(params.get('embed'))
  if (isEmbedMode) {
    const trades = params.get('trades') || '1'
    const info = params.get('info') || '1'
    const trending = params.get('trending') || '1'
    const theme = params.get('theme') || 'dark'
    const model = {
      showChartInfo: info == '0' ? false : Boolean(info),
      showTrending: trending == '0' ? false : Boolean(trending),
      showChartTrades: trades == '0' ? false : Boolean(trades),
      embedMode: true,
      theme
    }

    return model
  }
  return {
    embedMode: false,
  }
}

const HeaderFrame = styled.div<{ showBackground: boolean }>`
  display: grid;
  //background: radial-gradient( #0000004a,transparent);
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
  padding-top:10px;
  /* Background slide effect on scroll. */
  background-position: ${({ showBackground }) => (showBackground ? '0 -100%' : '0 0')};
  background-size: 100% 200%;
  transition: background-position 0.1s, box-shadow 0.1s;
  background-blend-mode: hard-light;
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
  gap:3px;
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
  padding: 3px;
  border-radius: 16px;
  display: grid;
  grid-auto-flow: column;
  grid-gap: 5px;
  overflow: auto;
  align-items: center;
  box-shadow: 0px 6px 10px rgba(0, 0, 0, 0.05);

  ${({ theme }) => theme.mediaWidth.upToLarge`
    justify-self: start;
    margin-left: 30px;
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
    bottom: 20px; 
    right: 20px;
    left: 20px;
    margin: 0 auto;
    background-color: ${({ theme }) => theme.bg0};
    border: 1px solid ${({ theme }) => theme.bg2};
  `};
`

const AccountElement = styled.div<{ active: boolean }>`
  display: flex;
  flex-direction: row;
  align-items: center;
  color:${props => props.theme.text1};
  background-color: ${({ theme, active }) => (!active ? theme.bg0 : theme.bg0)};
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
  font-weight: 600;
  background-color: ${({ theme }) => theme.bg0};
  border: 1px solid ${({ theme }) => theme.bg1};
`

const getQuery = () => {
  if (typeof window !== 'undefined') {
    return new URLSearchParams(window.location.search);
  }
  return new URLSearchParams();
};

const getQueryStringVal = (key: string): string | null => {
  return getQuery().get(key);
};


export const useQueryParam = (
  key: string,
  defaultVal: string
): [string, (val: string) => void] => {
  const [query, setQuery] = useState(getQueryStringVal(key) || defaultVal);

  const updateUrl = (newVal: string) => {
    setQuery(newVal);

    const query = getQuery();

    if (newVal.trim() !== '') {
      query.set(key, newVal);
    } else {
      query.delete(key);
    }

    // This check is necessary if using the hook with Gatsby
    if (typeof window !== 'undefined') {
      const { protocol, pathname, host } = window.location;
      const newUrl = `${protocol}//${host}${pathname}?${query.toString()}`;
      window.history.pushState({}, '', newUrl);
    }
  };

  return [query, updateUrl];
};


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

  ${({ theme }) => theme.mediaWidth.upToSmall`
    padding: 6px;
    font-size: 0.9rem;
  `};

  &.${activeClassName} {
    border-radius: 12px;
    font-weight: 600;
    justify-content: center;
    color: ${({ theme }) => theme.text1};
    background-color: ${({ theme }) => theme.bg0};
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
  font-weight: 700;

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
  // state
  const [width, setWidth] = useState<number>(window.innerWidth)
  const [showGasTt, setShowGasTt] = React.useState(false)
  const onMouseEnterGasIcon = () => setShowGasTt(true);
  const onMouseExitGasIcon = () => setShowGasTt(false)
  const [showETHValue, setShowETHValue] = React.useState(!!localStorage.getItem('show_balance'))
  const setEThVisible = () => setEthBalanceVisisbleCallback(!showETHValue);
  const isMobile: boolean = width <= 768
  const [gas, setGas] = React.useState<any>()
  const [showNotify, setShowNotify] = React.useState(!!localStorage.getItem('subscribed') && localStorage.getItem('subscribed') !== 'false');
  const dateString = localStorage.getItem('notificationDate') as string;
  const [lastNotified, setLastNotified] = React.useState<Date | undefined>(dateString ? new Date(+dateString) : undefined)

  // side effect
  React.useEffect(() => {
    const dateMath = lastNotified ? new Date(lastNotified?.getTime() + 5 * 60000) : undefined
    if (showNotify && Math.trunc(gas?.FastGasPrice) <= 85 && (!dateMath || dateMath < new Date())) {
      const dateNotified = new Date();
      localStorage.setItem('notificationDate', dateNotified.valueOf().toString())
      setLastNotified(dateNotified)
      Swal.fire({
        toast: true,
        position: 'bottom-end',
        timer: 10000,
        showConfirmButton: false,
        timerProgressBar: true,
        icon: 'success',
        title: 'GWEI is currently at ' + Math.trunc(gas?.FastGasPrice)
      })
    }
  }, [gas, showNotify])

  React.useEffect(() => {
    window.addEventListener('resize', handleWindowSizeChange)
    return () => {
      window.removeEventListener('resize', handleWindowSizeChange)
    }
  }, [])

  // callbacks
  const promise = React.useCallback(() => {
    const error = (e: unknown) => console.error(e)
    console.log(`fetching gas prices`)
    fetch(`https://api.etherscan.io/api?module=gastracker&action=gasoracle&apikey=2SIRTH18CHU6HM22AGRF1XE9M7AKDR9PM7`, { method: 'GET' })
      .then((res) => res.json())
      .then((response) => {
        setGas(response.result)
      }).catch(error)
  }, [])

  const handleWindowSizeChange = React.useCallback(() => {
    setWidth(window.innerWidth)
  }, [])

  const onNotify = React.useCallback(() => {
    Swal.fire({
      title: showNotify ? "Cancel notifications" : 'Subscribe to notifications',
      text: showNotify ? "Cancelling notifications will no longer alert you when GWEI is in optimal conditions ( GWEI < 85 )." : 'Subscribing to notifications will alert you in app when GWEI is in optimal conditions (GWEI < 85).',
      showConfirmButton: true,
      confirmButtonText: showNotify ? 'Unsubscribe' : "Subscribe",
      showCancelButton: true,
      icon: showNotify ? 'info' : 'question',
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

  const setEthBalanceVisisbleCallback = React.useCallback((visible: boolean) => {
    if (!visible) localStorage.removeItem('show_balance')
    else localStorage.setItem('show_balance', visible.toString());
    setShowETHValue(visible);
  }, [])

  // hooks
  useInterval(promise, 45000, true)
  const { account, chainId } = useActiveWeb3React()
  const userEthBalance = useETHBalances(account ? [account] : [])?.[account?.toLowerCase() ?? '']
  const [darkMode] = useDarkModeManager()
  const theme = useTheme()

  return (
    <>
      <HeaderFrame showBackground={scrollY > 45}>
        <Title style={{ textDecoration: "none" }} href="/">
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
            <StyledNavLink id={`stake-nav-link`} to={'/dashboard'}>
              <Trans>Stats</Trans>
            </StyledNavLink>
          )}

          <StyledNavLink isActive={(match, { pathname }) =>
            Boolean(match) ||
            pathname.startsWith('/selective') ||
            pathname.startsWith('/selective-charts') ||
            pathname.startsWith('/selective-charting')
          } id={`chart-nav-link`} to={'/selective-charting'}>
            <Trans>Charts</Trans>
            {/* <Trans>Charts <sub>↗</sub></Trans> */}
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
            <span style={{ cursor: 'pointer', display: 'flex', flexFlow: 'row wrap', alignItems: 'center' }}>
              <img style={{ borderRadius: '50%', maxWidth: 25, }} src={'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSgDCqNz9Kfr-ktZgHR_z8EwmZAkPeX4s6ifw&usqp=CAU'}
              />
              {gas && (
                <span style={{ color: theme.text1, marginLeft: 5, fontSize: 14, fontWeight: 'bold' }}>
                  {gas?.FastGasPrice}
                </span>
              )}
            </span>
            {gas && Math.trunc(gas?.FastGasPrice) > 85 ?
              <AlertOctagon fill={showNotify ? 'green' : 'red'}
                color={'#fff'}
                onClick={onNotify}
                style={{
                  cursor: 'pointer',
                  marginLeft: 5
                }}
                onMouseEnter={onMouseEnterGasIcon}
                onMouseLeave={onMouseExitGasIcon}
              /> :
              <CheckCircle fill={showNotify ? 'green' : 'red'}
                color={'#fff'}
                onClick={onNotify}
                style={{
                  cursor: 'pointer',
                  marginLeft: 5,
                  display: width <= 400 ? 'none' : 'inline-block'
                }} />
            }
          </div>
        </HeaderLinks>

        <HeaderControls>
          <HeaderElement>
            {!!account ? <NetworkCard /> : ''}
            <BurntKiba />

            <AccountElement active={!!account} style={{ pointerEvents: 'auto' }}>
              {!isMobile && (account && userEthBalance ? <small style={{ position: 'relative', left: 5, cursor: 'pointer' }}>
                {showETHValue && <Eye style={{ width: 19, height: 19 }} onClick={setEThVisible} />}
                {!showETHValue && <EyeOff style={{ width: 19, height: 19 }} onClick={setEThVisible} />}
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
