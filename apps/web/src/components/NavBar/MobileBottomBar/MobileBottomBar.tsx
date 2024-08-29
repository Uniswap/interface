import { Z_INDEX } from 'theme/zIndex'
import { Flex, styled } from 'ui/src'

const MOBILE_BAR_MAX_HEIGHT = 100 // ensure that it's translated out of view on scroll

export const MobileBottomBar = styled(Flex, {
  zIndex: Z_INDEX.dropdown,
  position: 'fixed' as any,
  bottom: 0,
  right: 0,
  left: 0,
  justifyContent: 'space-between',
  gap: '$gap8',
  width: '100%',
  maxHeight: MOBILE_BAR_MAX_HEIGHT,
  backdropFilter: 'blur(4px)',
  mask: 'linear-gradient(to bottom, transparent, $surface1 15%)',
  py: '$padding12',
  px: '$padding16',
  animation: 'lazy',
  display: 'none',
  $xl: {
    display: 'block',
  },
  variants: {
    hide: {
      true: {
        bottom: `-${MOBILE_BAR_MAX_HEIGHT}px !important`,
      },
      false: {
        bottom: 0,
      },
    },
  } as const,
})
