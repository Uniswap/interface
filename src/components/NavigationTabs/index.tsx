import React, { useCallback } from 'react'
import styled from 'styled-components'
import { darken } from 'polished'
import { useTranslation } from 'react-i18next'
import { withRouter, NavLink, Link as HistoryLink, RouteComponentProps } from 'react-router-dom'

import { Hover } from '../../theme'
import { ArrowLeft } from 'react-feather'
import { RowBetween } from '../Row'
import QuestionHelper from '../Question'

import { useBodyKeyDown } from '../../hooks'

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
    path: '/pool',
    textKey: 'pool',
    regex: /\/pool/
  }
]

const Tabs = styled.div`
  ${({ theme }) => theme.flexRowNoWrap}
  align-items: center;
  border-radius: 3rem;
`

const activeClassName = 'ACTIVE'

const StyledNavLink = styled(NavLink).attrs({
  activeClassName
})`
  ${({ theme }) => theme.flexRowNoWrap}
  align-items: center;
  justify-content: center;
  height: 3rem;
  flex: 1 0 auto;
  border-radius: 3rem;
  outline: none;
  cursor: pointer;
  text-decoration: none;
  color: ${({ theme }) => theme.text3};
  font-size: 20px;
  box-sizing: border-box;

  &.${activeClassName} {
    border-radius: 12px;
    box-sizing: border-box;
    font-weight: 500;
    color: ${({ theme }) => theme.text1};
  }

  :hover,
  :focus {
    color: ${({ theme }) => darken(0.1, theme.text1)};
  }
`

const ActiveText = styled.div`
  font-weight: 500;
  font-size: 20px;
`

const ArrowLink = styled(ArrowLeft)`
  color: ${({ theme }) => theme.text1};
`

function NavigationTabs({ location: { pathname }, history }: RouteComponentProps<{}>) {
  const { t } = useTranslation()

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
  const creating = pathname.match('/create')

  return (
    <>
      {adding || removing ? (
        <Tabs>
          <RowBetween style={{ padding: '1rem' }}>
            <Hover onClick={() => history.push('/pool')}>
              <ArrowLink />
            </Hover>
            <ActiveText>{adding ? 'Add' : 'Remove'} Liquidity</ActiveText>
            <QuestionHelper
              text={
                adding
                  ? 'When you add liquidity, you are given pool tokens that represent your position in this pool. These tokens automatically earn fees proportional to your pool share and can be redeemed at any time.'
                  : 'Your liquidity is represented by a pool token (ERC20). Removing will convert your position back into tokens at the current rate and proportional to the amount of each token in the pool. Any fees you accrued are included in the token amounts you receive.'
              }
            />
          </RowBetween>
        </Tabs>
      ) : finding ? (
        <Tabs>
          <RowBetween style={{ padding: '1rem' }}>
            <HistoryLink to="/pool">
              <ArrowLink />
            </HistoryLink>
            <ActiveText>Import Pool</ActiveText>
            <QuestionHelper text={"Use this tool to find pairs that don't automatically appear in the interface."} />
          </RowBetween>
        </Tabs>
      ) : creating ? (
        <Tabs>
          <RowBetween style={{ padding: '1rem' }}>
            <HistoryLink to="/pool">
              <ArrowLink />
            </HistoryLink>
            <ActiveText>Create Pool</ActiveText>
            <QuestionHelper text={'Use this interface to create a new pool.'} />
          </RowBetween>
        </Tabs>
      ) : (
        <Tabs style={{ marginBottom: '20px' }}>
          {tabOrder.map(({ path, textKey, regex }) => (
            <StyledNavLink
              id={`${textKey}-nav-link`}
              key={path}
              to={path}
              isActive={(_, { pathname }) => !!pathname.match(regex)}
            >
              {t(textKey)}
            </StyledNavLink>
          ))}
        </Tabs>
      )}
    </>
  )
}

export default withRouter(NavigationTabs)
