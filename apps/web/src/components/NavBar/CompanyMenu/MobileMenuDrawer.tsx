import { HelpModal } from 'components/HelpModal/HelpModal'
import { MenuSectionTitle, useMenuContent } from 'components/NavBar/CompanyMenu/Content'
import { MenuLink } from 'components/NavBar/CompanyMenu/MenuDropdown'
import { LegalAndPrivacyMenu } from 'components/NavBar/LegalAndPrivacyMenu'
import { NavDropdown } from 'components/NavBar/NavDropdown'
import { getSettingsViewIndex } from 'components/NavBar/PreferencesMenu'
import { CurrencySettings } from 'components/NavBar/PreferencesMenu/Currency'
import { LanguageSettings } from 'components/NavBar/PreferencesMenu/Language'
import { PreferencesView } from 'components/NavBar/PreferencesMenu/shared'
import { useTabsContent } from 'components/NavBar/Tabs/TabsContent'
import { useTheme } from 'lib/styled-components'
import { Socials } from 'pages/Landing/sections/Footer'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'react-feather'
import { useTranslation } from 'react-i18next'
import { Accordion, AnimateTransition, Flex, Separator, Square, Text } from 'ui/src'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'

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
      <Flex gap="10px">
        <Accordion.Trigger flexDirection="row" p="0" gap="4px">
          {({ open }: { open: boolean }) => (
            <>
              <Text variant="body4" color="$neutral2">
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
          <Flex gap="10px">{children}</Flex>
        </Accordion.Content>
      </Flex>
    </Accordion.Item>
  )
}

export function MobileMenuDrawer({ isOpen, closeMenu }: { isOpen: boolean; closeMenu: () => void }) {
  const [openSections, setOpenSections] = useState<string[]>()
  const [settingsView, setSettingsView] = useState<PreferencesView>(PreferencesView.SETTINGS)
  const isConversionTrackingEnabled = useFeatureFlag(FeatureFlags.ConversionTracking)
  const dropdownRef = useRef<HTMLDivElement>(null)
  // biome-ignore lint/correctness/useExhaustiveDependencies: +setSettingsView, +dropdownRef
  const changeView = useCallback(
    (view: PreferencesView) => {
      setSettingsView(view)
      if (dropdownRef.current) {
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
  const productContent = useMenuContent({
    keys: [MenuSectionTitle.Products],
  })
  const menuContent = useMenuContent({
    keys: [MenuSectionTitle.Protocol, MenuSectionTitle.Company],
  })

  // Collapse sections on close
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => setOpenSections([]), 300)
    }
  }, [isOpen])

  return (
    <NavDropdown dropdownRef={dropdownRef} isOpen={isOpen} dataTestId={TestID.CompanyMenuMobileDrawer}>
      <Flex pt="$spacing12" pb="$spacing32" px="$spacing24">
        <AnimateTransition
          currentIndex={getSettingsViewIndex(settingsView)}
          animationType={settingsView === PreferencesView.SETTINGS ? 'forward' : 'backward'}
        >
          <Accordion
            overflow="hidden"
            width="100%"
            type="multiple"
            value={openSections}
            onValueChange={setOpenSections}
          >
            <Flex gap="$spacing24">
              <MenuSection title={t('common.app')} collapsible={false}>
                {tabsContent.map((tab, index) => (
                  <MenuLink
                    key={`${tab.title}_${index}}`}
                    label={tab.title}
                    href={tab.href}
                    internal
                    closeMenu={closeMenu}
                    icon={tab.icon}
                  />
                ))}
              </MenuSection>
              {Object.values(productContent).map((sectionContent, index) => (
                <MenuSection key={`${sectionContent.title}_${index}`} title={sectionContent.title} collapsible={false}>
                  {sectionContent.items.map(({ label, href, internal, icon }, index) => (
                    <MenuLink
                      key={`${label}_${index}}`}
                      label={label}
                      href={href}
                      internal={internal}
                      closeMenu={closeMenu}
                      icon={icon}
                    />
                  ))}
                </MenuSection>
              ))}

              <Separator backgroundColor="$surface3" />

              {Object.values(menuContent).map((sectionContent, index) => (
                <MenuSection key={`${sectionContent.title}_${index}`} title={sectionContent.title}>
                  {sectionContent.items.map(({ label, href, internal }, index) => (
                    <MenuLink
                      key={`${label}_${index}}`}
                      label={label}
                      href={href}
                      internal={internal}
                      closeMenu={closeMenu}
                    />
                  ))}
                </MenuSection>
              ))}
              {isConversionTrackingEnabled && <LegalAndPrivacyMenu closeMenu={closeMenu} />}
              <Flex row width="100%" justifyContent="space-between" alignItems="flex-end">
                <HelpModal showOnMobile />
                <Flex gap="$spacing16">
                  <Socials iconSize="20px" />
                </Flex>
              </Flex>
            </Flex>
          </Accordion>

          <LanguageSettings onExitMenu={onExitPreferencesMenu} />
          <CurrencySettings onExitMenu={onExitPreferencesMenu} />
        </AnimateTransition>
      </Flex>
    </NavDropdown>
  )
}
