import { AnimatedSlider } from 'components/AnimatedSlider'
import Column from 'components/Column'
import { useMenuContent } from 'components/NavBar/CompanyMenu/Content'
import { DownloadApp } from 'components/NavBar/CompanyMenu/DownloadAppCTA'
import { MenuLink } from 'components/NavBar/CompanyMenu/MenuDropdown'
import { NavDropdown } from 'components/NavBar/NavDropdown'
import { getSettingsViewIndex } from 'components/NavBar/PreferencesMenu'
import { CurrencySettings } from 'components/NavBar/PreferencesMenu/Currency'
import { LanguageSettings } from 'components/NavBar/PreferencesMenu/Language'
import { PreferenceSettings } from 'components/NavBar/PreferencesMenu/Preferences'
import { PreferencesView } from 'components/NavBar/PreferencesMenu/shared'
import { useTabsContent } from 'components/NavBar/Tabs/TabsContent'
import styled, { useTheme } from 'lib/styled-components'
import { Socials } from 'pages/Landing/sections/Footer'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'react-feather'
import { useTranslation } from 'react-i18next'
import { Accordion, Square, Text } from 'ui/src'

const StyledMenuLink = styled(MenuLink)`
  color: ${({ theme }) => theme.neutral2} !important;
  &:hover {
    color: ${({ theme }) => theme.neutral2} !important;
  }
`
const MobileDrawer = styled(Column)`
  padding: 12px 24px 32px 24px;
`

function MenuSection({
  title,
  children,
  collapsible = true,
}: {
  title: string
  children: JSX.Element | JSX.Element[]
  collapsible?: boolean
}) {
  const theme = useTheme()

  return (
    <Accordion.Item value={title} disabled={!collapsible}>
      <Column gap="10px">
        <Accordion.Trigger flexDirection="row" p="0" gap="4px">
          {({ open }: { open: boolean }) => (
            <>
              <Text variant="body1" color="$neutral1">
                {title}
              </Text>
              {collapsible && (
                <Square animation="200ms" rotate={open ? '-180deg' : '0deg'}>
                  <ChevronDown size="20px" color={theme.neutral2} />
                </Square>
              )}
            </>
          )}
        </Accordion.Trigger>
        <Accordion.Content p="0" forceMount={!collapsible || undefined}>
          <Column gap="10px">{children}</Column>
        </Accordion.Content>
      </Column>
    </Accordion.Item>
  )
}

export function MobileMenuDrawer({ isOpen, closeMenu }: { isOpen: boolean; closeMenu: () => void }) {
  const [openSections, setOpenSections] = useState<string[]>()
  const [settingsView, setSettingsView] = useState<PreferencesView>(PreferencesView.SETTINGS)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const changeView = useCallback(
    (view: PreferencesView) => {
      setSettingsView(view)
      if (dropdownRef?.current) {
        dropdownRef.current.scroll({
          top: 0,
        })
      }
    },
    [setSettingsView, dropdownRef],
  )
  const onExitPreferencesMenu = useCallback(() => changeView(PreferencesView.SETTINGS), [changeView])
  const { t } = useTranslation()
  const tabsContent = useTabsContent()
  const menuContent = useMenuContent()

  // Collapse sections on close
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => setOpenSections([]), 300)
    }
  }, [isOpen])

  return (
    <NavDropdown dropdownRef={dropdownRef} isOpen={isOpen}>
      <MobileDrawer>
        <AnimatedSlider
          currentIndex={getSettingsViewIndex(settingsView)}
          slideDirection={settingsView === PreferencesView.SETTINGS ? 'forward' : 'backward'}
        >
          <Accordion
            overflow="hidden"
            width="100%"
            type="multiple"
            value={openSections}
            onValueChange={setOpenSections}
          >
            <Column gap="24px">
              <MenuSection title={t('common.app')} collapsible={false}>
                {tabsContent.map((tab, index) => (
                  <StyledMenuLink
                    key={`${tab.title}_${index}}`}
                    label={tab.title}
                    href={tab.href}
                    internal
                    closeMenu={closeMenu}
                  />
                ))}
              </MenuSection>

              {menuContent.map((sectionContent, index) => (
                <MenuSection key={`${sectionContent.title}_${index}`} title={sectionContent.title}>
                  {sectionContent.items.map(({ label, href, internal }, index) => (
                    <StyledMenuLink
                      key={`${label}_${index}}`}
                      label={label}
                      href={href}
                      internal={internal}
                      closeMenu={closeMenu}
                    />
                  ))}
                </MenuSection>
              ))}

              <MenuSection title="Display Settings">
                <PreferenceSettings showHeader={false} setSettingsView={changeView} />
              </MenuSection>

              <DownloadApp onClick={closeMenu} />
              <Socials iconSize="25px" />
            </Column>
          </Accordion>

          <LanguageSettings onExitMenu={onExitPreferencesMenu} />
          <CurrencySettings onExitMenu={onExitPreferencesMenu} />
        </AnimatedSlider>
      </MobileDrawer>
    </NavDropdown>
  )
}
