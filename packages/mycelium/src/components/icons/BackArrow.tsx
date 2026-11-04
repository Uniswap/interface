import type { ReactElement } from 'react'
import type { GeneratedIconProps } from '../factories/createIcon'
import { ArrowLeft } from './ArrowLeft'
import { ArrowRight } from './ArrowRight'
import { isRTL } from './rotation-platform'

export function BackArrow(props: GeneratedIconProps): ReactElement {
  return isRTL() ? <ArrowRight size={24} {...props} /> : <ArrowLeft size={24} {...props} />
}
