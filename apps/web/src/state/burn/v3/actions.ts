import { createAction } from '@reduxjs/toolkit'

export const selectPercent = createAction<{ percent: number }>('burnV3/selectBurnPercent')
