import { Tooltip as TamaguiTooltip, styled, withStaticProperties } from 'tamagui'

export type { TooltipProps } from 'tamagui'

const Content = styled(TamaguiTooltip.Content, {
  animation: 'quick',
  gap: '$spacing8',
  alignItems: 'center',
  backgroundColor: '$surface1',
  borderRadius: '$rounded16',
  justifyContent: 'center',
  maxWidth: 350,
  px: '$spacing24',
  py: '$spacing16',
  shadowColor: '$surface3',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.08,
  shadowRadius: '$spacing16',
  enterStyle: {
    y: -10,
    opacity: 0,
  },
  exitStyle: {
    y: -10,
    opacity: 0,
  },
})

const Arrow = styled(TamaguiTooltip.Arrow, {
  shadowColor: '$surface3',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.08,
  shadowRadius: '$spacing16',
  size: '$spacing16',
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
