import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { SharedEventName } from '@uniswap/analytics-events'
import { createContext, PropsWithChildren, useCallback, useContext, useMemo, useState } from 'react'
import { useDispatch } from 'react-redux'
import { AppStackParamList } from 'src/app/navigation/types'
import { useTokenDetailsColors } from 'src/components/TokenDetails/useTokenDetailsColors'
import { setHasViewedContractAddressExplainer } from 'uniswap/src/features/behaviorHistory/slice'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { pushNotification } from 'uniswap/src/features/notifications/slice/slice'
import { AppNotificationType, CopyNotificationType } from 'uniswap/src/features/notifications/slice/types'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { CurrencyField } from 'uniswap/src/types/currency'
import { MobileScreens } from 'uniswap/src/types/screens/mobile'
import { currencyIdToAddress, currencyIdToChain } from 'uniswap/src/utils/currencyId'
import { setClipboard } from 'utilities/src/clipboard/clipboard'
import { useBooleanState } from 'utilities/src/react/useBooleanState'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'

type TokenDetailsContextState = {
  currencyId: string
  navigation: NativeStackNavigationProp<AppStackParamList, MobileScreens.TokenDetails, undefined>
  address: Address
  chainId: UniverseChainId
  currencyInfo?: CurrencyInfo
  initialIsMultichainAsset: boolean
  tokenColor: string | null
  tokenColorLoading: boolean
  isChainEnabled: boolean
  activeTransactionType?: CurrencyField
  setActiveTransactionType: (activeTransactionType: CurrencyField | undefined) => void
  isTokenWarningModalOpen: boolean
  openTokenWarningModal: () => void
  closeTokenWarningModal: () => void
  isContractAddressExplainerModalOpen: boolean
  openContractAddressExplainerModal: () => void
  closeContractAddressExplainerModal: (markViewed: boolean) => void
  isMultichainAddressSheetOpen: boolean
  openMultichainAddressSheet: () => void
  closeMultichainAddressSheet: () => void
  copyAddressToClipboard: (address: string) => Promise<void>
  error: unknown | undefined
  setError: (error: unknown | undefined) => void
}

const TokenDetailsContext = createContext<TokenDetailsContextState | undefined>(undefined)

export function TokenDetailsContextProvider({
  children,
  currencyId,
  navigation,
  initialIsMultichainAsset = false,
}: PropsWithChildren<
  Pick<TokenDetailsContextState, 'currencyId' | 'navigation'> & { initialIsMultichainAsset?: boolean }
>): JSX.Element {
  const dispatch = useDispatch()
  const trace = useTrace()

  const [error, setError] = useState<unknown>(undefined)

  const [isTokenWarningModalOpen, setIsTokenWarningModalOpen] = useState(false)
  const openTokenWarningModal = useCallback(() => setIsTokenWarningModalOpen(true), [])
  const closeTokenWarningModal = useCallback(() => setIsTokenWarningModalOpen(false), [])

  const [isContractAddressExplainerModalOpen, setIsContractAddressExplainerModalOpen] = useState(false)
  const openContractAddressExplainerModal = useCallback(() => setIsContractAddressExplainerModalOpen(true), [])

  const {
    value: isMultichainAddressSheetOpen,
    setTrue: openMultichainAddressSheet,
    setFalse: closeMultichainAddressSheet,
  } = useBooleanState(false)

  const closeContractAddressExplainerModal = useCallback(
    (markViewed: boolean) => {
      if (markViewed) {
        dispatch(setHasViewedContractAddressExplainer(true))
      }
      setIsContractAddressExplainerModalOpen(false)
    },
    [dispatch],
  )

  const copyAddressToClipboard = useCallback(
    async (address: string): Promise<void> => {
      await setClipboard(address)
      dispatch(
        pushNotification({
          type: AppNotificationType.Copied,
          copyType: CopyNotificationType.ContractAddress,
        }),
      )
      const copiedChainId = currencyIdToChain(currencyId)
      if (copiedChainId) {
        sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, {
          ...trace,
          element: ElementName.CopyAddress,
          chain_name: getChainInfo(copiedChainId).urlParam,
        })
      }
    },
    [currencyId, dispatch, trace],
  )

  // Set if attempting to buy or sell, used for token warning modal.
  const [activeTransactionType, setActiveTransactionType] = useState<CurrencyField | undefined>(undefined)

  const currencyInfo = useCurrencyInfo(currencyId) ?? undefined

  const { tokenColor, tokenColorLoading } = useTokenDetailsColors({ currencyId })

  const { chains: enabledChains } = useEnabledChains()

  const state = useMemo<TokenDetailsContextState>((): TokenDetailsContextState => {
    const chainId = currencyIdToChain(currencyId)
    const address = currencyIdToAddress(currencyId)

    if (!chainId) {
      throw new Error(`Unable to find chainId for currencyId: ${currencyId}`)
    }

    const isChainEnabled = !!enabledChains.find((_chainId) => _chainId === chainId)

    return {
      currencyId,
      navigation,
      address,
      chainId,
      currencyInfo,
      initialIsMultichainAsset,
      tokenColor,
      tokenColorLoading,
      isChainEnabled,
      activeTransactionType,
      setActiveTransactionType,
      isTokenWarningModalOpen,
      openTokenWarningModal,
      closeTokenWarningModal,
      isContractAddressExplainerModalOpen,
      openContractAddressExplainerModal,
      closeContractAddressExplainerModal,
      isMultichainAddressSheetOpen,
      openMultichainAddressSheet,
      closeMultichainAddressSheet,
      copyAddressToClipboard,
      error,
      setError,
    }
  }, [
    activeTransactionType,
    closeTokenWarningModal,
    closeContractAddressExplainerModal,
    closeMultichainAddressSheet,
    currencyId,
    currencyInfo,
    enabledChains,
    error,
    initialIsMultichainAsset,
    isContractAddressExplainerModalOpen,
    isMultichainAddressSheetOpen,
    isTokenWarningModalOpen,
    navigation,
    openContractAddressExplainerModal,
    openMultichainAddressSheet,
    openTokenWarningModal,
    tokenColor,
    tokenColorLoading,
    copyAddressToClipboard,
  ])

  return <TokenDetailsContext.Provider value={state}>{children}</TokenDetailsContext.Provider>
}

export const useTokenDetailsContext = (): TokenDetailsContextState => {
  const context = useContext(TokenDetailsContext)

  if (context === undefined) {
    throw new Error('`useTokenDetailsContext` must be used inside of `TokenDetailsContextProvider`')
  }

  return context
}
