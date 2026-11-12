import { Flex, TouchableArea } from '@universe/mycelium'
import type { MouseEvent, ReactNode } from 'react'
import { InfoTooltip } from 'uniswap/src/components/tooltip/InfoTooltip'

export function HookStatusTooltip({
  label,
  description,
  children,
  isolateInteraction = false,
}: {
  label: string
  description: ReactNode
  children: ReactNode
  isolateInteraction?: boolean
}): JSX.Element {
  function handleClick(event: MouseEvent<HTMLElement>): void {
    event.preventDefault()
    event.stopPropagation()
  }

  const tooltip = (
    <InfoTooltip
      title={label}
      text={description}
      placement="bottom"
      trigger={
        <TouchableArea tag="button" aria-label={label} minWidth={24} minHeight={24} centered borderRadius="$rounded4">
          {children}
        </TouchableArea>
      }
    />
  )

  // Let the tooltip trigger handle touch before isolating its click from the row.
  return isolateInteraction ? <Flex onClick={handleClick}>{tooltip}</Flex> : tooltip
}
