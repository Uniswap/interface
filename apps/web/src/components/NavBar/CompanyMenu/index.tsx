import { ArrowChangeDown } from 'components/Icons/ArrowChangeDown'
import { NavIcon } from 'components/Logo/NavIcon'
import { MenuDropdown } from 'components/NavBar/CompanyMenu/MenuDropdown'
import { MobileMenuDrawer } from 'components/NavBar/CompanyMenu/MobileMenuDrawer'
import { useIsMobileDrawer } from 'components/NavBar/ScreenSizes'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router'
import { Flex, Popover, styled, Text, useIsTouchDevice, useMedia } from 'ui/src'
import { Hamburger } from 'ui/src/components/icons/Hamburger'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'

const ArrowDownWrapper = styled(Text, {
  color: '$neutral2',
  '$group-hover': { color: '$neutral1' },
  variants: {
    open: {
      true: { color: '$neutral1' },
    },
  },
})

export function CompanyMenu() {
  const popoverRef = useRef<Popover>(null)
  const media = useMedia()
  const isMobileDrawer = useIsMobileDrawer()
  const isLargeScreen = !media.xxl
  const location = useLocation()
  const [isOpen, setIsOpen] = useState(false)

  // biome-ignore lint/correctness/useExhaustiveDependencies: +popoverRef
  const closeMenu = useCallback(() => {
    popoverRef.current?.close()
  }, [popoverRef])
  // biome-ignore lint/correctness/useExhaustiveDependencies: location dependency is sufficient for this effect
  useEffect(() => {
    // Immediately reset state to prevent flash during transitions
    setIsOpen(false)
    closeMenu()
  }, [location, closeMenu])

  const isTouchDevice = useIsTouchDevice()

  return (
    <Popover ref={popoverRef} placement="bottom" hoverable={!media.xl} stayInFrame allowFlip onOpenChange={setIsOpen}>
      <Popover.Trigger data-testid={TestID.NavCompanyMenu}>
        <Flex
          row
          alignItems="center"
          gap="$gap4"
          p="$spacing8"
          cursor="pointer"
          group
          $platform-web={{ containerType: 'normal' }}
        >
          <Link to="/?intro=true" style={{ textDecoration: 'none' }}>
            <Flex row alignItems="center" gap="$gap4" data-testid={TestID.NavUniswapLogo}>
              <NavIcon />
              {isLargeScreen && (
                <Text variant="subheading1" color="$accent1" userSelect="none">
                  Uniswap
                </Text>
              )}
            </Flex>
          </Link>
          {(media.md || isTouchDevice) && <Hamburger size={22} color="$neutral2" cursor="pointer" ml="16px" />}
          {!media.md && !isTouchDevice && (
            <ArrowDownWrapper open={isOpen}>
              <ArrowChangeDown width="12px" height="12px" />
            </ArrowDownWrapper>
          )}
        </Flex>
      </Popover.Trigger>
      {isMobileDrawer ? <MobileMenuDrawer isOpen={isOpen} closeMenu={closeMenu} /> : <MenuDropdown close={closeMenu} />}
    </Popover>
  )
}
