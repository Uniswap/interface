import { createSelector } from 'reselect'
import { AppState } from '..'
import { getChainPair } from '../../utils/arbitrum'

export const applicationSelector = (state: AppState) => state.application

export const chainIdSelector = createSelector(applicationSelector, app => {
  return getChainPair(app.chainId)
})

export const accountSelector = createSelector(applicationSelector, app => {
  return app.account
})
