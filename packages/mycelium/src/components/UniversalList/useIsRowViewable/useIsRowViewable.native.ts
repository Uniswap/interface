import { useViewability } from '@legendapp/list/react-native'
import { createUseIsRowViewable } from './createUseIsRowViewable'

export const useIsRowViewable = createUseIsRowViewable(useViewability)
