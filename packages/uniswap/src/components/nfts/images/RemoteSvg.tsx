import { PlatformSplitStubError } from 'utilities/src/errors'

export type RemoteSvgProps = {
  backgroundColor?: string
  borderRadius?: number
  imageHttpUrl: string | undefined
  height: number
  width: number
}

/**
 * @deprecated Please use `UniversalImage` for all added cases
 */
export const RemoteSvg = (_props: RemoteSvgProps): JSX.Element | null => {
  throw new PlatformSplitStubError('RemoteSvg')
}
