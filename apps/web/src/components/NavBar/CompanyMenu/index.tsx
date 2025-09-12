import { NavIcon } from 'components/Logo/NavIcon'
import { useCallback, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router'
import { Flex, Popover, Text, useMedia } from 'ui/src'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'

export function CompanyMenu() {
  const popoverRef = useRef<Popover>(null)
  const media = useMedia()
  const isLargeScreen = !media.xxl
  const location = useLocation()

  const closeMenu = useCallback(() => {
    popoverRef.current?.close()
  }, [popoverRef])
  useEffect(() => closeMenu(), [location, closeMenu])

  return (
    <Popover ref={popoverRef} placement="bottom" hoverable stayInFrame allowFlip>
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
                  JuiceSwap
                </Text>
              )}
            </Flex>
          </Link>
        </Flex>
      </Popover.Trigger>
    </Popover>
  )
}
