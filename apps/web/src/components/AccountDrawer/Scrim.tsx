import { deprecatedStyled } from 'lib/styled-components'
import { useEffect } from 'react'
import { Z_INDEX } from 'theme/zIndex'
import { useDeviceDimensions } from 'ui/src/hooks/useDeviceDimensions'
import { breakpoints } from 'ui/src/theme'

// TODO(WEB-6717): Replace with Tamagui Overlay
const ScrimBackground = deprecatedStyled.div<{ $open: boolean; $maxWidth?: number; $zIndex?: number }>`
  z-index: ${({ $zIndex }) => $zIndex ?? Z_INDEX.modalBackdrop};
  overflow: hidden;
  top: 0;
  left: 0;
  position: fixed;
  width: 100%;
  height: 100%;
  background-color: ${({ theme }) => theme.scrim};

  opacity: 0;
  pointer-events: none;
  @media only screen and (max-width: ${({ theme, $maxWidth }) => `${$maxWidth ?? theme.breakpoint.md}px`}) {
    opacity: ${({ $open }) => ($open ? 1 : 0)};
    pointer-events: ${({ $open }) => ($open ? 'auto' : 'none')};
    transition: opacity ${({ theme }) => theme.transition.duration.medium} ease-in-out;
  }
`

interface ScrimBackgroundProps extends React.ComponentPropsWithRef<'div'> {
  $open: boolean
  $maxWidth?: number
  $zIndex?: number
}

export const Scrim = (props: ScrimBackgroundProps) => {
  const { fullWidth: width } = useDeviceDimensions()

  useEffect(() => {
    if (width && width < breakpoints.md && props.$open) {
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.body.style.overflow = 'visible'
    }
  }, [props.$open, width])

  return <ScrimBackground {...props} />
}
