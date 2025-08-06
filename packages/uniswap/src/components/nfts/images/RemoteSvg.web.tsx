import { UniversalImage } from 'ui/src'

type Props = {
  backgroundColor?: string
  borderRadius?: number
  imageHttpUrl: string | undefined
  height: number
  width: number
}

/**
 * @deprecated Please use `UniversalImage` for all added cases
 */
export const RemoteSvg = ({
  imageHttpUrl,
  height,
  width,
  backgroundColor,
  borderRadius,
}: Props): JSX.Element | null => {
  return (
    <UniversalImage uri={imageHttpUrl} size={{ width, height }} style={{ image: { backgroundColor, borderRadius } }} />
  )
}
