import { ReactNode, RefObject } from 'react'
import { Flex, FlexProps, Popover, styled, useScrollbarStyles, useShadowPropsMedium, WebBottomSheet } from 'ui/src'
import { INTERFACE_NAV_HEIGHT, zIndexes } from 'ui/src/theme'

const NavDropdownContent = styled(Flex, {
  borderRadius: '$rounded16',
  borderWidth: 1,
  borderStyle: 'solid',
  boxShadow: '$shadow.1',
  backgroundColor: '$surface1',
  maxHeight: `calc(100dvh - ${INTERFACE_NAV_HEIGHT + 20}px)`,
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
  variants: {
    padded: {
      true: {
        py: '12px',
        pl: '16px',
        pr: '4px', // Smaller right padding allows scrollbar to be closer to container edge
      },
      false: {},
    },
  },
})

interface NavDropdownProps {
  children: ReactNode
  isOpen: boolean
  width?: number
  minWidth?: number
  dropdownRef?: RefObject<HTMLDivElement | null>
  dataTestId?: string
  padded?: boolean
  mr?: number
  borderColor?: FlexProps['borderColor']
}

export function NavDropdown({
  children,
  width,
  minWidth,
  dropdownRef,
  isOpen,
  padded,
  dataTestId,
  mr = 0,
  borderColor = '$surface2',
}: NavDropdownProps) {
  const shadowProps = useShadowPropsMedium()
  const scrollbarStyles = useScrollbarStyles()

  return (
    <>
      <Popover.Content
        zIndex={zIndexes.popover}
        backgroundColor="transparent"
        enterStyle={{ scale: 0.95, opacity: 0 }}
        exitStyle={{ scale: 0.95, opacity: 0 }}
        width={width}
        minWidth={minWidth}
        mr={mr}
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
          minWidth={minWidth}
          padded={padded}
          borderColor={borderColor}
          {...shadowProps}
          $platform-web={{ overflow: 'auto' }}
          style={scrollbarStyles}
        >
          {children}
        </NavDropdownContent>
      </Popover.Content>
      <Popover.Adapt when="sm">
        <WebBottomSheet isOpen={isOpen} p={0}>
          <Popover.Adapt.Contents />
        </WebBottomSheet>
      </Popover.Adapt>
    </>
  )
}
