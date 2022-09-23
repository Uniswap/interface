import { createSelector } from '@reduxjs/toolkit'
import { RootState } from 'src/app/rootReducer'

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

export const selectFeatureFlag = (flagName: string) =>
  createSelector(selectExperimentsState, (experimentState) => {
    return experimentState.featureFlags[flagName]
  })

export const selectExperiment = (experimentName: string) =>
  createSelector(selectExperimentsState, (experimentState) => {
    return experimentState.experiments[experimentName]
  })
