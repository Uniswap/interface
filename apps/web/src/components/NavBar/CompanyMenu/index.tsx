import { ArrowChangeDown } from 'components/Icons/ArrowChangeDown'
import { NavIcon } from 'components/Logo/NavIcon'
import { MenuDropdown } from 'components/NavBar/CompanyMenu/MenuDropdown'
import { MobileMenuDrawer } from 'components/NavBar/CompanyMenu/MobileMenuDrawer'
import { useIsMobileDrawer } from 'components/NavBar/ScreenSizes'
import styled from 'lib/styled-components'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Popover, Text, useIsTouchDevice, useMedia } from 'ui/src'
import { Hamburger } from 'ui/src/components/icons/Hamburger'

const ArrowDown = styled(ArrowChangeDown)<{ $isActive: boolean }>`
  height: 100%;
  color: ${({ $isActive, theme }) => ($isActive ? theme.neutral1 : theme.neutral2)};
`
const Trigger = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px;
  cursor: pointer;
  &:hover {
    ${ArrowDown} {
      color: ${({ theme }) => theme.neutral1} !important;
    }
  }
`
const UniIcon = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`

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
        <Trigger>
          <UniIcon onClick={handleLogoClick} data-testid="nav-uniswap-logo">
            <NavIcon />
            {isLargeScreen && (
              <Text variant="subheading1" color="$accent1" userSelect="none">
                Uniswap
              </Text>
            )}
          </UniIcon>
          {(media.md || isTouchDevice) && <Hamburger size={22} color="$neutral2" cursor="pointer" ml="16px" />}
          {!media.md && !isTouchDevice && <ArrowDown $isActive={isOpen} width="12px" height="12px" />}
        </Trigger>
      </Popover.Trigger>
      {isMobileDrawer ? <MobileMenuDrawer isOpen={isOpen} closeMenu={closeMenu} /> : <MenuDropdown close={closeMenu} />}
    </Popover>
  )
}
