import React, { useState } from 'react'

import { Trans } from '@lingui/macro'
import { ChevronDown } from 'react-feather'
import styled from 'styled-components'
import { Flex } from 'rebass'
import { isMobile } from 'react-device-detect'
import { darken } from 'polished'
import { NavLink, useLocation } from 'react-router-dom'

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
  color: ${({ theme }) => theme.subText};
  font-size: 1rem;
  width: fit-content;
  margin: 0 12px;
  font-weight: 500;

  &.${activeClassName} {
    border-radius: 12px;
    font-weight: 600;
    color: ${({ theme }) => theme.primary};
  }

  :hover {
    color: ${({ theme }) => darken(0.1, theme.primary)};
  }
`

const Dropdown = styled.div`
  display: none;
  position: absolute;
  background: ${({ theme }) => theme.tableHeader};
  filter: drop-shadow(0px 4px 12px rgba(0, 0, 0, 0.36));
  box-shadow: 0px 0px 1px rgba(0, 0, 0, 0.01), 0px 4px 8px rgba(0, 0, 0, 0.04), 0px 16px 24px rgba(0, 0, 0, 0.04),
    0px 24px 32px rgba(0, 0, 0, 0.01);
  border-radius: 8px;
  padding: 16px;
  width: max-content;
  top: 36px;
  left: 50%;
  transform: translate(-50%, 0);
  gap: 16px;
`
const DropdownIcon = styled.div`
  width: 0;
  height: 0;
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-top: 6px solid ${({ theme }) => theme.subText};
  margin-left: 4px;
  transition: transform 300ms;
`

const HoverDropdown = styled.div<{ active: boolean }>`
  position: relative;
  display: inline-block;
  cursor: pointer;
  color: ${({ theme, active }) => (active ? theme.primary : theme.subText)};
  font-size: 1rem;
  width: fit-content;
  padding: 8px 12px;
  font-weight: 500;
  ${DropdownIcon} {
    border-top: 6px solid ${({ theme, active }) => (active ? theme.primary : theme.subText)};
  }
  :hover {
    color: ${({ theme }) => darken(0.1, theme.primary)};
    ${Dropdown} {
      display: flex;
      flex-direction: column;
      ${StyledNavLink} {
        margin: 0;
      }
    }
    ${DropdownIcon} {
      transform: rotate(-180deg);
      border-top: 6px solid ${({ theme }) => theme.primary};
    }
  }
`

export const LinkCointainer = styled(Flex)`
  position: absolute;
  bottom: -100px;
  left: 0;
  border-radius: 8px;
  flex-direction: column;
  background: ${({ theme }) => theme.tableHeader};
  z-index: 9999;
  padding: 16px;
  gap: 16px;
`

export default function AboutPageDropwdown({}) {
  const [isShowOptions, setIsShowOptions] = useState(false)
  const { pathname } = useLocation()

  const handleClick = (e: any) => {
    e.preventDefault()
    setIsShowOptions(prev => !prev)
  }

  return (
    <HoverDropdown active={pathname.toLowerCase().includes('about')}>
      <Flex alignItems="center">
        <Trans>About</Trans>
        <DropdownIcon />
      </Flex>
      <Dropdown>
        <StyledNavLink id={`about-kyberswap`} to={'/about/kyberswap'} isActive={match => Boolean(match)}>
          <Trans>KyberSwap</Trans>
        </StyledNavLink>

        <StyledNavLink id={`about-knc`} to={'/about/knc'} isActive={match => Boolean(match)}>
          <Trans> KNC</Trans>
        </StyledNavLink>
      </Dropdown>
    </HoverDropdown>
  )
}
