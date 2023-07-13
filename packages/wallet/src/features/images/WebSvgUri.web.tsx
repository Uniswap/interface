import { RemoteSvg } from 'wallet/src/features/images/RemoteSvg'
import { SvgUriProps } from 'wallet/src/features/images/WebSvgUri'

export function WebSvgUri({ maxHeight, uri }: SvgUriProps): JSX.Element {
  // TODO: get sizing and other params accounted for
  return (
    <RemoteSvg
      borderRadius={0}
      height={maxHeight ?? 100}
      imageHttpUrl={uri}
      width={maxHeight ?? 100}
    />
  )
}
