import { Action } from '@reduxjs/toolkit'
import { NativeEventEmitter, NativeModule, NativeModules } from 'react-native'
import { eventChannel } from 'redux-saga'
import { foundCloudBackup } from 'src/features/CloudBackup/cloudBackupSlice'
import { ICloudBackupsManagerEventType, ICloudMnemonicBackup } from 'src/features/CloudBackup/types'
import { call, fork, put, take } from 'typed-redux-saga'
import { serializeError } from 'utilities/src/errors'
import { logger } from 'utilities/src/logger/logger'

function createICloudBackupManagerChannel(eventEmitter: NativeEventEmitter) {
  return eventChannel<Action>((emit) => {
    const foundCloudBackupHandler = (backup: ICloudMnemonicBackup): void => {
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

    const unsubscribe = (): void => {
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
  const iCloudManagerEvents = new NativeEventEmitter(
    NativeModules.RNICloudBackupsManager as unknown as NativeModule
  )
  const channel = yield* call(createICloudBackupManagerChannel, iCloudManagerEvents)

  while (true) {
    try {
      const payload = yield* take(channel)
      yield* put(payload)
    } catch (error) {
      logger.error('ICloud backup saga channel error', {
        tags: {
          file: 'CloudBackup/saga',
          function: 'watchICloudBackupEvents',
          error: serializeError(error),
        },
      })
    }
  }
}
