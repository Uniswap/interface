import { Action } from '@reduxjs/toolkit'
import { NativeEventEmitter, NativeModules } from 'react-native'
import { eventChannel } from 'redux-saga'
import { foundCloudBackup } from 'src/features/CloudBackup/cloudBackupSlice'
import { ICloudBackupsManagerEventType, ICloudMnemonicBackup } from 'src/features/CloudBackup/types'
import { logger } from 'src/utils/logger'
import { call, fork, put, take } from 'typed-redux-saga'

function createICloudBackupManagerChannel(eventEmitter: NativeEventEmitter) {
  return eventChannel<Action>((emit) => {
    const foundCloudBackupHandler = (backup: ICloudMnemonicBackup) => {
      logger.debug('iCloudBackupSaga', 'foundCloudBackupHandler', 'Found account backup', backup)
      emit(foundCloudBackup({ backup }))
    }

    const eventEmitters = [
      {
        type: ICloudBackupsManagerEventType.FoundCloudBackup,
        handler: foundCloudBackupHandler,
      },
    ]

    for (const { type, handler } of eventEmitters) {
      eventEmitter.addListener(type, handler)
    }

    const unsubscribe = () => {
      for (const { type } of eventEmitters) {
        eventEmitter.removeAllListeners(type)
      }
    }

    return unsubscribe
  })
}

export function* cloudBackupsManagerSaga() {
  yield* fork(watchICloudBackupEvents)
}

export function* watchICloudBackupEvents() {
  const iCloudManagerEvents = new NativeEventEmitter(NativeModules.RNICloudBackupsManager)
  const channel = yield* call(createICloudBackupManagerChannel, iCloudManagerEvents)

  while (true) {
    try {
      const payload = yield* take(channel)
      yield* put(payload)
    } catch (err) {
      logger.error('CloudBackupsManagerSaga', 'watchICloudBackupEvents', 'channel error: ', err)
    }
  }
}
