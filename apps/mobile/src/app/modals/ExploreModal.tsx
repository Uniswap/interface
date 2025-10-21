import { ExploreStackNavigator } from 'src/app/navigation/ExploreStackNavigator'
import { useReactNavigationModal } from 'src/components/modals/useReactNavigationModal'
import { useSporeColors } from 'ui/src'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'

/**
 * Component for the main BSM that contains the ExploreStackNavigator.
 *
 * This screen shows search, favorite tokens, wallets, and filterable top tokens.
 */
export function ExploreModal(): JSX.Element {
  const { onClose } = useReactNavigationModal()
  const colors = useSporeColors()

  return (
    <Modal
      fullScreen
      hideHandlebar
      renderBehindBottomInset
      renderBehindTopInset
      backgroundColor={colors.surface1.val}
      name={ModalName.Explore}
      onClose={onClose}
    >
      <ExploreStackNavigator />
    </Modal>
  )
}
