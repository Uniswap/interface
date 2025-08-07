import { PlatformSplitStubError } from 'utilities/src/errors'

export type SvgUriProps = {
  autoplay: boolean
  maxHeight?: number
  uri: string
}

/**
 * @deprecated Please use `UniversalImage` for all added cases
 *
 *  If it doesn't fit you use case, modify it to fit or consult with the universe team for help!
 */
export function WebSvgUri(_props: SvgUriProps): JSX.Element {
  throw new PlatformSplitStubError('WebSvgUri')
}
