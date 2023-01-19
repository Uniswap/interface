import { createSelector } from '@reduxjs/toolkit'
import { RootState } from 'src/app/rootReducer'

// TODO: Add ESLint ignore rule here when enabling explicit return types rule
const selectExperimentsState = (state: RootState) => state.experiments

export const selectExperimentOverrides = createSelector(
  selectExperimentsState,
  (experimentState) => {
    return experimentState.experiments
  }
)

export const selectFeatureFlagOverrides = createSelector(
  selectExperimentsState,
  (experimentState) => {
    return experimentState.featureFlags
  }
)

// TODO: Add ESLint ignore rule here when enabling explicit return types rule
export const selectFeatureFlag = (flagName: string) =>
  createSelector(selectExperimentsState, (experimentState) => {
    return experimentState.featureFlags[flagName]
  })

// TODO: Add ESLint ignore rule here when enabling explicit return types rule
export const selectExperiment = (experimentName: string) =>
  createSelector(selectExperimentsState, (experimentState) => {
    return experimentState.experiments[experimentName]
  })
