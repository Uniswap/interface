import { UTCTimestamp } from 'lightweight-charts'
import { ChartHeader } from '~/components/Charts/ChartHeader'
import { fireEvent, render } from '~/test-utils/render'

describe('ChartHeader', () => {
  it('holds its hovered size so swapping in the resting content cannot shrink it out from under the cursor', () => {
    const { container, rerender } = render(<ChartHeader value={1} time={1700000000 as UTCTimestamp} blocksChartHover />)
    const block = container.querySelector<HTMLElement>('#chart-header > *')!
    vi.spyOn(block, 'getBoundingClientRect').mockReturnValue({ width: 373, height: 74 } as DOMRect)

    fireEvent.pointerEnter(block)
    // The crosshair clears once the header catches the pointer.
    rerender(<ChartHeader value={1} blocksChartHover />)

    expect(block.outerHTML).toContain('373px')
    expect(block.outerHTML).toContain('74px')

    fireEvent.pointerLeave(block)

    expect(block.outerHTML).not.toContain('373px')
  })
})
