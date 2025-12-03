import { NavDropdown, NavDropdownTabWrapper } from 'components/NavBar/NavDropdown/index'
import { TabsItem, TabsSection, useTabsContent } from 'components/NavBar/Tabs/TabsContent'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { NavLink, useLocation } from 'react-router'
import { Flex, Popover, styled, Text } from 'ui/src'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'

const TabText = styled(Text, {
  justifyContent: 'center',
  alignItems: 'center',
  m: '$padding8',
  gap: '$gap4',
  cursor: 'pointer',
  userSelect: 'none',
  color: '$neutral2',
  hoverStyle: { color: '$neutral1' },
  variants: {
    isActive: {
      true: { color: '$neutral1' },
    },
  },
})

interface TItemProps {
  icon?: JSX.Element
  label: string
  path: string
  closeMenu: () => void
  elementName?: ElementName
}
function Item({ icon, label, path, closeMenu, elementName }: TItemProps) {
  const content = (
    <NavLink to={path} style={{ textDecoration: 'none' }} onClick={closeMenu}>
      <Flex
        row
        alignItems="center"
        p="$padding12"
        gap="$gap8"
        alignSelf="stretch"
        borderRadius="$rounded12"
        backgroundColor="$surface2"
        height="$spacing48"
        hoverStyle={{ backgroundColor: '$surface2Hovered' }}
      >
        {icon}
        <Text variant="buttonLabel2" width="100%" color="$neutral2">
          {label}
        </Text>
      </Flex>
    </NavLink>
  )

  if (elementName) {
    return (
      <Trace logPress element={elementName}>
        {content}
      </Trace>
    )
  }

  return content
}

const Tab = ({
  label,
  isActive,
  path,
  items,
}: {
  label: string
  isActive?: boolean
  path: string
  items?: TabsItem[]
}) => {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const popoverRef = useRef<Popover>(null)
  const location = useLocation()

  // biome-ignore lint/correctness/useExhaustiveDependencies: +popoverRef
  const closeMenu = useCallback(() => {
    popoverRef.current?.close()
  }, [popoverRef])
  // biome-ignore lint/correctness/useExhaustiveDependencies: location dependency is sufficient for this effect
  useEffect(() => closeMenu(), [location, closeMenu])

  const isPortfolioTab = label === t('common.portfolio')
  const labelContent = (
    <NavLink to={path} style={{ textDecoration: 'none' }}>
      <TabText variant="subheading1" isActive={isActive || isOpen}>
        {label}
      </TabText>
    </NavLink>
  )

  // TODO: add tracing for other tabs
  const Label = isPortfolioTab ? (
    <Trace logPress element={ElementName.NavbarPortfolioTab}>
      {labelContent}
    </Trace>
  ) : (
    labelContent
  )

  if (!items) {
    return Label
  }

  return (
    <Popover
      ref={popoverRef}
      placement="bottom"
      hoverable={{
        delay: { open: 75, close: 150 },
        restMs: 50,
        move: true,
      }}
      stayInFrame
      allowFlip
      onOpenChange={setIsOpen}
    >
      <Popover.Trigger data-testid={`${label}-tab`}>{Label}</Popover.Trigger>
      <NavDropdown isOpen={isOpen} dataTestId={`${label}-menu`}>
        <NavDropdownTabWrapper>
          {items.map((item, index) => (
            <Item
              key={`${item.label}_${index}`}
              icon={item.icon}
              label={item.label}
              path={item.href}
              closeMenu={closeMenu}
              elementName={item.elementName}
            />
          ))}
        </NavDropdownTabWrapper>
      </NavDropdown>
    </Popover>
  )
}

export function Tabs() {
  const tabsContent: TabsSection[] = useTabsContent()
  return (
    <>
      {tabsContent.map(({ title, isActive, href, items }, index) => (
        <Tab key={`${title}_${index}`} label={title} isActive={isActive} path={href} items={items} />
      ))}
    </>
  )
}
