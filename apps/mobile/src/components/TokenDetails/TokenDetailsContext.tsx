import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { createContext, PropsWithChildren, useCallback, useContext, useMemo, useState } from 'react'
import { useDispatch } from 'react-redux'
import { AppStackParamList } from 'src/app/navigation/types'
import { useTokenDetailsColors } from 'src/components/TokenDetails/useTokenDetailsColors'
import { setHasViewedContractAddressExplainer } from 'uniswap/src/features/behaviorHistory/slice'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { pushNotification } from 'uniswap/src/features/notifications/slice'
import { AppNotificationType, CopyNotificationType } from 'uniswap/src/features/notifications/types'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { CurrencyField } from 'uniswap/src/types/currency'
import { MobileScreens } from 'uniswap/src/types/screens/mobile'
import { setClipboard } from 'uniswap/src/utils/clipboard'
import { currencyIdToAddress, currencyIdToChain } from 'uniswap/src/utils/currencyId'

type TokenDetailsContextState = {
  currencyId: string
  navigation: NativeStackNavigationProp<AppStackParamList, MobileScreens.TokenDetails, undefined>
  address: Address
  chainId: UniverseChainId
  currencyInfo?: CurrencyInfo
  tokenColor: string | null
  tokenColorLoading: boolean
  isChainEnabled: boolean
  activeTransactionType?: CurrencyField
  setActiveTransactionType: (activeTransactionType: CurrencyField | undefined) => void
  isTokenWarningModalOpen: boolean
  openTokenWarningModal: () => void
  closeTokenWarningModal: () => void
  isTestnetWarningModalOpen: boolean
  openTestnetWarningModal: () => void
  closeTestnetWarningModal: () => void
  isBuyNativeTokenModalOpen: boolean
  openBuyNativeTokenModal: () => void
  closeBuyNativeTokenModal: () => void
  isContractAddressExplainerModalOpen: boolean
  openContractAddressExplainerModal: () => void
  closeContractAddressExplainerModal: () => void
  copyAddressToClipboard: (address: string) => Promise<void>
  error: unknown | undefined
  setError: (error: unknown | undefined) => void
}

const TokenDetailsContext = createContext<TokenDetailsContextState | undefined>(undefined)

export function TokenDetailsContextProvider({
  children,
  currencyId,
  navigation,
}: PropsWithChildren<Pick<TokenDetailsContextState, 'currencyId' | 'navigation'>>): JSX.Element {
  const dispatch = useDispatch()

  const [error, setError] = useState<unknown>(undefined)

  const [isTokenWarningModalOpen, setIsTokenWarningModalOpen] = useState(false)
  const openTokenWarningModal = useCallback(() => setIsTokenWarningModalOpen(true), [])
  const closeTokenWarningModal = useCallback(() => setIsTokenWarningModalOpen(false), [])

  const [isTestnetWarningModalOpen, setIsTestnetWarningModalOpen] = useState(false)
  const openTestnetWarningModal = useCallback(() => setIsTestnetWarningModalOpen(true), [])
  const closeTestnetWarningModal = useCallback(() => setIsTestnetWarningModalOpen(false), [])

  const [isBuyNativeTokenModalOpen, setIsBuyNativeTokenModalOpen] = useState(false)
  const openBuyNativeTokenModal = useCallback(() => setIsBuyNativeTokenModalOpen(true), [])
  const closeBuyNativeTokenModal = useCallback(() => setIsBuyNativeTokenModalOpen(false), [])

  const [isContractAddressExplainerModalOpen, setIsContractAddressExplainerModalOpen] = useState(false)
  const openContractAddressExplainerModal = useCallback(() => setIsContractAddressExplainerModalOpen(true), [])
  const closeContractAddressExplainerModal = useCallback(() => {
    dispatch(setHasViewedContractAddressExplainer(true))
    setIsContractAddressExplainerModalOpen(false)
  }, [dispatch])

  const copyAddressToClipboard = useCallback(
    async (address: string): Promise<void> => {
      await setClipboard(address)
      dispatch(
        pushNotification({
          type: AppNotificationType.Copied,
          copyType: CopyNotificationType.ContractAddress,
        }),
      )
    },
    [dispatch],
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
      tokenColor,
      tokenColorLoading,
      isChainEnabled,
      activeTransactionType,
      setActiveTransactionType,
      isTokenWarningModalOpen,
      openTokenWarningModal,
      closeTokenWarningModal,
      isTestnetWarningModalOpen,
      openTestnetWarningModal,
      closeTestnetWarningModal,
      isBuyNativeTokenModalOpen,
      openBuyNativeTokenModal,
      closeBuyNativeTokenModal,
      isContractAddressExplainerModalOpen,
      openContractAddressExplainerModal,
      closeContractAddressExplainerModal,
      copyAddressToClipboard,
      error,
      setError,
    }
  }, [
    activeTransactionType,
    closeBuyNativeTokenModal,
    closeTestnetWarningModal,
    closeTokenWarningModal,
    closeContractAddressExplainerModal,
    currencyId,
    currencyInfo,
    enabledChains,
    error,
    isBuyNativeTokenModalOpen,
    isContractAddressExplainerModalOpen,
    isTestnetWarningModalOpen,
    isTokenWarningModalOpen,
    navigation,
    openBuyNativeTokenModal,
    openContractAddressExplainerModal,
    openTestnetWarningModal,
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
