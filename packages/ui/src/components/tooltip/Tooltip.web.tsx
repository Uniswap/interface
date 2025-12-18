import { AdaptParent } from '@tamagui/adapt'
import { useEffect, useId } from 'react'
import { styled, Tooltip as TamaguiTooltip, withStaticProperties } from 'tamagui'
import { TooltipContentProps } from 'ui/src/components/tooltip/Tooltip'
import { useEvent } from 'utilities/src/react/hooks'
import { useBooleanState } from 'utilities/src/react/useBooleanState'

export type { TooltipProps } from 'tamagui'

const ANIMATION_OFFSET = 4

const StyledContent = styled(TamaguiTooltip.Content)
StyledContent.displayName = 'StyledContent'

const HigherOrderStyledContent = StyledContent.styleable<TooltipContentProps>((props) => {
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

  return <StyledContent enterStyle={animationStyles} exitStyle={animationStyles} {...props} />
})

HigherOrderStyledContent.displayName = 'HigherOrderStyledContent'

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

Content.displayName = 'Content'

const Arrow = styled(TamaguiTooltip.Arrow, {
  size: '$spacing12',
  backgroundColor: '$surface1',
  borderWidth: 1,
  borderColor: '$surface3',
  '$theme-light': {
    shadowColor: '$surface3',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: '$spacing8',
  },
})

Arrow.displayName = 'Arrow'

const TooltipRoot = styled(TamaguiTooltip, {
  offset: {
    mainAxis: 16,
  },
  delay: { close: 500, open: 0 },
  restMs: 200,
})

TooltipRoot.displayName = 'TooltipRoot'

function TooltipBase(props: React.ComponentProps<typeof TamaguiTooltip>): JSX.Element {
  const { open: openProp, onOpenChange, ...rest } = props

  const isControlled = openProp !== undefined
  const { value: isOpenInternal, setValue: setIsOpenInternal } = useBooleanState(openProp ?? false)

  const currentOpen = isControlled ? openProp : isOpenInternal

  // Generate a unique scope to isolate this tooltip from parent Adapt contexts (e.g., AdaptiveWebModal).
  // Without this, when rendered inside a component using Adapt (like a bottom sheet modal),
  // the tooltip content gets captured by the parent's Adapt and renders as sheet content instead of floating.
  const tooltipAdaptScope = `TooltipIsolated${useId()}`

  useEffect(() => {
    if (isControlled) {
      setIsOpenInternal(openProp)
    }
  }, [isControlled, setIsOpenInternal, openProp])

  const handleOpenChange = useEvent((nextOpen: boolean) => {
    if (!isControlled) {
      setIsOpenInternal(nextOpen)
    }
    onOpenChange?.(nextOpen)
  })

  return (
    <AdaptParent scope={tooltipAdaptScope}>
      <TooltipRoot open={currentOpen} onOpenChange={handleOpenChange} {...rest} />
    </AdaptParent>
  )
}

export const Tooltip = withStaticProperties(TooltipBase, {
  Trigger: TamaguiTooltip.Trigger,
  Content,
  Arrow,
})
