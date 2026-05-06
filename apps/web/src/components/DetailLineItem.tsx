import { PropsWithChildren } from 'react'
import { Flex, styled, Text } from 'ui/src'
import { LoadingRow } from '~/components/Loader/styled'
import { MouseoverTooltip, TooltipSize } from '~/components/Tooltip'
import { useIsMobile } from '~/hooks/screenSize/useIsMobile'
import useHoverProps from '~/hooks/useHoverProps'

export type LineItemData = {
  Label: React.FC
  Value: React.FC
  TooltipBody?: React.FC
  tooltipSize?: TooltipSize
  loaderWidth?: number
}

const LabelText = styled(Text, {
  variant: 'body3',
  color: '$neutral2',
  userSelect: 'text',

  variants: {
    hasTooltip: {
      true: { cursor: 'help' },
      false: { cursor: 'auto' },
    },
  } as const,
})

const DetailRowValue = styled(Text, {
  variant: 'body3',
  color: '$neutral1',
  textAlign: 'right',
})

type ValueWrapperProps = PropsWithChildren<{
  lineItem: LineItemData
  labelHovered: boolean
  syncing: boolean
}>

function ValueWrapper({ children, lineItem, labelHovered, syncing }: ValueWrapperProps) {
  const { TooltipBody, tooltipSize, loaderWidth } = lineItem
  const isMobile = useIsMobile()

  if (syncing) {
    return <LoadingRow data-testid="loading-row" height={15} width={loaderWidth ?? 50} />
  }

  if (!TooltipBody) {
    return <DetailRowValue>{children}</DetailRowValue>
  }

  return (
    <MouseoverTooltip
      placement={isMobile ? 'auto' : 'right'}
      forceShow={labelHovered} // displays tooltip when hovering either both label or value
      size={tooltipSize}
      text={
        <Text variant="body4" color="$neutral2">
          <TooltipBody />
        </Text>
      }
    >
      <DetailRowValue>{children}</DetailRowValue>
    </MouseoverTooltip>
  )
}

export function DetailLineItem({ LineItem, syncing }: { LineItem: LineItemData; syncing?: boolean }) {
  const [labelHovered, hoverProps] = useHoverProps()

  return (
    <Flex row alignItems="center" justifyContent="space-between" width="100%">
      <LabelText {...hoverProps} hasTooltip={!!LineItem.TooltipBody} data-testid="swap-li-label">
        <LineItem.Label />
      </LabelText>
      <ValueWrapper lineItem={LineItem} labelHovered={labelHovered} syncing={syncing ?? false}>
        <LineItem.Value />
      </ValueWrapper>
    </Flex>
  )
}
