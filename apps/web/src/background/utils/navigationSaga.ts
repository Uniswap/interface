import { createAction } from '@reduxjs/toolkit'
import { call, takeEvery } from 'typed-redux-saga'

export enum NavigationActions {
  OpenTab = 'openTab',
}

export const openTab = createAction<{ url: string }>(`navigation/${NavigationActions.OpenTab}`)

export function* navigationSaga() {
  yield* takeEvery(openTab, openTabAction)
}

function* openTabAction({ payload: { url } }: { payload: { url: string } }) {
  const tab = yield* call(chrome.tabs.create, { url })
  return tab
}
