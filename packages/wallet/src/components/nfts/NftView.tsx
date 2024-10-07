import { PlatformSplitStubError } from 'utilities/src/errors'
import { NftViewProps } from 'wallet/src/components/nfts/NftViewProps'

export function NftView(_props: NftViewProps): JSX.Element {
  throw new PlatformSplitStubError('NftView')
}
