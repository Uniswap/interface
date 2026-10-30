import type { BottomSheetFooterProps } from '@gorhom/bottom-sheet'
import { renderHook } from '@testing-library/react'
import type { ComponentType, ReactElement, ReactNode } from 'react'
import type { UseBottomInsetCoverFooterParams } from 'uniswap/src/components/modals/useBottomInsetCoverFooter'
import {
  BOTTOM_INSET_COVER_TEST_ID,
  BottomInsetCover,
  useBottomInsetCoverFooter,
} from 'uniswap/src/components/modals/useBottomInsetCoverFooter.native'
import { render } from 'uniswap/src/test/test-utils'

const platform = vi.hoisted(() => ({ isAndroid: true }))
const insets = vi.hoisted(() => ({ top: 0, right: 0, bottom: 48, left: 0 }))

vi.mock('@universe/environment', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@universe/environment')>()
  return {
    ...actual,
    get isAndroid(): boolean {
      return platform.isAndroid
    },
  }
})

vi.mock('uniswap/src/hooks/useAppInsets', () => ({
  useAppInsets: () => insets,
}))

vi.mock('@gorhom/bottom-sheet', async () => {
  const { View } = (await import('react-native')) as unknown as { View: ComponentType<{ children?: ReactNode }> }
  return {
    BottomSheetFooter: View,
    KEYBOARD_STATUS: { UNDETERMINED: 0, SHOWN: 1, HIDDEN: 2 },
    useBottomSheetInternal: () => ({ animatedKeyboardState: { get: () => ({ status: 0 }) } }),
  }
})

const footerArgs = { animatedFooterPosition: { value: 0 } } as unknown as BottomSheetFooterProps

const optedIn: UseBottomInsetCoverFooterParams = {
  renderBehindBottomInset: true,
  coverBottomInsetOnAndroid: true,
  backgroundColor: '#123456',
}

function footerFor(params: UseBottomInsetCoverFooterParams): UseBottomInsetCoverFooterParams['footerComponent'] {
  return renderHook(() => useBottomInsetCoverFooter(params)).result.current
}

describe('useBottomInsetCoverFooter (native)', () => {
  beforeEach(() => {
    platform.isAndroid = true
    insets.bottom = 48
  })

  // jsdom drops the animated style, so size and color are asserted on the element the sheet renders.
  it('covers the bottom inset with a strip of the sheet background on Android', () => {
    const cover = footerFor(optedIn)?.(footerArgs) as ReactElement<{ height: number; backgroundColor: string }>

    expect(cover.type).toBe(BottomInsetCover)
    // Literal values on purpose: they must not be derived from the mocks above.
    expect(cover.props).toMatchObject({ height: 48, backgroundColor: '#123456' })
  })

  it('renders the cover inside the sheet footer', () => {
    const { getByTestId } = render(<BottomInsetCover {...footerArgs} height={48} backgroundColor="#123456" />)

    expect(getByTestId(BOTTOM_INSET_COVER_TEST_ID)).toBeTruthy()
  })

  it('returns no footer on iOS, where content behind the home indicator is intended', () => {
    platform.isAndroid = false

    expect(footerFor(optedIn)).toBeUndefined()
  })

  it('returns no footer unless the sheet both opts in and renders behind the bottom inset', () => {
    expect(footerFor({ ...optedIn, coverBottomInsetOnAndroid: false })).toBeUndefined()
    expect(footerFor({ ...optedIn, renderBehindBottomInset: false })).toBeUndefined()
  })

  it('returns no footer when there is no bottom inset', () => {
    insets.bottom = 0

    expect(footerFor(optedIn)).toBeUndefined()
  })

  it("keeps the caller's own footer", () => {
    const callerFooter = vi.fn()

    expect(footerFor({ ...optedIn, footerComponent: callerFooter })).toBe(callerFooter)
  })
})
