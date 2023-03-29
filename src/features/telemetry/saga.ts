import { CallEffect } from 'redux-saga/effects'
import { initAnalytics } from 'src/features/telemetry'
import { call } from 'typed-redux-saga'

export function* telemetrySaga(): Generator<CallEffect<void>, void, unknown> {
  yield* call(initAnalytics)
}
