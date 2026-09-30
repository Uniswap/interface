import { useIsTouchDevice } from '@universe/mycelium'
import { HoverCard } from '~/components/HoverCard/HoverCard'
import { mocked } from '~/test-utils/mocked'
import { render, screen } from '~/test-utils/render'

vi.mock('@universe/mycelium', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@universe/mycelium')>()),
  useIsTouchDevice: vi.fn(),
}))

describe('HoverCard', () => {
  beforeEach(() => {
    mocked(useIsTouchDevice).mockReturnValue(false)
  })

  it('leaves the wrapped child as the only button and tab stop', () => {
    const { container } = render(
      <HoverCard isOpen={false} content={<div>card</div>} onOpenChange={vi.fn()}>
        <button type="button">chip</button>
      </HoverCard>,
    )

    expect(screen.getAllByRole('button')).toHaveLength(1)
    const tabStops = Array.from(container.querySelectorAll<HTMLElement>('*')).filter((el) => el.tabIndex >= 0)
    expect(tabStops).toEqual([screen.getByRole('button', { name: 'chip' })])
  })
})
