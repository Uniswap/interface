import { PlatformSplitStubError } from 'utilities/src/errors'

export type YouReceiveDetailsProps = {
  isIndicative: boolean
  isLoading: boolean
  isLoadingIndicative: boolean
  isBridge: boolean
}

export const YouReceiveDetails = (_props: YouReceiveDetailsProps): null => {
  throw new PlatformSplitStubError('YouReceiveDetails')
}
