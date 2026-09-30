import { Anchor, clickableStyle, cn, Flex, type FlexCompatProps, Separator, Text } from '@universe/mycelium'
import { TestID } from '@universe/test'
import { forwardRef, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { HelpModal } from '~/components/HelpModal/HelpModal'
import { MenuItem, MenuSection, MenuSectionTitle, useMenuContent } from '~/components/NavBar/CompanyMenu/Content'
import { MenuLink } from '~/components/NavBar/CompanyMenu/MenuLink'
import { LegalAndPrivacyMenu } from '~/components/NavBar/LegalAndPrivacyMenu'
import { NavDropdown } from '~/components/NavBar/NavDropdown'
import { useTabsVisible } from '~/components/NavBar/ScreenSizes'
import { useTabsContent } from '~/components/NavBar/Tabs/TabsContent'
import { Socials } from '~/pages/Landing/sections/Footer'

// `width`/`height` are omitted, not just avoided below: `{...props}` spreads last, so a caller
// passing either would reintroduce the inherited-`--c-w` bug the className works around.
type ContainerProps = Omit<FlexCompatProps, 'width' | 'height'>

const Container = forwardRef<HTMLDivElement, ContainerProps>(function Container({ className, ...props }, ref) {
  return (
    <Flex
      ref={ref}
      // Migration scaffolding: size via source classes, not the `width`/`height` props. Those
      // props compile to `var(--c-w)`/`var(--c-h)` backed by INHERITED custom properties, so a
      // `width="400px"` prop here publishes `--c-w: 400px` to the whole subtree — and the
      // descendant Expand's `width="unset"` resolves `width: var(--c-w)` to that 400px instead of
      // auto, overflowing its own parent and shoving Legal & Privacy onto the social icons.
      // `h-auto` is what the legacy `height: 'unset'` computed to. Restore the plain props once
      // INFRA-3925 fixes the keyword lane.
      className={cn('w-[400px] h-auto', className)}
      p="$gap16"
      userSelect="none"
      borderRadius="$rounded12"
      backgroundColor="$surface2"
      {...props}
    />
  )
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
              {...clickableStyle}
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
              <LegalAndPrivacyMenu closeMenu={close} singleRowLinks />
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
