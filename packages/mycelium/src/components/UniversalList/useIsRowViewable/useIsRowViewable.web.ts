import { useViewability } from '@legendapp/list/react'
import { createUseIsRowViewable } from './createUseIsRowViewable'

export const useIsRowViewable = createUseIsRowViewable(useViewability)
