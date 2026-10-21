export type NetworkFilterSide = 'top' | 'bottom'
export type NetworkFilterAlign = 'start' | 'end'

export interface NetworkFilterOpenLayout {
  side: NetworkFilterSide
  align: NetworkFilterAlign
  maxHeight: number
}

interface ResolveNetworkFilterOpenLayoutParams {
  triggerRect: Pick<DOMRect, 'top' | 'bottom' | 'left' | 'right'>
  viewportHeight: number
  viewportWidth: number
  preferredMaxHeight: number
  menuWidth: number
  preferredAlign: NetworkFilterAlign
  offset: number
}

export function resolveNetworkFilterOpenLayout({
  triggerRect,
  viewportHeight,
  viewportWidth,
  preferredMaxHeight,
  menuWidth,
  preferredAlign,
  offset,
}: ResolveNetworkFilterOpenLayoutParams): NetworkFilterOpenLayout {
  const spaceBelow = viewportHeight - triggerRect.bottom - offset * 2
  const spaceAbove = triggerRect.top - offset * 2

  const side: NetworkFilterSide = preferredMaxHeight > spaceBelow && spaceAbove > spaceBelow ? 'top' : 'bottom'
  const maxHeight = Math.min(preferredMaxHeight, Math.max(0, side === 'top' ? spaceAbove : spaceBelow))

  let align = preferredAlign
  if (preferredAlign === 'start' && triggerRect.left + menuWidth > viewportWidth - offset) {
    align = 'end'
  } else if (preferredAlign === 'end' && triggerRect.right - menuWidth < offset) {
    align = 'start'
  }

  return { side, align, maxHeight }
}
