import { Trans, t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import React, { useEffect, useRef, useState } from 'react'
import { isMobile } from 'react-device-detect'
import { Settings } from 'react-feather'
import { useLocation } from 'react-router-dom'
import styled, { css } from 'styled-components'

import ArrowRight from 'components/Icons/ArrowRight'
import LanguageSelector from 'components/LanguageSelector'
import MenuFlyout from 'components/MenuFlyout'
import ThemeToggle from 'components/Toggle/ThemeToggle'
import { TutorialIds } from 'components/Tutorial/TutorialSwap/constant'
import { LOCALE_LABEL, SupportedLocale } from 'constants/locales'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import useTheme from 'hooks/useTheme'
import { AppPaths } from 'pages/App'
import { useTutorialSwapGuide } from 'state/tutorial/hooks'
import { useDarkModeManager, useUserLocale } from 'state/user/hooks'

import { ApplicationModal } from '../../state/application/actions'
import { useModalOpen, useToggleSettingsMenu } from '../../state/application/hooks'
import { ButtonEmpty, ButtonLight } from '../Button'
import { AutoColumn } from '../Column'
import { RowBetween, RowFixed } from '../Row'

const StyledMenuIcon = styled(Settings)`
  height: 20px;
  width: 20px;

  > * {
    stroke: ${({ theme }) => theme.text};
  }
`

const StyledMenuButton = styled.button<{ active?: boolean }>`
  width: 100%;
  height: 100%;
  border: none;
  background-color: transparent;
  margin: 0;
  padding: 0;
  height: 40px;
  width: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.text};

  border-radius: 999px;

  :hover {
    cursor: pointer;
    outline: none;
    background-color: ${({ theme }) => theme.buttonBlack};
  }

  ${({ active }) =>
    active
      ? css`
          cursor: pointer;
          outline: none;
          background-color: ${({ theme }) => theme.buttonBlack};
        `
      : ''}
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

const MenuFlyoutBrowserStyle = css`
  min-width: 20.125rem;
  right: -10px;

  ${({ theme }) => theme.mediaWidth.upToLarge`
    min-width: 18.125rem;
  `};
`
const StyledLabel = styled.div`
  font-size: ${isMobile ? '14px' : '12px'};
  color: ${({ theme }) => theme.text};
  font-weight: 400;
  line-height: 20px;
`

const ButtonViewGuide = styled(ButtonLight)`
  display: flex;
  align-items: center;
  padding: 2px 5px;
  width: 55px;
`
export default function SettingsTab() {
  const theme = useTheme()
  const [darkMode, toggleSetDarkMode] = useDarkModeManager()
  const node = useRef<HTMLDivElement>()
  const open = useModalOpen(ApplicationModal.SETTINGS)
  const toggle = useToggleSettingsMenu()
  const userLocale = useUserLocale()
  useLingui() // To re-render t`Preferences` when language change

  const [isSelectingLanguage, setIsSelectingLanguage] = useState(false)

  useEffect(() => {
    if (!open) setIsSelectingLanguage(false)
  }, [open])

  const { mixpanelHandler } = useMixpanel()
  const setShowTutorialSwapGuide = useTutorialSwapGuide()[1]
  const openTutorialSwapGuide = () => {
    setShowTutorialSwapGuide({ show: true, step: 0 })
    mixpanelHandler(MIXPANEL_TYPE.TUTORIAL_CLICK_START)
    toggle()
  }
  const location = useLocation()
  const isShowTutorialBtn = location.pathname.startsWith(AppPaths.SWAP)
  return (
    // https://github.com/DefinitelyTyped/DefinitelyTyped/issues/30451
    <StyledMenu ref={node as any}>
      <StyledMenuButton active={open} onClick={toggle} id={TutorialIds.BUTTON_SETTING} aria-label="Settings">
        <StyledMenuIcon />
      </StyledMenuButton>
      <MenuFlyout
        node={node}
        browserCustomStyle={MenuFlyoutBrowserStyle}
        isOpen={open}
        toggle={toggle}
        translatedTitle={isSelectingLanguage ? undefined : t`Preferences`}
        hasArrow
        mobileCustomStyle={{ paddingBottom: '40px' }}
      >
        {isShowTutorialBtn && (
          <RowBetween style={{ marginTop: '15px' }} id={TutorialIds.BUTTON_VIEW_GUIDE_SWAP}>
            <RowFixed>
              <StyledLabel>
                <Trans>KyberSwap Guide</Trans>
              </StyledLabel>
            </RowFixed>
            <ButtonViewGuide onClick={openTutorialSwapGuide}>
              <StyledLabel style={{ color: theme.primary }}>
                <Trans>View</Trans>
              </StyledLabel>
            </ButtonViewGuide>
          </RowBetween>
        )}

        {!isSelectingLanguage ? (
          <>
            <RowBetween style={{ marginTop: '15px' }}>
              <RowFixed>
                <StyledLabel>
                  <Trans>Dark Mode</Trans>
                </StyledLabel>
              </RowFixed>
              <ThemeToggle id="toggle-dark-mode-button" isDarkMode={darkMode} toggle={toggleSetDarkMode} />
            </RowBetween>

            <RowBetween style={{ marginTop: '15px' }}>
              <RowFixed>
                <StyledLabel>
                  <Trans>Language</Trans>
                </StyledLabel>
              </RowFixed>
              <ButtonEmpty
                padding="0"
                width="fit-content"
                style={{ color: theme.text, textDecoration: 'none', fontSize: '14px' }}
                onClick={() => setIsSelectingLanguage(true)}
              >
                <span style={{ marginRight: '10px' }}>
                  {LOCALE_LABEL[userLocale as SupportedLocale] || LOCALE_LABEL['en-US']}
                </span>
                <ArrowRight fill={theme.text} />
              </ButtonEmpty>
            </RowBetween>
          </>
        ) : (
          <AutoColumn gap="md">
            <LanguageSelector setIsSelectingLanguage={setIsSelectingLanguage} />
          </AutoColumn>
        )}
      </MenuFlyout>
    </StyledMenu>
  )
}
