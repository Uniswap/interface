import { LayoutAnimationOptions } from 'ui/src/animations/layout/types'
import { NotImplementedError } from 'utilities/src/errors'

export function easeInEaseOutLayoutAnimation(_options?: LayoutAnimationOptions): void {
  throw new NotImplementedError('easeInEaseOutLayoutAnimation')
}
