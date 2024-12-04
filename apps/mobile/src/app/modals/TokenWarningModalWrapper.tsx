import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { closeModal } from 'src/features/modals/modalSlice'
import { selectModalState } from 'src/features/modals/selectModalState'
import { SafetyLevel } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { TokenList } from 'uniswap/src/features/dataApi/types'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import TokenWarningModal from 'uniswap/src/features/tokens/TokenWarningModal'
import { useDismissedTokenWarnings } from 'uniswap/src/features/tokens/slice/hooks'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { currencyIdToAddress, currencyIdToChain, isNativeCurrencyAddress } from 'uniswap/src/utils/currencyId'

export function TokenWarningModalWrapper(): JSX.Element | null {
  const dispatch = useDispatch()
  const { defaultChainId } = useEnabledChains()
  const modalState = useSelector(selectModalState(ModalName.TokenWarning))

  const { currencyId, onAcknowledge } = modalState.initialState ?? {}
  const currencyChainId = (currencyId && currencyIdToChain(currencyId)) || defaultChainId
  const currencyAddress = currencyId ? currencyIdToAddress(currencyId) : undefined
  const currencyInfo = useCurrencyInfo(currencyId)

  // Get the token info only if we have a valid non-native currency
  const isNativeCurrency = isNativeCurrencyAddress(currencyChainId, currencyAddress)
  const { tokenWarningDismissed } = useDismissedTokenWarnings(
    isNativeCurrency || !currencyAddress ? undefined : { chainId: currencyChainId, address: currencyAddress },
  )

  const onClose = useCallback(() => {
    dispatch(closeModal({ name: ModalName.TokenWarning }))
  }, [dispatch])

  // Return null if modal state is malformed
  if (!modalState.isOpen || !modalState.initialState) {
    return null
  }

  // If no currency info found, skip warning and proceed to SwapFlow
  if (!currencyInfo) {
    onAcknowledge?.()
    onClose()
    return null
  }

  const safetyLevel = currencyInfo.safetyLevel
  const isBlocked = safetyLevel === SafetyLevel.Blocked || currencyInfo.safetyInfo?.tokenList === TokenList.Blocked

  // If token is verified or warning was dismissed and not blocked, skip warning and proceed to SwapFlow
  if (!isBlocked && (safetyLevel === SafetyLevel.Verified || tokenWarningDismissed)) {
    onAcknowledge?.()
    onClose()
    return null
  }

  return (
    <TokenWarningModal
      isVisible={modalState.isOpen}
      currencyInfo0={currencyInfo}
      isInfoOnlyWarning={isBlocked}
      closeModalOnly={onClose}
      onAcknowledge={isBlocked ? onClose : onAcknowledge || onClose}
    />
  )
}
