import { useTranslation } from 'react-i18next'
import { Flex, Separator, styled, Text } from 'ui/src'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { MenuItem, MenuSectionTitle, useMenuContent } from '~/components/NavBar/CompanyMenu/Content'
import { MenuLink } from '~/components/NavBar/CompanyMenu/MenuDropdown'
import { useModalState } from '~/hooks/useModalState'

const PolicyLink = styled(Text, {
  variant: 'body3',
  color: '$neutral2',
  cursor: 'pointer',
  hoverStyle: { color: '$neutral1' },
  // Tamagui bug. Animation property breaks theme value transition, needs to use style instead
  style: { transition: '100ms' },
})

function FooterSection({ title, items }: { title: string; items: MenuItem[] }) {
  return (
    <Flex width={130} $md={{ width: '100%' }} flexGrow={0} flexShrink={1} flexBasis="auto" gap={8}>
      <Text variant="subheading2">{title}</Text>
      <Flex gap={5}>
        {items.map((item, index) => (
          <MenuLink
            key={`footer_${title}_${index}}`}
            label={item.label}
            href={item.href}
            internal={item.internal}
            overflow={item.overflow}
            elementName={item.elementName}
            textVariant="subheading2"
          />
        ))}
      </Flex>
    </Flex>
  )
}

export function Footer() {
  const { t } = useTranslation()
  const { toggleModal: togglePrivacyPolicy } = useModalState(ModalName.PrivacyPolicy)
  const { toggleModal: toggleDisclosures } = useModalState(ModalName.Disclosures)
  const sectionContent = useMenuContent()
  const productsSection = sectionContent[MenuSectionTitle.Products]
  const protocolSection = sectionContent[MenuSectionTitle.Protocol]
  const companySection = sectionContent[MenuSectionTitle.Company]
  const needHelpSection = sectionContent[MenuSectionTitle.NeedHelp]
  const currentYear = new Date().getFullYear()

  return (
    <Flex maxWidth="100vw" width="100%" gap="$spacing24" pt="$none" px="$spacing48" pb={40} $lg={{ px: '$spacing40' }}>
      <Flex row $md={{ flexDirection: 'column' }} justifyContent="space-between" gap="$spacing32">
        <Flex row $md={{ flexDirection: 'column' }} height="100%" gap="$spacing16">
          <Flex row gap="$spacing16" justifyContent="space-between" $md={{ width: 'auto' }}>
            {productsSection && <FooterSection title={productsSection.title} items={productsSection.items} />}
            {protocolSection && <FooterSection title={protocolSection.title} items={protocolSection.items} />}
          </Flex>
          <Flex row gap="$spacing16" $md={{ width: 'auto' }}>
            {companySection && <FooterSection title={companySection.title} items={companySection.items} />}
            {needHelpSection && <FooterSection title={needHelpSection.title} items={needHelpSection.items} />}
          </Flex>
        </Flex>
      </Flex>
      <Separator />
      <Flex
        row
        alignItems="center"
        $md={{ flexDirection: 'column', alignItems: 'flex-start' }}
        width="100%"
        justifyContent="space-between"
      >
        <Text variant="body3">© {currentYear} - HookSwap</Text>
        <Flex row alignItems="center" gap="$spacing16">
          <PolicyLink onPress={toggleDisclosures}>{t('common.disclosures')}</PolicyLink>
          <PolicyLink onPress={togglePrivacyPolicy}>{t('common.privacyPolicy')}</PolicyLink>
        </Flex>
      </Flex>
    </Flex>
  )
}
