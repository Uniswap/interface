import type { FlexProps } from 'ui/src'

export const TOKEN_CARD_SPARKLINE_WIDTH = 64
export const TOKEN_CARD_SPARKLINE_HEIGHT_VERTICAL = 32
export const TOKEN_CARD_SPARKLINE_HEIGHT_HORIZONTAL = 40

export const tokenCardShellProps = {
  backgroundColor: '$surface1',
  borderColor: '$surface3',
  borderRadius: '$rounded16',
  borderWidth: '$spacing1',
  gap: '$spacing12',
  p: '$spacing12',
  flexShrink: 0,
} satisfies FlexProps

export const tokenCardHoverStyle: FlexProps['hoverStyle'] = { backgroundColor: '$surface1Hovered' }
