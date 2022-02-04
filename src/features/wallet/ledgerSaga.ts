import type { DeviceModel } from '@ledgerhq/devices'
import TransportBLE from '@ledgerhq/react-native-hw-transport-ble'
import { Device } from 'react-native-ble-plx'
import { eventChannel } from 'redux-saga'
import {
  addHardwareDevice,
  HardwareDeviceType,
  toggleBluetooth,
} from 'src/features/wallet/walletSlice'
import { createMonitoredSaga } from 'src/utils/saga'
import { call, put, take } from 'typed-redux-saga'

enum LedgerAction {
  PoweredOn = 'PoweredOn',
  Add = 'add',
  Complete = 'complete',
  Error = 'error',
}

interface PoweredOn {
  type: LedgerAction.PoweredOn
  available: boolean
}

interface Add {
  type: LedgerAction.Add
  descriptor: Device
  deviceModel: DeviceModel
}

interface Complete {
  type: LedgerAction.Complete
}

interface LedgerError {
  type: LedgerAction.Error
  error: Error
}

type LedgerEmittedEvents = PoweredOn | Add
type LedgerEvents = LedgerEmittedEvents | Complete | LedgerError

// This is a more energy intensive function because it is actively scanning for devices
// We may want to use it here but for now located in the component
function createListenEventChannel() {
  return eventChannel<LedgerEvents>((emit) => {
    const eventHandler = (event: LedgerEmittedEvents) => {
      emit(event)
    }

    const errorHandler = (error: Error) => {
      emit({ type: LedgerAction.Error, error })
    }

    const completeHandler = () => {
      emit({ type: LedgerAction.Complete })
    }

    const subscription = TransportBLE.listen({
      next: eventHandler,
      error: errorHandler,
      complete: completeHandler,
    })

    const unsubscribe = () => {
      subscription.unsubscribe()
    }

    return unsubscribe
  })
}

// This function just observes whether bluetooth is on or off, so less expensive
function createObserveStateEventChannel() {
  return eventChannel<LedgerEvents>((emit) => {
    const eventHandler = (event: LedgerEmittedEvents) => {
      emit(event)
    }

    const errorHandler = (error: Error) => {
      emit({ type: LedgerAction.Error, error })
    }

    const completeHandler = () => {
      emit({ type: LedgerAction.Complete })
    }

    const subscription = TransportBLE.observeState({
      next: eventHandler,
      error: errorHandler,
      complete: completeHandler,
    })

    const unsubscribe = () => {
      subscription.unsubscribe()
    }

    return unsubscribe
  })
}

export function* observeBluetoothState() {
  const observeEventChannel = yield* call(createObserveStateEventChannel)
  while (true) {
    const payload = yield* take(observeEventChannel)
    const bluetoothOn = payload.type === LedgerAction.PoweredOn
    yield* put(toggleBluetooth(bluetoothOn))
  }
}

export function* listenAndAddDevice() {
  const listenEventChannel = yield* call(createListenEventChannel)
  while (true) {
    const payload = yield* take(listenEventChannel)
    if (payload.type === LedgerAction.Add) {
      const device = payload.descriptor
      put(
        addHardwareDevice({
          type: HardwareDeviceType.LEDGER,
          id: device.id,
        })
      )

      listenEventChannel.close()
      break
    }
  }
}

export enum LedgerActionTypes {
  OBSERVE = 'OBSERVE',
}

interface LedgerParams {
  type: LedgerActionTypes
}

export function* ledger({ type }: LedgerParams) {
  // call ensures there is only one happening per session
  // but we can't do anything else in the saga right now
  if (type === LedgerActionTypes.OBSERVE) {
    yield* call(observeBluetoothState)
  }
}

export const {
  name: ledgerSagaName,
  wrappedSaga: ledgerSaga,
  reducer: ledgerReducer,
  actions: ledgerActions,
} = createMonitoredSaga<LedgerParams>(ledger, 'ledger')
