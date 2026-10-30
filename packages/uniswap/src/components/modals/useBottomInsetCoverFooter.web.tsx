import type { ModalProps } from 'uniswap/src/components/modals/ModalProps'
import type { UseBottomInsetCoverFooterParams } from 'uniswap/src/components/modals/useBottomInsetCoverFooter'

export function useBottomInsetCoverFooter({
  footerComponent,
}: UseBottomInsetCoverFooterParams): ModalProps['footerComponent'] {
  return footerComponent
}
