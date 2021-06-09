import { createAction } from '@reduxjs/toolkit'
import { BigNumber } from 'ethers'

export const newEstimate = createAction<{ fast: string }>('newEstimate')
