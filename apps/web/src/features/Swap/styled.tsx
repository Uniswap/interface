import { Flex, styled } from 'ui/src'

export const PAGE_WRAPPER_MAX_WIDTH = 480

export const PageWrapper = styled(Flex, {
  pt: '$spacing60',
  px: '$spacing8',
  pb: '$spacing40',
  $lg: {
    pt: '$spacing48',
  },
  $md: {
    pt: '$spacing20',
  },
})

export const SwapModuleWrapper = styled(Flex, {
  width: PAGE_WRAPPER_MAX_WIDTH,
})

export const ArrowWrapper = styled(Flex, {
  display: 'flex',
  borderRadius: '$rounded12',
  height: 40,
  width: 40,
  position: 'relative',
  mt: -18,
  mb: -18,
  ml: 'auto',
  mr: 'auto',
  backgroundColor: '$surface2',
  borderWidth: '$spacing4',
  borderStyle: 'solid',
  borderColor: '$surface1',
  zIndex: 2,

  variants: {
    clickable: {
      true: {
        hoverStyle: {
          cursor: 'pointer',
          opacity: 0.8,
        },
      },
    },
  },
})

export const SwapSection = styled(Flex, {
  backgroundColor: '$surface2',
  borderRadius: '$rounded16',
  height: '120px',
  p: '$spacing16',
  position: 'relative',
  borderStyle: 'solid',
  borderWidth: '$spacing1',
  borderColor: '$surface2',

  hoverStyle: {
    borderColor: '$surface2Hovered',
  },

  focusWithinStyle: {
    borderColor: '$surface3',
  },
})

export const ArrowContainer = styled(Flex, {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '100%',
  height: '100%',
})
