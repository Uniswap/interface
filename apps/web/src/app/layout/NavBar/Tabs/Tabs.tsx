import { Flex, Text, type TextCompatProps } from '@universe/mycelium'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router'
import { Popover } from 'ui/src'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { NavDropdown, NavDropdownTabWrapper } from '~/app/layout/NavBar/NavDropdown/index'
import { TabsItem, TabsSection, useTabsContent } from '~/app/layout/NavBar/Tabs/TabsContent'

function TabText({ isActive, hoverStyle, ...rest }: TextCompatProps & { isActive?: boolean }): JSX.Element {
  return (
    <Text
      justifyContent="center"
      alignItems="center"
      m="$padding8"
      gap="$gap4"
      cursor="pointer"
      userSelect="none"
      color={isActive ? '$neutral1' : '$neutral2'}
      hoverStyle={{ color: '$neutral1', ...hoverStyle }}
      {...rest}
    />
  )
}

interface TItemProps {
  icon?: JSX.Element
  label: string
  path: string
  closeMenu: () => void
  elementName: ElementName
}
function Item({ icon, label, path, closeMenu, elementName }: TItemProps) {
  return (
    <Trace logPress element={elementName}>
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
    </Trace>
  )
}

const Tab = ({
  label,
  isActive,
  path,
  items,
  badge,
  elementName,
}: {
  label: string
  isActive?: boolean
  path: string
  items?: TabsItem[]
  badge?: JSX.Element
  elementName: ElementName
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const popoverRef = useRef<Popover>(null)
  const location = useLocation()

  const closeMenu = useCallback(() => {
    popoverRef.current?.close()
  }, [popoverRef])
  useEffect(() => closeMenu(), [location, closeMenu])

  const Label = (
    <Trace logPress element={elementName}>
      <Link to={path} aria-current={isActive ? 'page' : undefined} style={{ textDecoration: 'none' }}>
        <Flex row alignItems="center">
          <TabText variant="subheading1" isActive={isActive || isOpen}>
            {label}
          </TabText>
          {badge}
        </Flex>
      </Link>
    </Trace>
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
      <NavDropdown isOpen={isOpen} onClose={closeMenu} dataTestId={`${label}-menu`}>
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
      {tabsContent.map(({ title, isActive, href, items, badge, elementName }, index) => (
        <Tab
          key={`${title}_${index}`}
          label={title}
          isActive={isActive}
          path={href}
          items={items}
          badge={badge}
          elementName={elementName}
        />
      ))}
    </>
  )
}
