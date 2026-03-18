import { ComponentProps } from 'react'
import { LoadingBubble } from '~/components/Tokens/loading'

type DetailBubbleProps = ComponentProps<typeof LoadingBubble>

export function DetailBubble({ height = 16, width = 80, ...rest }: DetailBubbleProps): JSX.Element {
  return <LoadingBubble height={height} width={width} {...rest} />
}
