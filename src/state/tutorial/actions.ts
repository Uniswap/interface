import { createAction } from '@reduxjs/toolkit'

export const setShowTutorial = createAction<{ show?: boolean; step?: number }>('tutorial/setShowTutorial')
