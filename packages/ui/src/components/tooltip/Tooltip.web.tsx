import { Tooltip as TamaguiTooltip, styled, withStaticProperties } from 'tamagui'
import { TooltipContentProps } from 'ui/src/components/tooltip/Tooltip'

export type { TooltipProps } from 'tamagui'

const ANIMATION_OFFSET = 4

const StyledContent = styled(TamaguiTooltip.Content)
const HigherOrderStyledContent = StyledContent.styleable<TooltipContentProps>((props, ref) => {
  const { animationDirection = 'top' } = props

  const animationStyles: {
    opacity: 0
    y?: number
    x?: number
  } = {
    opacity: 0,
  }

  switch (animationDirection) {
    case 'left':
      animationStyles.x = ANIMATION_OFFSET
      break
    case 'right':
      animationStyles.x = -ANIMATION_OFFSET
      break
    case 'top':
      animationStyles.y = ANIMATION_OFFSET
      break
    case 'bottom':
      animationStyles.y = -ANIMATION_OFFSET
      break
  }

  return <StyledContent ref={ref} enterStyle={animationStyles} exitStyle={animationStyles} {...props} />
})

const Content = styled(HigherOrderStyledContent, {
  animation: 'simple',
  gap: '$spacing8',
  alignItems: 'center',
  backgroundColor: '$surface1',
  borderRadius: '$rounded12',
  justifyContent: 'center',
  maxWidth: 350,
  px: '$spacing12',
  py: '$spacing12',
  borderWidth: 1,
  borderColor: '$surface3',
  '$theme-dark': {
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: '$none',
  },
  '$theme-light': {
    shadowColor: '$surface3',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: '$spacing12',
  },
})

const Arrow = styled(TamaguiTooltip.Arrow, {
  '$theme-dark': {
    borderWidth: 1,
    borderColor: '$surface2',
  },
  '$theme-light': {
    shadowColor: '$surface3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: '$spacing16',
  },
})

const TooltipRoot = styled(TamaguiTooltip, {
  offset: {
    mainAxis: 16,
  },
  delay: { close: 500, open: 0 },
  restMs: 200,
})

export const Tooltip = withStaticProperties(TooltipRoot, {
  Trigger: TamaguiTooltip.Trigger,
  Content,
  Arrow,
})
