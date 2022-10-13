import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { Experiment, FeatureFlag } from 'src/features/experiments/types'

export interface ExperimentsState {
  experiments: { [name: string]: string }
  featureFlags: { [name: string]: boolean }
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
      }: PayloadAction<{ featureFlags: FeatureFlag[]; experiments: Experiment[] }>
    ) => {
      // Update values not overidden locally
      const newFeatureFlags = { ...state.featureFlags }
      featureFlags.map((item) => {
        if (newFeatureFlags[item.name]) return
        newFeatureFlags[item.name] = item.enabled
      })
      state.featureFlags = newFeatureFlags

      const newExperiments = { ...state.experiments }
      experiments.map((item) => {
        if (newExperiments[item.name]) return
        newExperiments[item.name] = item.variant
      })
      state.experiments = newExperiments
    },
    resetFeatureFlagOverrides: (state, { payload }: PayloadAction<FeatureFlag[]>) => {
      const newFeatureFlags: { [name: string]: boolean } = {}
      payload.map((item) => (newFeatureFlags[item.name] = item.enabled))
      state.featureFlags = newFeatureFlags
    },
    resetExperimentOverrides: (state, { payload }: PayloadAction<Experiment[]>) => {
      const newExperiments: { [name: string]: string } = {}
      payload.map((item) => (newExperiments[item.name] = item.variant))
      state.experiments = newExperiments
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
export const { reducer: experimentsReducer, actions: experimentsActions } = slice
