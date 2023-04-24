import { Action } from '@reduxjs/toolkit'
import { NativeEventEmitter, NativeModules } from 'react-native'
import { EventChannel, eventChannel } from 'redux-saga'
import { CallEffect, ChannelTakeEffect, ForkEffect, PutEffect } from 'redux-saga/effects'
import { foundCloudBackup } from 'src/features/CloudBackup/cloudBackupSlice'
import { ICloudBackupsManagerEventType, ICloudMnemonicBackup } from 'src/features/CloudBackup/types'
import { logger } from 'src/utils/logger'
import { call, fork, put, take } from 'typed-redux-saga'

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

export function* cloudBackupsManagerSaga(): Generator<ForkEffect<void>, void, unknown> {
  yield* fork(watchICloudBackupEvents)
}

export function* watchICloudBackupEvents(): Generator<
  | CallEffect<EventChannel<Action<unknown>>>
  | ChannelTakeEffect<Action<unknown>>
  | PutEffect<Action<unknown>>,
  void,
  unknown
> {
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
