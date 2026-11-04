import { AccountIcon } from 'uniswap/src/features/accounts/AccountIcon'
import { renderWithTheme } from 'uniswap/src/test/renderWithTheme'

vi.mock('uniswap/src/features/address/avatar', () => ({
  useAvatar: () => ({ avatar: undefined, loading: false }),
}))

const ADDRESS = '0x479732F25203641B3D2A6D596F5175f126486009'

describe(AccountIcon, () => {
  it('resizes the unicon when the size changes after the first render', () => {
    const { container, rerender } = renderWithTheme(<AccountIcon address={ADDRESS} size={48} />)
    rerender(<AccountIcon address={ADDRESS} size={24} />)

    const unicon = container.querySelector('svg')
    expect(unicon?.style.width).toBe('24px')
    expect(unicon?.style.height).toBe('24px')
  })

  it('fills its box while the box transitions between sizes', () => {
    const { container } = renderWithTheme(<AccountIcon address={ADDRESS} size={48} transition="width 0.2s ease" />)

    expect(container.querySelector('svg')?.classList.contains('size-full!')).toBe(true)
  })

  it('keeps the unicon at its own size without a transition', () => {
    const { container } = renderWithTheme(<AccountIcon address={ADDRESS} size={48} />)

    expect(container.querySelector('svg')?.classList.contains('size-full!')).toBe(false)
  })
})
