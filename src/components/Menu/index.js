import React, { useRef, useEffect } from 'react'
import styled from 'styled-components'

import { ReactComponent as MenuIcon } from '../../assets/images/menu.svg'

import { Link } from '../../theme'
import { darken } from 'polished'

import { useToggle } from '../../hooks'

const StyledMenuIcon = styled(MenuIcon)`
  path {
    stroke: ${({ theme }) => theme.textColor};
  }
`

const StyledMenuButton = styled.button`
  width: 100%;
  height: 100%;
  border: none;
  background-color: transparent;
  margin: 0;
  padding: 0;
  height: 35px;
  background-color: ${({ theme }) => theme.outlineGrey};
  border: 1px solid ${({ theme }) => theme.outlineGrey};

  padding: 0.15rem 0.5rem;
  border-radius: 0.5rem;

  :hover, :focus {
    /* background-color: ${({ theme }) => darken(0.2, theme.concreteGray)}; */
    border: 1px solid ${({ theme }) => darken(0.2, theme.concreteGray)};
    cursor: pointer;
    outline: none;
  }

  svg {
    width: 25px;
    height: 24px;
  }
`

const StyledMenu = styled.div`
  margin-left: 0.5rem;
  display: flex;
  box-sizing: border-box;
  justify-content: center;
  align-items: center;
  position: relative;
  border: none;
  text-align: left;
`

const MenuFlyout = styled.span`
  min-width: 8.125rem;
  background-color: ${({ theme }) => theme.inputBackground};
  ${({ theme }) => theme.dropShadow}
  border: 1px solid ${({ theme }) => theme.mercuryGray};
  border-radius: 0.5rem;
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  font-size: 1rem;
  position: absolute;
  top: 3rem;
  right: 0rem;
`

const MenuItem = styled(Link)`
  flex: 1;
  /* text-align: right; */
  padding: 0.5rem 0.5rem;
  color: ${({ theme }) => theme.doveGray};
  :hover {
    color: ${({ theme }) => theme.textColor};
    cursor: pointer;
  }
`

export default function Menu() {
  const node = useRef()
  const [open, toggle] = useToggle(false)

  useEffect(() => {
    const handleClickOutside = e => {
      if (node.current.contains(e.target)) {
        return
      }
      toggle()
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    } else {
      document.removeEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open, toggle])

  return (
    <StyledMenu ref={node}>
      <StyledMenuButton onClick={() => toggle()}>
        <StyledMenuIcon />
      </StyledMenuButton>
      {open ? (
        <MenuFlyout>
          <MenuItem id="link" href="https://uniswap.org/">
            About
          </MenuItem>
          <MenuItem id="link" href="https://uniswap.org/docs/v2">
            Docs
          </MenuItem>
          <MenuItem id="link" href="https://github.com/Uniswap">
            Code
          </MenuItem>
          <MenuItem id="link" href="https://uniswap.info/">
            Stats
          </MenuItem>
        </MenuFlyout>
      ) : (
        ''
      )}
    </StyledMenu>
  )
}
