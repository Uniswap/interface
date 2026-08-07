import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Accordion, AnimateTransition, Flex, Separator, Square, Text } from 'ui/src'
import { RotatableChevron } from 'ui/src/components/icons/RotatableChevron'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { HelpModal } from '~/components/HelpModal/HelpModal'
import { MenuSectionTitle, useMenuContent } from '~/components/NavBar/CompanyMenu/Content'
import { MenuLink } from '~/components/NavBar/CompanyMenu/MenuLink'
import { LegalAndPrivacyMenu } from '~/components/NavBar/LegalAndPrivacyMenu'
import { NavDropdown } from '~/components/NavBar/NavDropdown'
import { getSettingsViewIndex } from '~/components/NavBar/PreferencesMenu'
import { CurrencySettings } from '~/components/NavBar/PreferencesMenu/Currency'
import { LanguageSettings } from '~/components/NavBar/PreferencesMenu/Language'
import { PreferencesView } from '~/components/NavBar/PreferencesMenu/shared'
import { useTabsContent } from '~/components/NavBar/Tabs/TabsContent'
import { Socials } from '~/pages/Landing/sections/Footer'

function MenuSection({
  title,
  children,
  collapsible = true,
}: {
  title: string
  children: JSX.Element | JSX.Element[]
  collapsible?: boolean
}) {
  return (
    <Accordion.Item value={title} disabled={!collapsible}>
      <Flex gap="$none">
        <Accordion.Trigger
          flexDirection="row"
          alignItems="center"
          p="0"
          gap="4px"
          minHeight={collapsible ? 36 : undefined}
        >
          {({ open }: { open: boolean }) => (
            <>
              <Text variant="body3" color="$neutral2">
                {title}
              </Text>
              {collapsible && (
                <Square animation="200ms" rotate={open ? '90deg' : '270deg'}>
                  <RotatableChevron size="$icon.20" color="$neutral2" />
                </Square>
              )}
            </>
          )}
        </Accordion.Trigger>
        <Accordion.Content p="0" forceMount={!collapsible || undefined}>
          <Flex gap="$none">{children}</Flex>
        </Accordion.Content>
      </Flex>
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
    <NavDropdown
      dropdownRef={dropdownRef}
      isOpen={isOpen}
      dataTestId={TestID.CompanyMenuMobileDrawer}
      borderColor="$surface3"
    >
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
            <Flex gap="$spacing20">
              <MenuSection title={t('common.app')} collapsible={false}>
                {tabsContent.map((tab, index) => (
                  <MenuLink
                    key={`${tab.title}_${index}}`}
                    label={tab.title}
                    href={tab.href}
                    internal
                    closeMenu={closeMenu}
                    icon={tab.icon}
                    textVariant="body1"
                    elementName={tab.elementName}
                  />
                ))}
              </MenuSection>

              <Flex gap="$spacing8">
                {Object.values(productContent).map((sectionContent, index) => (
                  <MenuSection key={`${sectionContent.title}_${index}`} title={sectionContent.title}>
                    {/* oxlint-disable-next-line no-shadow */}
                    {sectionContent.items.map(({ label, href, internal, elementName }, index) => (
                      <MenuLink
                        key={`${label}_${index}}`}
                        label={label}
                        href={href}
                        internal={internal}
                        closeMenu={closeMenu}
                        textVariant="body2"
                        elementName={elementName}
                      />
                    ))}
                  </MenuSection>
                ))}
                {Object.values(menuContent).map((sectionContent, index) => (
                  <MenuSection key={`${sectionContent.title}_${index}`} title={sectionContent.title}>
                    {/* oxlint-disable-next-line no-shadow */}
                    {sectionContent.items.map(({ label, href, internal, elementName }, index) => (
                      <MenuLink
                        key={`${label}_${index}}`}
                        label={label}
                        href={href}
                        internal={internal}
                        closeMenu={closeMenu}
                        textVariant="body2"
                        elementName={elementName}
                      />
                    ))}
                  </MenuSection>
                ))}
              </Flex>

              <Separator backgroundColor="$surface3" />

              <Flex gap="$spacing12">
                <LegalAndPrivacyMenu closeMenu={closeMenu} />
                <Flex row width="100%" justifyContent="space-between" alignItems="flex-end">
                  <HelpModal showOnXL flushInDrawer />
                  <Socials iconSize="24px" gap="$spacing12" iconPadding="$spacing4" flushLastRight />
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
