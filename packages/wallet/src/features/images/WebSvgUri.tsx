import { NotImplementedError } from 'wallet/src/utils/errors'

export type SvgUriProps = {
  autoplay: boolean
  maxHeight?: number
  uri: string
}

export function WebSvgUri(_props: SvgUriProps): JSX.Element {
  throw new NotImplementedError('WebSvgUri')
}
