import React, { useRef, useEffect, useContext, useState } from 'react'
import { Settings, X, ArrowLeft } from 'react-feather'
import styled from 'styled-components'

import {
  useUserSlippageTolerance,
  useExpertModeManager,
  useUserDeadline,
  useDarkModeManager
} from '../../state/user/hooks'
import SlippageTabs from '../SlippageTabs'
import { RowFixed, RowBetween } from '../Row'
import { TYPE } from '../../theme'
import QuestionHelper from '../QuestionHelper'
import Toggle from '../Toggle'
import { ThemeContext } from 'styled-components'
import { AutoColumn } from '../Column'
import { ButtonError } from '../Button'
import { useSettingsMenuOpen, useToggleSettingsMenu } from '../../state/application/hooks'
import { Text } from 'rebass'

const StyledMenuIcon = styled(Settings)`
  height: 20px;
  width: 20px;

  > * {
    stroke: ${({ theme }) => theme.text1};
  }
`

const StyledArrow = styled(ArrowLeft)`
  height: 20px;
  width: 20px;
  :hover {
    cursor: pointer;
  }

  > * {
    stroke: ${({ theme }) => theme.text1};
  }
`

const StyledCloseIcon = styled(X)`
  height: 20px;
  width: 20px;
  :hover {
    cursor: pointer;
  }

  > * {
    stroke: ${({ theme }) => theme.text1};
  }
`

const StyledMenuButton = styled.button`
  position: relative;
  width: 100%;
  height: 100%;
  border: none;
  background-color: transparent;
  margin: 0;
  padding: 0;
  height: 35px;
  background-color: ${({ theme }) => theme.bg3};

  padding: 0.15rem 0.5rem;
  border-radius: 0.5rem;

  :hover,
  :focus {
    cursor: pointer;
    outline: none;
    background-color: ${({ theme }) => theme.bg4};
  }

  svg {
    margin-top: 2px;
  }
`
const EmojiWrapper = styled.div`
  position: absolute;
  bottom: -6px;
  right: 0px;
  font-size: 14px;
`

const StyledMenu = styled.div`
  margin-left: 0.5rem;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  border: none;
  text-align: left;
`

const MenuFlyout = styled.span`
  min-width: 20.125rem;
  background-color: ${({ theme }) => theme.bg1};
  box-shadow: 0px 0px 1px rgba(0, 0, 0, 0.01), 0px 4px 8px rgba(0, 0, 0, 0.04), 0px 16px 24px rgba(0, 0, 0, 0.04),
    0px 24px 32px rgba(0, 0, 0, 0.01);
  border-radius: 0.5rem;
  display: flex;
  flex-direction: column;
  font-size: 1rem;
  position: absolute;
  top: 3rem;
  right: 0rem;
  z-index: 100;

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    min-width: 18.125rem;
    right: -46px;
  `};
`

const Break = styled.div`
  width: 100%;
  height: 1px;
  background-color: ${({ theme }) => theme.bg3};
`

export default function SettingsTab() {
  const node = useRef<HTMLDivElement>()
  const open = useSettingsMenuOpen()
  const toggle = useToggleSettingsMenu()

  const theme = useContext(ThemeContext)
  const [userSlippageTolerance, setUserslippageTolerance] = useUserSlippageTolerance()

  const [deadline, setDeadline] = useUserDeadline()

  const [expertMode, toggleExpertMode] = useExpertModeManager()

  const [darkMode, toggleDarkMode] = useDarkModeManager()

  // show confirmation view before turning on
  const [showConfirmation, setShowConfirmation] = useState(false)

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
      <StyledMenuButton onClick={toggle}>
        <StyledMenuIcon />
        {expertMode && (
          <EmojiWrapper>
            <span role="img" aria-label="wizard-icon">
              🧙
            </span>
          </EmojiWrapper>
        )}
      </StyledMenuButton>
      {open &&
        (showConfirmation ? (
          <MenuFlyout>
            <RowBetween padding="1rem">
              <StyledArrow onClick={() => setShowConfirmation(false)} />
              <TYPE.black>{showConfirmation ? 'Are you sure?' : 'Settings'}</TYPE.black>
              <StyledCloseIcon onClick={toggle} />
            </RowBetween>
            <Break />
            <AutoColumn style={{ padding: '1.5rem' }} gap="lg">
              <Text fontWeight={500} fontSize={16}>
                Expert mode turns off the confirm transaction prompt and allows high slippage trades that often result
                in bad rates and lost funds.
              </Text>
              <Text fontWeight={600} fontSize={16}>
                ONLY USE THIS MODE IF YOU KNOW WHAT YOU ARE DOING.
              </Text>
              <ButtonError
                error={true}
                padding={'12px'}
                onClick={() => {
                  toggleExpertMode()
                  setShowConfirmation(false)
                }}
              >
                <Text fontSize={20} fontWeight={500}>
                  Continue Anyway
                </Text>
              </ButtonError>
            </AutoColumn>
          </MenuFlyout>
        ) : (
          <MenuFlyout>
            <RowBetween padding="1rem">
              <TYPE.black>Settings</TYPE.black>
              <StyledCloseIcon onClick={toggle} />
            </RowBetween>
            <Break />
            <AutoColumn gap="md" style={{ padding: '1rem' }}>
              <Text fontWeight={600} fontSize={14}>
                Transaction Settings
              </Text>
              <SlippageTabs
                rawSlippage={userSlippageTolerance}
                setRawSlippage={setUserslippageTolerance}
                deadline={deadline}
                setDeadline={setDeadline}
              />
              <Text fontWeight={600} fontSize={14}>
                Interface Settings
              </Text>
              <RowBetween>
                <RowFixed>
                  <TYPE.black fontWeight={400} fontSize={14} color={theme.text2}>
                    Toggle Expert Mode
                  </TYPE.black>
                  <QuestionHelper text="Bypasses confirmation modals and allows high slippage trades. Use at your own risk." />
                </RowFixed>
                <Toggle
                  isActive={expertMode}
                  toggle={
                    expertMode
                      ? () => {
                          toggleExpertMode()
                          setShowConfirmation(false)
                        }
                      : () => setShowConfirmation(true)
                  }
                />
              </RowBetween>
              <RowBetween>
                <RowFixed>
                  <TYPE.black fontWeight={400} fontSize={14} color={theme.text2}>
                    Toggle Dark Mode
                  </TYPE.black>
                </RowFixed>
                <Toggle isActive={darkMode} toggle={toggleDarkMode} />
              </RowBetween>
            </AutoColumn>
          </MenuFlyout>
        ))}
    </StyledMenu>
  )
}
