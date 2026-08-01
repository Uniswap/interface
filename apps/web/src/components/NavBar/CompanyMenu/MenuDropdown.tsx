import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Anchor, Flex, Separator, styled, Text } from 'ui/src'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { HelpModal } from '~/components/HelpModal/HelpModal'
import { MenuItem, MenuSection, MenuSectionTitle, useMenuContent } from '~/components/NavBar/CompanyMenu/Content'
import { MenuLink } from '~/components/NavBar/CompanyMenu/MenuLink'
import { LegalAndPrivacyMenu } from '~/components/NavBar/LegalAndPrivacyMenu'
import { NavDropdown } from '~/components/NavBar/NavDropdown'
import { useTabsVisible } from '~/components/NavBar/ScreenSizes'
import { useTabsContent } from '~/components/NavBar/Tabs/TabsContent'
import { Socials } from '~/pages/Landing/sections/Footer'
import { ClickableTamaguiStyle } from '~/theme/components/styles'

const Container = styled(Flex, {
  width: '400px',
  p: '$gap16',
  userSelect: 'none',
  height: 'unset',
  borderRadius: '$rounded12',
  backgroundColor: '$surface2',
  boxShadow: '$shadow.1',
})

function Section({ title, items, closeMenu }: MenuSection) {
  return (
    <Flex gap="$spacing8" flex={1} data-testid={`menu-section-${title}`}>
      <Text variant="body4" color="$neutral2">
        {title}
      </Text>
      {items.map((item, index) => (
        <MenuLink
          key={`${title}_${index}}`}
          label={item.label}
          href={item.href}
          internal={item.internal}
          overflow={item.overflow}
          closeMenu={closeMenu}
          elementName={item.elementName}
        />
      ))}
    </Flex>
  )
}

function ProductSection({ items }: { items: MenuItem[] }) {
  const { t } = useTranslation()
  return (
    <Flex gap="$gap12" data-testid={`menu-section-${t('common.products')}`}>
      <Text variant="body4" color="$neutral2">
        {t('common.products')}
      </Text>
      <Flex row gap="$gap16" flexWrap="wrap">
        {items.map((item, index) => (
          <Trace logPress element={item.elementName} key={`${item.label}_${index}}`}>
            <Anchor
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              {...ClickableTamaguiStyle}
              aria-label={item.label}
            >
              <Flex row gap="$gap8" minWidth={168}>
                <Flex p="$padding6" borderRadius="$rounded8" backgroundColor="$accent2">
                  {item.icon}
                </Flex>
                <Flex>
                  <Text variant="body3">{item.label}</Text>
                  <Text fontSize={10} lineHeight={14} color="$neutral2">
                    {item.body}
                  </Text>
                </Flex>
              </Flex>
            </Anchor>
          </Trace>
        ))}
      </Flex>
    </Flex>
  )
}

export function MenuDropdown({ close }: { close?: () => void }) {
  const { t } = useTranslation()
  const menuContent = useMenuContent({
    keys: [MenuSectionTitle.Protocol, MenuSectionTitle.Company],
  })
  const productSection = useMenuContent({
    keys: [MenuSectionTitle.Products],
  })
  const areTabsVisible = useTabsVisible()
  const tabs = useTabsContent()
  const tabsMenuItems = useMemo(() => {
    return tabs.map((tab) => {
      return {
        label: tab.title,
        href: tab.href,
        internal: true,
        overflow: false,
        elementName: tab.elementName,
      }
    })
  }, [tabs])

  return (
    <NavDropdown isOpen={false} dataTestId={TestID.NavCompanyDropdown} borderColor="$surface3">
      <Container>
        <Flex gap="$spacing16">
          {productSection[MenuSectionTitle.Products] && (
            <ProductSection items={productSection[MenuSectionTitle.Products].items} />
          )}
          {!areTabsVisible && <Section title={t('common.app')} items={tabsMenuItems} closeMenu={close} />}
          <Separator />
          <Flex row>
            {Object.values(menuContent).map((sectionContent, index) => (
              <Section
                key={`menu_section_${index}`}
                title={sectionContent.title}
                items={sectionContent.items}
                closeMenu={close}
              />
            ))}
          </Flex>
          <Flex
            flexDirection="row"
            justifyContent="space-between"
            alignItems="center"
            $xl={{ flexDirection: 'column', gap: '$spacing16', alignItems: 'flex-start' }}
          >
            <Flex flex={1} width="100%">
              <LegalAndPrivacyMenu closeMenu={close} />
            </Flex>
            <Flex row alignSelf="flex-end" alignItems="center" justifyContent="space-between" $xl={{ width: '100%' }}>
              <Flex display="none" $xl={{ display: 'flex' }}>
                <HelpModal showOnXL />
              </Flex>
              <Socials iconSize="18px" gap="$spacing12" />
            </Flex>
          </Flex>
        </Flex>
      </Container>
    </NavDropdown>
  )
}
