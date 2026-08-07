import type { ReactElement } from 'react'
import type { UniconProps } from './types'

// Native platform split for Unicon. The web implementation renders raw <svg>,
// which React Native cannot host, so exporting it unsplit would ship web-only
// markup into the native bundle. A react-native-svg implementation can replace
// this stub when Unicon is needed on native; until then it throws, keeping the
// @universe/mycelium barrel importable on native.
export function Unicon(_props: UniconProps): ReactElement {
  throw new Error('Unicon is not implemented on native yet (web-only <svg> component)')
}
