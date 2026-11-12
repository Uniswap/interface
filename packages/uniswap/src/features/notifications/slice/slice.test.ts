import { UniverseChainId } from '@universe/chains'
import {
  initialNotificationsState,
  notificationReducer,
  popNotification,
  pushNotification,
  setNotificationViewed,
} from 'uniswap/src/features/notifications/slice/slice'
import { AppNotificationType } from 'uniswap/src/features/notifications/slice/types'

const ACTIVE = '0x1111111111111111111111111111111111111111'
const OTHER = '0x2222222222222222222222222222222222222222'

const otherAccountNotification = {
  type: AppNotificationType.Default,
  address: OTHER,
  title: 'for the other account',
}
const pendingToast = { type: AppNotificationType.TransactionPending, chainId: UniverseChainId.Mainnet }

function queueWithOtherAccountFirst() {
  let state = notificationReducer(initialNotificationsState, pushNotification(otherAccountNotification as never))
  state = notificationReducer(state, pushNotification(pendingToast as never))
  return state
}

describe('popNotification', () => {
  it('removes the first notification the active account can see, including one with no address', () => {
    const state = notificationReducer(queueWithOtherAccountFirst(), popNotification({ address: ACTIVE }))
    expect(state.notificationQueue).toEqual([expect.objectContaining({ address: OTHER })])
  })

  it('leaves another account’s notification in place', () => {
    const state = notificationReducer(queueWithOtherAccountFirst(), popNotification({ address: ACTIVE }))
    expect(state.notificationQueue.some((notification) => notification.address === OTHER)).toBe(true)
  })

  it('still shifts the queue when no address is given', () => {
    const state = notificationReducer(queueWithOtherAccountFirst(), popNotification({ address: undefined }))
    expect(state.notificationQueue).toEqual([expect.objectContaining({ type: AppNotificationType.TransactionPending })])
  })
})

describe('setNotificationViewed', () => {
  it('marks the first notification the active account can see, not another account’s', () => {
    const state = notificationReducer(queueWithOtherAccountFirst(), setNotificationViewed({ address: ACTIVE }))
    expect(state.notificationQueue[0]?.shown).toBeUndefined()
    expect(state.notificationQueue[1]?.shown).toBe(true)
  })
})
