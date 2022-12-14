import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { Experiment, FeatureFlag } from 'src/features/experiments/types'

export type ExperimentsMap = { [name: string]: string }
export type FeatureFlagsMap = { [name: string]: boolean }
export interface ExperimentsState {
  experiments: ExperimentsMap
  featureFlags: FeatureFlagsMap
}

export const initialExperimentsState: ExperimentsState = {
  experiments: {},
  featureFlags: {},
}

export const slice = createSlice({
  name: 'experiments',
  initialState: initialExperimentsState,
  reducers: {
    addExperimentOverride: (state, { payload: { name, variant } }: PayloadAction<Experiment>) => {
      const newExperiments = { ...state.experiments }
      newExperiments[name] = variant
      state.experiments = newExperiments
    },
    addFeatureFlagOverride: (state, { payload: { name, enabled } }: PayloadAction<FeatureFlag>) => {
      const newFeatureFlags = { ...state.featureFlags }
      newFeatureFlags[name] = enabled
      state.featureFlags = newFeatureFlags
    },
    mergeRemoteConfig: (
      state,
      {
        payload: { featureFlags, experiments },
      }: PayloadAction<{ featureFlags: FeatureFlagsMap; experiments: ExperimentsMap }>
    ) => {
      state.featureFlags = featureFlags
      state.experiments = experiments
    },
    resetFeatureFlagOverrides: (state, { payload }: PayloadAction<FeatureFlagsMap>) => {
      state.featureFlags = payload
    },
    resetExperimentOverrides: (state, { payload }: PayloadAction<ExperimentsMap>) => {
      state.experiments = payload
    },
  },
})

export const {
  addExperimentOverride,
  addFeatureFlagOverride,
  mergeRemoteConfig,
  resetFeatureFlagOverrides,
  resetExperimentOverrides,
} = slice.actions
export const { reducer: experimentsReducer } = slice
