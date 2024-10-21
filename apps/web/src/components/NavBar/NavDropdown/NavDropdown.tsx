import { ReactNode, RefObject } from 'react'
import { Flex, Popover, WebBottomSheet, styled, useScrollbarStyles, useShadowPropsMedium } from 'ui/src'
import { INTERFACE_NAV_HEIGHT } from 'uniswap/src/theme/heights'

const NavDropdownContent = styled(Flex, {
  borderRadius: '$rounded16',
  borderWidth: 1,
  borderStyle: 'solid',
  borderColor: '$surface2',
  backgroundColor: '$surface1',
  maxHeight: `calc(100dvh - ${INTERFACE_NAV_HEIGHT * 2}px)`,
  $sm: {
    width: '100%',
    borderRadius: '$none',
    borderWidth: 0,
    shadowColor: '$transparent',
    maxHeight: `calc(100dvh - ${INTERFACE_NAV_HEIGHT}px)`,
  },
  '$platform-web': {
    overflowY: 'auto',
    overflowX: 'hidden',
  },
})

interface NavDropdownProps {
  children: ReactNode
  isOpen: boolean
  width?: number
  dropdownRef?: RefObject<HTMLDivElement>
  dataTestId?: string
}

export function NavDropdown({ children, width, dropdownRef, isOpen, dataTestId }: NavDropdownProps) {
  const shadowProps = useShadowPropsMedium()
  const scrollbarStyles = useScrollbarStyles()

  return (
    <>
      <Popover.Content
        backgroundColor="transparent"
        enterStyle={{ scale: 0.95, opacity: 0 }}
        exitStyle={{ scale: 0.95, opacity: 0 }}
        width={width}
        elevate
        animation={[
          'fast',
          {
            opacity: {
              overshootClamping: true,
            },
          },
        ]}
        data-testid={dataTestId}
      >
        <Popover.Arrow />
        <NavDropdownContent
          data-testid={dataTestId}
          ref={dropdownRef}
          width={width}
          {...shadowProps}
          style={scrollbarStyles}
        >
          {children}
        </NavDropdownContent>
      </Popover.Content>
      <Popover.Adapt when="sm">
        <WebBottomSheet isOpen={isOpen} p={0}>
          <Popover.Sheet.ScrollView>
            <Popover.Adapt.Contents />
          </Popover.Sheet.ScrollView>
        </WebBottomSheet>
      </Popover.Adapt>
    </>
  )
}
