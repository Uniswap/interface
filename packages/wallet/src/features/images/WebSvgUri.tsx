import { NotImplementedError } from 'utilities/src/errors'

export type SvgUriProps = {
  autoplay: boolean
  maxHeight?: number
  uri: string
}

export function WebSvgUri(_props: SvgUriProps): JSX.Element {
  throw new NotImplementedError('WebSvgUri')
}
