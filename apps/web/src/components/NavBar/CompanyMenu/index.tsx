import { ArrowChangeDown } from 'components/Icons/ArrowChangeDown'
import { NavIcon } from 'components/Logo/NavIcon'
import { MenuDropdown } from 'components/NavBar/CompanyMenu/MenuDropdown'
import { MobileMenuDrawer } from 'components/NavBar/CompanyMenu/MobileMenuDrawer'
import { useIsMobileDrawer } from 'components/NavBar/ScreenSizes'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Flex, Popover, Text, styled, useIsTouchDevice, useMedia } from 'ui/src'
import { Hamburger } from 'ui/src/components/icons/Hamburger'

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
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)

  const closeMenu = useCallback(() => {
    popoverRef.current?.close()
  }, [popoverRef])
  useEffect(() => closeMenu(), [location, closeMenu])

  const handleLogoClick = useCallback(() => {
    navigate({
      pathname: '/',
      search: '?intro=true',
    })
  }, [navigate])
  const isTouchDevice = useIsTouchDevice()

  return (
    <Popover ref={popoverRef} placement="bottom" hoverable stayInFrame allowFlip onOpenChange={setIsOpen}>
      <Popover.Trigger data-testid="nav-company-menu">
        <Flex
          row
          alignItems="center"
          gap="$gap4"
          p="$spacing8"
          cursor="pointer"
          group
          $platform-web={{ containerType: 'normal' }}
        >
          <Flex row alignItems="center" gap="$gap4" onPress={handleLogoClick} data-testid="nav-uniswap-logo">
            <NavIcon />
            {isLargeScreen && (
              <Text variant="subheading1" color="$accent1" userSelect="none">
                Uniswap
              </Text>
            )}
          </Flex>
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
