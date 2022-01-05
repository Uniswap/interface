import React, { useRef, useState, useEffect } from 'react'
import { Settings } from 'react-feather'
import styled, { css } from 'styled-components'
import { Trans, t } from '@lingui/macro'
import { ApplicationModal } from '../../state/application/actions'
import { useModalOpen, useToggleSettingsMenu } from '../../state/application/hooks'
import { useDarkModeManager, useUserLocale } from 'state/user/hooks'
import { TYPE } from '../../theme'
import { ButtonEmpty } from '../Button'
import { AutoColumn } from '../Column'
import { RowBetween, RowFixed } from '../Row'
import ThemeToggle from 'components/Toggle/ThemeToggle'
import useTheme from 'hooks/useTheme'
import ArrowRight from 'components/Icons/ArrowRight'
import { LOCALE_LABEL, SupportedLocale } from 'constants/locales'
import LanguageSelector from 'components/LanguageSelector'
import MenuFlyout from 'components/MenuFlyout'
import { useLingui } from '@lingui/react'

const StyledMenuIcon = styled(Settings)`
  height: 20px;
  width: 20px;

  > * {
    stroke: ${({ theme }) => theme.text};
  }
`

const StyledMenuButton = styled.button`
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

  border-radius: 0.5rem;

  :hover,
  :focus {
    cursor: pointer;
    outline: none;
    background-color: ${({ theme }) => theme.buttonBlack};
  }
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
  background-color: ${({ theme }) => theme.tableHeader};
  right: -10px;
  & > div {
    position: relative;
    :after {
      bottom: 100%;
      right: 18px;
      border: solid transparent;
      content: '';
      height: 0;
      width: 0;
      position: absolute;
      pointer-events: none;
      border-bottom-color: ${({ theme }) => theme.tableHeader};
      border-width: 10px;
      margin-left: -10px;
    }
  }
  ${({ theme }) => theme.mediaWidth.upToLarge`
    min-width: 18.125rem;
    & > div:after {
      top: 100%;
      border-top-color: ${({ theme }) => theme.tableHeader};
      border-bottom-color: transparent
      border-width: 10px;
      margin-left: -10px;
    }
  `};
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

  return (
    // https://github.com/DefinitelyTyped/DefinitelyTyped/issues/30451
    <StyledMenu ref={node as any}>
      <StyledMenuButton onClick={toggle} id="open-settings-dialog-button" aria-label="Settings">
        <StyledMenuIcon />
      </StyledMenuButton>
      <MenuFlyout
        node={node}
        browserCustomStyle={MenuFlyoutBrowserStyle}
        isOpen={open}
        toggle={toggle}
        translatedTitle={isSelectingLanguage ? undefined : t`Preferences`}
      >
        {!isSelectingLanguage ? (
          <>
            <RowBetween>
              <RowFixed>
                <TYPE.black fontWeight={400} fontSize={12} color={theme.text11}>
                  <Trans>Dark Mode</Trans>
                </TYPE.black>
              </RowFixed>
              <ThemeToggle id="toggle-dark-mode-button" isDarkMode={darkMode} toggle={toggleSetDarkMode} />
            </RowBetween>

            <RowBetween style={{ marginTop: '20px' }}>
              <RowFixed>
                <TYPE.black fontWeight={400} fontSize={12} color={theme.text11}>
                  <Trans>Language</Trans>
                </TYPE.black>
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
