import { PlatformSplitStubError } from 'utilities/src/errors'

export type SvgUriProps = {
  autoplay: boolean
  maxHeight?: number
  uri: string
}

/**
 * @deprecated Please use `UniversalImage` for all added cases
 */
export function WebSvgUri(_props: SvgUriProps): JSX.Element {
  throw new PlatformSplitStubError('WebSvgUri')
}
