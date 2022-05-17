import { createAction } from '@reduxjs/toolkit'

import { FarmSummary } from './../../pages/Earn/useFarmRegistry'

export const addImportedFarm = createAction<{ farmSummary: FarmSummary }>('importfarm/addImportedFarm')
export const removeImportedFarm = createAction<{ farmAddress: string }>('importfarm/removeImportedFarm')
export const initializeImportedFarm = createAction('importfarm/initializeImportedFarm')
