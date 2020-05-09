import { createAction } from '@reduxjs/toolkit'
import React from 'react'

export const updateBlockNumber = createAction<{ networkId: number; blockNumber: number | null }>('updateBlockNumber')
export const toggleWalletModal = createAction<void>('toggleWalletModal')
export const toggleUserAdvanced = createAction<void>('toggleUserAdvanced')
export const addPopup = createAction<{ content: React.ReactElement }>('addPopup')
export const removePopup = createAction<{ key: string }>('removePopup')
