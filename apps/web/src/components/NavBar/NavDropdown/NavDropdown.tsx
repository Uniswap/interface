import { Flex, type FlexCompatProps } from '@universe/mycelium'
import { useScrollbarStyles } from '@universe/mycelium/theme-hooks-compat'
import { forwardRef, ReactNode, RefObject } from 'react'
import { Popover, WebBottomSheet } from 'ui/src'
import { INTERFACE_NAV_HEIGHT, zIndexes } from 'ui/src/theme'
import { MWEB_BOTTOM_INSET } from '~/utils/mwebBottomInset'

type NavDropdownContentProps = FlexCompatProps & { padded?: boolean }

const NavDropdownContent = forwardRef<HTMLDivElement, NavDropdownContentProps>(function NavDropdownContent(
  { padded, '$platform-web': platformWeb, ...rest },
  ref,
) {
  return (
    <Flex
      ref={ref}
      borderRadius="$rounded16"
      borderWidth={1}
      borderStyle="solid"
      backgroundColor="$surface1"
      maxHeight={`calc(100dvh - ${INTERFACE_NAV_HEIGHT + 20}px)`}
      $sm={{
        width: '100%',
        borderRadius: '$none',
        borderWidth: 0,
        shadowColor: '$transparent',
        maxHeight: `calc(100dvh - ${INTERFACE_NAV_HEIGHT}px - ${MWEB_BOTTOM_INSET})`,
      }}
      // Replace-not-merge is deliberate, and differs from the plain spread used for the same
      // problem in MobileBottomBar. react-native-web normalizes an `overflow` shorthand into both
      // longhands before the style merge, so under Tamagui a caller's `overflow` overwrote these
      // axis defaults outright (measured: the legacy element carried `overflow-x: auto`, with no
      // `hidden` rule emitted). Merging instead would leave `overflow-auto` and
      // `[overflow-x:hidden]` in different tailwind-merge groups, letting the default win.
      // The sole caller below always passes `overflow`, so the defaults branch is currently
      // unreachable — it exists for future callers that don't.
      $platform-web={
        platformWeb?.overflow === undefined ? { overflowY: 'auto', overflowX: 'hidden', ...platformWeb } : platformWeb
      }
      // The legacy `padded` variant table's `false` branch was empty, so `false` is a no-op.
      {...(padded
        ? // Smaller right padding allows scrollbar to be closer to container edge
          { pt: 8, pb: 12, pl: 16, pr: 4 }
        : {})}
      {...rest}
    />
  )
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
  borderColor?: FlexCompatProps['borderColor']
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
