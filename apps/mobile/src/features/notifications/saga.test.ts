import { OneSignal } from 'react-native-onesignal'
import { expectSaga } from 'redux-saga-test-plan'
import { select } from 'redux-saga/effects'
import { NotifSettingType } from 'src/features/notifications/constants'
import { pushNotificationsWatcherSaga } from 'src/features/notifications/saga'
import { selectAllPushNotificationSettings } from 'src/features/notifications/selectors'
import {
  initNotifsForNewUser,
  pushNotificationsReducer,
  resetPushNotifications,
  updateNotifSettings,
} from 'src/features/notifications/slice'
import { selectActiveAccountAddress, selectFinishedOnboarding } from 'wallet/src/features/wallet/selectors'

describe('pushNotificationsWatcherSaga', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('syncs the persisted price alerts opt-out on startup', async () => {
    await expectSaga(pushNotificationsWatcherSaga)
      .provide([
        [select(selectFinishedOnboarding), true],
        [select(selectActiveAccountAddress), '0xWallet'],
        [select(selectAllPushNotificationSettings), { generalUpdatesEnabled: true, priceAlertsEnabled: false }],
      ])
      .silentRun()

    expect(OneSignal.User.addTags).toHaveBeenCalledWith({
      [NotifSettingType.GeneralUpdates]: 'true',
      [NotifSettingType.PriceAlerts]: 'false',
    })
  })

  it('syncs a price alerts change while preserving the general updates preference', async () => {
    await expectSaga(pushNotificationsWatcherSaga)
      .provide([
        [select(selectFinishedOnboarding), true],
        [select(selectActiveAccountAddress), '0xWallet'],
      ])
      .withReducer(
        (state, action) => ({ pushNotifications: pushNotificationsReducer(state?.pushNotifications, action) }),
        { pushNotifications: { generalUpdatesEnabled: false, priceAlertsEnabled: true } },
      )
      .dispatch(updateNotifSettings({ [NotifSettingType.PriceAlerts]: false }))
      .silentRun()

    expect(OneSignal.User.addTags).toHaveBeenLastCalledWith({
      [NotifSettingType.GeneralUpdates]: 'false',
      [NotifSettingType.PriceAlerts]: 'false',
    })
  })

  it('initializes the price alerts tag for new users before onboarding finishes', async () => {
    await expectSaga(pushNotificationsWatcherSaga)
      .provide([
        [select(selectFinishedOnboarding), false],
        [select(selectActiveAccountAddress), '0xWallet'],
        [select(selectAllPushNotificationSettings), { generalUpdatesEnabled: true, priceAlertsEnabled: true }],
      ])
      .dispatch(initNotifsForNewUser())
      .silentRun()

    expect(OneSignal.User.addTags).toHaveBeenCalledTimes(1)
    expect(OneSignal.User.addTags).toHaveBeenCalledWith({
      [NotifSettingType.GeneralUpdates]: 'true',
      [NotifSettingType.PriceAlerts]: 'true',
    })
  })

  it('preserves the price alerts opt-out when onboarding another wallet', async () => {
    await expectSaga(pushNotificationsWatcherSaga)
      .provide([
        [select(selectFinishedOnboarding), true],
        [select(selectActiveAccountAddress), '0xWallet'],
      ])
      .withReducer(
        (state, action) => ({ pushNotifications: pushNotificationsReducer(state?.pushNotifications, action) }),
        { pushNotifications: { generalUpdatesEnabled: true, priceAlertsEnabled: false } },
      )
      .dispatch(initNotifsForNewUser())
      .hasFinalState({ pushNotifications: { generalUpdatesEnabled: true, priceAlertsEnabled: false } })
      .silentRun()

    expect(OneSignal.User.addTags).toHaveBeenLastCalledWith({
      [NotifSettingType.GeneralUpdates]: 'true',
      [NotifSettingType.PriceAlerts]: 'false',
    })
  })

  it('syncs notification defaults immediately when user settings are reset', async () => {
    await expectSaga(pushNotificationsWatcherSaga)
      .provide([
        [select(selectFinishedOnboarding), true],
        [select(selectActiveAccountAddress), '0xWallet'],
      ])
      .withReducer(
        (state, action) => ({ pushNotifications: pushNotificationsReducer(state?.pushNotifications, action) }),
        { pushNotifications: { generalUpdatesEnabled: false, priceAlertsEnabled: false } },
      )
      .dispatch(resetPushNotifications())
      .silentRun()

    expect(OneSignal.User.addTags).toHaveBeenLastCalledWith({
      [NotifSettingType.GeneralUpdates]: 'true',
      [NotifSettingType.PriceAlerts]: 'true',
    })
  })
})
