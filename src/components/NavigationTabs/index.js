import React, { useCallback } from 'react'
import { withRouter, NavLink, Link as HistoryLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'
import { transparentize, darken } from 'polished'

import { RowBetween } from '../Row'
import QuestionHelper from '../Question'
import { ArrowLeft } from 'react-feather'

import { useBodyKeyDown } from '../../hooks'

import { useBetaMessageManager } from '../../contexts/LocalStorage'

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
    path: '/supply',
    textKey: 'pool',
    regex: /\/supply/
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

const Tabs = styled.div`
  ${({ theme }) => theme.flexRowNoWrap}
  align-items: center;
  height: 3rem;
  border-radius: 3rem;
  margin-bottom: 20px;
`

const activeClassName = 'ACTIVE'

const StyledNavLink = styled(NavLink).attrs({
  activeClassName
})`
  ${({ theme }) => theme.flexRowNoWrap}
  align-items: center;
  justify-content: center;
  height: 2.5rem;
  flex: 1 0 auto;
  border-radius: 3rem;
  outline: none;
  cursor: pointer;
  text-decoration: none;
  color: ${({ theme }) => theme.doveGray};
  font-size: 20px;
  box-sizing: border-box;

  &.${activeClassName} {
    border-radius: 3rem;
    box-sizing: border-box;
    font-weight: 500;
    color: ${({ theme }) => theme.black};
  }

  :hover,
  :focus {
    color: ${({ theme }) => darken(0.1, theme.black)};
  }
`

const ActiveText = styled.div`
  font-weight: 500;
  font-size: 20px;
`

const ArrowLink = styled(ArrowLeft)`
  color: ${({ theme }) => theme.black};
`

function NavigationTabs({ location: { pathname }, history }) {
  const { t } = useTranslation()

  const [showBetaMessage, dismissBetaMessage] = useBetaMessageManager()

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

  const adding = pathname.match('/add')
  const removing = pathname.match('/remove')
  const finding = pathname.match('/find')

  return (
    <>
      {adding || removing ? (
        <Tabs>
          <RowBetween style={{ padding: '1rem' }}>
            <HistoryLink to="/supply">
              <ArrowLink />
            </HistoryLink>
            <ActiveText>{adding ? 'Add' : 'Remove'} Liquidity</ActiveText>
            <QuestionHelper text={'helper text'} />
          </RowBetween>
        </Tabs>
      ) : finding ? (
        <Tabs>
          <RowBetween style={{ padding: '1rem' }}>
            <HistoryLink to="/supply">
              <ArrowLink />
            </HistoryLink>
            <ActiveText>Find a Pool</ActiveText>
            <QuestionHelper text={'helper text'} />
          </RowBetween>
        </Tabs>
      ) : (
        <Tabs>
          {tabOrder.map(({ path, textKey, regex }) => (
            <StyledNavLink key={path} to={path} isActive={(_, { pathname }) => pathname.match(regex)}>
              {t(textKey)}
            </StyledNavLink>
          ))}
        </Tabs>
      )}
      {showBetaMessage && (
        <BetaMessage onClick={dismissBetaMessage}>
          <span role="img" aria-label="warning">
            💀
          </span>{' '}
          {t('betaWarning')}
        </BetaMessage>
      )}
    </>
  )
}

export default withRouter(NavigationTabs)
