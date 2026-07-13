import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { navigate } from 'src/app/navigation/rootNavigation'
import { useOpenReceiveModal } from 'src/features/modals/hooks/useOpenReceiveModal'
import { openModal } from 'src/features/modals/modalSlice'
import { PortfolioEmptyState } from 'uniswap/src/components/portfolio/PortfolioEmptyState'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { usePortfolioEmptyStateBackground } from 'wallet/src/components/portfolio/empty'

export function WalletPortfolioEmptyState(): JSX.Element {
  const backgroundImageWrapperCallback = usePortfolioEmptyStateBackground()
  const disableForKorea = useFeatureFlag(FeatureFlags.DisableFiatOnRampKorea)
  const dispatch = useDispatch()
  const onPressReceive = useOpenReceiveModal()

  const onPressBuy = useCallback(() => {
    if (disableForKorea) {
      navigate(ModalName.KoreaCexTransferInfoModal)
    } else {
      dispatch(openModal({ name: ModalName.FiatOnRampAggregator }))
    }
  }, [disableForKorea, dispatch])

  const onPressImport = useCallback(() => {
    navigate(ModalName.AccountSwitcher)
  }, [])

  return (
    <PortfolioEmptyState
      backgroundImageWrapperCallback={backgroundImageWrapperCallback}
      onPressBuy={onPressBuy}
      onPressImport={onPressImport}
      onPressReceive={onPressReceive}
    />
  )
}
