import { createReducer } from '@reduxjs/toolkit'

import { FarmSummary } from './../../pages/Earn/useFarmRegistry'
import { addImportedFarm, initializeImportedFarm, removeImportedFarm } from './actions'

export interface importfarmState {
  readonly importedFarmSummaries: FarmSummary[]
}

const initialState: importfarmState = {
  importedFarmSummaries: [],
}

export default createReducer<importfarmState>(initialState, (builder) =>
  builder
    .addCase(addImportedFarm, (state, { payload: { farmSummary } }) => {
      const farm = state.importedFarmSummaries.find(
        (importedFarm) => importedFarm.stakingAddress === farmSummary.stakingAddress
      )
      const farmIndex = farm ? state.importedFarmSummaries.indexOf(farm) : -1
      const importedFarmSummaries = [...state.importedFarmSummaries]
      if (farmIndex >= 0) {
        importedFarmSummaries[farmIndex] = farmSummary
      } else {
        importedFarmSummaries.push(farmSummary)
      }
      return {
        importedFarmSummaries,
      }
    })
    .addCase(removeImportedFarm, (state, { payload: { farmAddress } }) => {
      const farm = state.importedFarmSummaries.find((importedFarm) => importedFarm.stakingAddress === farmAddress)
      const farmIndex = farm ? state.importedFarmSummaries.indexOf(farm) : -1
      const importedFarmSummaries = [...state.importedFarmSummaries]
      if (farmIndex >= 0) {
        importedFarmSummaries.splice(farmIndex, 1)
      }
      return {
        importedFarmSummaries,
      }
    })
    .addCase(initializeImportedFarm, () => {
      return {
        importedFarmSummaries: [],
      }
    })
)
