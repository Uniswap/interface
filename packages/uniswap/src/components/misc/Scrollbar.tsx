import type { FlexProps } from 'ui/src'
import type { SharedValue } from 'ui/src/animations'

export type ScrollbarProps = FlexProps & {
  visibleHeight: number
  contentHeight: number
  scrollOffset: SharedValue<number>
}

export function Scrollbar(_props: ScrollbarProps): JSX.Element {
  throw new Error('Scrollbar: Implemented in .native.tsx and .web.tsx')
}
