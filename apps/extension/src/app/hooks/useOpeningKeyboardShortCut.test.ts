import { State, useOpeningKeyboardShortCut } from 'src/app/hooks/useOpeningKeyboardShortCut'
import * as isAppleDeviceDep from 'src/app/utils/isAppleDevice'
import { act, renderHook } from 'src/test/test-utils'

jest.mock('src/app/utils/isAppleDevice', () => ({
  isAppleDevice: jest.fn(),
}))

const isAppleDevice = isAppleDeviceDep.isAppleDevice as jest.MockedFunction<typeof isAppleDeviceDep.isAppleDevice>

describe('useOpeningKeyboardShortCut', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should initialize with the correct keys for an Apple device', () => {
    isAppleDevice.mockReturnValue(true)
    const { result } = renderHook(() => useOpeningKeyboardShortCut(false))

    expect(result.current).toEqual([
      {
        fontSize: 28,
        px: '$spacing28',
        title: 'Shift',
        state: State.KeyUp,
      },
      {
        fontSize: 41,
        px: '$spacing16',
        title: 'Meta',
        state: State.KeyUp,
      },
      {
        fontSize: 41,
        px: '$spacing24',
        title: 'U',
        state: State.KeyUp,
      },
    ])
  })

  it('should initialize with the correct keys for a non-Apple device', () => {
    isAppleDevice.mockReturnValue(false)
    const { result } = renderHook(() => useOpeningKeyboardShortCut(false))

    expect(result.current).toEqual([
      {
        fontSize: 28,
        px: '$spacing28',
        title: 'Shift',
        state: State.KeyUp,
      },
      {
        fontSize: 28,
        px: '$spacing12',
        title: 'Ctrl',
        state: State.KeyUp,
      },
      {
        fontSize: 41,
        px: '$spacing24',
        title: 'U',
        state: State.KeyUp,
      },
    ])
  })

  it('should handle keyDown and keyUp events', () => {
    isAppleDevice.mockReturnValue(false)
    const { result } = renderHook(() => useOpeningKeyboardShortCut(false))

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Shift' }))
    })

    expect(result.current).toEqual([
      {
        fontSize: 28,
        px: '$spacing28',
        title: 'Shift',
        state: State.KeyDown,
      },
      {
        fontSize: 28,
        px: '$spacing12',
        title: 'Ctrl',
        state: State.KeyUp,
      },
      {
        fontSize: 41,
        px: '$spacing24',
        title: 'U',
        state: State.KeyUp,
      },
    ])

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keyup', { key: 'Shift' }))
    })

    expect(result.current).toEqual([
      {
        fontSize: 28,
        px: '$spacing28',
        title: 'Shift',
        state: State.KeyUp,
      },
      {
        fontSize: 28,
        px: '$spacing12',
        title: 'Ctrl',
        state: State.KeyUp,
      },
      {
        fontSize: 41,
        px: '$spacing24',
        title: 'U',
        state: State.KeyUp,
      },
    ])
  })

  it('should highlight keys when shortCutPressed is true', () => {
    isAppleDevice.mockReturnValue(false)
    const { result, rerender } = renderHook((props) => useOpeningKeyboardShortCut(props), {
      initialProps: false,
    })

    rerender(true)

    expect(result.current).toEqual([
      {
        fontSize: 28,
        px: '$spacing28',
        title: 'Shift',
        state: State.Highlighted,
      },
      {
        fontSize: 28,
        px: '$spacing12',
        title: 'Ctrl',
        state: State.Highlighted,
      },
      {
        fontSize: 41,
        px: '$spacing24',
        title: 'U',
        state: State.Highlighted,
      },
    ])
  })
})
