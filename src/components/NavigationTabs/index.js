import React, { useCallback } from 'react'
import { NavLink, withRouter } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'
import { darken, transparentize } from 'polished'

import { useBodyKeyDown } from '../../hooks'

const tabOrder = [
  {
    path: '/swap',
    textKey: 'Swap',
    regex: /\/swap/,
  },
  {
    path: '/earn',
    textKey: 'Earn',
    regex: /\/earn/,
    disabled: true,
  },
  {
    path: '/farm',
    textKey: 'Farm',
    regex: /\/farm/,
    disabled: true,
  },
  {
    path: '/governance/proposals',
    textKey: 'Vote',
    regex: /\/governance\/proposals/,
  }
]

const Tabs = styled.div`
  ${({ theme }) => theme.flexRowNoWrap}
  align-items: center;
  height: 2.5rem;
  background-color: #FFFFFF;
  border-radius: 3rem;
  /* border: 1px solid ${({ theme }) => theme.mercuryGray}; */
  margin-bottom: 1rem;
  box-shadow: 1px 1px 8px -4px rgba(0,0,0,.5), 1px 1px 4px -4px rgba(0,0,0,.5);
  z-index: 100;
  position: relative;
  width: 100%
`

const activeClassName = 'ACTIVE'

const StyledNavLink = styled(NavLink).attrs({
  activeClassName,
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
  
  ${({ disabled }) => disabled && `
    cursor: default;
    pointer-events: none;
  `}

  &.${activeClassName} {
    background-color: #327ccb;
    border-radius: 3rem;
    box-shadow: 0 4px 8px 0 ${({ theme }) => transparentize(0.95, theme.shadowColor)};
    box-sizing: border-box;
    font-weight: 500;
    color: #FFF;
    :focus
    :hover {
      /* border: 1px solid ${({ theme }) => darken(0.1, theme.mercuryGray)}; */
      background-color: #a3c3ea;
      color: #FFF;
    }
  }

  :hover {
    color: #000;
  }
`

function NavigationTabs({ location: { pathname }, history }) {
  const { t } = useTranslation()

  // const { account } = useWeb3React()

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

  return (
    <>
      <Tabs>
        {tabOrder.map(({ path, textKey, regex, disabled }) => (
          <StyledNavLink disabled={disabled} key={path} to={path} isActive={(_, { pathname }) => pathname.match(regex)}>
            {t(textKey)}
          </StyledNavLink>
        ))}
      </Tabs>
    </>
  )
}

export default withRouter(NavigationTabs)
