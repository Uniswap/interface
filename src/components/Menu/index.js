import React, { useRef, useEffect, useState } from 'react'
import styled from 'styled-components'

import { useDarkModeManager } from '../../contexts/LocalStorage'
import { ReactComponent as MenuIcon } from '../../assets/images/menu.svg'

import { Link } from '../../theme'
import { darken, transparentize } from 'polished'
import { useAdvancedManager } from '../../contexts/LocalStorage'

import Toggle from 'react-switch'

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
const ToggleItem = styled.span`
  color: ${({ theme }) => theme.doveGray};
  padding: 0.5rem 0.5rem 0.5rem 0.5rem;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  width: 100%;
`

const Divider = styled.span`
  width: 100%;
  margin-bottom: 0.5rem;
  padding-top: 0.5rem;
  border-bottom: 1px solid ${({ theme }) => theme.mercuryGray};
`

const StyledToggle = styled(Toggle)`
  margin-right: 0.75rem;
  .react-switch-bg[style] {
    background-color: ${({ theme, checked, showColor }) =>
      checked ? theme.connectedGreen : darken(0.05, theme.inputBackground)} !important;
    border: 1px solid ${({ theme }) => theme.concreteGray} !important;
  }
  .react-switch-handle[style] {
    background-color: ${({ theme }) => theme.connectedGreen};
    box-shadow: 0 4px 8px 0 ${({ theme }) => transparentize(0.93, theme.shadowColor)};
    border: 1px solid ${({ theme }) => theme.mercuryGray};
    border-color: ${({ theme }) => theme.mercuryGray} !important;
    top: 2px !important;
    margin-left: 1px;
  }
`

const StyledToggleNoColor = styled(Toggle)`
  margin-right: 0.75rem;
  .react-switch-bg[style] {
    background-color: ${({ theme }) => darken(0.05, theme.inputBackground)} !important;
    border: 1px solid ${({ theme }) => theme.concreteGray} !important;
  }
  .react-switch-handle[style] {
    background-color: ${({ theme }) => theme.connectedGreen};
    box-shadow: 0 4px 8px 0 ${({ theme }) => transparentize(0.93, theme.shadowColor)};
    border: 1px solid ${({ theme }) => theme.mercuryGray};
    border-color: ${({ theme }) => theme.mercuryGray} !important;
    top: 2px !important;
    margin-left: 1px;
  }
`

const EmojiToggle = styled.span`
  font-family: Arial sans-serif;
  vertical-align: middle;
  text-align: center;
  width: 100%;
`

export default function Menu() {
  const [isDark, toggleDarkMode] = useDarkModeManager()
  const [isAdvanced, toggleAdvanced] = useState()

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
          <MenuItem id="link" href="https://uniswap.io/">
            About
          </MenuItem>
          <MenuItem id="link" href="https://docs.uniswap.io/">
            Docs
          </MenuItem>
          <MenuItem id="link" href="https://github.com/Uniswap">
            Code
          </MenuItem>
          <MenuItem id="link" href="https://uniswap.info/">
            Stats
          </MenuItem>
          <Divider></Divider>
          <ToggleItem>
            <span>Theme</span>
            <StyledToggleNoColor
              checked={!isDark}
              uncheckedIcon={
                <EmojiToggle role="img" aria-label="moon">
                  {/* eslint-disable-line jsx-a11y/accessible-emoji */}
                  🌙️
                </EmojiToggle>
              }
              checkedIcon={
                <EmojiToggle role="img" aria-label="sun">
                  {/* eslint-disable-line jsx-a11y/accessible-emoji */}
                  {'☀️'}
                </EmojiToggle>
              }
              onChange={() => toggleDarkMode()}
            />
          </ToggleItem>
          <ToggleItem>
            <span>Advanced</span>
            <StyledToggle
              checked={isAdvanced}
              uncheckedIcon={false}
              checkedIcon={false}
              onChange={() => toggleAdvanced()}
            />
          </ToggleItem>
        </MenuFlyout>
      ) : (
        ''
      )}
    </StyledMenu>
  )
}
