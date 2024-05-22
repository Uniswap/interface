import { LoadingRow } from 'components/Loader/styled'
import { RowBetween } from 'components/Row'
import { MouseoverTooltip, TooltipSize } from 'components/Tooltip'
import useHoverProps from 'hooks/useHoverProps'
import { useIsMobile } from 'nft/hooks'
import { PropsWithChildren } from 'react'
import styled from 'styled-components'
import { ThemedText } from 'theme/components'

export type LineItemData = {
  Label: React.FC
  Value: React.FC
  TooltipBody?: React.FC
  tooltipSize?: TooltipSize
  loaderWidth?: number
}

const LabelText = styled(ThemedText.BodySmall)<{ hasTooltip?: boolean }>`
  cursor: ${({ hasTooltip }) => (hasTooltip ? 'help' : 'auto')};
  color: ${({ theme }) => theme.neutral2};
`

const DetailRowValue = styled(ThemedText.BodySmall)`
  text-align: right;
  overflow-wrap: break-word;
`

type ValueWrapperProps = PropsWithChildren<{
  lineItem: LineItemData
  labelHovered: boolean
  syncing: boolean
}>

function ValueWrapper({ children, lineItem, labelHovered, syncing }: ValueWrapperProps) {
  const { TooltipBody, tooltipSize, loaderWidth } = lineItem
  const isMobile = useIsMobile()

  if (syncing) return <LoadingRow data-testid="loading-row" height={15} width={loaderWidth ?? 50} />

  if (!TooltipBody) return <DetailRowValue>{children}</DetailRowValue>

  return (
    <MouseoverTooltip
      placement={isMobile ? 'auto' : 'right'}
      forceShow={labelHovered} // displays tooltip when hovering either both label or value
      size={tooltipSize}
      text={
        <ThemedText.Caption color="neutral2">
          <TooltipBody />
        </ThemedText.Caption>
      }
    >
      <DetailRowValue>{children}</DetailRowValue>
    </MouseoverTooltip>
  )
}

export function DetailLineItem({ LineItem, syncing }: { LineItem: LineItemData; syncing?: boolean }) {
  const [labelHovered, hoverProps] = useHoverProps()
  return (
    <RowBetween>
      <LabelText {...hoverProps} hasTooltip={!!LineItem.TooltipBody} data-testid="swap-li-label">
        <LineItem.Label />
      </LabelText>
      <ValueWrapper lineItem={LineItem} labelHovered={labelHovered} syncing={syncing ?? false}>
        <LineItem.Value />
      </ValueWrapper>
    </RowBetween>
  )
}
