import { ReactNode } from 'react'
import { Flex, styled as TamaguiStyled, Text } from 'ui/src'
import { AlertTriangleFilled } from 'ui/src/components/icons/AlertTriangleFilled'

export const PAGE_WRAPPER_MAX_WIDTH = 480

export const PageWrapper = TamaguiStyled(Flex, {
  pt: '$spacing16',
  px: '$spacing5', // gives better spacing for full width
  pb: '$spacing40',
  width: '100%',
  height: '100%',
  maxWidth: '100%', // previously 480
  flex: 1,
  alignSelf: 'stretch',

  $lg: {
    pt: '$spacing48',
  },
  $md: {
    pt: '$spacing20',
  },
})

export const ArrowWrapper = TamaguiStyled(Flex, {
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

// styles
const dotsKeyframe = `
  @keyframes ellipsis {
    0% {
      content: '.';
    }
    33% {
      content: '..';
    }
    66% {
      content: '...';
    }
  }
    `

const DotsComponent = TamaguiStyled(Flex, {
  display: 'inline',
  className: 'dots-animation',
})

export const Dots = ({ children }: { children: ReactNode }) => {
  return (
    <>
      <style>{`
      ${dotsKeyframe}
      .dots-animation::after {
        display: inline-block;
        animation: ellipsis 1.25s infinite;
        content: '.';
        width: 1em;
        text-align: left;
      }`}</style>
      <DotsComponent>{children}</DotsComponent>
    </>
  )
}

const SwapCallbackErrorInner = TamaguiStyled(Flex, {
  flexDirection: 'row',
  backgroundColor: '$statusCritical2',
  borderRadius: '$rounded12',
  alignItems: 'center',
  mt: -32,
  width: '100%',
  zIndex: -1,
  pt: 48,
  pr: 20,
  pb: 16,
  pl: 16,
})

const SwapCallbackErrorInnerAlertTriangle = TamaguiStyled(Flex, {
  backgroundColor: '$statusCritical2',
  alignItems: 'center',
  justifyContent: 'center',
  marginRight: 12,
  borderRadius: '$rounded12',
  minWidth: 48,
  height: 48,
})

export function SwapCallbackError({ error }: { error: ReactNode }) {
  return (
    <SwapCallbackErrorInner>
      <SwapCallbackErrorInnerAlertTriangle>
        <AlertTriangleFilled size={24} color="$statusCritical" />
      </SwapCallbackErrorInnerAlertTriangle>
      <Text variant="body4" color="$statusCritical" $platform-web={{ wordBreak: 'break-word' }}>
        {error}
      </Text>
    </SwapCallbackErrorInner>
  )
}

export const SwapShowAcceptChanges = TamaguiStyled(Flex, {
  backgroundColor: '$accent2',
  p: '$spacing12',
  borderRadius: '$rounded12',
})

export const SwapSection = TamaguiStyled(Flex, {
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

export const ArrowContainer = TamaguiStyled(Flex, {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '100%',
  height: '100%',
})
