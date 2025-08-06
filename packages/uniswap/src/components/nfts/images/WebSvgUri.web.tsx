import { RemoteSvg } from 'uniswap/src/components/nfts/images/RemoteSvg'
import { SvgUriProps } from 'uniswap/src/components/nfts/images/WebSvgUri'

export function WebSvgUri({ maxHeight, uri }: SvgUriProps): JSX.Element {
  // TODO: get sizing and other params accounted for
  return <RemoteSvg borderRadius={0} height={maxHeight ?? 100} imageHttpUrl={uri} width={maxHeight ?? 100} />
}
