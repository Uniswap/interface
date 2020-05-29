import React, { useCallback } from 'react'
import { withRouter, NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'
import { transparentize, darken } from 'polished'

import { useWeb3React, useBodyKeyDown } from '../../hooks'
import { useAddressBalance } from '../../contexts/Balances'
import { isAddress } from '../../utils'
import {
  useBetaMessageManager,
  useSaiHolderMessageManager,
  useGeneralDaiMessageManager
} from '../../contexts/LocalStorage'
import { Link } from '../../theme/components'

const tabOrder = [
  {
    path: '/swap',
    textKey: 'swap',
    regex: /\/swap/
  },
  {
    path: '/send',
    textKey: 'send',
    regex: /\/send/
  },
  {
    path: '/add-liquidity',
    textKey: 'pool',
    regex: /\/add-liquidity|\/remove-liquidity|\/create-exchange.*/
  }
]

const BetaMessage = styled.div`
  ${({ theme }) => theme.flexRowNoWrap}
  cursor: pointer;
  flex: 1 0 auto;
  align-items: center;
  position: relative;
  padding: 0.5rem 1rem;
  padding-right: 2rem;
  margin-bottom: 1rem;
  border: 1px solid ${({ theme }) => transparentize(0.6, theme.wisteriaPurple)};
  background-color: ${({ theme }) => transparentize(0.9, theme.wisteriaPurple)};
  border-radius: 1rem;
  font-size: 0.75rem;
  line-height: 1rem;
  text-align: left;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: ${({ theme }) => theme.wisteriaPurple};

  &:after {
    content: '✕';
    top: 0.5rem;
    right: 1rem;
    position: absolute;
    color: ${({ theme }) => theme.wisteriaPurple};
  }
`

const DaiMessage = styled(BetaMessage)`
  ${({ theme }) => theme.flexColumnNoWrap}
  position: relative;
  word-wrap: wrap;
  overflow: visible;
  white-space: normal;
  padding: 1rem 1rem;
  padding-right: 2rem;
  line-height: 1.2rem;
  cursor: default;
  color: ${({ theme }) => theme.textColor};
  div {
    width: 100%;
  }
  &:after {
    content: '';
  }
`

const CloseIcon = styled.div`
  width: 10px !important;
  top: 0.5rem;
  right: 1rem;
  position: absolute;
  color: ${({ theme }) => theme.wisteriaPurple};
  :hover {
    cursor: pointer;
  }
`

const WarningHeader = styled.div`
  margin-bottom: 10px;
  font-weight: 500;
  color: #000000;
`

const WarningFooter = styled.div`
  margin-top: 10px;
  font-size: 10px;
  text-decoration: italic;
  color: ${({ theme }) => theme.greyText};
`

const Tabs = styled.div`
  ${({ theme }) => theme.flexRowNoWrap}
  align-items: center;
  height: 2.5rem;
  background-color: #FFFFFF;
  border-radius: 3rem;
  /* border: 1px solid ${({ theme }) => theme.mercuryGray}; */
  margin-bottom: 1rem;
  box-shadow: 1px 1px 8px -4px rgba(0,0,0,.5), 1px 1px 4px -4px rgba(0,0,0,.5);
`

const Title = styled.div`
  color: #000000;
  font-size: 2rem;
  text-align: center;
  margin-bottom: 25px;
  font-weight: 200;
`

const activeClassName = 'ACTIVE'

const StyledNavLink = styled(NavLink).attrs({
  activeClassName
})`
  ${({ theme }) => theme.flexRowNoWrap}
  align-items: center;
  justify-content: center;
  height: 2.5rem;
  border: 1px solid ${({ theme }) => transparentize(1, theme.mercuryGray)};
  flex: 1 0 auto;
  border-radius: 3rem;
  outline: none;
  cursor: pointer;
  text-decoration: none;
  color: ${({ theme }) => theme.doveGray};
  font-size: 1rem;
  box-sizing: border-box;

  &.${activeClassName} {
    background-color: #c3d7f0;
    border-radius: 3rem;
    box-shadow: 0 4px 8px 0 ${({ theme }) => transparentize(0.95, theme.shadowColor)};
    box-sizing: border-box;
    font-weight: 500;
    color: #000000;
    :hover {
      /* border: 1px solid ${({ theme }) => darken(0.1, theme.mercuryGray)}; */
      background-color: #a3c3ea;
    }
  }

  :hover,
  :focus {
    color: #000000;
  }
`

function NavigationTabs({ location: { pathname }, history }) {
  const { t } = useTranslation()

  const [showBetaMessage, dismissBetaMessage] = useBetaMessageManager()

  const [showGeneralDaiMessage, dismissGeneralDaiMessage] = useGeneralDaiMessageManager()

  const [showSaiHolderMessage, dismissSaiHolderMessage] = useSaiHolderMessageManager()

  const { account } = useWeb3React()

  const daiBalance = useAddressBalance(account, isAddress('0x89d24A6b4CcB1B6fAA2625fE562bDD9a23260359'))

  const daiPoolTokenBalance = useAddressBalance(account, isAddress('0x09cabEC1eAd1c0Ba254B09efb3EE13841712bE14'))

  const onLiquidityPage = pathname === '/pool' || pathname === '/add-liquidity' || pathname === '/remove-liquidity'

  const navigate = useCallback(
    direction => {
      const tabIndex = tabOrder.findIndex(({ regex }) => pathname.match(regex))
      history.push(tabOrder[(tabIndex + tabOrder.length + direction) % tabOrder.length].path)
    },
    [pathname, history]
  )
  const navigateRight = useCallback(() => {
    navigate(1)
  }, [navigate])
  const navigateLeft = useCallback(() => {
    navigate(-1)
  }, [navigate])

  useBodyKeyDown('ArrowRight', navigateRight)
  useBodyKeyDown('ArrowLeft', navigateLeft)

  const providerMessage =
    showSaiHolderMessage && daiPoolTokenBalance && !daiPoolTokenBalance.isZero() && onLiquidityPage
  const generalMessage = showGeneralDaiMessage && daiBalance && !daiBalance.isZero()

  return (
    <>
      {/*<Tabs>
        {tabOrder.map(({ path, textKey, regex }) => (
          <StyledNavLink key={path} to={path} isActive={(_, { pathname }) => pathname.match(regex)}>
            {t(textKey)}
          </StyledNavLink>
        ))}
      </Tabs>*/}
      <Title>DMG Purchase Portal</Title>
    </>
  )
}

export default withRouter(NavigationTabs)
