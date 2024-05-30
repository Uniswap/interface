import { Action } from '@reduxjs/toolkit'
import { NativeEventEmitter, NativeModule, NativeModules } from 'react-native'
import { eventChannel } from 'redux-saga'
import { foundCloudBackup } from 'src/features/CloudBackup/cloudBackupSlice'
import {
  CloudStorageBackupsManagerEventType,
  CloudStorageMnemonicBackup,
} from 'src/features/CloudBackup/types'
import { call, fork, put, take } from 'typed-redux-saga'
import { logger } from 'utilities/src/logger/logger'

function createCloudStorageBackupManagerChannel(eventEmitter: NativeEventEmitter) {
  return eventChannel<Action>((emit) => {
    const foundCloudBackupHandler = (backup: CloudStorageMnemonicBackup): void => {
      logger.debug('CloudBackupSaga', 'foundCloudBackupHandler', 'Found account backup', backup)
      emit(foundCloudBackup({ backup }))
    }

    const eventEmitters = [
      {
        type: CloudStorageBackupsManagerEventType.FoundCloudBackup,
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
  yield* fork(watchCloudStorageBackupEvents)
}

export function* watchCloudStorageBackupEvents() {
  const CloudManagerEvents = new NativeEventEmitter(
    NativeModules.RNCloudStorageBackupsManager as unknown as NativeModule
  )
  const channel = yield* call(createCloudStorageBackupManagerChannel, CloudManagerEvents)

  while (true) {
    try {
      const payload = yield* take(channel)
      yield* put(payload)
    } catch (error) {
      logger.error(error, {
        tags: { file: 'CloudBackup/saga', function: 'watchCloudStorageBackupEvents' },
      })
    }
  }
}
