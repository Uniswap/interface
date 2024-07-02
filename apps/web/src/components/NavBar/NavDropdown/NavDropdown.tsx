import { ScrollBarStyles } from 'components/Common'
import { NAV_BREAKPOINT } from 'components/NavBar/ScreenSizes'
import Row from 'components/Row'
import { ReactNode, RefObject } from 'react'
import styled from 'styled-components'
import { Popover } from 'ui/src'

const NavDropdownContent = styled.div<{ $width?: number }>`
  border-radius: 16px;
  border: 1px solid ${({ theme }) => theme.surface3};
  background: ${({ theme }) => theme.surface1};
  ${({ theme }) => !theme.darkMode && `box-shadow: 3px 3px 10px ${theme.surface3}`};
  ${({ $width }) => $width && `width: ${$width}px;`}
  max-height: calc(100vh - ${({ theme }) => theme.navHeight}px);
  overflow: auto;
  ${ScrollBarStyles}

  @media screen and (max-width: ${NAV_BREAKPOINT.isMobileDrawer}px) {
    width: 100%;
    border-radius: 0;
    border: none;
    box-shadow: none;
    overflowx: auto;
    max-height: calc(100vh - ${({ theme }) => theme.navHeight + 12}px);
    ${ScrollBarStyles}
    ::-webkit-scrollbar-track {
      margin-top: 40px;
    }
  }
`

interface NavDropdownProps {
  children: ReactNode
  width?: number
  dropdownRef?: RefObject<HTMLDivElement>
}

export function NavDropdown({ children, width, dropdownRef }: NavDropdownProps) {
  return (
    <>
      <Popover.Content
        backgroundColor="transparent"
        enterStyle={{ scale: 0.95, opacity: 0 }}
        exitStyle={{ scale: 0.95, opacity: 0 }}
        width={width}
        elevate
        animation={[
          'quicker',
          {
            opacity: {
              overshootClamping: true,
            },
          },
        ]}
      >
        <Popover.Arrow />
        <NavDropdownContent ref={dropdownRef} $width={width}>
          {children}
        </NavDropdownContent>
      </Popover.Content>
      <Popover.Adapt when="sm">
        <Popover.Sheet animation="200ms" snapPointsMode="fit" modal dismissOnSnapToBottom dismissOnOverlayPress>
          <Popover.Sheet.Overlay
            opacity={0.2}
            animation="quick"
            enterStyle={{ opacity: 0 }}
            exitStyle={{ opacity: 0 }}
            backgroundColor="$scrim"
            style={{ backdropFilter: 'blur(4px)' }}
          />
          <Popover.Sheet.Frame style={{ borderRadius: `16px 16px 0 0` }}>
            <Popover.Sheet.ScrollView>
              <Row width="full" justify="center" mt={2}>
                <Popover.Sheet.Handle width={32} height={4} backgroundColor="$surface3" />
              </Row>
              <Popover.Adapt.Contents />
            </Popover.Sheet.ScrollView>
          </Popover.Sheet.Frame>
        </Popover.Sheet>
      </Popover.Adapt>
    </>
  )
}
