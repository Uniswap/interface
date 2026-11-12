import { act, render } from '@testing-library/react'
import { MemoryRouter, type NavigateFunction, useNavigate } from 'react-router'
import { ResetPageScrollEffect } from '~/app/bootstrap/ResetPageScroll'

const PORTFOLIO = '/portfolio/0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'

let navigate: NavigateFunction

function CaptureNavigate(): null {
  navigate = useNavigate()
  return null
}

function renderAt(initialPath: string): void {
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <ResetPageScrollEffect />
      <CaptureNavigate />
    </MemoryRouter>,
  )
}

describe('ResetPageScrollEffect', () => {
  let scrollTo: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined)
  })

  afterEach(() => {
    scrollTo.mockRestore()
  })

  it('resets scroll when the Portfolio chain filter changes', () => {
    renderAt(`${PORTFOLIO}/activity`)

    act(() => {
      void navigate(`${PORTFOLIO}/activity?chain=base`)
    })

    expect(scrollTo).toHaveBeenCalledWith(0, 0)
  })

  it('keeps scroll when switching Portfolio tabs under the same chain filter', () => {
    renderAt(`${PORTFOLIO}/activity?chain=base`)

    act(() => {
      void navigate(`${PORTFOLIO}/nfts?chain=base`)
    })

    expect(scrollTo).not.toHaveBeenCalled()
  })
})
