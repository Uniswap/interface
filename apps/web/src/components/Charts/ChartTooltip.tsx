import { Flex, styled } from 'ui/src'

export const ChartTooltip = styled(Flex, {
  alignItems: 'center',
  position: 'absolute',
  left: 0,
  top: 0,
  zIndex: '$tooltip',
  borderWidth: 0,
  borderStyle: 'solid',
  pointerEvents: 'none', // Prevent tooltip from interfering with mouse events
  variants: {
    includeBorder: {
      true: {
        backgroundColor: '$surface5',
        backdropFilter: 'blur(8px)',
        borderRadius: '$rounded8',
        borderColor: '$surface3',
        borderWidth: 1,
        p: '$spacing8',
      },
    },
  },
})
