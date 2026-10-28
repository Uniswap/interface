import type { ColorValue } from 'react-native'
import type { ModalProps } from 'uniswap/src/components/modals/ModalProps'
import { PlatformSplitStubError } from 'utilities/src/errors'

export type UseBottomInsetCoverFooterParams = Pick<
  ModalProps,
  'footerComponent' | 'renderBehindBottomInset' | 'coverBottomInsetOnAndroid'
> & {
  backgroundColor: ColorValue
}

export function useBottomInsetCoverFooter(_params: UseBottomInsetCoverFooterParams): ModalProps['footerComponent'] {
  throw new PlatformSplitStubError('useBottomInsetCoverFooter')
}
