import React, { useRef, useEffect } from 'react'
import styled from 'styled-components'

import { ReactComponent as MenuIcon } from '../../assets/images/menu.svg'

import { Link } from '../../theme'
import { darken } from 'polished'

import { useToggle } from '../../hooks'

const StyledMenuIcon = styled(MenuIcon)`
  path {
    stroke: ${({ theme }) => theme.text1};
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
  background-color: ${({ theme }) => theme.bg3};
  border: 1px solid ${({ theme }) => theme.bg3};

  padding: 0.15rem 0.5rem;
  border-radius: 0.5rem;

  :hover, :focus {
    /* background-color: ${({ theme }) => darken(0.2, theme.bg1)}; */
    border: 1px solid ${({ theme }) => darken(0.2, theme.bg1)};
    cursor: pointer;
    outline: none;
  }

  svg {
    margin-top: 2px;
    /* width: 25px;
    height: 24px; */
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
  background-color: ${({ theme }) => theme.bg1};
  border: 1px solid ${({ theme }) => theme.bg3};
  border-radius: 0.5rem;
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  font-size: 1rem;
  position: absolute;
  top: 3rem;
  right: 0rem;
  z-index: 100;
`

const MenuItem = styled(Link)`
  flex: 1;
  padding: 0.5rem 0.5rem;
  color: ${({ theme }) => theme.text2};
  :hover {
    color: ${({ theme }) => theme.text1};
    cursor: pointer;
  }
`

const CODE_LINK = !!process.env.REACT_APP_GIT_COMMIT_HASH
  ? `https://github.com/Uniswap/uniswap-frontend/tree/${process.env.REACT_APP_GIT_COMMIT_HASH}`
  : 'https://github.com/Uniswap/uniswap-frontend'

export default function Menu() {
  const node = useRef<HTMLDivElement>()
  const [open, toggle] = useToggle(false)

  useEffect(() => {
    const handleClickOutside = e => {
      if (node.current?.contains(e.target) ?? false) {
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
          <MenuItem id="link" href={CODE_LINK}>
            Code
          </MenuItem>
          <MenuItem id="link" href="https://uniswap.info/">
            Analytics
          </MenuItem>
        </MenuFlyout>
      ) : (
        ''
      )}
    </StyledMenu>
  )
}
