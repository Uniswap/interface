import { TestID } from '@universe/test'
import { fireGestureHandler, getByGestureTestId } from 'react-native-gesture-handler/jest-utils'
import { NotificationToastWrapper } from 'src/features/notifications/NotificationToastWrapper'
import { act, render, screen } from 'src/test/test-utils'
import { initialNotificationsState, pushNotification } from 'uniswap/src/features/notifications/slice/slice'
import { AppNotificationType } from 'uniswap/src/features/notifications/slice/types'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import { ACCOUNT, preloadedWalletPackageState } from 'wallet/src/test/fixtures'

const TITLE = 'Swipe me away'

vi.mock('uniswap/src/features/accounts/store/hooks', () => ({
  useActiveAddress: (): string => ACCOUNT.address,
}))

function renderToast(): { queueLength: () => number; queueNext: () => void } {
  const { store } = render(<NotificationToastWrapper />, {
    preloadedState: {
      ...preloadedWalletPackageState({ account: ACCOUNT }),
      notifications: {
        ...initialNotificationsState,
        notificationQueue: [{ type: AppNotificationType.Default, title: TITLE, address: ACCOUNT.address }],
      },
    },
  })
  return {
    queueLength: () => store.getState().notifications.notificationQueue.length,
    queueNext: () =>
      act(() => {
        store.dispatch(pushNotification({ type: AppNotificationType.Default, title: 'Next', address: ACCOUNT.address }))
      }),
  }
}

function swipe(translationY: number): void {
  fireGestureHandler(getByGestureTestId(TestID.NotificationToastSwipe), [{ translationY }])
}

type PanCallback = (event: { translationY?: number; velocityY?: number }, success?: boolean) => void
type RecordedPanGesture = { __config: { handlers: Partial<Record<'onStart' | 'onUpdate' | 'onEnd', PanCallback>> } }

// The vitest gesture mock records callbacks on __config; fireGestureHandler ends the gesture in the same
// tick, so a held drag drives them directly
function holdSwipe(translationY: number): { release: () => void } {
  const getHandlers = (): RecordedPanGesture['__config']['handlers'] =>
    (getByGestureTestId(TestID.NotificationToastSwipe) as unknown as RecordedPanGesture).__config.handlers
  act(() => {
    getHandlers().onStart?.({})
    getHandlers().onUpdate?.({ translationY })
  })
  return {
    release: () =>
      act(() => {
        getHandlers().onEnd?.({ velocityY: 0 }, true)
      }),
  }
}

function advanceTime(ms: number): void {
  act(() => {
    vi.advanceTimersByTime(ms)
  })
}

// Swipe distances are literals on purpose so a change to the dismiss threshold is caught here.
describe('NotificationToastWrapper swipe to dismiss', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('dismisses the toast when swiped up far enough', () => {
    const { queueLength } = renderToast()
    expect(screen.getByText(TITLE)).toBeTruthy()

    swipe(-48)
    advanceTime(ONE_SECOND_MS)

    expect(queueLength()).toBe(0)
  })

  it('keeps the toast and its auto-hide timer after a short swipe up', () => {
    const { queueLength } = renderToast()

    swipe(-16)
    advanceTime(ONE_SECOND_MS)
    expect(queueLength()).toBe(1)

    advanceTime(5 * ONE_SECOND_MS)
    expect(queueLength()).toBe(0)
  })

  it('keeps the next toast when one queues during a held swipe that then dismisses', () => {
    const { queueLength, queueNext } = renderToast()

    advanceTime(ONE_SECOND_MS)
    const { release } = holdSwipe(-48)
    queueNext()
    advanceTime(100)
    release()
    advanceTime(ONE_SECOND_MS)

    expect(queueLength()).toBe(1)
  })

  it('restarts auto-hide when a held swipe springs back', () => {
    const { queueLength } = renderToast()

    advanceTime(ONE_SECOND_MS)
    const { release } = holdSwipe(-16)
    advanceTime(6 * ONE_SECOND_MS)
    release()
    advanceTime(ONE_SECOND_MS)
    expect(queueLength()).toBe(1)

    advanceTime(5 * ONE_SECOND_MS)
    expect(queueLength()).toBe(0)
  })

  it('ignores a downward swipe', () => {
    const { queueLength } = renderToast()

    swipe(120)
    advanceTime(ONE_SECOND_MS)

    expect(queueLength()).toBe(1)
  })
})
