import React, { useRef, useState, useEffect } from 'react'
import { Settings } from 'react-feather'
import { Text } from 'rebass'
import styled from 'styled-components'
import { Trans } from '@lingui/macro'
import { useOnClickOutside } from '../../hooks/useOnClickOutside'
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

const MenuFlyout = styled.span`
  min-width: 20.125rem;
  background-color: ${({ theme }) => theme.background};
  filter: drop-shadow(0px 4px 12px rgba(0, 0, 0, 0.36));
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  font-size: 1rem;
  position: absolute;
  top: 4rem;
  right: 0rem;
  z-index: 100;

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    min-width: 18.125rem;
    right: -46px;
  `};

  ${({ theme }) => theme.mediaWidth.upToLarge`
    min-width: 18.125rem;
    top: unset;
    bottom: 3.5rem;
  `};
`

export default function SettingsTab() {
  const theme = useTheme()
  const [darkMode, toggleSetDarkMode] = useDarkModeManager()
  const node = useRef<HTMLDivElement>()
  const open = useModalOpen(ApplicationModal.SETTINGS)
  const toggle = useToggleSettingsMenu()
  const userLocale = useUserLocale()

  const [isSelectingLanguage, setIsSelectingLanguage] = useState(false)

  useOnClickOutside(node, open ? toggle : undefined)

  useEffect(() => {
    if (!open) setIsSelectingLanguage(false)
  }, [open])

  return (
    // https://github.com/DefinitelyTyped/DefinitelyTyped/issues/30451
    <StyledMenu ref={node as any}>
      <StyledMenuButton onClick={toggle} id="open-settings-dialog-button" aria-label="Settings">
        <StyledMenuIcon />
      </StyledMenuButton>

      {open && (
        <MenuFlyout>
          {!isSelectingLanguage ? (
            <AutoColumn gap="16px" style={{ padding: '20px' }}>
              <Text fontWeight={600} fontSize={14} color={theme.text11}>
                <Trans>Preferences</Trans>
              </Text>

              <AutoColumn
                style={{
                  borderTop: `1px solid ${theme.border}`,
                  padding: '16px 0 4px'
                }}
              >
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
              </AutoColumn>
            </AutoColumn>
          ) : (
            <AutoColumn gap="md" style={{ padding: '20px' }}>
              <LanguageSelector setIsSelectingLanguage={setIsSelectingLanguage} />
            </AutoColumn>
          )}
        </MenuFlyout>
      )}
    </StyledMenu>
  )
}
