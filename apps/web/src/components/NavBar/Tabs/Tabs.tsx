import { NavDropdown, NavDropdownTabWrapper } from 'components/NavBar/NavDropdown/index'
import { TabsItem, TabsSection, useTabsContent } from 'components/NavBar/Tabs/TabsContent'
import { useKeyDown } from 'hooks/useKeyPress'
import { useCallback, useEffect, useRef, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { Flex, Popover, Text, styled } from 'ui/src'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'

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

const QuickKey = styled(Flex, {
  width: '$spacing20',
  height: '$spacing20',
  centered: true,
  gap: '$spacing8',
  borderRadius: '$rounded4',
  opacity: 0.5,
  background: '$surface3',
})

interface TItemProps {
  icon?: JSX.Element
  label: string
  quickKey: string
  path: string
  closeMenu: () => void
}
function Item({ icon, label, quickKey, path, closeMenu }: TItemProps) {
  const navHotkeysEnabled = useFeatureFlag(FeatureFlags.NavigationHotkeys)

  return (
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
        {navHotkeysEnabled && (
          <QuickKey>
            <Text variant="body3" color="$neutral2">
              {quickKey}
            </Text>
          </QuickKey>
        )}
      </Flex>
    </NavLink>
  )
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
  const [isOpen, setIsOpen] = useState(false)
  const navigate = useNavigate()
  const popoverRef = useRef<Popover>(null)
  const location = useLocation()
  const navHotkeysEnabled = useFeatureFlag(FeatureFlags.NavigationHotkeys)

  const closeMenu = useCallback(() => {
    popoverRef.current?.close()
  }, [popoverRef])
  useEffect(() => closeMenu(), [location, closeMenu])

  const Label = (
    <NavLink to={path} style={{ textDecoration: 'none' }}>
      <TabText variant="subheading1" isActive={isActive || isOpen}>
        {label}
      </TabText>
    </NavLink>
  )

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!items || !isOpen) {
        return
      }
      const item = items.find((i) => i.quickKey.toUpperCase() === event.key || i.quickKey.toLowerCase() === event.key)
      if (!item) {
        return
      }
      if (item.internal) {
        navigate(item.href)
      } else {
        window.location.href = item.href
      }
      closeMenu()
    },
    [items, navigate, closeMenu, isOpen],
  )

  useKeyDown({
    callback: handleKeyDown,
    keys: items?.map((i) => i.quickKey.toLowerCase()),
    disabled: !navHotkeysEnabled || !isOpen,
  })

  if (!items) {
    return Label
  }

  return (
    <Popover ref={popoverRef} placement="bottom" hoverable stayInFrame allowFlip onOpenChange={setIsOpen}>
      <Popover.Trigger data-testid={`${label}-tab`}>{Label}</Popover.Trigger>
      <NavDropdown isOpen={isOpen} dataTestId={`${label}-menu`}>
        <NavDropdownTabWrapper>
          {items.map((item, index) => (
            <Item
              key={`${item.label}_${index}`}
              icon={item.icon}
              label={item.label}
              quickKey={item.quickKey}
              path={item.href}
              closeMenu={closeMenu}
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
